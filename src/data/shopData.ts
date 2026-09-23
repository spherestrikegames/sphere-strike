import { WeaponRarity } from '../types';

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
  {
    id: 'sniper_heavy_legendary',
    name: 'Heavy Sniper Rifle',
    category: 'sniper',
    categoryLabel: 'ANTI-MATERIEL BARRICADE BREAKER',
    rarity: 'legendary',
    costTokens: 600,
    tag: '👑 600-TOKEN LUXURY WEAPON',
    isStarter: false,
    description:
      'Ultra-popular 600-token luxury weapon that rewards patient sharpshooters with a booming, high-caliber round capable of shattering protective barricades in one hit and instantly eliminating full-shield rivals across the map.',
    specialPerk: '💥 Barricade Breaker: 1,000 Structure Damage & 300 Headshot Elimination',
    icon: '🎯',
    fireRate: 0.33,
    recoilPattern: 'heavy_kick',
    recoilPatternLabel: 'High-Caliber Anti-Materiel Recoil',
    recoilDifficulty: 'high',
    elementalEffect: 'kinetic',
    elementalLabel: 'Armor-Piercing Anti-Materiel',
    utilityPerk: 'Instant Structure Shatter & One-Shot Elimination',
    perkDescription:
      'Instantly disintegrates player-built wood, stone, or metal barricades in 1 shot. Deals 150 body / 300 headshot damage to instantly eliminate rivals at any range.',
    dpsComparison: '150 Body / 300 Headshot Damage • 1,000 Structure Damage • 600 Luxury Tokens',
  },
  {
    id: 'shotgun_tac_epic',
    name: 'Tactical Shotgun',
    category: 'shotgun',
    categoryLabel: 'RAPID-FIRE SEMI-AUTO SCATTERGUN',
    rarity: 'epic',
    costTokens: 350,
    tag: '🌟 NEWCOMER FAVORITE • 350 TOKENS',
    isStarter: false,
    description:
      'Wildly loved combat choice for newcomers. A fast-cycling, semi-automatic scattergun that lets players continuously pepper dodging opponents with buckshot without pausing between every single shot.',
    specialPerk: '💥 Fast-Cycling Buckshot: Continuous 1.5 RPS semi-auto fire with 8-shell capacity',
    icon: '🔫',
    fireRate: 1.5,
    recoilPattern: 'spread_bloom',
    recoilPatternLabel: 'Forgiving Close-Quarters Recoil',
    recoilDifficulty: 'low',
    elementalEffect: 'kinetic',
    elementalLabel: 'High-Spread Buckshot',
    utilityPerk: 'Forgiving Newcomer Tracking',
    perkDescription:
      'Continuous 1.5 RPS semi-auto cycling eliminates punishment for missed shots. 8-shell magazine keeps relentless pressure on agile, dodging opponents.',
    dpsComparison: '126 DPS • 8-Shell Tube Capacity • 1.5 RPS Semi-Auto • 350 Tokens',
  },
];

export interface ArmoryPerkDetail {
  id: 'damageBoost' | 'reloadBoost' | 'magBoost' | 'spreadReduction' | 'fireRateBoost' | 'siphonShield';
  name: string;
  icon: string;
  description: string;
  perLevelText: string;
  maxLevel: number;
  costs: number[];
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
