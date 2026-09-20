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
