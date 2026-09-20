import React from 'react';
import { PlayerCharacterAvatar } from './PlayerCharacterAvatar';
import {
  FortniteWeapon,
  StormState,
  DamageNumber,
  BuildType,
  MaterialType,
  PartyMember,
  ScopeTargetData,
  DrivableVehicle,
  EliminationBannerData,
  EliminationLog,
  PickupNotification,
  GameMode,
  Arena1v1State,
  BattleRoyaleDuelState,
} from '../types';
import { RARITY_COLORS } from '../data/fortniteData';
import {
  Shield,
  Heart,
  Users,
  Swords,
  Eye,
  MousePointer,
  Wind,
  Navigation,
  Crosshair,
  Target,
  Car,
  Gauge,
  Flame,
  Package,
  Skull,
  Sparkles,
  Zap,
  Award,
  Settings,
  LogOut,
  Home,
  RotateCcw,
  Trophy,
  Wifi,
} from 'lucide-react';

interface FortniteHUDProps {
  health: number;
  shield: number;
  maxHealth?: number;
  maxShield?: number;
  wood: number;
  stone: number;
  metal: number;
  inventory: (FortniteWeapon | null)[];
  activeSlot: number;
  playersLeft: number;
  eliminations: number;
  storm: StormState;
  isFirstPerson: boolean;
  isAiming: boolean;
  isPointerLocked: boolean;
  isBuildMode: boolean;
  selectedBuildType: BuildType;
  selectedMaterial: MaterialType;
  damageTakenFlash: boolean;
  hitmarker: { active: boolean; isHeadshot: boolean; isShield: boolean };
  damageNumbers: DamageNumber[];
  isSkydiving: boolean;
  isGliding: boolean;
  altitude: number;
  touchdownBanner: boolean;
  partyMembers?: PartyMember[];
  partyCode?: string;
  scopeTargetData?: ScopeTargetData | null;
  activeVehicle?: DrivableVehicle | null;
  nearVehiclePrompt?: string | null;
  nearSupplyPrompt?: string | null;
  eliminationBanner?: EliminationBannerData | null;
  killFeed?: EliminationLog[];
  pickupNotifications?: PickupNotification[];
  showFps?: boolean;
  reticleColor?: string;
  gameMode?: GameMode;
  selectedSkin?: string;
  networkPing?: number;
  isNetworkConnected?: boolean;
  arena1v1State?: Arena1v1State | null;
  duelState?: BattleRoyaleDuelState | null;
  botDifficulty?: 'casual' | 'normal' | 'pro' | 'god';
  onChangeBotDifficulty?: (diff: 'casual' | 'normal' | 'pro' | 'god') => void;
  onReset1v1Builds?: () => void;
  onOpenShop?: () => void;
  onOpenSettings?: () => void;
  onReturnToLobby?: () => void;
  onSelectSlot: (index: number) => void;
  onTogglePerspective: () => void;
  onRequestPointerLock: () => void;
}

export const FortniteHUD: React.FC<FortniteHUDProps> = React.memo(({
  health,
  shield,
  maxHealth: propMaxHealth,
  maxShield: propMaxShield,
  wood,
  stone,
  metal,
  inventory,
  activeSlot,
  playersLeft,
  eliminations,
  storm,
  isFirstPerson,
  isAiming,
  isPointerLocked,
  isBuildMode,
  selectedBuildType,
  damageTakenFlash,
  hitmarker,
  isSkydiving,
  isGliding,
  altitude,
  touchdownBanner,
  partyMembers,
  partyCode,
  scopeTargetData,
  activeVehicle,
  nearVehiclePrompt,
  nearSupplyPrompt,
  eliminationBanner,
  killFeed = [],
  pickupNotifications = [],
  showFps = true,
  reticleColor = '#ffffff',
  gameMode,
  selectedSkin = 'jonesy',
  networkPing,
  isNetworkConnected = true,
  arena1v1State,
  duelState,
  botDifficulty = 'pro',
  onChangeBotDifficulty,
  onReset1v1Builds,
  onOpenShop,
  onOpenSettings,
  onReturnToLobby,
  onSelectSlot,
  onTogglePerspective,
  onRequestPointerLock,
}) => {
  const is1v1Mode = gameMode === '1v1_build_fight';
  const effectiveMaxHealth = propMaxHealth ?? (is1v1Mode ? 300 : 250);
  const effectiveMaxShield = propMaxShield ?? (is1v1Mode ? 300 : 250);

  const currentWeapon = inventory[activeSlot];
  const healthPercent = Math.min(100, (health / effectiveMaxHealth) * 100);
  const shieldPercent = Math.min(100, (shield / effectiveMaxShield) * 100);

  const activeDifficulty = arena1v1State?.botDifficulty || botDifficulty;

  const vehicleSpeedKmh = activeVehicle ? Math.round(Math.abs(activeVehicle.speed) * 3.6) : 0;
  const vehicleNitroPercent = activeVehicle ? Math.round(activeVehicle.nitro) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-4 sm:p-6 z-20 font-sans">
      {/* Damage Taken Red Flash */}
      {damageTakenFlash && (
        <div className="absolute inset-0 bg-red-600/25 border-8 border-red-600/60 pointer-events-none animate-pulse duration-75 z-10" />
      )}

      {/* Touchdown Banner Announcement */}
      {touchdownBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-in zoom-in-95 duration-200">
          <div className="px-6 py-2 rounded-2xl bg-amber-500 border-2 border-white shadow-[0_0_30px_rgba(245,158,11,0.8)] text-slate-950 font-black text-lg sm:text-2xl tracking-wider uppercase flex items-center gap-3">
            <span>🎯</span>
            <span>TOUCHDOWN! BATTLE ROYALE STARTED</span>
            <span>🎯</span>
          </div>
          <span className="text-xs font-bold text-white mt-1 drop-shadow-md">
            Loot weapons, drive vehicles, build structures, survive the storm!
          </span>
        </div>
      )}

      {/* Pointer Lock Inactive Overlay Banner */}
      {!isPointerLocked && (
        <div
          onClick={onRequestPointerLock}
          className="pointer-events-auto absolute top-28 left-1/2 -translate-x-1/2 z-30 cursor-pointer px-5 py-2.5 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 border border-white text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.6)] backdrop-blur-md flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <MousePointer className="w-4 h-4 animate-bounce" />
          <span>CLICK TO LOCK MOUSE & MOVE VISION</span>
        </div>
      )}

      {/* Near Vehicle Interaction Banner */}
      {nearVehiclePrompt && !activeVehicle && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-amber-500/90 border-2 border-white shadow-[0_0_30px_rgba(245,158,11,0.8)] text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase animate-bounce">
          <Car className="w-5 h-5 text-slate-950" />
          <span>{nearVehiclePrompt}</span>
        </div>
      )}

      {/* Near Supply / Drop Interaction Banner */}
      {nearSupplyPrompt && (
        <div className="absolute top-48 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2 rounded-2xl bg-emerald-500/90 border-2 border-white shadow-[0_0_25px_rgba(16,185,129,0.7)] text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase animate-pulse">
          <Package className="w-4 h-4 text-slate-950" />
          <span>{nearSupplyPrompt}</span>
        </div>
      )}

      {/* Skydiving Altitude & Flight Controls HUD */}
      {isSkydiving && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-30 animate-in fade-in duration-150">
          <div className="px-6 py-3 rounded-2xl bg-black/75 border border-cyan-400/50 backdrop-blur-md shadow-2xl flex items-center gap-4 text-white">
            <div className="flex items-center gap-2 text-cyan-400">
              <Wind className="w-6 h-6 animate-spin" />
              <span className="font-display font-black text-xl tracking-wider">
                {isGliding ? 'GLIDING' : 'FREE FALLING'}
              </span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">ALTITUDE</span>
              <span className="font-mono text-2xl font-black text-amber-400">{altitude}m</span>
            </div>
          </div>
          <span className="text-xs font-bold text-white/90 bg-black/50 px-3 py-1 rounded-full border border-white/20">
            [SPACE] Toggle Glider • [W/A/S/D] Steer Trajectory
          </span>
        </div>
      )}

      {/* VEHICLE DRIVING DASHBOARD HUD */}
      {activeVehicle && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-6 px-6 py-3 rounded-3xl bg-black/85 backdrop-blur-md border-2 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.5)] text-white">
            {/* Speedometer */}
            <div className="flex items-center gap-3">
              <Gauge className="w-7 h-7 text-cyan-400 animate-pulse" />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-3xl font-black text-cyan-300">{vehicleSpeedKmh}</span>
                  <span className="text-[10px] font-bold text-slate-400">KM/H</span>
                </div>
                <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">
                  {activeVehicle.name}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/20" />

            {/* Nitro Boost Gauge */}
            <div className="flex flex-col gap-1 w-36">
              <div className="flex items-center justify-between text-[10px] font-black text-amber-400">
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  <span>NITRO BOOST [SHIFT]</span>
                </div>
                <span>{vehicleNitroPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 border border-amber-400/40 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_#f59e0b] transition-all duration-75"
                  style={{ width: `${vehicleNitroPercent}%` }}
                />
              </div>
            </div>

            <div className="h-8 w-px bg-white/20" />

            {/* Vehicle Health */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-emerald-400">VEHICLE INTEGRITY</span>
              <span className="font-mono text-sm font-black text-white">{activeVehicle.health} / 1000</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-cyan-200 bg-black/60 px-4 py-1 rounded-full border border-cyan-400/30">
            <span>[W/S] Accelerate/Reverse</span>
            <span>•</span>
            <span>[A/D] Steer</span>
            <span>•</span>
            <span>[SHIFT] Nitro</span>
            <span>•</span>
            <span>[SPACE] Drift</span>
            <span>•</span>
            <span>[H] Honk</span>
            <span>•</span>
            <span>[E/F] Exit</span>
          </div>
        </div>
      )}

      {/* BATTLE ROYALE RESPAWN BANNER / OVERLAY */}
      {gameMode === 'battle_royale' && duelState?.respawnCountdown !== null && duelState?.respawnCountdown !== undefined && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200 pointer-events-none">
          <div className="flex flex-col items-center px-10 py-5 rounded-3xl backdrop-blur-2xl border-2 border-cyan-400 bg-gradient-to-b from-cyan-900/90 via-slate-900/95 to-blue-950/90 text-white shadow-[0_0_60px_rgba(6,182,212,0.6)]">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="font-mono text-sm uppercase tracking-widest font-black text-cyan-200">
                COMBAT RESPAWN ACTIVE
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 drop-shadow-md">
              DROPPING BACK IN {duelState.respawnCountdown}s
            </h2>
            <div className="flex items-center gap-3 mt-3 px-5 py-1.5 rounded-full bg-black/60 border border-cyan-400/40 text-xs font-mono">
              <span className="text-slate-300">Respawns Used:</span>
              <span className="font-black text-rose-400">{duelState.myRespawnsUsed} / 3</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400 font-bold">
                {Math.max(0, 3 - duelState.myRespawnsUsed)} RESPAWNS REMAINING
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1V1 ROUND OVER BANNER */}
      {gameMode === '1v1_build_fight' && arena1v1State?.isRoundOver && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 animate-in zoom-in-90 duration-200">
          <div className={`flex flex-col items-center px-8 py-4 rounded-3xl backdrop-blur-xl border-2 shadow-[0_0_50px_rgba(0,0,0,0.8)] ${
            arena1v1State.roundWinner === 'player'
              ? 'bg-gradient-to-b from-amber-600/90 to-yellow-900/90 border-amber-300 text-white shadow-[0_0_50px_rgba(245,158,11,0.6)]'
              : 'bg-gradient-to-b from-rose-700/90 to-red-950/90 border-rose-400 text-white shadow-[0_0_50px_rgba(244,63,94,0.6)]'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className={`w-6 h-6 ${arena1v1State.roundWinner === 'player' ? 'text-amber-300 animate-bounce' : 'text-rose-300'}`} />
              <span className="font-mono text-sm uppercase tracking-widest font-black text-amber-200">
                ROUND {arena1v1State.round} OF {arena1v1State.maxRounds}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase drop-shadow-md">
              {arena1v1State.roundWinner === 'player' ? 'ROUND WON!' : 'ROUND LOST!'}
            </h2>
            <div className="flex items-center gap-2 mt-2 px-4 py-1 rounded-full bg-black/60 border border-white/20">
              <span className="text-xs font-mono text-slate-200">NEXT ROUND RESPAWNING IN</span>
              <span className="font-mono text-lg font-black text-amber-400 animate-pulse">
                {arena1v1State.countdown}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOP SECTION: Compass, Storm Tracker, Team Banner & Players Alive */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Alive Players, Squad Team Badge & Eliminations */}
        <div className="flex flex-col gap-2">
          {/* Team Badge */}
          {gameMode === 'battle_royale' ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-red-600 backdrop-blur-md px-3 py-1 rounded-xl border border-amber-400 text-white font-black text-xs shadow-lg shadow-amber-900/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>BATTLE ROYALE • ONLINE</span>
            </div>
          ) : gameMode === '1v1_build_fight' ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 backdrop-blur-md px-3 py-1 rounded-xl border border-amber-400 text-white font-black text-xs shadow-lg">
              <Swords className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>1V1 BUILD FIGHT ARENA</span>
            </div>
          ) : gameMode === 'first_person_royale' ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 backdrop-blur-md px-3 py-1 rounded-xl border border-cyan-400 text-white font-black text-xs shadow-lg shadow-cyan-900/40">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              <span>SPHERE STRIKE AI KNOCKOUT</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-xl border border-blue-400 text-white font-black text-xs shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
              <span>SQUAD ALPHA (YOU)</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Players Alive */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-xl">
              <Users className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 leading-none">ALIVE</span>
                <span className="font-mono text-base sm:text-lg font-black text-white leading-none">
                  {gameMode === '1v1_build_fight' ? 2 : playersLeft}
                </span>
              </div>
            </div>

            {/* Eliminations */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-xl">
              <Swords className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 leading-none">KILLS</span>
                <span className="font-mono text-base sm:text-lg font-black text-amber-400 leading-none">
                  {eliminations}
                </span>
              </div>
            </div>
          </div>

          {/* Party Online Members Widget */}
          {partyMembers && partyMembers.length > 0 && gameMode !== '1v1_build_fight' && (
            <div className="flex flex-col gap-1 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/15 w-44">
              <span className="text-[9px] font-mono text-cyan-300 font-bold px-1">
                SQUAD [{partyCode || 'SOLO'}]
              </span>
              {partyMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs font-bold text-white px-1 py-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <PlayerCharacterAvatar skinId={m.skinId} size="sm" className="w-5 h-5 rounded-md ring-1 ring-white/20 shrink-0" />
                    <span className="truncate">{m.name}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Battle Royale PvP Duel Scoreboard OR 1v1 Scoreboard OR Tactical Compass */}
        {gameMode === 'battle_royale' && duelState?.isDuelActive ? (
          <div className="flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4 px-5 py-2 rounded-3xl bg-black/85 backdrop-blur-md border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] text-white">
              {/* Local Player */}
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-cyan-400 tracking-wider">YOU</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((num) => (
                    <span
                      key={num}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        num <= (duelState.myRespawnsUsed || 0)
                          ? 'bg-rose-500 border-rose-300 shadow-[0_0_6px_#f43f5e]'
                          : 'bg-emerald-500/80 border-emerald-300 shadow-[0_0_4px_#10b981]'
                      }`}
                      title={num <= duelState.myRespawnsUsed ? `Respawn ${num} used` : `Respawn ${num} available`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs font-bold text-slate-300 ml-1">
                  ({duelState.myRespawnsUsed}/3)
                </span>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[9px] font-mono text-amber-300 font-black tracking-widest uppercase">
                  FRIEND DUEL
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  3 RESPAWNS MAX • 4TH LOSS
                </span>
              </div>

              {/* Remote Friend */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((num) => (
                    <span
                      key={num}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        num <= (duelState.friendRespawnsUsed || 0)
                          ? 'bg-rose-500 border-rose-300 shadow-[0_0_6px_#f43f5e]'
                          : 'bg-emerald-500/80 border-emerald-300 shadow-[0_0_4px_#10b981]'
                      }`}
                      title={num <= duelState.friendRespawnsUsed ? `Respawn ${num} used` : `Respawn ${num} available`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs font-bold text-slate-300">
                  ({duelState.friendRespawnsUsed}/3)
                </span>
                <span className="font-black text-xs sm:text-sm text-amber-400 tracking-wider uppercase truncate max-w-[120px]">
                  {duelState.friendName}
                </span>
              </div>
            </div>

            {/* Friend Distance & Duel status */}
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-200 bg-black/75 px-3 py-0.5 rounded-full border border-white/20">
              {duelState.friendDistance !== null ? (
                <span className="text-amber-300">🎯 {duelState.friendName}: {duelState.friendDistance}m away</span>
              ) : (
                <span className="text-slate-400">{duelState.friendName} in match</span>
              )}
              {duelState.duelMessage && (
                <>
                  <span>•</span>
                  <span className="text-cyan-300 animate-pulse">{duelState.duelMessage}</span>
                </>
              )}
            </div>
          </div>
        ) : gameMode === '1v1_build_fight' ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4 px-5 py-2 rounded-3xl bg-black/85 backdrop-blur-md border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] text-white">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-cyan-400 tracking-wider">YOU</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-white px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50">
                  {arena1v1State?.playerScore ?? 0}
                </span>
              </div>

              <div className="flex flex-col items-center px-1">
                <span className="text-[9px] font-mono text-amber-300 font-black tracking-widest uppercase">
                  FIRST TO {arena1v1State?.maxRounds ?? 3}
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  ROUND {arena1v1State?.round ?? 1}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-black text-rose-400 px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-400/50">
                  {arena1v1State?.botScore ?? 0}
                </span>
                <span className="font-black text-xs sm:text-sm tracking-wider uppercase" style={{
                  color: activeDifficulty === 'god' ? '#ef4444' : activeDifficulty === 'pro' ? '#f59e0b' : activeDifficulty === 'normal' ? '#eab308' : '#22c55e'
                }}>
                  {activeDifficulty === 'casual'
                    ? 'TRAINEE'
                    : activeDifficulty === 'normal'
                    ? 'RIVAL'
                    : activeDifficulty === 'pro'
                    ? 'PRO'
                    : 'GOD DEMON'}
                </span>
              </div>
            </div>

            {/* AI Hardness Quick Switcher */}
            {onChangeBotDifficulty && (
              <div className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-lg text-[10px] font-mono font-bold">
                <span className="text-slate-400 uppercase text-[9px] mr-1">AI HARDNESS:</span>
                {(['casual', 'normal', 'pro', 'god'] as const).map((lvl) => {
                  const isCur = activeDifficulty === lvl;
                  const colorClass =
                    lvl === 'casual'
                      ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500'
                      : lvl === 'normal'
                      ? 'text-yellow-400 bg-yellow-950/70 border-yellow-500'
                      : lvl === 'pro'
                      ? 'text-amber-400 bg-amber-950/70 border-amber-500'
                      : 'text-rose-400 bg-rose-950/70 border-rose-500';

                  return (
                    <button
                      key={lvl}
                      onClick={() => onChangeBotDifficulty(lvl)}
                      className={`px-2 py-0.5 rounded-lg border transition-all uppercase cursor-pointer ${
                        isCur
                          ? `${colorClass} font-black shadow-md scale-105 ring-1 ring-white/50`
                          : 'text-slate-400 bg-white/5 border-transparent hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {lvl === 'god' ? '👑 GOD' : lvl}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex flex-col items-center">
            <div className="w-72 h-8 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-around px-4 shadow-xl text-white font-mono text-xs font-bold">
              <span className="text-slate-400">NW</span>
              <span className="text-amber-400 font-black">N</span>
              <span className="text-slate-400">NE</span>
              <span className="text-white font-black">E</span>
              <span className="text-slate-400">SE</span>
              <span className="text-white font-black">S</span>
              <span className="text-slate-400">SW</span>
              <span className="text-white font-black">W</span>
            </div>
            <div className="w-2 h-2 -mt-1 rotate-45 bg-amber-400 border border-white shadow-md" />
          </div>
        )}

        {/* Right: Storm Timer / Flat Arena Indicator & Perspective Toggle Button */}
        <div className="flex flex-col items-end gap-2">
          {/* Storm Status or 1v1 Arena Badge */}
          {gameMode === '1v1_build_fight' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-950/80 backdrop-blur-md border border-amber-500/50 shadow-xl">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-amber-300 leading-none">FLAT ARENA</span>
                <span className="font-mono text-xs sm:text-sm font-black text-white leading-none">
                  NO STORM • NO CARS
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-950/80 backdrop-blur-md border border-purple-500/50 shadow-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-purple-300 leading-none">
                  {storm.isShrinking ? 'EYE SHRINKING' : `EYE CLOSES IN (PHASE ${storm.phase}/${storm.maxPhases})`}
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-purple-200 leading-none">
                  {Math.floor(storm.timeRemaining / 60)}:
                  {(Math.floor(storm.timeRemaining) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons: Perspective, Settings & Main Screen Lobby */}
          <div className="flex items-center gap-2">
            {networkPing !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono font-bold shadow-md">
                <Wifi className={`w-3.5 h-3.5 ${networkPing < 60 ? 'text-emerald-400' : networkPing < 120 ? 'text-amber-400' : 'text-rose-400'}`} />
                <span className={networkPing < 60 ? 'text-emerald-300' : networkPing < 120 ? 'text-amber-300' : 'text-rose-300'}>
                  {networkPing}ms
                </span>
              </div>
            )}

            {showFps && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-emerald-400 text-[11px] font-mono font-bold shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>60 FPS</span>
              </div>
            )}

            <button
              onClick={onTogglePerspective}
              title="Toggle First/Third Person Camera [V]"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>[V] {isFirstPerson ? '1ST' : '3RD'}</span>
            </button>

            {onOpenShop && (
              <button
                onClick={onOpenShop}
                title="Open S-Token Shop & Armory Bench [B]"
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 border border-amber-300 text-slate-950 text-xs font-display font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer"
              >
                <span>⚡</span>
                <span>SHOP</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Audio, Graphics & Control Settings"
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>SETTINGS</span>
              </button>
            )}

            {onReturnToLobby && (
              <button
                onClick={onReturnToLobby}
                title="Return to Main Menu / Lobby"
                className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 border border-rose-400 text-white text-xs font-black transition-all shadow-[0_0_20px_rgba(225,29,72,0.6)] active:scale-95 cursor-pointer group"
              >
                <Home className="w-3.5 h-3.5 text-white group-hover:-translate-y-0.5 transition-transform" />
                <span>MAIN MENU</span>
              </button>
            )}
          </div>

          {/* Tactical Live Kill Feed */}
          {killFeed && killFeed.length > 0 && (
            <div className="flex flex-col items-end gap-1 mt-1 max-w-[300px] sm:max-w-[340px]">
              {killFeed.slice(-4).map((log) => {
                const isPlayerKill = log.killer === 'You' || log.killer === 'Jonesy_Pro' || log.killer.includes('You');
                return (
                  <div
                    key={log.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-bold backdrop-blur-md shadow-md animate-in fade-in slide-in-from-right-4 duration-200 border ${
                      isPlayerKill
                        ? 'bg-amber-500/90 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] font-black'
                        : 'bg-black/70 text-slate-200 border-white/10'
                    }`}
                  >
                    <span className={isPlayerKill ? 'text-slate-950 font-black' : 'text-cyan-300'}>
                      {log.killer}
                    </span>
                    <span className="text-[11px] opacity-80">🎯</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
                      {log.weaponName}
                    </span>
                    {log.isHeadshot && (
                      <span className={`text-[10px] px-1 py-0.2 rounded font-black ${isPlayerKill ? 'bg-slate-950 text-amber-400' : 'bg-red-500/80 text-white'}`}>
                        HEADSHOT
                      </span>
                    )}
                    <span className={isPlayerKill ? 'text-red-950 font-black' : 'text-rose-400'}>
                      {log.victim}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CENTER-LOWER: PROMINENT FORTNITE ELIMINATION BANNER */}
      {eliminationBanner && (
        <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-150 select-none pointer-events-none">
          {/* Glowing Header Banner */}
          <div className="relative px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 p-[2px] shadow-[0_0_40px_rgba(239,68,68,0.8)]">
            <div className="px-6 py-2 rounded-2xl bg-slate-950/95 flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <Skull className={`w-6 h-6 ${eliminationBanner.isHeadshot ? 'text-amber-400 animate-bounce' : 'text-red-500 animate-pulse'}`} />
                <span className="font-display font-black text-xl sm:text-2xl tracking-wider uppercase text-white drop-shadow-md">
                  {eliminationBanner.isHeadshot ? '🎯 HEADSHOT ELIMINATED' : '💀 ELIMINATED'}
                </span>
                <span className="font-display font-black text-xl sm:text-2xl text-amber-400">
                  {eliminationBanner.victim}
                </span>
              </div>

              {/* Weapon Info & Distance Badge */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10">
                  <span>{eliminationBanner.weaponIcon}</span>
                  <span className="font-mono text-cyan-300 uppercase">{eliminationBanner.weaponName}</span>
                </div>
                {eliminationBanner.distance && eliminationBanner.distance > 5 && (
                  <span className="font-mono text-amber-300">
                    [{eliminationBanner.distance}m]
                  </span>
                )}
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-400/40">
                  <Swords className="w-3.5 h-3.5" />
                  <span>{eliminationBanner.eliminationCount} KILLS</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP Reward Notification Pill */}
          <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-cyan-600/90 border border-white/40 text-white font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+{eliminationBanner.xpEarned} XP {eliminationBanner.isHeadshot ? '(CRITICAL HEADSHOT BONUS)' : '(ELIMINATION BONUS)'}</span>
          </div>
        </div>
      )}

      {/* BOTTOM RIGHT: ITEM COLLECTION / PICKUP NOTIFICATIONS STACK */}
      {pickupNotifications && pickupNotifications.length > 0 && (
        <div className="absolute bottom-24 right-4 sm:right-6 z-30 flex flex-col-reverse items-end gap-1.5 pointer-events-none max-w-[280px] sm:max-w-[320px]">
          {pickupNotifications.slice(-5).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 shadow-xl text-white animate-in slide-in-from-right-8 fade-in duration-200"
              style={{ borderColor: p.color || '#38bdf8' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base bg-white/10 shadow-inner"
                style={{ backgroundColor: `${p.color}33` || '#38bdf833' }}
              >
                {p.icon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs tracking-wide" style={{ color: p.color || '#ffffff' }}>
                    {p.title}
                  </span>
                  {p.amount && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded">
                      {p.amount}
                    </span>
                  )}
                </div>
                {p.subtitle && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {p.subtitle}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CENTER: Dynamic Crosshair, Hitmarker & Sniper Scope with Bullet Trajectory Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isAiming && currentWeapon?.type === 'sniper' ? (
          <div className="relative w-[560px] h-[560px] rounded-full border-4 border-slate-900 bg-cyan-950/20 shadow-[0_0_0_2000px_rgba(0,0,0,0.94)] flex items-center justify-center pointer-events-none">
            {/* Outer optic rings & Mil-dot calibration */}
            <div className="absolute inset-3 rounded-full border border-cyan-400/30" />
            <div className="absolute inset-8 rounded-full border border-dashed border-cyan-300/20 animate-spin duration-1000" style={{ animationDuration: '60s' }} />

            {/* Thin crosshairs */}
            <div className="absolute w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-90" />
            <div className="absolute h-full w-[1.5px] bg-gradient-to-b from-transparent via-cyan-300 to-transparent opacity-90" />

            {/* Horizontal Windage & Deflection Ticks */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-between w-72 pointer-events-none text-[8px] font-mono text-cyan-300/70">
              <span className="-translate-x-2">-4.0</span>
              <span className="-translate-x-1">-2.0</span>
              <span className="w-1 h-1 bg-cyan-300 rounded-full" />
              <span className="translate-x-1">+2.0</span>
              <span className="translate-x-2">+4.0</span>
            </div>

            {/* Dynamic Bullet Trajectory Arc / Hash Marks */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-5 flex flex-col items-center gap-4 text-[9px] font-mono font-bold text-cyan-300/80">
              <div className="w-8 h-[1px] bg-cyan-300/90 flex justify-between px-1">
                <span className="-mt-3.5 -ml-6 text-[8px]">100m</span>
                <span className="-mt-3.5 -mr-6 text-[8px]">0.0 MOA</span>
              </div>
              <div className="w-12 h-[1px] bg-cyan-300/90 flex justify-between px-1">
                <span className="-mt-3.5 -ml-6 text-[8px]">200m</span>
                <span className="-mt-3.5 -mr-6 text-[8px]">+1.2 MOA</span>
              </div>
              <div className="w-16 h-[1px] bg-cyan-300/90 flex justify-between px-1">
                <span className="-mt-3.5 -ml-6 text-[8px]">300m</span>
                <span className="-mt-3.5 -mr-6 text-[8px]">+2.8 MOA</span>
              </div>
              <div className="w-20 h-[1px] bg-cyan-300/90 flex justify-between px-1">
                <span className="-mt-3.5 -ml-6 text-[8px]">400m</span>
                <span className="-mt-3.5 -mr-6 text-[8px]">+4.9 MOA</span>
              </div>
            </div>

            {/* Center Dynamic Bullet Point of Impact */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  scopeTargetData?.isHeadshot
                    ? 'border-amber-400 scale-125 animate-ping'
                    : scopeTargetData?.isBot
                    ? 'border-rose-500 scale-110'
                    : 'border-cyan-400'
                }`}
              />
              <div
                className={`absolute w-1.5 h-1.5 rounded-full shadow-[0_0_10px_#f43f5e] ${
                  scopeTargetData?.isHeadshot
                    ? 'bg-amber-300 shadow-[0_0_12px_#f59e0b]'
                    : scopeTargetData?.isBot
                    ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]'
                    : 'bg-rose-500'
                }`}
              />
            </div>

            {/* TOP SCOPE TELEMETRY */}
            <div className="absolute top-10 flex flex-col items-center gap-1 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-xl border border-cyan-400/40 shadow-xl">
              <div className="flex items-center gap-2">
                <Target
                  className={`w-4 h-4 ${
                    scopeTargetData?.isHeadshot
                      ? 'text-amber-400 animate-bounce'
                      : scopeTargetData?.isBot
                      ? 'text-rose-400 animate-pulse'
                      : 'text-cyan-400'
                  }`}
                />
                <span
                  className={`font-mono text-xs font-black tracking-wider uppercase ${
                    scopeTargetData?.isHeadshot
                      ? 'text-amber-400'
                      : scopeTargetData?.isBot
                      ? 'text-rose-400'
                      : 'text-cyan-300'
                  }`}
                >
                  {scopeTargetData?.isHeadshot
                    ? `🎯 CRITICAL HEADSHOT • ${scopeTargetData?.targetName}`
                    : scopeTargetData?.isBot
                    ? `🎯 TARGET LOCKED • ${scopeTargetData?.targetName}`
                    : scopeTargetData
                    ? `RANGE: ${scopeTargetData.distance}m • ${scopeTargetData.targetName}`
                    : 'CALIBRATING BALLISTICS...'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-mono font-bold text-slate-300">
                <span>DIST: <strong className="text-amber-300">{scopeTargetData?.distance || 0}m</strong></span>
                <span>•</span>
                <span>TRAJECTORY: <strong className="text-cyan-300">PINPOINT LASER</strong></span>
                <span>•</span>
                <span>DROP: <strong className="text-emerald-400">0.0 MOA</strong></span>
              </div>
            </div>

            {/* Bottom Optic Specification Banner */}
            <div className="absolute bottom-10 flex flex-col items-center font-mono text-[9px] tracking-widest text-cyan-400 font-bold bg-black/60 px-3 py-1 rounded-full border border-cyan-400/30">
              <span>HEAVY BOLT-ACTION 8X • ZERO BULLET SPREAD</span>
            </div>
          </div>
        ) : currentWeapon?.id === 'shotgun_double_barrel' ? (
          /* Custom Double-Barrel Break-Action Reticle */
          <div className="relative flex flex-col items-center justify-center">
            {/* Dual Chamber Barrel Reticle */}
            <div className="relative w-12 h-12 flex items-center justify-center pointer-events-none">
              {/* Wide Shotgun Pellets Outer Brackets */}
              <div
                className="absolute -left-3.5 w-3 h-7 border-l-2 border-t-2 border-b-2 rounded-l-md transition-colors duration-150"
                style={{
                  borderColor: currentWeapon.currentAmmo === 0 ? '#ef4444' : reticleColor,
                  boxShadow: currentWeapon.currentAmmo === 0 ? '0 0 10px rgba(239,68,68,0.6)' : '0 0 8px rgba(245,158,11,0.5)',
                }}
              />
              <div
                className="absolute -right-3.5 w-3 h-7 border-r-2 border-t-2 border-b-2 rounded-r-md transition-colors duration-150"
                style={{
                  borderColor: currentWeapon.currentAmmo === 0 ? '#ef4444' : reticleColor,
                  boxShadow: currentWeapon.currentAmmo === 0 ? '0 0 10px rgba(239,68,68,0.6)' : '0 0 8px rgba(245,158,11,0.5)',
                }}
              />

              {/* Twin Barrels Center Reticle Dots */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentWeapon.currentAmmo >= 1
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-rose-950/80 border border-rose-500/80'
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentWeapon.currentAmmo >= 2
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-rose-950/80 border border-rose-500/80'
                  }`}
                />
              </div>
            </div>

            {/* Status Indicator beneath reticle */}
            {currentWeapon.currentAmmo === 0 ? (
              <div className="absolute -bottom-8 whitespace-nowrap px-3 py-1 rounded-full bg-rose-950/95 border border-rose-500 text-[10px] font-mono font-black text-rose-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>⚠️ DEFENSELESS: SLIPPING IN 2 SHELLS...</span>
              </div>
            ) : (
              <div className="absolute -bottom-7 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-black/80 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1.5 backdrop-blur-md">
                <span>{currentWeapon.currentAmmo === 2 ? '🔴 🔴 2 SHELLS PRIMED' : '🔴 ⚪ 1 SHELL LEFT'}</span>
              </div>
            )}

            {/* Hitmarker (X) */}
            {hitmarker.active && (
              <div
                className={`absolute w-6 h-6 flex items-center justify-center font-black text-2xl animate-in zoom-in-150 duration-75 pointer-events-none ${
                  hitmarker.isHeadshot
                    ? 'text-amber-300 drop-shadow-[0_0_12px_#f59e0b]'
                    : hitmarker.isShield
                    ? 'text-cyan-400 drop-shadow-[0_0_10px_#38bdf8]'
                    : 'text-white drop-shadow-[0_0_8px_#fff]'
                }`}
              >
                ✕
              </div>
            )}
          </div>
        ) : currentWeapon?.id === 'rifle_burst' ? (
          /* Custom 3-Round Burst Marksman Reticle */
          <div className="relative flex flex-col items-center justify-center pointer-events-none">
            {/* Holographic Marksman Brackets & Triple-Burst Indicators */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Left bracket */}
              <div
                className="absolute -left-3 w-2 h-5 border-l-2 border-t border-b rounded-l-sm transition-colors duration-150"
                style={{
                  borderColor: isAiming ? '#38bdf8' : reticleColor,
                  boxShadow: '0 0 8px rgba(56,189,248,0.5)',
                }}
              />
              {/* Right bracket */}
              <div
                className="absolute -right-3 w-2 h-5 border-r-2 border-t border-b rounded-r-sm transition-colors duration-150"
                style={{
                  borderColor: isAiming ? '#38bdf8' : reticleColor,
                  boxShadow: '0 0 8px rgba(56,189,248,0.5)',
                }}
              />

              {/* Upward Recoil Rise Chevron Indicator */}
              <div className="absolute -top-3.5 flex flex-col items-center opacity-80">
                <span className="text-[8px] font-mono text-cyan-400 font-bold leading-none">▲</span>
                <span className="text-[6px] font-mono text-cyan-300/70 tracking-tighter leading-none">CLIMB</span>
              </div>

              {/* Triple Burst Round Pips */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentWeapon.currentAmmo >= 1
                      ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]'
                      : 'bg-slate-800 border border-slate-600'
                  }`}
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentWeapon.currentAmmo >= 2
                      ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]'
                      : 'bg-slate-800 border border-slate-600'
                  }`}
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentWeapon.currentAmmo >= 3
                      ? 'bg-cyan-300 shadow-[0_0_8px_#38bdf8]'
                      : 'bg-slate-800 border border-slate-600'
                  }`}
                />
              </div>

              {/* Center Micro Dot */}
              <div
                className={`absolute w-1 h-1 rounded-full ${
                  scopeTargetData?.isBot
                    ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                    : 'bg-cyan-300 shadow-[0_0_6px_#38bdf8]'
                }`}
              />
            </div>

            {/* Status & Bursts Left Banner beneath reticle */}
            {currentWeapon.currentAmmo === 0 ? (
              <div className="absolute -bottom-8 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-rose-950/95 border border-rose-500 text-[9px] font-mono font-black text-rose-200 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>EMPTY: PRESS R TO RELOAD</span>
              </div>
            ) : (
              <div className="absolute -bottom-7 whitespace-nowrap px-2 py-0.5 rounded-full bg-black/80 border border-cyan-500/40 text-[8.5px] font-mono font-bold text-cyan-300 flex items-center gap-1 backdrop-blur-md">
                <span>🎯 3-ROUND BURST • {Math.ceil(currentWeapon.currentAmmo / 3)} REMAINING</span>
                {scopeTargetData && (
                  <>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-300">{scopeTargetData.distance}m</span>
                  </>
                )}
              </div>
            )}

            {/* Hitmarker (X) */}
            {hitmarker.active && (
              <div
                className={`absolute w-6 h-6 flex items-center justify-center font-black text-2xl animate-in zoom-in-150 duration-75 pointer-events-none ${
                  hitmarker.isHeadshot
                    ? 'text-amber-300 drop-shadow-[0_0_12px_#f59e0b]'
                    : hitmarker.isShield
                    ? 'text-cyan-400 drop-shadow-[0_0_10px_#38bdf8]'
                    : 'text-white drop-shadow-[0_0_8px_#fff]'
                }`}
              >
                ✕
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Standard ADS precision crosshair */}
            {isAiming ? (
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-6 h-6 rounded-full border border-cyan-400/60 flex items-center justify-center ${
                    scopeTargetData?.isBot ? 'border-rose-400' : 'border-cyan-400/60'
                  }`}
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      scopeTargetData?.isBot ? 'bg-rose-500 shadow-[0_0_6px_#ef4444]' : 'bg-cyan-300'
                    }`}
                  />
                </div>
                {scopeTargetData && (
                  <div className="absolute -top-7 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-cyan-300 border border-cyan-400/30">
                    {scopeTargetData.distance}m • {scopeTargetData.targetName}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="absolute w-2.5 h-0.5 shadow-sm -left-3" style={{ backgroundColor: reticleColor }} />
                <div className="absolute w-2.5 h-0.5 shadow-sm -right-3" style={{ backgroundColor: reticleColor }} />
                <div className="absolute h-2.5 w-0.5 shadow-sm -top-3" style={{ backgroundColor: reticleColor }} />
                <div className="absolute h-2.5 w-0.5 shadow-sm -bottom-3" style={{ backgroundColor: reticleColor }} />
                <div className="w-1 h-1 rounded-full opacity-90 shadow-sm" style={{ backgroundColor: reticleColor }} />
              </>
            )}

            {/* Hitmarker (X) */}
            {hitmarker.active && (
              <div
                className={`absolute w-6 h-6 flex items-center justify-center font-black text-2xl animate-in zoom-in-150 duration-75 ${
                  hitmarker.isHeadshot
                    ? 'text-amber-300 drop-shadow-[0_0_12px_#f59e0b]'
                    : hitmarker.isShield
                    ? 'text-cyan-400 drop-shadow-[0_0_10px_#38bdf8]'
                    : 'text-white drop-shadow-[0_0_8px_#fff]'
                }`}
              >
                ✕
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Player Avatar, Health/Shield (250/250 Max), Building Matrix & Weapon Slots */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 w-full">
        {/* Left: Player Character Portrait & 250 Health / 250 Shield High-Capacity Bars */}
        <div className="flex items-center gap-3 w-80 sm:w-96 bg-black/60 backdrop-blur-md p-2 rounded-3xl border border-white/10 shadow-xl">
          <PlayerCharacterAvatar skinId={selectedSkin} size="lg" className="shrink-0 ring-2 ring-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
          <div className="flex flex-col gap-2 flex-1">
            {/* Shield Bar (Blue) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300 px-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>SHIELD</span>
                </div>
                <span className="font-mono text-sm font-black text-cyan-300">
                  {Math.round(shield)} / {effectiveMaxShield}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950/80 border border-cyan-500/50 p-0.5 shadow-lg overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>

            {/* Health Bar (Green) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300 px-1">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  <span>HEALTH</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-300">
                  {Math.round(health)} / {effectiveMaxHealth}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950/80 border border-emerald-500/50 p-0.5 shadow-lg overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-150 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Building Menu OR No-Build Tactical Indicator */}
        {is1v1Mode ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-rose-500/50 text-white shadow-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-xs font-black text-rose-400 uppercase tracking-wider">
                🚫 NO BUILDING • TACTICAL AIM DUEL
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-black/60 px-3 py-0.5 rounded-full border border-white/10">
              <span>💚 300 HP</span>
              <span>•</span>
              <span>🛡️ 300 SHIELD</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">TOTAL: 600 HP</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Materials Badge */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 shadow-xl">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                <span>🪵</span>
                <span className="font-mono">{wood}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-stone-300">
                <span>🪨</span>
                <span className="font-mono">{stone}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                <span>🔩</span>
                <span className="font-mono">{metal}</span>
              </div>
            </div>

            {/* Quick Build Keys (Wall [Q], Floor [F], Ramp [R], Cone [T]) */}
            <div className="flex items-center gap-1.5">
              {[
                { type: 'wall', key: 'Q', name: 'WALL', icon: '🧱' },
                { type: 'floor', key: 'F', name: 'FLOOR', icon: '⬜' },
                { type: 'ramp', key: 'R', name: 'RAMP', icon: '📐' },
                { type: 'cone', key: 'T', name: 'CONE', icon: '🔺' },
              ].map((b) => {
                const isSelected = isBuildMode && selectedBuildType === b.type;
                return (
                  <div
                    key={b.type}
                    className={`px-2.5 py-1 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
                      isSelected
                        ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105'
                        : 'bg-black/50 border-white/15'
                    }`}
                  >
                    <span className="text-xs">{b.icon}</span>
                    <span className="text-[10px] font-black text-white font-mono">[{b.key}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: 6-Slot Authentic Inventory Hotbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {inventory.map((wep, idx) => {
            const isSelected = activeSlot === idx;
            const rarityInfo = wep ? RARITY_COLORS[wep.rarity] : null;

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`pointer-events-auto relative w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex flex-col items-center justify-between p-1 border transition-all ${
                  isSelected
                    ? 'border-white ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105'
                    : 'border-white/20 bg-slate-950/60'
                } ${rarityInfo ? `bg-gradient-to-b ${rarityInfo.bg}` : 'bg-black/40'}`}
              >
                <span className="text-[10px] font-black text-slate-300 font-mono">
                  {idx + 1}
                </span>

                <span className="text-lg sm:text-xl">{wep ? wep.icon : '—'}</span>

                {wep && wep.type === 'pickaxe' && (
                  <span className="text-[8px] font-mono font-black text-amber-300 bg-amber-950/80 px-1 rounded border border-amber-500/40">
                    BUILD
                  </span>
                )}

                {wep && wep.type !== 'pickaxe' && (
                  <span className="text-[9px] font-mono font-black text-white bg-black/60 px-1 rounded-md">
                    {wep.id === 'shotgun_double_barrel' ? (
                      wep.currentAmmo === 2 ? (
                        <span className="text-amber-400">🔴🔴</span>
                      ) : wep.currentAmmo === 1 ? (
                        <span className="text-amber-300">🔴⚪</span>
                      ) : (
                        <span className="text-rose-400 text-[8px] animate-pulse">RELOAD</span>
                      )
                    ) : wep.id === 'rifle_burst' ? (
                      wep.currentAmmo === 0 ? (
                        <span className="text-rose-400 text-[8px] animate-pulse">RELOAD</span>
                      ) : (
                        <span className="text-cyan-300">
                          {Math.ceil(wep.currentAmmo / 3)}B ({wep.currentAmmo})
                        </span>
                      )
                    ) : wep.type === 'shield' || wep.type === 'heal' ? (
                      `x${wep.currentAmmo}`
                    ) : (
                      `${wep.currentAmmo} / ∞`
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
