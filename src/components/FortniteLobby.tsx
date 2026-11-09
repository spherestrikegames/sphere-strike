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
  selectedMap = 'pinecrest_suburb',
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

  // Apple Tinted Liquid Glass P2P Room State
  const [p2pCode, setP2pCode] = useState<string | null>(null);
  const [p2pInput, setP2pInput] = useState<string>('');
  const [p2pStatus, setP2pStatus] = useState<string>('P2P READY');
  const [p2pConnected, setP2pConnected] = useState<boolean>(false);

  const handleHostP2P = () => {
    const PeerClass = (window as any).Peer;
    if (!PeerClass) {
      setP2pStatus('PeerJS loading...');
      return;
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const p = new PeerClass(code);
    p.on('open', (id: string) => {
      setP2pCode(id);
      setP2pStatus(`Hosting [${id}]`);
      setParty((prev) => ({ ...prev, code: id }));
      multiplayerClient.connectWithCode(id, {
        name: profile.name,
        skinId: profile.selectedSkin,
        level: profile.level,
      });
    });
    p.on('connection', (conn: any) => {
      conn.on('open', () => {
        setP2pConnected(true);
        setP2pStatus('Peer Connected!');
        fortniteAudio.playUiClick();
      });
    });
    p.on('error', (err: any) => {
      setP2pStatus(`Error: ${err?.type || 'Failed'}`);
    });
    fortniteAudio.playUiClick();
  };

  const handleJoinP2P = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = p2pInput.trim().toUpperCase();
    if (!cleanCode) return;
    const PeerClass = (window as any).Peer;
    if (!PeerClass) return;

    const p = new PeerClass();
    p.on('open', () => {
      setP2pStatus(`Connecting to ${cleanCode}...`);
      const conn = p.connect(cleanCode);
      conn.on('open', () => {
        setP2pConnected(true);
        setP2pCode(cleanCode);
        setP2pStatus(`Connected to ${cleanCode}`);
        setParty((prev) => ({ ...prev, code: cleanCode }));
        multiplayerClient.connectWithCode(cleanCode, {
          name: profile.name,
          skinId: profile.selectedSkin,
          level: profile.level,
        });
        fortniteAudio.playUiClick();
      });
    });
    p.on('error', (err: any) => {
      setP2pStatus(`Error: ${err?.type || 'Failed'}`);
    });
    fortniteAudio.playUiClick();
  };

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

  const handleFindRandomPlayers = async () => {
    try {
      const rooms = await multiplayerClient.fetchPublicRooms();
      const candidates = rooms.filter((r) => r.code !== party.code && r.playerCount > 0);
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        setParty((prev) => ({ ...prev, code: target.code }));
        multiplayerClient.connectWithCode(target.code, {
          name: profile.name,
          skinId: profile.selectedSkin,
          level: profile.level,
        });
      } else {
        handleJoinGlobalRoom();
      }
    } catch {
      handleJoinGlobalRoom();
    }
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
        : 'Real players only — zero AI bots! Drop into Strike Island with friends or global server players for pure Battle Royale PvP.',
      icon: isBattleRoyaleLocked ? '🔒' : '🌐',
      bg: isBattleRoyaleLocked ? 'from-rose-900/80 to-slate-900/90' : 'from-amber-600/90 to-rose-900/90',
      onlineOnly: true,
      isLocked: isBattleRoyaleLocked,
    },
    {
      id: '1v1',
      name: '1V1 AIM DUEL',
      tag: 'FAST 1V1 • NO-BUILD',
      desc: 'Intense 1-on-1 aim duel! Instant respawns, 600 HP (300 HP + 300 Shield), and selectable bot difficulty or friend duel.',
      icon: '⚔️',
      bg: 'from-indigo-600/70 to-slate-900/90',
    },
    {
      id: '2v2',
      name: '2V2 SQUAD CLASH',
      tag: '2V2 TEAM DUEL',
      desc: 'Team up with a partner or bot and face off against a rival duo in tactical sector combat.',
      icon: '👥',
      bg: 'from-cyan-600/70 to-slate-900/90',
    },
    {
      id: 'free_for_all',
      name: 'FREE FOR ALL',
      tag: 'ALL-OUT MULTIPLAYER FFA',
      desc: 'No teams, no mercy! High-intensity chaotic free-for-all across the battleground.',
      icon: '💥',
      bg: 'from-rose-600/70 to-slate-900/90',
    },
    {
      id: 'practice',
      name: 'PRACTICE SANDBOX',
      tag: 'INFINITE MATERIALS',
      desc: 'Practice movement, building 90s, edits, weapon recoil, and target aiming with zero storm pressure.',
      icon: '🛠️',
      bg: 'from-emerald-600/70 to-slate-900/90',
    },
    {
      id: 'first_person_royale',
      name: 'AI KNOCKOUT',
      tag: '25-BOT BATTLEGROUND',
      desc: 'First-person realistic sights, weapon recoil, 25-bot drop & tactical urban combat.',
      icon: '🎯',
      bg: 'from-blue-600/70 to-slate-900/90',
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
      id: 'strike_island',
      name: 'Strike Island (Mega)',
      tag: '⭐ 10 POIs • 840M ISLAND',
      desc: 'Massive 840m island featuring Strike City, Dusty Desert, Pinewood Forest, Military Base, Coastal Village, Snowfall Mountain, Industrial Zone, Lost Temple, Racing Circuit & Underground Bunker.',
      icon: '🏝️',
      bg: 'from-cyan-600/60 via-blue-600/40 to-slate-900/95',
    },
    {
      id: 'pinecrest_suburb',
      name: 'Pinecrest Suburb',
      tag: 'TOWN THEME',
      desc: 'Residential loop, sidewalk curbs, 3 enterable 2-story homes with walkout sniper balconies & town plaza fountain.',
      icon: '🏡',
      bg: 'from-amber-600/50 to-slate-900/90',
    },
    {
      id: 'apex_metropolis',
      name: 'Apex Metropolis',
      tag: 'CITY THEME',
      desc: 'Concrete avenue grid, towering skyline, enterable corporate tower with mezzanine skybridge & rooftop helipad.',
      icon: '🏙️',
      bg: 'from-indigo-600/50 to-slate-900/90',
    },
    {
      id: 'harvest_ridge',
      name: 'Harvest Ridge',
      tag: 'COUNTRY THEME',
      desc: 'Rolling grassy hills, dried creek ravine, 2-story timber Dutch Barn with hayloft, country farmhouse & grain silo.',
      icon: '🌾',
      bg: 'from-emerald-600/50 to-slate-900/90',
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
    <div
      className="relative w-full h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), clamp(8px, 1.8dvh, 20px))',
        paddingBottom: 'max(env(safe-area-inset-bottom), clamp(8px, 1.8dvh, 20px))',
        paddingLeft: 'max(env(safe-area-inset-left), clamp(10px, 2.5dvw, 24px))',
        paddingRight: 'max(env(safe-area-inset-right), clamp(10px, 2.5dvw, 24px))',
      }}
    >
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
          {/* Apple Liquid Glass P2P Room Pill */}
          <div className="apple-liquid-glass flex items-center gap-2 px-3.5 py-1.5 shadow-lg">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-blue-300 font-bold">ROOM:</span>
              <span className="font-mono font-black text-sm text-amber-300 tracking-wider">
                {p2pCode || party.code || 'READY'}
              </span>
            </div>
            <button
              onClick={handleHostP2P}
              title="Host 5-Character P2P Room"
              className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-black transition-all ml-1 cursor-pointer"
            >
              HOST
            </button>
            <button
              onClick={handleCopyCode}
              title="Copy Code"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* S-Tokens Vault */}
          <div
            onClick={onOpenShop}
            title="Click to Open S-Token Shop & Armory"
            className="apple-liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer hover:scale-102 transition-all shadow-md"
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
          <div className="apple-liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 shadow-md">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-black text-xs sm:text-sm text-white">LVL {profile.level}</span>
          </div>

          {/* S-Token Shop & Armory Button */}
          <button
            onClick={onOpenShop}
            className="apple-liquid-glass flex items-center gap-2 px-4 py-1.5 hover:scale-102 text-amber-300 font-display font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
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
      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 items-center gap-6 py-3 pb-36 overflow-y-auto lg:overflow-visible">
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
                  className={`cursor-pointer p-3.5 rounded-2xl apple-liquid-glass transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? mode.isLocked
                        ? 'border-rose-500 bg-rose-950/40 ring-2 ring-rose-500/70 shadow-lg scale-[1.01]'
                        : 'border-cyan-400/80 bg-blue-950/40 ring-2 ring-cyan-400/70 shadow-lg shadow-cyan-950/50 scale-[1.01]'
                      : 'hover:border-white/30 hover:scale-[1.005]'
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
                            : 'bg-blue-950/80 text-cyan-300 border border-cyan-500/40'
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
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {battlegroundMaps.find((m) =>
                    m.id === selectedMap ||
                    (m.id === 'pinecrest_suburb' && (selectedMap === 'suburban_valley' || selectedMap === 'pleasant_valley' || selectedMap === 'island_2v2')) ||
                    (m.id === 'apex_metropolis' && (selectedMap === 'financial_district' || selectedMap === 'tilted_skyscrapers')) ||
                    (m.id === 'harvest_ridge' && selectedMap === 'neocity_heights')
                  )?.tag || 'TOWN THEME'}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {battlegroundMaps.map((map) => {
                  const isCurMap =
                    selectedMap === map.id ||
                    (map.id === 'pinecrest_suburb' && (selectedMap === 'suburban_valley' || selectedMap === 'pleasant_valley' || selectedMap === 'island_2v2' || !selectedMap)) ||
                    (map.id === 'apex_metropolis' && (selectedMap === 'financial_district' || selectedMap === 'tilted_skyscrapers')) ||
                    (map.id === 'harvest_ridge' && selectedMap === 'neocity_heights');
                  return (
                    <button
                      key={map.id}
                      type="button"
                      onClick={() => {
                        onSelectMap?.(map.id);
                        fortniteAudio.playUiClick();
                      }}
                      className={`p-3 rounded-2xl apple-liquid-glass text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isCurMap
                          ? `bg-gradient-to-r ${map.bg} border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg scale-[1.02]`
                          : 'hover:border-white/30 hover:scale-[1.01] opacity-85 hover:opacity-100'
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
            <div className="relative z-10 mt-3 px-5 py-2 apple-liquid-glass flex flex-col items-center shadow-lg border border-white/20">
              <span className="font-display font-black text-base text-white tracking-wide">{currentSkin.name}</span>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
                {currentSkin.rarity} OUTFIT
              </span>
            </div>
          </div>
        </div>

        {/* Right: Online Party / Squad Hub */}
        <div className="flex flex-col gap-3">
          {/* Party Hub Panel */}
          <div className="apple-liquid-glass p-4.5 flex flex-col gap-3 shadow-2xl transition-all">
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

            {/* Apple Tinted Liquid Glass Zero-Install P2P Pod */}
            <div className="apple-liquid-glass p-3.5 flex flex-col gap-2.5 shadow-xl border border-blue-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  <span className="font-display font-black text-xs text-white tracking-wider">
                    PEER-TO-PEER MULTIPLAYER
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  {p2pConnected ? 'P2P SYNCED' : 'PEERJS READY'}
                </span>
              </div>

              {/* Host Match (generates 5-char code) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHostP2P}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 active:scale-95 transition-all cursor-pointer border border-blue-400/40"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>HOST MATCH</span>
                </button>
                {p2pCode && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-400/50 font-mono font-black text-sm text-cyan-300 tracking-widest shadow-inner select-all">
                    {p2pCode}
                  </div>
                )}
              </div>

              {/* Join Match with 5-char code input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={5}
                  placeholder="5-CHAR CODE..."
                  value={p2pInput}
                  onChange={(e) => setP2pInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs font-mono font-bold text-cyan-300 placeholder:text-slate-500 uppercase focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleJoinP2P}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  JOIN MATCH
                </button>
              </div>

              {p2pStatus && (
                <div className="text-[10px] font-mono text-cyan-200/90 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-500/20 truncate">
                  ⚡ {p2pStatus}
                </div>
              )}
            </div>

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

            {/* 6 Core Matchmaking Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleJoinGlobalRoom}
                className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  party.code === 'ROYALE-GLOBAL'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-lg'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                }`}
                title="Play Online: Join the public global server with players worldwide"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>PLAY ONLINE</span>
              </button>

              <button
                type="button"
                onClick={handleQuickMatch}
                className="py-2 px-2 rounded-xl bg-gradient-to-r from-purple-700/80 to-indigo-700/80 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-purple-400/30 shadow-md transition-all cursor-pointer"
                title="Quick Match: Automatically match with active players"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>QUICK MATCH</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Play with Friends: Copy direct room invite link"
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{copiedLink ? 'LINK COPIED!' : 'PLAY W/ FRIENDS'}</span>
              </button>

              <button
                type="button"
                onClick={handleFindRandomPlayers}
                className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Find Random Players: Scan and connect to public rooms"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>FIND RANDOM</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateNewCode}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-[11px] font-bold text-slate-300 border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Create Private Room: Generate new room code"
              >
                <RotateCw className="w-3 h-3 text-cyan-400" />
                <span>CREATE PRIVATE ROOM</span>
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

      {/* 1. BRING BUTTON TO ABSOLUTE FRONT (Z-Index 99999, Fixed Centering in Lower-Third) */}
      <div
        className="fixed z-[99999] pointer-events-auto flex flex-col items-center gap-2"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(clamp(24px, 8dvh, 60px) + env(safe-area-inset-bottom))',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          pointerEvents: 'auto',
        }}
      >
        {/* Battle Royale Locked Notice if applicable */}
        {selectedMode === 'battle_royale' && isBattleRoyaleLocked && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500/80 text-rose-100 text-xs font-bold shadow-2xl backdrop-blur-xl animate-pulse">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Connect to Global Server or Squad to Drop</span>
            <button
              type="button"
              onClick={handleJoinGlobalRoom}
              className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black cursor-pointer shadow-md transition-all active:scale-95"
            >
              JOIN GLOBAL
            </button>
          </div>
        )}

        {/* PROMINENT FORTNITE READY UP / PLAY BUTTON */}
        <button
          onClick={handlePlayClick}
          disabled={isReady || isBattleRoyaleLocked}
          style={{
            minWidth: 'clamp(200px, 30vw, 340px)',
            height: 'clamp(52px, 7dvh, 68px)',
            pointerEvents: 'auto',
          }}
          className={`relative group px-8 rounded-[clamp(16px,2.2vw,24px)] font-display font-black text-lg sm:text-xl tracking-wider transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden select-none cursor-pointer ${
            isBattleRoyaleLocked
              ? 'bg-slate-800/90 border-2 border-rose-600/60 text-rose-300/80 cursor-not-allowed shadow-none'
              : 'bg-[#ffe600] text-black hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(255,230,0,0.65),0_0_24px_rgba(255,230,0,0.45)] border border-white/60 ring-2 ring-yellow-300/50'
          }`}
        >
          {/* Top Liquid Specular Shine */}
          {!isBattleRoyaleLocked && (
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 via-white/20 to-transparent pointer-events-none rounded-t-[clamp(16px,2.2vw,24px)]" />
          )}

          {isBattleRoyaleLocked ? (
            <>
              <Lock className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm sm:text-base font-black">LOCKED • SQUAD REQUIRED</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-black font-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                {isReady
                  ? 'LAUNCHING MATCH...'
                  : selectedMode === 'battle_royale' && isGlobalServer
                  ? 'DROP GLOBAL SERVER'
                  : selectedMode === 'battle_royale' && party.members.length > 1
                  ? `DROP TOGETHER (${party.members.length})`
                  : selectedMode === 'battle_royale'
                  ? 'DROP BATTLE ROYALE'
                  : party.members.length > 1
                  ? `READY SQUAD (${party.members.length})`
                  : 'READY UP (PLAY)'}
              </span>
            </>
          )}
        </button>

        {/* Minimal Controls Hint docked cleanly under the button */}
        <div className="pointer-events-none text-[10px] sm:text-[11px] text-slate-300/90 bg-slate-950/80 px-3.5 py-0.5 rounded-full backdrop-blur-md border border-white/15 shadow-lg whitespace-nowrap">
          🖱️ <strong className="text-blue-400 font-mono">[W,A,S,D]</strong> Move •{' '}
          <strong className="text-cyan-400 font-mono">[X]</strong> Boost •{' '}
          <strong className="text-purple-400 font-mono">[Z]</strong> Slam •{' '}
          <strong className="text-amber-400 font-mono">[Q,F,R,T]</strong> Build •{' '}
          <strong className="text-blue-400 font-mono">[V]</strong> View
        </div>
      </div>
    </div>
  );
};
