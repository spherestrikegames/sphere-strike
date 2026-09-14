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
  private harvestParticles: { mesh: THREE.Mesh; vel: THREE.Vector3; rotSpeed: THREE.Vector3; life: number; maxLife: number }[] = [];
  private activeHarvestWobbles: { mesh: THREE.Object3D; baseRotZ: number; baseRotX: number; elapsed: number; duration: number }[] = [];
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
  public remotePlayers: Map<string, { state: RemotePlayerState; rig: CharacterMeshRig }> = new Map();
  private lastNetworkSyncTime: number = 0;

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
  private lastNearCarPrompt: string | null = null;
  private lastNearSupplyPrompt: string | null = null;
  private lastStormSyncSecond: number = -1;
  private lastStormShrinkingState: boolean = false;
  private lastAltitudeSync: number = -1;
  private lastAimSyncTime: number = 0;
  private lastAimTargetName: string = '';
  private sharedRaycaster: THREE.Raycaster = new THREE.Raycaster();
  private sharedCenterVec: THREE.Vector2 = new THREE.Vector2(0, 0);

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
  private roundCountdownTimer: number = 0;
  private lastNearUpgradeBenchPrompt: string | null = null;

  public eliminations: number = 0;
  public damageDealt: number = 0;
  public damageTaken: number = 0;
  public structuresBuilt: number = 0;
  public chestsOpened: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public matchStartTime: number = Date.now();
  public isGameOver: boolean = false;
  private botSimCombatTimer: number = 9.0;

  // Input state
  private keys: Record<string, boolean> = {};
  private isMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;
  private lastShotTime: number = 0;
  private isReloading: boolean = false;
  private isUsingConsumable: boolean = false;
  private isSwingingPickaxe: boolean = false;

  // Profile & Settings
  public profile: PlayerProfile;
  private animationFrameId: number = 0;
  private lastTime: number = performance.now();
  private sunLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;

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

    // Spawn AI Bots (24 bots for Battle Royale, 1 Pro God Bot for 1v1 Arena)
    this.spawnBots(this.mode === '1v1_build_fight' ? 1 : 24);

    // Attach Event Listeners
    this.attachEventListeners();

    // Setup Multiplayer Listeners
    this.setupMultiplayer();

    // Initial Callback Sync
    this.callbacks.onHealthChange(this.health, this.shield);
    this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
    this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
    this.callbacks.onPlayersLeftChange(this.bots.filter((b) => b.isAlive).length + 1);
    this.callbacks.onStormUpdate(this.storm);
    this.callbacks.onSkydivingUpdate(this.isSkydiving, this.isGliding, Math.round(this.playerPos.y));
    this.callbacks.onGoldChange?.(this.gold);
    this.callbacks.onArena1v1Update?.(this.arena1v1State);
    this.callbacks.onStormUpdate(this.storm);
    this.callbacks.onSkydivingUpdate(this.isSkydiving, this.isGliding, Math.round(this.playerPos.y));

    // Request pointer lock automatically if possible
    setTimeout(() => {
      if (this.canvas) {
        this.canvas.requestPointerLock();
      }
    }, 100);

    // Start Simulation Loop
    this.lastTime = performance.now();
    this.loop();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 0.95);
    this.hemiLight.position.set(0, 250, 0);
    this.scene.add(this.hemiLight);

    const hasShadows = this.profile.settings.shadows ?? false;
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.sunLight.position.set(130, 260, 100);
    this.sunLight.castShadow = hasShadows;
    this.sunLight.shadow.mapSize.width = hasShadows ? 1024 : 512;
    this.sunLight.shadow.mapSize.height = hasShadows ? 1024 : 512;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.shadow.camera.near = 15;
    this.sunLight.shadow.camera.far = 480;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  private setupGlider() {
    this.gliderMesh = new THREE.Group();

    const canopyGeo = new THREE.BoxGeometry(3.6, 0.1, 2.0);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.2,
      roughness: 0.4,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 1.4;
    this.gliderMesh.add(canopy);

    const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), strutMat);
    leftStrut.position.set(-1.2, 0.7, 0);
    leftStrut.rotation.z = -0.3;
    this.gliderMesh.add(leftStrut);

    const rightStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), strutMat);
    rightStrut.position.set(1.2, 0.7, 0);
    rightStrut.rotation.z = 0.3;
    this.gliderMesh.add(rightStrut);

    this.gliderMesh.visible = false;
    this.scene.add(this.gliderMesh);
  }

  private setupStorm() {
    const stormGeo = new THREE.CylinderGeometry(
      this.storm.currentRadius,
      this.storm.currentRadius,
      200,
      48,
      1,
      true
    );
    const stormMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.38,
      side: THREE.BackSide,
    });
    this.stormCylinderMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormCylinderMesh.position.set(this.storm.currentCenterX, 100, this.storm.currentCenterZ);
    this.scene.add(this.stormCylinderMesh);
  }

  private setupPlayerRigs() {
    const currentWep = this.getCurrentWeapon();
    const type = currentWep ? currentWep.type : 'pickaxe';
    const rarity = currentWep ? currentWep.rarity : 'common';

    // 1st Person Weapon & Arms Rig
    this.fpsRig = createFirstPersonWeaponRig(type, rarity);
    this.camera.add(this.fpsRig);
    this.scene.add(this.camera);

    // 3rd Person Character Rig
    this.thirdPersonRig = buildCharacterModel(
      this.profile.selectedSkin || 'jonesy',
      type,
      rarity
    );

    // Attach Player Name Tag
    this.playerNameTag = createNameTagSprite(
      this.profile.name || 'Player',
      false,
      this.playerTeam,
      this.health / this.maxHealth,
      this.shield / this.maxShield
    );
    this.thirdPersonRig.root.add(this.playerNameTag);

    this.thirdPersonRig.root.visible = !this.isFirstPerson;
    this.scene.add(this.thirdPersonRig.root);
  }

  private setupScopeVisualizer() {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -100),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    this.scopeLaserLine = new THREE.Line(lineGeo, lineMat);
    this.scopeLaserLine.frustumCulled = false;
    this.scopeLaserLine.visible = false;
    this.scene.add(this.scopeLaserLine);

    this.scopeImpactMarker = new THREE.Group();

    const ringGeo = new THREE.RingGeometry(0.18, 0.24, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.scopeImpactMarker.add(ring);

    const dotGeo = new THREE.CircleGeometry(0.045, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    this.scopeImpactMarker.add(dot);

    const tickMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tTop = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), tickMat);
    tTop.position.y = 0.28;
    const tBottom = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), tickMat);
    tBottom.position.y = -0.28;
    const tLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), tickMat);
    tLeft.position.x = -0.28;
    const tRight = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), tickMat);
    tRight.position.x = 0.28;
    this.scopeImpactMarker.add(tTop, tBottom, tLeft, tRight);

    this.scopePointLight = new THREE.PointLight(0xef4444, 2.5, 6);
    this.scopeImpactMarker.add(this.scopePointLight);

    this.scopeImpactMarker.visible = false;
    this.scene.add(this.scopeImpactMarker);
  }

  private spawnBots(count: number) {
    if (this.mode === '1v1_build_fight') {
      const diff = this.arena1v1State.botDifficulty || 'pro';
      const config = getBotDifficultyConfig(diff);

      const bot: BotPlayer = {
        id: 'bot_1v1_opponent',
        name: config.name,
        isAI: true,
        team: 'SHADOW',
        skinId: 'renegade_raider',
        x: this.botSpawnPos.x,
        y: this.botSpawnPos.y,
        z: this.botSpawnPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotY: Math.PI,
        pitch: 0,
        health: 300,
        shield: 300,
        isAlive: true,
        isGrounded: true,
        weapon: { ...WEAPON_REGISTRY.shotgun_pump_legendary },
        targetPos: null,
        state: 'combat',
        lastShotTime: 0,
        accuracy: config.accuracy,
        reactionTimer: config.reactionTimer,
        kills: 0,
      };

      this.bots.push(bot);

      const rig = buildCharacterModel('renegade_raider', bot.weapon.type, bot.weapon.rarity);
      rig.root.position.set(bot.x, bot.y, bot.z);

      const nameTag = createNameTagSprite(
        bot.name,
        true,
        bot.team,
        bot.health / 300,
        bot.shield / 300
      );
      rig.root.add(nameTag);
      this.botNameTags.set(bot.id, nameTag);

      this.scene.add(rig.root);
      this.botMeshes.set(bot.id, rig);
      return;
    }

    const botWeapons = [
      WEAPON_REGISTRY.ar_scar,
      WEAPON_REGISTRY.shotgun_pump_epic,
      WEAPON_REGISTRY.sniper_bolt_legendary,
      WEAPON_REGISTRY.smg_p90_epic,
      WEAPON_REGISTRY.ar_blue,
      WEAPON_REGISTRY.shotgun_pump_blue,
      WEAPON_REGISTRY.ar_common,
    ];

    const teamList: TeamType[] = ['OMEGA', 'SHADOW', 'PHOENIX', 'ALPHA'];
    const rankPrefixes = ['[PRO]', '[ELITE]', '[ALPHA]', '[CHAMPION]', '[UNREAL]', '[MASTER]'];
    const skinNameMap: Record<string, string> = {
      jonesy: 'Jonesy',
      ramirez: 'Ramirez',
      peely: 'Peely',
      midas: 'Midas',
      drift: 'Drift',
      black_knight: 'Knight',
      renegade_raider: 'Renegade',
      goku: 'Goku',
    };

    for (let i = 0; i < count; i++) {
      const skin = FORTNITE_SKINS[i % FORTNITE_SKINS.length];
      const rank = rankPrefixes[i % rankPrefixes.length];
      const skinBase = skinNameMap[skin.id] || skin.name.split(' ')[0];
      const tagNum = Math.floor(1000 + ((i * 1337 + 4021) % 8999));
      const name = `${rank} ${skinBase}#${tagNum}`;
      const poi = ISLAND_POIS[i % ISLAND_POIS.length];
      const wepPreset = botWeapons[i % botWeapons.length];
      const team = teamList[i % teamList.length];

      const x = poi.x + (Math.random() - 0.5) * 70;
      const z = poi.z + (Math.random() - 0.5) * 70;
      const y = 1.5;

      const bot: BotPlayer = {
        id: `bot_${i}`,
        name,
        isAI: true,
        team,
        skinId: skin.id,
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotY: Math.random() * Math.PI * 2,
        pitch: 0,
        health: 80,
        shield: 25,
        isAlive: true,
        isGrounded: true,
        weapon: { ...wepPreset },
        targetPos: null,
        state: 'wander',
        lastShotTime: 0,
        accuracy: 0.12,
        reactionTimer: 2.5 + Math.random() * 2.0,
        kills: 0,
        lastBuildTime: 0,
      };

      this.bots.push(bot);

      // Character Rig with Name Tag sprite
      const rig = buildCharacterModel(skin.id, bot.weapon.type, bot.weapon.rarity);
      rig.root.position.set(x, y, z);

      const nameTag = createNameTagSprite(
        bot.name,
        true,
        bot.team,
        bot.health / 100,
        bot.shield / 50
      );
      rig.root.add(nameTag);
      this.botNameTags.set(bot.id, nameTag);

      this.scene.add(rig.root);
      this.botMeshes.set(bot.id, rig);
    }
  }

  private setupMultiplayer() {
    multiplayerClient.setHandlers({
      onPlayerSync: (playerId, data) => {
        let remote = this.remotePlayers.get(playerId);
        if (!remote) {
          const skinId = data.skinId || 'jonesy';
          const rig = buildCharacterModel(skinId, data.activeWeaponType || 'ar', data.weaponRarity || 'epic');
          this.scene.add(rig.root);
          remote = {
            state: {
              id: playerId,
              name: data.name || 'Party Member',
              skinId,
              x: data.x || 0,
              y: data.y || 2,
              z: data.z || 0,
              rotY: data.rotY || 0,
              pitch: data.pitch || 0,
              health: data.health || 250,
              shield: data.shield || 100,
              isAlive: true,
              isSkydiving: !!data.isSkydiving,
              isGliding: !!data.isGliding,
              activeWeaponType: data.activeWeaponType || 'ar',
              weaponRarity: data.weaponRarity || 'epic',
              isShooting: false,
            },
            rig,
          };
          const nameTag = createNameTagSprite(remote.state.name, false, 'ALPHA', 1.0, 0.5);
          rig.root.add(nameTag);
          this.remotePlayers.set(playerId, remote);
        }

        const prevX = remote.state.x;
        const prevZ = remote.state.z;
        if (data.x !== undefined) remote.state.x = data.x;
        if (data.y !== undefined) remote.state.y = data.y;
        if (data.z !== undefined) remote.state.z = data.z;
        if (data.rotY !== undefined) remote.state.rotY = data.rotY;
        if (data.pitch !== undefined) remote.state.pitch = data.pitch;
        if (data.health !== undefined) remote.state.health = data.health;
        if (data.shield !== undefined) remote.state.shield = data.shield;

        const isMoving = Math.hypot(remote.state.x - prevX, remote.state.z - prevZ) > 0.05;
        remote.rig.root.position.set(remote.state.x, remote.state.y, remote.state.z);
        remote.rig.root.rotation.y = remote.state.rotY + Math.PI;
        remote.rig.updateAnimation(performance.now() * 0.001, isMoving, false, false);
      },
      onPlayerAction: (playerId, action) => {
        if (action.type === 'shoot') {
          const start = new THREE.Vector3(action.origin.x, action.origin.y, action.origin.z);
          const end = new THREE.Vector3(action.target.x, action.target.y, action.target.z);
          this.createBulletTracer(start, end);
          fortniteAudio.playGunshotAR(false);
        } else if (action.type === 'build') {
          const piece = action.piece;
          if (!this.buildingPieces.has(piece.id)) {
            const mesh = createPlacedBuildingMesh(piece);
            this.scene.add(mesh);
            this.buildingPieces.set(piece.id, { piece, mesh });
            fortniteAudio.playBuildPlace(piece.material);
          }
        }
      },
    });
  }

  // --- CONTROLS & POINTER LOCK ---

  private attachEventListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('resize', this.onWindowResize);

    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.isGameOver) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });
  }

  public destroy() {
    fortniteAudio.stopMusic();
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onWindowResize = () => {
    if (!this.canvas) return;
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Slot switching (1 to 6)
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
      const slot = parseInt(e.code.replace('Digit', '')) - 1;
      this.setActiveSlot(slot);
      fortniteAudio.playUiClick();
    }

    // Toggle 1st Person / 3rd Person ('V')
    if (e.code === 'KeyV') {
      this.togglePerspective();
    }

    // Glider toggle in Skydiving mode ('Space')
    if (e.code === 'Space' && this.isSkydiving) {
      this.isGliding = !this.isGliding;
      if (this.isGliding) {
        fortniteAudio.playGliderDeploy();
      }
    }

    // Building Mode Toggle ('Q', 'F', 'R', 'T')
    if (e.code === 'KeyQ') {
      this.toggleBuildMode('wall');
    }
    if (e.code === 'KeyF') {
      if (this.activeVehicle) {
        this.exitVehicle();
      } else {
        this.toggleBuildMode('floor');
      }
    }
    if (e.code === 'KeyR' && this.isBuildMode) {
      this.toggleBuildMode('ramp');
    } else if (e.code === 'KeyR' && !this.isBuildMode) {
      this.startReload();
    }
    if (e.code === 'KeyT') {
      this.toggleBuildMode('cone');
    }

    // Interact / Drive Vehicle / Loot Chest / Pick up Supply ('E')
    if (e.code === 'KeyE') {
      this.interactChestOrItem();
    }

    // Car Honk ('H')
    if (e.code === 'KeyH' && this.activeVehicle) {
      fortniteAudio.playCarHonk();
    }

    // Tactical Slide (Shift + C / Ctrl)
    if ((e.code === 'KeyC' || e.code === 'ControlLeft') && this.isSprinting && this.isGrounded && !this.isSliding && !this.activeVehicle) {
      this.isSliding = true;
      this.slideTimer = 0.8;
      fortniteAudio.playSlide();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    const baseSens = (this.profile.settings.sensitivity ?? 1.0) * 0.0022;
    const adsMultiplier = this.isAimingDownSights
      ? (this.profile.settings.adsSensitivity ?? 0.75)
      : 1.0;
    const sens = baseSens * adsMultiplier;
    const ySign = this.profile.settings.invertY ? -1 : 1;

    this.playerRotY -= e.movementX * sens;
    this.playerPitch -= e.movementY * sens * ySign;

    // Clamp pitch between -88° and +88°
    this.playerPitch = Math.max(-1.53, Math.min(1.53, this.playerPitch));
  };

  public applySettings(settings: import('../types').GameSettings) {
    this.profile.settings = { ...this.profile.settings, ...settings };

    // Update FOV
    if (!this.isAimingDownSights) {
      this.camera.fov = settings.fov || 75;
      this.camera.updateProjectionMatrix();
    }

    // Update Pixel Ratio & Resolution Scaling
    const resScale = settings.resolutionScale || 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, resScale));

    // Update Shadows
    const hasShadows = !!settings.shadows;
    this.renderer.shadowMap.enabled = hasShadows;
    if (this.sunLight) {
      this.sunLight.castShadow = hasShadows;
    }

    // Update Fog / View Distance
    const fogDensity =
      settings.viewDistance === 'near'
        ? 0.0036
        : settings.viewDistance === 'far'
        ? 0.0016
        : 0.0022;
    if (this.scene.fog && 'density' in this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).density = fogDensity;
    }

    // Apply Audio settings
    fortniteAudio.applySettings(settings);
  }

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.canvas.requestPointerLock();
      return;
    }

    if (this.activeVehicle) return; // Cannot shoot while driving

    if (e.button === 0) {
      this.isMouseDown = true;
      if (this.isBuildMode) {
        this.placeBuildingPiece();
      } else {
        this.fireActiveWeapon();
      }
    } else if (e.button === 2) {
      this.isRightMouseDown = true;
      this.isAimingDownSights = true;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
      this.isAimingDownSights = false;
    }
  };

  public togglePerspective() {
    this.isFirstPerson = !this.isFirstPerson;
    if (this.fpsRig) this.fpsRig.visible = this.isFirstPerson && !this.activeVehicle;
    if (this.thirdPersonRig) this.thirdPersonRig.root.visible = !this.isFirstPerson || !!this.activeVehicle;
    fortniteAudio.playUiClick();
  }

  public setActiveSlot(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return;
    this.activeSlot = slotIndex;

    // Only allow building when holding the Pickaxe (Slot 0 / type 'pickaxe')
    if (this.inventory[slotIndex]?.type !== 'pickaxe') {
      this.isBuildMode = false;
      if (this.hologramMesh) this.hologramMesh.visible = false;
    }

    this.updateWeaponRigs();
    this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
  }

  public toggleBuildMode(type: BuildType) {
    if (this.activeVehicle) return;

    if (this.mode === '1v1_build_fight') {
      if (this.callbacks.onItemCollected) {
        this.callbacks.onItemCollected({
          id: `nobuild_${Date.now()}`,
          title: '🚫 Building Disabled',
          subtitle: '1v1 Aim Arena is a No-Build gunfight zone!',
          icon: '🎯',
          type: 'weapon',
          color: '#ef4444',
          timestamp: Date.now(),
        });
      }
      fortniteAudio.playUiClick();
      return;
    }

    // Automatically equip Pickaxe (Slot 0) when entering build mode
    if (this.getCurrentWeapon()?.type !== 'pickaxe') {
      const pickaxeIdx = this.inventory.findIndex((w) => w.type === 'pickaxe');
      if (pickaxeIdx !== -1) {
        this.activeSlot = pickaxeIdx;
        this.updateWeaponRigs();
        this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
      }
    }

    if (this.isBuildMode && this.selectedBuildType === type) {
      this.isBuildMode = false;
      if (this.hologramMesh) this.hologramMesh.visible = false;
    } else {
      this.isBuildMode = true;
      this.selectedBuildType = type;
      if (this.hologramMesh) {
        this.scene.remove(this.hologramMesh);
        this.hologramMesh = createHologramPreview(type);
        this.scene.add(this.hologramMesh);
        this.hologramMesh.visible = true;
      }
      fortniteAudio.playUiClick();
    }
  }

  private updateWeaponRigs() {
    const wep = this.getCurrentWeapon();
    const type = wep ? wep.type : 'pickaxe';
    const rarity = wep ? wep.rarity : 'common';

    if (this.fpsRig) {
      this.camera.remove(this.fpsRig);
      this.fpsRig = createFirstPersonWeaponRig(type, rarity);
      this.fpsRig.visible = this.isFirstPerson && !this.activeVehicle;
      this.camera.add(this.fpsRig);
    }

    if (this.thirdPersonRig) {
      this.thirdPersonRig.setWeapon(type, rarity);
    }
  }

  public getCurrentWeapon(): FortniteWeapon | null {
    return this.inventory[this.activeSlot] || null;
  }

  // --- REALISTIC WEAPON FIRING & BALLISTICS ---

  private fireActiveWeapon() {
    const wep = this.getCurrentWeapon();
    if (!wep || this.isReloading || this.isUsingConsumable || this.isSkydiving || this.activeVehicle) return;

    const now = performance.now();
    const fireInterval = 1000 / wep.fireRate;
    if (now - this.lastShotTime < fireInterval) return;

    if (wep.type === 'shield' || wep.type === 'heal') {
      this.startConsumableUse(wep);
      return;
    }

    if (wep.type !== 'pickaxe' && wep.currentAmmo <= 0) {
      this.startReload();
      return;
    }

    this.lastShotTime = now;
    this.shotsFired++;

    if (wep.type === 'pickaxe') {
      this.isSwingingPickaxe = true;
      fortniteAudio.playPickaxeSwing();
      setTimeout(() => (this.isSwingingPickaxe = false), 320);
      this.performPickaxeHit();
      return;
    }

    // Deduct 1 ammo
    wep.currentAmmo--;
    wep.reserveAmmo = 9999;
    this.callbacks.onInventoryChange(this.inventory, this.activeSlot);

    // Play Weapon Audio
    if (wep.type === 'ar') fortniteAudio.playGunshotAR(wep.rarity === 'legendary');
    else if (wep.type === 'shotgun') fortniteAudio.playGunshotShotgun();
    else if (wep.type === 'sniper') fortniteAudio.playGunshotSniper();
    else if (wep.type === 'smg') fortniteAudio.playGunshotSMG();

    // Muzzle Flash & Point Light
    const flash = createMuzzleFlash(wep.rarity === 'legendary' ? 0xf59e0b : 0xfef08a);
    flash.position.set(0.2, -0.15, -0.9);
    this.camera.add(flash);
    setTimeout(() => this.camera.remove(flash), 55);

    // Realistic Procedural Recoil Kick
    const recoilKick = wep.type === 'sniper' ? 0.065 : wep.type === 'shotgun' ? 0.05 : 0.022;
    this.playerPitch += recoilKick;
    this.recoilRecoilZ = 0.12;
    this.recoilRecoilY = 0.04;
    this.recoilRecoilRotX = -0.15;
    this.screenShake = 0.05;

    // Eject Brass Shell Casing
    this.ejectShellCasing();

    // Bullet Raycast Hitscan (Exact pinpoint accuracy where crosshair is)
    this.performBulletRaycast(wep);

    // Sync to Online Party
    multiplayerClient.sendPlayerAction({
      type: 'shoot',
      origin: { x: this.playerPos.x, y: this.playerPos.y + 1.6, z: this.playerPos.z },
      target: {
        x: this.playerPos.x - Math.sin(this.playerRotY) * 50,
        y: this.playerPos.y + 1.6 + Math.sin(this.playerPitch) * 50,
        z: this.playerPos.z - Math.cos(this.playerRotY) * 50,
      },
    });
  }

  private ejectShellCasing() {
    const geo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const spawnPos = this.camera.position.clone().add(
      new THREE.Vector3(0.25, -0.2, -0.4).applyQuaternion(this.camera.quaternion)
    );
    mesh.position.copy(spawnPos);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    this.scene.add(mesh);

    const rightDir = new THREE.Vector3(1, 0.5, 0).applyQuaternion(this.camera.quaternion);
    this.shellCasings.push({
      mesh,
      vel: rightDir.multiplyScalar(3.5 + Math.random() * 2),
      rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      life: 1.5,
    });
  }

  private performShotgunBlast(wep: FortniteWeapon) {
    const pelletCount = 10;
    const rayOrigin = this.camera.position.clone();
    const forwardRaycaster = new THREE.Raycaster();
    forwardRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const centerRayDir = forwardRaycaster.ray.direction.clone();

    // Strict 1-foot effective radius zone (~0.35m radius cylinder around center line)
    const effectiveRadius = 0.35;
    const maxRange = wep.range || 42;

    let primaryBot: BotPlayer | null = null;
    let primaryBotDist = maxRange;
    let isHeadshot = false;

    // Check static obstructions along center ray
    const centerRayEnd = rayOrigin.clone().add(centerRayDir.clone().multiplyScalar(maxRange));
    let blockDist = maxRange;
    const sharedBox = new THREE.Box3();
    const sharedIntersect = new THREE.Vector3();

    const candidateColliders = this.spatialGrid.queryRay(rayOrigin.x, rayOrigin.z, centerRayEnd.x, centerRayEnd.z);
    for (let i = 0; i < candidateColliders.length; i++) {
      const sc = candidateColliders[i];
      if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
        sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
        sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
        if (forwardRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
          const d = rayOrigin.distanceTo(sharedIntersect);
          if (d > 0.2 && d < blockDist) blockDist = d;
        }
      } else if (sc.type === 'cylinder' && sc.x !== undefined && sc.z !== undefined && sc.radius !== undefined) {
        const r = sc.radius;
        sharedBox.min.set(sc.x - r, sc.minY || 0, sc.z - r);
        sharedBox.max.set(sc.x + r, sc.maxY || 100, sc.z + r);
        if (forwardRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
          const d = rayOrigin.distanceTo(sharedIntersect);
          if (d > 0.2 && d < blockDist) blockDist = d;
        }
      }
    }

    const candidatePieces = this.spatialGrid.queryBuildingPiecesRay(rayOrigin.x, rayOrigin.z, centerRayEnd.x, centerRayEnd.z);
    for (let i = 0; i < candidatePieces.length; i++) {
      const piece = candidatePieces[i];
      sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
      sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
      if (forwardRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
        const d = rayOrigin.distanceTo(sharedIntersect);
        if (d > 0.2 && d < blockDist) blockDist = d;
      }
    }

    // Check bots inside 1-foot radius
    for (const bot of this.bots) {
      if (!bot.isAlive) continue;
      const botPos = new THREE.Vector3(bot.x, bot.y + 1.0, bot.z);
      const dToRay = forwardRaycaster.ray.distanceToPoint(botPos);
      const dToCam = rayOrigin.distanceTo(botPos);

      // Strict 1-foot effective radius zone and closer than any obstructing wall
      if (dToRay <= effectiveRadius && dToCam < blockDist && dToCam < primaryBotDist) {
        primaryBot = bot;
        primaryBotDist = dToCam;
        isHeadshot = forwardRaycaster.ray.origin.y + forwardRaycaster.ray.direction.y * dToCam > bot.y + 1.45;
      }
    }

    // Calculate pellet hits: within 1-foot radius -> full 100% maximum damage output
    if (primaryBot) {
      this.shotsHit++;
      let totalDmg = wep.damage;
      if (isHeadshot) totalDmg = Math.round(totalDmg * wep.headshotMultiplier);

      if (primaryBot.team === this.playerTeam) {
        this.addDamageNumber('TEAMMATE', '#38bdf8', false, false, primaryBot.x, primaryBot.y + 2.2, primaryBot.z);
      } else {
        const hadShield = primaryBot.shield > 0;
        if (primaryBot.shield > 0) {
          if (primaryBot.shield >= totalDmg) {
            primaryBot.shield -= totalDmg;
          } else {
            const rem = totalDmg - primaryBot.shield;
            primaryBot.shield = 0;
            primaryBot.health -= rem;
          }
        } else {
          primaryBot.health -= totalDmg;
        }

        const nTag = this.botNameTags.get(primaryBot.id);
        if (nTag) {
          updateNameTagSprite(
            nTag,
            primaryBot.name,
            true,
            primaryBot.team,
            Math.max(0, primaryBot.health / 100),
            Math.max(0, primaryBot.shield / 50)
          );
        }

        this.damageDealt += totalDmg;
        this.callbacks.onHitmarker(isHeadshot, hadShield);
        fortniteAudio.playHitmarker(isHeadshot, hadShield);

        this.addDamageNumber(
          totalDmg.toString(),
          isHeadshot ? '#fbbf24' : hadShield ? '#38bdf8' : '#ef4444',
          isHeadshot,
          hadShield,
          primaryBot.x,
          primaryBot.y + 2.2,
          primaryBot.z
        );

        primaryBot.state = 'combat';
        primaryBot.targetPos = { x: this.playerPos.x, z: this.playerPos.z };
        if (primaryBot.health <= 0) {
          this.eliminateBot(primaryBot, isHeadshot, wep.name);
        }
      }
    }

    // Fire 10 multi-pellet visual tracers spreading out around reticle
    const baseOffset = new THREE.Vector3(0.2, -0.2, -0.4);
    for (let p = 0; p < pelletCount; p++) {
      const pelletRay = new THREE.Raycaster();
      let sx = 0;
      let sy = 0;
      if (p > 0) {
        const angle = ((p - 1) / (pelletCount - 1)) * Math.PI * 2;
        const r = 0.016; // 1-foot spread cone
        sx = Math.cos(angle) * r;
        sy = Math.sin(angle) * r;
      }
      pelletRay.setFromCamera(new THREE.Vector2(sx, sy), this.camera);
      const hitDist = primaryBot ? primaryBotDist : Math.min(blockDist, 35);
      const end = pelletRay.ray.origin.clone().add(pelletRay.ray.direction.clone().multiplyScalar(hitDist));
      this.createBulletTracer(this.camera.position.clone().add(baseOffset), end);
    }
  }

  private performBulletRaycast(wep: FortniteWeapon) {
    if (wep.type === 'shotgun') {
      this.performShotgunBlast(wep);
      return;
    }

    const raycaster = new THREE.Raycaster();
    // Pinpoint reticle hit registration: bullet strictly hits whatever is directly inside the aimer in the middle of the screen
    const screenCenter = new THREE.Vector2(0, 0);

    raycaster.setFromCamera(screenCenter, this.camera);

    const rayOrigin = this.camera.position.clone();
    const rayDir = raycaster.ray.direction.clone();
    const rayEnd = rayOrigin.clone().add(rayDir.clone().multiplyScalar(wep.range));

    let closestHitDist = wep.range;
    let hitBot: BotPlayer | null = null;
    let isHeadshot = false;
    let hitBuildingPieceId: string | null = null;
    let hitStaticCollider = false;

    const sharedBox = new THREE.Box3();
    const sharedIntersect = new THREE.Vector3();

    // 1. Check Static World Buildings, Houses, Skyscrapers & Warehouses (Bullets MUST NEVER pass through buildings!)
    const candidateColliders = this.spatialGrid.queryRay(rayOrigin.x, rayOrigin.z, rayEnd.x, rayEnd.z);
    for (let i = 0; i < candidateColliders.length; i++) {
      const sc = candidateColliders[i];
      if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
        sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
        sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
        if (raycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
          const d = rayOrigin.distanceTo(sharedIntersect);
          if (d > 0.2 && d < closestHitDist) {
            closestHitDist = d;
            hitStaticCollider = true;
            hitBuildingPieceId = null;
            hitBot = null;
          }
        }
      } else if (sc.type === 'cylinder' && sc.x !== undefined && sc.z !== undefined && sc.radius !== undefined) {
        const r = sc.radius;
        sharedBox.min.set(sc.x - r, sc.minY || 0, sc.z - r);
        sharedBox.max.set(sc.x + r, sc.maxY || 100, sc.z + r);
        if (raycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
          const d = rayOrigin.distanceTo(sharedIntersect);
          if (d > 0.2 && d < closestHitDist) {
            closestHitDist = d;
            hitStaticCollider = true;
            hitBuildingPieceId = null;
            hitBot = null;
          }
        }
      }
    }

    // 2. Check Player-Built Structures in bullet line (Walls, Ramps, Floors, Cones)
    const candidatePieces = this.spatialGrid.queryBuildingPiecesRay(rayOrigin.x, rayOrigin.z, rayEnd.x, rayEnd.z);
    for (let i = 0; i < candidatePieces.length; i++) {
      const piece = candidatePieces[i];
      sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
      sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
      if (raycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
        const d = rayOrigin.distanceTo(sharedIntersect);
        if (d > 0.2 && d < closestHitDist) {
          closestHitDist = d;
          hitBuildingPieceId = piece.id;
          hitStaticCollider = false;
          hitBot = null;
        }
      }
    }

    // 3. Check Bots (Only hit if NOT blocked by a wall or building in front!)
    for (const bot of this.bots) {
      if (!bot.isAlive) continue;

      const botPos = new THREE.Vector3(bot.x, bot.y + 1.0, bot.z);
      const distToRay = raycaster.ray.distanceToPoint(botPos);

      if (distToRay < 1.05) {
        const dToPlayer = rayOrigin.distanceTo(botPos);
        // Bot is only hit if it is CLOSER than the nearest building / wall!
        if (dToPlayer > 0.3 && dToPlayer < closestHitDist) {
          closestHitDist = dToPlayer;
          hitBot = bot;
          hitBuildingPieceId = null;
          hitStaticCollider = false;
          isHeadshot = raycaster.ray.origin.y + raycaster.ray.direction.y * dToPlayer > bot.y + 1.45;
        }
      }
    }

    // Process Hit Structure
    if (hitBuildingPieceId) {
      const bData = this.buildingPieces.get(hitBuildingPieceId);
      if (bData) {
        const dmg = wep.damage;
        bData.piece.health -= dmg;
        fortniteAudio.playHarvestHit(bData.piece.material, false);
        this.addDamageNumber(
          dmg.toString(),
          '#facc15',
          false,
          false,
          bData.piece.x,
          bData.piece.y + 2,
          bData.piece.z
        );

        if (bData.piece.health <= 0) {
          fortniteAudio.playStructureDestroy(bData.piece.material);
          this.scene.remove(bData.mesh);
          this.buildingPieces.delete(hitBuildingPieceId);
          this.spatialGrid.removeBuildingPiece(hitBuildingPieceId);
        }
      }
    } else if (hitStaticCollider) {
      // Bullet hit static world building / skyscraper / house - stopped completely!
      fortniteAudio.playHarvestHit('stone', false);
    } else if (hitBot) {
      // Friendly fire protection
      if (hitBot.team === this.playerTeam) {
        this.addDamageNumber('TEAMMATE', '#38bdf8', false, false, hitBot.x, hitBot.y + 2.2, hitBot.z);
      } else {
        this.shotsHit++;
        let dmg = wep.damage;
        if (isHeadshot) dmg = Math.round(dmg * wep.headshotMultiplier);

        const hadShield = hitBot.shield > 0;
        if (hitBot.shield > 0) {
          if (hitBot.shield >= dmg) {
            hitBot.shield -= dmg;
          } else {
            const rem = dmg - hitBot.shield;
            hitBot.shield = 0;
            hitBot.health -= rem;
          }
        } else {
          hitBot.health -= dmg;
        }

        // Update bot name tag health/shield bar in real-time!
        const nTag = this.botNameTags.get(hitBot.id);
        if (nTag) {
          updateNameTagSprite(
            nTag,
            hitBot.name,
            true,
            hitBot.team,
            Math.max(0, hitBot.health / 100),
            Math.max(0, hitBot.shield / 50)
          );
        }

        this.damageDealt += dmg;
        this.callbacks.onHitmarker(isHeadshot, hadShield);
        fortniteAudio.playHitmarker(isHeadshot, hadShield);

        this.addDamageNumber(
          dmg.toString(),
          isHeadshot ? '#fbbf24' : hadShield ? '#38bdf8' : '#ffffff',
          isHeadshot,
          hadShield,
          hitBot.x,
          hitBot.y + 2.2,
          hitBot.z
        );

        hitBot.state = 'combat';
        hitBot.targetPos = { x: this.playerPos.x, z: this.playerPos.z };

        if (hitBot.health <= 0) {
          this.eliminateBot(hitBot, isHeadshot, wep.name);
        }
      }
    }

    const tracerEnd = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(closestHitDist));
    this.createBulletTracer(this.camera.position.clone().add(new THREE.Vector3(0.2, -0.2, -0.4)), tracerEnd);
  }

  private performPickaxeHit() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const origin = this.camera.position;
    
    // In 3rd person mode camera is ~2.8m behind player; in 1st person it is at player eye
    const maxRayDist = this.isFirstPerson ? 5.5 : 9.0;
    const playerReachDist = 4.8;

    let closestDist = maxRayDist;
    let hitBuilding: { id: string; piece: BuildingPiece; mesh: THREE.Mesh; hitPoint: THREE.Vector3 } | null = null;
    let hitHarvestable: { harvestable: HarvestableObject; hitPoint: THREE.Vector3; isCrit: boolean } | null = null;
    let hitBotTarget: { bot: BotPlayer; hitPoint: THREE.Vector3 } | null = null;

    // 1. Raycast Check: Player-Built Pieces (Walls, Ramps, Floors, Cones)
    const queryPieces = this.spatialGrid.queryBuildingPiecesNear(this.playerPos.x, this.playerPos.z, 6.0);
    const pieceBox = new THREE.Box3();
    const pieceIntersect = new THREE.Vector3();

    for (let i = 0; i < queryPieces.length; i++) {
      const p = queryPieces[i];
      const bData = this.buildingPieces.get(p.id);
      if (!bData) continue;

      // Check direct 3D mesh intersection first
      const intersects = raycaster.intersectObject(bData.mesh, true);
      if (intersects.length > 0 && intersects[0].distance < closestDist) {
        if (intersects[0].point.distanceTo(this.playerPos) <= playerReachDist) {
          closestDist = intersects[0].distance;
          hitBuilding = { id: p.id, piece: p, mesh: bData.mesh, hitPoint: intersects[0].point };
          hitHarvestable = null;
          hitBotTarget = null;
        }
      } else {
        // AABB fallback for edge hits
        pieceBox.min.set(p.x - 2.1, p.y - 0.3, p.z - 2.1);
        pieceBox.max.set(p.x + 2.1, p.y + 4.2, p.z + 2.1);
        if (raycaster.ray.intersectBox(pieceBox, pieceIntersect)) {
          const d = origin.distanceTo(pieceIntersect);
          if (d < closestDist && pieceIntersect.distanceTo(this.playerPos) <= playerReachDist) {
            closestDist = d;
            hitBuilding = { id: p.id, piece: p, mesh: bData.mesh, hitPoint: pieceIntersect.clone() };
            hitHarvestable = null;
            hitBotTarget = null;
          }
        }
      }
    }

    // 2. Raycast Check: Harvestable Props (Trees, Rocks, Cars, Containers)
    const harvBox = new THREE.Box3();
    const harvIntersect = new THREE.Vector3();
    for (const h of this.harvestables) {
      if (h.health <= 0) continue;
      const dist2D = Math.hypot(h.x - this.playerPos.x, h.z - this.playerPos.z);
      if (dist2D > h.radius + 5.5) continue;

      // Ensure generous hit box for tree trunks and rocks
      const hitRadius = Math.max(h.radius, 1.4);
      harvBox.min.set(h.x - hitRadius, h.y - 0.5, h.z - hitRadius);
      harvBox.max.set(h.x + hitRadius, h.y + h.height + 0.5, h.z + hitRadius);
      if (raycaster.ray.intersectBox(harvBox, harvIntersect)) {
        const d = origin.distanceTo(harvIntersect);
        if (d < closestDist && harvIntersect.distanceTo(this.playerPos) <= playerReachDist + 0.8) {
          closestDist = d;
          hitHarvestable = { harvestable: h, hitPoint: harvIntersect.clone(), isCrit: Math.random() < 0.28 };
          hitBuilding = null;
          hitBotTarget = null;
        }
      }
    }

    // 3. Raycast Check: Enemy Bots
    for (const bot of this.bots) {
      if (!bot.isAlive) continue;
      const distToPlayer = Math.hypot(bot.x - this.playerPos.x, bot.z - this.playerPos.z);
      if (distToPlayer > playerReachDist) continue;

      const botBox = new THREE.Box3(
        new THREE.Vector3(bot.x - 0.7, bot.y, bot.z - 0.7),
        new THREE.Vector3(bot.x + 0.7, bot.y + 2.0, bot.z + 0.7)
      );
      const botIntersect = new THREE.Vector3();
      if (raycaster.ray.intersectBox(botBox, botIntersect)) {
        const d = origin.distanceTo(botIntersect);
        if (d < closestDist) {
          closestDist = d;
          hitBotTarget = { bot, hitPoint: botIntersect.clone() };
          hitBuilding = null;
          hitHarvestable = null;
        }
      }
    }

    // 4. Proximity & Forward Arc Fallback for Trees and Harvestables
    if (!hitBuilding && !hitHarvestable && !hitBotTarget) {
      const fwd2D = new THREE.Vector2(-Math.sin(this.playerRotY), -Math.cos(this.playerRotY));
      let bestHarvestableScore = -1;

      for (const h of this.harvestables) {
        if (h.health <= 0) continue;
        const toHarv = new THREE.Vector2(h.x - this.playerPos.x, h.z - this.playerPos.z);
        const dist = toHarv.length();
        if (dist <= h.radius + 3.0 && Math.abs(this.playerPos.y - h.y) < 5.5) {
          const dir = toHarv.clone().normalize();
          const dot = dir.dot(fwd2D);
          if (dot > 0.2 && dot > bestHarvestableScore) {
            bestHarvestableScore = dot;
            hitHarvestable = {
              harvestable: h,
              hitPoint: new THREE.Vector3(
                h.x + (this.playerPos.x - h.x) * 0.35,
                this.playerPos.y + 1.2,
                h.z + (this.playerPos.z - h.z) * 0.35
              ),
              isCrit: Math.random() < 0.28,
            };
          }
        }
      }
    }

    // 5. Proximity Fallback for Player Structures
    if (!hitBuilding && !hitHarvestable && !hitBotTarget) {
      const fwd = new THREE.Vector3();
      this.camera.getWorldDirection(fwd);

      for (let i = 0; i < queryPieces.length; i++) {
        const p = queryPieces[i];
        const bData = this.buildingPieces.get(p.id);
        if (!bData) continue;
        const toPiece = new THREE.Vector3(p.x, p.y + 1.5, p.z).sub(this.playerPos);
        const dist = toPiece.length();
        if (dist <= 3.8 && toPiece.normalize().dot(fwd) > 0.35) {
          hitBuilding = { id: p.id, piece: p, mesh: bData.mesh, hitPoint: new THREE.Vector3(p.x, p.y + 1.5, p.z) };
          break;
        }
      }
    }

    // EXECUTE PICKAXE HIT ACTIONS:
    if (hitBuilding) {
      const { id, piece, mesh, hitPoint } = hitBuilding;
      const damage = 100;
      piece.health -= damage;
      fortniteAudio.playHarvestHit(piece.material, true);

      // Reward materials for breaking structures
      const matYield = 10;
      if (piece.material === 'wood') this.wood = Math.min(999, this.wood + matYield);
      else if (piece.material === 'stone') this.stone = Math.min(999, this.stone + matYield);
      else if (piece.material === 'metal') this.metal = Math.min(999, this.metal + matYield);
      this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);

      this.createHarvestParticleEffect(hitPoint, piece.material);
      this.addDamageNumber(damage.toString(), '#facc15', false, false, hitPoint.x, hitPoint.y + 0.3, hitPoint.z);

      if (piece.health <= 0) {
        fortniteAudio.playStructureDestroy(piece.material);
        this.scene.remove(mesh);
        this.buildingPieces.delete(id);
        this.spatialGrid.removeBuildingPiece(id);
      }
      return;
    }

    if (hitHarvestable) {
      const { harvestable: h, hitPoint, isCrit } = hitHarvestable;
      const damage = isCrit ? 100 : 50;
      h.health -= damage;

      // Calculate wood or resource yield
      let yieldAmount = h.yieldPerHit;
      if (isCrit) yieldAmount = Math.round(yieldAmount * 1.6);

      // Award materials!
      if (h.materialType === 'wood') this.wood = Math.min(999, this.wood + yieldAmount);
      else if (h.materialType === 'stone') this.stone = Math.min(999, this.stone + yieldAmount);
      else if (h.materialType === 'metal') this.metal = Math.min(999, this.metal + yieldAmount);

      this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
      fortniteAudio.playHarvestHit(h.materialType, isCrit);

      // Screen impact & particle effects
      this.screenShake = Math.max(this.screenShake, isCrit ? 0.05 : 0.03);
      this.createHarvestParticleEffect(hitPoint, h.materialType);

      // Tree wobble animation
      const treeMesh = this.harvestableMeshes.get(h.id);
      if (treeMesh) {
        this.animateHarvestImpact(treeMesh);
      }

      if (h.health <= 0) {
        // Complete Tree Destruction Bonus!
        const bonusYield = h.materialType === 'wood' ? 35 : h.materialType === 'stone' ? 25 : 20;
        if (h.materialType === 'wood') this.wood = Math.min(999, this.wood + bonusYield);
        else if (h.materialType === 'stone') this.stone = Math.min(999, this.stone + bonusYield);
        else if (h.materialType === 'metal') this.metal = Math.min(999, this.metal + bonusYield);

        this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
        fortniteAudio.playStructureDestroy(h.materialType);

        if (this.callbacks.onItemCollected) {
          this.callbacks.onItemCollected({
            id: `col_harv_dest_${Date.now()}_${Math.random()}`,
            title: `+${bonusYield} ${h.materialType.toUpperCase()} (CHOPPED DOWN!)`,
            subtitle: `Total: ${h.materialType === 'wood' ? this.wood : h.materialType === 'stone' ? this.stone : this.metal}`,
            icon: h.materialType === 'wood' ? '🪵' : '🪨',
            amount: `+${bonusYield}`,
            type: 'material',
            color: '#f59e0b',
            timestamp: Date.now(),
          });
        }

        this.addDamageNumber(
          `+${bonusYield} ${h.materialType.toUpperCase()} (DESTROYED)`,
          '#f59e0b',
          true,
          false,
          hitPoint.x,
          hitPoint.y + 0.8,
          hitPoint.z
        );

        if (treeMesh) {
          this.animateHarvestDestruction(treeMesh, h);
        }
        this.removeHarvestableCollider(h);
      } else {
        const matIcon = h.materialType === 'wood' ? '🪵' : h.materialType === 'stone' ? '🪨' : '🔩';
        const total = h.materialType === 'wood' ? this.wood : h.materialType === 'stone' ? this.stone : this.metal;

        if (this.callbacks.onItemCollected) {
          this.callbacks.onItemCollected({
            id: `col_harv_${Date.now()}_${Math.random()}`,
            title: `+${yieldAmount} ${h.materialType.toUpperCase()}${isCrit ? ' (CRIT!)' : ''}`,
            subtitle: `Total: ${total}`,
            icon: matIcon,
            amount: `+${yieldAmount}`,
            type: 'material',
            color: isCrit ? '#38bdf8' : h.materialType === 'wood' ? '#f59e0b' : h.materialType === 'stone' ? '#a8a29e' : '#94a3b8',
            timestamp: Date.now(),
          });
        }

        this.addDamageNumber(
          `+${yieldAmount} ${h.materialType.toUpperCase()}`,
          isCrit ? '#38bdf8' : '#facc15',
          isCrit,
          false,
          hitPoint.x,
          hitPoint.y + 0.5,
          hitPoint.z
        );
      }
      return;
    }

    if (hitBotTarget) {
      const { bot, hitPoint } = hitBotTarget;
      if (bot.team !== this.playerTeam) {
        bot.health -= 25;
        fortniteAudio.playHitmarker(false, false);
        this.addDamageNumber('25', '#ffffff', false, false, hitPoint.x, hitPoint.y + 0.5, hitPoint.z);

        const nTag = this.botNameTags.get(bot.id);
        if (nTag) {
          updateNameTagSprite(nTag, bot.name, true, bot.team, Math.max(0, bot.health / 100), Math.max(0, bot.shield / 50));
        }

        if (bot.health <= 0) {
          this.eliminateBot(bot, false, 'Harvesting Tool');
        }
      }
    }
  }

  private startReload() {
    const wep = this.getCurrentWeapon();
    if (!wep || wep.type === 'pickaxe' || wep.currentAmmo === wep.magazineSize) return;

    this.isReloading = true;
    fortniteAudio.playReload();
    setTimeout(() => {
      if (!this.isReloading) return;
      wep.currentAmmo = wep.magazineSize;
      wep.reserveAmmo = 9999;
      this.isReloading = false;
      this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
    }, wep.reloadTime * 1000);
  }

  private startConsumableUse(wep: FortniteWeapon) {
    if (this.isUsingConsumable) return;
    this.isUsingConsumable = true;
    fortniteAudio.playShieldDrink();

    setTimeout(() => {
      if (!this.isUsingConsumable) return;
      if (wep.shieldAmount) {
        this.shield = Math.min(this.maxShield, this.shield + wep.shieldAmount);
      }
      if (wep.healAmount) {
        this.health = Math.min(this.maxHealth, this.health + wep.healAmount);
      }
      wep.currentAmmo--;
      if (wep.currentAmmo <= 0) {
        this.inventory[this.activeSlot] = null;
      }
      this.isUsingConsumable = false;
      this.callbacks.onHealthChange(this.health, this.shield);
      this.callbacks.onInventoryChange(this.inventory, this.activeSlot);

      if (this.playerNameTag) {
        updateNameTagSprite(this.playerNameTag, this.profile.name, false, this.playerTeam, this.health / this.maxHealth, this.shield / this.maxShield);
      }
    }, (wep.useTime || 2.0) * 1000);
  }

  // --- BUILDING SYSTEM ---

  public placeBuildingPiece() {
    if (this.mode === '1v1_build_fight') {
      this.isBuildMode = false;
      if (this.hologramMesh) this.hologramMesh.visible = false;
      return;
    }

    if (this.getCurrentWeapon()?.type !== 'pickaxe') {
      this.isBuildMode = false;
      if (this.hologramMesh) this.hologramMesh.visible = false;
      return;
    }

    const matCost = 10;
    if (this.selectedMaterial === 'wood' && this.wood < matCost) return;
    if (this.selectedMaterial === 'stone' && this.stone < matCost) return;
    if (this.selectedMaterial === 'metal' && this.metal < matCost) return;

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    const snapped = snapToBuildGrid(this.playerPos, camDir, this.selectedBuildType);
    const pieceId = `build_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const matInfo = MATERIAL_STATS[this.selectedMaterial];
    const piece: BuildingPiece = {
      id: pieceId,
      type: this.selectedBuildType,
      material: this.selectedMaterial,
      x: snapped.x,
      y: snapped.y,
      z: snapped.z,
      rotY: snapped.rotY,
      health: matInfo.initialHp,
      maxHealth: matInfo.maxHp,
      ownerId: 'player',
      createdAt: Date.now(),
    };

    const mesh = createPlacedBuildingMesh(piece);
    this.scene.add(mesh);
    this.buildingPieces.set(pieceId, { piece, mesh });
    this.spatialGrid.addBuildingPiece(piece);

    if (this.selectedMaterial === 'wood') this.wood -= matCost;
    else if (this.selectedMaterial === 'stone') this.stone -= matCost;
    else if (this.selectedMaterial === 'metal') this.metal -= matCost;

    this.structuresBuilt++;
    this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
    fortniteAudio.playBuildPlace(this.selectedMaterial);

    multiplayerClient.sendPlayerAction({
      type: 'build',
      piece,
    });
  }

  // --- VEHICLES & DRIVING SYSTEM ---

  public enterVehicle(vehicle: DrivableVehicle) {
    this.activeVehicle = vehicle;
    vehicle.driverId = 'player';
    vehicle.leftDoorOpen = true;
    this.playerRotY = vehicle.rotY;
    this.playerPitch = 0.18;
    fortniteAudio.playCarDoor();

    this.isBuildMode = false;
    if (this.hologramMesh) this.hologramMesh.visible = false;
    if (this.fpsRig) this.fpsRig.visible = false;
    if (this.thirdPersonRig) this.thirdPersonRig.root.visible = true;

    if (this.callbacks.onVehicleChange) {
      this.callbacks.onVehicleChange(vehicle);
    }
  }

  public exitVehicle() {
    if (!this.activeVehicle) return;
    const v = this.activeVehicle;
    v.driverId = null;
    v.leftDoorOpen = false;
    fortniteAudio.playCarDoor();

    // Place player right beside driver door
    this.playerPos.set(
      v.x - Math.cos(v.rotY) * 2.2,
      v.y + 0.2,
      v.z + Math.sin(v.rotY) * 2.2
    );
    this.playerVel.set(0, 0, 0);

    this.activeVehicle = null;

    if (this.callbacks.onVehicleChange) {
      this.callbacks.onVehicleChange(null);
    }

    if (this.isFirstPerson) {
      if (this.fpsRig) this.fpsRig.visible = true;
      if (this.thirdPersonRig) this.thirdPersonRig.root.visible = false;
    } else {
      if (this.thirdPersonRig) this.thirdPersonRig.root.visible = true;
      if (this.fpsRig) this.fpsRig.visible = false;
    }
  }

  private updateVehicleDriving(dt: number) {
    if (!this.activeVehicle) return;
    const v = this.activeVehicle;

    const isW = this.keys['KeyW'] || this.keys['ArrowUp'];
    const isS = this.keys['KeyS'] || this.keys['ArrowDown'];
    const isA = this.keys['KeyA'] || this.keys['ArrowLeft'];
    const isD = this.keys['KeyD'] || this.keys['ArrowRight'];
    const isNitro = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && v.nitro > 0;
    const isBrake = this.keys['Space'];

    // Responsive Acceleration & Max Speeds (with offroad power)
    const accelRate = isNitro ? 55.0 : 32.0;
    const topSpeed = isNitro ? v.maxSpeed * 1.55 : v.maxSpeed;

    if (isW) {
      v.speed = Math.min(topSpeed, v.speed + accelRate * dt);
    } else if (isS) {
      v.speed = Math.max(-16.0, v.speed - 36.0 * dt);
    } else {
      v.speed *= isBrake ? 0.85 : 0.96;
    }

    if (isBrake) {
      v.speed *= 0.85;
    }

    // Nitro consumption & regeneration
    if (isNitro && isW) {
      v.nitro = Math.max(0, v.nitro - 35.0 * dt);
      fortniteAudio.playNitroBoost();
    } else {
      v.nitro = Math.min(100, v.nitro + 12.0 * dt);
    }

    // Dynamic progressive steering curve: smooth at entry, responsive at cruise, stable at top speeds
    const speedRatio = Math.min(1.0, Math.abs(v.speed) / (v.maxSpeed || 28));
    const steerSensitivity = 2.8 * (1.15 - speedRatio * 0.4);
    const moveDirSign = v.speed >= 0 ? 1 : -1;
    if (isA) {
      v.rotY += steerSensitivity * dt * moveDirSign;
      this.playerRotY += steerSensitivity * dt * moveDirSign;
      v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, -0.42, dt * 10);
    } else if (isD) {
      v.rotY -= steerSensitivity * dt * moveDirSign;
      this.playerRotY -= steerSensitivity * dt * moveDirSign;
      v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, 0.42, dt * 10);
    } else {
      v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, 0, dt * 14);
    }

    // Engine Audio Tick
    this.vehicleEngineSoundTimer += dt;
    if (this.vehicleEngineSoundTimer > 0.16) {
      this.vehicleEngineSoundTimer = 0;
      fortniteAudio.playCarEngine(Math.abs(v.speed) / v.maxSpeed, isNitro);
    }

    // Move Vehicle Position: HEADLIGHTS FIRST (along -sin(rotY), -cos(rotY) which is the front direction)
    const fwdX = -Math.sin(v.rotY);
    const fwdZ = -Math.cos(v.rotY);
    const nextVx = v.x + fwdX * v.speed * dt;
    const nextVz = v.z + fwdZ * v.speed * dt;
    const groundH = this.getGroundElevationAt(nextVx, nextVz, v.y);

    // Resolve solid collisions for the vehicle against buildings, houses, trees, and boulders
    const resolved = this.checkAndResolveSolidCollisions(nextVx, nextVz, groundH, 1.35);
    const hitObstacle = Math.hypot(resolved.x - nextVx, resolved.z - nextVz) > 0.04;

    if (hitObstacle) {
      if (Math.abs(v.speed) > 5.0) {
        this.screenShake = Math.min(0.2, Math.abs(v.speed) * 0.012);
        fortniteAudio.playHarvestHit('metal', true);
      }
      v.speed = -v.speed * 0.25; // Bounce off solid obstacle
    }

    // Keep within island bounds
    v.x = Math.max(-270, Math.min(270, resolved.x));
    v.z = Math.max(-270, Math.min(270, resolved.z));
    v.y = groundH + 0.35;

    // Sync player position to vehicle
    this.playerPos.set(v.x, v.y + 0.6, v.z);

    // Update 3D Mesh Transform & Cockpit Controls
    if (v.meshGroup) {
      v.meshGroup.position.set(v.x, v.y, v.z);
      v.meshGroup.rotation.y = v.rotY;

      // Rotate wheel meshes
      const wFL = v.meshGroup.getObjectByName('w_fl');
      const wFR = v.meshGroup.getObjectByName('w_fr');
      const wRL = v.meshGroup.getObjectByName('w_rl');
      const wRR = v.meshGroup.getObjectByName('w_rr');
      if (wFL) wFL.rotation.x += v.speed * 4 * dt;
      if (wFR) wFR.rotation.x += v.speed * 4 * dt;
      if (wRL) wRL.rotation.x += v.speed * 4 * dt;
      if (wRR) wRR.rotation.x += v.speed * 4 * dt;

      // Turn front wheel pivot
      const pivFL = v.meshGroup.getObjectByName('piv_fl');
      const pivFR = v.meshGroup.getObjectByName('piv_fr');
      if (pivFL) pivFL.rotation.y = v.steerAngle;
      if (pivFR) pivFR.rotation.y = v.steerAngle;

      // Real-time cockpit steering wheel rotation
      const steerPivot = v.meshGroup.getObjectByName('steering_pivot');
      if (steerPivot) {
        steerPivot.rotation.z = -v.steerAngle * 2.2;
      }
    }

    // Road Kill / Vehicle Collision against Bots
    if (Math.abs(v.speed) > 8.0) {
      for (const bot of this.bots) {
        if (!bot.isAlive || bot.team === this.playerTeam) continue;
        const bPos = new THREE.Vector3(bot.x, bot.y, bot.z);
        if (this.playerPos.distanceTo(bPos) < 2.8) {
          bot.health = 0;
          this.eliminateBot(bot, false, `${v.name} Impact`);
          this.screenShake = 0.12;
        }
      }
    }

    if (this.callbacks.onVehicleChange) {
      this.callbacks.onVehicleChange({ ...v });
    }
  }

  // --- DROPPED SUPPLIES & SUPPLY DROPS ---

  public spawnDroppedSupplies(x: number, y: number, z: number, weapon?: FortniteWeapon) {
    const supplyItems: DroppedSupply[] = [];

    if (weapon) {
      supplyItems.push({
        id: `drop_wep_${Date.now()}_${Math.random()}`,
        type: 'weapon',
        amount: 1,
        weapon: { ...weapon },
        x: x + (Math.random() - 0.5) * 1.5,
        y: y + 0.4,
        z: z + (Math.random() - 0.5) * 1.5,
        rotY: 0,
        name: weapon.name,
        color: weapon.color,
      });
    }

    // Material Drops (Wood +60, Stone +30, Metal +15)
    supplyItems.push({
      id: `drop_wood_${Date.now()}_${Math.random()}`,
      type: 'wood',
      amount: 60,
      x: x + (Math.random() - 0.5) * 2.0,
      y: y + 0.3,
      z: z + (Math.random() - 0.5) * 2.0,
      rotY: 0,
      name: '+60 Wood',
      color: '#f59e0b',
    });
    supplyItems.push({
      id: `drop_shield_${Date.now()}_${Math.random()}`,
      type: 'shield',
      amount: 2,
      weapon: { ...WEAPON_REGISTRY.mini_shields },
      x: x + (Math.random() - 0.5) * 2.0,
      y: y + 0.3,
      z: z + (Math.random() - 0.5) * 2.0,
      rotY: 0,
      name: 'Mini Shield Potions',
      color: '#38bdf8',
    });

    for (const item of supplyItems) {
      this.droppedSupplies.push(item);
      const mesh = this.createSupply3DMesh(item);
      this.scene.add(mesh);
      this.supplyMeshes.set(item.id, mesh);
    }
  }

  private createSupply3DMesh(item: DroppedSupply): THREE.Group {
    const group = new THREE.Group();
    group.position.set(item.x, item.y, item.z);

    if (item.type === 'weapon' && item.weapon) {
      const wepMesh = createFirstPersonWeaponRig(item.weapon.type, item.weapon.rarity);
      wepMesh.scale.set(1.4, 1.4, 1.4);
      group.add(wepMesh);

      // Glowing vertical beacon beam
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.08, 6.0, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: parseInt(item.color.replace('#', '0x') || '0xfacc15'),
        transparent: true,
        opacity: 0.65,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 3.0;
      group.add(beam);
    } else if (item.type === 'wood' || item.type === 'stone' || item.type === 'metal') {
      const matMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.35, 0.45),
        new THREE.MeshStandardMaterial({
          color: item.type === 'wood' ? 0xd97706 : item.type === 'stone' ? 0x78716c : 0x94a3b8,
          roughness: 0.6,
        })
      );
      matMesh.castShadow = true;
      group.add(matMesh);
    } else {
      const potMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.45, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.7 })
      );
      group.add(potMesh);
    }

    return group;
  }

  public spawnPeriodicSupplyDrop() {
    const dropId = `gchest_${Date.now()}`;
    const poi = ISLAND_POIS[Math.floor(Math.random() * ISLAND_POIS.length)];
    const x = poi.x + (Math.random() - 0.5) * 40;
    const z = poi.z + (Math.random() - 0.5) * 40;
    const groundH = this.getGroundElevationAt(x, z, 0);
    const y = groundH + 0.1;

    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Grounded Tactical Chest Prop (Small, grounded chest prop)
    const chestBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.4, roughness: 0.5 })
    );
    chestBase.position.y = 0.35;
    chestBase.castShadow = true;
    group.add(chestBase);

    const chestLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 1.4, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x92400e, metalness: 0.5, roughness: 0.4 })
    );
    chestLid.position.set(0, 0.7, 0);
    chestLid.rotation.z = Math.PI / 2;
    group.add(chestLid);

    // Gold trim & latch
    const latch = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.25, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 })
    );
    latch.position.set(0, 0.5, 0.48);
    group.add(latch);

    // Tactical Golden Light Beam rising from the grounded chest
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.35, 60, 8),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.65 })
    );
    beam.position.y = 30;
    group.add(beam);

    this.scene.add(group);
    this.supplyDropBoxes.push({
      id: dropId,
      group,
      x,
      y,
      z,
      vy: 0,
      isLanded: true,
      tier: 'legendary_supply',
    });

    fortniteAudio.playSupplyDropSpawn();
  }

  private updateDroppedSupplies(dt: number) {
    const time = performance.now() * 0.003;

    // 1. Hover & rotate dropped item meshes
    for (let i = this.droppedSupplies.length - 1; i >= 0; i--) {
      const item = this.droppedSupplies[i];
      const mesh = this.supplyMeshes.get(item.id);
      if (mesh) {
        mesh.rotation.y = time;
        mesh.position.y = item.y + Math.sin(time * 3) * 0.08;
      }

      // Auto-vacuum materials & ammo within 2.8m
      const dist = this.playerPos.distanceTo(new THREE.Vector3(item.x, item.y, item.z));
      if (dist < 2.8 && item.type !== 'weapon') {
        if (item.type === 'wood') {
          this.wood = Math.min(999, this.wood + item.amount);
          if (this.callbacks.onItemCollected) {
            this.callbacks.onItemCollected({
              id: `col_drop_${Date.now()}_${Math.random()}`,
              title: `+${item.amount} WOOD`,
              subtitle: `Total: ${this.wood}`,
              icon: '🪵',
              amount: `+${item.amount}`,
              type: 'material',
              color: '#f59e0b',
              timestamp: Date.now(),
            });
          }
        } else if (item.type === 'stone') {
          this.stone = Math.min(999, this.stone + item.amount);
          if (this.callbacks.onItemCollected) {
            this.callbacks.onItemCollected({
              id: `col_drop_${Date.now()}_${Math.random()}`,
              title: `+${item.amount} STONE`,
              subtitle: `Total: ${this.stone}`,
              icon: '🪨',
              amount: `+${item.amount}`,
              type: 'material',
              color: '#a8a29e',
              timestamp: Date.now(),
            });
          }
        } else if (item.type === 'metal') {
          this.metal = Math.min(999, this.metal + item.amount);
          if (this.callbacks.onItemCollected) {
            this.callbacks.onItemCollected({
              id: `col_drop_${Date.now()}_${Math.random()}`,
              title: `+${item.amount} METAL`,
              subtitle: `Total: ${this.metal}`,
              icon: '🔩',
              amount: `+${item.amount}`,
              type: 'material',
              color: '#94a3b8',
              timestamp: Date.now(),
            });
          }
        } else if (item.type === 'shield') {
          this.shield = Math.min(this.maxShield, this.shield + 25);
          this.callbacks.onHealthChange(this.health, this.shield);
          if (this.callbacks.onItemCollected) {
            this.callbacks.onItemCollected({
              id: `col_drop_${Date.now()}_${Math.random()}`,
              title: `+2 Mini Shield Potions`,
              subtitle: `Shield: ${Math.round(this.shield)}/${this.maxShield}`,
              icon: '🛡️',
              amount: '+25 Shield',
              type: 'shield',
              color: '#38bdf8',
              timestamp: Date.now(),
            });
          }
        }

        this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
        fortniteAudio.playSupplyPickup(item.type);

        if (mesh) this.scene.remove(mesh);
        this.supplyMeshes.delete(item.id);
        this.droppedSupplies.splice(i, 1);
      }
    }

    // 2. Parachute Supply Drop Boxes
    for (const box of this.supplyDropBoxes) {
      if (!box.isLanded) {
        box.y += box.vy * dt;
        const groundH = getTerrainHeight(box.x, box.z) + 1.1;
        if (box.y <= groundH) {
          box.y = groundH;
          box.isLanded = true;
          const balloon = box.group.getObjectByName('balloon');
          if (balloon) balloon.visible = false;
          fortniteAudio.playTouchdown();
        }
        box.group.position.set(box.x, box.y, box.z);
      }
    }

    // 3. Spawn periodic supply drops every 45s
    this.nextSupplyDropTimer -= dt;
    if (this.nextSupplyDropTimer <= 0) {
      this.nextSupplyDropTimer = 45.0;
      this.spawnPeriodicSupplyDrop();
    }
  }

  // --- CHESTS & INTERACTION ---

  private interactChestOrItem() {
    // 0. Check if near Reset Pedestal (in 1v1 Arena Mode)
    if (this.resetPedestalPos) {
      const pDist = this.playerPos.distanceTo(
        new THREE.Vector3(this.resetPedestalPos.x, this.resetPedestalPos.y, this.resetPedestalPos.z)
      );
      if (pDist < 4.5) {
        this.resetAllBuildings();
        return;
      }
    }

    // 0.1 Check if near Upgrade Bench
    for (const bench of this.upgradeBenches) {
      const bDist = this.playerPos.distanceTo(new THREE.Vector3(bench.x, bench.y, bench.z));
      if (bDist < 4.5) {
        if (this.callbacks.onOpenShop) {
          this.callbacks.onOpenShop();
        }
        return;
      }
    }

    // 1. Check if near any Vehicle (Enter / Drive)
    if (this.activeVehicle) {
      this.exitVehicle();
      return;
    }

    for (const v of this.vehicles) {
      const vPos = new THREE.Vector3(v.x, v.y, v.z);
      if (this.playerPos.distanceTo(vPos) < 4.2) {
        this.enterVehicle(v);
        return;
      }
    }

    // 2. Check if near any Supply Drop Box
    for (const box of this.supplyDropBoxes) {
      if (box.isLanded) {
        const bPos = new THREE.Vector3(box.x, box.y, box.z);
        if (this.playerPos.distanceTo(bPos) < 4.0) {
          this.scene.remove(box.group);
          this.supplyDropBoxes = this.supplyDropBoxes.filter((b) => b.id !== box.id);
          this.dropLootFromChest({ id: box.id, x: box.x, y: box.y, z: box.z, rotY: 0, isOpened: false, tier: 'rare_chest' });
          fortniteAudio.playChestOpen();

          if (this.callbacks.onItemCollected) {
            this.callbacks.onItemCollected({
              id: `col_dropbox_${Date.now()}`,
              title: 'Supply Drop Claimed!',
              subtitle: 'Legendary High-Tier Armory Loot',
              icon: '🪂',
              rarity: 'legendary',
              type: 'supply_drop',
              color: '#3b82f6',
              timestamp: Date.now(),
            });
          }
          return;
        }
      }
    }

    // 3. Check if near any Ground Weapon to swap/pickup
    for (let i = 0; i < this.droppedSupplies.length; i++) {
      const item = this.droppedSupplies[i];
      if (item.type === 'weapon' && item.weapon) {
        const iPos = new THREE.Vector3(item.x, item.y, item.z);
        if (this.playerPos.distanceTo(iPos) < 3.8) {
          const currentHeld = this.inventory[this.activeSlot];
          this.inventory[this.activeSlot] = { ...item.weapon };

          // Remove item from ground
          const mesh = this.supplyMeshes.get(item.id);
          if (mesh) this.scene.remove(mesh);
          this.supplyMeshes.delete(item.id);
          this.droppedSupplies.splice(i, 1);

          // If previously had weapon, drop it
          if (currentHeld && currentHeld.type !== 'pickaxe') {
            this.spawnDroppedSupplies(this.playerPos.x, this.playerPos.y, this.playerPos.z, currentHeld);
          }

          this.updateWeaponRigs();
          this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
          fortniteAudio.playSupplyPickup('weapon');

          if (this.callbacks.onItemCollected) {
            this.callbacks.onItemCollected({
              id: `col_wep_${Date.now()}`,
              title: `Equipped ${item.weapon.name}`,
              subtitle: `${item.weapon.rarity.toUpperCase()} • ${item.weapon.damage} DMG • Slot ${this.activeSlot}`,
              icon: item.weapon.icon,
              rarity: item.weapon.rarity,
              type: 'weapon',
              color: item.weapon.color,
              timestamp: Date.now(),
            });
          }
          return;
        }
      }
    }

    // 4. Check Loot Chests
    for (const chest of this.chests) {
      if (chest.isOpened) continue;
      const cPos = new THREE.Vector3(chest.x, chest.y, chest.z);
      if (this.playerPos.distanceTo(cPos) < 4.5) {
        chest.isOpened = true;
        this.chestsOpened++;
        fortniteAudio.playChestOpen();

        const group = this.chestMeshes.get(chest.id);
        if (group) {
          const lid = group.getObjectByName('chest_lid');
          if (lid) lid.rotateZ(-Math.PI / 3);
        }

        this.dropLootFromChest(chest);
        return;
      }
    }
  }

  private dropLootFromChest(chest: LootChest) {
    const rareGuns = [
      WEAPON_REGISTRY.ar_scar,
      WEAPON_REGISTRY.shotgun_pump_legendary,
      WEAPON_REGISTRY.sniper_bolt_legendary,
      WEAPON_REGISTRY.smg_p90_epic,
      WEAPON_REGISTRY.rocket_launcher_gold,
      WEAPON_REGISTRY.shotgun_tactical_gold,
      WEAPON_REGISTRY.chug_splash,
    ];
    const pickedGun = rareGuns[Math.floor(Math.random() * rareGuns.length)];

    const emptySlot = this.inventory.findIndex((s, idx) => idx > 0 && s === null);
    if (emptySlot !== -1) {
      this.inventory[emptySlot] = { ...pickedGun };
      this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
    } else {
      this.spawnDroppedSupplies(chest.x, chest.y + 0.5, chest.z, pickedGun);
    }

    this.wood = Math.min(999, this.wood + 80);
    this.shield = Math.min(this.maxShield, this.shield + 50);
    this.gold = Math.min(9999, this.gold + 75);
    this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);
    this.callbacks.onHealthChange(this.health, this.shield);
    this.callbacks.onGoldChange?.(this.gold);

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `col_chest_${Date.now()}`,
        title: 'Opened Loot Chest',
        subtitle: `+80 Wood • +50 Shield • +75 Gold • ${pickedGun.name}`,
        icon: '📦',
        rarity: pickedGun.rarity,
        type: 'chest',
        color: '#f59e0b',
        timestamp: Date.now(),
      });
    }
  }

  private eliminateBot(bot: BotPlayer, isHeadshot: boolean, weaponName: string) {
    bot.isAlive = false;
    const rig = this.botMeshes.get(bot.id);
    if (rig) {
      this.scene.remove(rig.root);
    }

    // Spawn Dropped Supplies at bot's location!
    this.spawnDroppedSupplies(bot.x, bot.y, bot.z, bot.weapon);

    this.eliminations++;
    this.gold = Math.min(9999, this.gold + 150);
    this.callbacks.onGoldChange?.(this.gold);
    fortniteAudio.playEliminationFanfare(isHeadshot);

    // Apply Armory Siphon Perk if unlocked
    if (this.profile?.armoryPerks?.siphonShield) {
      const siphonAmount = 35;
      if (this.shield < this.maxShield) {
        this.shield = Math.min(this.maxShield, this.shield + siphonAmount);
      } else if (this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + siphonAmount);
      }
      this.callbacks.onHealthChange(this.health, this.shield);
      this.addDamageNumber('+35 SIPHON SHIELD 🩸', '#06b6d4', false, false, this.playerPos.x, this.playerPos.y + 2.0, this.playerPos.z);
    }

    const distToBot = Math.round(this.playerPos.distanceTo(new THREE.Vector3(bot.x, bot.y, bot.z)));
    const xpEarned = isHeadshot ? 150 : 100;

    // Celebratory 3D floating numbers
    this.addDamageNumber(
      isHeadshot ? '🎯 HEADSHOT ELIMINATION!' : '💀 ELIMINATED!',
      isHeadshot ? '#fbbf24' : '#ef4444',
      isHeadshot,
      false,
      bot.x,
      bot.y + 2.6,
      bot.z
    );
    this.addDamageNumber(
      `+${xpEarned} XP • +150 GOLD • +40 🅢 (COINS)`,
      '#38bdf8',
      false,
      false,
      bot.x,
      bot.y + 3.4,
      bot.z
    );

    const currentWep = this.getCurrentWeapon();
    const bannerData: EliminationBannerData = {
      id: `elim_banner_${Date.now()}`,
      victim: bot.name,
      weaponName: weaponName || (currentWep ? currentWep.name : 'Harvesting Tool'),
      weaponIcon: currentWep ? currentWep.icon : '⛏️',
      rarity: currentWep ? currentWep.rarity : 'common',
      isHeadshot,
      eliminationCount: this.eliminations,
      distance: distToBot,
      xpEarned,
      timestamp: Date.now(),
    };

    if (this.callbacks.onEliminationBanner) {
      this.callbacks.onEliminationBanner(bannerData);
    }

    const log: EliminationLog = {
      id: `elim_${Date.now()}`,
      killer: this.profile.name || 'You',
      victim: bot.name,
      weaponName: bannerData.weaponName,
      isHeadshot,
      time: Date.now(),
    };
    this.callbacks.onElimination(log);

    // 1v1 Arena Mode Round Scoring
    if (this.mode === '1v1_build_fight') {
      this.arena1v1State.playerScore++;
      this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });

      if (this.arena1v1State.playerScore >= 3) {
        this.triggerVictoryRoyale();
      } else {
        this.arena1v1State.isRoundOver = true;
        this.arena1v1State.roundWinner = 'player';
        this.arena1v1State.countdown = 3;
        this.roundCountdownTimer = 0;
        this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });
      }
      return;
    }

    const remaining = this.bots.filter((b) => b.isAlive).length + 1;
    this.callbacks.onPlayersLeftChange(remaining);

    // End game with Victory Royale when player's team is the only one left
    this.checkTeamVictoryCondition();
  }

  public checkTeamVictoryCondition() {
    if (this.isGameOver) return;
    if (this.mode === '1v1_build_fight') return;
    const aliveEnemyBots = this.bots.filter((b) => b.isAlive && b.team !== this.playerTeam);
    if (aliveEnemyBots.length === 0) {
      this.triggerVictoryRoyale();
    }
  }

  private triggerVictoryRoyale() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    fortniteAudio.playVictoryRoyale();

    // Economy & Rewards: Base match completion coins + 40 coins per AI bot eliminated
    const baseCoins = 100;
    const eliminationBonusCoins = this.eliminations * 40;
    const vbucksEarned = baseCoins + eliminationBonusCoins;

    const stats: MatchStats = {
      placement: 1,
      totalPlayers: this.bots.length + 1,
      eliminations: this.eliminations,
      damageDealt: this.damageDealt,
      damageTaken: this.damageTaken,
      structuresBuilt: this.structuresBuilt,
      chestsOpened: this.chestsOpened,
      accuracy: this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      timeSurvived: Math.floor((Date.now() - this.matchStartTime) / 1000),
      xpEarned: 1400 + this.eliminations * 250,
      vbucksEarned,
      baseCoins,
      eliminationBonusCoins,
    };

    this.callbacks.onMatchEnd(true, stats);
  }

  public triggerEliminated() {
    if (this.isGameOver) return;

    if (this.mode === '1v1_build_fight') {
      this.arena1v1State.botScore++;
      this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });

      if (this.arena1v1State.botScore >= 3) {
        this.isGameOver = true;
        const baseCoins = 50;
        const eliminationBonusCoins = this.eliminations * 40;
        const vbucksEarned = baseCoins + eliminationBonusCoins;

        const stats: MatchStats = {
          placement: 2,
          totalPlayers: 2,
          eliminations: this.eliminations,
          damageDealt: this.damageDealt,
          damageTaken: this.damageTaken,
          structuresBuilt: this.structuresBuilt,
          chestsOpened: this.chestsOpened,
          accuracy: this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0,
          shotsFired: this.shotsFired,
          shotsHit: this.shotsHit,
          timeSurvived: Math.floor((Date.now() - this.matchStartTime) / 1000),
          xpEarned: 600 + this.eliminations * 150,
          vbucksEarned,
          baseCoins,
          eliminationBonusCoins,
        };
        this.callbacks.onMatchEnd(false, stats);
      } else {
        this.arena1v1State.isRoundOver = true;
        this.arena1v1State.roundWinner = 'bot';
        this.arena1v1State.countdown = 3;
        this.roundCountdownTimer = 0;
        this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });
      }
      return;
    }

    this.isGameOver = true;
    const remaining = this.bots.filter((b) => b.isAlive).length + 1;
    const baseCoins = 50;
    const eliminationBonusCoins = this.eliminations * 40;
    const vbucksEarned = baseCoins + eliminationBonusCoins;

    const stats: MatchStats = {
      placement: remaining,
      totalPlayers: this.bots.length + 1,
      eliminations: this.eliminations,
      damageDealt: this.damageDealt,
      damageTaken: this.damageTaken,
      structuresBuilt: this.structuresBuilt,
      chestsOpened: this.chestsOpened,
      accuracy: this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      timeSurvived: Math.floor((Date.now() - this.matchStartTime) / 1000),
      xpEarned: 500 + this.eliminations * 150,
      vbucksEarned,
      baseCoins,
      eliminationBonusCoins,
    };

    this.callbacks.onMatchEnd(false, stats);
  }

  // --- 1V1 ARENA RESETS & SHOP UPGRADES ---

  public resetAllBuildings() {
    for (const [, item] of this.buildingPieces) {
      this.scene.remove(item.mesh);
    }
    this.buildingPieces.clear();
    this.spatialGrid.clearBuildingPieces();
    fortniteAudio.playHarvestHit('metal', true);

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `reset_${Date.now()}`,
        title: 'Arena Builds Reset!',
        subtitle: 'All structures demolished instantly',
        icon: '🧹',
        type: 'material',
        color: '#38bdf8',
        timestamp: Date.now(),
      });
    }
  }

  public spawnArenaGroundLoot() {
    // Clear old arena dropped loot meshes from the scene
    for (const supply of this.droppedSupplies) {
      const mesh = this.supplyMeshes.get(supply.id);
      if (mesh) {
        this.scene.remove(mesh);
      }
    }
    this.droppedSupplies = [];
    this.supplyMeshes.clear();

    // Spread iconic weapons and consumables directly across the arena floor
    const arenaLootSpots: { x: number; z: number; weaponKey: string }[] = [
      { x: -12, z: 0, weaponKey: 'ar_scar' },
      { x: 12, z: 0, weaponKey: 'shotgun_pump_legendary' },
      { x: -8, z: 12, weaponKey: 'shotgun_tac_legendary' },
      { x: 8, z: 12, weaponKey: 'smg_combat_legendary' },
      { x: -14, z: -10, weaponKey: 'sniper_heavy_legendary' },
      { x: 14, z: -10, weaponKey: 'rpg_legendary' },
      { x: 0, z: -14, weaponKey: 'blade_kinetic_exotic' },
      { x: 0, z: 14, weaponKey: 'chug_jug' },
      { x: -6, z: -6, weaponKey: 'mini_shields' },
      { x: 6, z: -6, weaponKey: 'slurp_juice' },
      { x: -16, z: 6, weaponKey: 'smg_p90_epic' },
      { x: 16, z: 6, weaponKey: 'ar_burst_epic' },
    ];

    for (const spot of arenaLootSpots) {
      const wep = WEAPON_REGISTRY[spot.weaponKey];
      if (wep) {
        this.spawnDroppedSupplies(spot.x, 0.2, spot.z, { ...wep });
      }
    }
  }

  public updatePlayerSkin(skinId: string) {
    this.profile.selectedSkin = skinId;
    if (this.thirdPersonRig) {
      this.scene.remove(this.thirdPersonRig.root);
    }
    const currentWep = this.getCurrentWeapon();
    const type = currentWep ? currentWep.type : 'pickaxe';
    const rarity = currentWep ? currentWep.rarity : 'common';
    this.thirdPersonRig = buildCharacterModel(skinId, type, rarity);

    this.playerNameTag = createNameTagSprite(
      this.profile.name || 'Player',
      false,
      this.playerTeam,
      Math.max(0, this.health / this.maxHealth),
      Math.max(0, this.shield / this.maxShield)
    );
    this.thirdPersonRig.root.add(this.playerNameTag);
    this.thirdPersonRig.root.visible = !this.isFirstPerson;
    this.scene.add(this.thirdPersonRig.root);
  }

  public reset1v1Round(winner: 'player' | 'bot') {
    this.resetAllBuildings();
    this.spawnArenaGroundLoot();
    this.arena1v1State.round++;
    this.arena1v1State.isRoundOver = false;
    this.arena1v1State.roundWinner = null;
    this.arena1v1State.countdown = 0;
    this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });

    // Reset Player to High Health (300 HP + 300 Shield = 600 Total HP) & 0 builds
    this.health = 300;
    this.shield = 300;
    this.wood = 0;
    this.stone = 0;
    this.metal = 0;
    this.playerPos.set(this.playerSpawnPos.x, this.playerSpawnPos.y + 0.2, this.playerSpawnPos.z);
    this.playerVel.set(0, 0, 0);
    this.playerRotY = 0;
    this.playerPitch = 0;
    this.callbacks.onHealthChange(this.health, this.shield);
    this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);

    // Reset Bot to High Health (300 HP + 300 Shield)
    const diff = this.arena1v1State.botDifficulty || 'pro';
    const config = getBotDifficultyConfig(diff);

    for (const bot of this.bots) {
      bot.isAlive = true;
      bot.name = config.name;
      bot.accuracy = config.accuracy;
      bot.reactionTimer = config.reactionTimer;
      bot.health = 300;
      bot.shield = 300;
      bot.x = this.botSpawnPos.x;
      bot.y = this.botSpawnPos.y + 0.2;
      bot.z = this.botSpawnPos.z;
      bot.vx = 0;
      bot.vy = 0;
      bot.vz = 0;
      bot.rotY = Math.PI;
      bot.state = 'combat';

      const rig = this.botMeshes.get(bot.id);
      if (rig) {
        rig.root.position.set(bot.x, bot.y, bot.z);
        this.scene.add(rig.root);
      }
      const nTag = this.botNameTags.get(bot.id);
      if (nTag) {
        updateNameTagSprite(nTag, bot.name, true, bot.team, 1.0, 1.0);
        this.scene.add(nTag);
      }
    }
    fortniteAudio.startGameMusic();
  }

  public setBotDifficulty(difficulty: 'casual' | 'normal' | 'pro' | 'god') {
    this.arena1v1State.botDifficulty = difficulty;
    const config = getBotDifficultyConfig(difficulty);

    for (const bot of this.bots) {
      if (this.mode === '1v1_build_fight') {
        bot.name = config.name;
        bot.accuracy = config.accuracy;
        bot.reactionTimer = config.reactionTimer;

        const nTag = this.botNameTags.get(bot.id);
        if (nTag) {
          updateNameTagSprite(
            nTag,
            bot.name,
            true,
            bot.team,
            Math.max(0, bot.health / 300),
            Math.max(0, bot.shield / 300)
          );
        }
      }
    }

    this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `diff_${Date.now()}`,
        title: `AI Difficulty: ${difficulty.toUpperCase()}`,
        subtitle: `${config.name} is now active`,
        icon: '⚡',
        type: 'weapon',
        color: difficulty === 'god' ? '#ef4444' : difficulty === 'pro' ? '#f59e0b' : difficulty === 'normal' ? '#eab308' : '#22c55e',
        timestamp: Date.now(),
      });
    }
  }

  public placeBotPiece(bot: BotPlayer, type: BuildType, material: MaterialType = 'wood') {
    const pieceId = `bot_build_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const botPos = new THREE.Vector3(bot.x, bot.y, bot.z);
    const lookDir = new THREE.Vector3(-Math.sin(bot.rotY), 0.2, -Math.cos(bot.rotY));
    const snapped = snapToBuildGrid(botPos, lookDir, type);
    const matInfo = MATERIAL_STATS[material];

    const piece: BuildingPiece = {
      id: pieceId,
      type,
      material,
      x: snapped.x,
      y: snapped.y,
      z: snapped.z,
      rotY: snapped.rotY,
      health: matInfo.initialHp,
      maxHealth: matInfo.maxHp,
      ownerId: bot.id,
      createdAt: Date.now(),
    };

    const mesh = createPlacedBuildingMesh(piece);
    this.scene.add(mesh);
    this.buildingPieces.set(pieceId, { piece, mesh });
    this.spatialGrid.addBuildingPiece(piece);
    fortniteAudio.playBuildPlace(material);
  }

  public upgradeEquippedWeapon(slotIndex: number): boolean {
    const wep = this.inventory[slotIndex];
    if (!wep || wep.type === 'pickaxe') return false;

    const currentRarity = wep.rarity;
    let nextRarity: WeaponRarity = 'uncommon';
    let cost = 150;

    if (currentRarity === 'common') {
      nextRarity = 'uncommon';
      cost = 150;
    } else if (currentRarity === 'uncommon') {
      nextRarity = 'rare';
      cost = 250;
    } else if (currentRarity === 'rare') {
      nextRarity = 'epic';
      cost = 400;
    } else if (currentRarity === 'epic') {
      nextRarity = 'legendary';
      cost = 600;
    } else if (currentRarity === 'legendary') {
      nextRarity = 'mythic';
      cost = 1000;
    } else {
      return false; // Already max
    }

    if (this.gold < cost) {
      fortniteAudio.playUiClick();
      return false;
    }

    this.gold -= cost;
    wep.rarity = nextRarity;
    wep.damage = Math.round(wep.damage * 1.18);
    wep.reloadTime = Math.max(0.8, Number((wep.reloadTime * 0.88).toFixed(2)));
    wep.color = RARITY_COLORS[nextRarity].hex;
    wep.name = `${wep.name.replace(/^(Common|Uncommon|Rare|Epic|Legendary|Mythic)\s*/i, '')} (${nextRarity.toUpperCase()})`;

    fortniteAudio.playPurchaseSuccess();
    this.callbacks.onGoldChange?.(this.gold);
    this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
    this.updateWeaponRigs();

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `upgrade_${Date.now()}`,
        title: `Upgraded to ${nextRarity.toUpperCase()}!`,
        subtitle: `-${cost} Gold • Damage: ${wep.damage}`,
        icon: '⭐',
        rarity: nextRarity,
        type: 'weapon',
        color: wep.color,
        timestamp: Date.now(),
      });
    }
    return true;
  }

  public attachWeaponMod(slotIndex: number, modId: string): boolean {
    const wep = this.inventory[slotIndex];
    if (!wep || wep.type === 'pickaxe') return false;

    const mod = SHOP_CATALOG.mods.find((m) => m.id === modId);
    if (!mod || this.gold < mod.costGold) return false;

    if (!wep.mods) wep.mods = {};
    const modType = mod.type as keyof typeof wep.mods;
    if (wep.mods[modType]) return false;

    this.gold -= mod.costGold;
    (wep.mods as any)[modType] = mod.bonus;

    if (mod.type === 'damageBonus') wep.damage = Math.round(wep.damage * (1 + mod.bonus));
    if (mod.type === 'spreadBonus') wep.spread = Math.max(0.001, wep.spread * (1 - mod.bonus));
    if (mod.type === 'magBonus') {
      wep.magazineSize += Math.round(mod.bonus);
      wep.currentAmmo += Math.round(mod.bonus);
    }
    if (mod.type === 'reloadBonus') wep.reloadTime = Math.max(0.8, Number((wep.reloadTime * (1 - mod.bonus)).toFixed(2)));

    fortniteAudio.playPurchaseSuccess();
    this.callbacks.onGoldChange?.(this.gold);
    this.callbacks.onInventoryChange(this.inventory, this.activeSlot);

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `mod_${Date.now()}`,
        title: `Attached ${mod.name}!`,
        subtitle: `${mod.desc}`,
        icon: mod.icon,
        type: 'weapon',
        color: '#a855f7',
        timestamp: Date.now(),
      });
    }
    return true;
  }

  public buyHealthPack(item: any): boolean {
    const cost = item.costGold || item.cost || 100;
    if (this.gold < cost) return false;

    const regWep = WEAPON_REGISTRY[item.id];
    const emptySlot = this.inventory.findIndex((s, idx) => idx > 0 && s === null);
    if (emptySlot === -1 || !regWep) {
      if (item.shieldBonus || item.shieldAmount) this.shield = Math.min(this.maxShield, this.shield + (item.shieldBonus || item.shieldAmount || 50));
      if (item.healthBonus || item.healAmount) this.health = Math.min(this.maxHealth, this.health + (item.healthBonus || item.healAmount || 50));
      this.callbacks.onHealthChange(this.health, this.shield);
    } else {
      this.inventory[emptySlot] = { ...regWep };
      this.callbacks.onInventoryChange(this.inventory, this.activeSlot);
    }

    this.gold -= cost;
    fortniteAudio.playSupplyPickup('shield');
    this.callbacks.onGoldChange?.(this.gold);

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `buy_hp_${Date.now()}`,
        title: `Purchased ${item.name}`,
        subtitle: `-${cost} Gold`,
        icon: item.icon || '🧪',
        type: 'shield',
        color: '#06b6d4',
        timestamp: Date.now(),
      });
    }
    return true;
  }

  public buyMaterials(type: 'wood' | 'stone' | 'metal', amount: number, cost: number): boolean {
    if (this.gold < cost) return false;
    this.gold -= cost;

    if (type === 'wood') this.wood = Math.min(999, this.wood + amount);
    else if (type === 'stone') this.stone = Math.min(999, this.stone + amount);
    else if (type === 'metal') this.metal = Math.min(999, this.metal + amount);

    fortniteAudio.playSupplyPickup('wood');
    this.callbacks.onGoldChange?.(this.gold);
    this.callbacks.onMaterialsChange(this.wood, this.stone, this.metal);

    if (this.callbacks.onItemCollected) {
      this.callbacks.onItemCollected({
        id: `buy_mat_${Date.now()}`,
        title: `+${amount} ${type.toUpperCase()}`,
        subtitle: `-${cost} Gold`,
        icon: type === 'wood' ? '🪵' : type === 'stone' ? '🪨' : '🔩',
        type: 'material',
        color: type === 'wood' ? '#f59e0b' : type === 'stone' ? '#a8a29e' : '#94a3b8',
        timestamp: Date.now(),
      });
    }
    return true;
  }

  // --- MAIN SIMULATION LOOP ---

  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.isGameOver) {
      // 1v1 Round End Countdown
      if (this.mode === '1v1_build_fight' && this.arena1v1State.isRoundOver) {
        this.roundCountdownTimer += dt;
        const remaining = Math.max(0, Math.ceil(3 - this.roundCountdownTimer));
        if (this.arena1v1State.countdown !== remaining) {
          this.arena1v1State.countdown = remaining;
          this.callbacks.onArena1v1Update?.({ ...this.arena1v1State });
        }
        if (this.roundCountdownTimer >= 3) {
          this.roundCountdownTimer = 0;
          this.reset1v1Round(this.arena1v1State.roundWinner || 'player');
        }
      }

      if (this.activeVehicle) {
        this.updateVehicleDriving(dt);
      } else {
        this.updateSkydivingAndMovement(dt);
      }

      if (this.gameStarted) {
        if (this.mode !== '1v1_build_fight') {
          this.updateStorm(dt);
        }
        this.updateBots(dt);
      }
      this.updateBuildingHologram();
      this.updateDamageNumbers(dt);
      this.updateBulletTracers(dt);
      this.updateHarvestParticles(dt);
      this.updateHarvestWobbles(dt);
      this.updateShellCasings(dt);
      this.updateDroppedSupplies(dt);
      this.updateScopeTrajectory();
      this.updateInteractionPrompts();
      this.updateNetworkSync(now);

      // Auto fire / continuous swing for AR, SMG, and Pickaxe if mouse held
      const wep = this.getCurrentWeapon();
      if (this.isMouseDown && wep && (wep.type === 'ar' || wep.type === 'smg' || wep.type === 'pickaxe') && !this.activeVehicle) {
        this.fireActiveWeapon();
      }
    }

    this.updateCameraAndRigs(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateInteractionPrompts() {
    if (this.activeVehicle) {
      const msg = `DRIVING ${this.activeVehicle.name} • [E / F] EXIT • [SHIFT] NITRO • [SPACE] DRIFT`;
      if (this.lastNearCarPrompt !== msg) {
        this.lastNearCarPrompt = msg;
        this.callbacks.onNearVehiclePrompt?.(msg);
      }
      return;
    }

    // Check near vehicle
    let nearCarPrompt: string | null = null;
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const dx = this.playerPos.x - v.x;
      const dy = this.playerPos.y - v.y;
      const dz = this.playerPos.z - v.z;
      if (dx * dx + dy * dy + dz * dz < 18.0) {
        nearCarPrompt = `[E] DRIVE ${v.name.toUpperCase()}`;
        break;
      }
    }
    if (this.lastNearCarPrompt !== nearCarPrompt) {
      this.lastNearCarPrompt = nearCarPrompt;
      this.callbacks.onNearVehiclePrompt?.(nearCarPrompt);
    }

    // Check near Upgrade Bench or Reset Pedestal
    let benchPrompt: string | null = null;
    if (this.resetPedestalPos) {
      const pDist = this.playerPos.distanceTo(
        new THREE.Vector3(this.resetPedestalPos.x, this.resetPedestalPos.y, this.resetPedestalPos.z)
      );
      if (pDist < 5.0) {
        benchPrompt = `[E] RESET 1V1 ARENA BUILDS`;
      }
    }

    if (!benchPrompt) {
      for (const bench of this.upgradeBenches) {
        const bDist = this.playerPos.distanceTo(new THREE.Vector3(bench.x, bench.y, bench.z));
        if (bDist < 5.0) {
          benchPrompt = `[E] USE UPGRADE BENCH (OR PRESS [B])`;
          break;
        }
      }
    }

    if (this.lastNearUpgradeBenchPrompt !== benchPrompt) {
      this.lastNearUpgradeBenchPrompt = benchPrompt;
      this.callbacks.onNearUpgradeBenchPrompt?.(benchPrompt);
    }

    // Check near supply
    if (this.callbacks.onNearSupplyPrompt) {
      let supplyPrompt: string | null = null;
      for (let i = 0; i < this.droppedSupplies.length; i++) {
        const item = this.droppedSupplies[i];
        if (item.type === 'weapon' && item.weapon) {
          const dx = this.playerPos.x - item.x;
          const dy = this.playerPos.y - item.y;
          const dz = this.playerPos.z - item.z;
          if (dx * dx + dy * dy + dz * dz < 14.5) {
            supplyPrompt = `[E] SWAP FOR ${item.weapon.name.toUpperCase()}`;
            break;
          }
        }
      }
      if (!supplyPrompt) {
        for (let i = 0; i < this.supplyDropBoxes.length; i++) {
          const box = this.supplyDropBoxes[i];
          if (box.isLanded) {
            const dx = this.playerPos.x - box.x;
            const dy = this.playerPos.y - box.y;
            const dz = this.playerPos.z - box.z;
            if (dx * dx + dy * dy + dz * dz < 16.0) {
              supplyPrompt = `[E] OPEN LEGENDARY SUPPLY CRATE`;
              break;
            }
          }
        }
      }
      if (this.lastNearSupplyPrompt !== supplyPrompt) {
        this.lastNearSupplyPrompt = supplyPrompt;
        this.callbacks.onNearSupplyPrompt(supplyPrompt);
      }
    }
  }

  // --- FAST RESPONSIVE MOVEMENT & SOLID COLLISION (SPATIAL GRID OPTIMIZED) ---

  private getGroundElevationAt(x: number, z: number, currentY: number): number {
    let highestY = this.mode === '1v1_build_fight' ? 0.0 : getTerrainHeight(x, z);

    // 1. Fast local query for player placed floors, ramps, and cones
    const nearbyPieces = this.spatialGrid.queryBuildingPiecesNear(x, z, 3.5);
    for (let i = 0; i < nearbyPieces.length; i++) {
      const piece = nearbyPieces[i];
      if (piece.type === 'floor') {
        if (Math.abs(x - piece.x) <= 2.2 && Math.abs(z - piece.z) <= 2.2) {
          if (currentY >= piece.y - 1.5) {
            highestY = Math.max(highestY, piece.y);
          }
        }
      } else if (piece.type === 'ramp') {
        const rampH = calculateRampHeightAt(piece, x, z);
        if (rampH !== null && currentY >= rampH - 1.5) {
          highestY = Math.max(highestY, rampH);
        }
      } else if (piece.type === 'cone') {
        if (Math.abs(x - piece.x) <= 2.1 && Math.abs(z - piece.z) <= 2.1) {
          const dist = Math.hypot(x - piece.x, z - piece.z);
          const coneH = piece.y + Math.max(0, (2.0 - dist) * 0.5);
          if (currentY >= coneH - 1.5) {
            highestY = Math.max(highestY, coneH);
          }
        }
      }
    }

    // 2. Fast local query for static building stairs, floors, step slabs, roofs, dam, bridges
    const nearbyColliders = this.spatialGrid.queryNear(x, z, 4.0);
    for (let i = 0; i < nearbyColliders.length; i++) {
      const col = nearbyColliders[i];
      if (
        col.type === 'box' &&
        col.minX !== undefined &&
        col.maxX !== undefined &&
        col.minZ !== undefined &&
        col.maxZ !== undefined &&
        col.maxY !== undefined
      ) {
        if (x >= col.minX - 0.25 && x <= col.maxX + 0.25 && z >= col.minZ - 0.25 && z <= col.maxZ + 0.25) {
          if (currentY >= col.maxY - 1.5) {
            highestY = Math.max(highestY, col.maxY);
          }
        }
      } else if (
        col.type === 'cylinder' &&
        col.x !== undefined &&
        col.z !== undefined &&
        col.radius !== undefined &&
        col.maxY !== undefined
      ) {
        const dist = Math.hypot(x - col.x, z - col.z);
        if (dist <= col.radius + 0.25) {
          if (currentY >= col.maxY - 1.5) {
            highestY = Math.max(highestY, col.maxY);
          }
        }
      }
    }

    return highestY;
  }

  public checkAndResolveSolidCollisions(
    newX: number,
    newZ: number,
    currentY: number,
    radius: number = 0.48
  ): { x: number; z: number } {
    let resX = newX;
    let resZ = newZ;

    // Multi-pass resolution with spatial grid bounding
    for (let pass = 0; pass < 2; pass++) {
      // A. Query only local static colliders (reduces checks from 500+ down to ~2-4)
      const nearbyColliders = this.spatialGrid.queryNear(resX, resZ, radius + 3.0);
      for (let i = 0; i < nearbyColliders.length; i++) {
        const col = nearbyColliders[i];
        if (col.type === 'box') {
          if (
            col.minX === undefined ||
            col.maxX === undefined ||
            col.minZ === undefined ||
            col.maxZ === undefined
          )
            continue;

          const colMinY = col.minY ?? 0;
          const colMaxY = col.maxY ?? 100;

          // If vertically entirely above the roof or entirely below bottom, ignore horizontal collision
          if (currentY + 1.8 < colMinY - 0.1) continue;
          if (currentY >= colMaxY - 0.2) continue;

          // If this is a step/stair and player is high enough to step onto it (<= 0.65m step rise), allow step-up
          const isStairStep =
            (col.name && (col.name.toLowerCase().includes('step') || col.name.toLowerCase().includes('stair'))) ||
            (colMaxY - currentY <= 0.65 && colMaxY - colMinY <= 0.65);
          if (isStairStep && currentY >= colMaxY - 0.65) continue;

          const closestX = Math.max(col.minX, Math.min(resX, col.maxX));
          const closestZ = Math.max(col.minZ, Math.min(resZ, col.maxZ));
          const dx = resX - closestX;
          const dz = resZ - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < 0.00001) {
            // Player/vehicle center is inside the box: push out to nearest exterior face
            const dMinX = Math.abs(resX - col.minX);
            const dMaxX = Math.abs(col.maxX - resX);
            const dMinZ = Math.abs(resZ - col.minZ);
            const dMaxZ = Math.abs(col.maxZ - resZ);
            const minPen = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);
            if (minPen === dMinX) resX = col.minX - radius;
            else if (minPen === dMaxX) resX = col.maxX + radius;
            else if (minPen === dMinZ) resZ = col.minZ - radius;
            else resZ = col.maxZ + radius;
          } else if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            resX += (dx / dist) * overlap;
            resZ += (dz / dist) * overlap;
          }
        } else if (col.type === 'cylinder') {
          if (col.x === undefined || col.z === undefined || col.radius === undefined) continue;

          const colMinY = col.minY ?? 0;
          const colMaxY = col.maxY ?? 100;

          if (currentY + 1.8 < colMinY - 0.1) continue;
          if (currentY >= colMaxY - 0.2) continue;

          const dx = resX - col.x;
          const dz = resZ - col.z;
          const dist = Math.hypot(dx, dz);
          const minDist = col.radius + radius;

          if (dist < minDist) {
            if (dist > 0.0001) {
              const push = minDist - dist;
              resX += (dx / dist) * push;
              resZ += (dz / dist) * push;
            } else {
              resX += minDist;
            }
          }
        }
      }

      // B. Query only local player-built structures (walls, ramps, solid obstacles)
      const nearbyPieces = this.spatialGrid.queryBuildingPiecesNear(resX, resZ, radius + 3.0);
      for (let i = 0; i < nearbyPieces.length; i++) {
        const piece = nearbyPieces[i];
        if (piece.type === 'wall') {
          if (currentY >= piece.y - 0.2 && currentY <= piece.y + 4.2) {
            const cos = Math.cos(-piece.rotY);
            const sin = Math.sin(-piece.rotY);
            const dx = resX - piece.x;
            const dz = resZ - piece.z;
            const localX = dx * cos - dz * sin;
            const localZ = dx * sin + dz * cos;

            if (Math.abs(localX) <= 2.25 && Math.abs(localZ) <= 0.4 + radius) {
              const pushZ = (0.4 + radius - Math.abs(localZ)) * Math.sign(localZ || 1);
              // Inverse orthogonal rotation: [dx, dz]^T = [cos sin; -sin cos]^T * [0, pushZ]^T
              const worldPushX = sin * pushZ;
              const worldPushZ = cos * pushZ;
              resX += worldPushX;
              resZ += worldPushZ;
            }
          }
        } else if (piece.type === 'ramp') {
          // If player is lower than the ramp slope (e.g. attempting to walk into back/solid sides)
          const cos = Math.cos(-piece.rotY);
          const sin = Math.sin(-piece.rotY);
          const dx = resX - piece.x;
          const dz = resZ - piece.z;
          const localX = dx * cos - dz * sin;
          const localZ = dx * sin + dz * cos;

          if (Math.abs(localX) <= 2.25 && Math.abs(localZ) <= 2.25) {
            const rampH = calculateRampHeightAt(piece, resX, resZ);
            if (rampH !== null && currentY < rampH - 0.7) {
              // High back or sides of ramp blocks horizontal passage
              if (Math.abs(localX) > 1.8) {
                const pushX = (2.25 + radius - Math.abs(localX)) * Math.sign(localX || 1);
                resX += cos * pushX;
                resZ += -sin * pushX;
              } else if (localZ > 1.6) {
                // High back wall of ramp
                const pushZ = (2.25 + radius - localZ);
                resX += sin * pushZ;
                resZ += cos * pushZ;
              }
            }
          }
        }
      }
    }

    return { x: resX, z: resZ };
  }

  private updateSkydivingAndMovement(dt: number) {
    // 1. SKYDIVING DROP PHASE
    if (this.isSkydiving) {
      this.windAudioTimer += dt;
      if (this.windAudioTimer > 0.25) {
        this.windAudioTimer = 0;
        fortniteAudio.playWindRush();
      }

      const forward = new THREE.Vector3(-Math.sin(this.playerRotY), 0, -Math.cos(this.playerRotY));
      const right = new THREE.Vector3(Math.cos(this.playerRotY), 0, -Math.sin(this.playerRotY));

      let steerSpeed = this.isGliding ? 24.0 : 16.0;
      const moveDir = new THREE.Vector3();
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        this.playerVel.x = moveDir.x * steerSpeed;
        this.playerVel.z = moveDir.z * steerSpeed;
      } else {
        this.playerVel.x *= 0.92;
        this.playerVel.z *= 0.92;
      }

      const descentSpeed = this.isGliding ? -9.0 : -26.0;
      this.playerVel.y = THREE.MathUtils.lerp(this.playerVel.y, descentSpeed, dt * 6.0);

      this.playerPos.x += this.playerVel.x * dt;
      this.playerPos.y += this.playerVel.y * dt;
      this.playerPos.z += this.playerVel.z * dt;

      const groundY = this.getGroundElevationAt(this.playerPos.x, this.playerPos.z, this.playerPos.y);
      const roundedAlt = Math.max(0, Math.round(this.playerPos.y - groundY));
      if (Math.abs(roundedAlt - this.lastAltitudeSync) >= 2) {
        this.lastAltitudeSync = roundedAlt;
        this.callbacks.onSkydivingUpdate(this.isSkydiving, this.isGliding, roundedAlt);
      }

      if (this.playerPos.y <= groundY + 0.8) {
        this.playerPos.y = groundY;
        this.playerVel.y = 0;
        this.isSkydiving = false;
        this.isGliding = false;
        this.gameStarted = true;
        this.isGrounded = true;

        if (this.gliderMesh) this.gliderMesh.visible = false;
        fortniteAudio.playTouchdown();
        fortniteAudio.startGameMusic();
        this.callbacks.onTouchdown();
        this.callbacks.onSkydivingUpdate(false, false, 0);
      }
      return;
    }

    // 2. ON-GROUND FAST MOVEMENT WITH SOLID COLLISION
    this.isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    this.isCrouching = this.keys['KeyC'] || this.keys['ControlLeft'];

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    let moveSpeed = this.isSliding
      ? 19.5
      : this.isSprinting
      ? 16.5
      : this.isCrouching
      ? 5.5
      : 10.5;

    if (this.isAimingDownSights) moveSpeed *= 0.65;

    const forward = new THREE.Vector3(-Math.sin(this.playerRotY), 0, -Math.cos(this.playerRotY));
    const right = new THREE.Vector3(Math.cos(this.playerRotY), 0, -Math.sin(this.playerRotY));

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.playerVel.x = moveDir.x * moveSpeed;
      this.playerVel.z = moveDir.z * moveSpeed;
    } else {
      this.playerVel.x *= 0.78;
      this.playerVel.z *= 0.78;
    }

    if (this.isGrounded && moveDir.lengthSq() > 0.01) {
      this.footstepTimer += dt;
      const stepInterval = this.isSprinting ? 0.28 : this.isCrouching ? 0.52 : 0.36;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        if (isPointInLake(this.playerPos.x, this.playerPos.z)) {
          fortniteAudio.playWaterSplash();
        } else {
          const surface = getGroundSurface(
            this.playerPos.x,
            this.playerPos.z,
            this.playerPos.y
          );
          fortniteAudio.playFootstep(surface);
        }
      }
    } else {
      this.footstepTimer = 0.2;
    }

    if (this.keys['Space'] && this.isGrounded) {
      this.playerVel.y = 11.5;
      this.isGrounded = false;
      fortniteAudio.playJump();
    }

    this.playerVel.y -= 26.0 * dt;

    const nextX = this.playerPos.x + this.playerVel.x * dt;
    const nextZ = this.playerPos.z + this.playerVel.z * dt;

    const resolved = this.checkAndResolveSolidCollisions(nextX, nextZ, this.playerPos.y);
    this.playerPos.x = resolved.x;
    this.playerPos.z = resolved.z;
    this.playerPos.y += this.playerVel.y * dt;

    // Solid Ceiling Collision: Prevent jumping upward through player-built floors or cone roofs
    if (this.playerVel.y > 0) {
      const playerHeadY = this.playerPos.y + 1.85;
      const nearbyCeilings = this.spatialGrid.queryBuildingPiecesNear(this.playerPos.x, this.playerPos.z, 2.5);
      for (let i = 0; i < nearbyCeilings.length; i++) {
        const piece = nearbyCeilings[i];
        if (piece.type === 'floor' || piece.type === 'cone') {
          if (Math.abs(this.playerPos.x - piece.x) <= 2.1 && Math.abs(this.playerPos.z - piece.z) <= 2.1) {
            if (playerHeadY >= piece.y - 0.25 && this.playerPos.y < piece.y) {
              this.playerPos.y = piece.y - 1.9;
              this.playerVel.y = 0;
              break;
            }
          }
        }
      }
    }

    this.playerPos.x = Math.max(-270, Math.min(270, this.playerPos.x));
    this.playerPos.z = Math.max(-270, Math.min(270, this.playerPos.z));

    const groundElevation = this.getGroundElevationAt(
      this.playerPos.x,
      this.playerPos.z,
      this.playerPos.y
    );

    if (this.playerPos.y <= groundElevation) {
      this.playerPos.y = groundElevation;
      this.playerVel.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  private updateCameraAndRigs(dt: number) {
    const eyeHeight = this.isCrouching || this.isSliding ? 1.0 : 1.75;

    const shakeOffset = (Math.random() - 0.5) * this.screenShake;
    this.screenShake = THREE.MathUtils.lerp(this.screenShake, 0, dt * 12);

    const euler = new THREE.Euler(this.playerPitch + shakeOffset, this.playerRotY + shakeOffset, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    this.recoilRecoilZ = THREE.MathUtils.lerp(this.recoilRecoilZ, 0, dt * 14);
    this.recoilRecoilY = THREE.MathUtils.lerp(this.recoilRecoilY, 0, dt * 14);
    this.recoilRecoilRotX = THREE.MathUtils.lerp(this.recoilRecoilRotX, 0, dt * 14);

    if (this.activeVehicle) {
      const v = this.activeVehicle;
      const speedRatio = Math.min(1.0, Math.abs(v.speed) / (v.maxSpeed || 28));

      // Always in 3rd person inside the cars: Dynamic cinematic chase camera trailing behind vehicle
      const chaseDist = 6.4 + speedRatio * 1.8;
      const chaseHeight = 2.4 + speedRatio * 0.35 + Math.sin(performance.now() * 0.012) * speedRatio * 0.035;

      // Camera orientation driven by player mouse look (clamped so camera never clips underground)
      const clampedPitch = Math.max(-0.35, Math.min(0.65, this.playerPitch));
      const camEuler = new THREE.Euler(clampedPitch + shakeOffset, this.playerRotY + shakeOffset, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(camEuler);

      // Chase camera offset trailing behind the car
      const chaseOffset = new THREE.Vector3(0, chaseHeight, chaseDist);
      chaseOffset.applyQuaternion(this.camera.quaternion);

      const carCenter = new THREE.Vector3(v.x, v.y + 0.85, v.z);
      this.camera.position.copy(carCenter).add(chaseOffset);

      // Dynamic FOV with speed sensation
      const targetFov = (this.profile.settings.fov || 75) + speedRatio * 10;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 8);
      this.camera.updateProjectionMatrix();

      // Show and position 3rd person character inside the driver seat
      if (this.thirdPersonRig) {
        this.thirdPersonRig.root.visible = true;
        const driverSeatOffset = new THREE.Vector3(-0.42, 0.42, -0.15);
        driverSeatOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), v.rotY);
        this.thirdPersonRig.root.position.set(
          v.x + driverSeatOffset.x,
          v.y + driverSeatOffset.y,
          v.z + driverSeatOffset.z
        );
        this.thirdPersonRig.root.rotation.y = v.rotY + Math.PI;
        this.thirdPersonRig.updateAnimation(performance.now() * 0.001, false, false, false);
      }
      if (this.fpsRig) this.fpsRig.visible = false;
    } else if (this.isFirstPerson && !this.isSkydiving) {
      this.camera.position.set(this.playerPos.x, this.playerPos.y + eyeHeight, this.playerPos.z);

      const targetFov = this.isAimingDownSights
        ? this.getCurrentWeapon()?.type === 'sniper'
          ? 20
          : 42
        : (this.profile.settings.fov || 75);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 16);
      this.camera.updateProjectionMatrix();

      if (this.fpsRig) {
        const isMoving = Math.hypot(this.playerVel.x, this.playerVel.z) > 0.5;
        const bobOffset = isMoving ? Math.sin(performance.now() * 0.015) * 0.018 : 0;
        let swingRotX = 0;
        let swingRotZ = 0;
        let swingOffsetZ = 0;
        let swingOffsetY = 0;

        if (this.isSwingingPickaxe) {
          const swingElapsed = (performance.now() - this.lastShotTime) / 320;
          const curve = Math.sin(Math.min(Math.max(swingElapsed, 0), 1) * Math.PI);
          swingRotX = -curve * 0.72;
          swingRotZ = curve * 0.42;
          swingOffsetY = -curve * 0.12;
          swingOffsetZ = -curve * 0.18;
        }

        this.fpsRig.position.set(0, bobOffset + this.recoilRecoilY + swingOffsetY, this.recoilRecoilZ + swingOffsetZ);
        this.fpsRig.rotation.set(this.recoilRecoilRotX + swingRotX, 0, swingRotZ);
      }
    } else {
      const dist = this.isSkydiving ? 5.5 : 2.8;
      const camOffset = new THREE.Vector3(0.7, 0.4, dist);
      camOffset.applyQuaternion(this.camera.quaternion);
      this.camera.position.copy(this.playerPos).add(new THREE.Vector3(0, eyeHeight, 0)).add(camOffset);

      if (this.thirdPersonRig) {
        this.thirdPersonRig.root.position.copy(this.playerPos);
        const isMoving = Math.hypot(this.playerVel.x, this.playerVel.z) > 0.5;
        let facingRotY = this.playerRotY + Math.PI;
        if (isMoving && !this.isAimingDownSights && !this.isSwingingPickaxe) {
          facingRotY = Math.atan2(this.playerVel.x, this.playerVel.z);
        }
        this.thirdPersonRig.root.rotation.y = facingRotY;
        this.thirdPersonRig.updateAnimation(performance.now() * 0.001, isMoving, this.isSwingingPickaxe, this.isAimingDownSights);
      }

      if (this.gliderMesh) {
        this.gliderMesh.visible = this.isSkydiving && this.isGliding;
        this.gliderMesh.position.set(this.playerPos.x, this.playerPos.y + 2.0, this.playerPos.z);
        this.gliderMesh.rotation.y = this.playerRotY;
      }
    }
  }

  private updateStorm(dt: number) {
    this.storm.timeRemaining -= dt;
    if (this.storm.timeRemaining <= 0) {
      if (!this.storm.isShrinking) {
        this.storm.isShrinking = true;
        this.storm.timeRemaining = 40;
        fortniteAudio.playStormWarning();
      } else {
        this.storm.phase = Math.min(this.storm.maxPhases, this.storm.phase + 1);
        this.storm.isShrinking = false;
        this.storm.timeRemaining = 50;
        this.storm.targetRadius = Math.max(30, this.storm.targetRadius - 45);
        this.storm.dps = Math.min(6, this.storm.dps + 1);
      }
    }

    if (this.storm.isShrinking) {
      this.storm.currentRadius = THREE.MathUtils.lerp(
        this.storm.currentRadius,
        this.storm.targetRadius,
        dt * 0.07
      );
      if (this.stormCylinderMesh) {
        this.stormCylinderMesh.scale.set(
          this.storm.currentRadius / 290,
          1,
          this.storm.currentRadius / 290
        );
      }
    }

    const distToCenter = Math.hypot(
      this.playerPos.x - this.storm.currentCenterX,
      this.playerPos.z - this.storm.currentCenterZ
    );

    if (distToCenter > this.storm.currentRadius) {
      this.health -= this.storm.dps * dt;
      this.damageTaken += this.storm.dps * dt;
      this.callbacks.onHealthChange(Math.max(0, Math.round(this.health)), this.shield);
      this.callbacks.onDamageTaken();
      fortniteAudio.playStormTick();

      if (this.health <= 0) {
        this.triggerEliminated();
      }
    }

    const currentSecond = Math.floor(this.storm.timeRemaining);
    if (
      currentSecond !== this.lastStormSyncSecond ||
      this.storm.isShrinking !== this.lastStormShrinkingState
    ) {
      this.lastStormSyncSecond = currentSecond;
      this.lastStormShrinkingState = this.storm.isShrinking;
      this.callbacks.onStormUpdate(this.storm);
    }
  }

  // --- BOT AI & COMBAT SYSTEMS ---

  private isLineOfSightBlocked(origin: THREE.Vector3, target: THREE.Vector3): boolean {
    const dir = target.clone().sub(origin);
    const maxDist = dir.length();
    if (maxDist < 0.2) return false;
    dir.normalize();

    const ray = new THREE.Ray(origin, dir);
    const sharedBox = new THREE.Box3();
    const sharedIntersect = new THREE.Vector3();

    // Check static world buildings and structures along the ray
    const colliders = this.spatialGrid.queryRay(origin.x, origin.z, target.x, target.z);
    for (let i = 0; i < colliders.length; i++) {
      const sc = colliders[i];
      if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
        sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
        sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
        if (ray.intersectBox(sharedBox, sharedIntersect)) {
          const hitDist = origin.distanceTo(sharedIntersect);
          if (hitDist > 0.3 && hitDist < maxDist - 0.4) {
            return true;
          }
        }
      } else if (sc.type === 'cylinder' && sc.x !== undefined && sc.z !== undefined && sc.radius !== undefined) {
        const r = sc.radius;
        sharedBox.min.set(sc.x - r, sc.minY || 0, sc.z - r);
        sharedBox.max.set(sc.x + r, sc.maxY || 100, sc.z + r);
        if (ray.intersectBox(sharedBox, sharedIntersect)) {
          const hitDist = origin.distanceTo(sharedIntersect);
          if (hitDist > 0.3 && hitDist < maxDist - 0.4) {
            return true;
          }
        }
      }
    }

    // Check player-built structures along the ray
    const pieces = this.spatialGrid.queryBuildingPiecesRay(origin.x, origin.z, target.x, target.z);
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
      sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
      if (ray.intersectBox(sharedBox, sharedIntersect)) {
        const hitDist = origin.distanceTo(sharedIntersect);
        if (hitDist > 0.3 && hitDist < maxDist - 0.4) {
          return true;
        }
      }
    }

    return false;
  }

  private updateBots(dt: number) {
    const time = performance.now() * 0.001;

    // In 1v1 Arena Mode, execute specialized Pro Builder God AI
    if (this.mode === '1v1_build_fight') {
      for (let i = 0; i < this.bots.length; i++) {
        const bot = this.bots[i];
        if (bot.isAlive) {
          this.update1v1Bot(bot, dt, time);
        }
      }
      return;
    }

    // Simulated Bot vs Bot Skirmishes across the island
    this.botSimCombatTimer -= dt;
    if (this.botSimCombatTimer <= 0) {
      this.botSimCombatTimer = 9.0 + Math.random() * 10.0;
      const aliveEnemyBots = this.bots.filter((b) => b.isAlive && b.team !== this.playerTeam);
      if (aliveEnemyBots.length > 2) {
        const victim = aliveEnemyBots[Math.floor(Math.random() * aliveEnemyBots.length)];
        const killers = aliveEnemyBots.filter((b) => b.id !== victim.id);
        const killer = killers[Math.floor(Math.random() * killers.length)] || { name: 'Squad Bot' };

        victim.isAlive = false;
        const rig = this.botMeshes.get(victim.id);
        if (rig) {
          this.scene.remove(rig.root);
        }
        const nTag = this.botNameTags.get(victim.id);
        if (nTag) {
          this.scene.remove(nTag);
        }

        const botWeapons = ['SCAR AR', 'Pump Shotgun', 'Bolt-Action Sniper', 'Compact SMG', 'Tactical AR'];
        const wep = botWeapons[Math.floor(Math.random() * botWeapons.length)];
        const isHeadshot = Math.random() < 0.28;

        const log: EliminationLog = {
          id: `bot_elim_${Date.now()}_${Math.random()}`,
          killer: killer.name,
          victim: victim.name,
          weaponName: wep,
          isHeadshot,
          time: Date.now(),
        };
        this.callbacks.onElimination(log);

        const remaining = this.bots.filter((b) => b.isAlive).length + 1;
        this.callbacks.onPlayersLeftChange(remaining);
        this.checkTeamVictoryCondition();
      }
    }

    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (!bot.isAlive) continue;

      const botPos = new THREE.Vector3(bot.x, bot.y + 1.2, bot.z);
      const playerHeadPos = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
      const distToPlayer = this.playerPos.distanceTo(new THREE.Vector3(bot.x, bot.y, bot.z));

      // --- STORM DAMAGE & ELIMINATION FOR BOTS OUTSIDE SAFE ZONE ---
      const distToStormCenter = Math.hypot(
        bot.x - this.storm.currentCenterX,
        bot.z - this.storm.currentCenterZ
      );

      if (distToStormCenter > this.storm.currentRadius) {
        // AI bot takes storm damage per second
        const stormTickDmg = (this.storm.dps + 2.0) * dt;
        bot.health -= stormTickDmg;

        // Bot runs towards the center of the safe eye to escape the storm!
        const dirToCenterX = this.storm.currentCenterX - bot.x;
        const dirToCenterZ = this.storm.currentCenterZ - bot.z;
        const len = Math.hypot(dirToCenterX, dirToCenterZ) || 1;
        bot.vx = (dirToCenterX / len) * 5.5;
        bot.vz = (dirToCenterZ / len) * 5.5;
        bot.rotY = Math.atan2(-dirToCenterX, -dirToCenterZ);

        // Update real-time health bar
        const nTag = this.botNameTags.get(bot.id);
        if (nTag) {
          updateNameTagSprite(
            nTag,
            bot.name,
            true,
            bot.team,
            Math.max(0, bot.health / 100),
            Math.max(0, bot.shield / 50)
          );
        }

        // Bot dies in the storm when health reaches 0
        if (bot.health <= 0) {
          bot.isAlive = false;
          const rig = this.botMeshes.get(bot.id);
          if (rig) {
            this.scene.remove(rig.root);
          }
          if (nTag) {
            this.scene.remove(nTag);
          }

          const log: EliminationLog = {
            id: `storm_elim_${Date.now()}_${Math.random()}`,
            killer: 'The Storm ⚡',
            victim: bot.name,
            weaponName: 'Storm Surge',
            isHeadshot: false,
            time: Date.now(),
          };
          this.callbacks.onElimination(log);

          // Drop bot supplies upon storm death
          this.spawnDroppedSupplies(bot.x, bot.y, bot.z, bot.weapon);

          const remaining = this.bots.filter((b) => b.isAlive).length + 1;
          this.callbacks.onPlayersLeftChange(remaining);

          const aliveEnemies = this.bots.filter((b) => b.isAlive && b.team !== this.playerTeam);
          if (aliveEnemies.length === 0) {
            this.triggerVictoryRoyale();
          }
          continue;
        }
      }

      // Friendly bot on Alpha team follows player and defends!
      const isFriendly = bot.team === this.playerTeam;

      if (isFriendly) {
        if (distToPlayer > 8.0) {
          const dx = this.playerPos.x - bot.x;
          const dz = this.playerPos.z - bot.z;
          bot.rotY = Math.atan2(-dx, -dz);
          bot.vx = -Math.sin(bot.rotY) * 6.5;
          bot.vz = -Math.cos(bot.rotY) * 6.5;
        } else {
          bot.vx = 0;
          bot.vz = 0;
          const dx = this.playerPos.x - bot.x;
          const dz = this.playerPos.z - bot.z;
          bot.rotY = Math.atan2(-dx, -dz);
        }
      } else {
        if (distToPlayer < 45) {
          bot.state = 'combat';
        }

        if (bot.state === 'combat') {
          const dx = this.playerPos.x - bot.x;
          const dz = this.playerPos.z - bot.z;
          bot.rotY = Math.atan2(-dx, -dz) + (Math.sin(time * 3) * 0.15);

          const strafe = Math.sin(time * 1.5 + parseInt(bot.id.replace('bot_', ''))) * 2.5;
          bot.vx = Math.cos(bot.rotY) * strafe;
          bot.vz = -Math.sin(bot.rotY) * strafe;

          if (time - bot.lastShotTime > bot.reactionTimer) {
            bot.lastShotTime = time;

            // Check if bullet trajectory is blocked by a building or player wall
            const isBlocked = this.isLineOfSightBlocked(botPos, playerHeadPos);

            if (!isBlocked) {
              if (Math.random() < bot.accuracy) {
                const dmg = 4 + Math.floor(Math.random() * 4);
                if (this.shield > 0) {
                  this.shield = Math.max(0, this.shield - dmg);
                } else {
                  this.health = Math.max(0, this.health - dmg);
                }
                this.damageTaken += dmg;
                this.callbacks.onHealthChange(this.health, this.shield);
                this.callbacks.onDamageTaken();
                fortniteAudio.playHitmarker(false, this.shield > 0);

                if (this.health <= 0) {
                  this.triggerEliminated();
                }
              }
            }

            if (distToPlayer < 60) {
              fortniteAudio.playGunshotAR(false);
              if (distToPlayer < 35) {
                fortniteAudio.playBulletCrack();
              }
              const tracerEnd = isBlocked
                ? botPos.clone().add(new THREE.Vector3(dx * 0.4, 0.5, dz * 0.4))
                : this.playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 1.4, (Math.random() - 0.5) * 4));
              this.createBulletTracer(botPos, tracerEnd);
            }
          }
        } else {
          const angle = time * 0.2 + parseInt(bot.id.replace('bot_', ''));
          bot.rotY = angle;
          bot.vx = -Math.sin(angle) * 3.0;
          bot.vz = -Math.cos(angle) * 3.0;
        }
      }

      bot.x += bot.vx * dt;
      bot.z += bot.vz * dt;

      // Solid collision resolution for bots with spatial grid
      const botResolved = this.checkAndResolveSolidCollisions(bot.x, bot.z, bot.y, 0.45);
      bot.x = botResolved.x;
      bot.z = botResolved.z;
      bot.y = this.getGroundElevationAt(bot.x, bot.z, bot.y);

      const rig = this.botMeshes.get(bot.id);
      if (rig) {
        rig.root.position.set(bot.x, bot.y, bot.z);
        rig.root.rotation.y = bot.rotY + Math.PI;
        // Throttle distant animation matrix calculations
        if (distToPlayer < 90 || bot.state === 'combat') {
          rig.updateAnimation(time, Math.hypot(bot.vx, bot.vz) > 0.5, false, bot.state === 'combat');
        }
      }
    }
  }

  private update1v1Bot(bot: BotPlayer, dt: number, time: number) {
    const botPos = new THREE.Vector3(bot.x, bot.y + 1.2, bot.z);
    const playerHeadPos = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
    const dx = this.playerPos.x - bot.x;
    const dz = this.playerPos.z - bot.z;
    const distToPlayer = Math.hypot(dx, dz);

    const diff = this.arena1v1State.botDifficulty || 'pro';
    const config = getBotDifficultyConfig(diff);

    // 1. Aim Tracking towards player (Smooth angle interpolation)
    const targetAngle = Math.atan2(-dx, -dz);
    bot.rotY = targetAngle;

    // 2. Vertical Physics
    if (!bot.vy) bot.vy = 0;
    bot.vy -= 26.0 * dt;

    // 3. Movement & Tactical Strafing (Pure Gunplay - No Building)
    let forwardSpeed = 0;
    let strafeSpeed = Math.sin(time * 3.5) * config.strafeSpeed;

    if (distToPlayer > 22.0) {
      forwardSpeed = config.targetSpeed; // Push forward into combat range
    } else if (distToPlayer > 12.0) {
      forwardSpeed = config.targetSpeed * 0.65;
      strafeSpeed = Math.sin(time * 4.2) * (config.strafeSpeed * 1.1);
    } else if (distToPlayer < 5.0) {
      forwardSpeed = -config.targetSpeed * 0.5; // Back up slightly for shotgun spacing
      strafeSpeed = Math.sin(time * 5.5) * (config.strafeSpeed * 1.3);
    } else {
      forwardSpeed = Math.cos(time * 2.0) * 3.0;
      strafeSpeed = Math.sin(time * 4.8) * config.strafeSpeed;
    }

    const fwdX = -Math.sin(bot.rotY);
    const fwdZ = -Math.cos(bot.rotY);
    const rightX = Math.cos(bot.rotY);
    const rightZ = -Math.sin(bot.rotY);

    bot.vx = fwdX * forwardSpeed + rightX * strafeSpeed;
    bot.vz = fwdZ * forwardSpeed + rightZ * strafeSpeed;

    // 4. Combat Jump Peeks based on difficulty
    if (bot.isGrounded && Math.random() < config.jumpChance) {
      bot.vy = 10.5;
      bot.isGrounded = false;
      fortniteAudio.playJump();
    }

    // 5. Apply velocities & collisions
    bot.x += bot.vx * dt;
    bot.z += bot.vz * dt;
    bot.y += bot.vy * dt;

    const resolved = this.checkAndResolveSolidCollisions(bot.x, bot.z, bot.y, 0.48);
    bot.x = resolved.x;
    bot.z = resolved.z;

    const groundElevation = this.getGroundElevationAt(bot.x, bot.z, bot.y);
    if (bot.y <= groundElevation) {
      bot.y = groundElevation;
      bot.vy = 0;
      bot.isGrounded = true;
    } else {
      bot.isGrounded = false;
    }

    // Arena Boundary clamp
    bot.x = Math.max(-72, Math.min(72, bot.x));
    bot.z = Math.max(-72, Math.min(72, bot.z));

    // 6. Tactical Gun Combat & Weapon Switching
    const isCloseRange = distToPlayer <= 11.0;
    const shotInterval = isCloseRange ? config.shotIntervalClose : config.shotIntervalFar;

    if (time - bot.lastShotTime > shotInterval && !this.arena1v1State.isRoundOver) {
      bot.lastShotTime = time;

      const isBlocked = this.isLineOfSightBlocked(botPos, playerHeadPos);

      if (!isBlocked) {
        const hitChance = isCloseRange ? config.hitChanceClose : config.hitChanceFar;
        if (Math.random() < hitChance) {
          const isHeadshot = Math.random() < config.headshotChance;
          let rawDmg = isCloseRange
            ? (65 + Math.floor(Math.random() * 30))
            : (22 + Math.floor(Math.random() * 10));
          rawDmg = Math.round(rawDmg * config.dmgMultiplier);
          if (isHeadshot) rawDmg = Math.round(rawDmg * 1.55);

          if (this.shield > 0) {
            const absorbed = Math.min(this.shield, rawDmg);
            this.shield -= absorbed;
            const overflow = rawDmg - absorbed;
            this.health = Math.max(0, this.health - overflow);
          } else {
            this.health = Math.max(0, this.health - rawDmg);
          }

          this.damageTaken += rawDmg;
          this.callbacks.onHealthChange(this.health, this.shield);
          this.callbacks.onDamageTaken();
          fortniteAudio.playHitmarker(isHeadshot, this.shield > 0);

          if (this.health <= 0) {
            this.triggerEliminated();
          }
        }
      }

      if (isCloseRange) {
        fortniteAudio.playGunshotPump(false);
        for (let p = 0; p < 4; p++) {
          const spreadOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2 + 1.2,
            (Math.random() - 0.5) * 1.2
          );
          const endPos = isBlocked
            ? botPos.clone().add(new THREE.Vector3(dx * 0.4, 0.4, dz * 0.4))
            : this.playerPos.clone().add(spreadOffset);
          this.createBulletTracer(botPos, endPos);
        }
      } else {
        fortniteAudio.playGunshotAR(false);
        if (distToPlayer < 35) fortniteAudio.playBulletCrack();
        const endPos = isBlocked
          ? botPos.clone().add(new THREE.Vector3(dx * 0.4, 0.4, dz * 0.4))
          : this.playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 1.3, (Math.random() - 0.5) * 2));
        this.createBulletTracer(botPos, endPos);
      }
    }

    // 7. Update 3D Model Rig & Name Tag (with 300 HP and Shield scaling)
    const rig = this.botMeshes.get(bot.id);
    if (rig) {
      rig.root.position.set(bot.x, bot.y, bot.z);
      rig.root.rotation.y = bot.rotY + Math.PI;
      const isMoving = Math.hypot(bot.vx, bot.vz) > 0.5;
      rig.updateAnimation(time, isMoving, false, true);
    }

    const nTag = this.botNameTags.get(bot.id);
    if (nTag) {
      updateNameTagSprite(
        nTag,
        bot.name,
        true,
        bot.team,
        Math.max(0, bot.health / 300),
        Math.max(0, bot.shield / 300)
      );
    }
  }

  private updateBuildingHologram() {
    if (!this.isBuildMode || !this.hologramMesh || this.isSkydiving || this.activeVehicle) return;

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const snapped = snapToBuildGrid(this.playerPos, camDir, this.selectedBuildType);

    this.hologramMesh.position.set(snapped.x, snapped.y, snapped.z);
    this.hologramMesh.rotation.y = snapped.rotY;
  }

  private updateShellCasings(dt: number) {
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const s = this.shellCasings[i];
      s.life -= dt;
      s.vel.y -= 18.0 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.rotation.x += s.rotVel.x * dt;
      s.mesh.rotation.y += s.rotVel.y * dt;

      if (s.mesh.position.y <= 1.0) {
        s.mesh.position.y = 1.0;
        s.vel.y *= -0.4;
        s.vel.x *= 0.6;
        s.vel.z *= 0.6;
      }

      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.shellCasings.splice(i, 1);
      }
    }
  }

  private addDamageNumber(
    text: string,
    color: string,
    isHeadshot: boolean,
    isShield: boolean,
    x: number,
    y: number,
    z: number
  ) {
    const id = `dmg_${Date.now()}_${Math.random()}`;
    this.damageNumbers.push({
      id,
      text,
      color,
      isHeadshot,
      isShield,
      x: x + (Math.random() - 0.5) * 0.4,
      y,
      z: z + (Math.random() - 0.5) * 0.4,
      life: 1.2,
      maxLife: 1.2,
    });
  }

  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      d.y += dt * 1.5;
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  private createBulletTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({ color: 0xfef08a, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.bulletTracers.push({ line, life: 0.12 });
  }

  private updateBulletTracers(dt: number) {
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const t = this.bulletTracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.line);
        this.bulletTracers.splice(i, 1);
      }
    }
  }

  // --- HARVESTING PARTICLES & CHOPPING DYNAMICS ---

  private createHarvestParticleEffect(hitPoint: THREE.Vector3, matType: string) {
    const color = matType === 'wood' ? 0xb45309 : matType === 'stone' ? 0x78716c : 0x94a3b8;
    const count = 6;
    const pMat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.12;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(geo, pMat);
      mesh.position.copy(hitPoint).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.25
        )
      );
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3.5,
        1.8 + Math.random() * 3.2,
        (Math.random() - 0.5) * 3.5
      );
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      this.harvestParticles.push({
        mesh,
        vel,
        rotSpeed,
        life: 0.65,
        maxLife: 0.65,
      });
    }
  }

  private updateHarvestParticles(dt: number) {
    for (let i = this.harvestParticles.length - 1; i >= 0; i--) {
      const p = this.harvestParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.harvestParticles.splice(i, 1);
        continue;
      }

      p.vel.y -= 14.0 * dt; // Gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  private animateHarvestImpact(mesh: THREE.Object3D) {
    const existing = this.activeHarvestWobbles.find((w) => w.mesh === mesh);
    if (existing) {
      existing.elapsed = 0;
      return;
    }

    this.activeHarvestWobbles.push({
      mesh,
      baseRotZ: mesh.rotation.z,
      baseRotX: mesh.rotation.x,
      elapsed: 0,
      duration: 0.35,
    });
  }

  private updateHarvestWobbles(dt: number) {
    for (let i = this.activeHarvestWobbles.length - 1; i >= 0; i--) {
      const w = this.activeHarvestWobbles[i];
      w.elapsed += dt;
      const progress = w.elapsed / w.duration;

      if (progress >= 1.0) {
        w.mesh.rotation.z = w.baseRotZ;
        w.mesh.rotation.x = w.baseRotX;
        this.activeHarvestWobbles.splice(i, 1);
      } else {
        const decay = 1.0 - progress;
        const wobbleAngle = Math.sin(progress * Math.PI * 6) * 0.08 * decay;
        w.mesh.rotation.z = w.baseRotZ + wobbleAngle;
        w.mesh.rotation.x = w.baseRotX + wobbleAngle * 0.5;
      }
    }
  }

  private animateHarvestDestruction(mesh: THREE.Object3D, h: HarvestableObject) {
    // Spawn burst of timber/debris particles
    this.createHarvestParticleEffect(
      new THREE.Vector3(h.x, h.y + 1.2, h.z),
      h.materialType
    );
    this.createHarvestParticleEffect(
      new THREE.Vector3(h.x, h.y + 2.5, h.z),
      h.materialType
    );

    // Dramatic falling over / shrinking animation before scene removal
    const startTime = performance.now();
    const duration = 500;
    const initialY = mesh.position.y;
    const fallDir = (Math.random() - 0.5) * 0.8;

    const animateBreak = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);

      mesh.rotation.z += fallDir * 0.04;
      mesh.position.y = initialY - t * 1.5;
      const scale = Math.max(0.05, 1 - t * 0.85);
      mesh.scale.multiplyScalar(0.96);

      if (t < 1) {
        requestAnimationFrame(animateBreak);
      } else {
        this.scene.remove(mesh);
        this.harvestableMeshes.delete(h.id);
      }
    };
    requestAnimationFrame(animateBreak);
  }

  private removeHarvestableCollider(h: HarvestableObject) {
    if (h.collider) {
      this.spatialGrid.remove(h.collider);
      const idx = this.staticColliders.indexOf(h.collider);
      if (idx !== -1) {
        this.staticColliders.splice(idx, 1);
      }
    }
  }

  private updateNetworkSync(now: number) {
    if (now - this.lastNetworkSyncTime > 50) {
      this.lastNetworkSyncTime = now;
      const currentWep = this.getCurrentWeapon();
      multiplayerClient.sendPlayerSync({
        name: this.profile.name,
        skinId: this.profile.selectedSkin,
        x: this.playerPos.x,
        y: this.playerPos.y,
        z: this.playerPos.z,
        rotY: this.playerRotY,
        pitch: this.playerPitch,
        health: this.health,
        shield: this.shield,
        isSkydiving: this.isSkydiving,
        isGliding: this.isGliding,
        activeWeaponType: currentWep ? currentWep.type : 'pickaxe',
        weaponRarity: currentWep ? currentWep.rarity : 'common',
      });
    }
  }

  // --- SCOPE REAL-TIME BULLET TRAJECTORY & IMPACT INDICATOR ---

  private updateScopeTrajectory() {
    const wep = this.getCurrentWeapon();
    const isAimingGun =
      this.isAimingDownSights &&
      !this.isSkydiving &&
      !this.activeVehicle &&
      wep !== null &&
      wep.type !== 'pickaxe' &&
      wep.type !== 'shield' &&
      wep.type !== 'heal';

    if (!isAimingGun || !this.scopeLaserLine || !this.scopeImpactMarker) {
      if (this.scopeLaserLine) this.scopeLaserLine.visible = false;
      if (this.scopeImpactMarker) this.scopeImpactMarker.visible = false;
      if (this.callbacks.onAimingChange) {
        this.callbacks.onAimingChange(false, null);
      }
      return;
    }

    this.sharedRaycaster.setFromCamera(this.sharedCenterVec, this.camera);
    const maxRange = wep ? wep.range : 300;
    let closestDist = maxRange;
    let hitName = 'SURFACE';
    let isBotHit = false;
    let isHeadshotHit = false;

    // 1. Check Bots
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (!bot.isAlive) continue;
      const botPos = new THREE.Vector3(bot.x, bot.y + 1.0, bot.z);
      const distToRay = this.sharedRaycaster.ray.distanceToPoint(botPos);
      if (distToRay < 1.1) {
        const d = this.camera.position.distanceTo(botPos);
        if (d < closestDist) {
          closestDist = d;
          hitName = `${bot.name} (${bot.team})`;
          isBotHit = true;
          isHeadshotHit = this.sharedRaycaster.ray.origin.y + this.sharedRaycaster.ray.direction.y * d > bot.y + 1.45;
        }
      }
    }

    // 2. Check Static Colliders in ray direction
    const sharedBox = new THREE.Box3();
    const sharedIntersect = new THREE.Vector3();
    const rayMidX = this.camera.position.x + this.sharedRaycaster.ray.direction.x * (maxRange * 0.5);
    const rayMidZ = this.camera.position.z + this.sharedRaycaster.ray.direction.z * (maxRange * 0.5);
    const candidateColliders = this.spatialGrid.queryNear(rayMidX, rayMidZ, maxRange * 0.6);

    for (let i = 0; i < candidateColliders.length; i++) {
      const sc = candidateColliders[i];
      if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
        sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
        sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
        if (this.sharedRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
          const d = this.camera.position.distanceTo(sharedIntersect);
          if (d < closestDist) {
            closestDist = d;
            hitName = sc.name ? sc.name.toUpperCase() : 'SKYSCRAPER / BUILDING';
            isBotHit = false;
            isHeadshotHit = false;
          }
        }
      }
    }

    // 3. Check Building Pieces in ray direction
    const candidatePieces = this.spatialGrid.queryBuildingPiecesNear(rayMidX, rayMidZ, maxRange * 0.6);
    for (let i = 0; i < candidatePieces.length; i++) {
      const piece = candidatePieces[i];
      sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
      sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
      if (this.sharedRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
        const d = this.camera.position.distanceTo(sharedIntersect);
        if (d < closestDist) {
          closestDist = d;
          hitName = `STRUCTURE [${piece.material.toUpperCase()}]`;
          isBotHit = false;
          isHeadshotHit = false;
        }
      }
    }

    // 4. Ground Elevation Intersection (fast 3.5m marching)
    const stepSize = 3.5;
    const marchP = new THREE.Vector3();
    for (let d = 3.5; d < closestDist; d += stepSize) {
      marchP.copy(this.sharedRaycaster.ray.origin).addScaledVector(this.sharedRaycaster.ray.direction, d);
      const groundH = this.getGroundElevationAt(marchP.x, marchP.z, marchP.y);
      if (marchP.y <= groundH) {
        closestDist = d;
        hitName = `TERRAIN ELEVATION (${Math.round(groundH)}m)`;
        isBotHit = false;
        isHeadshotHit = false;
        break;
      }
    }

    const impactPos = new THREE.Vector3().copy(this.sharedRaycaster.ray.origin).addScaledVector(this.sharedRaycaster.ray.direction, closestDist);
    const muzzleOffset = new THREE.Vector3(0.2, -0.22, -0.6).applyQuaternion(this.camera.quaternion);
    const muzzlePos = new THREE.Vector3().copy(this.camera.position).add(muzzleOffset);

    const positions = (this.scopeLaserLine.geometry as THREE.BufferGeometry).attributes.position;
    positions.setXYZ(0, muzzlePos.x, muzzlePos.y, muzzlePos.z);
    positions.setXYZ(1, impactPos.x, impactPos.y, impactPos.z);
    positions.needsUpdate = true;
    this.scopeLaserLine.visible = true;

    this.scopeImpactMarker.position.copy(impactPos);
    this.scopeImpactMarker.lookAt(this.camera.position);
    this.scopeImpactMarker.visible = true;

    const targetColor = isHeadshotHit ? 0xf59e0b : isBotHit ? 0xef4444 : 0x00f0ff;
    if (this.scopePointLight) this.scopePointLight.color.setHex(targetColor);
    (this.scopeLaserLine.material as THREE.LineBasicMaterial).color.setHex(targetColor);

    const now = performance.now();
    if (now - this.lastAimSyncTime > 60 || hitName !== this.lastAimTargetName) {
      this.lastAimSyncTime = now;
      this.lastAimTargetName = hitName;
      if (this.callbacks.onAimingChange) {
        this.callbacks.onAimingChange(true, {
          distance: Math.round(closestDist),
          targetName: hitName,
          isBot: isBotHit,
          isHeadshot: isHeadshotHit,
          hitX: impactPos.x,
          hitY: impactPos.y,
          hitZ: impactPos.z,
        });
      }
    }
  }
}
