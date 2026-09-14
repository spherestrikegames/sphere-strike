import React from 'react';
import { MatchStats } from '../types';
import { Swords, Target, Zap, Clock, Shield } from 'lucide-react';

interface EliminatedScreenProps {
  stats: MatchStats;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const EliminatedScreen: React.FC<EliminatedScreenProps> = ({
  stats,
  onPlayAgain,
  onReturnToLobby,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Background Red Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-rose-600/15 blur-[120px] pointer-events-none" />

      {/* ELIMINATED BANNER */}
      <div className="relative mb-6 text-center">
        <div className="inline-block px-10 py-3 bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 rounded-3xl border-2 border-rose-400 shadow-[0_0_40px_rgba(225,29,72,0.6)] transform -skew-x-6">
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wider">
            YOU WERE ELIMINATED
          </h1>
        </div>
        <p className="text-sm font-bold text-rose-300 mt-2 font-mono">
          PLACED #{stats.placement} OF {stats.totalPlayers}
        </p>
      </div>

      {/* Stats Card */}
      <div className="relative w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Rewards Earned */}
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30">
          <div className="flex items-center justify-around">
            <span className="text-cyan-300 font-display font-black text-sm sm:text-base">
              +{stats.xpEarned} BATTLE PASS XP
            </span>
            <span className="text-amber-400 font-display font-black text-sm sm:text-base flex items-center gap-1">
              <span>🅢</span>
              <span>+{stats.vbucksEarned || (stats.baseCoins ?? 50) + (stats.eliminationBonusCoins ?? stats.eliminations * 40)} S-TOKENS</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300/80 px-2 pt-1 border-t border-cyan-500/20">
            <span>Match Base: +{stats.baseCoins ?? 50} Coins</span>
            <span>Bot Bonus ({stats.eliminations} × 40): +{stats.eliminationBonusCoins ?? stats.eliminations * 40} Coins</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1 text-xs text-rose-400 font-bold mb-1">
              <Swords className="w-3.5 h-3.5" />
              <span>KILLS</span>
            </div>
            <span className="font-display font-black text-xl text-white">{stats.eliminations}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>DAMAGE</span>
            </div>
            <span className="font-display font-black text-xl text-white">{stats.damageDealt}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>ACCURACY</span>
            </div>
            <span className="font-display font-black text-xl text-white">{stats.accuracy}%</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1 text-xs text-slate-400 font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>SURVIVED</span>
            </div>
            <span className="font-display font-black text-xl text-white">
              {Math.floor(stats.timeSurvived / 60)}m {stats.timeSurvived % 60}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onReturnToLobby}
            className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 font-display font-black text-white text-sm tracking-wider transition-all"
          >
            LOBBY
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 font-display font-black text-slate-950 text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all active:scale-98"
          >
            READY UP (PLAY AGAIN)
          </button>
        </div>
      </div>
    </div>
  );
};
