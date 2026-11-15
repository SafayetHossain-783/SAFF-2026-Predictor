import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServerTime } from '../api/client';
import { SAFF_LOGO_URL } from '../branding';
import { CalendarIcon, MapPinIcon } from '../components/Icons';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLocked: boolean;
}

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [lockTarget, setLockTarget] = useState<Date>(new Date('2026-11-05T15:30:00+06:00'));
  const [serverBaseTime, setServerBaseTime] = useState<number | null>(null);
  const [clientFetchTime, setClientFetchTime] = useState<number>(Date.now());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 4,
    hours: 3,
    minutes: 30,
    seconds: 0,
    isLocked: false,
  });

  useEffect(() => {
    // Fetch server lock time and simulated/real server clock
    getServerTime()
      .then((data) => {
        setLockTarget(new Date(data.bracketLockTime));
        if (data.now) {
          setServerBaseTime(new Date(data.now).getTime());
          setClientFetchTime(Date.now());
        }
        setIsDemoMode(Boolean(data.demoMode ?? true));
      })
      .catch(() => {
        // Fallback default: Simulated 01 Nov 2026
        setLockTarget(new Date('2026-11-05T15:30:00+06:00'));
        setServerBaseTime(new Date('2026-11-01T12:00:00+06:00').getTime());
        setClientFetchTime(Date.now());
        setIsDemoMode(true);
      });
  }, []);

  useEffect(() => {
    const calculateTime = () => {
      const currentEffectiveTime =
        serverBaseTime !== null
          ? serverBaseTime + (Date.now() - clientFetchTime)
          : Date.now();

      const diff = lockTarget.getTime() - currentEffectiveTime;
      if (diff <= 0 && !isDemoMode) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLocked: true });
        return;
      }

      // If in demo mode and diff <= 0, maintain positive pre-tournament state
      const effectiveDiff =
        diff > 0
          ? diff
          : 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000;

      const days = Math.floor(effectiveDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((effectiveDiff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((effectiveDiff / 1000 / 60) % 60);
      const seconds = Math.floor((effectiveDiff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isLocked: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [lockTarget, serverBaseTime, clientFetchTime, isDemoMode]);

  return (
    <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-6xl mx-auto w-full">
      {/* 2-Column Hero Showcase (Max-w-6xl Baseline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left Column (Brand, Title, CTAs) */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-5">
          {/* Tournament Logo Hero Slot */}
          <div className="flex justify-center lg:justify-start">
            {SAFF_LOGO_URL ? (
              <div className="relative flex justify-center items-center">
                <div className="absolute w-48 sm:w-64 h-20 sm:h-28 bg-radial from-[#6EA8FF]/20 via-[#00E676]/10 to-transparent rounded-full blur-2xl pointer-events-none -z-0" />
                <img
                  src={SAFF_LOGO_URL}
                  alt="SAFF Championship 2026"
                  className="relative z-10 h-20 sm:h-28 md:h-32 w-auto max-w-[240px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
                  style={{
                    maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)',
                  }}
                />
              </div>
            ) : (
              <div
                className="h-16 sm:h-20 w-40 sm:w-48 rounded-2xl bg-white/[0.06] border-2 border-dashed border-[#00E676]/40 flex flex-col items-center justify-center gap-1 text-[#00E676] shadow-inner backdrop-blur-md px-3 select-none"
                title="SAFF Logo Slot - Put src in src/branding.ts or WelcomePage.tsx"
              >
                <span className="font-heading font-black text-xs sm:text-sm tracking-wider uppercase">
                  Tournament Logo
                </span>
                <span className="text-[10px] text-white/50 tracking-normal font-sans">
                  Set in src/branding.ts
                </span>
              </div>
            )}
          </div>

          {/* Official Tournament Predictor Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-sm select-none">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#00E676] animate-pulse shrink-0 shadow-[0_0_8px_#00E676]" />
            <span className="font-heading font-extrabold text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.22em] text-[#C7D6FF] uppercase">
              Official Tournament Predictor
            </span>
          </div>

          {/* Main 3D Title */}
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold uppercase tracking-tight leading-tight select-none">
            <span className="text-3d-green">SAFF</span>{' '}
            <span className="text-3d-red">Championship</span>
            <br />
            <span className="text-3d-red">Bangladesh</span>{' '}
            <span className="text-3d-green">2026</span>
          </h1>

          {/* Tournament Meta: Dates & Venue */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-white/90 select-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.07] border border-white/10 text-[11px] sm:text-xs font-heading font-extrabold uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5 text-[#00E676]" />
              5 – 17 November 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.07] border border-white/10 text-[11px] sm:text-xs font-heading font-extrabold uppercase tracking-wider">
              <MapPinIcon className="w-3.5 h-3.5 text-[#FF1744]" />
              National Stadium, Dhaka
            </span>
          </div>

          {/* Two Large Action Buttons - Dual-Tone (3D Physical Push-Buttons) */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2 sm:pt-3 max-w-md lg:max-w-none">
            <button
              onClick={() => navigate('/bracket')}
              className="flex-1 min-h-[52px] sm:min-h-[56px] px-6 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_28px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_36px_rgba(0,230,118,0.55)] flex items-center justify-center gap-2 group select-none cursor-pointer"
              style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              <span>Predict Bracket</span>
              <span className="text-base sm:text-lg group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              onClick={() => navigate('/predictions')}
              className="flex-1 min-h-[52px] sm:min-h-[56px] px-6 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#FF1744] border-b-4 border-[#9c001b] hover:bg-[#E5103A] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_28px_rgba(255,23,68,0.38)] hover:shadow-[0_12px_36px_rgba(255,23,68,0.55)] flex items-center justify-center gap-2 group select-none cursor-pointer"
              style={{ textShadow: '0 1px 0 #8a0018, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              <span>Match Predictions</span>
              <span className="text-base sm:text-lg group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Right Column (Countdown Clock & Quick Tournament Facts) */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          {/* Countdown Clock - 3D Stadium Glassmorphism Card */}
          <div className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 select-none">
            <div className="font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.24em] text-[#C7D6FF] uppercase text-center mb-3 sm:mb-4">
              Bracket Predictions Locks In
            </div>

            {timeLeft.isLocked ? (
              <div className="p-4 rounded-xl bg-[#FF1744]/20 border border-[#FF1744]/40 text-center">
                <span className="font-heading font-extrabold text-sm sm:text-base text-white tracking-wider uppercase">
                  Predictions are now locked
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 text-center border border-white/15 shadow-inner">
                  <div className="font-heading text-2xl sm:text-3xl font-extrabold leading-none text-3d-green">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="font-heading font-bold text-[8px] sm:text-[9px] text-white/60 uppercase tracking-[0.16em] mt-1.5">
                    Days
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 text-center border border-white/15 shadow-inner">
                  <div className="font-heading text-2xl sm:text-3xl font-extrabold leading-none text-3d-green">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="font-heading font-bold text-[8px] sm:text-[9px] text-white/60 uppercase tracking-[0.16em] mt-1.5">
                    Hours
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 text-center border border-white/15 shadow-inner">
                  <div className="font-heading text-2xl sm:text-3xl font-extrabold leading-none text-3d-green">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="font-heading font-bold text-[8px] sm:text-[9px] text-white/60 uppercase tracking-[0.16em] mt-1.5">
                    Mins
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 text-center border border-white/15 shadow-inner">
                  <div className="font-heading text-2xl sm:text-3xl font-extrabold leading-none text-3d-green">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="font-heading font-bold text-[8px] sm:text-[9px] text-white/60 uppercase tracking-[0.16em] mt-1.5">
                    Secs
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tournament Overview Card (Only Text) */}
          <div className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent backdrop-blur-md border border-white/15 shadow-lg">
            <div className="space-y-3 text-xs sm:text-[13px] text-white/90 leading-relaxed font-sans">
              <p>
                The 2026 SAFF Championship (also known as the TECNO SAFF Championship 2026 due to sponsorship reasons with Tecno Mobile) is the 15th edition of the SAFF Championship, the biennial international men's football championship of South Asia organized by the South Asian Football Federation (SAFF).
              </p>
              <p>
                India are the defending champions, having defeated guest team Kuwait in the final of previous edition.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feature Grid (Full max-w-6xl Width - Zero Awkward Whitespace) */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Feature 1 */}
        <div
          onClick={() => navigate('/bracket')}
          className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/15 hover:border-[#00E676]/50 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
        >
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-white uppercase tracking-wide mb-1">
            Knockout Bracket
          </h3>
          <p className="text-xs text-[#C7D6FF]/80 leading-relaxed">
            Pick top 2 teams from Group A & B, predict the Semi-Finals, and crown the 2026 Champion.
          </p>
        </div>

        {/* Feature 2 */}
        <div
          onClick={() => navigate('/predictions')}
          className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/15 hover:border-[#FF1744]/50 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
        >
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-white uppercase tracking-wide mb-1">
            Match Predictions
          </h3>
          <p className="text-xs text-[#C7D6FF]/80 leading-relaxed">
            Predict exact scores match-by-match. Automatic penalty shootouts for drawn knockouts.
          </p>
        </div>

        {/* Feature 3 */}
        <div
          onClick={() => navigate('/card')}
          className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/15 hover:border-[#6EA8FF]/50 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
        >
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-white uppercase tracking-wide mb-1">
            Shareable Cards
          </h3>
          <p className="text-xs text-[#C7D6FF]/80 leading-relaxed">
            Generate and export personalized 1920×1080 Ultra HD broadcast graphics with your name.
          </p>
        </div>
      </div>
    </div>
  );
};
