import { FortniteWeapon, WeaponRarity } from '../types';

export const RARITY_COLORS: Record<WeaponRarity, { border: string; bg: string; text: string; glow: string; hex: string }> = {
  common: {
    border: 'border-slate-500',
    bg: 'from-slate-700/80 to-slate-900/90',
    text: 'text-slate-200',
    glow: 'rgba(148, 163, 184, 0.4)',
    hex: '#94a3b8',
  },
  uncommon: {
    border: 'border-emerald-500',
    bg: 'from-emerald-700/80 to-emerald-950/90',
    text: 'text-emerald-300',
    glow: 'rgba(16, 185, 129, 0.5)',
    hex: '#10b981',
  },
  rare: {
    border: 'border-blue-500',
    bg: 'from-blue-700/80 to-blue-950/90',
    text: 'text-blue-300',
    glow: 'rgba(59, 130, 246, 0.6)',
    hex: '#3b82f6',
  },
  epic: {
    border: 'border-purple-500',
    bg: 'from-purple-700/80 to-purple-950/90',
    text: 'text-purple-300',
    glow: 'rgba(168, 85, 247, 0.7)',
    hex: '#a855f7',
  },
  legendary: {
    border: 'border-amber-500',
    bg: 'from-amber-600/80 to-amber-950/90',
    text: 'text-amber-300',
    glow: 'rgba(245, 158, 11, 0.8)',
    hex: '#f59e0b',
  },
  mythic: {
    border: 'border-yellow-400',
    bg: 'from-yellow-500/80 to-amber-900/90',
    text: 'text-yellow-200',
    glow: 'rgba(250, 204, 21, 0.9)',
    hex: '#facc15',
  },
};

export const DEFAULT_PICKAXE: FortniteWeapon = {
  id: 'pickaxe_default',
  name: 'Default Harvesting Tool',
  rarity: 'common',
  type: 'pickaxe',
  damage: 20,
  headshotMultiplier: 1.0,
  fireRate: 1.8,
  magazineSize: 1,
  currentAmmo: 1,
  reserveAmmo: 1,
  maxReserve: 1,
  reloadTime: 0,
  spread: 0,
  range: 3.5,
  color: '#94a3b8',
  icon: '⛏️',
};

export const WEAPON_REGISTRY: Record<string, FortniteWeapon> = {
  // --- HARVESTING TOOL ---
  pickaxe_default: { ...DEFAULT_PICKAXE },

  // --- ARENA TOP-TIER META WEAPONS ---
  shotgun_double_barrel: {
    id: 'shotgun_double_barrel',
    name: 'Double-Barrel Shotgun',
    rarity: 'legendary',
    type: 'shotgun',
    damage: 145, // Devastating close range (145 base, up to 253 on headshot)
    headshotMultiplier: 1.75,
    fireRate: 3.2, // Rapid 2-shot burst
    magazineSize: 2, // 2-shot break-action cannon
    currentAmmo: 2,
    reserveAmmo: 9999,
    maxReserve: 9999,
    reloadTime: 2.8, // 2.8s break-action reload (leaves shooter completely defenseless)
    spread: 0.052,
    range: 26,
    falloffStart: 6,
    falloffEnd: 22,
    falloffMinMultiplier: 0.15,
    pelletCount: 14,
    color: '#f59e0b',
    icon: '💥',
    recoilPattern: 'heavy_kick',
    recoilPitch: 0.16,
    recoilYaw: 0.02,
    bloomSpreadMin: 0.038,
    bloomSpreadMax: 0.11,
    bloomRecoverySpeed: 4.0,
    utilityPerk: 'Point-Blank Pixel Shredder',
    perkDescription: 'Fires a devastating two-shot break-action blast that instantly shreds opposing players into pixels up close. Slow 2.8s reload leaves shooter defenseless while slipping in two fresh shells.',
  },

  rifle_burst: {
    id: 'rifle_burst',
    name: 'Burst Rifle',
    rarity: 'rare',
    type: 'ar',
    damage: 34, // 34 base per round (34 * 3 = 102 burst damage, up to 178 on headshots)
    headshotMultiplier: 1.75,
    fireRate: 1.8, // 1.8 bursts/sec
    magazineSize: 30, // 30-round mag = 10 three-round bursts
    currentAmmo: 30,
    reserveAmmo: 9999,
    maxReserve: 9999,
    reloadTime: 2.2,
    spread: 0.007, // Tight match-grade precision
    range: 78,
    falloffStart: 36,
    falloffEnd: 72,
    falloffMinMultiplier: 0.65,
    color: '#38bdf8',
    icon: '🎯',
    recoilPattern: 'vertical_kick',
    recoilPitch: 0.055, // Recoil kicks the barrel upward on 3rd round
    recoilYaw: 0.004,
    bloomSpreadMin: 0.005,
    bloomSpreadMax: 0.032,
    bloomRecoverySpeed: 5.5,
    utilityPerk: 'Triple-Round Marksman Fire',
    perkDescription:
      'Fires three crisp rounds in a single trigger pull. Favored by sharp-eyed marksmen to strike moving enemies at medium distance before recoil kicks the barrel upward.',
  },

  // --- HEALTH PACKS & CONSUMABLES ---
  mini_shields: {
    id: 'mini_shields',
    name: 'Mini Shield Potion',
    rarity: 'uncommon',
    type: 'shield',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 3,
    currentAmmo: 3,
    reserveAmmo: 3,
    maxReserve: 6,
    reloadTime: 0,
    spread: 0,
    range: 0,
    shieldAmount: 25,
    useTime: 2.0,
    color: '#38bdf8',
    icon: '🧪',
  },
  big_shield: {
    id: 'big_shield',
    name: 'Big Shield Potion',
    rarity: 'rare',
    type: 'shield',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 1,
    currentAmmo: 1,
    reserveAmmo: 1,
    maxReserve: 3,
    reloadTime: 0,
    spread: 0,
    range: 0,
    shieldAmount: 50,
    useTime: 3.5,
    color: '#2563eb',
    icon: '🏺',
  },
  chug_jug: {
    id: 'chug_jug',
    name: 'Legendary Chug Jug',
    rarity: 'legendary',
    type: 'heal',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 1,
    currentAmmo: 1,
    reserveAmmo: 1,
    maxReserve: 1,
    reloadTime: 0,
    spread: 0,
    range: 0,
    healAmount: 250,
    shieldAmount: 250,
    useTime: 12.0,
    color: '#f59e0b',
    icon: '🛢️',
  },
  slurp_juice: {
    id: 'slurp_juice',
    name: 'Slurp Juice',
    rarity: 'epic',
    type: 'heal',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 2,
    currentAmmo: 2,
    reserveAmmo: 2,
    maxReserve: 4,
    reloadTime: 0,
    spread: 0,
    range: 0,
    healAmount: 75,
    shieldAmount: 75,
    useTime: 2.0,
    color: '#a855f7',
    icon: '🧃',
  },
  medkit: {
    id: 'medkit',
    name: 'Medkit',
    rarity: 'uncommon',
    type: 'heal',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 1,
    currentAmmo: 1,
    reserveAmmo: 1,
    maxReserve: 3,
    reloadTime: 0,
    spread: 0,
    range: 0,
    healAmount: 250,
    useTime: 5.0,
    color: '#10b981',
    icon: '🩹',
  },
  bandages: {
    id: 'bandages',
    name: 'Bandages (x5)',
    rarity: 'common',
    type: 'heal',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 5,
    currentAmmo: 5,
    reserveAmmo: 5,
    maxReserve: 15,
    reloadTime: 0,
    spread: 0,
    range: 0,
    healAmount: 15,
    useTime: 2.5,
    color: '#94a3b8',
    icon: '🧻',
  },
  flopper_fish: {
    id: 'flopper_fish',
    name: 'Flopper Fish',
    rarity: 'rare',
    type: 'heal',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 3,
    currentAmmo: 3,
    reserveAmmo: 3,
    maxReserve: 4,
    reloadTime: 0,
    spread: 0,
    range: 0,
    healAmount: 50,
    useTime: 1.0,
    color: '#3b82f6',
    icon: '🐟',
  },
  shield_fish: {
    id: 'shield_fish',
    name: 'Shield Fish',
    rarity: 'rare',
    type: 'shield',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 1,
    magazineSize: 3,
    currentAmmo: 3,
    reserveAmmo: 3,
    maxReserve: 4,
    reloadTime: 0,
    spread: 0,
    range: 0,
    shieldAmount: 50,
    useTime: 1.0,
    color: '#06b6d4',
    icon: '🐠',
  },
  chug_splash: {
    id: 'chug_splash',
    name: 'Chug Splash (x2)',
    rarity: 'rare',
    type: 'heal',
    damage: 0,
    headshotMultiplier: 1,
    fireRate: 2,
    magazineSize: 2,
    currentAmmo: 2,
    reserveAmmo: 2,
    maxReserve: 6,
    reloadTime: 0,
    spread: 0,
    range: 0,
    healAmount: 20,
    shieldAmount: 20,
    useTime: 0.5,
    color: '#06b6d4',
    icon: '🌊',
  },
};

// --- WEAPON UPGRADE BENCH & SHOP CATALOG ---
export const RARITY_UPGRADE_ORDER: WeaponRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const UPGRADE_BENCH_COSTS: Record<WeaponRarity, { gold: number; wood: number; stone: number; metal: number }> = {
  common: { gold: 100, wood: 100, stone: 50, metal: 25 },
  uncommon: { gold: 150, wood: 150, stone: 100, metal: 50 },
  rare: { gold: 250, wood: 200, stone: 150, metal: 100 },
  epic: { gold: 400, wood: 300, stone: 250, metal: 150 },
  legendary: { gold: 600, wood: 450, stone: 350, metal: 250 },
  mythic: { gold: 999, wood: 999, stone: 999, metal: 999 },
};

export interface ShopUpgradeItem {
  id: string;
  name: string;
  category: 'rarity' | 'mod' | 'heal' | 'ammo' | 'material';
  description: string;
  costGold: number;
  costWood?: number;
  costStone?: number;
  costMetal?: number;
  icon: string;
  color: string;
}

export const SHOP_CATALOG = {
  mods: [
    {
      id: 'mod_damage',
      name: 'High-Caliber Receiver',
      type: 'damageBonus',
      bonus: 0.15,
      desc: '+15% Bullet Damage',
      costGold: 200,
      icon: '🔥',
    },
    {
      id: 'mod_mag',
      name: 'Extended Drum Magazine',
      type: 'magBonus',
      bonus: 10,
      desc: '+35% Ammo Capacity',
      costGold: 150,
      icon: '🔋',
    },
    {
      id: 'mod_reload',
      name: 'Speed-Loader Magwell',
      type: 'reloadBonus',
      bonus: 0.3,
      desc: '-30% Reload Time',
      costGold: 150,
      icon: '⚡',
    },
    {
      id: 'mod_spread',
      name: 'Laser Sight & Grip',
      type: 'spreadBonus',
      bonus: 0.45,
      desc: '-45% Bullet Spread (Tight Accuracy)',
      costGold: 200,
      icon: '🎯',
    },
    {
      id: 'mod_firerate',
      name: 'Rapid Hair-Trigger',
      type: 'fireRateBonus',
      bonus: 0.18,
      desc: '+18% Faster Rate of Fire',
      costGold: 220,
      icon: '🌪️',
    },
  ],
  heals: [
    { id: 'chug_jug', name: 'Chug Jug', costGold: 250, icon: '🛢️', desc: 'Full 250 HP & 250 Shield' },
    { id: 'slurp_juice', name: 'Slurp Juice', costGold: 180, icon: '🧃', desc: '+75 HP & +75 Shield over time' },
    { id: 'big_shield', name: 'Big Shield Potion', costGold: 100, icon: '🏺', desc: '+50 Shield' },
    { id: 'mini_shields', name: 'Mini Shield (x3)', costGold: 60, icon: '🧪', desc: '+25 Shield up to 50' },
    { id: 'medkit', name: 'Medkit', costGold: 90, icon: '🩹', desc: 'Restores 250 Max Health' },
    { id: 'flopper_fish', name: 'Flopper Fish', costGold: 80, icon: '🐟', desc: 'Instant +50 Health' },
  ],
  materials: [
    { id: 'mat_wood', name: 'Wood Bundle (+250)', costGold: 80, icon: '🪵', amount: 250, type: 'wood' },
    { id: 'mat_stone', name: 'Stone Crate (+150)', costGold: 90, icon: '🧱', amount: 150, type: 'stone' },
    { id: 'mat_metal', name: 'Metal Ingot (+100)', costGold: 100, icon: '⛓️', amount: 100, type: 'metal' },
  ],
};

// --- S-TOKEN SHOP WEAPONS ARSENAL CATALOG ---
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

export const SHOP_WEAPONS_CATALOG: ShopWeaponItem[] = [
  {
    id: 'shotgun_double_barrel',
    name: 'Double-Barrel Shotgun',
    category: 'shotgun',
    categoryLabel: 'BREAK-ACTION CANNON',
    rarity: 'legendary',
    costTokens: 450,
    tag: '🔥 TOP-TIER META',
    isStarter: false,
    description:
      'Immensely popular, top-tier arena cannon for 450 tokens. Delivers two thunderous break-action blasts in rapid succession that instantly shred opposing players into pixels up close, but leaves the shooter completely defenseless while slipping in two fresh shells.',
    specialPerk: 'Pixel Shredder: 145 Base Damage & Rapid 2-Shot Burst',
    icon: '💥',
    fireRate: 3.2,
    recoilPattern: 'heavy_kick',
    recoilPatternLabel: 'Violent Kinetic Kick',
    recoilDifficulty: 'medium',
    elementalEffect: 'kinetic',
    elementalLabel: 'Kinetic Shockwave',
    utilityPerk: 'Pixel Disintegration & Break-Action Delay',
    perkDescription:
      'Point-blank eliminations disintegrate opponents into exploding digital voxel pixels. Extended 2.8s reload leaves you defenseless.',
    dpsComparison: '290+ burst damage in 0.6s • 2-shell capacity • 2.8s reload window',
  },
  {
    id: 'rifle_burst',
    name: 'Burst Rifle',
    category: 'ar',
    categoryLabel: '3-ROUND BURST MARKSMAN',
    rarity: 'rare',
    costTokens: 250,
    tag: '🎯 MARKSMAN CHOICE',
    isStarter: false,
    description:
      'Budget-friendly 250-token shop weapon heavily favored by sharp-eyed marksmen. Fires three crisp rounds in a single trigger pull to strike moving enemies at medium distance before recoil kicks the barrel upward.',
    specialPerk: 'Triple-Tap Precision: 3 Crisp Rounds with Upward Recoil Rise',
    icon: '🎯',
    fireRate: 1.8,
    recoilPattern: 'vertical_kick',
    recoilPatternLabel: '3-Round Vertical Barrel Climb',
    recoilDifficulty: 'low',
    elementalEffect: 'kinetic',
    elementalLabel: 'High-Velocity Kinetic',
    utilityPerk: 'Sharp-Eyed Marksman Burst',
    perkDescription:
      'Single trigger pull releases 3 match-grade rounds in 150ms. First two shots laser into moving targets at medium range before upward recoil kicks the third into the upper chest/head.',
    dpsComparison: '102 burst damage in 0.15s • 30-round mag (10 bursts) • 250 Tokens budget price',
  },
];

// --- WEAPON MASTERY TIERS CONFIG ---
export interface WeaponTierDetail {
  tier: number;
  name: string;
  costTokens: number;
  badge: string;
  damageMultiplier: number;
  reloadMultiplier: number;
  magBonus: number;
  spreadMultiplier: number;
  fireRateMultiplier: number;
  glowColor: string;
  borderClass: string;
  desc: string;
}

export const WEAPON_TIER_CONFIG: Record<number, WeaponTierDetail> = {
  1: {
    tier: 1,
    name: 'Stock Factory',
    costTokens: 0,
    badge: 'TIER 1 • STOCK',
    damageMultiplier: 1.0,
    reloadMultiplier: 1.0,
    magBonus: 0,
    spreadMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    glowColor: '#94a3b8',
    borderClass: 'border-slate-500/50',
    desc: 'Base weapon factory configuration.',
  },
  2: {
    tier: 2,
    name: 'Enhanced Tactical',
    costTokens: 250,
    badge: 'TIER 2 • ENHANCED',
    damageMultiplier: 1.12,
    reloadMultiplier: 0.85,
    magBonus: 4,
    spreadMultiplier: 0.82,
    fireRateMultiplier: 1.08,
    glowColor: '#3b82f6',
    borderClass: 'border-blue-500/70',
    desc: '+12% Damage, +15% Faster Reload, +4 Mag Size, -18% Spread.',
  },
  3: {
    tier: 3,
    name: 'Mastercrafted Spec-Ops',
    costTokens: 500,
    badge: 'TIER 3 • MASTERCRAFTED',
    damageMultiplier: 1.24,
    reloadMultiplier: 0.72,
    magBonus: 8,
    spreadMultiplier: 0.65,
    fireRateMultiplier: 1.16,
    glowColor: '#a855f7',
    borderClass: 'border-purple-500/80',
    desc: '+24% Damage, +28% Faster Reload, +8 Mag Size, -35% Spread, +16% Fire Rate.',
  },
  4: {
    tier: 4,
    name: 'Overcharged Mythic Apex',
    costTokens: 850,
    badge: 'TIER 4 • OVERCHARGED 👑',
    damageMultiplier: 1.38,
    reloadMultiplier: 0.58,
    magBonus: 14,
    spreadMultiplier: 0.48,
    fireRateMultiplier: 1.25,
    glowColor: '#f59e0b',
    borderClass: 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]',
    desc: '+38% Damage, +42% Faster Reload, +14 Mag, -52% Spread, +25% Fire Rate & Golden Aura!',
  },
};

// --- GLOBAL ARMORY PERKS (UPGRADES) CONFIG ---
export interface ArmoryPerkDetail {
  id: 'damageBoost' | 'reloadBoost' | 'magBoost' | 'spreadReduction' | 'fireRateBoost' | 'siphonShield';
  name: string;
  icon: string;
  description: string;
  perLevelText: string;
  maxLevel: number;
  costs: number[]; // S-Token cost for levels 1, 2, 3, 4, 5
}

export const ARMORY_PERKS_CONFIG: ArmoryPerkDetail[] = [
  {
    id: 'damageBoost',
    name: 'High-Caliber Hollow-Points',
    icon: '🔥',
    description: 'Increases bullet lethality and kinetic impact across all arsenal weapons.',
    perLevelText: '+5% All Weapons Damage per level (up to +25%)',
    maxLevel: 5,
    costs: [150, 250, 400, 650, 950],
  },
  {
    id: 'reloadBoost',
    name: 'Quick-Magwell Ergonomics',
    icon: '⚡',
    description: 'Tactical chamfered magwells that cut down reload times significantly.',
    perLevelText: '-8% Reload Time per level (up to -40% speed)',
    maxLevel: 5,
    costs: [120, 200, 350, 550, 800],
  },
  {
    id: 'magBoost',
    name: 'Extended Drum Capacity',
    icon: '🔋',
    description: 'Enlarged magazine wells allowing more ammunition per clip before reloading.',
    perLevelText: '+10% Magazine Ammo Capacity per level (up to +50%)',
    maxLevel: 5,
    costs: [140, 220, 380, 600, 900],
  },
  {
    id: 'spreadReduction',
    name: 'Laser Sight & Recoil Brake',
    icon: '🎯',
    description: 'Suppresses weapon bloom and stabilizes reticle recoil for laser accuracy.',
    perLevelText: '-12% Bullet Spread/Bloom per level (up to -60%)',
    maxLevel: 5,
    costs: [150, 250, 420, 650, 950],
  },
  {
    id: 'fireRateBoost',
    name: 'Hair-Trigger Assembly',
    icon: '🌪️',
    description: 'Ultra-sensitive trigger mechanisms enabling faster cyclic fire rates.',
    perLevelText: '+5% Rate of Fire per level (up to +25%)',
    maxLevel: 5,
    costs: [160, 280, 450, 700, 1000],
  },
  {
    id: 'siphonShield',
    name: 'Vampiric Siphon Capacitor',
    icon: '🩸',
    description: 'Instant combat siphon that immediately restores +35 Shield/HP upon every elimination.',
    perLevelText: 'Grants +35 Shield Siphon on Kill',
    maxLevel: 1,
    costs: [500],
  },
];

// Helper to compute effective stats for any weapon given Tier & Armory Perks
export function getWeaponEffectiveStats(
  weapon: FortniteWeapon,
  tier: number = 1,
  armoryPerks?: {
    damageBoost?: number;
    reloadBoost?: number;
    magBoost?: number;
    spreadReduction?: number;
    fireRateBoost?: number;
  }
) {
  const tierConfig = WEAPON_TIER_CONFIG[tier] || WEAPON_TIER_CONFIG[1];
  const perkDmg = 1 + (armoryPerks?.damageBoost || 0) * 0.05;
  const perkReload = Math.max(0.4, 1 - (armoryPerks?.reloadBoost || 0) * 0.08);
  const perkMag = 1 + (armoryPerks?.magBoost || 0) * 0.10;
  const perkSpread = Math.max(0.3, 1 - (armoryPerks?.spreadReduction || 0) * 0.12);
  const perkFireRate = 1 + (armoryPerks?.fireRateBoost || 0) * 0.05;

  const effectiveDamage = Math.round(weapon.damage * tierConfig.damageMultiplier * perkDmg);
  const effectiveReload = Number((weapon.reloadTime * tierConfig.reloadMultiplier * perkReload).toFixed(2));
  const effectiveMag = Math.max(1, Math.round((weapon.magazineSize + tierConfig.magBonus) * perkMag));
  const effectiveSpread = Number((weapon.spread * tierConfig.spreadMultiplier * perkSpread).toFixed(4));
  const effectiveFireRate = Number((weapon.fireRate * tierConfig.fireRateMultiplier * perkFireRate).toFixed(1));

  return {
    damage: effectiveDamage,
    reloadTime: effectiveReload,
    magazineSize: effectiveMag,
    spread: effectiveSpread,
    fireRate: effectiveFireRate,
    headshotDamage: Math.round(effectiveDamage * weapon.headshotMultiplier),
    dps: Math.round(effectiveDamage * effectiveFireRate),
  };
}

export interface FortniteSkin {
  id: string;
  name: string;
  description: string;
  rarity: WeaponRarity;
  headColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  glowColor: string;
  hasHat?: boolean;
  hatColor?: string;
  hasMask?: boolean;
  isGold?: boolean;
  icon: string;
  unlockLevel: number;
}

export const FORTNITE_SKINS: FortniteSkin[] = [
  {
    id: 'jonesy',
    name: 'Jonesy The First',
    description: 'The iconic Battle Royale Chapter 1 Recruit.',
    rarity: 'uncommon',
    headColor: '#f7c297',
    hairColor: '#eab308',
    shirtColor: '#475569',
    pantsColor: '#65a30d',
    glowColor: '#10b981',
    icon: '👱‍♂️',
    unlockLevel: 1,
  },
  {
    id: 'peely',
    name: 'Agent Peely',
    description: 'Suit up. It is potassium time.',
    rarity: 'epic',
    headColor: '#facc15',
    hairColor: '#854d0e',
    shirtColor: '#1e293b',
    pantsColor: '#0f172a',
    glowColor: '#facc15',
    icon: '🍌',
    unlockLevel: 2,
  },
  {
    id: 'midas',
    name: 'Midas (Golden Touch)',
    description: 'All that glitters is yours to conquer.',
    rarity: 'legendary',
    headColor: '#f7c297',
    hairColor: '#18181b',
    shirtColor: '#eab308',
    pantsColor: '#ca8a04',
    glowColor: '#f59e0b',
    isGold: true,
    icon: '👑',
    unlockLevel: 5,
  },
  {
    id: 'drift',
    name: 'Drift (Max Stage)',
    description: 'Journey from the real world into the rift.',
    rarity: 'legendary',
    headColor: '#f7c297',
    hairColor: '#e11d48',
    shirtColor: '#db2777',
    pantsColor: '#18181b',
    glowColor: '#ec4899',
    hasMask: true,
    icon: '🦊',
    unlockLevel: 8,
  },
  {
    id: 'black_knight',
    name: 'The Black Knight',
    description: 'The odious scourge of Wailing Woods.',
    rarity: 'legendary',
    headColor: '#0f172a',
    hairColor: '#000000',
    shirtColor: '#18181b',
    pantsColor: '#0f172a',
    glowColor: '#ef4444',
    hasHat: true,
    hatColor: '#dc2626',
    icon: '🛡️',
    unlockLevel: 12,
  },
  {
    id: 'renegade_raider',
    name: 'Renegade Raider',
    description: 'Rare OG pilot warrior of the Storm.',
    rarity: 'mythic',
    headColor: '#f7c297',
    hairColor: '#78350f',
    shirtColor: '#b45309',
    pantsColor: '#451a03',
    glowColor: '#f59e0b',
    hasHat: true,
    hatColor: '#78350f',
    icon: '🪖',
    unlockLevel: 15,
  },
  {
    id: 'goku',
    name: 'Son Goku (Super Saiyan)',
    description: 'The legendary warrior raised on Earth.',
    rarity: 'mythic',
    headColor: '#fed7aa',
    hairColor: '#facc15',
    shirtColor: '#ea580c',
    pantsColor: '#ea580c',
    glowColor: '#38bdf8',
    icon: '✨',
    unlockLevel: 20,
  },
  {
    id: 'travis_scott',
    name: 'Travis Scott (Astronomical)',
    description: 'Out of this world stage presence with Astroworld chain & Cactus Jack vibes.',
    rarity: 'mythic',
    headColor: '#8d5b4c',
    hairColor: '#171717',
    shirtColor: '#262626',
    pantsColor: '#1c1917',
    glowColor: '#a855f7',
    icon: '🎤',
    unlockLevel: 22,
  },
  {
    id: 'galaxy',
    name: 'Galaxy Warrior',
    description: 'Deep cosmic rift guardian wrapped in glowing starlight and space nebula.',
    rarity: 'mythic',
    headColor: '#3b82f6',
    hairColor: '#a855f7',
    shirtColor: '#1e1b4b',
    pantsColor: '#0f172a',
    glowColor: '#c084fc',
    icon: '🌌',
    unlockLevel: 25,
  },
  {
    id: 'omega',
    name: 'Omega (Max Lights)',
    description: 'High-tech armored supervillain with glowing neon crimson energy channels.',
    rarity: 'legendary',
    headColor: '#0f172a',
    hairColor: '#000000',
    shirtColor: '#18181b',
    pantsColor: '#0f172a',
    glowColor: '#ef4444',
    hasMask: true,
    icon: '🤖',
    unlockLevel: 18,
  },
  {
    id: 'raven',
    name: 'Raven (Shadow Phantom)',
    description: 'Brooding feathered phantom of Nevermore with piercing violet spectral eyes.',
    rarity: 'legendary',
    headColor: '#1e1b4b',
    hairColor: '#09090b',
    shirtColor: '#312e81',
    pantsColor: '#18181b',
    glowColor: '#8b5cf6',
    hasHat: true,
    hatColor: '#312e81',
    icon: '🦅',
    unlockLevel: 14,
  },
  {
    id: 'skull_trooper',
    name: 'Skull Trooper (Inverted Purple)',
    description: 'OG skeleton battle ghoul with illuminated neon purple bone framework.',
    rarity: 'epic',
    headColor: '#020617',
    hairColor: '#000000',
    shirtColor: '#09090b',
    pantsColor: '#020617',
    glowColor: '#a855f7',
    hasMask: true,
    icon: '💀',
    unlockLevel: 10,
  },
  {
    id: 'aura',
    name: 'Aura (Champion)',
    description: 'The golden jewel hunter and ultimate tournament champion sweat skin.',
    rarity: 'rare',
    headColor: '#fed7aa',
    hairColor: '#eab308',
    shirtColor: '#f59e0b',
    pantsColor: '#27272a',
    glowColor: '#fbbf24',
    icon: '✨',
    unlockLevel: 6,
  },
];

export interface IslandPOI {
  name: string;
  x: number;
  z: number;
  type: 'city' | 'town' | 'lake' | 'industrial' | 'suburb';
  color: string;
  chestsCount: number;
}

export const ISLAND_POIS: IslandPOI[] = [
  { name: 'TILTED TOWERS', x: 0, z: 0, type: 'city', color: '#0ea5e9', chestsCount: 8 },
  { name: 'PLEASANT PARK', x: -140, z: -140, type: 'town', color: '#22c55e', chestsCount: 6 },
  { name: 'DUSTY DEPOT', x: 130, z: -40, type: 'industrial', color: '#f97316', chestsCount: 5 },
  { name: 'SALTY SPRINGS', x: 40, z: 120, type: 'suburb', color: '#eab308', chestsCount: 5 },
  { name: 'LOOT LAKE', x: -60, z: -70, type: 'lake', color: '#38bdf8', chestsCount: 6 },
  { name: 'RETAIL ROW', x: 150, z: 120, type: 'town', color: '#a855f7', chestsCount: 6 },
];

export const BOT_NAMES = [
  'GhostRecon_Viper',
  'ApexVortex_99',
  'Valkyrie_Reaper',
  'CyberPhantom_X',
  'ShadowReaper_01',
  'NeonSpectre_Pro',
  'TitanStriker_OG',
  'ZenithGod_Clutch',
  'HyperNova_Sniper',
  'OmegaZero_Apex',
  'AuraSlayer_2026',
  'VenomStrike_BR',
  'HavocOverlord',
  'RogueVanguard_God',
  'KryptonClutch_T1',
  'StormValkyrie',
  'OnePumpDemon',
  'VoidStalker_Elite',
  'QuantumPulse_X',
  'LaserGod_Bugha',
];
