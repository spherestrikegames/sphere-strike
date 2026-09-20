import React from 'react';
import { PlayerProfile } from '../../types';
import {
  SHOP_WEAPONS_CATALOG,
  WEAPON_TIER_CONFIG,
  WEAPON_REGISTRY,
  getWeaponEffectiveStats,
} from '../../data/fortniteData';
import { fortniteAudio } from '../../utils/audio';
import { Flame, ChevronRight, ArrowUpCircle } from 'lucide-react';

interface ShopTiersTabProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  unlockedWeapons: string[];
  weaponTiers: Record<string, number>;
  selectedWeaponId: string;
  setSelectedWeaponId: (id: string) => void;
  armoryPerks: any;
  setClaimedRewardMessage: (msg: string | null) => void;
}

export const ShopTiersTab: React.FC<ShopTiersTabProps> = ({
  profile,
  onUpdateProfile,
  unlockedWeapons,
  weaponTiers,
  selectedWeaponId,
  setSelectedWeaponId,
  armoryPerks,
  setClaimedRewardMessage,
}) => {
  const selectedShopItem =
    SHOP_WEAPONS_CATALOG.find((w) => w.id === selectedWeaponId) ||
    SHOP_WEAPONS_CATALOG[0];

  const currentTier = weaponTiers[selectedWeaponId] || 1;
  const nextTier = currentTier < 4 ? currentTier + 1 : null;

  const baseWeapon = WEAPON_REGISTRY[selectedWeaponId];
  const currentStats = baseWeapon
    ? getWeaponEffectiveStats(baseWeapon, currentTier, armoryPerks)
    : null;
  const nextTierStats =
    baseWeapon && nextTier
      ? getWeaponEffectiveStats(baseWeapon, nextTier, armoryPerks)
      : null;
  const nextTierConfig = nextTier ? WEAPON_TIER_CONFIG[nextTier] : null;

  const handleUpgradeTier = () => {
    if (!nextTierConfig) return;
    if (profile.vbucks < nextTierConfig.costTokens) {
      fortniteAudio.playShieldBreak?.();
      return;
    }

    const updated: PlayerProfile = {
      ...profile,
      vbucks: profile.vbucks - nextTierConfig.costTokens,
      weaponTiers: {
        ...weaponTiers,
        [selectedWeaponId]: nextTier,
      },
    };

    onUpdateProfile(updated);
    fortniteAudio.playUpgradeBenchAnvil();
    setClaimedRewardMessage(
      `UPGRADED ${selectedShopItem.name.toUpperCase()} TO TIER ${nextTier}! ⚡`
    );
    setTimeout(() => setClaimedRewardMessage(null), 3000);
  };

  return (
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
          {currentStats && (
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
          )}
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
  );
};
