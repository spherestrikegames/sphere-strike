import React, { useEffect } from 'react';
import { MatchStats } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Swords, Zap, Shield, Target, Clock, Sparkles } from 'lucide-react';

interface VictoryRoyaleScreenProps {
  stats: MatchStats;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const VictoryRoyaleScreen: React.FC<VictoryRoyaleScreenProps> = ({
  stats,
  onPlayAgain,
  onReturnToLobby,
}) => {
  useEffect(() => {
    // Launch celebratory confetti fireworks
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-2xl animate-in zoom-in-95 duration-300 select-none">
      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/20 blur-[120px] pointer-events-none" />

      {/* ICONIC FORTNITE #1 VICTORY ROYALE BANNER */}
      <div className="relative mb-8 text-center animate-bounce duration-1000">
        <div className="inline-block px-12 py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-3xl border-4 border-yellow-200 shadow-[0_0_60px_rgba(245,158,11,0.8)] transform -skew-x-12">
          <h1 className="font-display font-black text-4xl sm:text-6xl text-slate-950 tracking-wider drop-shadow-md">
            #1 VICTORY ROYALE
          </h1>
        </div>
      </div>

      {/* Match Stats Card */}
      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Rewards Earned Banner & Economy Breakdown */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2 text-amber-300 font-display font-black text-lg">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>+{stats.xpEarned} BATTLE XP</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-display font-black text-lg">
              <span>🅢</span>
              <span>+{stats.vbucksEarned} S-TOKENS</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-200/80 px-2 pt-1 border-t border-amber-500/20">
            <span>Match Completion Base: +{stats.baseCoins ?? 100} Coins</span>
            <span>Eliminations ({stats.eliminations} × 40): +{stats.eliminationBonusCoins ?? (stats.eliminations * 40)} Coins</span>
          </div>
        </div>

        {/* 6 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold mb-1">
              <Swords className="w-4 h-4" />
              <span>ELIMINATIONS</span>
            </div>
            <span className="font-display font-black text-2xl text-white">{stats.eliminations}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
              <Target className="w-4 h-4" />
              <span>DAMAGE DEALT</span>
            </div>
            <span className="font-display font-black text-2xl text-white">{stats.damageDealt}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold mb-1">
              <Zap className="w-4 h-4" />
              <span>ACCURACY</span>
            </div>
            <span className="font-display font-black text-2xl text-white">{stats.accuracy}%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
              <Shield className="w-4 h-4" />
              <span>BUILDS PLACED</span>
            </div>
            <span className="font-display font-black text-2xl text-white">{stats.structuresBuilt}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold mb-1">
              <Trophy className="w-4 h-4" />
              <span>CHESTS OPENED</span>
            </div>
            <span className="font-display font-black text-2xl text-white">{stats.chestsOpened}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1">
              <Clock className="w-4 h-4" />
              <span>TIME SURVIVED</span>
            </div>
            <span className="font-display font-black text-2xl text-white">
              {Math.floor(stats.timeSurvived / 60)}m {stats.timeSurvived % 60}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={onReturnToLobby}
            className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-display font-black text-white text-base tracking-wider transition-all"
          >
            RETURN TO LOBBY
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 font-display font-black text-slate-950 text-base tracking-wider shadow-lg shadow-amber-500/30 transition-all active:scale-98"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};
