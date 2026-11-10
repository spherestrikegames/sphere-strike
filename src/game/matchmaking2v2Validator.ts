import { TeamType, BuildingPiece } from '../types';

export interface AuthoritativePlayer {
  id: string;
  name: string;
  skinId: string;
  level: number;
  team: TeamType;
  isReady: boolean;
  health: number;
  shield: number;
  isAlive: boolean;
  eliminations: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
  lastUpdateMs: number;
}

export interface Authoritative2v2Room {
  code: string;
  mode: '2v2' | 'battle_royale' | 'custom';
  maxPlayers: number;
  hostId: string;
  gameState: 'lobby' | 'countdown' | 'playing' | 'finished';
  seed: number;
  countdownSeconds: number;
  winningTeam: TeamType | null;
  players: Map<string, AuthoritativePlayer>;
  builds: Map<string, BuildingPiece>;
}

/**
 * Assigns a joining player to the team with fewer players ('ALPHA' vs 'OMEGA', max 2 per team in 2v2)
 */
export function assignBalancedTeam(room: Authoritative2v2Room, preferredTeam?: TeamType): TeamType {
  let alphaCount = 0;
  let omegaCount = 0;
  for (const p of room.players.values()) {
    if (p.team === 'ALPHA') alphaCount++;
    else omegaCount++;
  }

  const maxPerTeam = Math.ceil(room.maxPlayers / 2);
  if (preferredTeam === 'ALPHA' && alphaCount < maxPerTeam) return 'ALPHA';
  if (preferredTeam === 'OMEGA' && omegaCount < maxPerTeam) return 'OMEGA';

  return alphaCount <= omegaCount ? 'ALPHA' : 'OMEGA';
}

/**
 * Spawn coordinates for Team ALPHA (West) and Team OMEGA (East)
 */
export function getTeamSpawnPosition(team: TeamType, slotIndex: number): { x: number; y: number; z: number } {
  const offsetZ = slotIndex % 2 === 0 ? -4 : 4;
  if (team === 'ALPHA') {
    return { x: -24, y: 1.0, z: offsetZ };
  }
  return { x: 24, y: 1.0, z: offsetZ };
}

/**
 * Validates and clamps incoming player transform to prevent out-of-bounds or NaN spoofing
 */
export function validatePlayerTransform(
  transform: any,
  maxWorldBound: number = 415
): { x: number; y: number; z: number; rotY: number; valid: boolean } {
  if (!transform || typeof transform !== 'object') {
    return { x: 0, y: 0, z: 0, rotY: 0, valid: false };
  }
  const rawX = Number(transform.x);
  const rawY = Number(transform.y);
  const rawZ = Number(transform.z);
  const rawRotY = Number(transform.rotY ?? 0);

  if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !Number.isFinite(rawZ)) {
    return { x: 0, y: 0, z: 0, rotY: 0, valid: false };
  }

  return {
    x: Math.max(-maxWorldBound, Math.min(maxWorldBound, rawX)),
    y: Math.max(-25, Math.min(350, rawY)),
    z: Math.max(-maxWorldBound, Math.min(maxWorldBound, rawZ)),
    rotY: Number.isFinite(rawRotY) ? rawRotY : 0,
    valid: true,
  };
}

/**
 * Authoritatively processes a damage event between attacker and target in a room.
 * Rejects friendly fire on the same team in 2v2 mode, clamps max single-hit damage,
 * updates shield & health, and detects team elimination victory.
 */
export function processAuthoritativeDamage(
  room: Authoritative2v2Room,
  attackerId: string,
  targetId: string,
  rawDamage: number,
  isHeadshot: boolean = false,
  weaponName: string = 'Rifle'
): {
  accepted: boolean;
  reason?: string;
  appliedDamage: number;
  targetHealth: number;
  targetShield: number;
  eliminated: boolean;
  winningTeam: TeamType | null;
} {
  const attacker = room.players.get(attackerId);
  const target = room.players.get(targetId);

  if (!attacker || !target) {
    return {
      accepted: false,
      reason: 'missing_player',
      appliedDamage: 0,
      targetHealth: target?.health ?? 0,
      targetShield: target?.shield ?? 0,
      eliminated: false,
      winningTeam: null,
    };
  }

  if (!attacker.isAlive || !target.isAlive) {
    return {
      accepted: false,
      reason: 'player_not_alive',
      appliedDamage: 0,
      targetHealth: target.health,
      targetShield: target.shield,
      eliminated: false,
      winningTeam: null,
    };
  }

  // Prevent friendly fire in 2v2 team matches
  if (room.mode === '2v2' && attacker.team === target.team && attackerId !== targetId) {
    return {
      accepted: false,
      reason: 'friendly_fire_blocked',
      appliedDamage: 0,
      targetHealth: target.health,
      targetShield: target.shield,
      eliminated: false,
      winningTeam: null,
    };
  }

  // Clamp damage to realistic weapon maximums (anti-cheat)
  const clampedDamage = Math.max(1, Math.min(250, Math.round(Number(rawDamage) || 0)));
  let remaining = clampedDamage;

  if (target.shield > 0) {
    const shieldAbsorb = Math.min(target.shield, remaining);
    target.shield -= shieldAbsorb;
    remaining -= shieldAbsorb;
  }

  if (remaining > 0) {
    target.health = Math.max(0, target.health - remaining);
  }

  let eliminated = false;
  if (target.health <= 0) {
    target.health = 0;
    target.isAlive = false;
    eliminated = true;
    attacker.eliminations += 1;

    // Check if an entire team has been eliminated
    let alphaAlive = 0;
    let omegaAlive = 0;
    for (const p of room.players.values()) {
      if (p.isAlive) {
        if (p.team === 'ALPHA') alphaAlive++;
        else omegaAlive++;
      }
    }

    if (room.players.size >= 2) {
      if (alphaAlive === 0 && omegaAlive > 0) {
        room.winningTeam = 'OMEGA';
        room.gameState = 'finished';
      } else if (omegaAlive === 0 && alphaAlive > 0) {
        room.winningTeam = 'ALPHA';
        room.gameState = 'finished';
      }
    }
  }

  return {
    accepted: true,
    appliedDamage: clampedDamage,
    targetHealth: target.health,
    targetShield: target.shield,
    eliminated,
    winningTeam: room.winningTeam,
  };
}

/**
 * Validates a building piece placement request
 */
export function validateBuildingPlacement(
  room: Authoritative2v2Room,
  playerId: string,
  piece: BuildingPiece,
  maxWorldBound: number = 415
): { accepted: boolean; reason?: string } {
  if (!piece || typeof piece !== 'object') {
    return { accepted: false, reason: 'invalid_piece' };
  }
  if (
    !Number.isFinite(piece.x) ||
    !Number.isFinite(piece.y) ||
    !Number.isFinite(piece.z) ||
    Math.abs(piece.x) > maxWorldBound ||
    Math.abs(piece.z) > maxWorldBound
  ) {
    return { accepted: false, reason: 'out_of_bounds' };
  }

  // Prevent duplicate overlap in room builds
  for (const existing of room.builds.values()) {
    if (
      existing.type === piece.type &&
      Math.abs(existing.x - piece.x) < 0.25 &&
      Math.abs(existing.y - piece.y) < 0.25 &&
      Math.abs(existing.z - piece.z) < 0.25
    ) {
      return { accepted: false, reason: 'duplicate_cell' };
    }
  }

  room.builds.set(piece.id, { ...piece, ownerId: playerId });
  return { accepted: true };
}
