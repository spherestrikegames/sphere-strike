import React, { useState } from 'react';
import { GameSettings } from '../types';
import { fortniteAudio } from '../utils/audio';
import {
  Settings,
  Mouse,
  Volume2,
  Monitor,
  Keyboard,
  RotateCcw,
  X,
  Check,
  Zap,
  Eye,
  Sliders,
  Shield,
  Sparkles,
  Flame,
  VolumeX,
} from 'lucide-react';

export const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 1.0,
  adsSensitivity: 0.75,
  invertY: false,
  fov: 75,
  volume: 0.85,
  sfxVolume: 0.9,
  musicVolume: 0.5,
  hitSoundVolume: 1.0,
  graphicsQuality: 'medium',
  shadows: false, // Default to false for lag-free silky smooth gameplay on all devices!
  resolutionScale: 1.0,
  viewDistance: 'medium',
  showFps: true,
  firstPersonDefault: true,
  toggleSprint: false,
  reticleColor: '#ffffff',
};

interface FortniteSettingsProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (newSettings: GameSettings) => void;
}

export const FortniteSettings: React.FC<FortniteSettingsProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'audio' | 'graphics' | 'keybinds'>('controls');
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS, ...settings });
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setCurrentSettings((prev) => {
      const next = { ...prev, [key]: value };
      onSaveSettings(next); // Real-time preview update
      return next;
    });
    setHasChanges(true);
  };

  const applyPreset = (preset: 'low' | 'medium' | 'high') => {
    fortniteAudio.playUiClick();
    if (preset === 'low') {
      const updated: GameSettings = {
        ...currentSettings,
        graphicsQuality: 'low',
        shadows: false,
        resolutionScale: 0.85,
        viewDistance: 'near',
      };
      setCurrentSettings(updated);
      onSaveSettings(updated);
    } else if (preset === 'medium') {
      const updated: GameSettings = {
        ...currentSettings,
        graphicsQuality: 'medium',
        shadows: false,
        resolutionScale: 1.0,
        viewDistance: 'medium',
      };
      setCurrentSettings(updated);
      onSaveSettings(updated);
    } else {
      const updated: GameSettings = {
        ...currentSettings,
        graphicsQuality: 'high',
        shadows: true,
        resolutionScale: 1.25,
        viewDistance: 'far',
      };
      setCurrentSettings(updated);
      onSaveSettings(updated);
    }
  };

  const handleResetDefaults = () => {
    fortniteAudio.playUiClick();
    setCurrentSettings(DEFAULT_SETTINGS);
    onSaveSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
  };

  const handleClose = () => {
    fortniteAudio.playUiClick();
    onClose();
  };

  const reticleColors = [
    { name: 'Classic White', hex: '#ffffff' },
    { name: 'Neon Green', hex: '#22c55e' },
    { name: 'Cyber Cyan', hex: '#06b6d4' },
    { name: 'Golden Yellow', hex: '#eab308' },
    { name: 'Vivid Coral', hex: '#ef4444' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-display">
                GAME SETTINGS & CONTROLS
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Customize mouse sensitivity, sound volumes, performance, and keybinds
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all active:scale-95 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-start gap-2 px-6 py-3 border-b border-white/10 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('controls');
              fortniteAudio.playUiClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === 'controls'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mouse className="w-4 h-4" />
            <span>Controls & Mouse</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audio');
              fortniteAudio.playUiClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === 'audio'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio & Volume</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('graphics');
              fortniteAudio.playUiClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === 'graphics'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Lag Reduction & Graphics</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('keybinds');
              fortniteAudio.playUiClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === 'keybinds'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)] font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Keybinds Guide</span>
          </button>
        </div>

        {/* Settings Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white text-sm">
          {/* TAB 1: CONTROLS & MOUSE */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Mouse Look Sensitivity */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">General Mouse Look Sensitivity</span>
                    <span className="text-xs text-slate-400">Controls mouse aim and camera rotation speed</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {currentSettings.sensitivity.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={currentSettings.sensitivity}
                  onChange={(e) => updateSetting('sensitivity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.10x (Slow / Precision)</span>
                  <span>1.00x (Standard)</span>
                  <span>3.00x (High Velocity)</span>
                </div>
              </div>

              {/* ADS / Scope Sensitivity Multiplier */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">Aim Down Sights (ADS) Sensitivity</span>
                    <span className="text-xs text-slate-400">Sensitivity multiplier when aiming down sights or zooming</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {currentSettings.adsSensitivity.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={currentSettings.adsSensitivity}
                  onChange={(e) => updateSetting('adsSensitivity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.20x (Sniper Steady)</span>
                  <span>0.75x (Recommended)</span>
                  <span>2.00x (Fast Tracking)</span>
                </div>
              </div>

              {/* Invert Pitch & Toggle Sprint Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Invert Vertical Look (Y-Axis)</span>
                    <span className="text-xs text-slate-400">Flight-simulator inverted pitch</span>
                  </div>
                  <button
                    onClick={() => {
                      updateSetting('invertY', !currentSettings.invertY);
                      fortniteAudio.playUiClick();
                    }}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${
                      currentSettings.invertY ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform ${
                        currentSettings.invertY ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Toggle Sprint</span>
                    <span className="text-xs text-slate-400">Press Shift once instead of holding</span>
                  </div>
                  <button
                    onClick={() => {
                      updateSetting('toggleSprint', !currentSettings.toggleSprint);
                      fortniteAudio.playUiClick();
                    }}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${
                      currentSettings.toggleSprint ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform ${
                        currentSettings.toggleSprint ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Reticle Color Theme */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <span className="font-bold text-base text-white">Crosshair Reticle Color</span>
                <div className="flex items-center gap-3 flex-wrap">
                  {reticleColors.map((rc) => (
                    <button
                      key={rc.hex}
                      onClick={() => {
                        updateSetting('reticleColor', rc.hex);
                        fortniteAudio.playUiClick();
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                        currentSettings.reticleColor === rc.hex
                          ? 'border-cyan-400 bg-cyan-950/80 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: rc.hex }}
                      />
                      <span>{rc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO & VOLUME */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Master Volume */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-base text-white">Master Audio Volume</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {Math.round(currentSettings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={currentSettings.volume}
                  onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Sound Effects (SFX) Volume */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">Sound Effects (SFX)</span>
                    <span className="text-xs text-slate-400">Guns, footsteps, vehicles, building & reload audio</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {Math.round(currentSettings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={currentSettings.sfxVolume}
                  onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Music Volume */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">Music Volume</span>
                    <span className="text-xs text-slate-400">Lobby background synth and victory royale theme</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {Math.round(currentSettings.musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={currentSettings.musicVolume}
                  onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Hitmarker & Elimination Audio */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">Hitmarker & Elimination Volume</span>
                    <span className="text-xs text-slate-400">Headshot chime, shield crack, and kill confirmation sounds</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {Math.round(currentSettings.hitSoundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={currentSettings.hitSoundVolume}
                  onChange={(e) => updateSetting('hitSoundVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: LAG REDUCTION & GRAPHICS */}
          {activeTab === 'graphics' && (
            <div className="space-y-6">
              {/* Performance Quick Presets */}
              <div className="bg-gradient-to-r from-cyan-950/80 to-blue-950/80 p-5 rounded-2xl border border-cyan-500/40 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Zap className="w-5 h-5 animate-pulse" />
                  <span className="font-bold text-base text-white">Lag Reduction & Performance Presets</span>
                </div>
                <p className="text-xs text-slate-300">
                  Select a performance preset tailored to your device hardware for maximum buttery-smooth FPS:
                </p>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <button
                    onClick={() => applyPreset('low')}
                    className={`px-4 py-3 rounded-2xl border text-xs font-black uppercase transition-all flex flex-col items-center gap-1 ${
                      currentSettings.graphicsQuality === 'low'
                        ? 'bg-emerald-500 text-slate-950 border-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>⚡ MAX FPS</span>
                    <span className="text-[10px] font-normal opacity-80">Lowest Lag</span>
                  </button>

                  <button
                    onClick={() => applyPreset('medium')}
                    className={`px-4 py-3 rounded-2xl border text-xs font-black uppercase transition-all flex flex-col items-center gap-1 ${
                      currentSettings.graphicsQuality === 'medium'
                        ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>⚖️ BALANCED</span>
                    <span className="text-[10px] font-normal opacity-80">Smooth & Clean</span>
                  </button>

                  <button
                    onClick={() => applyPreset('high')}
                    className={`px-4 py-3 rounded-2xl border text-xs font-black uppercase transition-all flex flex-col items-center gap-1 ${
                      currentSettings.graphicsQuality === 'high'
                        ? 'bg-amber-500 text-slate-950 border-white shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>✨ EPIC</span>
                    <span className="text-[10px] font-normal opacity-80">Full Visuals</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Shadows Toggle (Major Performance Lever) */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">Dynamic 3D Shadows</span>
                    {!currentSettings.shadows && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                        FPS BOOST (+30-50%)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    Disabling shadows significantly reduces GPU workload and eliminates stuttering on laptops.
                  </span>
                </div>
                <button
                  onClick={() => {
                    updateSetting('shadows', !currentSettings.shadows);
                    fortniteAudio.playUiClick();
                  }}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    currentSettings.shadows ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      currentSettings.shadows ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Resolution Scale */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">Resolution & Pixel Scale</span>
                    <span className="text-xs text-slate-400">Lowering scale helps slower GPUs run at 60 FPS</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-lg bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {Math.round(currentSettings.resolutionScale * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '75% (Fast)', val: 0.75 },
                    { label: '85% (Smooth)', val: 0.85 },
                    { label: '100% (Native)', val: 1.0 },
                    { label: '125% (Crisp)', val: 1.25 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        updateSetting('resolutionScale', item.val);
                        fortniteAudio.playUiClick();
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        currentSettings.resolutionScale === item.val
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Distance & Fog */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">View Distance & Fog</span>
                    <span className="text-xs text-slate-400">Rendering distance for distant terrain and POIs</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-black text-sm uppercase bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
                    {currentSettings.viewDistance}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['near', 'medium', 'far'] as const).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => {
                        updateSetting('viewDistance', dist);
                        fortniteAudio.playUiClick();
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        currentSettings.viewDistance === dist
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {dist === 'near' ? 'Near (Fast)' : dist === 'medium' ? 'Medium' : 'Far (Scenic)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* FOV & Show FPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Field of View (FOV)</span>
                    <span className="font-mono text-cyan-400 font-bold">{currentSettings.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="105"
                    step="1"
                    value={currentSettings.fov}
                    onChange={(e) => updateSetting('fov', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Show FPS Counter</span>
                    <span className="text-xs text-slate-400">Display live framerate HUD</span>
                  </div>
                  <button
                    onClick={() => {
                      updateSetting('showFps', !currentSettings.showFps);
                      fortniteAudio.playUiClick();
                    }}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${
                      currentSettings.showFps ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform ${
                        currentSettings.showFps ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KEYBINDS GUIDE */}
          {activeTab === 'keybinds' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Movement Controls */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2.5">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏃</span> MOVEMENT & AGILITY
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Move Forward / Left / Back / Right</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-cyan-300 font-bold">W A S D</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Jump / Deploy Glider</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-cyan-300 font-bold">SPACE</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Tactical Sprint</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-cyan-300 font-bold">SHIFT</kbd>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Crouch / Tactical Slide</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-cyan-300 font-bold">C / CTRL</kbd>
                    </div>
                  </div>
                </div>

                {/* Combat Controls */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2.5">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎯</span> COMBAT & WEAPONS
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Fire Weapon / Swing Pickaxe</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-amber-300 font-bold">LEFT CLICK</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Aim Down Sights (ADS)</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-amber-300 font-bold">RIGHT CLICK</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Reload Weapon</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-amber-300 font-bold">R</kbd>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Select Weapon Slots</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-amber-300 font-bold">1 - 6</kbd>
                    </div>
                  </div>
                </div>

                {/* Building System */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2.5">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🧱</span> BUILDING STRUCTURES
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Build Wall</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-emerald-300 font-bold">Q</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Build Floor</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-emerald-300 font-bold">F</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Build Ramp</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-emerald-300 font-bold">R</kbd>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Build Roof Cone</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-emerald-300 font-bold">T</kbd>
                    </div>
                  </div>
                </div>

                {/* Vehicles & Interacting */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2.5">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🚗</span> VEHICLES & UTILITY
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Loot Chest / Enter Car</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-purple-300 font-bold">E</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Car Nitro Boost</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-purple-300 font-bold">SHIFT</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Car Handbrake Drift</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-purple-300 font-bold">SPACE</kbd>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Toggle 1st / 3rd Person</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-purple-300 font-bold">V</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950/80">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all border border-white/10 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Done & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
