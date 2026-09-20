import test from 'node:test';
import assert from 'node:assert/strict';
import { processBotStormDamage } from '../src/game/fortniteEngineBotAI.ts';
import { BotPlayer } from '../src/types.ts';

test('processBotStormDamage - bot safe inside storm eye takes no damage', () => {
  const dummyBot: BotPlayer = {
    id: 'bot_test_1',
    name: 'JonesyBot',
    x: 10,
    y: 0,
    z: 10,
    vx: 0,
    vz: 0,
    vy: 0,
    rotY: 0,
    health: 100,
    shield: 50,
    team: 'Alpha',
    isAlive: true,
    isGrounded: true,
    weapon: 'SCAR',
    state: 'idle',
    lastShotTime: 0,
    reactionTimer: 1.0,
    accuracy: 0.5,
  };

  const dummyEngine: any = {
    storm: {
      currentCenterX: 0,
      currentCenterZ: 0,
      currentRadius: 100, // Safe radius is 100
      dps: 5.0,
    },
    botNameTags: new Map(),
    botMeshes: new Map(),
    callbacks: {
      onElimination: () => {},
      onPlayersLeftChange: () => {},
    },
    spawnDroppedSupplies: () => {},
    triggerVictoryRoyale: () => {},
    bots: [dummyBot],
    playerTeam: 'Alpha',
  };

  const eliminated = processBotStormDamage(dummyBot, dummyEngine, 1.0);
  assert.equal(eliminated, false);
  assert.equal(dummyBot.health, 100);
  assert.equal(dummyBot.isAlive, true);
});

test('processBotStormDamage - bot outside storm eye takes storm damage and steers to center', () => {
  const dummyBot: BotPlayer = {
    id: 'bot_test_2',
    name: 'StormChaserBot',
    x: 150, // Far outside radius of 50
    y: 0,
    z: 0,
    vx: 0,
    vz: 0,
    vy: 0,
    rotY: 0,
    health: 50,
    shield: 50,
    team: 'Beta',
    isAlive: true,
    isGrounded: true,
    weapon: 'Pump',
    state: 'combat',
    lastShotTime: 0,
    reactionTimer: 1.0,
    accuracy: 0.5,
  };

  const dummyEngine: any = {
    storm: {
      currentCenterX: 0,
      currentCenterZ: 0,
      currentRadius: 50,
      dps: 10.0,
    },
    botNameTags: new Map(),
    botMeshes: new Map(),
    callbacks: {
      onElimination: () => {},
      onPlayersLeftChange: () => {},
    },
    spawnDroppedSupplies: () => {},
    triggerVictoryRoyale: () => {},
    bots: [dummyBot],
    playerTeam: 'Alpha',
  };

  const dt = 1.0;
  const eliminated = processBotStormDamage(dummyBot, dummyEngine, dt);

  // Storm damage = (10 + 2) * 1.0 = 12
  assert.equal(eliminated, false);
  assert.equal(dummyBot.health, 38);
  assert.equal(dummyBot.isAlive, true);
  // Velocity must point toward center (negative X)
  assert.ok(dummyBot.vx < 0, 'Bot should steer toward center in X axis');
});

test('processBotStormDamage - bot health reaching zero triggers elimination', () => {
  const dummyBot: BotPlayer = {
    id: 'bot_test_3',
    name: 'LowHpBot',
    x: 200,
    y: 0,
    z: 200,
    vx: 0,
    vz: 0,
    vy: 0,
    rotY: 0,
    health: 5, // Will die on 12 damage tick
    shield: 0,
    team: 'Beta',
    isAlive: true,
    isGrounded: true,
    weapon: 'Pistol',
    state: 'idle',
    lastShotTime: 0,
    reactionTimer: 1.0,
    accuracy: 0.5,
  };

  let eliminationLogged = false;
  const dummyEngine: any = {
    storm: {
      currentCenterX: 0,
      currentCenterZ: 0,
      currentRadius: 50,
      dps: 10.0,
    },
    botNameTags: new Map(),
    botMeshes: new Map(),
    scene: {
      remove: () => {},
    },
    callbacks: {
      onElimination: (log: any) => {
        eliminationLogged = true;
        assert.equal(log.killer, 'The Storm ⚡');
        assert.equal(log.victim, 'LowHpBot');
      },
      onPlayersLeftChange: () => {},
    },
    spawnDroppedSupplies: () => {},
    triggerVictoryRoyale: () => {},
    bots: [dummyBot],
    playerTeam: 'Alpha',
  };

  const eliminated = processBotStormDamage(dummyBot, dummyEngine, 1.0);
  assert.equal(eliminated, true);
  assert.equal(dummyBot.isAlive, false);
  assert.equal(eliminationLogged, true);
});
