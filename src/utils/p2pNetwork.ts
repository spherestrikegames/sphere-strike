// src/utils/p2pNetwork.ts
// Serverless Peer-to-Peer Multiplayer using PeerJS CDN
import * as THREE from 'three';

let peer: any = null;
let activeConn: any = null;
let remoteMesh: THREE.Group | null = null;
let sceneRef: THREE.Scene | null = null;
const targetPos = { x: 0, y: 0, z: 0, rotY: 0 };
const localTransform = { x: 0, y: 0, z: 0, rotY: 0 };

export function initNetwork(scene: THREE.Scene) {
  sceneRef = scene || (window as any).scene;
  (window as any).THREE = THREE;
  createUI();

  // 20 ticks/sec (50ms) position sync loop
  setInterval(() => {
    if (activeConn && activeConn.open) {
      activeConn.send({
        type: 'transform',
        ...localTransform,
      });
    }
  }, 50);
}

export function updateNetwork() {
  if (remoteMesh) {
    remoteMesh.position.x += (targetPos.x - remoteMesh.position.x) * 0.2;
    remoteMesh.position.y += (targetPos.y - remoteMesh.position.y) * 0.2;
    remoteMesh.position.z += (targetPos.z - remoteMesh.position.z) * 0.2;
    remoteMesh.rotation.y += (targetPos.rotY - remoteMesh.rotation.y) * 0.2;
  }
}

export function sendPlayerTransform(x: number, y: number, z: number, rotY: number = 0) {
  localTransform.x = x;
  localTransform.y = y;
  localTransform.z = z;
  localTransform.rotY = rotY;
}

function spawnRemoteMesh() {
  if (!sceneRef || remoteMesh) return;

  const group = new THREE.Group();

  // Glossy Sphere Head / Core Mesh (MeshPhysicalMaterial)
  const sphereGeo = new THREE.SphereGeometry(0.55, 32, 32);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a84ff,
    metalness: 0.15,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.45,
    ior: 1.5,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = 1.35;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);

  // Body Base Pedestal
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.0, 24);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    metalness: 0.4,
    roughness: 0.2,
    clearcoat: 0.8,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Visor Ring
  const ringGeo = new THREE.TorusGeometry(0.58, 0.05, 16, 32);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x30d158, roughness: 0.1, metalness: 0.8 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.35;
  group.add(ring);

  sceneRef.add(group);
  remoteMesh = group;
}

function removeRemoteMesh() {
  if (remoteMesh && sceneRef) {
    sceneRef.remove(remoteMesh);
    remoteMesh.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        child.material?.dispose();
      }
    });
    remoteMesh = null;
  }
}

function setupConnection(conn: any) {
  activeConn = conn;

  conn.on('open', () => {
    updateStatus('Connected to Peer!', '#30d158');
    spawnRemoteMesh();
  });

  conn.on('data', (data: any) => {
    if (data && data.type === 'transform') {
      targetPos.x = data.x;
      targetPos.y = data.y;
      targetPos.z = data.z;
      targetPos.rotY = data.rotY;
    }
  });

  conn.on('close', () => {
    updateStatus('Peer disconnected.', '#ff453a');
    removeRemoteMesh();
    activeConn = null;
  });
}

function createUI() {
  if (document.getElementById('p2p-net-ui')) return;

  const container = document.createElement('div');
  container.id = 'p2p-net-ui';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(15, 18, 28, 0.65);
    backdrop-filter: blur(28px) saturate(190%);
    -webkit-backdrop-filter: blur(28px) saturate(190%);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: inset 0 1px 1.5px rgba(255, 255, 255, 0.5), 0 12px 36px rgba(0, 0, 0, 0.5);
    border-radius: 22px;
    padding: 12px 16px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "SF Pro Display", sans-serif;
    font-size: 12px;
    color: #fff;
  `;

  container.innerHTML = `
    <div style="font-weight: 800; font-size: 12px; display: flex; justify-content: space-between; align-items: center; gap: 14px;">
      <span style="letter-spacing: 0.5px;">🌐 P2P MULTIPLAYER</span>
      <span id="p2p-status" style="font-size: 10px; font-weight: 700; color: #94a3b8;">DISCONNECTED</span>
    </div>

    <div style="display: flex; gap: 8px; align-items: center;">
      <button id="p2p-host-btn" style="flex: 1; padding: 7px 12px; background: #0a84ff; border: none; border-radius: 12px; color: #fff; font-weight: 700; cursor: pointer; transition: all 0.2s;">Host Room</button>
      <div id="p2p-room-code" style="display: none; padding: 6px 12px; background: rgba(255,255,255,0.1); border-radius: 12px; font-family: monospace; font-weight: 800; color: #ffd60a; border: 1px solid rgba(255,214,10,0.4); letter-spacing: 2px;">---</div>
    </div>

    <div style="display: flex; gap: 6px;">
      <input id="p2p-join-input" type="text" maxlength="5" placeholder="5-CHAR CODE" style="width: 100px; padding: 6px 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: #fff; font-size: 11px; font-family: monospace; font-weight: bold; text-transform: uppercase;" />
      <button id="p2p-join-btn" style="padding: 6px 14px; background: #30d158; border: none; border-radius: 12px; color: #fff; font-weight: 700; cursor: pointer; transition: all 0.2s;">Join</button>
    </div>
  `;

  document.body.appendChild(container);

  const hostBtn = document.getElementById('p2p-host-btn') as HTMLButtonElement | null;
  const roomDisplay = document.getElementById('p2p-room-code') as HTMLDivElement | null;
  const joinBtn = document.getElementById('p2p-join-btn') as HTMLButtonElement | null;
  const joinInput = document.getElementById('p2p-join-input') as HTMLInputElement | null;

  if (hostBtn && roomDisplay) {
    hostBtn.onclick = () => {
      const PeerClass = (window as any).Peer;
      if (!PeerClass) {
        updateStatus('PeerJS not loaded', '#ff453a');
        return;
      }
      // Generate clean 5-character alphanumeric room code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const shortId = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      peer = new PeerClass(shortId);

      peer.on('open', (id: string) => {
        hostBtn.style.display = 'none';
        roomDisplay.style.display = 'block';
        roomDisplay.textContent = id;
        updateStatus(`Hosting [${id}]`, '#64d2ff');
      });

      peer.on('connection', (conn: any) => {
        setupConnection(conn);
      });

      peer.on('error', (err: any) => {
        updateStatus(`Error: ${err?.type || err}`, '#ff453a');
      });
    };
  }

  if (joinBtn && joinInput) {
    joinBtn.onclick = () => {
      const roomId = joinInput.value.trim().toUpperCase();
      if (!roomId) return;

      const PeerClass = (window as any).Peer;
      if (!PeerClass) {
        updateStatus('PeerJS not loaded', '#ff453a');
        return;
      }

      peer = new PeerClass();
      peer.on('open', () => {
        const conn = peer.connect(roomId);
        setupConnection(conn);
        updateStatus(`Connecting to ${roomId}...`, '#ffd60a');
      });

      peer.on('error', (err: any) => {
        updateStatus(`Error: ${err?.type || err}`, '#ff453a');
      });
    };
  }
}

function updateStatus(text: string, color: string = '#94a3b8') {
  const el = document.getElementById('p2p-status');
  if (el) {
    el.textContent = text;
    el.style.color = color;
  }
}

// Also expose globally
if (typeof window !== 'undefined') {
  (window as any).initNetwork = initNetwork;
  (window as any).updateNetwork = updateNetwork;
  (window as any).sendPlayerTransform = sendPlayerTransform;
}
