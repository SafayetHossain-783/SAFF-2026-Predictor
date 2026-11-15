import React from 'react';

interface FlagProps {
  className?: string;
}

/**
 * Pixel-perfect SVG Flags for South Asian nations.
 * Rendered in rounded rectangles according to SAFF 2026 spec.
 */

export const BangladeshFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <rect width="100" height="60" fill="#006A4E" />
    <circle cx="45" cy="30" r="20" fill="#F42A41" />
  </svg>
);

export const IndiaFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <rect width="100" height="20" fill="#FF9933" />
    <rect y="20" width="100" height="20" fill="#FFFFFF" />
    <rect y="40" width="100" height="20" fill="#138808" />
    <circle cx="50" cy="30" r="8" fill="none" stroke="#000080" strokeWidth="1.2" />
    <circle cx="50" cy="30" r="1.8" fill="#000080" />
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 360) / 24;
      const rad = (angle * Math.PI) / 180;
      const x2 = 50 + 8 * Math.cos(rad);
      const y2 = 30 + 8 * Math.sin(rad);
      return <line key={i} x1="50" y1="30" x2={x2} y2={y2} stroke="#000080" strokeWidth="0.7" />;
    })}
  </svg>
);

export const PakistanFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <rect width="100" height="60" fill="#01411C" />
    <rect width="25" height="60" fill="#FFFFFF" />
    <circle cx="62" cy="30" r="16" fill="#FFFFFF" />
    <circle cx="67" cy="26" r="14.5" fill="#01411C" />
    <polygon
      points="69,21 71,26 76,26 72,29 74,34 69,31 65,34 67,29 63,26 68,26"
      fill="#FFFFFF"
      transform="rotate(25 69 27)"
    />
  </svg>
);

export const MaldivesFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <rect width="100" height="60" fill="#D21034" />
    <rect x="18" y="12" width="64" height="36" fill="#007E3A" rx="2" />
    <circle cx="53" cy="30" r="11" fill="#FFFFFF" />
    <circle cx="57" cy="30" r="10" fill="#007E3A" />
  </svg>
);

export const SriLankaFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <rect width="100" height="60" fill="#FFBE29" />
    <rect x="5" y="5" width="10" height="50" fill="#00534E" />
    <rect x="17" y="5" width="10" height="50" fill="#EB7400" />
    <rect x="30" y="5" width="65" height="50" fill="#8D153A" />
    <circle cx="35" cy="10" r="2.5" fill="#FFBE29" />
    <circle cx="90" cy="10" r="2.5" fill="#FFBE29" />
    <circle cx="35" cy="50" r="2.5" fill="#FFBE29" />
    <circle cx="90" cy="50" r="2.5" fill="#FFBE29" />
    <path
      d="M52 26 C55 20, 68 20, 70 25 C72 23, 76 25, 75 30 C78 32, 75 38, 70 37 C67 43, 56 42, 54 36 C50 36, 48 30, 52 26 Z"
      fill="#FFBE29"
    />
    <line x1="72" y1="20" x2="80" y2="15" stroke="#FFBE29" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BhutanFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <polygon points="0,0 100,0 0,60" fill="#FFCC00" />
    <polygon points="100,0 100,60 0,60" fill="#FF4E12" />
    <path
      d="M25 45 C30 38, 40 42, 48 33 C55 25, 62 30, 72 20 C76 17, 80 22, 75 25 C68 32, 58 32, 52 40 C45 48, 32 46, 25 45 Z"
      fill="#FFFFFF"
      stroke="#222"
      strokeWidth="0.5"
    />
    <circle cx="73" cy="18" r="3" fill="#FFFFFF" stroke="#FF4E12" strokeWidth="0.8" />
    <circle cx="30" cy="46" r="2.5" fill="#FFFFFF" stroke="#FFCC00" strokeWidth="0.8" />
  </svg>
);

export const NepalFlag: React.FC<FlagProps> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 100 60" className={`${className} rounded-md overflow-hidden shadow-sm shrink-0`} preserveAspectRatio="none">
    <rect width="100" height="60" fill="#1e293b" />
    <polygon points="15,4 75,28 35,28 85,56 15,56" fill="#DC143C" stroke="#003893" strokeWidth="3" />
    {/* Sun and Moon symbols in white */}
    <circle cx="32" cy="20" r="5" fill="#FFFFFF" />
    <circle cx="36" cy="44" r="6" fill="#FFFFFF" />
  </svg>
);

export const BUILT_IN_FLAGS: { code: string; name: string }[] = [
  { code: 'BAN', name: 'Bangladesh' },
  { code: 'IND', name: 'India' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'SRI', name: 'Sri Lanka' },
  { code: 'BHU', name: 'Bhutan' },
  { code: 'MDV', name: 'Maldives' },
  { code: 'NEP', name: 'Nepal' },
];

interface TeamFlagProps {
  flagCode?: string | null;
  className?: string;
}

export const TeamFlag: React.FC<TeamFlagProps> = ({ flagCode, className = 'w-8 h-5' }) => {
  const code = flagCode?.toUpperCase();
  switch (code) {
    case 'BAN':
      return <BangladeshFlag className={className} />;
    case 'IND':
      return <IndiaFlag className={className} />;
    case 'PAK':
      return <PakistanFlag className={className} />;
    case 'SRI':
      return <SriLankaFlag className={className} />;
    case 'BHU':
      return <BhutanFlag className={className} />;
    case 'MDV':
      return <MaldivesFlag className={className} />;
    case 'NEP':
      return <NepalFlag className={className} />;
    default:
      return (
        <div className={`${className} rounded-md bg-white/20 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white/60`}>
          ?
        </div>
      );
  }
};
