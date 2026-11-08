// network.js - Serverless Peer-to-Peer Multiplayer via PeerJS
let peer = null;
let activeConn = null;
let remoteMesh = null;
let sceneRef = null;
let targetPos = { x: 0, y: 0, z: 0, rotY: 0 };
let localTransform = { x: 0, y: 0, z: 0, rotY: 0 };

/**
 * Initializes the networking module, attaching UI and Three.js scene reference.
 * @param {THREE.Scene} scene 
 */
export function initNetwork(scene) {
  sceneRef = scene || window.scene;
  createUI();

  // 20 ticks/sec network sync loop
  setInterval(() => {
    if (activeConn && activeConn.open) {
      activeConn.send({
        type: 'transform',
        ...localTransform,
      });
    }
  }, 50);
}

/**
 * Update hook to call inside your existing requestAnimationFrame game loop for smooth lerp.
 */
export function updateNetwork() {
  if (remoteMesh) {
    remoteMesh.position.x += (targetPos.x - remoteMesh.position.x) * 0.2;
    remoteMesh.position.y += (targetPos.y - remoteMesh.position.y) * 0.2;
    remoteMesh.position.z += (targetPos.z - remoteMesh.position.z) * 0.2;
    remoteMesh.rotation.y += (targetPos.rotY - remoteMesh.rotation.y) * 0.2;
  }
}

/**
 * Feed local player position & rotation into network.
 */
export function sendPlayerTransform(x, y, z, rotY = 0) {
  localTransform.x = x;
  localTransform.y = y;
  localTransform.z = z;
  localTransform.rotY = rotY;
}

function spawnRemoteMesh() {
  if (!sceneRef || remoteMesh) return;
  const THREE = window.THREE;
  if (!THREE) return;

  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.4, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.7;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.6;
  group.add(head);

  // Visor
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
    remoteMesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        child.material?.dispose();
      }
    });
    remoteMesh = null;
  }
}

function setupConnection(conn) {
  activeConn = conn;

  conn.on('open', () => {
    updateStatus(`Connected to Peer!`, '#22c55e');
    spawnRemoteMesh();
  });

  conn.on('data', (data) => {
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
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 12px;
    font-family: sans-serif;
    font-size: 12px;
    color: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  `;

  container.innerHTML = `
    <div style="font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
      <span>🌐 P2P MULTIPLAYER</span>
      <span id="p2p-status" style="font-size: 10px; color: #94a3b8;">DISCONNECTED</span>
    </div>

    <div style="display: flex; gap: 6px;">
      <button id="p2p-host-btn" style="flex: 1; padding: 6px 10px; background: #3b82f6; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer;">Host Game</button>
      <div id="p2p-room-code" style="display: none; padding: 6px 10px; background: rgba(0,0,0,0.4); border-radius: 6px; font-family: monospace; font-weight: bold; color: #f59e0b; border: 1px solid rgba(245,158,11,0.4);">---</div>
    </div>

    <div style="display: flex; gap: 6px;">
      <input id="p2p-join-input" type="text" placeholder="Enter Room ID" style="width: 110px; padding: 6px 8px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 11px;" />
      <button id="p2p-join-btn" style="padding: 6px 12px; background: #10b981; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer;">Join</button>
    </div>
  `;

  document.body.appendChild(container);

  const hostBtn = document.getElementById('p2p-host-btn');
  const roomDisplay = document.getElementById('p2p-room-code');
  const joinBtn = document.getElementById('p2p-join-btn');
  const joinInput = document.getElementById('p2p-join-input');

  hostBtn.onclick = () => {
    // Generate a readable 5-digit room ID
    const shortId = 'room-' + Math.floor(1000 + Math.random() * 9000);
    peer = new window.Peer(shortId);

    peer.on('open', (id) => {
      hostBtn.style.display = 'none';
      roomDisplay.style.display = 'block';
      roomDisplay.textContent = `ID: ${id}`;
      updateStatus(`Hosting (${id})`, '#38bdf8');
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      updateStatus(`Error: ${err.type}`, '#ef4444');
    });
  };

  joinBtn.onclick = () => {
    const roomId = joinInput.value.trim();
    if (!roomId) return;

    peer = new window.Peer();
    peer.on('open', () => {
      const conn = peer.connect(roomId);
      setupConnection(conn);
      updateStatus(`Connecting to ${roomId}...`, '#f59e0b');
    });

    peer.on('error', (err) => {
      updateStatus(`Error: ${err.type}`, '#ef4444');
    });
  };
}

function updateStatus(text, color = '#94a3b8') {
  const el = document.getElementById('p2p-status');
  if (el) {
    el.textContent = text;
    el.style.color = color;
  }
}

// Global exposure for non-module script tag usage
if (typeof window !== 'undefined') {
  window.initNetwork = initNetwork;
  window.updateNetwork = updateNetwork;
  window.sendPlayerTransform = sendPlayerTransform;
}
