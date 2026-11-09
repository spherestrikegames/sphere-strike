import React, { useState, useEffect } from 'react';
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
import { ISLAND_POIS, IslandPOI } from '../data/mapData';
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
  MapPin,
  Compass,
  X,
  Flag,
  Layers,
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
  playerLocationName?: string;
  playerCoords?: { x: number; z: number; rotationY?: number };
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
  playerLocationName,
  playerCoords,
  onSelectSlot,
  onTogglePerspective,
  onRequestPointerLock,
}) => {
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [waypoint, setWaypoint] = useState<{ x: number; z: number } | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<IslandPOI | null>(null);

  // Tactical Map Keyboard Toggle ([M] & [ESC])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'KeyM') {
        setIsMapExpanded((prev) => {
          const next = !prev;
          if (next && document.pointerLockElement) {
            document.exitPointerLock?.();
          }
          return next;
        });
      } else if (e.code === 'Escape' && isMapExpanded) {
        setIsMapExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapExpanded]);
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
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between z-20 font-sans"
      style={{
        paddingTop: 'max(clamp(12px, 2.5dvh, 24px), env(safe-area-inset-top, 0px))',
        paddingRight: 'max(clamp(12px, 2.5dvw, 24px), env(safe-area-inset-right, 0px))',
        paddingBottom: 'max(clamp(12px, 2.5dvh, 24px), env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(clamp(12px, 2.5dvw, 24px), env(safe-area-inset-left, 0px))',
      }}
    >
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
            <div className="liquid-glass w-80 h-9 flex items-center justify-around px-4 shadow-xl text-white font-mono text-xs font-bold rounded-[16px]">
              <span className="text-slate-400">NW</span>
              <span className="text-amber-400 font-black">N</span>
              <span className="text-slate-400">NE</span>
              <span className="text-white font-black">E</span>
              <span className="text-slate-400">SE</span>
              <span className="text-white font-black">S</span>
              <span className="text-slate-400">SW</span>
              <span className="text-white font-black">W</span>
            </div>
            <div className="w-2 h-2 -mt-1 rotate-45 bg-amber-400 border border-white shadow-md z-10" />
          </div>
        )}

        {/* Right: Circular Glass-Rimmed Minimap & Storm Timer */}
        <div className="flex flex-col items-end gap-2.5">
          {/* Circular Glass-Rimmed Minimap Frame */}
          <div
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock?.();
              setIsMapExpanded(true);
            }}
            title="Expand Full Tactical Map [M]"
            className="pointer-events-auto liquid-glass w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl border border-white/25 cursor-pointer hover:border-cyan-400/80 hover:scale-105 transition-all group"
          >
            {/* Internal Rings */}
            <div className="absolute inset-2.5 rounded-full border border-white/15" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-white/10" />
              <div className="h-full w-px bg-white/10" />
            </div>
            {/* North Pip */}
            <span className="absolute top-1.5 text-[9px] font-mono font-black text-amber-400">N</span>
            {/* Player Center Blip */}
            <div
              className="w-3 h-3 text-cyan-400 font-black text-xs flex items-center justify-center z-10 drop-shadow-[0_0_8px_#0a84ff] transition-transform"
              style={{
                transform: `rotate(${Math.round(((playerCoords?.rotationY || 0) * 180) / Math.PI + 180)}deg)`,
              }}
            >
              ▲
            </div>
            {/* Safe Zone Ring */}
            <div className="absolute w-14 h-14 rounded-full border border-emerald-400/60 animate-pulse pointer-events-none" />
            {/* Hover Expand Label */}
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
              <span className="text-[10px] font-mono font-black text-cyan-300">
                [M] MAP
              </span>
            </div>
          </div>

          {/* Dynamic Location Badge */}
          <div
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock?.();
              setIsMapExpanded(true);
            }}
            title="Click to view all Island Locations [M]"
            className="pointer-events-auto liquid-glass flex items-center gap-1.5 px-3 py-1 rounded-[14px] shadow-lg border border-cyan-400/40 cursor-pointer hover:border-cyan-300 transition-all animate-in fade-in duration-300"
          >
            <span className="text-amber-400 text-xs">📍</span>
            <span className="font-mono text-[11px] font-black text-cyan-200 tracking-wider uppercase">
              {playerLocationName || 'STRIKE ISLAND'}
            </span>
          </div>

          {/* Storm Status or 1v1 Arena Badge */}
          {gameMode === '1v1_build_fight' ? (
            <div className="liquid-glass flex items-center gap-2 px-3.5 py-1.5 rounded-[16px] shadow-xl">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-amber-300 leading-none">FLAT ARENA</span>
                <span className="font-mono text-xs sm:text-sm font-black text-white leading-none">
                  NO STORM • NO CARS
                </span>
              </div>
            </div>
          ) : (
            <div className="liquid-glass flex items-center gap-2 px-3.5 py-1.5 rounded-[16px] shadow-xl">
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
              onClick={() => {
                if (document.pointerLockElement) document.exitPointerLock?.();
                setIsMapExpanded(true);
              }}
              title="Open Island Tactical Map [M]"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-700/80 hover:bg-cyan-600 border border-cyan-400 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-200" />
              <span>[M] MAP</span>
            </button>

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
                <div className="reticle-tick left absolute w-2.5 h-0.5 shadow-sm -left-3 rounded-full" style={{ backgroundColor: reticleColor }} />
                <div className="reticle-tick right absolute w-2.5 h-0.5 shadow-sm -right-3 rounded-full" style={{ backgroundColor: reticleColor }} />
                <div className="reticle-tick top absolute h-2.5 w-0.5 shadow-sm -top-3 rounded-full" style={{ backgroundColor: reticleColor }} />
                <div className="reticle-tick bottom absolute h-2.5 w-0.5 shadow-sm -bottom-3 rounded-full" style={{ backgroundColor: reticleColor }} />
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
        {/* Left: Player Character Portrait & Liquid Glass Vitals Pod */}
        <div
          className="liquid-glass flex items-center gap-2.5 p-2.5 shadow-2xl"
          style={{
            width: 'clamp(200px, 24dvw, 340px)',
            borderRadius: 'clamp(14px, 2vw, 22px)',
          }}
        >
          <PlayerCharacterAvatar skinId={selectedSkin} size="lg" className="shrink-0 ring-2 ring-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
          <div className="flex flex-col gap-2 flex-1">
            {/* Liquid Blue Shield Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300 px-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="tracking-wide">SHIELD</span>
                </div>
                <span className="font-mono text-sm font-black text-cyan-300 drop-shadow-sm">
                  {Math.round(shield)} / {effectiveMaxShield}
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-black/40 border border-white/20 p-0.5 shadow-inner overflow-hidden relative">
                <div
                  className="liquid-gel-shield h-full rounded-full transition-all duration-150 overflow-hidden"
                  style={{ width: `${shieldPercent}%` }}
                >
                  <div className="gel-specular" />
                </div>
              </div>
            </div>

            {/* Liquid Green Health Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300 px-1">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  <span className="tracking-wide">HEALTH</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-300 drop-shadow-sm">
                  {Math.round(health)} / {effectiveMaxHealth}
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-black/40 border border-white/20 p-0.5 shadow-inner overflow-hidden relative">
                <div
                  className="liquid-gel-health h-full rounded-full transition-all duration-150 overflow-hidden"
                  style={{ width: `${healthPercent}%` }}
                >
                  <div className="gel-specular" />
                </div>
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

            {/* Tactical Special Abilities: Speed Boost [X] & Kinetic Slam [Z] */}
            <div className="flex items-center gap-2">
              <div
                className="liquid-glass px-3 py-1.5 flex items-center gap-2 rounded-2xl shadow-lg border border-cyan-400/40"
                title="Press [X] for High-Velocity Overdrive Speed Boost"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-white font-mono">[X]</span>
                    <span className="text-[10px] font-black text-cyan-300">SPEED BOOST</span>
                  </div>
                  <span className="text-[8px] font-mono text-cyan-200/70 leading-none">OVERDRIVE JET</span>
                </div>
              </div>

              <div
                className="liquid-glass px-3 py-1.5 flex items-center gap-2 rounded-2xl shadow-lg border border-purple-400/40"
                title="Press [Z] for Kinetic Shockwave Slam"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-white font-mono">[Z]</span>
                    <span className="text-[10px] font-black text-purple-300">KINETIC SLAM</span>
                  </div>
                  <span className="text-[8px] font-mono text-purple-200/70 leading-none">SHOCKWAVE PULSE</span>
                </div>
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

        {/* Right: Magazine/Reserve Ammo Counter & Tactical Inventory Hotbar */}
        <div className="flex flex-col items-end gap-2">
          {/* Magazine & Reserve Ammo Counter ("30 / 120") */}
          <div className="liquid-glass px-4 py-1.5 flex items-center gap-1.5 text-white font-mono rounded-[16px] shadow-lg">
            <span className="text-amber-400 font-black text-lg">
              {currentWeapon ? (currentWeapon.type === 'pickaxe' ? 'PICK' : currentWeapon.currentAmmo) : '—'}
            </span>
            <span className="text-white/40 text-sm">/</span>
            <span className="text-slate-300 font-bold text-sm">
              {currentWeapon ? (currentWeapon.type === 'shield' || currentWeapon.type === 'heal' ? 'MAX' : currentWeapon.type === 'pickaxe' ? '∞' : currentWeapon.reserveAmmo !== undefined ? currentWeapon.reserveAmmo : 120) : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
          {inventory.map((wep, idx) => {
            const isSelected = activeSlot === idx;
            const rarityInfo = wep ? RARITY_COLORS[wep.rarity] : null;

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`pointer-events-auto relative w-12 h-14 sm:w-14 sm:h-16 flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer ${
                  isSelected ? 'liquid-slot liquid-slot-active scale-105' : 'liquid-slot hover:scale-102'
                } ${rarityInfo ? `bg-gradient-to-b ${rarityInfo.bg}` : ''}`}
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

      {/* =========================================================================
          PART 17: FULL-SCREEN INTERACTIVE TACTICAL MAP RADAR OVERLAY MODAL
          ========================================================================= */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-2xl pointer-events-auto select-none animate-in fade-in zoom-in-95 duration-150">
          <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl border border-white/25 shadow-[0_25px_80px_rgba(0,0,0,0.9)] bg-gradient-to-b from-[#0e1626]/95 via-[#090d17]/95 to-[#06080f]/95 overflow-hidden">
            {/* Header: Tactical Island Telemetry & Controls */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/15 bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '30s' }} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-black text-base sm:text-lg text-white tracking-wider uppercase">
                      TACTICAL SATELLITE MAP
                    </h2>
                    <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      840m × 840m
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    SECTOR: <span className="text-amber-400 font-bold">{playerLocationName || 'STRIKE ISLAND'}</span> • COORDS: [X: {Math.round(playerCoords?.x || 0)}, Z: {Math.round(playerCoords?.z || 0)}]
                  </span>
                </div>
              </div>

              {/* Status Badges & Close Button */}
              <div className="flex items-center gap-3">
                {/* Storm Countdown Pill */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-950/70 border border-purple-500/40 text-xs font-mono font-bold text-purple-200">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>
                    STORM {storm.isShrinking ? 'CLOSING' : `PHASE ${storm.phase}/${storm.maxPhases}`}:{' '}
                    {Math.floor(storm.timeRemaining / 60)}:
                    {(Math.floor(storm.timeRemaining) % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Alive Players */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-white/15 text-xs font-mono font-bold text-white">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{playersLeft} ALIVE</span>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsMapExpanded(false)}
                  title="Close Map [ESC / M]"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 border border-rose-400 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">[M] CLOSE</span>
                </button>
              </div>
            </div>

            {/* Map Body: Interactive SVG Radar + Side Intel Drawer */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row gap-4 p-4">
              {/* Radar Map Canvas Container */}
              <div className="relative flex-1 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-white/15 overflow-hidden shadow-inner p-1 group">
                <svg
                  viewBox="0 0 840 840"
                  className="w-full h-auto max-h-[62vh] aspect-square cursor-crosshair rounded-xl overflow-hidden select-none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const rx = (e.clientX - rect.left) / rect.width;
                    const rz = (e.clientY - rect.top) / rect.height;
                    const wx = Math.round(rx * 840 - 420);
                    const wz = Math.round(rz * 840 - 420);
                    setWaypoint({ x: wx, z: wz });
                  }}
                >
                  <defs>
                    {/* Ocean Perimeter Gradient */}
                    <radialGradient id="islandOcean" cx="50%" cy="50%" r="50%">
                      <stop offset="68%" stopColor="#0d1b2a" />
                      <stop offset="85%" stopColor="#081422" />
                      <stop offset="100%" stopColor="#040b14" />
                    </radialGradient>

                    {/* Biome Color Gradients */}
                    <radialGradient id="snowBiome" cx="50%" cy="12%" r="28%">
                      <stop offset="0%" stopColor="#334155" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#1e293b" stopOpacity="0.0" />
                    </radialGradient>

                    <radialGradient id="desertBiome" cx="76%" cy="76%" r="28%">
                      <stop offset="0%" stopColor="#78350f" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#451a03" stopOpacity="0.0" />
                    </radialGradient>

                    <radialGradient id="forestBiome" cx="22%" cy="26%" r="28%">
                      <stop offset="0%" stopColor="#064e3b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#022c22" stopOpacity="0.0" />
                    </radialGradient>

                    <radialGradient id="coastalBiome" cx="16%" cy="58%" r="22%">
                      <stop offset="0%" stopColor="#0e7490" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#155e75" stopOpacity="0.0" />
                    </radialGradient>

                    <radialGradient id="templeBiome" cx="60%" cy="88%" r="22%">
                      <stop offset="0%" stopColor="#581c87" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#3b0764" stopOpacity="0.0" />
                    </radialGradient>

                    {/* Storm Glow Filter */}
                    <filter id="stormGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Ocean Backdrop */}
                  <rect width="840" height="840" fill="url(#islandOcean)" />

                  {/* Biome Region Overlays */}
                  <rect width="840" height="840" fill="url(#snowBiome)" />
                  <rect width="840" height="840" fill="url(#desertBiome)" />
                  <rect width="840" height="840" fill="url(#forestBiome)" />
                  <rect width="840" height="840" fill="url(#coastalBiome)" />
                  <rect width="840" height="840" fill="url(#templeBiome)" />

                  {/* Grid Lines (Sectors A1 to H8) */}
                  {[105, 210, 315, 420, 525, 630, 735].map((pos) => (
                    <g key={pos}>
                      <line x1={pos} y1="0" x2={pos} y2="840" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4" />
                      <line x1="0" y1={pos} x2="840" y2={pos} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4" />
                    </g>
                  ))}

                  {/* Concentric Distance Rings From Island Center */}
                  {[100, 200, 300, 400].map((radius) => (
                    <circle
                      key={radius}
                      cx="420"
                      cy="420"
                      r={radius}
                      fill="none"
                      stroke="rgba(6,182,212,0.15)"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                  ))}

                  {/* Central River Chasm SVG Path */}
                  <path
                    d="M 420 120 Q 390 260 420 400 T 400 580 Q 380 700 370 820"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="10"
                    strokeOpacity="0.45"
                    strokeLinecap="round"
                  />

                  {/* Two-Lane Main Highway Loop Path */}
                  <path
                    d="M 180 220 L 420 100 L 670 190 L 640 640 L 500 740 L 340 700 L 140 500 L 260 390 L 480 380 Z"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Highway Yellow Center Divider */}
                  <path
                    d="M 180 220 L 420 100 L 670 190 L 640 640 L 500 740 L 340 700 L 140 500 L 260 390 L 480 380 Z"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="6 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Bridge Crossings over River */}
                  <line x1="400" y1="395" x2="440" y2="405" stroke="#94a3b8" strokeWidth="12" strokeLinecap="square" />
                  <line x1="380" y1="575" x2="420" y2="585" stroke="#94a3b8" strokeWidth="12" strokeLinecap="square" />

                  {/* Active Storm Shrinking Wall Ring */}
                  <circle
                    cx={storm.currentCenterX + 420}
                    cy={storm.currentCenterZ + 420}
                    r={Math.max(0, storm.currentRadius)}
                    fill="rgba(168, 85, 247, 0.08)"
                    stroke="#c084fc"
                    strokeWidth="4"
                    filter="url(#stormGlow)"
                  />

                  {/* Next Storm Safe Zone Eye Ring */}
                  <circle
                    cx={storm.targetCenterX + 420}
                    cy={storm.targetCenterZ + 420}
                    r={Math.max(0, storm.targetRadius)}
                    fill="rgba(16, 185, 129, 0.08)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="8 6"
                  />
                  {/* Safe Zone Center Crosshair */}
                  <g transform={`translate(${storm.targetCenterX + 420}, ${storm.targetCenterZ + 420})`}>
                    <circle r="4" fill="#10b981" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#10b981" strokeWidth="1.5" />
                  </g>

                  {/* Dotted Path from Player to Waypoint */}
                  {waypoint && (
                    <line
                      x1={(playerCoords?.x || 0) + 420}
                      y1={(playerCoords?.z || 0) + 420}
                      x2={waypoint.x + 420}
                      y2={waypoint.z + 420}
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                  )}

                  {/* 10 Named POI Pins */}
                  {ISLAND_POIS.map((poi) => {
                    const sx = poi.x + 420;
                    const sy = poi.z + 420;
                    const isSelected = selectedPoi?.id === poi.id;
                    const distFromPlayer = Math.round(
                      Math.hypot((playerCoords?.x || 0) - poi.x, (playerCoords?.z || 0) - poi.z)
                    );

                    return (
                      <g
                        key={poi.id}
                        transform={`translate(${sx}, ${sy})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoi(poi);
                          setWaypoint({ x: poi.x, z: poi.z });
                        }}
                        className="cursor-pointer group/poi"
                      >
                        {/* Glow halo on hover or selection */}
                        <circle
                          r={isSelected ? 22 : 16}
                          fill={poi.color}
                          fillOpacity={isSelected ? 0.35 : 0.15}
                          stroke={poi.color}
                          strokeWidth={isSelected ? 2 : 1}
                          className="transition-all"
                        />

                        {/* POI Icon Emoji */}
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={isSelected ? "18" : "14"}
                          className="transition-all select-none"
                        >
                          {poi.icon}
                        </text>

                        {/* Name Banner */}
                        <rect
                          x="-48"
                          y="15"
                          width="96"
                          height="18"
                          rx="5"
                          fill="rgba(10, 15, 26, 0.88)"
                          stroke={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)'}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="27"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                          className="select-none"
                        >
                          {poi.name}
                        </text>

                        {/* Chest count badge */}
                        <rect
                          x="22"
                          y="-18"
                          width="24"
                          height="13"
                          rx="3"
                          fill="#f59e0b"
                        />
                        <text
                          x="34"
                          y="-9"
                          textAnchor="middle"
                          fill="#0f172a"
                          fontSize="8"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {poi.chestsCount}
                        </text>
                      </g>
                    );
                  })}

                  {/* Waypoint Marker Pin */}
                  {waypoint && (
                    <g transform={`translate(${waypoint.x + 420}, ${waypoint.z + 420})`}>
                      <circle r="14" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" strokeWidth="2" />
                      <circle r="5" fill="#f59e0b" />
                      <text x="0" y="-16" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="black" fontFamily="monospace">
                        📍 WAYPOINT
                      </text>
                      <text x="0" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {Math.round(Math.hypot((playerCoords?.x || 0) - waypoint.x, (playerCoords?.z || 0) - waypoint.z))}m
                      </text>
                    </g>
                  )}

                  {/* Local Player Marker */}
                  <g
                    transform={`translate(${(playerCoords?.x || 0) + 420}, ${(playerCoords?.z || 0) + 420})`}
                  >
                    {/* Sonar Pulse */}
                    <circle r="18" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
                    <circle r="8" fill="#00f0ff" stroke="#ffffff" strokeWidth="2" shadow="0 0 10px #00f0ff" />
                    {/* Directional Heading Cone */}
                    <path
                      d="M 0 -14 L 6 0 L -6 0 Z"
                      fill="#00f0ff"
                      stroke="#ffffff"
                      strokeWidth="1"
                      transform={`rotate(${Math.round(((playerCoords?.rotationY || 0) * 180) / Math.PI + 180)})`}
                    />
                    <text x="0" y="-18" textAnchor="middle" fill="#00f0ff" fontSize="10" fontWeight="900" fontFamily="monospace">
                      YOU
                    </text>
                  </g>
                </svg>

                {/* Compass Rose Indicator Overlay */}
                <div className="absolute top-4 right-4 flex flex-col items-center bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 pointer-events-none text-xs font-mono font-bold text-white">
                  <span className="text-amber-400 font-black">N</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>W</span>
                    <span className="text-cyan-400">•</span>
                    <span>E</span>
                  </div>
                  <span className="text-slate-400">S</span>
                </div>
              </div>

              {/* Right Side: POI Intel & Tactical Mission Drawer */}
              <div className="w-full md:w-80 flex flex-col gap-3">
                {/* Active POI Card */}
                {selectedPoi ? (
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-cyan-400/50 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedPoi.icon}</span>
                        <div>
                          <h3 className="text-base font-black text-white">{selectedPoi.name}</h3>
                          <span className="text-[10px] font-mono text-cyan-300 uppercase">
                            BIOME: {selectedPoi.type} • ELEVATION: +{selectedPoi.elevation}m
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPoi(null)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {selectedPoi.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <span>📦</span>
                        <span>{selectedPoi.chestsCount} LOOT CHESTS</span>
                      </div>
                      <div className="text-cyan-300">
                        🎯 {Math.round(Math.hypot((playerCoords?.x || 0) - selectedPoi.x, (playerCoords?.z || 0) - selectedPoi.z))}m AWAY
                      </div>
                    </div>

                    <button
                      onClick={() => setWaypoint({ x: selectedPoi.x, z: selectedPoi.z })}
                      className="mt-2 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer"
                    >
                      SET WAYPOINT TO {selectedPoi.name.toUpperCase()}
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-bold text-cyan-300 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>CLICK MAP TO DROP CUSTOM WAYPOINT</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Click any point on the island or select a named location below to mark a waypoint and distance vector.
                    </p>
                  </div>
                )}

                {/* POI Fast Directory List */}
                <div className="flex-1 overflow-y-auto max-h-[36vh] flex flex-col gap-1.5 pr-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                    ALL 10 ISLAND LOCATIONS
                  </span>
                  {ISLAND_POIS.map((p) => {
                    const isSelected = selectedPoi?.id === p.id;
                    const dist = Math.round(Math.hypot((playerCoords?.x || 0) - p.x, (playerCoords?.z || 0) - p.z));

                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPoi(p);
                          setWaypoint({ x: p.x, z: p.z });
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">{p.icon}</span>
                          <span className="text-xs font-bold truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                          <span className="text-amber-400">{p.chestsCount}📦</span>
                          <span className="text-slate-400">{dist}m</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Bar: Legend & Action Shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-white/15 bg-white/5 backdrop-blur-md text-xs font-mono">
              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-emerald-400 bg-emerald-400/20" />
                  <span>Safe Eye</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-purple-400 bg-purple-400/20" />
                  <span>Storm Edge</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>Waypoint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span>Your Position</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {waypoint && (
                  <button
                    onClick={() => {
                      setWaypoint(null);
                      setSelectedPoi(null);
                    }}
                    className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    CLEAR WAYPOINT
                  </button>
                )}
                <button
                  onClick={() => setIsMapExpanded(false)}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 border border-cyan-300 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer"
                >
                  RETURN TO BATTLE [ESC]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
