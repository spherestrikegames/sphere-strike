import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { FORTNITE_SKINS, FortniteSkin } from '../data/fortniteData';
import { PlayerCharacterAvatar } from './PlayerCharacterAvatar';
import { fortniteAudio } from '../utils/audio';
import { Shield, Trophy, Swords, Zap, Settings, User, Sparkles, X, Check } from 'lucide-react';

interface FortniteLockerProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onClose: () => void;
  onOpenShop?: () => void;
}

export const FortniteLocker: React.FC<FortniteLockerProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  onOpenShop,
}) => {
  const [activeTab, setActiveTab] = useState<'locker' | 'profile' | 'settings'>('locker');
  const [selectedSkinId, setSelectedSkinId] = useState<string>(profile.selectedSkin || 'jonesy');
  const [sensitivity, setSensitivity] = useState<number>(profile.settings.sensitivity || 1.0);
  const [fov, setFov] = useState<number>(profile.settings.fov || 75);
  const [firstPersonDefault, setFirstPersonDefault] = useState<boolean>(
    profile.settings.firstPersonDefault ?? true
  );

  const selectedSkin = FORTNITE_SKINS.find((s) => s.id === selectedSkinId) || FORTNITE_SKINS[0];

  const handleEquipSkin = (skin: FortniteSkin) => {
    setSelectedSkinId(skin.id);
    const updated: PlayerProfile = {
      ...profile,
      selectedSkin: skin.id,
    };
    onUpdateProfile(updated);
    fortniteAudio.playUiClick();
  };

  const handleSaveSettings = () => {
    const updated: PlayerProfile = {
      ...profile,
      settings: {
        ...profile.settings,
        sensitivity,
        fov,
        firstPersonDefault,
      },
    };
    onUpdateProfile(updated);
    fortniteAudio.playUiClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900/90 border border-white/20 shadow-2xl flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h2 className="font-display font-black text-xl text-white tracking-wider">
                FORTNITE LOCKER & CAREER
              </h2>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('locker');
                  fortniteAudio.playUiClick();
                }}
                className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'locker'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>OUTFITS</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('profile');
                  fortniteAudio.playUiClick();
                }}
                className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <User className="w-4 h-4" />
                <span>CAREER STATS</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  fortniteAudio.playUiClick();
                }}
                className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>SETTINGS</span>
              </button>
            </div>
          </div>

          {/* S-Tokens & Close button */}
          <div className="flex items-center gap-3">
            {onOpenShop && (
              <button
                onClick={() => {
                  onClose();
                  onOpenShop();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer"
              >
                <span>⚡</span>
                <span>ITEM SHOP</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-sm">
              <span className="text-amber-400">🅢</span>
              <span>{profile.vbucks.toLocaleString()} S-TOKENS</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'locker' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Skins Grid */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FORTNITE_SKINS.map((skin) => {
                  const isUnlocked = (profile.unlockedSkins || ['jonesy']).includes(skin.id);
                  const isEquipped = profile.selectedSkin === skin.id;
                  const isSelected = selectedSkinId === skin.id;

                  return (
                    <div
                      key={skin.id}
                      onClick={() => {
                        setSelectedSkinId(skin.id);
                        if (isUnlocked) {
                          handleEquipSkin(skin);
                        } else {
                          fortniteAudio.playUiClick();
                        }
                      }}
                      className={`cursor-pointer group relative p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-3 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400 shadow-xl'
                          : isUnlocked
                          ? 'border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-white/30'
                          : 'border-white/5 bg-slate-900/40 opacity-75 hover:opacity-100 hover:border-amber-400/40'
                      }`}
                    >
                      {isEquipped ? (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-cyan-500 text-[10px] font-black text-slate-950 flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3" /> EQUIPPED
                        </div>
                      ) : !isUnlocked ? (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow-md">
                          <Zap className="w-3 h-3 text-amber-400" /> LOCKED
                        </div>
                      ) : null}

                      <PlayerCharacterAvatar skinId={skin.id} size="lg" className="w-20 h-20 rounded-2xl group-hover:scale-105 transition-transform" />

                      <div className="flex flex-col items-center">
                        <h4 className="font-display font-black text-sm text-white">{skin.name}</h4>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                          {skin.rarity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skin Showcase Preview Card */}
              <div className="flex flex-col items-center justify-between p-6 rounded-3xl bg-slate-950/60 border border-white/10 text-center">
                <div className="flex flex-col items-center gap-4">
                  <PlayerCharacterAvatar skinId={selectedSkin.id} size="xl" className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse" />
                  <div>
                    <h3 className="font-display font-black text-2xl text-white">{selectedSkin.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">{selectedSkin.description}</p>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                  {(profile.unlockedSkins || ['jonesy']).includes(selectedSkin.id) ? (
                    <button
                      onClick={() => handleEquipSkin(selectedSkin)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 font-display font-black text-slate-950 tracking-wider text-base shadow-lg shadow-cyan-500/30 transition-all active:scale-98 cursor-pointer"
                    >
                      {profile.selectedSkin === selectedSkin.id ? 'EQUIPPED' : 'EQUIP OUTFIT'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShop?.();
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 font-display font-black text-slate-950 tracking-wider text-base shadow-lg shadow-amber-500/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      <span>UNLOCK IN SHOP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
              {/* Level & XP Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center font-display font-black text-2xl text-slate-950 shadow-lg shadow-cyan-500/40">
                    {profile.level}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-white">{profile.name}</h3>
                    <p className="text-xs text-slate-400">Battle Pass Level {profile.level}</p>
                  </div>
                </div>

                <div className="w-full sm:w-72 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold text-slate-300">
                    <span>PROGRESS XP</span>
                    <span>{profile.xp} / {profile.xpToNextLevel}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/60 border border-white/10 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                      style={{ width: `${(profile.xp / profile.xpToNextLevel) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Bento Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-bold text-slate-400">VICTORY ROYALES</span>
                  <span className="font-display font-black text-3xl text-white">{profile.wins}</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col gap-2">
                  <Swords className="w-6 h-6 text-rose-400" />
                  <span className="text-xs font-bold text-slate-400">TOTAL ELIMINATIONS</span>
                  <span className="font-display font-black text-3xl text-white">{profile.kills}</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col gap-2">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-400">MATCHES PLAYED</span>
                  <span className="font-display font-black text-3xl text-white">{profile.matchesPlayed}</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col gap-2">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-400">K/D RATIO</span>
                  <span className="font-display font-black text-3xl text-white">
                    {profile.matchesPlayed > 0 ? (profile.kills / Math.max(1, profile.matchesPlayed - profile.wins)).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 max-w-xl mx-auto bg-slate-950/60 p-6 rounded-3xl border border-white/10">
              <h3 className="font-display font-black text-xl text-white">GAMEPLAY & CONTROLS</h3>

              <div className="flex flex-col gap-4">
                {/* Mouse Sensitivity */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold text-slate-300">
                    <span>Mouse Sensitivity</span>
                    <span className="font-mono text-cyan-400">{sensitivity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Field of View (FOV) */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold text-slate-300">
                    <span>Field of View (FOV)</span>
                    <span className="font-mono text-cyan-400">{fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="105"
                    step="1"
                    value={fov}
                    onChange={(e) => setFov(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Default 1st-person view */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-sm font-bold text-slate-300">Default First-Person (FPS) View</span>
                  <input
                    type="checkbox"
                    checked={firstPersonDefault}
                    onChange={(e) => setFirstPersonDefault(e.target.checked)}
                    className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="mt-4 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 font-display font-black text-slate-950 shadow-lg shadow-cyan-500/30 transition-all"
                >
                  APPLY SETTINGS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
