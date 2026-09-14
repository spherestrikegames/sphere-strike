import React from 'react';
import { FORTNITE_SKINS } from '../data/fortniteData';

interface PlayerCharacterAvatarProps {
  skinId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const PlayerCharacterAvatar: React.FC<PlayerCharacterAvatarProps> = ({
  skinId = 'jonesy',
  size = 'md',
  className = '',
  showGlow = true,
}) => {
  const skin = FORTNITE_SKINS.find((s) => s.id === skinId) || FORTNITE_SKINS[0];

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-10 h-10 rounded-xl text-lg',
    lg: 'w-14 h-14 rounded-2xl text-2xl',
    xl: 'w-24 h-24 rounded-3xl text-5xl',
  }[size];

  // If the skin is jonesy (the default recruit soldier), render the detailed vector portrait of the 3D in-game model
  if (skin.id === 'jonesy') {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-cyan-400/50 bg-gradient-to-b from-slate-800 to-slate-950 shadow-md ${sizeClasses} ${
          showGlow ? 'shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''
        } ${className}`}
        title={`${skin.name} (In-Game Outfit)`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
          <defs>
            <radialGradient id={`pbg-${size}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id={`phair-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id={`pskin-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#f7c297" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#pbg-${size})`} />
          <circle cx="50" cy="50" r="38" fill="#06b6d4" fillOpacity="0.15" />

          {/* Shoulders & Tactical Vest */}
          <path d="M15 88 L25 65 L40 60 L60 60 L75 65 L85 88 Z" fill="#475569" />
          <path d="M28 64 L50 67 L72 64 L74 88 L26 88 Z" fill="#1e293b" />
          <rect x="22" y="60" width="7" height="12" rx="1.5" fill="#0f172a" />
          <line x1="24" y1="60" x2="23" y2="48" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="23" cy="47" r="1.5" fill="#ef4444" />

          {/* Neck */}
          <rect x="44" y="52" width="12" height="10" rx="1" fill="#e2a87c" />

          {/* Head */}
          <rect x="35" y="26" width="30" height="30" rx="5" fill={`url(#pskin-${size})`} />
          <rect x="31" y="34" width="4" height="8" rx="1.5" fill="#e2a87c" />
          <rect x="65" y="34" width="4" height="8" rx="1.5" fill="#e2a87c" />

          {/* Face */}
          <path d="M40 35 L47 36" stroke="#854d0e" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="41" y="38" width="6" height="4" rx="1" fill="#ffffff" />
          <rect x="43" y="39" width="3" height="3" fill="#0f172a" />

          <path d="M60 35 L53 36" stroke="#854d0e" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="53" y="38" width="6" height="4" rx="1" fill="#ffffff" />
          <rect x="54" y="39" width="3" height="3" fill="#0f172a" />

          <path d="M46 48 Q50 49 54 48" stroke="#9a3412" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Hair */}
          <path d="M33 29 Q35 19 50 19 Q65 19 67 29 L67 33 Q61 25 50 26 Q39 25 33 33 Z" fill={`url(#phair-${size})`} />
          <path d="M40 25 Q46 30 54 27" fill="#ca8a04" />
        </svg>
      </div>
    );
  }

  // Other skin variants (Peely, Midas, Drift, etc.) styled with authentic skin colors and emoji icon
  return (
    <div
      className={`relative flex items-center justify-center border border-cyan-400/40 shadow-md ${sizeClasses} ${
        showGlow ? 'shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''
      } ${className}`}
      style={{
        background: `linear-gradient(135deg, ${skin.shirtColor}dd, #020617)`,
        borderColor: skin.glowColor || '#38bdf8',
      }}
      title={`${skin.name} (In-Game Outfit)`}
    >
      <span className="drop-shadow-md select-none">{skin.icon}</span>
    </div>
  );
};
