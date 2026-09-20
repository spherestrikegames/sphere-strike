import React, { useState } from 'react';
import { PlayerProfile, WeaponRarity } from '../types';
import {
  SHOP_WEAPONS_CATALOG,
  WEAPON_REGISTRY,
  FORTNITE_SKINS,
} from '../data/fortniteData';
import { fortniteAudio } from '../utils/audio';
import {
  X,
  Zap,
  Coins,
  ArrowUpCircle,
  Flame,
  Target,
  Crown,
  RotateCcw,
} from 'lucide-react';

import { ShopArmoryTab } from './shop/ShopArmoryTab';
import { ShopSkinsTab } from './shop/ShopSkinsTab';
import { ShopTiersTab } from './shop/ShopTiersTab';
import { ShopPerksTab } from './shop/ShopPerksTab';
import { ShopLoadoutTab } from './shop/ShopLoadoutTab';
import { ShopRewardsTab } from './shop/ShopRewardsTab';

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
    name: 'High Stakes Crowbar',
    category: 'pickaxe',
    rarity: 'rare',
    costTokens: 300,
    icon: '🛠️',
    description: 'Heavy duty steel breaker tool for bank vault heists.',
    tag: 'HEIST',
  },
  {
    id: 'reaper',
    name: 'The Reaper Scythe',
    category: 'pickaxe',
    rarity: 'epic',
    costTokens: 600,
    icon: '🗡️',
    description: 'Classic Chapter 1 metallic scythe with high-pitched slicing audio.',
    tag: 'OG SOUND',
  },
  {
    id: 'star_wand',
    name: 'Star Wand (Sweat Pickaxe)',
    category: 'pickaxe',
    rarity: 'rare',
    costTokens: 500,
    icon: '⭐',
    description: 'The legendary competitive wand. Fast swing audio and star particles.',
    tag: 'META PRO',
  },
  {
    id: 'candy_axe',
    name: 'Candy Axe',
    category: 'pickaxe',
    rarity: 'epic',
    costTokens: 700,
    icon: '🍬',
    description: 'Festive peppermint axe with Christmas lights that glow brighter on kills.',
    tag: 'GLOW ON KILL',
  },
  {
    id: 'leviathan_axe',
    name: 'Leviathan Axe (Freezing)',
    category: 'pickaxe',
    rarity: 'mythic',
    costTokens: 1000,
    icon: '🪓',
    description: 'Forged by the Huldra brothers with frost ice bursts on impact.',
    tag: 'FROST EMOTE',
  },
  // Gliders
  {
    id: 'glider_default',
    name: 'Default Victory Glider',
    category: 'glider',
    rarity: 'common',
    costTokens: 0,
    icon: '🪂',
    description: 'Standard airborne canvas deployment glider.',
    tag: 'DEFAULT',
  },
  {
    id: 'mako',
    name: 'Mako Shark Glider',
    category: 'glider',
    rarity: 'rare',
    costTokens: 350,
    icon: '🦈',
    description: 'Season 1 battle canopy painted with ferocious shark jaw teeth.',
    tag: 'SEASON 1',
  },
  {
    id: 'astronomical',
    name: 'Astroworld Cyclone',
    category: 'glider',
    rarity: 'mythic',
    costTokens: 900,
    icon: '🎡',
    description: 'Ride aboard an orbiting amusement rollercoaster theme park cyclone.',
    tag: 'ASTRONOMICAL',
  },
  {
    id: 'dragon_glider',
    name: 'Frostwing Ice Dragon',
    category: 'glider',
    rarity: 'legendary',
    costTokens: 1100,
    icon: '🐉',
    description: 'Swoop down into the island on a breathing frozen glacier dragon mount.',
    tag: 'ANIMATED MOUNT',
  },
];

interface FortniteShopProps {
  profile: PlayerProfile;
  onUpdateProfile: (updatedProfile: PlayerProfile) => void;
  onClose: () => void;
}

export const FortniteShop: React.FC<FortniteShopProps> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'weapons' | 'cosmetics' | 'tiers' | 'perks' | 'loadout' | 'rewards'
  >('weapons');

  const [weaponCategoryFilter, setWeaponCategoryFilter] = useState<string>('all');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(
    SHOP_WEAPONS_CATALOG[0]?.id || 'ar_scar'
  );
  const [selectedCosmeticId, setSelectedCosmeticId] = useState<string>('jonesy');
  const [claimedRewardMessage, setClaimedRewardMessage] = useState<string | null>(null);

  const unlockedWeapons = profile.unlockedWeapons || ['ar_scar', 'ar_common'];
  const unlockedSkins = profile.unlockedSkins || ['jonesy'];
  const unlockedPickaxes = profile.unlockedPickaxes || ['pickaxe_default'];
  const unlockedGliders = profile.unlockedGliders || ['glider_default'];
  const weaponTiers = profile.weaponTiers || {};
  const armoryPerks = profile.armoryPerks || {
    siphonShield: false,
    reloadSpeedLevel: 0,
    clipSizeLevel: 0,
    damageBuffLevel: 0,
    headshotMultLevel: 0,
  };

  const activeSkin =
    FORTNITE_SKINS.find((s) => s.id === profile.selectedSkin) || FORTNITE_SKINS[0];

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
    setClaimedRewardMessage(
      'PROGRESSION RESET: Starter Jonesy ready! Play matches & eliminate bots to earn coins.'
    );
    setTimeout(() => setClaimedRewardMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden text-white">
        {/* TOP HEADER */}
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

        {/* Notification Banner */}
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
          {activeTab === 'weapons' && (
            <ShopArmoryTab
              profile={profile}
              onUpdateProfile={onUpdateProfile}
              selectedWeaponId={selectedWeaponId}
              setSelectedWeaponId={setSelectedWeaponId}
              unlockedWeapons={unlockedWeapons}
              weaponTiers={weaponTiers}
              armoryPerks={armoryPerks}
              weaponCategoryFilter={weaponCategoryFilter}
              setWeaponCategoryFilter={setWeaponCategoryFilter}
              setClaimedRewardMessage={setClaimedRewardMessage}
            />
          )}

          {activeTab === 'cosmetics' && (
            <ShopSkinsTab
              profile={profile}
              onUpdateProfile={onUpdateProfile}
              unlockedSkins={unlockedSkins}
              unlockedPickaxes={unlockedPickaxes}
              unlockedGliders={unlockedGliders}
              selectedCosmeticId={selectedCosmeticId}
              setSelectedCosmeticId={setSelectedCosmeticId}
              setClaimedRewardMessage={setClaimedRewardMessage}
            />
          )}

          {activeTab === 'tiers' && (
            <ShopTiersTab
              profile={profile}
              onUpdateProfile={onUpdateProfile}
              unlockedWeapons={unlockedWeapons}
              weaponTiers={weaponTiers}
              selectedWeaponId={selectedWeaponId}
              setSelectedWeaponId={setSelectedWeaponId}
              armoryPerks={armoryPerks}
              setClaimedRewardMessage={setClaimedRewardMessage}
            />
          )}

          {activeTab === 'perks' && (
            <ShopPerksTab
              profile={profile}
              onUpdateProfile={onUpdateProfile}
              armoryPerks={armoryPerks}
              setClaimedRewardMessage={setClaimedRewardMessage}
            />
          )}

          {activeTab === 'loadout' && (
            <ShopLoadoutTab
              profile={profile}
              onUpdateProfile={onUpdateProfile}
              unlockedWeapons={unlockedWeapons}
              setClaimedRewardMessage={setClaimedRewardMessage}
            />
          )}

          {activeTab === 'rewards' && <ShopRewardsTab profile={profile} />}
        </div>

        {/* FOOTER BAR */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>⚡ Guns Unlocked: {unlockedWeapons.length} / {SHOP_WEAPONS_CATALOG.length}</span>
            <span>•</span>
            <span>👑 Active Skin: {activeSkin.name}</span>
            <span>•</span>
            <span>
              🎯 Primary Weapon:{' '}
              {profile.loadout.slot1 && WEAPON_REGISTRY[profile.loadout.slot1]?.name
                ? WEAPON_REGISTRY[profile.loadout.slot1].name
                : 'None'}
            </span>
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
