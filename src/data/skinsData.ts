import { WeaponRarity } from '../types';

export interface FortniteSkin {
  id: string;
  gender: 'boy';
  name: string;
  description: string;
  rarity: WeaponRarity;
  headColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  glowColor: string;
  icon: string;
  unlockLevel: number;
  hairStyle: 'spikes' | 'swept' | 'curly' | 'crest' | 'fringe' | 'short';
  accessory: 'visor' | 'scarf' | 'shoulder-pad' | 'headband' | 'earpiece' | 'backpack' | 'none';
  // Kept optional for compatibility with the legacy sphere-rig export.
  hasHat?: boolean;
  hatColor?: string;
  hasMask?: boolean;
  isGold?: boolean;
}

export const FORTNITE_SKINS: FortniteSkin[] = [
  { id: 'zyro', gender: 'boy', name: 'Zyro', description: 'A quick-moving street tech with bright blue gear.', rarity: 'uncommon', headColor: '#e8b58e', hairColor: '#dcecff', shirtColor: '#087fca', pantsColor: '#172d43', glowColor: '#27c8ff', icon: '🧢', unlockLevel: 1, hairStyle: 'spikes', accessory: 'visor' },
  { id: 'rift', gender: 'boy', name: 'Rift', description: 'A confident purple-and-black style with a sharp silhouette.', rarity: 'rare', headColor: '#c98768', hairColor: '#402319', shirtColor: '#6d28d9', pantsColor: '#20202b', glowColor: '#b45cff', icon: '⚡', unlockLevel: 2, hairStyle: 'swept', accessory: 'shoulder-pad' },
  { id: 'vexlo', gender: 'boy', name: 'Vexlo', description: 'A cool-headed competitor in mint and charcoal.', rarity: 'rare', headColor: '#f0c39c', hairColor: '#202c37', shirtColor: '#18a999', pantsColor: '#273744', glowColor: '#62f0cf', icon: '✦', unlockLevel: 4, hairStyle: 'curly', accessory: 'earpiece' },
  { id: 'kairox', gender: 'boy', name: 'Kairox', description: 'A bold orange-and-graphite street racer.', rarity: 'epic', headColor: '#d99a72', hairColor: '#17191e', shirtColor: '#f07828', pantsColor: '#30313b', glowColor: '#ffb14a', icon: '🔥', unlockLevel: 6, hairStyle: 'crest', accessory: 'headband' },
  { id: 'voltix', gender: 'boy', name: 'Voltix', description: 'An energetic yellow-accented parkour specialist.', rarity: 'epic', headColor: '#f2c9a4', hairColor: '#f0d34c', shirtColor: '#3949ab', pantsColor: '#202d54', glowColor: '#ffe45e', icon: '⚡', unlockLevel: 8, hairStyle: 'spikes', accessory: 'scarf' },
  { id: 'nex', gender: 'boy', name: 'Nex', description: 'A quiet competitor with a clean red-and-black look.', rarity: 'legendary', headColor: '#b9795e', hairColor: '#151515', shirtColor: '#c93448', pantsColor: '#25232b', glowColor: '#ff526b', icon: '◆', unlockLevel: 10, hairStyle: 'short', accessory: 'backpack' },
  { id: 'glitch', gender: 'boy', name: 'Glitch', description: 'A playful digital-style look in cyan and violet.', rarity: 'legendary', headColor: '#e7b18b', hairColor: '#33205c', shirtColor: '#15a6c7', pantsColor: '#292342', glowColor: '#54eaff', icon: '▣', unlockLevel: 12, hairStyle: 'fringe', accessory: 'visor' },
  { id: 'orbito', gender: 'boy', name: 'Orbito', description: 'A bright, adventurous look with lime and navy details.', rarity: 'mythic', headColor: '#efc39b', hairColor: '#4b3428', shirtColor: '#75a92d', pantsColor: '#263c4b', glowColor: '#b8f45b', icon: '✧', unlockLevel: 15, hairStyle: 'curly', accessory: 'scarf' },
];
