// peerNetwork.js - Standalone P2P Networking & Remote Player Lerp Manager
export class PeerNetwork {
  constructor(scene, createRemoteMeshFn) {
    this.scene = scene;
    this.createRemoteMesh = createRemoteMeshFn || this.defaultMeshFactory.bind(this);
    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.remotePlayers = new Map(); // peerId -> { mesh, targetPos: THREE.Vector3, targetRotY: number }
    this.localState = { id: '', x: 0, y: 0, z: 0, rotationY: 0 };
    this.broadcastTimer = null;
  }

  // 1. Host Game with 5-character Room Code
  initHost(onCodeReady) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.peer = new window.Peer(code);

    this.peer.on('open', (id) => {
      this.localState.id = id;
      this.startBroadcastLoop();
      if (onCodeReady) onCodeReady(id);
    });

    this.peer.on('connection', (conn) => this.bindConnection(conn));
    return code;
  }

  // Join Existing Room
  joinHost(roomCode, onConnected) {
    this.peer = new window.Peer();

    this.peer.on('open', (id) => {
      this.localState.id = id;
      const conn = this.peer.connect(roomCode.trim().toUpperCase());
      this.bindConnection(conn);
      conn.on('open', () => {
        this.startBroadcastLoop();
        if (onConnected) onConnected();
      });
    });
  }

  bindConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      if (data?.type === 'sync') this.onReceiveState(data);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.removeRemotePlayer(conn.peer);
    });
  }

  // 20 updates per second (50ms interval) broadcast loop
  startBroadcastLoop() {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setInterval(() => {
      if (this.connections.size === 0) return;
      const payload = { type: 'sync', ...this.localState };
      for (const conn of this.connections.values()) {
        if (conn.open) conn.send(payload);
      }
    }, 50);
  }

  // Update local transform buffer to be transmitted
  setLocalTransform(x, y, z, rotationY) {
    this.localState.x = x;
    this.localState.y = y;
    this.localState.z = z;
    this.localState.rotationY = rotationY;
  }

  onReceiveState(state) {
    let remote = this.remotePlayers.get(state.id);
    if (!remote) {
      const mesh = this.createRemoteMesh(state.id);
      mesh.position.set(state.x, state.y, state.z);
      this.scene.add(mesh);
      remote = {
        mesh,
        targetPos: new (window.THREE ? window.THREE.Vector3 : Object)(state.x, state.y, state.z),
        targetRotY: state.rotationY || 0,
      };
      this.remotePlayers.set(state.id, remote);
    }
    remote.targetPos.set(state.x, state.y, state.z);
    remote.targetRotY = state.rotationY || 0;
  }

  // 2. Smooth Lerp interpolation called inside render loop
  updateRemotePlayers(delta = 0.016) {
    const lerpFactor = Math.min(1.0, delta * 14.0);
    for (const remote of this.remotePlayers.values()) {
      remote.mesh.position.lerp(remote.targetPos, lerpFactor);
      remote.mesh.rotation.y += (remote.targetRotY - remote.mesh.rotation.y) * lerpFactor;
    }
  }

  removeRemotePlayer(id) {
    const remote = this.remotePlayers.get(id);
    if (remote) {
      this.scene.remove(remote.mesh);
      this.remotePlayers.delete(id);
    }
  }

  defaultMeshFactory() {
    const THREE = window.THREE;
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.2, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
    );
    body.position.y = 1.0;
    group.add(body);
    return group;
  }
}
