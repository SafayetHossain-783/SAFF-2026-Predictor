import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SAFF_LOGO_URL } from '../branding';

export const TopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 pointer-events-none transition-all">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between rounded-2xl backdrop-blur-xl bg-[#0b1464]/85 border border-white/15 border-t-white/35 shadow-2xl shadow-blue-950/80 pointer-events-auto">
        {/* Brand Link: Pure Tournament Logo */}
        <Link
          to="/"
          className="flex items-center group select-none shrink-0 transition-transform active:scale-95"
          aria-label="Home"
        >
          {SAFF_LOGO_URL ? (
            <div className="relative flex items-center justify-center">
              <img
                src={SAFF_LOGO_URL}
                alt="SAFF Tournament"
                className="h-[34px] sm:h-[42px] max-h-[36px] sm:max-h-[46px] w-auto max-w-[90px] sm:max-w-[130px] object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, black 70%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 70%, transparent 100%)',
                }}
              />
            </div>
          ) : (
            <div
              className="h-8.5 w-8.5 sm:h-10 sm:w-10 rounded-lg bg-white/10 border border-dashed border-[#00E676]/50 flex items-center justify-center text-[8px] sm:text-[9px] font-heading font-extrabold text-[#00E676] uppercase shrink-0 shadow-sm"
              title="SAFF Logo Slot - Put src in src/branding.ts or TopBar.tsx"
            >
              LOGO
            </div>
          )}
        </Link>

        {/* Navigation items - Segmented Stadium Nav Track */}
        <nav className="flex items-center p-1 rounded-full bg-black/25 backdrop-blur-md border border-white/15 shadow-inner shrink-0">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-2.5 min-[380px]:px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-heading font-extrabold text-[10px] min-[380px]:text-[11px] sm:text-xs tracking-wider uppercase transition-all select-none ${
                isActive
                  ? 'bg-white text-[#0A1270] shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/bracket"
            className={({ isActive }) =>
              `px-2.5 min-[380px]:px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-heading font-extrabold text-[10px] min-[380px]:text-[11px] sm:text-xs tracking-wider uppercase transition-all select-none ${
                isActive
                  ? 'bg-white text-[#0A1270] shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            Bracket
          </NavLink>
          <NavLink
            to="/predictions"
            className={({ isActive }) =>
              `px-2.5 min-[380px]:px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-heading font-extrabold text-[10px] min-[380px]:text-[11px] sm:text-xs tracking-wider uppercase transition-all select-none ${
                isActive
                  ? 'bg-white text-[#0A1270] shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <span className="inline sm:hidden">Matches</span>
            <span className="hidden sm:inline">Match Predictions</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
