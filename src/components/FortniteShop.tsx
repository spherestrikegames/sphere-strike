import React, { useState, useMemo } from 'react';
import { FortniteWeapon, PlayerProfile, WeaponRarity } from '../types';
import {
  RARITY_COLORS,
  SHOP_WEAPONS_CATALOG,
  WEAPON_TIER_CONFIG,
  ARMORY_PERKS_CONFIG,
  WEAPON_REGISTRY,
  FORTNITE_SKINS,
  FortniteSkin,
  getWeaponEffectiveStats,
  ShopWeaponItem,
} from '../data/fortniteData';
import { PlayerCharacterAvatar } from './PlayerCharacterAvatar';
import { fortniteAudio } from '../utils/audio';
import {
  X,
  Sparkles,
  Zap,
  Coins,
  Shield,
  Heart,
  Hammer,
  ArrowUpCircle,
  Check,
  Layers,
  ChevronRight,
  Flame,
  Target,
  Crosshair,
  Lock,
  Unlock,
  Award,
  Crown,
  Gift,
  Plus,
  Radio,
  Sliders,
  Volume2,
  Smile,
  Eye,
  RotateCcw,
} from 'lucide-react';

export interface ShopCosmeticItem {
  id: string;
  name: string;
  category: 'skin' | 'pickaxe' | 'glider';
  rarity: WeaponRarity;
  costTokens: number;
  icon: string;
  description: string;
  tag?: string;
}

export const SHOP_COSMETICS_CATALOG: ShopCosmeticItem[] = [
  {
    id: 'jonesy',
    name: 'Jonesy The First',
    category: 'skin',
    rarity: 'uncommon',
    costTokens: 0,
    icon: '👱‍♂️',
    description: 'The iconic Battle Royale Chapter 1 Recruit.',
    tag: 'DEFAULT',
  },
  {
    id: 'peely',
    name: 'Agent Peely',
    category: 'skin',
    rarity: 'epic',
    costTokens: 400,
    icon: '🍌',
    description: 'Suit up in sharp agent attire. It is potassium time.',
    tag: 'SPY AGENT',
  },
  {
    id: 'midas',
    name: 'Midas (Golden Touch)',
    category: 'skin',
    rarity: 'legendary',
    costTokens: 800,
    icon: '👑',
    description: 'All that glitters is yours to conquer with golden aura.',
    tag: 'GOLD TOUCH',
  },
  {
    id: 'drift',
    name: 'Drift (Max Stage)',
    category: 'skin',
    rarity: 'legendary',
    costTokens: 800,
    icon: '🦊',
    description: 'Journey from the real world into the rift with Kitsune mask.',
    tag: 'RIFT STORM',
  },
  {
    id: 'black_knight',
    name: 'The Black Knight',
    category: 'skin',
    rarity: 'legendary',
    costTokens: 1000,
    icon: '🛡️',
    description: 'The odious scourge of Wailing Woods with black-red armor.',
    tag: 'OG LEGEND',
  },
  {
    id: 'renegade_raider',
    name: 'Renegade Raider',
    category: 'skin',
    rarity: 'mythic',
    costTokens: 1200,
    icon: '🪖',
    description: 'Rare OG pilot warrior of the Storm with aviator helmet.',
    tag: 'MYTHIC OG',
  },
  {
    id: 'goku',
    name: 'Son Goku (Super Saiyan)',
    category: 'skin',
    rarity: 'mythic',
    costTokens: 1500,
    icon: '✨',
    description: 'The legendary warrior raised on Earth with radiant Ki aura.',
    tag: 'SUPER SAIYAN',
  },
  {
    id: 'travis_scott',
    name: 'Travis Scott (Astronomical)',
    category: 'skin',
    rarity: 'mythic',
    costTokens: 1400,
    icon: '🎤',
    description: 'Out of this world stage presence with Astroworld chain & Cactus Jack vibes.',
    tag: 'ICON SERIES',
  },
  {
    id: 'galaxy',
    name: 'Galaxy Warrior',
    category: 'skin',
    rarity: 'mythic',
    costTokens: 1600,
    icon: '🌌',
    description: 'Deep cosmic rift guardian wrapped in glowing starlight and space nebula.',
    tag: 'COSMIC',
  },
  {
    id: 'omega',
    name: 'Omega (Max Lights)',
    category: 'skin',
    rarity: 'legendary',
    costTokens: 950,
    icon: '🤖',
    description: 'High-tech armored supervillain with glowing neon crimson energy channels.',
    tag: 'CYBER VILLAIN',
  },
  {
    id: 'raven',
    name: 'Raven (Shadow Phantom)',
    category: 'skin',
    rarity: 'legendary',
    costTokens: 850,
    icon: '🦅',
    description: 'Brooding feathered phantom of Nevermore with piercing violet spectral eyes.',
    tag: 'SHADOW',
  },
  {
    id: 'skull_trooper',
    name: 'Skull Trooper (Inverted Purple)',
    category: 'skin',
    rarity: 'epic',
    costTokens: 750,
    icon: '💀',
    description: 'OG skeleton battle ghoul with illuminated neon purple bone framework.',
    tag: 'OG HALLOWEEN',
  },
  {
    id: 'aura',
    name: 'Aura (Champion)',
    category: 'skin',
    rarity: 'rare',
    costTokens: 500,
    icon: '✨',
    description: 'The golden jewel hunter and ultimate tournament champion sweat skin.',
    tag: 'SWEAT PRO',
  },
  // Pickaxes
  {
    id: 'pickaxe_default',
    name: 'Default Harvesting Tool',
    category: 'pickaxe',
    rarity: 'common',
    costTokens: 0,
    icon: '⛏️',
    description: 'Reliable iron pickaxe for gathering wood, stone & metal.',
    tag: 'DEFAULT',
  },
  {
    id: 'crowbar',
    name: 'Crowbar Tactical Axe',
    category: 'pickaxe',
    rarity: 'rare',
    costTokens: 300,
    icon: '🪓',
    description: 'Sleek pry bar designed for rapid structure demolition.',
    tag: 'HEIST',
  },
  {
    id: 'reaper',
    name: 'The Reaper Scythe',
    category: 'pickaxe',
    rarity: 'legendary',
    costTokens: 700,
    icon: '⚡',
    description: 'Pure iconic harvest scythe with terrifying slice whistle.',
    tag: 'ICONIC',
  },
  {
    id: 'star_wand',
    name: 'Star Wand Pickaxe',
    category: 'pickaxe',
    rarity: 'epic',
    costTokens: 500,
    icon: '⭐',
    description: 'Smiley star harvest wand beloved by competitive arena contenders.',
    tag: 'ARENA PRO',
  },
  {
    id: 'candy_axe',
    name: 'Peppermint Candy Axe',
    category: 'pickaxe',
    rarity: 'epic',
    costTokens: 800,
    icon: '🍭',
    description: 'Festive battleaxe wrapped in fairy lights that glow on elimination.',
    tag: 'FESTIVE',
  },
  // Gliders
  {
    id: 'glider_default',
    name: 'Standard Hang Glider',
    category: 'glider',
    rarity: 'common',
    costTokens: 0,
    icon: '🪂',
    description: 'Standard deployment canopy for island drops.',
    tag: 'DEFAULT',
  },
  {
    id: 'mako',
    name: 'Mako Shark Glider',
    category: 'glider',
    rarity: 'rare',
    costTokens: 500,
    icon: '🦈',
    description: 'Season 1 classic glider with menacing shark nose art.',
    tag: 'SEASON 1',
  },
  {
    id: 'dragon',
    name: 'Frostwing Ice Dragon',
    category: 'glider',
    rarity: 'legendary',
    costTokens: 1000,
    icon: '🐉',
    description: 'Roars through the storm clouds as you glide into the island.',
    tag: 'MYTHIC RIDE',
  },
];

interface FortniteShopProps {
  isOpen?: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  // Optional In-Match Upgrade Bench context
  gold?: number;
  wood?: number;
  stone?: number;
  metal?: number;
  inventory?: (FortniteWeapon | null)[];
  activeSlot?: number;
  onUpgradeRarity?: (slotIndex: number) => void;
  onAttachMod?: (slotIndex: number, modId: string) => void;
}

export const FortniteShop: React.FC<FortniteShopProps> = ({
  isOpen = true,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'cosmetics' | 'tiers' | 'perks' | 'loadout' | 'rewards'>('weapons');
  const [cosmeticCategoryFilter, setCosmeticCategoryFilter] = useState<'all' | 'skin' | 'pickaxe' | 'glider' | 'tokens'>('all');
  const [weaponCategoryFilter, setWeaponCategoryFilter] = useState<'all' | 'ar' | 'shotgun' | 'smg' | 'sniper' | 'heavy' | 'exotic'>('all');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(SHOP_WEAPONS_CATALOG[2]?.id || 'ar_scar');
  const [selectedCosmeticId, setSelectedCosmeticId] = useState<string>('peely');
  const [claimedRewardMessage, setClaimedRewardMessage] = useState<string | null>(null);

  // Safe Fallbacks for profile structures
  const unlockedWeapons = useMemo(() => {
    return profile.unlockedWeapons || [
      'ar_common',
      'ar_rare',
      'ar_scar',
      'shotgun_pump_uncommon',
      'shotgun_pump_epic',
      'smg_suppressed_rare',
      'sniper_bolt_legendary',
      'mini_shields',
      'medkit',
    ];
  }, [profile.unlockedWeapons]);

  const unlockedSkins = useMemo(() => {
    return profile.unlockedSkins || ['jonesy'];
  }, [profile.unlockedSkins]);

  const unlockedPickaxes = useMemo(() => {
    return profile.unlockedPickaxes || ['pickaxe_default'];
  }, [profile.unlockedPickaxes]);

  const unlockedGliders = useMemo(() => {
    return profile.unlockedGliders || ['glider_default'];
  }, [profile.unlockedGliders]);

  const weaponTiers = useMemo(() => {
    return profile.weaponTiers || {};
  }, [profile.weaponTiers]);

  const armoryPerks = useMemo(() => {
    return (
      profile.armoryPerks || {
        damageBoost: 1,
        reloadBoost: 1,
        magBoost: 0,
        spreadReduction: 1,
        fireRateBoost: 0,
        siphonShield: true,
      }
    );
  }, [profile.armoryPerks]);

  const loadout = useMemo(() => {
    return (
      profile.loadout || {
        slot1: 'ar_scar',
        slot2: 'shotgun_pump_epic',
        slot3: 'sniper_bolt_legendary',
        slot4: 'mini_shields',
        slot5: 'medkit',
      }
    );
  }, [profile.loadout]);

  if (!isOpen) return null;

  // Filter weapons
  const filteredWeapons = SHOP_WEAPONS_CATALOG.filter((w) => {
    if (weaponCategoryFilter === 'all') return true;
    return w.category === weaponCategoryFilter;
  });

  const selectedShopItem =
    SHOP_WEAPONS_CATALOG.find((w) => w.id === selectedWeaponId) || SHOP_WEAPONS_CATALOG[0];
  const selectedBaseWeapon =
    WEAPON_REGISTRY[selectedWeaponId] || WEAPON_REGISTRY.ar_scar;

  const currentTier = weaponTiers[selectedWeaponId] || 1;
  const nextTier = currentTier < 4 ? currentTier + 1 : null;
  const nextTierConfig = nextTier ? WEAPON_TIER_CONFIG[nextTier] : null;

  // Effective stats calculation
  const currentStats = getWeaponEffectiveStats(selectedBaseWeapon, currentTier, armoryPerks);
  const nextTierStats = nextTier
    ? getWeaponEffectiveStats(selectedBaseWeapon, nextTier, armoryPerks)
    : null;

  // Sound Test Fire
  const handleTestFireAudio = (wItem: ShopWeaponItem) => {
    const baseW = WEAPON_REGISTRY[wItem.id] || selectedBaseWeapon;
    if (baseW.type === 'shotgun') {
      fortniteAudio.playGunshotPump();
    } else if (baseW.type === 'sniper') {
      fortniteAudio.playGunshotSniper();
    } else if (baseW.type === 'smg') {
      fortniteAudio.playGunshotSMG();
    } else {
      fortniteAudio.playGunshotAR();
    }
  };

  // 1. UNLOCK A WEAPON WITH S-TOKENS
  const handleUnlockWeapon = (item: ShopWeaponItem) => {
    if (profile.vbucks < item.costTokens) {
      fortniteAudio.playShieldBreak?.();
      return;
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      vbucks: profile.vbucks - item.costTokens,
      unlockedWeapons: [...new Set([...unlockedWeapons, item.id])],
    };

    onUpdateProfile(updatedProfile);
    fortniteAudio.playUpgradeBenchAnvil();
    setClaimedRewardMessage(`UNLOCKED ${item.name.toUpperCase()}! ⚡`);
    setTimeout(() => setClaimedRewardMessage(null), 3000);
  };

  // 2. EQUIP WEAPON TO STARTING LOADOUT
  const handleEquipWeapon = (weaponId: string, slotKey: keyof typeof loadout) => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      loadout: {
        ...loadout,
        [slotKey]: weaponId,
      },
    };
    onUpdateProfile(updatedProfile);
    fortniteAudio.playUiClick();
    const gunName = WEAPON_REGISTRY[weaponId]?.name || 'Weapon';
    setClaimedRewardMessage(`EQUIPPED ${gunName} TO ${String(slotKey).toUpperCase()}!`);
    setTimeout(() => setClaimedRewardMessage(null), 2500);
  };

  // 3. UPGRADE WEAPON MASTERY TIER WITH S-TOKENS
  const handleUpgradeTier = () => {
    if (!nextTier || !nextTierConfig) return;
    if (profile.vbucks < nextTierConfig.costTokens) {
      fortniteAudio.playShieldBreak?.();
      return;
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      vbucks: profile.vbucks - nextTierConfig.costTokens,
      weaponTiers: {
        ...weaponTiers,
        [selectedWeaponId]: nextTier,
      },
    };

    onUpdateProfile(updatedProfile);
    fortniteAudio.playUpgradeBenchAnvil();
    setClaimedRewardMessage(`UPGRADED TO ${nextTierConfig.name.toUpperCase()}! ⚡`);
    setTimeout(() => setClaimedRewardMessage(null), 3000);
  };

  // 4. UPGRADE GLOBAL ARMORY PERK WITH S-TOKENS
  const handleUpgradePerk = (perkId: keyof typeof armoryPerks) => {
    const perkDef = ARMORY_PERKS_CONFIG.find((p) => p.id === perkId);
    if (!perkDef) return;

    if (perkId === 'siphonShield') {
      if (armoryPerks.siphonShield) return;
      const cost = perkDef.costs[0];
      if (profile.vbucks < cost) {
        fortniteAudio.playShieldBreak?.();
        return;
      }

      const updated: PlayerProfile = {
        ...profile,
        vbucks: profile.vbucks - cost,
        armoryPerks: {
          ...armoryPerks,
          siphonShield: true,
        },
      };
      onUpdateProfile(updated);
      fortniteAudio.playUpgradeBenchAnvil();
      setClaimedRewardMessage(`UNLOCKED SIPHON SHIELD (+35 ON KILL)! ⚡`);
      setTimeout(() => setClaimedRewardMessage(null), 3000);
      return;
    }

    const curLevel = (armoryPerks[perkId] as number) || 0;
    if (curLevel >= perkDef.maxLevel) return;

    const cost = perkDef.costs[curLevel] || 300;
    if (profile.vbucks < cost) {
      fortniteAudio.playShieldBreak?.();
      return;
    }

    const updated: PlayerProfile = {
      ...profile,
      vbucks: profile.vbucks - cost,
      armoryPerks: {
        ...armoryPerks,
        [perkId]: curLevel + 1,
      },
    };

    onUpdateProfile(updated);
    fortniteAudio.playUpgradeBenchAnvil();
    setClaimedRewardMessage(`UPGRADED ${perkDef.name.toUpperCase()} TO LVL ${curLevel + 1}!`);
    setTimeout(() => setClaimedRewardMessage(null), 3000);
  };

  // 5. UNLOCK & EQUIP COSMETICS (SKINS, AXES, GLIDERS)
  const handleBuyOrEquipCosmetic = (item: ShopCosmeticItem) => {
    if (item.category === 'skin') {
      const isUnlocked = unlockedSkins.includes(item.id) || item.costTokens === 0;
      if (!isUnlocked) {
        if (profile.vbucks < item.costTokens) {
          fortniteAudio.playShieldBreak?.();
          return;
        }
        const updated: PlayerProfile = {
          ...profile,
          vbucks: profile.vbucks - item.costTokens,
          unlockedSkins: [...new Set([...unlockedSkins, item.id])],
          selectedSkin: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUpgradeBenchAnvil();
        setClaimedRewardMessage(`UNLOCKED & EQUIPPED ${item.name.toUpperCase()}! 👑`);
        setTimeout(() => setClaimedRewardMessage(null), 3000);
      } else {
        const updated: PlayerProfile = {
          ...profile,
          selectedSkin: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUiClick();
        setClaimedRewardMessage(`EQUIPPED ${item.name.toUpperCase()}! 👑`);
        setTimeout(() => setClaimedRewardMessage(null), 2500);
      }
    } else if (item.category === 'pickaxe') {
      const isUnlocked = unlockedPickaxes.includes(item.id) || item.costTokens === 0;
      if (!isUnlocked) {
        if (profile.vbucks < item.costTokens) {
          fortniteAudio.playShieldBreak?.();
          return;
        }
        const updated: PlayerProfile = {
          ...profile,
          vbucks: profile.vbucks - item.costTokens,
          unlockedPickaxes: [...new Set([...unlockedPickaxes, item.id])],
          selectedPickaxe: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUpgradeBenchAnvil();
        setClaimedRewardMessage(`UNLOCKED ${item.name.toUpperCase()}! ⛏️`);
        setTimeout(() => setClaimedRewardMessage(null), 3000);
      } else {
        const updated: PlayerProfile = {
          ...profile,
          selectedPickaxe: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUiClick();
        setClaimedRewardMessage(`EQUIPPED ${item.name.toUpperCase()}! ⛏️`);
        setTimeout(() => setClaimedRewardMessage(null), 2500);
      }
    } else if (item.category === 'glider') {
      const isUnlocked = unlockedGliders.includes(item.id) || item.costTokens === 0;
      if (!isUnlocked) {
        if (profile.vbucks < item.costTokens) {
          fortniteAudio.playShieldBreak?.();
          return;
        }
        const updated: PlayerProfile = {
          ...profile,
          vbucks: profile.vbucks - item.costTokens,
          unlockedGliders: [...new Set([...unlockedGliders, item.id])],
          selectedGlider: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUpgradeBenchAnvil();
        setClaimedRewardMessage(`UNLOCKED ${item.name.toUpperCase()}! 🪂`);
        setTimeout(() => setClaimedRewardMessage(null), 3000);
      } else {
        const updated: PlayerProfile = {
          ...profile,
          selectedGlider: item.id,
        };
        onUpdateProfile(updated);
        fortniteAudio.playUiClick();
        setClaimedRewardMessage(`EQUIPPED ${item.name.toUpperCase()}! 🪂`);
        setTimeout(() => setClaimedRewardMessage(null), 2500);
      }
    }
  };

  // 7. RESET SHOP PROGRESSION (FOR TESTING)
  const handleResetProgression = () => {
    const updated: PlayerProfile = {
      ...profile,
      vbucks: 0,
      unlockedSkins: ['jonesy'],
      selectedSkin: 'jonesy',
      unlockedPickaxes: ['pickaxe_default'],
      selectedPickaxe: 'pickaxe_default',
      unlockedGliders: ['glider_default'],
      selectedGlider: 'glider_default',
    };
    onUpdateProfile(updated);
    fortniteAudio.playUiClick();
    setClaimedRewardMessage('PROGRESSION RESET: Starter Jonesy ready! Play matches & eliminate bots to earn coins (0 free tokens).');
    setTimeout(() => setClaimedRewardMessage(null), 3000);
  };

  const selectedCosmeticItem =
    SHOP_COSMETICS_CATALOG.find((c) => c.id === selectedCosmeticId) || SHOP_COSMETICS_CATALOG[1] || SHOP_COSMETICS_CATALOG[0];

  const activeCosmeticSkin =
    FORTNITE_SKINS.find((s) => s.id === (selectedCosmeticItem?.category === 'skin' ? selectedCosmeticItem.id : profile.selectedSkin)) || FORTNITE_SKINS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden text-white">
        {/* TOP HEADER: Branding, S-Token Vault, and Close Button */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/40">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-wider">
                  SPHERE STRIKE WEAPON ARSENAL & SKINS
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  COMBAT ECONOMY
                </span>
              </div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                EARN COINS BY PLAYING MATCHES & +40 COINS PER BOT KILL • NO HANDOUTS
              </p>
            </div>
          </div>

          {/* S-Token Vault Pill & Reset */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>+40 Coins Per Kill</span>
            </div>

            <button
              onClick={handleResetProgression}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-semibold border border-white/10 transition-all cursor-pointer"
              title="Reset unlocked cosmetics to test purchasing sequence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Relock Test</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/70 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <span className="text-amber-400 text-lg">🅢</span>
              <div className="flex flex-col">
                <span className="text-[9px] text-amber-300 font-bold tracking-widest uppercase">
                  COIN VAULT
                </span>
                <span className="font-mono font-black text-base sm:text-lg text-yellow-300 leading-none">
                  {profile.vbucks.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Claimed Notification banner */}
        {claimedRewardMessage && (
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm py-1.5 px-4 text-center tracking-wider animate-in slide-in-from-top duration-200 shadow-md">
            {claimedRewardMessage}
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/50 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'weapons', label: '🔫 Weapon Shop & Arsenal', icon: Flame, color: 'text-amber-400' },
            { id: 'cosmetics', label: '👑 Skin Shop & Outfits', icon: Crown, color: 'text-rose-400' },
            { id: 'tiers', label: '⚡ Weapon Mastery Tiers', icon: ArrowUpCircle, color: 'text-cyan-400' },
            { id: 'perks', label: '🛠️ Armory Perks', icon: Zap, color: 'text-purple-400' },
            { id: 'loadout', label: '🎯 Starting Loadout', icon: Target, color: 'text-emerald-400' },
            { id: 'rewards', label: '🪙 Coin Bounties', icon: Coins, color: 'text-yellow-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  fortniteAudio.playUiClick();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-102'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ======================================================== */}
          {/* TAB 1: UNLOCK BETTER GUNS & TEST FIRE                      */}
          {/* ======================================================== */}
          {activeTab === 'weapons' && (
            <div className="space-y-6">
              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'ALL ARSENAL' },
                  { id: 'ar', label: 'ASSAULT RIFLES' },
                  { id: 'shotgun', label: 'SHOTGUNS' },
                  { id: 'smg', label: 'SMGS & PISTOLS' },
                  { id: 'sniper', label: 'SNIPERS & DMR' },
                  { id: 'heavy', label: 'HEAVY & RPG' },
                  { id: 'exotic', label: 'MYTHIC & EXOTIC' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setWeaponCategoryFilter(cat.id as any);
                      fortniteAudio.playUiClick();
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      weaponCategoryFilter === cat.id
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-black/40 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Weapons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWeapons.map((item) => {
                  const baseW = WEAPON_REGISTRY[item.id];
                  const isUnlocked = unlockedWeapons.includes(item.id) || item.costTokens === 0;
                  const tier = weaponTiers[item.id] || 1;
                  const stats = baseW ? getWeaponEffectiveStats(baseW, tier, armoryPerks) : null;
                  const rColors = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                  const isSelected = selectedWeaponId === item.id;
                  const canAfford = profile.vbucks >= item.costTokens;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedWeaponId(item.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-slate-900/95 shadow-xl ring-2 ring-amber-400/50'
                          : 'border-white/10 bg-black/40 hover:bg-white/5'
                      }`}
                    >
                      {/* Top item badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${rColors.border} bg-gradient-to-br ${rColors.bg} shadow-md`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-black uppercase ${rColors.text}`}>
                                {item.rarity} {item.categoryLabel}
                              </span>
                              {item.tag && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <h3 className="font-display font-black text-base text-white line-clamp-1">
                              {item.name}
                            </h3>
                          </div>
                        </div>

                        {/* Status Icon */}
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> UNLOCKED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> LOCKED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                        {item.description}
                      </p>

                      {/* Key Stats Bar with Fire Rate */}
                      {stats && (
                        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-black/50 border border-white/5 text-center mb-2.5">
                          <div>
                            <span className="text-[9px] text-slate-400 block">DAMAGE</span>
                            <span className="font-mono font-black text-xs text-rose-400">
                              {stats.damage}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">HEADSHOT</span>
                            <span className="font-mono font-black text-xs text-yellow-300">
                              {stats.headshotDamage}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">FIRE RATE</span>
                            <span className="font-mono font-black text-xs text-cyan-300">
                              {item.fireRate || stats.fireRate}/s
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">MAG</span>
                            <span className="font-mono font-black text-xs text-amber-300">
                              {stats.magazineSize}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Unique Weapon Traits: Recoil Pattern, Elemental Effect & DPS Advantage */}
                      <div className="flex flex-col gap-1.5 mb-3">
                        {/* Recoil Pattern & Test Fire Audio */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-white/10 text-[10px] text-slate-300 font-mono">
                            <span className="text-cyan-400 font-bold">RECOIL:</span>
                            <span>{item.recoilPatternLabel || 'Predictable Bloom'}</span>
                            <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-black">
                              {item.recoilDifficulty || 'med'}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestFireAudio(item);
                            }}
                            title="Preview Gunshot Audio"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[10px] transition-all cursor-pointer flex-shrink-0"
                          >
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span>TEST FIRE</span>
                          </button>
                        </div>

                        {/* Elemental Effect Badge */}
                        {item.elementalLabel && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-bold">
                            <span>{item.elementalLabel}</span>
                          </div>
                        )}

                        {/* Utility Perk & Description */}
                        <div className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px]">
                          <div className="flex items-center gap-1 text-purple-300 font-bold">
                            <span>⚡</span>
                            <span>{item.utilityPerk || item.specialPerk}</span>
                          </div>
                          {item.perkDescription && (
                            <span className="text-[10px] text-slate-400 leading-tight">
                              {item.perkDescription}
                            </span>
                          )}
                        </div>

                        {/* DPS & Tactical Comparison */}
                        {item.dpsComparison && (
                          <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 px-1">
                            <span>📈</span>
                            <span>{item.dpsComparison}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {isUnlocked ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipWeapon(item.id, 'slot1');
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              loadout.slot1 === item.id
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {loadout.slot1 === item.id ? '✓ PRIMARY' : 'EQUIP PRIMARY'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipWeapon(item.id, 'slot2');
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              loadout.slot2 === item.id
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {loadout.slot2 === item.id ? '✓ SECONDARY' : 'EQUIP SECONDARY'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockWeapon(item);
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2.5 rounded-xl font-display font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 cursor-pointer active:scale-98'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          <Unlock className="w-4 h-4" />
                          <span>UNLOCK FOR 🅢 {item.costTokens} S-TOKENS</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: WEAPON MASTERY TIERS & GUN UPGRADES                 */}
          {/* ======================================================== */}
          {activeTab === 'tiers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Select an Unlocked Weapon */}
              <div className="lg:col-span-1 space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  <span>SELECT WEAPON TO UPGRADE</span>
                </h3>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {SHOP_WEAPONS_CATALOG.filter(
                    (w) => unlockedWeapons.includes(w.id) || w.costTokens === 0
                  ).map((w) => {
                    const isCur = selectedWeaponId === w.id;
                    const tier = weaponTiers[w.id] || 1;
                    const tConfig = WEAPON_TIER_CONFIG[tier];
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setSelectedWeaponId(w.id);
                          fortniteAudio.playUiClick();
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isCur
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                            : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{w.icon}</span>
                          <div>
                            <h4 className="font-bold text-xs text-white line-clamp-1">{w.name}</h4>
                            <span className="text-[10px] text-amber-300 font-mono">
                              {tConfig.badge}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Weapon Mastery Upgrade Bench */}
              <div className="lg:col-span-2 space-y-6 bg-slate-950/60 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                <div>
                  {/* Weapon Title & Current Tier Banner */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg">
                        {selectedShopItem.icon}
                      </div>
                      <div>
                        <span className="text-xs text-amber-400 font-black tracking-wider uppercase">
                          {selectedShopItem.categoryLabel}
                        </span>
                        <h2 className="font-display font-black text-2xl text-white">
                          {selectedShopItem.name}
                        </h2>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/50 text-amber-300 font-mono font-black text-sm">
                      {WEAPON_TIER_CONFIG[currentTier]?.badge}
                    </div>
                  </div>

                  {/* 4 Tier Visual Progress Bar */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[1, 2, 3, 4].map((tNum) => {
                      const tInfo = WEAPON_TIER_CONFIG[tNum];
                      const isReached = currentTier >= tNum;
                      const isNext = nextTier === tNum;
                      return (
                        <div
                          key={tNum}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isReached
                              ? 'bg-amber-500/20 border-amber-400 text-yellow-300 shadow-lg'
                              : isNext
                              ? 'bg-purple-950/50 border-purple-400/80 text-purple-300 animate-pulse'
                              : 'bg-black/30 border-white/10 text-slate-500'
                          }`}
                        >
                          <div className="text-xs font-black font-mono">TIER {tNum}</div>
                          <div className="text-[10px] font-bold line-clamp-1">{tInfo.name}</div>
                          {isReached && <span className="text-[10px] text-emerald-400">✓ ACTIVE</span>}
                          {isNext && <span className="text-[10px] text-amber-400">UP NEXT</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Before vs After Stat Comparison */}
                  <div className="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/10 mb-6">
                    {/* Current Stats */}
                    <div className="space-y-2">
                      <div className="text-xs font-black text-slate-300 uppercase tracking-wider">
                        CURRENT TIER {currentTier} STATS
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Base Damage:</span>
                          <span className="font-mono font-bold text-white">{currentStats.damage}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Headshot Damage:</span>
                          <span className="font-mono font-bold text-yellow-300">
                            {currentStats.headshotDamage}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Rate of Fire:</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {currentStats.fireRate}/s
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Magazine Size:</span>
                          <span className="font-mono font-bold text-amber-300">
                            {currentStats.magazineSize}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Reload Time:</span>
                          <span className="font-mono font-bold text-emerald-300">
                            {currentStats.reloadTime}s
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Next Tier Stats */}
                    <div className="space-y-2 border-l border-white/10 pl-4">
                      <div className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        {nextTier ? `TIER ${nextTier} UPGRADE STATS` : 'MAXED MASTERY REACHED 👑'}
                      </div>
                      {nextTierStats ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Base Damage:</span>
                            <span className="font-mono font-bold text-rose-400">
                              {nextTierStats.damage} (+{nextTierStats.damage - currentStats.damage})
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Headshot Damage:</span>
                            <span className="font-mono font-bold text-yellow-300">
                              {nextTierStats.headshotDamage}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Rate of Fire:</span>
                            <span className="font-mono font-bold text-cyan-300">
                              {nextTierStats.fireRate}/s
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Magazine Size:</span>
                            <span className="font-mono font-bold text-amber-300">
                              {nextTierStats.magazineSize} (+
                              {nextTierStats.magazineSize - currentStats.magazineSize})
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Reload Time:</span>
                            <span className="font-mono font-bold text-emerald-300">
                              {nextTierStats.reloadTime}s
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-300 font-bold p-3 rounded-xl bg-amber-500/10 border border-amber-400/30">
                          👑 This weapon has reached Overcharged Mythic Tier 4! Maximum firepower and
                          golden projectile particle aura enabled.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                {nextTier && nextTierConfig && (
                  <button
                    onClick={handleUpgradeTier}
                    disabled={profile.vbucks < nextTierConfig.costTokens}
                    className={`w-full py-4 rounded-2xl font-display font-black text-base tracking-wider flex items-center justify-center gap-2 transition-all ${
                      profile.vbucks >= nextTierConfig.costTokens
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/40 cursor-pointer active:scale-98'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                    <span>
                      UPGRADE TO {nextTierConfig.name.toUpperCase()} (🅢{' '}
                      {nextTierConfig.costTokens} S-TOKENS)
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: GLOBAL ARMORY PERKS (PERMANENT MODS)              */}
          {/* ======================================================== */}
          {activeTab === 'perks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/40 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-lg text-purple-300 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span>PERMANENT ARMORY TECH UPGRADES</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Upgrades purchased with S-Tokens apply permanently across all weapons in Battle
                    Royale, 1v1 Arena, and Zero Build!
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">AVAILABLE</span>
                  <span className="text-amber-300 font-mono font-black text-base">
                    🅢 {profile.vbucks.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ARMORY_PERKS_CONFIG.map((perk) => {
                  let curLevel = 0;
                  let isMaxed = false;
                  let nextCost = 0;

                  if (perk.id === 'siphonShield') {
                    curLevel = armoryPerks.siphonShield ? 1 : 0;
                    isMaxed = curLevel >= perk.maxLevel;
                    nextCost = perk.costs[0];
                  } else {
                    curLevel = (armoryPerks[perk.id] as number) || 0;
                    isMaxed = curLevel >= perk.maxLevel;
                    nextCost = perk.costs[curLevel] || 0;
                  }

                  const canAfford = profile.vbucks >= nextCost && !isMaxed;

                  return (
                    <div
                      key={perk.id}
                      className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{perk.icon}</span>
                            <div>
                              <h4 className="font-display font-black text-sm text-white">
                                {perk.name}
                              </h4>
                              <span className="text-[10px] text-amber-400 font-bold">
                                {perk.perLevelText}
                              </span>
                            </div>
                          </div>

                          <div className="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-black text-xs text-yellow-300">
                            {isMaxed ? 'MAX LVL' : `LVL ${curLevel}/${perk.maxLevel}`}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 mb-3">{perk.description}</p>

                        {/* Level pip bar */}
                        <div className="flex items-center gap-1.5 mb-4">
                          {Array.from({ length: perk.maxLevel }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-2 flex-1 rounded-full transition-all ${
                                idx < curLevel
                                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                  : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Upgrade action */}
                      {isMaxed ? (
                        <div className="py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-black text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>FULLY MAXED OUT</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpgradePerk(perk.id)}
                          disabled={!canAfford}
                          className={`w-full py-2.5 rounded-xl font-display font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer active:scale-98'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            UPGRADE (🅢 {nextCost} S-TOKENS)
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: OUTFITS & COSMETICS ITEM SHOP                     */}
          {/* ======================================================== */}
          {activeTab === 'cosmetics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Cosmetics & Token Packs Catalog */}
              <div className="lg:col-span-2 space-y-4">
                {/* Header Banner with Category Filter Pills */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-slate-900/60 border border-rose-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-black text-lg text-rose-300 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <span>SPHERE STRIKE DAILY ITEM SHOP</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Unlock authentic in-game skins, harvesting pickaxes, and gliders with S-Tokens!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-yellow-300 bg-black/70 px-3.5 py-1.5 rounded-xl border border-yellow-400/40 shadow-inner flex items-center gap-1.5">
                      <span className="text-amber-400">🅢</span>
                      <span>{profile.vbucks.toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All Items', icon: Sparkles },
                    { id: 'skin', label: 'Outfits & Skins', icon: Crown },
                    { id: 'pickaxe', label: 'Pickaxes', icon: Hammer },
                    { id: 'glider', label: 'Gliders', icon: Eye },
                  ].map((filter) => {
                    const isSelected = cosmeticCategoryFilter === filter.id;
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setCosmeticCategoryFilter(filter.id as any);
                          fortniteAudio.playUiClick();
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 scale-102'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{filter.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cosmetics Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {SHOP_COSMETICS_CATALOG.filter((item) => {
                      if (cosmeticCategoryFilter === 'all') return true;
                      return item.category === cosmeticCategoryFilter;
                    }).map((cItem) => {
                      const isSkin = cItem.category === 'skin';
                      const isPickaxe = cItem.category === 'pickaxe';
                      const isGlider = cItem.category === 'glider';

                      const isUnlocked = isSkin
                        ? unlockedSkins.includes(cItem.id) || cItem.costTokens === 0
                        : isPickaxe
                        ? unlockedPickaxes.includes(cItem.id) || cItem.costTokens === 0
                        : unlockedGliders.includes(cItem.id) || cItem.costTokens === 0;

                      const isEquipped = isSkin
                        ? profile.selectedSkin === cItem.id
                        : isPickaxe
                        ? profile.selectedPickaxe === cItem.id
                        : profile.selectedGlider === cItem.id;

                      const isSelected = selectedCosmeticId === cItem.id;
                      const rColors = RARITY_COLORS[cItem.rarity] || RARITY_COLORS.epic;
                      const canAfford = profile.vbucks >= cItem.costTokens;

                      return (
                        <div
                          key={cItem.id}
                          onClick={() => setSelectedCosmeticId(cItem.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-slate-900/95 shadow-xl ring-2 ring-amber-400/40'
                              : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80 hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            {isSkin ? (
                              <PlayerCharacterAvatar skinId={cItem.id} size="sm" className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md border border-white/20" />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${rColors.border} bg-gradient-to-br ${rColors.bg} shadow-md flex-shrink-0`}
                              >
                                {cItem.icon}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-black uppercase ${rColors.text}`}>
                                  {cItem.rarity} {cItem.category}
                                </span>
                                {cItem.tag && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                                    {cItem.tag}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-display font-black text-sm text-white truncate">
                                {cItem.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {cItem.description}
                              </p>
                            </div>
                          </div>

                          {/* Action Button on Item Card */}
                          <div className="mt-2">
                            {isEquipped ? (
                              <div className="py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-md">
                                <Check className="w-3.5 h-3.5" />
                                <span>EQUIPPED</span>
                              </div>
                            ) : isUnlocked ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyOrEquipCosmetic(cItem);
                                }}
                                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>EQUIP NOW</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyOrEquipCosmetic(cItem);
                                }}
                                disabled={!canAfford}
                                className={`w-full py-2 rounded-xl font-display font-black text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                                  canAfford
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md cursor-pointer active:scale-98'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                }`}
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>UNLOCK (🅢 {cItem.costTokens.toLocaleString()})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>

              {/* Right Col: Interactive 3D Avatar Showcase */}
              <div className="lg:col-span-1 bg-slate-950/80 p-5 rounded-3xl border border-amber-400/40 flex flex-col justify-between shadow-2xl">
                <div className="w-full flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                      LIVE IN-GAME SHOWCASE
                    </span>
                  </div>

                  {/* Character Avatar Box */}
                  <div className="relative mb-3 flex flex-col items-center">
                    {selectedCosmeticItem?.category === 'skin' ? (
                      <PlayerCharacterAvatar
                        skinId={selectedCosmeticItem.id}
                        size="xl"
                        className="w-36 h-36 rounded-3xl shadow-2xl border-2 border-amber-400/60 ring-4 ring-amber-500/20"
                      />
                    ) : (
                      <div className="relative flex flex-col items-center">
                        <div className="w-32 h-32 rounded-3xl bg-slate-900 border-2 border-amber-400/50 flex flex-col items-center justify-center text-5xl shadow-2xl shadow-amber-500/20 mb-2">
                          {selectedCosmeticItem?.icon || '⚡'}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400">
                          Used with: <span className="text-white font-bold">{activeCosmeticSkin.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-black text-xl text-white mt-1">
                    {selectedCosmeticItem?.name || activeCosmeticSkin.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs font-black text-amber-300 uppercase">
                      {selectedCosmeticItem?.rarity || activeCosmeticSkin.rarity} {selectedCosmeticItem?.category || 'OUTFIT'}
                    </span>
                    {selectedCosmeticItem?.tag && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                        {selectedCosmeticItem.tag}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-xs">
                    {selectedCosmeticItem?.description || activeCosmeticSkin.description}
                  </p>
                </div>

                {/* Primary Action Button in Showcase */}
                <div className="w-full flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                  {(() => {
                    if (!selectedCosmeticItem) return null;
                    const isSkin = selectedCosmeticItem.category === 'skin';
                    const isPickaxe = selectedCosmeticItem.category === 'pickaxe';
                    const isGlider = selectedCosmeticItem.category === 'glider';

                    const isUnlocked = isSkin
                      ? unlockedSkins.includes(selectedCosmeticItem.id) || selectedCosmeticItem.costTokens === 0
                      : isPickaxe
                      ? unlockedPickaxes.includes(selectedCosmeticItem.id) || selectedCosmeticItem.costTokens === 0
                      : unlockedGliders.includes(selectedCosmeticItem.id) || selectedCosmeticItem.costTokens === 0;

                    const isEquipped = isSkin
                      ? profile.selectedSkin === selectedCosmeticItem.id
                      : isPickaxe
                      ? profile.selectedPickaxe === selectedCosmeticItem.id
                      : profile.selectedGlider === selectedCosmeticItem.id;

                    const canAfford = profile.vbucks >= selectedCosmeticItem.costTokens;

                    if (isEquipped) {
                      return (
                        <div className="w-full py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-display font-black text-sm tracking-wider text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                          <Check className="w-4 h-4" />
                          <span>CURRENTLY EQUIPPED</span>
                        </div>
                      );
                    }

                    if (isUnlocked) {
                      return (
                        <button
                          onClick={() => handleBuyOrEquipCosmetic(selectedCosmeticItem)}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-display font-black text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>EQUIP OUTFIT NOW</span>
                        </button>
                      );
                    }

                    if (canAfford) {
                      return (
                        <button
                          onClick={() => handleBuyOrEquipCosmetic(selectedCosmeticItem)}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-sm tracking-wider shadow-lg shadow-amber-500/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>UNLOCK ITEM (🅢 {selectedCosmeticItem.costTokens.toLocaleString()})</span>
                        </button>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-2">
                        <button
                          disabled
                          className="w-full py-3 rounded-2xl bg-slate-800 text-slate-400 font-display font-black text-xs tracking-wider cursor-not-allowed border border-white/5 flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>LOCKED (COST: 🅢 {selectedCosmeticItem.costTokens.toLocaleString()})</span>
                        </button>
                        <div className="w-full py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center font-mono font-bold text-[11px] flex items-center justify-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>Earn coins by playing matches & eliminating AI bots (+40 coins/kill)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CUSTOM STARTING LOADOUT                           */}
          {/* ======================================================== */}
          {activeTab === 'loadout' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40">
                <h3 className="font-display font-black text-lg text-emerald-300 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span>STARTING MATCH ARSENAL LOADOUT</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Select which unlocked & upgraded weapons you will spawn with into Battle Royale,
                  1v1 Arena, and Zero Build!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { slotKey: 'slot1', label: 'PRIMARY RIFLE', icon: '🔫' },
                  { slotKey: 'slot2', label: 'SHOTGUN', icon: '💥' },
                  { slotKey: 'slot3', label: 'SNIPER / SMG', icon: '🎯' },
                  { slotKey: 'slot4', label: 'SHIELD ITEM', icon: '🧪' },
                  { slotKey: 'slot5', label: 'HEAL ITEM', icon: '🩹' },
                ].map(({ slotKey, label, icon }) => {
                  const currentGunId = (loadout as any)[slotKey];
                  const currentGun = WEAPON_REGISTRY[currentGunId] || WEAPON_REGISTRY.ar_scar;
                  const tier = weaponTiers[currentGunId] || 1;

                  return (
                    <div
                      key={slotKey}
                      className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-black text-amber-400 tracking-wider mb-2 uppercase">
                          {label}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{currentGun.icon || icon}</span>
                          <div>
                            <h4 className="font-display font-black text-xs text-white line-clamp-1">
                              {currentGun.name}
                            </h4>
                            <span className="text-[9px] text-amber-300 font-mono">
                              TIER {tier} • {currentGun.rarity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown selector of available unlocked guns */}
                      <select
                        value={currentGunId}
                        onChange={(e) => handleEquipWeapon(e.target.value, slotKey as any)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white cursor-pointer"
                      >
                        {SHOP_WEAPONS_CATALOG.filter(
                          (w) => unlockedWeapons.includes(w.id) || w.costTokens === 0
                        ).map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.rarity})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: COIN BOUNTIES & COMBAT ECONOMY                    */}
          {/* ======================================================== */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Combat Economy Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-amber-950/60 border-2 border-amber-400/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-lg text-slate-950 font-black">
                    🪙
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-white">
                      COMBAT BOUNTIES & COIN ECONOMY
                    </h3>
                    <p className="text-xs text-amber-200">
                      Earn coins every match you play + 40 bonus coins for every AI bot eliminated. No free giveaways—earn your loadout through victory!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-5 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-sm">
                    VAULT: {profile.vbucks.toLocaleString()} COINS
                  </div>
                </div>
              </div>

              {/* How to Earn Coins Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  EARN COINS IN BATTLE
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { title: 'BOT ELIMINATION', tokens: '+40 COINS', icon: '🎯', desc: 'Guaranteed 40 coins for every AI bot eliminated in any mode' },
                    { title: '#1 VICTORY ROYALE', tokens: '+100 COINS', icon: '👑', desc: 'Awarded immediately upon winning any Battle Royale match' },
                    { title: 'MATCH PLAYED', tokens: '+50 COINS', icon: '⚔️', desc: 'Base match reward awarded every time you complete a game' },
                    { title: '1V1 ARENA DUEL', tokens: '+50 COINS', icon: '🤺', desc: 'Earned upon match conclusion in the 1v1 Arena' },
                    { title: 'HEADSHOT BONUS', tokens: '+10 COINS', icon: '💀', desc: 'Precision bonus on high-accuracy bot takedowns' },
                    { title: 'NO HANDOUTS', tokens: 'PURE SKILL', icon: '🛡️', desc: 'All weapons and skins are unlocked purely via in-game combat' },
                  ].map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3"
                    >
                      <span className="text-2xl">{q.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-xs text-white">{q.title}</h5>
                          <span className="text-[10px] font-black text-amber-300 font-mono">
                            {q.tokens}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{q.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>⚡ Guns Unlocked: {unlockedWeapons.length} / {SHOP_WEAPONS_CATALOG.length}</span>
            <span>•</span>
            <span>👑 Active Skin: {activeCosmeticSkin.name}</span>
            <span>•</span>
            <span>🎯 Primary Weapon: {WEAPON_REGISTRY[loadout.slot1]?.name || 'SCAR'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-xs transition-all shadow-md cursor-pointer active:scale-95"
          >
            RETURN TO GAME / LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
