import React from 'react';
import { PlayerProfile } from '../../types';

interface ShopRewardsTabProps {
  profile: PlayerProfile;
}

export const ShopRewardsTab: React.FC<ShopRewardsTabProps> = ({ profile }) => {
  return (
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
  );
};
