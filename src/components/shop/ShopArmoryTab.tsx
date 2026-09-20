import React from 'react';
import { PlayerProfile } from '../../types';
import {
  RARITY_COLORS,
  SHOP_WEAPONS_CATALOG,
  WEAPON_TIER_CONFIG,
  WEAPON_REGISTRY,
  getWeaponEffectiveStats,
  ShopWeaponItem,
} from '../../data/fortniteData';
import { fortniteAudio } from '../../utils/audio';
import {
  Zap,
  ArrowUpCircle,
  Check,
  Flame,
  Target,
  Crosshair,
  Lock,
  Unlock,
  Volume2,
} from 'lucide-react';

interface ShopArmoryTabProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  selectedWeaponId: string;
  setSelectedWeaponId: (id: string) => void;
  unlockedWeapons: string[];
  weaponTiers: Record<string, number>;
  armoryPerks: any;
  weaponCategoryFilter: string;
  setWeaponCategoryFilter: (filter: string) => void;
  setClaimedRewardMessage: (msg: string | null) => void;
}

export const ShopArmoryTab: React.FC<ShopArmoryTabProps> = ({
  profile,
  onUpdateProfile,
  selectedWeaponId,
  setSelectedWeaponId,
  unlockedWeapons,
  weaponTiers,
  armoryPerks,
  weaponCategoryFilter,
  setWeaponCategoryFilter,
  setClaimedRewardMessage,
}) => {
  const filteredWeapons = SHOP_WEAPONS_CATALOG.filter((item) => {
    if (weaponCategoryFilter === 'all') return true;
    return item.category === weaponCategoryFilter;
  });

  const handleTestFireAudio = (wItem: ShopWeaponItem) => {
    const baseW = WEAPON_REGISTRY[wItem.id];
    if (!baseW) return;
    if (baseW.id === 'rifle_burst') {
      fortniteAudio.playGunshotBurst();
    } else if (baseW.id === 'shotgun_double_barrel') {
      fortniteAudio.playGunshotDoubleBarrel();
    } else if (baseW.type === 'shotgun') {
      fortniteAudio.playGunshotPump();
    } else if (baseW.type === 'sniper') {
      fortniteAudio.playGunshotSniper();
    } else if (baseW.type === 'smg') {
      fortniteAudio.playGunshotSMG();
    } else {
      fortniteAudio.playGunshotAR();
    }
  };

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

  const handleEquipWeapon = (weaponId: string, slotKey: keyof typeof profile.loadout) => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      loadout: {
        ...profile.loadout,
        [slotKey]: weaponId,
      },
    };
    onUpdateProfile(updatedProfile);
    fortniteAudio.playUiClick();
    const gunName = WEAPON_REGISTRY[weaponId]?.name || 'Weapon';
    setClaimedRewardMessage(`EQUIPPED ${gunName} TO ${String(slotKey).toUpperCase()}!`);
    setTimeout(() => setClaimedRewardMessage(null), 2500);
  };

  return (
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
              setWeaponCategoryFilter(cat.id);
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
      {filteredWeapons.length === 0 ? (
        <div className="py-20 px-8 text-center rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
            ⚡
          </div>
          <h3 className="font-display font-black text-xl text-white">All Old Guns Removed</h3>
          <p className="text-sm text-slate-400 max-w-md">
            The armory has been cleared and is ready for your new custom gun prompts!
          </p>
        </div>
      ) : (
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

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestFireAudio(item);
                    }}
                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all text-xs flex items-center gap-1 cursor-pointer"
                    title="Audio Sound Test"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mb-3 line-clamp-2">{item.description}</p>

                {/* Perk highlight */}
                <div className="p-2 rounded-xl bg-slate-950/60 border border-amber-500/20 text-[11px] text-amber-300 mb-3 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{item.specialPerk}</span>
                </div>

                {/* Stat Bar Preview */}
                {stats && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 mb-4 bg-black/40 p-2 rounded-xl border border-white/5">
                    <div>
                      <span className="text-slate-400">DMG:</span>{' '}
                      <span className="text-amber-400 font-bold">{stats.damage}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">DPS:</span>{' '}
                      <span className="text-yellow-300 font-bold">{stats.dps}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">MAG:</span>{' '}
                      <span className="text-cyan-300 font-bold">{stats.magazineSize}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">RELOAD:</span>{' '}
                      <span className="text-emerald-300 font-bold">{stats.reloadTime}s</span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Button */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  {isUnlocked ? (
                    <div className="flex items-center gap-2 w-full">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> UNLOCKED
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipWeapon(item.id, 'slot1');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-black uppercase transition-all cursor-pointer border border-white/10"
                        >
                          Equip Slot 1
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipWeapon(item.id, 'slot2');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-black uppercase transition-all cursor-pointer border border-white/10"
                        >
                          Slot 2
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockWeapon(item);
                      }}
                      disabled={!canAfford}
                      className={`w-full py-2 px-3 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30'
                          : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock {item.name}</span>
                      <span className="ml-auto flex items-center gap-0.5 font-mono">
                        🅢 {item.costTokens}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
