/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PlayerProfile,
  GameMode,
  FortniteWeapon,
  StormState,
  DamageNumber,
  MatchStats,
  BuildType,
  MaterialType,
  ScopeTargetData,
  EliminationBannerData,
  EliminationLog,
  PickupNotification,
  Arena1v1State,
  BattlegroundMap,
  BattleRoyaleDuelState,
} from './types';
import { WEAPON_REGISTRY, DEFAULT_PICKAXE } from './data/fortniteData';
import { FortniteEngine } from './game/fortniteEngine';
import { FortniteLobby } from './components/FortniteLobby';
import { FortniteHUD } from './components/FortniteHUD';
import { FortniteLocker } from './components/FortniteLocker';
import { FortniteShop } from './components/FortniteShop';
import { FortniteSettings, DEFAULT_SETTINGS } from './components/FortniteSettings';
import { VictoryRoyaleScreen } from './components/VictoryRoyaleScreen';
import { EliminatedScreen } from './components/EliminatedScreen';
import { multiplayerClient } from './utils/multiplayer';
import { fortniteAudio } from './utils/audio';

const DEFAULT_PROFILE: PlayerProfile = {
  name: 'Sphere_Striker',
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  vbucks: 0,
  battleStars: 0,
  wins: 0,
  kills: 0,
  matchesPlayed: 0,
  selectedSkin: 'jonesy',
  selectedPickaxe: 'pickaxe_default',
  selectedGlider: 'glider_default',
  unlockedSkins: ['jonesy'],
  unlockedPickaxes: ['pickaxe_default'],
  unlockedGliders: ['glider_default'],
  unlockedWeapons: [
    'ar_scar',
    'shotgun_pump_epic',
    'sniper_bolt_legendary',
    'smg_p90_epic',
    'mini_shields',
    'medkit',
  ],
  weaponTiers: {
    ar_scar: 1,
    shotgun_pump_epic: 1,
    sniper_bolt_legendary: 1,
  },
  armoryPerks: {
    damageBoost: 0,
    reloadBoost: 0,
    magBoost: 0,
    spreadReduction: 0,
    fireRateBoost: 0,
    siphonShield: false,
  },
  loadout: {
    slot1: 'ar_scar',
    slot2: 'shotgun_pump_epic',
    slot3: 'sniper_bolt_legendary',
    slot4: 'mini_shields',
    slot5: 'medkit',
  },
  settings: { ...DEFAULT_SETTINGS },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FortniteEngine | null>(null);

  // App & Screen State
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'victory' | 'eliminated'>('lobby');
  const [selectedMode, setSelectedMode] = useState<GameMode>('battle_royale');
  const [selectedMap, setSelectedMap] = useState<BattlegroundMap>('island_2v2');
  const [botDifficulty, setBotDifficulty] = useState<'casual' | 'normal' | 'pro' | 'god'>('pro');
  const [isLockerOpen, setIsLockerOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  // Player Profile (Persisted to localStorage)
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('fortnite_player_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If an old legacy profile had all 7 skins pre-unlocked, reset to starter skin so shop is usable
        const skins = (Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.length > 0 && parsed.unlockedSkins.length < 7)
          ? parsed.unlockedSkins
          : ['jonesy'];
        const pickaxes = (Array.isArray(parsed.unlockedPickaxes) && parsed.unlockedPickaxes.length > 0 && parsed.unlockedPickaxes.length < 3)
          ? parsed.unlockedPickaxes
          : ['pickaxe_default'];
        const gliders = (Array.isArray(parsed.unlockedGliders) && parsed.unlockedGliders.length > 0 && parsed.unlockedGliders.length < 2)
          ? parsed.unlockedGliders
          : ['glider_default'];

        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          vbucks: typeof parsed.vbucks === 'number' && parsed.vbucks >= 0 ? parsed.vbucks : 0,
          unlockedSkins: skins,
          unlockedPickaxes: pickaxes,
          unlockedGliders: gliders,
          unlockedWeapons: parsed.unlockedWeapons || DEFAULT_PROFILE.unlockedWeapons,
          weaponTiers: parsed.weaponTiers || DEFAULT_PROFILE.weaponTiers,
          armoryPerks: { ...DEFAULT_PROFILE.armoryPerks, ...(parsed.armoryPerks || {}) },
          loadout: { ...DEFAULT_PROFILE.loadout, ...(parsed.loadout || {}) },
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  // Active In-Game HUD States - Higher Health (250 HP + 250 Shield)
  const [health, setHealth] = useState<number>(250);
  const [shield, setShield] = useState<number>(100);
  const [wood, setWood] = useState<number>(300);
  const [stone, setStone] = useState<number>(150);
  const [metal, setMetal] = useState<number>(80);
  const [inventory, setInventory] = useState<(FortniteWeapon | null)[]>([
    { ...DEFAULT_PICKAXE },
    { ...WEAPON_REGISTRY.ar_scar },
    { ...WEAPON_REGISTRY.shotgun_pump_epic },
    { ...WEAPON_REGISTRY.sniper_bolt_legendary },
    { ...WEAPON_REGISTRY.mini_shields },
    { ...WEAPON_REGISTRY.medkit },
  ]);
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [playersLeft, setPlayersLeft] = useState<number>(25);
  const [eliminations, setEliminations] = useState<number>(0);
  const [isFirstPerson, setIsFirstPerson] = useState<boolean>(true);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [scopeTargetData, setScopeTargetData] = useState<ScopeTargetData | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isBuildMode, setIsBuildMode] = useState<boolean>(false);
  const [selectedBuildType, setSelectedBuildType] = useState<BuildType>('wall');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('wood');
  const [damageTakenFlash, setDamageTakenFlash] = useState<boolean>(false);
  const [hitmarker, setHitmarker] = useState<{ active: boolean; isHeadshot: boolean; isShield: boolean }>({
    active: false,
    isHeadshot: false,
    isShield: false,
  });
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [eliminationBanner, setEliminationBanner] = useState<EliminationBannerData | null>(null);
  const [killFeed, setKillFeed] = useState<EliminationLog[]>([]);
  const [pickupNotifications, setPickupNotifications] = useState<PickupNotification[]>([]);

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [nearVehiclePrompt, setNearVehiclePrompt] = useState<string | null>(null);
  const [nearSupplyPrompt, setNearSupplyPrompt] = useState<string | null>(null);
  const [arena1v1State, setArena1v1State] = useState<Arena1v1State | null>(null);
  const [duelState, setDuelState] = useState<BattleRoyaleDuelState | null>(null);

  // Skydiving & Touchdown state
  const [isSkydiving, setIsSkydiving] = useState<boolean>(true);
  const [isGliding, setIsGliding] = useState<boolean>(false);
  const [altitude, setAltitude] = useState<number>(220);
  const [touchdownBanner, setTouchdownBanner] = useState<boolean>(false);

  const [storm, setStorm] = useState<StormState>({
    currentRadius: 290,
    targetRadius: 190,
    currentCenterX: 0,
    currentCenterZ: 0,
    targetCenterX: 10,
    targetCenterZ: -10,
    phase: 1,
    maxPhases: 5,
    timeRemaining: 60,
    totalPhaseTime: 60,
    isShrinking: false,
    dps: 1,
  });

  // Save profile on change
  useEffect(() => {
    localStorage.setItem('fortnite_player_profile', JSON.stringify(profile));
  }, [profile]);

  // Pointer lock change listener & Escape menu shortcut
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === canvasRef.current);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsSettingsOpen((prev) => {
          const next = !prev;
          if (next && document.pointerLockElement) {
            document.exitPointerLock();
          }
          return next;
        });
      } else if (e.code === 'KeyB' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsShopOpen((prev) => {
          const next = !prev;
          if (next && document.pointerLockElement) {
            document.exitPointerLock();
          }
          return next;
        });
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time Settings updates
  const handleSaveSettings = useCallback((newSettings: typeof profile.settings) => {
    setProfile((prev) => ({
      ...prev,
      settings: { ...newSettings },
    }));

    if (engineRef.current) {
      engineRef.current.applySettings(newSettings);
    }
    fortniteAudio.applySettings(newSettings);
  }, []);

  // Start Battle Royale Match
  const handleStartMatch = useCallback(() => {
    fortniteAudio.startGameMusic();
    setGameState('playing');
    setHealth(250);
    setShield(100);
    setWood(300);
    setStone(150);
    setMetal(80);
    setEliminations(0);
    setMatchStats(null);
    setIsSkydiving(true);
    setIsGliding(false);
    setAltitude(220);
    setTouchdownBanner(false);
    setEliminationBanner(null);
    setKillFeed([]);
    setPickupNotifications([]);

    setTimeout(() => {
      if (!canvasRef.current) return;

      if (engineRef.current) {
        engineRef.current.destroy();
      }

      const engine = new FortniteEngine(
        canvasRef.current,
        profile,
        {
          onHealthChange: (hp, sh) => {
          setHealth(hp);
          setShield(sh);
        },
        onMaterialsChange: (w, s, m) => {
          setWood(w);
          setStone(s);
          setMetal(m);
        },
        onInventoryChange: (inv, slot) => {
          setInventory([...inv]);
          setActiveSlot(slot);
        },
        onPlayersLeftChange: (count) => {
          setPlayersLeft(count);
        },
        onElimination: (log) => {
          if (log.killer === 'You' || log.killer === profile.name) {
            setEliminations((prev) => prev + 1);
          }
          setKillFeed((prev) => [...prev.slice(-8), log]);
        },
        onEliminationBanner: (bannerData) => {
          setEliminationBanner(bannerData);
          setTimeout(() => {
            setEliminationBanner((prev) => (prev?.id === bannerData.id ? null : prev));
          }, 3800);
        },
        onItemCollected: (item) => {
          setPickupNotifications((prev) => [...prev.slice(-6), item]);
          setTimeout(() => {
            setPickupNotifications((prev) => prev.filter((p) => p.id !== item.id));
          }, 3200);
        },
        onStormUpdate: (st) => {
          setStorm({ ...st });
        },
        onHitmarker: (isHeadshot, isShield) => {
          setHitmarker({ active: true, isHeadshot, isShield });
          setTimeout(() => setHitmarker((prev) => ({ ...prev, active: false })), 120);
        },
        onDamageTaken: () => {
          setDamageTakenFlash(true);
          setTimeout(() => setDamageTakenFlash(false), 150);
        },
        onSkydivingUpdate: (skydiving, gliding, alt) => {
          setIsSkydiving(skydiving);
          setIsGliding(gliding);
          setAltitude(alt);
        },
        onTouchdown: () => {
          setTouchdownBanner(true);
          setTimeout(() => setTouchdownBanner(false), 3500);
        },
        onAimingChange: (aiming, targetData) => {
          setIsAiming(aiming);
          setScopeTargetData(targetData || null);
        },
        onVehicleChange: (v) => {
          setActiveVehicle(v ? { ...v } : null);
        },
        onNearVehiclePrompt: (prompt) => {
          setNearVehiclePrompt(prompt);
        },
        onNearSupplyPrompt: (prompt) => {
          setNearSupplyPrompt(prompt);
        },
        onArena1v1Update: (arenaState) => {
          setArena1v1State({ ...arenaState });
        },
        onDuelUpdate: (duel) => {
          setDuelState(duel ? { ...duel } : null);
        },
        onMatchEnd: (isVictory, stats) => {
          fortniteAudio.stopMusic();
          if (isVictory) {
            fortniteAudio.playVictoryRoyale();
          } else {
            fortniteAudio.playEliminationSound();
          }
          setMatchStats(stats);
          setGameState(isVictory ? 'victory' : 'eliminated');

          // Update Profile Career Stats & Currency
          setProfile((prev) => {
            const newXp = prev.xp + stats.xpEarned;
            let newLevel = prev.level;
            let reqXp = prev.xpToNextLevel;
            if (newXp >= reqXp) {
              newLevel++;
              reqXp = Math.floor(reqXp * 1.25);
            }
            const earnedCoins = stats.vbucksEarned || (stats.baseCoins ?? 0) + (stats.eliminationBonusCoins ?? 0);
            return {
              ...prev,
              level: newLevel,
              xp: newXp % reqXp,
              xpToNextLevel: reqXp,
              vbucks: prev.vbucks + earnedCoins,
              wins: prev.wins + (isVictory ? 1 : 0),
              kills: prev.kills + stats.eliminations,
              matchesPlayed: prev.matchesPlayed + 1,
            };
          });

          if (document.exitPointerLock) {
            document.exitPointerLock();
          }
        },
      },
      selectedMode,
      botDifficulty,
      selectedMap
    );

      if (selectedMode === 'first_person_royale') {
        engine.isFirstPerson = true;
      } else if (selectedMode === 'battle_royale') {
        engine.isFirstPerson = false;
      }
      setIsFirstPerson(engine.isFirstPerson);

      engineRef.current = engine;
    }, 50);
  }, [profile, selectedMode, botDifficulty, selectedMap]);

  // Handle Dynamic Bot Difficulty Updates
  const handleSetBotDifficulty = (difficulty: 'casual' | 'normal' | 'pro' | 'god') => {
    setBotDifficulty(difficulty);
    if (engineRef.current) {
      engineRef.current.setBotDifficulty(difficulty);
    }
  };

  // Clean up engine on unmount & listen for squad match start
  useEffect(() => {
    multiplayerClient.setHandlers({
      onMatchStart: () => {
        handleStartMatch();
      },
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [handleStartMatch]);

  const handleTogglePerspective = () => {
    if (engineRef.current) {
      engineRef.current.togglePerspective();
      setIsFirstPerson(engineRef.current.isFirstPerson);
    }
  };

  const handleSelectSlot = (slotIndex: number) => {
    if (engineRef.current) {
      engineRef.current.setActiveSlot(slotIndex);
      setActiveSlot(slotIndex);
    }
  };

  const handleRequestPointerLock = () => {
    if (canvasRef.current && !document.pointerLockElement) {
      try {
        const res = (canvasRef.current as any).requestPointerLock?.();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {
            // Handled: browser or iframe restrictions
          });
        }
      } catch {
        // Handled: gesture requirement
      }
    }
  };

  const handleReturnToLobby = useCallback(() => {
    if (document.pointerLockElement && document.exitPointerLock) {
      document.exitPointerLock();
    }
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    fortniteAudio.playUiClick();
    fortniteAudio.startLobbyMusic();
    setGameState('lobby');
  }, []);

  // Ensure lobby music starts smoothly on first interaction
  useEffect(() => {
    if (gameState !== 'lobby') return;
    const handleLobbyInteraction = () => {
      fortniteAudio.startLobbyMusic();
    };
    window.addEventListener('pointerdown', handleLobbyInteraction, { once: true });
    window.addEventListener('keydown', handleLobbyInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleLobbyInteraction);
      window.removeEventListener('keydown', handleLobbyInteraction);
    };
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${
          gameState === 'playing' ? 'cursor-crosshair' : 'hidden'
        }`}
      />

      {/* Main Lobby Screen */}
      {gameState === 'lobby' && (
        <FortniteLobby
          profile={profile}
          selectedMode={selectedMode}
          selectedMap={selectedMap}
          botDifficulty={botDifficulty}
          onSelectMode={setSelectedMode}
          onSelectMap={setSelectedMap}
          onSelectBotDifficulty={handleSetBotDifficulty}
          onStartMatch={handleStartMatch}
          onOpenLocker={() => setIsLockerOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <FortniteHUD
          health={health}
          shield={shield}
          selectedSkin={profile.selectedSkin}
          maxHealth={selectedMode === '1v1_build_fight' ? 300 : 250}
          maxShield={selectedMode === '1v1_build_fight' ? 300 : 250}
          wood={wood}
          stone={stone}
          metal={metal}
          inventory={inventory}
          activeSlot={activeSlot}
          playersLeft={playersLeft}
          eliminations={eliminations}
          storm={storm}
          isFirstPerson={isFirstPerson}
          isAiming={isAiming}
          isPointerLocked={isPointerLocked}
          isBuildMode={isBuildMode}
          selectedBuildType={selectedBuildType}
          selectedMaterial={selectedMaterial}
          damageTakenFlash={damageTakenFlash}
          hitmarker={hitmarker}
          damageNumbers={damageNumbers}
          isSkydiving={isSkydiving}
          isGliding={isGliding}
          altitude={altitude}
          touchdownBanner={touchdownBanner}
          partyMembers={multiplayerClient.partyState.members}
          partyCode={multiplayerClient.partyState.code}
          scopeTargetData={scopeTargetData}
          activeVehicle={activeVehicle}
          nearVehiclePrompt={nearVehiclePrompt}
          nearSupplyPrompt={nearSupplyPrompt}
          eliminationBanner={eliminationBanner}
          killFeed={killFeed}
          pickupNotifications={pickupNotifications}
          showFps={profile.settings.showFps}
          reticleColor={profile.settings.reticleColor}
          gameMode={selectedMode}
          arena1v1State={arena1v1State}
          duelState={duelState}
          botDifficulty={botDifficulty}
          onChangeBotDifficulty={handleSetBotDifficulty}
          onReset1v1Builds={() => engineRef.current?.resetAllBuildings()}
          onOpenShop={() => {
            if (document.pointerLockElement) {
              document.exitPointerLock();
            }
            setIsShopOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReturnToLobby={handleReturnToLobby}
          onSelectSlot={handleSelectSlot}
          onTogglePerspective={handleTogglePerspective}
          onRequestPointerLock={handleRequestPointerLock}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <FortniteSettings
          settings={profile.settings}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* Locker & Career Modal */}
      {isLockerOpen && (
        <FortniteLocker
          profile={profile}
          onUpdateProfile={(up) => {
            setProfile(up);
            if (engineRef.current) {
              engineRef.current.profile = up;
              if (up.selectedSkin) {
                engineRef.current.updatePlayerSkin(up.selectedSkin);
              }
            }
          }}
          onClose={() => setIsLockerOpen(false)}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* S-Token Shop & Armory Upgrades Modal */}
      {isShopOpen && (
        <FortniteShop
          isOpen={isShopOpen}
          profile={profile}
          onUpdateProfile={(up) => {
            setProfile(up);
            if (engineRef.current) {
              engineRef.current.profile = up;
              if (up.selectedSkin) {
                engineRef.current.updatePlayerSkin(up.selectedSkin);
              }
            }
          }}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Victory Royale Celebration Screen */}
      {gameState === 'victory' && matchStats && (
        <VictoryRoyaleScreen
          stats={matchStats}
          onPlayAgain={handleStartMatch}
          onReturnToLobby={() => {
            if (engineRef.current) {
              engineRef.current.destroy();
              engineRef.current = null;
            }
            setGameState('lobby');
          }}
        />
      )}

      {/* Eliminated Screen */}
      {gameState === 'eliminated' && matchStats && (
        <EliminatedScreen
          stats={matchStats}
          onPlayAgain={handleStartMatch}
          onReturnToLobby={() => {
            if (engineRef.current) {
              engineRef.current.destroy();
              engineRef.current = null;
            }
            setGameState('lobby');
          }}
        />
      )}
    </div>
  );
}
