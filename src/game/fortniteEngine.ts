import * as THREE from 'three';
import {
  FortniteWeapon,
  BuildingPiece,
  LootChest,
  HarvestableObject,
  GroundItem,
  DamageNumber,
  EliminationLog,
  BotPlayer,
  StormState,
  PlayerProfile,
  BuildType,
  MaterialType,
  MatchStats,
  RemotePlayerState,
  SolidCollider,
  ScopeTargetData,
  DrivableVehicle,
  DroppedSupply,
  TeamType,
  PickupNotification,
  EliminationBannerData,
  Arena1v1State,
  BattleRoyaleDuelState,
  GameMode,
  BattlegroundMap,
  WeaponRarity,
} from '../types';
import {
  WEAPON_REGISTRY,
  DEFAULT_PICKAXE,
  BOT_NAMES,
  FORTNITE_SKINS,
  ISLAND_POIS,
  UPGRADE_BENCH_COSTS,
  RARITY_UPGRADE_ORDER,
  SHOP_CATALOG,
  RARITY_COLORS,
  getWeaponEffectiveStats,
} from '../data/fortniteData';
import {
  buildFortniteIsland,
  build1v1Arena,
  getTerrainHeight,
  getGroundSurface,
  isPointInLake,
  UpgradeBenchStation,
  SKYSCRAPER_LAUNCH_PADS,
} from './fortniteWorld';
import { createFirstPersonWeaponRig, createMuzzleFlash } from './fortniteWeapons';
import {
  createHologramPreview,
  createPlacedBuildingMesh,
  snapToBuildGrid,
  calculateRampHeightAt,
  MATERIAL_STATS,
} from './fortniteBuilding';
import {
  buildCharacterModel,
  CharacterMeshRig,
  createNameTagSprite,
  updateNameTagSprite,
} from './fortniteCharacter';
import { SpatialColliderGrid } from './spatialGrid';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';

import { setupLightingImpl, setupGliderImpl, setupStormImpl, setupPlayerRigsImpl, setupScopeVisualizerImpl, spawnBotsImpl, setupMultiplayerImpl } from './fortniteEngineSetup';
import { updatePlayersLeftCountImpl, updateDuelStateImpl, handleBattleRoyaleLocalDeathImpl, executeRespawnImpl, damageRemotePlayerImpl, handleRemotePlayerLethalImpl, applyDamageFromRemoteImpl, updateNetworkSyncImpl } from './fortniteEngineDuel';
import { attachEventListenersImpl, destroyImpl, onContextMenuImpl, onWindowResizeImpl, onKeyDownImpl, onKeyUpImpl, onMouseMoveImpl, applySettingsImpl, onMouseDownImpl, onMouseUpImpl, togglePerspectiveImpl, setActiveSlotImpl, toggleBuildModeImpl, updateWeaponRigsImpl, getCurrentWeaponImpl } from './fortniteEngineInput';
import { fireActiveWeaponImpl, ejectShellCasingImpl, startReloadImpl, startConsumableUseImpl } from './fortniteEngineWeaponControl';
import { performShotgunBlastImpl, performBulletRaycastImpl, performPickaxeHitImpl, updateScopeTrajectoryImpl } from './fortniteEngineBallistics';
import { placeBuildingPieceImpl, enterVehicleImpl, exitVehicleImpl, updateVehicleDrivingImpl } from './fortniteEngineBuild';
import { spawnDroppedSuppliesImpl, createSupply3DMeshImpl, spawnPeriodicSupplyDropImpl, updateDroppedSuppliesImpl, interactChestOrItemImpl, dropLootFromChestImpl } from './fortniteEngineLoot';
import { eliminateBotImpl, checkTeamVictoryConditionImpl, triggerVictoryRoyaleImpl, triggerEliminatedImpl } from './fortniteEngineCombatResolution';
import { resetAllBuildingsImpl, spawnArenaGroundLootImpl, updatePlayerSkinImpl, reset1v1RoundImpl, setBotDifficultyImpl, placeBotPieceImpl, upgradeEquippedWeaponImpl, attachWeaponModImpl, buyHealthPackImpl, buyMaterialsImpl } from './fortniteEngineArena';
import { loopImpl, updateInteractionPromptsImpl } from './fortniteEngineLoop';
import { getGroundElevationAtImpl, checkAndResolveSolidCollisionsImpl, updateSkydivingAndMovementImpl, updateCameraAndRigsImpl, updateStormImpl } from './fortniteEngineMovement';
import { isLineOfSightBlockedImpl, updateBotsImpl, update1v1BotImpl } from './fortniteEngineBotAI';
import { updateBuildingHologramImpl, updateShellCasingsImpl, addDamageNumberImpl, updateDamageNumbersImpl, createBulletTracerImpl, updateBulletTracersImpl, createHarvestParticleEffectImpl, updateHarvestParticlesImpl, animateHarvestImpactImpl, updateHarvestWobblesImpl, animateHarvestDestructionImpl, removeHarvestableColliderImpl } from './fortniteEngineFX';

export interface EngineCallbacks {
  onHealthChange: (hp: number, shield: number) => void;
  onMaterialsChange: (wood: number, stone: number, metal: number) => void;
  onInventoryChange: (inventory: (FortniteWeapon | null)[], activeSlot: number) => void;
  onPlayersLeftChange: (count: number) => void;
  onElimination: (log: EliminationLog) => void;
  onStormUpdate: (storm: StormState) => void;
  onHitmarker: (isHeadshot: boolean, isShield: boolean) => void;
  onDamageTaken: () => void;
  onMatchEnd: (isVictory: boolean, stats: MatchStats) => void;
  onSkydivingUpdate: (isSkydiving: boolean, isGliding: boolean, altitude: number) => void;
  onTouchdown: () => void;
  onAimingChange?: (isAiming: boolean, targetData: ScopeTargetData | null) => void;
  onVehicleChange?: (vehicle: DrivableVehicle | null) => void;
  onNearVehiclePrompt?: (prompt: string | null) => void;
  onNearSupplyPrompt?: (prompt: string | null) => void;
  onNearUpgradeBenchPrompt?: (prompt: string | null) => void;
  onOpenShop?: () => void;
  onArena1v1Update?: (state: Arena1v1State) => void;
  onDuelUpdate?: (state: BattleRoyaleDuelState) => void;
  onGoldChange?: (gold: number) => void;
  onEliminationBanner?: (data: EliminationBannerData) => void;
  onItemCollected?: (item: PickupNotification) => void;
}

interface ShellCasing {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
}

export function getBotDifficultyConfig(difficulty: 'casual' | 'normal' | 'pro' | 'god') {
  switch (difficulty) {
    case 'casual':
      return {
        name: '🟢 Casual_Trainee_🤖',
        accuracy: 0.28,
        reactionTimer: 0.75,
        strafeSpeed: 3.2,
        targetSpeed: 5.5,
        shotIntervalClose: 1.35,
        shotIntervalFar: 1.05,
        hitChanceClose: 0.30,
        hitChanceFar: 0.22,
        headshotChance: 0.08,
        dmgMultiplier: 0.55,
        jumpChance: 0.006,
      };
    case 'normal':
      return {
        name: '🟡 Arena_Rival_⚔️',
        accuracy: 0.55,
        reactionTimer: 0.38,
        strafeSpeed: 5.0,
        targetSpeed: 8.0,
        shotIntervalClose: 0.88,
        shotIntervalFar: 0.62,
        hitChanceClose: 0.58,
        hitChanceFar: 0.48,
        headshotChance: 0.20,
        dmgMultiplier: 0.80,
        jumpChance: 0.025,
      };
    case 'pro':
      return {
        name: '🟠 Pro_Sweat_99_⚡',
        accuracy: 0.78,
        reactionTimer: 0.18,
        strafeSpeed: 7.2,
        targetSpeed: 10.5,
        shotIntervalClose: 0.65,
        shotIntervalFar: 0.44,
        hitChanceClose: 0.80,
        hitChanceFar: 0.70,
        headshotChance: 0.35,
        dmgMultiplier: 1.00,
        jumpChance: 0.055,
      };
    case 'god':
    default:
      return {
        name: '🔴 👑 God_Aim_Demon',
        accuracy: 0.92,
        reactionTimer: 0.07,
        strafeSpeed: 9.6,
        targetSpeed: 13.5,
        shotIntervalClose: 0.46,
        shotIntervalFar: 0.30,
        hitChanceClose: 0.92,
        hitChanceFar: 0.86,
        headshotChance: 0.50,
        dmgMultiplier: 1.15,
        jumpChance: 0.09,
      };
  }
}

export class FortniteEngine {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public callbacks: EngineCallbacks;

  // View state & Pointer Lock
  public isFirstPerson: boolean = true;
  public isAimingDownSights: boolean = false;
  public isPointerLocked: boolean = false;

  // Skydiving / Battle Bus Drop Intro
  public isSkydiving: boolean = true;
  public isGliding: boolean = false;
  public gameStarted: boolean = false;
  public gliderMesh: THREE.Group | null = null;
  public windAudioTimer: number = 0;

  // Player state & High Tanky Health (250 HP + 250 Shield Max)
  public maxHealth: number = 250;
  public maxShield: number = 250;
  public health: number = 250;
  public shield: number = 100;
  public wood: number = 300;
  public stone: number = 150;
  public metal: number = 80;

  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 220, 0);
  public playerVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public playerRotY: number = 0;
  public playerPitch: number = 0;
  public isGrounded: boolean = false;
  public isSprinting: boolean = false;
  public isCrouching: boolean = false;
  public isSliding: boolean = false;
  public slideTimer: number = 0;

  // Teams & Social Identification
  public playerTeam: TeamType = 'ALPHA';
  public playerNameTag: THREE.Sprite | null = null;

  // Drivable Vehicles System
  public vehicles: DrivableVehicle[] = [];
  public activeVehicle: DrivableVehicle | null = null;
  public vehicleEngineSoundTimer: number = 0;

  // Dropped Supplies & Supply Drop Air-Drops
  public droppedSupplies: DroppedSupply[] = [];
  public supplyMeshes: Map<string, THREE.Group> = new Map();
  public supplyDropBoxes: {
    id: string;
    group: THREE.Group;
    x: number;
    y: number;
    z: number;
    vy: number;
    isLanded: boolean;
    tier: 'legendary_supply';
  }[] = [];
  public nextSupplyDropTimer: number = 25.0;

  // Recoil & Weapon Sway
  public recoilRecoilZ: number = 0;
  public recoilRecoilY: number = 0;
  public recoilRecoilRotX: number = 0;
  public screenShake: number = 0;

  // Inventory: 6 slots (Pickaxe + Weapons + Consumables)
  public inventory: (FortniteWeapon | null)[] = [
    { ...DEFAULT_PICKAXE },
    { ...WEAPON_REGISTRY.ar_scar },
    { ...WEAPON_REGISTRY.shotgun_pump_epic },
    { ...WEAPON_REGISTRY.sniper_bolt_legendary },
    { ...WEAPON_REGISTRY.mini_shields },
    { ...WEAPON_REGISTRY.medkit },
  ];
  public activeSlot: number = 1;

  // Building state
  public isBuildMode: boolean = false;
  public selectedBuildType: BuildType = 'wall';
  public selectedMaterial: MaterialType = 'wood';
  public hologramMesh: THREE.Mesh | null = null;
  public buildingPieces: Map<string, { piece: BuildingPiece; mesh: THREE.Mesh }> = new Map();

  // World objects & Solid Colliders
  public harvestables: HarvestableObject[] = [];
  public harvestableMeshes: Map<string, THREE.Object3D> = new Map();
  public harvestParticles: { mesh: THREE.Mesh; vel: THREE.Vector3; rotSpeed: THREE.Vector3; life: number; maxLife: number }[] = [];
  public activeHarvestWobbles: { mesh: THREE.Object3D; baseRotZ: number; baseRotX: number; elapsed: number; duration: number }[] = [];
  public chests: LootChest[] = [];
  public chestMeshes: Map<string, THREE.Group> = new Map();
  public groundItems: GroundItem[] = [];
  public groundItemMeshes: Map<string, THREE.Group> = new Map();
  public staticColliders: SolidCollider[] = [];
  public spatialGrid: SpatialColliderGrid = new SpatialColliderGrid(24.0);
  public footstepTimer: number = 0;

  // Bots / AI (Bad at playing / Potato Aim)
  public bots: BotPlayer[] = [];
  public botMeshes: Map<string, CharacterMeshRig> = new Map();
  public botNameTags: Map<string, THREE.Sprite> = new Map();

  // Remote Online Party Players
  public remotePlayers: Map<
    string,
    {
      state: RemotePlayerState;
      rig: CharacterMeshRig;
      respawnsUsed?: number;
      targetPos?: THREE.Vector3;
      targetRotY?: number;
      targetPitch?: number;
    }
  > = new Map();
  public lastNetworkSyncTime: number = 0;

  // Battle Royale Duel & Respawn Mechanics (3 respawns allowed, 4th death loses)
  public myRespawnsUsed: number = 0;
  public readonly maxRespawns: number = 3;
  public isRespawning: boolean = false;
  public respawnCountdown: number = 0;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;
  public lastDuelSyncTime: number = 0;

  // Player Visual Rigs
  public fpsRig: THREE.Group | null = null;
  public thirdPersonRig: CharacterMeshRig | null = null;

  // Storm State
  public storm: StormState = {
    currentRadius: 290,
    targetRadius: 190,
    currentCenterX: 0,
    currentCenterZ: 0,
    targetCenterX: 10,
    targetCenterZ: -10,
    phase: 1,
    maxPhases: 5,
    timeRemaining: 60,
    totalPhaseTime: 60,
    isShrinking: false,
    dps: 1,
  };
  public stormCylinderMesh: THREE.Mesh | null = null;

  // FX & Visuals
  public damageNumbers: DamageNumber[] = [];
  public damageNumberSprites: THREE.Group = new THREE.Group();
  public bulletTracers: { line: THREE.Line; life: number }[] = [];
  public shellCasings: ShellCasing[] = [];

  // Real-time Scope Trajectory & Bullet Impact Visualizer
  public scopeLaserLine: THREE.Line | null = null;
  public scopeImpactMarker: THREE.Group | null = null;
  public scopePointLight: THREE.PointLight | null = null;

  // High Performance Optimization Throttles & Cached Objects
  public lastNearCarPrompt: string | null = null;
  public lastNearSupplyPrompt: string | null = null;
  public lastStormSyncSecond: number = -1;
  public lastStormShrinkingState: boolean = false;
  public lastAltitudeSync: number = -1;
  public lastAimSyncTime: number = 0;
  public lastAimTargetName: string = '';
  public sharedRaycaster: THREE.Raycaster = new THREE.Raycaster();
  public sharedCenterVec: THREE.Vector2 = new THREE.Vector2(0, 0);

  // Match stats & Game Mode
  public mode: GameMode = 'first_person_royale';
  public gold: number = 500;
  public arena1v1State: Arena1v1State = {
    playerScore: 0,
    botScore: 0,
    round: 1,
    maxRounds: 5,
    isRoundOver: false,
    roundWinner: null,
    botDifficulty: 'pro',
    countdown: 0,
  };
  public upgradeBenches: UpgradeBenchStation[] = [];
  public resetPedestalPos: { x: number; y: number; z: number } | null = null;
  public playerSpawnPos: { x: number; y: number; z: number } = { x: 0, y: 1.2, z: -20 };
  public botSpawnPos: { x: number; y: number; z: number } = { x: 0, y: 1.2, z: 20 };
  public roundCountdownTimer: number = 0;
  public lastNearUpgradeBenchPrompt: string | null = null;

  public eliminations: number = 0;
  public damageDealt: number = 0;
  public damageTaken: number = 0;
  public structuresBuilt: number = 0;
  public chestsOpened: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public matchStartTime: number = Date.now();
  public isGameOver: boolean = false;
  public botSimCombatTimer: number = 9.0;

  // Input state
  public keys: Record<string, boolean> = {};
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  public lastShotTime: number = 0;
  public isReloading: boolean = false;
  public isUsingConsumable: boolean = false;
  public isSwingingPickaxe: boolean = false;

  // Profile & Settings
  public profile: PlayerProfile;
  public animationFrameId: number = 0;
  public lastTime: number = performance.now();
  public sunLight: THREE.DirectionalLight | null = null;
  public hemiLight: THREE.HemisphereLight | null = null;

  public getLoadedWeapon(weaponId: string): FortniteWeapon {
    const base = WEAPON_REGISTRY[weaponId] || WEAPON_REGISTRY.ar_scar;
    const tier = this.profile?.weaponTiers?.[weaponId] || 1;
    const stats = getWeaponEffectiveStats(base, tier, this.profile?.armoryPerks);

    return {
      ...base,
      damage: stats.damage,
      reloadTime: stats.reloadTime,
      magazineSize: stats.magazineSize,
      currentAmmo: stats.magazineSize,
      spread: stats.spread,
      fireRate: stats.fireRate,
    };
  }

  public selectedMap: BattlegroundMap = 'island_2v2';

  constructor(
    canvas: HTMLCanvasElement,
    profile: PlayerProfile,
    callbacks: EngineCallbacks,
    mode: GameMode = 'first_person_royale',
    initialDifficulty: 'casual' | 'normal' | 'pro' | 'god' = 'pro',
    selectedMap: BattlegroundMap = 'island_2v2'
  ) {
    this.canvas = canvas;
    this.profile = profile;
    this.callbacks = callbacks;
    this.mode = mode;
    this.selectedMap = selectedMap;
    this.isFirstPerson = mode === 'battle_royale' ? false : (profile.settings.firstPersonDefault ?? true);
    this.arena1v1State.botDifficulty = initialDifficulty;

    // Pick drop / spawn spot
    const loadout = this.profile?.loadout || {
      slot1: 'ar_scar',
      slot2: 'shotgun_pump_epic',
      slot3: 'sniper_bolt_legendary',
      slot4: 'mini_shields',
      slot5: 'medkit',
    };

    if (this.mode === '1v1_build_fight') {
      this.maxHealth = 300;
      this.maxShield = 300;
      this.health = 300;
      this.shield = 300;
      this.wood = 0;
      this.stone = 0;
      this.metal = 0;
      this.gold = 1000;
      this.playerPos.set(0, 0.1, 15);
      this.isSkydiving = false;
      this.isGliding = false;
      this.gameStarted = true;
      this.isGrounded = true;
      this.inventory = [
        { ...DEFAULT_PICKAXE },
        this.getLoadedWeapon(loadout.slot2 || 'shotgun_pump_legendary'),
        this.getLoadedWeapon(loadout.slot1 || 'ar_scar'),
        this.getLoadedWeapon(loadout.slot3 || 'smg_p90_epic'),
        this.getLoadedWeapon('sniper_bolt_legendary'),
        this.getLoadedWeapon('chug_splash'),
      ];
      this.activeSlot = 1;
    } else {
      if (this.selectedMap === 'tilted_skyscrapers') {
        // Drop straight into Tilted Towers Skyscraper Canyon
        this.playerPos.set((Math.random() - 0.5) * 40, 220, (Math.random() - 0.5) * 40);
        this.storm.currentCenterX = 0;
        this.storm.currentCenterZ = 0;
        this.storm.targetCenterX = 0;
        this.storm.targetCenterZ = 0;
      } else if (this.selectedMap === 'pleasant_valley') {
        // Drop directly above Pleasant Park Suburban Neighborhood
        this.playerPos.set(-140 + (Math.random() - 0.5) * 45, 220, -140 + (Math.random() - 0.5) * 45);
        this.storm.currentCenterX = -140;
        this.storm.currentCenterZ = -140;
        this.storm.targetCenterX = -140;
        this.storm.targetCenterZ = -140;
      } else {
        const dropPOI = ISLAND_POIS[Math.floor(Math.random() * ISLAND_POIS.length)];
        this.playerPos.set(
          dropPOI.x + (Math.random() - 0.5) * 80,
          220,
          dropPOI.z + (Math.random() - 0.5) * 80
        );
      }
      this.inventory = [
        { ...DEFAULT_PICKAXE },
        this.getLoadedWeapon(loadout.slot1 || 'ar_scar'),
        this.getLoadedWeapon(loadout.slot2 || 'shotgun_pump_epic'),
        this.getLoadedWeapon(loadout.slot3 || 'sniper_bolt_legendary'),
        this.getLoadedWeapon(loadout.slot4 || 'mini_shields'),
        this.getLoadedWeapon(loadout.slot5 || 'medkit'),
      ];
    }

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    const fogDensity =
      profile.settings.viewDistance === 'near'
        ? 0.0036
        : profile.settings.viewDistance === 'far'
        ? 0.0016
        : 0.0022;
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, fogDensity);

    this.camera = new THREE.PerspectiveCamera(
      profile.settings.fov || 75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );

    // Renderer (Optimized for silky smooth 60+ FPS across all devices)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: profile.settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      precision: profile.settings.graphicsQuality === 'low' ? 'mediump' : 'highp',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const resScale = profile.settings.resolutionScale || 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, Math.min(1.5, resScale)));
    this.renderer.shadowMap.enabled = profile.settings.shadows ?? false;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Setup World & Lighting
    this.setupLighting();

    if (this.mode === '1v1_build_fight') {
      const arena = build1v1Arena(this.scene);
      this.harvestables = arena.harvestables;
      this.harvestableMeshes = arena.harvestableMeshes;
      this.staticColliders = arena.staticColliders;
      this.spatialGrid.addAll(arena.staticColliders);
      this.upgradeBenches = arena.upgradeBenches;
      this.playerSpawnPos = arena.playerSpawnPos;
      this.botSpawnPos = arena.botSpawnPos;
      this.resetPedestalPos = arena.resetPedestalPos;
      this.playerPos.set(arena.playerSpawnPos.x, arena.playerSpawnPos.y + 0.2, arena.playerSpawnPos.z);
      this.playerRotY = 0;

      // Disable storm in 1v1 arena
      this.storm.currentRadius = 99999;
      this.storm.targetRadius = 99999;
      this.storm.isShrinking = false;
      this.storm.dps = 0;
      this.storm.timeRemaining = 99999;

      // Spawn interactable weapon pickups across the open arena floor
      this.spawnArenaGroundLoot();
      fortniteAudio.startGameMusic();
    } else {
      const island = buildFortniteIsland(this.scene);
      this.harvestables = island.harvestables;
      this.harvestableMeshes = island.harvestableMeshes;
      this.chests = island.chests;
      this.chestMeshes = island.chestMeshes;
      this.staticColliders = island.staticColliders;
      this.spatialGrid.addAll(island.staticColliders);
      this.vehicles = island.vehicles;
      this.upgradeBenches = island.upgradeBenches;
    }

    // Setup Glider 3D Model
    this.setupGlider();

    // Setup Storm Cylinder
    if (this.mode !== '1v1_build_fight') {
      this.setupStorm();
    }

    // Setup Player Rigs
    this.setupPlayerRigs();

    // Setup Scope Trajectory & Bullet Impact Visualizer
    this.setupScopeVisualizer();

    // Setup Hologram Preview for Building
    this.hologramMesh = createHologramPreview('wall');
    this.hologramMesh.visible = false;
    this.scene.add(this.hologramMesh);

    // Setup Damage Numbers
    this.scene.add(this.damageNumberSprites);

    // Spawn AI Bots (AI Knockout mode gets 24 bots, 1v1 Arena gets 1 opponent bot, Battle Royale gets 0)
    if (this.mode === 'first_person_royale') {
      this.spawnBots(24);
    } else if (this.mode === '1v1_build_fight') {
      this.spawnBots(1);
    } else {
      this.spawnBots(0);
    }

    // Attach Event Listeners
    this.attachEventListeners();

    // Setup Multiplayer Listeners
    this.setupMultiplayer();

    // Initial Callback Sync
    this.callbacks.onHealthChange(this.health, this.shield);
    this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
    this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
    this.updatePlayersLeftCount();
    this.callbacks.onStormUpdate(this.storm);
    this.callbacks.onSkydivingUpdate(this.isSkydiving, this.isGliding, Math.round(this.playerPos.y));
    this.callbacks.onGoldChange?.(this.gold);
    this.callbacks.onArena1v1Update?.(this.arena1v1State);

    // Start Simulation Loop
    this.lastTime = performance.now();
    this.loop();
  }

  public safeRequestPointerLock() {
    if (!this.canvas || document.pointerLockElement === this.canvas || this.isGameOver) return;
    try {
      const promise = (this.canvas as any).requestPointerLock?.();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // Gracefully handle gesture requirements or browser rejection
        });
      }
    } catch {
      // Gracefully handle iframe or user gesture denial
    }
  }

  public setupLighting() {
    setupLightingImpl(this);
  }
  public setupGlider() {
    setupGliderImpl(this);
  }
  public setupStorm() {
    setupStormImpl(this);
  }
  public setupPlayerRigs() {
    setupPlayerRigsImpl(this);
  }
  public setupScopeVisualizer() {
    setupScopeVisualizerImpl(this);
  }
  public spawnBots(count: number) {
    spawnBotsImpl(this, count);
  }
  public setupMultiplayer() {
    setupMultiplayerImpl(this);
  }
  public updatePlayersLeftCount() {
    updatePlayersLeftCountImpl(this);
  }
  public updateDuelState(customMessage: string | null = null) {
    updateDuelStateImpl(this, customMessage);
  }
  public handleBattleRoyaleLocalDeath(attackerName?: string, weaponName?: string, isHeadshot?: boolean) {
    handleBattleRoyaleLocalDeathImpl(this, attackerName, weaponName, isHeadshot);
  }
  public executeRespawn() {
    executeRespawnImpl(this);
  }
  public damageRemotePlayer(
    remoteId: string,
    remote: { state: RemotePlayerState; rig: CharacterMeshRig; respawnsUsed?: number },
    dmg: number,
    isHeadshot: boolean,
    wepName: string
  ) {
    damageRemotePlayerImpl(this, remoteId, remote, dmg, isHeadshot, wepName);
  }
  public handleRemotePlayerLethal(
    remoteId: string,
    remote: { state: RemotePlayerState; rig: CharacterMeshRig; respawnsUsed?: number },
    isHeadshot: boolean,
    wepName: string
  ) {
    handleRemotePlayerLethalImpl(this, remoteId, remote, isHeadshot, wepName);
  }
  public applyDamageFromRemote(dmg: number, isHeadshot: boolean, attackerName: string, weaponName: string) {
    applyDamageFromRemoteImpl(this, dmg, isHeadshot, attackerName, weaponName);
  }
  // --- CONTROLS & POINTER LOCK ---

  public attachEventListeners() {
    attachEventListenersImpl(this);
  }
  public destroy() {
    destroyImpl(this);
  }
  public onContextMenu = (e: MouseEvent) => onContextMenuImpl(this, e);
  public onWindowResize = () => onWindowResizeImpl(this);
  public onKeyDown = (e: KeyboardEvent) => onKeyDownImpl(this, e);
  public onKeyUp = (e: KeyboardEvent) => onKeyUpImpl(this, e);
  public onMouseMove = (e: MouseEvent) => onMouseMoveImpl(this, e);
  public applySettings(settings: import('../types').GameSettings) {
    applySettingsImpl(this, settings);
  }
  public onMouseDown = (e: MouseEvent) => onMouseDownImpl(this, e);
  public onMouseUp = (e: MouseEvent) => onMouseUpImpl(this, e);
  public togglePerspective() {
    togglePerspectiveImpl(this);
  }
  public setActiveSlot(slotIndex: number) {
    setActiveSlotImpl(this, slotIndex);
  }
  public toggleBuildMode(type: BuildType) {
    toggleBuildModeImpl(this, type);
  }
  public updateWeaponRigs() {
    updateWeaponRigsImpl(this);
  }
  public getCurrentWeapon(): FortniteWeapon | null {
    return getCurrentWeaponImpl(this);
  }
  // --- REALISTIC WEAPON FIRING & BALLISTICS ---

  public fireActiveWeapon() {
    fireActiveWeaponImpl(this);
  }
  public ejectShellCasing() {
    ejectShellCasingImpl(this);
  }
  public performShotgunBlast(wep: FortniteWeapon) {
    performShotgunBlastImpl(this, wep);
  }
  public performBulletRaycast(wep: FortniteWeapon) {
    performBulletRaycastImpl(this, wep);
  }
  public performPickaxeHit() {
    performPickaxeHitImpl(this);
  }
  public startReload() {
    startReloadImpl(this);
  }
  public startConsumableUse(wep: FortniteWeapon) {
    startConsumableUseImpl(this, wep);
  }
  // --- BUILDING SYSTEM ---

  public placeBuildingPiece() {
    placeBuildingPieceImpl(this);
  }
  // --- VEHICLES & DRIVING SYSTEM ---

  public enterVehicle(vehicle: DrivableVehicle) {
    enterVehicleImpl(this, vehicle);
  }
  public exitVehicle() {
    exitVehicleImpl(this);
  }
  public updateVehicleDriving(dt: number) {
    updateVehicleDrivingImpl(this, dt);
  }
  // --- DROPPED SUPPLIES & SUPPLY DROPS ---

  public spawnDroppedSupplies(x: number, y: number, z: number, weapon?: FortniteWeapon) {
    spawnDroppedSuppliesImpl(this, x, y, z, weapon);
  }
  public createSupply3DMesh(item: DroppedSupply): THREE.Group {
    return createSupply3DMeshImpl(this, item);
  }
  public spawnPeriodicSupplyDrop() {
    spawnPeriodicSupplyDropImpl(this);
  }
  public updateDroppedSupplies(dt: number) {
    updateDroppedSuppliesImpl(this, dt);
  }
  // --- CHESTS & INTERACTION ---

  public interactChestOrItem() {
    interactChestOrItemImpl(this);
  }
  public dropLootFromChest(chest: LootChest) {
    dropLootFromChestImpl(this, chest);
  }
  public eliminateBot(bot: BotPlayer, isHeadshot: boolean, weaponName: string) {
    eliminateBotImpl(this, bot, isHeadshot, weaponName);
  }
  public checkTeamVictoryCondition() {
    checkTeamVictoryConditionImpl(this);
  }
  public triggerVictoryRoyale() {
    triggerVictoryRoyaleImpl(this);
  }
  public triggerEliminated() {
    triggerEliminatedImpl(this);
  }
  // --- 1V1 ARENA RESETS & SHOP UPGRADES ---

  public resetAllBuildings() {
    resetAllBuildingsImpl(this);
  }
  public spawnArenaGroundLoot() {
    spawnArenaGroundLootImpl(this);
  }
  public updatePlayerSkin(skinId: string) {
    updatePlayerSkinImpl(this, skinId);
  }
  public reset1v1Round(winner: 'player' | 'bot') {
    reset1v1RoundImpl(this, winner);
  }
  public setBotDifficulty(difficulty: 'casual' | 'normal' | 'pro' | 'god') {
    setBotDifficultyImpl(this, difficulty);
  }
  public placeBotPiece(bot: BotPlayer, type: BuildType, material: MaterialType = 'wood') {
    placeBotPieceImpl(this, bot, type, material);
  }
  public upgradeEquippedWeapon(slotIndex: number): boolean {
    return upgradeEquippedWeaponImpl(this, slotIndex);
  }
  public attachWeaponMod(slotIndex: number, modId: string): boolean {
    return attachWeaponModImpl(this, slotIndex, modId);
  }
  public buyHealthPack(item: any): boolean {
    return buyHealthPackImpl(this, item);
  }
  public buyMaterials(type: 'wood' | 'stone' | 'metal', amount: number, cost: number): boolean {
    return buyMaterialsImpl(this, type, amount, cost);
  }
  // --- MAIN SIMULATION LOOP ---

  public loop = () => loopImpl(this);
  public updateInteractionPrompts() {
    updateInteractionPromptsImpl(this);
  }
  // --- FAST RESPONSIVE MOVEMENT & SOLID COLLISION (SPATIAL GRID OPTIMIZED) ---

  public getGroundElevationAt(x: number, z: number, currentY: number): number {
    return getGroundElevationAtImpl(this, x, z, currentY);
  }
  public checkAndResolveSolidCollisions(
    newX: number,
    newZ: number,
    currentY: number,
    radius: number = 0.48
  ): { x: number; z: number } {
    return checkAndResolveSolidCollisionsImpl(this, newX, newZ, currentY, radius);
  }
  public updateSkydivingAndMovement(dt: number) {
    updateSkydivingAndMovementImpl(this, dt);
  }
  public updateCameraAndRigs(dt: number) {
    updateCameraAndRigsImpl(this, dt);
  }
  public updateStorm(dt: number) {
    updateStormImpl(this, dt);
  }
  // --- BOT AI & COMBAT SYSTEMS ---

  public isLineOfSightBlocked(origin: THREE.Vector3, target: THREE.Vector3): boolean {
    return isLineOfSightBlockedImpl(this, origin, target);
  }
  public updateBots(dt: number) {
    updateBotsImpl(this, dt);
  }
  public update1v1Bot(bot: BotPlayer, dt: number, time: number) {
    update1v1BotImpl(this, bot, dt, time);
  }
  public updateBuildingHologram() {
    updateBuildingHologramImpl(this);
  }
  public updateShellCasings(dt: number) {
    updateShellCasingsImpl(this, dt);
  }
  public addDamageNumber(
    text: string,
    color: string,
    isHeadshot: boolean,
    isShield: boolean,
    x: number,
    y: number,
    z: number
  ) {
    addDamageNumberImpl(this, text, color, isHeadshot, isShield, x, y, z);
  }
  public updateDamageNumbers(dt: number) {
    updateDamageNumbersImpl(this, dt);
  }
  public createBulletTracer(start: THREE.Vector3, end: THREE.Vector3) {
    createBulletTracerImpl(this, start, end);
  }
  public updateBulletTracers(dt: number) {
    updateBulletTracersImpl(this, dt);
  }
  // --- HARVESTING PARTICLES & CHOPPING DYNAMICS ---

  public createHarvestParticleEffect(hitPoint: THREE.Vector3, matType: string) {
    createHarvestParticleEffectImpl(this, hitPoint, matType);
  }
  public updateHarvestParticles(dt: number) {
    updateHarvestParticlesImpl(this, dt);
  }
  public animateHarvestImpact(mesh: THREE.Object3D) {
    animateHarvestImpactImpl(this, mesh);
  }
  public updateHarvestWobbles(dt: number) {
    updateHarvestWobblesImpl(this, dt);
  }
  public animateHarvestDestruction(mesh: THREE.Object3D, h: HarvestableObject) {
    animateHarvestDestructionImpl(this, mesh, h);
  }
  public removeHarvestableCollider(h: HarvestableObject) {
    removeHarvestableColliderImpl(this, h);
  }
  public updateNetworkSync(now: number) {
    updateNetworkSyncImpl(this, now);
  }
  // --- SCOPE REAL-TIME BULLET TRAJECTORY & IMPACT INDICATOR ---

  public updateScopeTrajectory() {
    updateScopeTrajectoryImpl(this);
  }
}
