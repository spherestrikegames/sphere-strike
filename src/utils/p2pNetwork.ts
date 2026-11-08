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

  // Character Body
  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.4, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.7;
  group.add(body);

  // Character Head
  const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.6;
  group.add(head);

  // Tactical Visor
  const visorGeo = new THREE.BoxGeometry(0.35, 0.15, 0.2);
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1 });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.6, 0.22);
  group.add(visor);

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
    updateStatus('Connected to Peer!', '#22c55e');
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
    updateStatus('Peer disconnected.', '#ef4444');
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
    top: 16px;
    left: 16px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(15, 23, 42, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 12px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 12px;
    color: #fff;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  `;

  container.innerHTML = `
    <div style="font-weight: 800; font-size: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <span>🌐 P2P PEERJS</span>
      <span id="p2p-status" style="font-size: 10px; font-weight: 700; color: #94a3b8;">OFFLINE</span>
    </div>

    <div style="display: flex; gap: 6px;">
      <button id="p2p-host-btn" style="flex: 1; padding: 6px 10px; background: #2563eb; border: none; border-radius: 6px; color: #fff; font-weight: 800; cursor: pointer;">Host Game</button>
      <div id="p2p-room-code" style="display: none; padding: 6px 10px; background: rgba(0,0,0,0.5); border-radius: 6px; font-family: monospace; font-weight: bold; color: #fbbf24; border: 1px solid rgba(251,191,36,0.4);">---</div>
    </div>

    <div style="display: flex; gap: 6px;">
      <input id="p2p-join-input" type="text" placeholder="Enter Room ID" style="width: 110px; padding: 6px 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 11px; font-family: monospace;" />
      <button id="p2p-join-btn" style="padding: 6px 12px; background: #059669; border: none; border-radius: 6px; color: #fff; font-weight: 800; cursor: pointer;">Join</button>
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
        updateStatus('PeerJS not loaded', '#ef4444');
        return;
      }
      const shortId = 'room-' + Math.floor(1000 + Math.random() * 9000);
      peer = new PeerClass(shortId);

      peer.on('open', (id: string) => {
        hostBtn.style.display = 'none';
        roomDisplay.style.display = 'block';
        roomDisplay.textContent = `ID: ${id}`;
        updateStatus(`Hosting (${id})`, '#38bdf8');
      });

      peer.on('connection', (conn: any) => {
        setupConnection(conn);
      });

      peer.on('error', (err: any) => {
        updateStatus(`Error: ${err?.type || err}`, '#ef4444');
      });
    };
  }

  if (joinBtn && joinInput) {
    joinBtn.onclick = () => {
      const roomId = joinInput.value.trim();
      if (!roomId) return;

      const PeerClass = (window as any).Peer;
      if (!PeerClass) {
        updateStatus('PeerJS not loaded', '#ef4444');
        return;
      }

      peer = new PeerClass();
      peer.on('open', () => {
        const conn = peer.connect(roomId);
        setupConnection(conn);
        updateStatus(`Connecting to ${roomId}...`, '#f59e0b');
      });

      peer.on('error', (err: any) => {
        updateStatus(`Error: ${err?.type || err}`, '#ef4444');
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
