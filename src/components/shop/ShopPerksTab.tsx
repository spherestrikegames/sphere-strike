import React from 'react';
import { PlayerProfile } from '../../types';
import { ARMORY_PERKS_CONFIG } from '../../data/fortniteData';
import { fortniteAudio } from '../../utils/audio';
import { Zap, Plus, Check } from 'lucide-react';

interface ShopPerksTabProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  armoryPerks: Record<string, number | boolean>;
  setClaimedRewardMessage: (msg: string | null) => void;
}

export const ShopPerksTab: React.FC<ShopPerksTabProps> = ({
  profile,
  onUpdateProfile,
  armoryPerks,
  setClaimedRewardMessage,
}) => {
  const handleUpgradePerk = (perkId: string) => {
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

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-lg text-purple-300 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>GLOBAL ARMORY PERKS TREE</span>
          </h3>
          <p className="text-xs text-slate-300">
            Upgrades apply globally across all weapons in every game mode!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <h4 className="font-display font-black text-sm text-white">{perk.name}</h4>
                      <span className="text-[10px] text-amber-400 font-bold">{perk.perLevelText}</span>
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
                  <span>UPGRADE (🅢 {nextCost} S-TOKENS)</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
