import React, { useState, useEffect } from 'react';
import { PlayerProfile, GameMode, PartyState, BattlegroundMap } from '../types';
import { FORTNITE_SKINS } from '../data/fortniteData';
import { PlayerCharacterAvatar } from './PlayerCharacterAvatar';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import {
  Play,
  Sparkles,
  Crown,
  Trophy,
  Users,
  Copy,
  Check,
  Globe,
  Radio,
  Gamepad2,
  Wind,
  Volume2,
  VolumeX,
  Settings,
  Wifi,
  WifiOff,
  Zap,
  RotateCw,
  Share2,
  Link2,
  Server,
  Lock,
} from 'lucide-react';

interface FortniteLobbyProps {
  profile: PlayerProfile;
  selectedMode: GameMode;
  selectedMap?: BattlegroundMap;
  botDifficulty?: 'casual' | 'normal' | 'pro' | 'god';
  onSelectMode: (mode: GameMode) => void;
  onSelectMap?: (map: BattlegroundMap) => void;
  onSelectBotDifficulty?: (difficulty: 'casual' | 'normal' | 'pro' | 'god') => void;
  onStartMatch: () => void;
  onOpenLocker: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
}

export const FortniteLobby: React.FC<FortniteLobbyProps> = ({
  profile,
  selectedMode,
  selectedMap = 'island_2v2',
  botDifficulty = 'pro',
  onSelectMode,
  onSelectMap,
  onSelectBotDifficulty,
  onStartMatch,
  onOpenLocker,
  onOpenShop,
  onOpenSettings,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [ping, setPing] = useState<number>(24);
  const [publicRooms, setPublicRooms] = useState<Array<{ code: string; playerCount: number; gameState: string; isGlobal?: boolean }>>([]);
  const [party, setParty] = useState<PartyState>(() => ({ ...multiplayerClient.partyState }));
  const [partyError, setPartyError] = useState<string | null>(null);

  const cleanPartyCode = (party.code || '').trim().toUpperCase();
  const isGlobalServer = cleanPartyCode === 'ROYALE-GLOBAL' || cleanPartyCode.startsWith('GLOBAL');
  const hasFriendParty = party.members.length > 1;
  const isBattleRoyaleLocked = selectedMode === 'battle_royale' && !isGlobalServer && !hasFriendParty;

  const currentSkin =
    FORTNITE_SKINS.find((s) => s.id === profile.selectedSkin) || FORTNITE_SKINS[0];

  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  // Poll public rooms list for global server browser
  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/parties/public');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.rooms) {
            setPublicRooms(data.rooms);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Start Lobby Background Theme Music on user interaction
    const startAudioOnInteraction = () => {
      fortniteAudio.startLobbyMusic();
      setIsMusicPlaying(true);
      window.removeEventListener('click', startAudioOnInteraction);
    };
    window.addEventListener('click', startAudioOnInteraction);

    // Setup handlers immediately
    multiplayerClient.setHandlers({
      onPartyUpdate: (updatedParty) => {
        setParty({ ...updatedParty });
        setPartyError(null);
      },
      onConnectionChange: (connected) => {
        setParty((prev) => ({ ...prev, isConnected: connected }));
        if (connected) {
          setPartyError(null);
        }
      },
      onPingUpdate: (latencyMs) => {
        setPing(latencyMs);
      },
      onMatchStart: () => {
        setIsReady(true);
        fortniteAudio.playUiClick();
        setTimeout(() => {
          onStartMatch();
        }, 500);
      },
      onError: (msg) => {
        setPartyError(msg);
      },
    });

    // Synchronize active player and room code
    multiplayerClient.connectWithCode(party.code || multiplayerClient.partyState.code, {
      name: profile.name,
      skinId: profile.selectedSkin,
      level: profile.level,
    });

    return () => {
      window.removeEventListener('click', startAudioOnInteraction);
    };
  }, [profile.name, profile.selectedSkin, profile.level, onStartMatch]);

  const toggleMusic = () => {
    if (isMusicPlaying) {
      fortniteAudio.stopMusic();
      setIsMusicPlaying(false);
    } else {
      fortniteAudio.startLobbyMusic();
      setIsMusicPlaying(true);
    }
  };

  const handleCopyCode = () => {
    const codeToCopy = party.code || multiplayerClient.partyState.code;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      fortniteAudio.playUiClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const link = multiplayerClient.getShareableLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    fortniteAudio.playUiClick();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoinGlobalRoom = () => {
    setParty((prev) => ({ ...prev, code: 'ROYALE-GLOBAL' }));
    multiplayerClient.connectWithCode('ROYALE-GLOBAL', {
      name: profile.name,
      skinId: profile.selectedSkin,
      level: profile.level,
    });
    fortniteAudio.playUiClick();
  };

  const handleGenerateNewCode = () => {
    const newCode = multiplayerClient.generateNewCode({
      name: profile.name,
      skinId: profile.selectedSkin,
      level: profile.level,
    });
    setParty((prev) => ({ ...prev, code: newCode }));
    fortniteAudio.playUiClick();
  };

  const handleJoinParty = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    setParty((prev) => ({ ...prev, code: cleanCode }));
    multiplayerClient.connectWithCode(cleanCode, {
      name: profile.name,
      skinId: profile.selectedSkin,
      level: profile.level,
    });
    setJoinCodeInput('');
    fortniteAudio.playUiClick();
  };

  const handleQuickMatch = () => {
    multiplayerClient.quickMatch({
      name: profile.name,
      skinId: profile.selectedSkin,
      level: profile.level,
    });
    fortniteAudio.playUiClick();
  };

  const handleRetryConnection = () => {
    multiplayerClient.connect();
    fortniteAudio.playUiClick();
  };

  const handlePlayClick = () => {
    if (isBattleRoyaleLocked) {
      fortniteAudio.playHitmarker(false, false);
      setPartyError('Battle Royale requires joining the Global Server or having a friend party to drop in!');
      return;
    }
    setIsReady(true);
    fortniteAudio.playUiClick();

    if (party.code) {
      multiplayerClient.startPartyMatch(selectedMode, selectedMap);
    }
    setTimeout(() => {
      onStartMatch();
    }, 300);
  };

  const gameModes: {
    id: GameMode;
    name: string;
    tag: string;
    desc: string;
    icon: string;
    bg: string;
    onlineOnly?: boolean;
    isLocked?: boolean;
  }[] = [
    {
      id: 'battle_royale',
      name: 'BATTLE ROYALE',
      tag: isBattleRoyaleLocked ? '🔒 SERVER/SQUAD REQUIRED' : isGlobalServer ? '🌐 GLOBAL SERVER READY' : '👥 SQUAD READY',
      desc: isBattleRoyaleLocked
        ? 'Locked: Pure multiplayer PvP! Connect to the Global Server or invite a friend to unlock drop.'
        : 'Real players only — zero AI bots! Drop into the island with friends or global server players for pure Battle Royale PvP.',
      icon: isBattleRoyaleLocked ? '🔒' : '🌐',
      bg: isBattleRoyaleLocked ? 'from-rose-900/80 to-slate-900/90' : 'from-amber-600/90 to-rose-900/90',
      onlineOnly: true,
      isLocked: isBattleRoyaleLocked,
    },
    {
      id: 'first_person_royale',
      name: 'AI KNOCKOUT',
      tag: '25-BOT BATTLEGROUND',
      desc: 'First-person realistic sights, weapon recoil, 25-bot drop & tactical urban combat.',
      icon: '🎯',
      bg: 'from-blue-600/70 to-slate-900/90',
    },
    {
      id: '1v1_build_fight',
      name: '1V1 DUEL ARENA',
      tag: 'NO-BUILD • 600 HP',
      desc: 'Ruthless aim duel! Pure mechanical gunplay, 600 HP (300 HP + 300 Shield), and selectable AI bot hardness.',
      icon: '⚔️',
      bg: 'from-indigo-600/70 to-slate-900/90',
    },
  ];

  const battlegroundMaps: {
    id: BattlegroundMap;
    name: string;
    tag: string;
    desc: string;
    icon: string;
    bg: string;
  }[] = [
    {
      id: 'island_2v2',
      name: 'Expanded 2v2 Island',
      tag: 'FULL BATTLEGROUND',
      desc: 'Complete island with Tilted Towers, Pleasant Park, Dusty Depot, cliffs & highway circuit.',
      icon: '🗺️',
      bg: 'from-emerald-600/50 to-slate-900/90',
    },
    {
      id: 'tilted_skyscrapers',
      name: 'Urban Skyscraper Arena',
      tag: '6-STORY VERTICAL',
      desc: 'High-density urban battle centered on 6-story furnished towers with stair landings & jump pads.',
      icon: '🏙️',
      bg: 'from-indigo-600/50 to-slate-900/90',
    },
    {
      id: 'pleasant_valley',
      name: 'Classic Pleasant Valley',
      tag: 'FURNISHED HOMES',
      desc: 'Suburban tactical warfare with fully furnished luxury homes, driveways, cars & interior loot.',
      icon: '🏡',
      bg: 'from-amber-600/50 to-slate-900/90',
    },
  ];

  const difficultyLevels: {
    id: 'casual' | 'normal' | 'pro' | 'god';
    name: string;
    badge: string;
    color: string;
    textColor: string;
    border: string;
    desc: string;
  }[] = [
    {
      id: 'casual',
      name: 'CASUAL',
      badge: 'TRAINEE',
      color: 'bg-emerald-950/70',
      textColor: 'text-emerald-400',
      border: 'border-emerald-500/60',
      desc: 'Slow reactions, low accuracy. Perfect for target warmup.',
    },
    {
      id: 'normal',
      name: 'NORMAL',
      badge: 'RIVAL',
      color: 'bg-yellow-950/70',
      textColor: 'text-yellow-400',
      border: 'border-yellow-500/60',
      desc: 'Balanced strafes, standard accuracy and shotgun bursts.',
    },
    {
      id: 'pro',
      name: 'PRO',
      badge: 'SWEAT',
      color: 'bg-amber-950/70',
      textColor: 'text-amber-400',
      border: 'border-amber-500/60',
      desc: 'Fast slides, headshot-seeking aim, tactical jump shots.',
    },
    {
      id: 'god',
      name: 'GOD',
      badge: 'AIM DEMON 👑',
      color: 'bg-rose-950/70',
      textColor: 'text-rose-400',
      border: 'border-rose-500/80',
      desc: 'Instant reaction, aggressive slides, laser precision aim.',
    },
  ];

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Background Atmosphere - Vibrant Deep Tones, Zero Neon Bloom */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-[90px] pointer-events-none" />

      {/* TOP BAR: Logo, Party Code Pill, Currency & Locker */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Title with In-Game Player Icon */}
        <div className="flex items-center gap-3">
          <PlayerCharacterAvatar skinId={profile.selectedSkin} size="md" className="ring-2 ring-blue-500" />
          <div>
            <h1 className="font-display font-black text-xl sm:text-2xl tracking-wider text-white flex items-center gap-2">
              SPHERE STRIKE <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-black">AI KNOCKOUT</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-blue-300 font-bold tracking-widest uppercase">
              1-PERSON BATTLE ROYALE • AI KNOCKOUT DROP • S-TOKEN ARMORY
            </p>
          </div>
        </div>

        {/* Top Right: Party Code Pill, V-Bucks, Level & Locker */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Party Code Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 backdrop-blur-md shadow-md">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-300 font-bold">CODE:</span>
              <span className="font-mono font-black text-sm text-amber-300 tracking-wider">
                {party.code || 'CONNECTING...'}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              title="Copy Party Code"
              className="p-1 rounded-lg bg-indigo-800/80 hover:bg-indigo-700 text-indigo-200 transition-all ml-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* S-Tokens Vault */}
          <div
            onClick={onOpenShop}
            title="Click to Open S-Token Shop & Armory"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 backdrop-blur-md cursor-pointer hover:bg-amber-900/80 transition-all shadow-md"
          >
            <span className="text-amber-400 font-black text-sm">🅢</span>
            <div className="flex flex-col">
              <span className="text-[8px] text-amber-300/90 font-bold uppercase leading-tight">S-TOKENS</span>
              <span className="font-mono font-black text-xs sm:text-sm text-amber-300 leading-none">
                {profile.vbucks.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Level */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-md">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-black text-xs sm:text-sm text-white">LVL {profile.level}</span>
          </div>

          {/* S-Token Shop & Armory Button */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-950/40 active:scale-95 cursor-pointer"
          >
            <span className="text-base leading-none">⚡</span>
            <span>S-TOKEN SHOP</span>
          </button>

          {/* Music Toggle */}
          <button
            onClick={toggleMusic}
            title={isMusicPlaying ? 'Mute Lobby Music' : 'Play Lobby Music'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 font-bold text-xs text-white transition-all shadow-md cursor-pointer"
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] text-emerald-300 font-mono">MUSIC ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] text-slate-400 font-mono">MUTED</span>
              </>
            )}
          </button>

          {/* Locker & Career */}
          <button
            onClick={onOpenLocker}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 font-bold text-xs sm:text-sm text-white transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>LOCKER</span>
          </button>

          {/* Game Settings & Performance */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/20 font-bold text-xs sm:text-sm text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white" />
            <span>SETTINGS</span>
          </button>
        </div>
      </div>

      {/* CENTER: 3-Column Layout: Mode Carousel, Character Podium, Party Hub */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 items-center gap-6 py-3">
        {/* Left: Playlist Selection */}
        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">SELECT PLAYLIST</span>
          <div className="flex flex-col gap-2">
            {gameModes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => {
                    onSelectMode(mode.id);
                    fortniteAudio.playUiClick();
                  }}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? mode.isLocked
                        ? 'border-rose-500 bg-gradient-to-r ' + mode.bg + ' ring-2 ring-rose-500/70 shadow-lg scale-[1.01]'
                        : 'border-amber-400 bg-gradient-to-r ' + mode.bg + ' ring-2 ring-amber-500/70 shadow-lg scale-[1.01]'
                      : 'border-white/10 bg-slate-900/70 hover:bg-slate-800/80 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                      mode.isLocked ? 'bg-rose-950/60 text-rose-300' : 'bg-black/50 text-white'
                    }`}>
                      {mode.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-black text-sm text-white">{mode.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono ${
                          mode.isLocked
                            ? 'bg-rose-950 text-rose-200 border border-rose-600/50'
                            : 'bg-slate-800 text-amber-300 border border-amber-500/40'
                        }`}>
                          {mode.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1">{mode.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI HARDNESS SELECTION (Shown prominently when 1v1 Arena is selected or as a general practice setting) */}
          {selectedMode === '1v1_build_fight' && (
            <div className="mt-2 p-3 rounded-2xl bg-black/70 border border-purple-400/40 backdrop-blur-md flex flex-col gap-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wider text-purple-300 uppercase flex items-center gap-1.5">
                  <span>🤖</span> AI OPPONENT HARDNESS
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {difficultyLevels.find((d) => d.id === botDifficulty)?.badge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {difficultyLevels.map((diff) => {
                  const isCur = botDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => {
                        onSelectBotDifficulty?.(diff.id);
                        fortniteAudio.playUiClick();
                      }}
                      className={`p-2 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        isCur
                          ? `${diff.color} ${diff.border} ring-2 ring-purple-400/80 shadow-lg scale-[1.02]`
                          : 'bg-black/40 border-white/10 hover:bg-white/5 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black font-mono ${diff.textColor}`}>
                          {diff.name}
                        </span>
                        {diff.id === 'god' && <span className="text-xs">👑</span>}
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                        {diff.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRE-GAME MAP SELECTION LOBBY */}
          {selectedMode !== '1v1_build_fight' && (
            <div className="mt-2.5 p-3 rounded-2xl bg-black/70 border border-emerald-500/40 backdrop-blur-md flex flex-col gap-2 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wider text-emerald-300 uppercase flex items-center gap-1.5">
                  <span>📍</span> BATTLEGROUND MAP
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {battlegroundMaps.find((m) => m.id === (selectedMap || 'island_2v2'))?.tag}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {battlegroundMaps.map((map) => {
                  const isCurMap = (selectedMap || 'island_2v2') === map.id;
                  return (
                    <button
                      key={map.id}
                      type="button"
                      onClick={() => {
                        onSelectMap?.(map.id);
                        fortniteAudio.playUiClick();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                        isCurMap
                          ? `bg-gradient-to-r ${map.bg} border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg scale-[1.02]`
                          : 'bg-black/50 border-white/10 hover:bg-white/5 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-lg shadow-inner">
                          {map.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-black text-xs text-white">{map.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-black font-mono">
                              {map.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                            {map.desc}
                          </p>
                        </div>
                      </div>
                      {isCurMap && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Center: Character Showcase Podium */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center">
            <div className="absolute -bottom-8 w-60 h-14 rounded-full bg-blue-900/30 border border-blue-500/40 blur-sm transform rotate-x-60" />
            <div className="absolute -bottom-6 w-44 h-8 rounded-full bg-blue-600/20 blur-md" />

            {/* Avatar - What you look like in the game */}
            <div className="relative z-10 w-40 h-40 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-br from-blue-950/60 to-slate-900 border-2 border-blue-500/50 flex items-center justify-center shadow-2xl overflow-hidden group">
              <PlayerCharacterAvatar skinId={currentSkin.id} size="xl" className="w-full h-full border-none rounded-none" />
            </div>

            {/* Name Tag */}
            <div className="relative z-10 mt-3 px-4 py-1.5 rounded-2xl bg-black/80 border border-white/20 backdrop-blur-md flex flex-col items-center shadow-md">
              <span className="font-display font-black text-base text-white">{currentSkin.name}</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                {currentSkin.rarity} OUTFIT
              </span>
            </div>
          </div>
        </div>

        {/* Right: Online Party / Squad Hub */}
        <div className="flex flex-col gap-3">
          {/* Party Hub Panel */}
          <div className={`p-4 rounded-3xl backdrop-blur-md flex flex-col gap-3 shadow-2xl transition-all ${
            selectedMode === 'battle_royale'
              ? isBattleRoyaleLocked
                ? 'bg-slate-900/95 border-2 border-rose-600/70 shadow-xl'
                : 'bg-slate-900/95 border-2 border-emerald-500/70 shadow-xl'
              : 'bg-slate-900/85 border border-white/15'
          }`}>
            {/* Header with Online Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-black text-sm text-white">
                  {selectedMode === 'battle_royale' ? 'BATTLE ROYALE ROOM' : 'ONLINE PARTY SQUAD'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE • READY
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                  {party.members.length} / 16
                </span>
              </div>
            </div>

            {/* Battle Royale Specific Eligibility Banner inside Party Hub */}
            {selectedMode === 'battle_royale' && (
              isBattleRoyaleLocked ? (
                <div className="p-3 rounded-2xl bg-rose-950/90 border border-rose-600/70 text-rose-100 flex flex-col gap-2 shadow-md">
                  <div className="flex items-center gap-2 text-rose-200 font-black text-xs">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>MULTIPLAYER DROP RESTRICTION</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-snug font-medium">
                    Battle Royale requires being in the <strong>Global Server</strong> or having <strong>2+ friends</strong> in your party.
                  </p>
                  <button
                    type="button"
                    onClick={handleJoinGlobalRoom}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>CONNECT TO GLOBAL SERVER</span>
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {isGlobalServer ? 'Global Server Active • PvP Ready' : `Party of ${party.members.length} Ready`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase">UNLOCKED</span>
                </div>
              )
            )}

            {/* Active Room Code Box */}
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">YOUR ONLINE ROOM</span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 font-bold">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>{ping}ms • {party.isConnected ? 'ONLINE' : 'CONNECTING'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-xl bg-slate-950/80 border border-amber-500/40 text-amber-300 font-mono font-black text-sm tracking-widest text-center shadow-inner select-all truncate">
                  {party.code || multiplayerClient.partyState.code || 'ROYALE-LIVE'}
                </div>
                <button
                  type="button"
                  onClick={handleGenerateNewCode}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all border border-white/10 active:scale-95 cursor-pointer"
                  title="Generate a new room code"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>NEW</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Copy room code only"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'CODE'}</span>
                </button>
              </div>

              {/* 1-Click Copy Direct Invite Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
                title="Copy direct invite link to send to friends on other computers or phones"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>INVITE LINK COPIED! (SHARE WITH FRIENDS)</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 text-emerald-200" />
                    <span>COPY DIRECT INVITE LINK (CROSS-DEVICE)</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 leading-tight">
                Send the link to friends on any PC, laptop, or phone to drop in the exact same game!
              </p>
            </div>

            {/* Quick Match & Global Server Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleJoinGlobalRoom}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  party.code === 'ROYALE-GLOBAL'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-lg'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                }`}
                title="Join the public global server where all online players meet"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>GLOBAL SERVER</span>
              </button>

              <button
                type="button"
                onClick={handleQuickMatch}
                className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-purple-700/80 to-indigo-700/80 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-purple-400/30 shadow-md transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>QUICK MATCH</span>
              </button>
            </div>

            {/* Join Room by Code Form */}
            <form onSubmit={handleJoinParty} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ENTER ROOM CODE..."
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs font-mono font-bold text-yellow-300 placeholder:text-slate-500 uppercase focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer"
              >
                JOIN
              </button>
            </form>

            {/* Multi-player Notice if multiple players connected */}
            {party.members.length > 1 && (
              <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                <span>🔥</span>
                <span>{party.members.length} players connected! Ready to drop in together!</span>
              </div>
            )}

            {/* Connected Members List */}
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                PLAYERS IN THIS GAME ({party.members.length}):
              </span>
              {party.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <PlayerCharacterAvatar skinId={member.skinId} size="sm" className="w-6 h-6 rounded-lg ring-1 ring-white/20 shrink-0" />
                    <span className="font-bold text-white truncate max-w-[110px]">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {member.isHost && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        👑 HOST
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-emerald-300">CONNECTED</span>
                  </div>
                </div>
              ))}
            </div>

            {partyError && (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/40 p-1.5 rounded-lg border border-rose-800/40">
                {partyError}
              </span>
            )}
          </div>

          {/* Gameplay Tuning Highlights */}
          <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-1 text-[11px] text-slate-300 shadow-md">
            <span className="font-bold text-white text-[10px] uppercase tracking-wider text-blue-400">
              ⚡ GAMEPLAY ENHANCEMENTS:
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>• 🪂 Skydiving Spawn</div>
              <div>• 🤖 Selectable AI Hardness</div>
              <div>• 💚 300 HP + 300 Shield (1v1)</div>
              <div>• 🎯 No-Build Tactical Duels</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION: Battle Royale Gate Status & Play Button */}
      <div className="relative z-10 flex flex-col gap-3 pt-3 border-t border-white/10">
        {/* Battle Royale Gate Prompt when in Battle Royale mode */}
        {selectedMode === 'battle_royale' && (
          isBattleRoyaleLocked ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-950/90 border-2 border-rose-600/80 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
                    BATTLE ROYALE LOCKED
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-500/40">
                      GLOBAL SERVER OR PARTY REQUIRED
                    </span>
                  </h4>
                  <p className="text-xs text-rose-200/90 font-medium">
                    Battle Royale is pure PvP! Join the public global server or invite friends to your squad to drop in together.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleJoinGlobalRoom}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>JOIN GLOBAL SERVER</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Link2 className="w-4 h-4 text-blue-200" />}
                  <span>{copiedLink ? 'LINK COPIED!' : 'INVITE FRIENDS'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-display font-black text-xs text-white">
                  {isGlobalServer ? 'CONNECTED TO GLOBAL SERVER' : `FRIEND PARTY READY (${party.members.length} PLAYERS)`}
                </span>
                <span className="text-xs text-emerald-300">· Ready for Battle Royale Drop</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">
                {isGlobalServer ? 'PUBLIC MATCHMAKING' : 'PARTY MATCH'}
              </span>
            </div>
          )
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            🖱️ Click screen to lock mouse. Controls: <strong className="text-blue-400 font-mono">[W,A,S,D]</strong> Move •{' '}
            <strong className="text-blue-400 font-mono">[Shift]</strong> Fast Sprint •{' '}
            <strong className="text-amber-400 font-mono">[Q,F,R,T]</strong> Build •{' '}
            <strong className="text-blue-400 font-mono">[V]</strong> 1st/3rd Person
          </div>

          <button
            onClick={handlePlayClick}
            disabled={isReady || isBattleRoyaleLocked}
            className={`w-full sm:w-auto px-12 py-4 rounded-3xl font-display font-black text-xl tracking-wider transform -skew-x-6 transition-all flex items-center justify-center gap-3 ${
              isBattleRoyaleLocked
                ? 'bg-slate-800/90 border-2 border-rose-600/60 text-rose-300/80 cursor-not-allowed shadow-none'
                : 'hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-950/60 cursor-pointer'
            }`}
          >
            {isBattleRoyaleLocked ? (
              <>
                <Lock className="w-6 h-6 text-rose-400" />
                <span>JOIN GLOBAL OR PARTY TO DROP</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                <span>
                  {isReady
                    ? 'LAUNCHING MATCH...'
                    : selectedMode === 'battle_royale' && isGlobalServer
                    ? 'DROP INTO GLOBAL SERVER'
                    : selectedMode === 'battle_royale' && party.members.length > 1
                    ? `DROP TOGETHER (${party.members.length} PLAYERS)`
                    : selectedMode === 'battle_royale'
                    ? 'DROP INTO BATTLE ROYALE'
                    : party.members.length > 1
                    ? `READY UP SQUAD (${party.members.length})`
                    : 'READY UP (PLAY)'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
