import React from 'react';

interface IconProps {
  className?: string;
}

export const PlusIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const MinusIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const FlameIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4.5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11.5 14.5 16 9.5" />
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
  </svg>
);

export const RotateCcwIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const TableIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
  </svg>
);

export const BracketIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4v5a3 3 0 0 0 3 3h2" />
    <path d="M4 20v-5a3 3 0 0 1 3-3h2" />
    <path d="M15 12h2a3 3 0 0 0 3-3V4" />
    <path d="M15 12h2a3 3 0 0 1 3 3v5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

export const AwardIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const FootballIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 17.77 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
  </svg>
);

/**
 * Official TECNO Mobile Wordmark Badge
 */
export const TecnoWordmark: React.FC<IconProps> = ({ className = 'h-4' }) => (
  <span className={`inline-flex items-center font-black tracking-widest text-[#0066FF] drop-shadow-sm font-sans ${className}`}>
    TECNO
  </span>
);

/**
 * High-definition, Broadcast-Grade TECNO SAFF Championship Bangladesh 2026 Emblem
 */
export const SAFFLogo: React.FC<IconProps> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldBg" x1="40" y1="4" x2="40" y2="76" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#006A4E" />
        <stop offset="50%" stopColor="#004D36" />
        <stop offset="100%" stopColor="#00281B" />
      </linearGradient>
      <linearGradient id="emeraldBlueBorder" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00E676" />
        <stop offset="50%" stopColor="#6EA8FF" />
        <stop offset="100%" stopColor="#00B853" />
      </linearGradient>
      <linearGradient id="tecnoBlue" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="ballGrad" x1="28" y1="20" x2="52" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <radialGradient id="glowInner" cx="40" cy="30" r="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Shield Base */}
    <path
      d="M40 5L10 18V40C10 57.5 22.8 71.5 40 76C57.2 71.5 70 57.5 70 40V18L40 5Z"
      fill="url(#shieldBg)"
      stroke="url(#emeraldBlueBorder)"
      strokeWidth="2.5"
    />

    {/* Radial emerald aura inside shield */}
    <path
      d="M40 7L13 19.5V40C13 55.5 24.5 68.5 40 72.8C55.5 68.5 67 55.5 67 40V19.5L40 7Z"
      fill="url(#glowInner)"
    />

    {/* Emerald Laurel Ribbons */}
    <path
      d="M20 38C20 48 28 58 40 62C52 58 60 48 60 38"
      stroke="url(#emeraldBlueBorder)"
      strokeWidth="1.2"
      strokeDasharray="2 3"
      fill="none"
    />

    {/* Top TECNO Pill Tag */}
    <rect x="25" y="10" width="30" height="7.5" rx="2.5" fill="#011F15" stroke="url(#tecnoBlue)" strokeWidth="0.8" />
    <text
      x="40"
      y="15.5"
      textAnchor="middle"
      fill="#38BDF8"
      fontSize="5"
      fontWeight="900"
      fontFamily="Outfit, sans-serif"
      letterSpacing="1"
    >
      TECNO
    </text>

    {/* Football Icon in Center */}
    <circle cx="40" cy="34" r="11" fill="url(#ballGrad)" stroke="url(#emeraldBlueBorder)" strokeWidth="1.2" />
    <path
      d="M40 23L43.2 29L49.5 29.8L45 34.5L46.2 41L40 37.8L33.8 41L35 34.5L30.5 29.8L36.8 29L40 23Z"
      fill="#004D36"
      stroke="url(#emeraldBlueBorder)"
      strokeWidth="0.6"
    />

    {/* "SAFF 2026" Banner Arc */}
    <rect x="18" y="50" width="44" height="13" rx="3.5" fill="#00281B" stroke="url(#emeraldBlueBorder)" strokeWidth="1" />
    <text
      x="40"
      y="57"
      textAnchor="middle"
      fill="url(#emeraldBlueBorder)"
      fontSize="6.5"
      fontWeight="900"
      fontFamily="Outfit, sans-serif"
      letterSpacing="1"
    >
      SAFF 2026
    </text>
    <text
      x="40"
      y="61.5"
      textAnchor="middle"
      fill="#38BDF8"
      fontSize="4"
      fontWeight="800"
      fontFamily="Outfit, sans-serif"
      letterSpacing="0.8"
    >
      BANGLADESH
    </text>
  </svg>
);
