export interface SolidCollider {
  type: 'box' | 'cylinder';
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  minZ?: number;
  maxZ?: number;
  x?: number;
  z?: number;
  radius?: number;
  height?: number;
  name?: string;
}

export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type WeaponType = 'pickaxe' | 'ar' | 'shotgun' | 'smg' | 'sniper' | 'pistol' | 'explosive' | 'minigun' | 'heal' | 'shield';

export type BuildType = 'wall' | 'floor' | 'ramp' | 'cone';

export type MaterialType = 'wood' | 'stone' | 'metal';

export interface WeaponMods {
  damageBonus?: number; // percentage, e.g. 0.15 = +15%
  magBonus?: number; // flat extra bullets, e.g. +10
  reloadBonus?: number; // speed reduction, e.g. 0.25 = -25% time
  spreadBonus?: number; // spread reduction, e.g. 0.4 = -40% spread
  fireRateBonus?: number; // fire rate boost, e.g. 0.15 = +15%
}

export interface FortniteWeapon {
  id: string;
  name: string;
  rarity: WeaponRarity;
  type: WeaponType;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // shots per second
  magazineSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  maxReserve: number;
  reloadTime: number; // in seconds
  spread: number;
  range: number;
  healAmount?: number;
  shieldAmount?: number;
  useTime?: number; // for consumables
  color: string;
  icon: string;
  // Upgrade & Special Weapon Attributes
  burstCount?: number;
  explosionRadius?: number;
  chargeTime?: number;
  mods?: WeaponMods;
  // Unique Weapon Progression & Archetype Traits
  recoilPattern?: 'laser_zero' | 'vertical_kick' | 'balanced_drift' | 'heavy_kick' | 'spread_bloom';
  elementalEffect?: 'incendiary' | 'electric' | 'cryo' | 'void' | 'kinetic';
  utilityPerk?: string;
  perkDescription?: string;
  // Differentiated Combat Mechanics (1v1.LOL / 2v2.io competitive gunplay)
  bulletBehavior?: 'hitscan' | 'projectile';
  projectileSpeed?: number; // m/s for travel time
  projectileGravity?: number; // m/s^2 drop
  recoilPitch?: number; // vertical camera kick
  recoilYaw?: number; // horizontal camera drift
  bloomSpreadMin?: number; // base/ADS spread
  bloomSpreadMax?: number; // spray/moving spread bloom
  bloomRecoverySpeed?: number; // bloom return rate
  falloffStart?: number; // distance in meters where damage starts dropping
  falloffEnd?: number; // distance in meters where damage reaches min
  falloffMinMultiplier?: number; // minimum damage ratio at max distance
  pelletCount?: number; // number of pellets for shotguns
}

export interface ShopWeaponItem {
  id: string;
  name: string;
  category: 'ar' | 'shotgun' | 'smg' | 'sniper' | 'heavy' | 'exotic';
  categoryLabel: string;
  rarity: WeaponRarity;
  costTokens: number;
  description: string;
  specialPerk: string;
  icon: string;
  tag?: string;
  isStarter?: boolean;
  // Unique Weapon Progression Traits
  fireRate: number;
  recoilPattern: 'laser_zero' | 'vertical_kick' | 'balanced_drift' | 'heavy_kick' | 'spread_bloom';
  recoilPatternLabel: string;
  recoilDifficulty?: 'low' | 'medium' | 'high';
  elementalEffect?: 'incendiary' | 'electric' | 'cryo' | 'void' | 'kinetic';
  elementalLabel?: string;
  utilityPerk: string;
  perkDescription: string;
  dpsComparison: string;
}

export interface Arena1v1State {
  playerScore: number;
  botScore: number;
  round: number;
  maxRounds: number;
  isRoundOver: boolean;
  roundWinner: 'player' | 'bot' | null;
  botDifficulty: 'normal' | 'pro' | 'god' | 'casual';
  countdown: number;
}

export interface BattleRoyaleDuelState {
  myRespawnsUsed: number;
  friendRespawnsUsed: number;
  maxRespawns: number; // 3 respawns allowed (eliminated 4th time loses)
  friendName: string;
  isDuelActive: boolean;
  respawnCountdown: number | null;
  duelMessage: string | null;
  friendDistance?: number | null;
}

export interface BuildingPiece {
  id: string;
  type: BuildType;
  material: MaterialType;
  x: number;
  y: number;
  z: number;
  rotY: number;
  health: number;
  maxHealth: number;
  ownerId: string;
  createdAt: number;
}

export interface LootChest {
  id: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  isOpened: boolean;
  tier: 'chest' | 'rare_chest' | 'ammo_box';
}

export interface HarvestableObject {
  id: string;
  type: 'tree' | 'rock' | 'car' | 'wall' | 'container' | 'bush';
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  materialType: MaterialType;
  yieldPerHit: number;
  radius: number;
  height: number;
  collider?: SolidCollider;
}

export interface GroundItem {
  id: string;
  weapon: FortniteWeapon;
  x: number;
  y: number;
  z: number;
  rotY: number;
  droppedAt: number;
}

export interface DamageNumber {
  id: string;
  text: string;
  color: string;
  isHeadshot: boolean;
  isShield: boolean;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
}

export interface EliminationLog {
  id: string;
  killer: string;
  victim: string;
  weaponName: string;
  isHeadshot: boolean;
  time: number;
}

export interface PickupNotification {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  amount?: number | string;
  rarity?: WeaponRarity;
  color?: string;
  type: 'material' | 'weapon' | 'shield' | 'heal' | 'chest' | 'supply_drop' | 'ammo';
  timestamp: number;
}

export interface EliminationBannerData {
  id: string;
  victim: string;
  weaponName: string;
  weaponIcon?: string;
  rarity?: WeaponRarity;
  isHeadshot: boolean;
  eliminationCount: number;
  distance?: number;
  xpEarned: number;
  timestamp: number;
}

export interface ScopeTargetData {
  distance: number;
  targetName: string;
  isBot: boolean;
  isHeadshot: boolean;
  hitX: number;
  hitY: number;
  hitZ: number;
}

export interface DrivableVehicle {
  id: string;
  name: string;
  type: 'sports' | 'suv' | 'truck' | 'quadcrasher';
  x: number;
  y: number;
  z: number;
  rotY: number;
  speed: number;
  maxSpeed: number;
  steerAngle: number;
  health: number;
  maxHealth: number;
  nitro: number; // 0 to 100
  color: number;
  driverId: string | null; // 'player' or bot id or null
  meshGroup?: any;
  leftDoorOpen?: boolean;
  rightDoorOpen?: boolean;
}

export type TeamType = 'ALPHA' | 'OMEGA' | 'SHADOW' | 'PHOENIX';

export interface DroppedSupply {
  id: string;
  type: 'weapon' | 'wood' | 'stone' | 'metal' | 'shield' | 'medkit' | 'ammo';
  amount: number;
  weapon?: FortniteWeapon;
  x: number;
  y: number;
  z: number;
  rotY: number;
  name: string;
  color: string;
  mesh?: any;
}

export interface BotPlayer {
  id: string;
  name: string;
  isAI: boolean;
  team: TeamType;
  skinId: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotY: number;
  pitch: number;
  health: number;
  shield: number;
  isAlive: boolean;
  isGrounded: boolean;
  weapon: FortniteWeapon;
  targetPos: { x: number; z: number } | null;
  state: 'wander' | 'loot' | 'combat' | 'flee_storm' | 'build_cover';
  lastShotTime: number;
  accuracy: number;
  reactionTimer: number;
  kills: number;
  lastBuildTime?: number;
}

export interface StormState {
  currentRadius: number;
  targetRadius: number;
  currentCenterX: number;
  currentCenterZ: number;
  targetCenterX: number;
  targetCenterZ: number;
  phase: number;
  maxPhases: number;
  timeRemaining: number;
  totalPhaseTime: number;
  isShrinking: boolean;
  dps: number;
}

export interface GameSettings {
  sensitivity: number; // 0.1 to 3.0 (default 1.0)
  adsSensitivity: number; // 0.2 to 2.0 (default 0.75)
  invertY: boolean; // default false
  fov: number; // 60 to 105 (default 75)
  volume: number; // Master volume 0.0 to 1.0 (default 0.85)
  sfxVolume: number; // SFX volume 0.0 to 1.0 (default 0.9)
  musicVolume: number; // Music volume 0.0 to 1.0 (default 0.5)
  hitSoundVolume: number; // Hit/Elim volume 0.0 to 1.0 (default 1.0)
  graphicsQuality: 'low' | 'medium' | 'high'; // default 'medium'
  shadows: boolean; // default false (huge lag reduction when off)
  resolutionScale: number; // 0.75, 1.0, 1.25 (default 1.0)
  viewDistance: 'near' | 'medium' | 'far'; // default 'medium'
  showFps: boolean; // default true
  firstPersonDefault: boolean; // default true
  toggleSprint: boolean; // default false
  reticleColor: string; // default '#ffffff'
}

export interface ArmoryPerks {
  damageBoost: number; // Level 0-5 (+5% per level)
  reloadBoost: number; // Level 0-5 (-8% reload time per level)
  magBoost: number; // Level 0-5 (+10% mag capacity per level)
  spreadReduction: number; // Level 0-5 (-12% spread per level)
  fireRateBoost: number; // Level 0-5 (+5% fire rate per level)
  siphonShield: boolean; // Instant +35 Shield/HP siphon on elimination
}

export interface PlayerLoadout {
  slot1: string; // Primary Rifle / AR
  slot2: string; // Shotgun / Close Range
  slot3: string; // Sniper / SMG / Heavy
  slot4: string; // Shield item
  slot5: string; // Heal item
}

export interface PlayerProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  vbucks: number; // S-Tokens currency (renamed from V-Bucks)
  battleStars: number;
  wins: number;
  kills: number;
  matchesPlayed: number;
  selectedSkin: string;
  selectedPickaxe: string;
  selectedGlider: string;
  unlockedSkins: string[];
  unlockedPickaxes: string[];
  unlockedGliders: string[];
  unlockedWeapons: string[]; // Unlocked weapon IDs from the S-Token Shop
  weaponTiers: Record<string, number>; // weaponId -> Tier (1: Stock, 2: Enhanced, 3: Mastercrafted, 4: Overcharged Mythic)
  armoryPerks: ArmoryPerks;
  loadout: PlayerLoadout;
  settings: GameSettings;
}

export type GameMode = 'battle_royale' | 'first_person_royale' | 'zero_build' | '1v1_build_fight';

export type BattlegroundMap = 'island_2v2' | 'tilted_skyscrapers' | 'pleasant_valley';

export interface PartyMember {
  id: string;
  name: string;
  skinId: string;
  level: number;
  isReady: boolean;
  isHost: boolean;
}

export interface PartyState {
  code: string;
  isHost: boolean;
  members: PartyMember[];
  isConnected: boolean;
  error: string | null;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  skinId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitch: number;
  health: number;
  shield: number;
  isAlive: boolean;
  isSkydiving: boolean;
  isGliding: boolean;
  activeWeaponType: WeaponType;
  weaponRarity: WeaponRarity;
  isShooting: boolean;
}

export interface MatchStats {
  placement: number;
  totalPlayers: number;
  eliminations: number;
  damageDealt: number;
  damageTaken: number;
  structuresBuilt: number;
  chestsOpened: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  timeSurvived: number; // in seconds
  xpEarned: number;
  vbucksEarned: number;
  baseCoins?: number;
  eliminationBonusCoins?: number;
}


