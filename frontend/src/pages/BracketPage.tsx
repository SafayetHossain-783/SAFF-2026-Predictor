import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, getServerTime } from '../api/client';
import { usePredictorStore } from '../stores/usePredictorStore';
import { TeamFlag } from '../components/Flags';
import type { Team } from '../types';

export const BracketPage: React.FC = () => {
  const navigate = useNavigate();
  const { bracketPicks, setBracketPick } = usePredictorStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // 1: Groups, 2: SF, 3: Final, 4: Review

  // Fetch teams & server time
  useEffect(() => {
    Promise.all([getTeams(), getServerTime()])
      .then(([teamsData, timeData]) => {
        setTeams(teamsData);
        setIsLocked(timeData.bracketLocked);
      })
      .catch((err) => {
        console.error('Failed to load bracket data', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Map of teamId -> Team
  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  // Group teams
  const groupATeams = useMemo(
    () => teams.filter((t) => t.group === 'A' || (t as any).groupLetter === 'A'),
    [teams]
  );
  const groupBTeams = useMemo(
    () => teams.filter((t) => t.group === 'B' || (t as any).groupLetter === 'B'),
    [teams]
  );

  // Check if saved picks contain invalid/removed teams
  const isTeamValid = (id: string | null) => (id ? teamMap.has(id) : false);

  const a1 = isTeamValid(bracketPicks.groupAFirst) ? bracketPicks.groupAFirst : null;
  const a2 = isTeamValid(bracketPicks.groupASecond) ? bracketPicks.groupASecond : null;
  const b1 = isTeamValid(bracketPicks.groupBFirst) ? bracketPicks.groupBFirst : null;
  const b2 = isTeamValid(bracketPicks.groupBSecond) ? bracketPicks.groupBSecond : null;

  // Knockout matchups
  // SF1: B1 vs A2
  const sf1Team1 = b1;
  const sf1Team2 = a2;
  const sf1Winner = isTeamValid(bracketPicks.sf1Winner) ? bracketPicks.sf1Winner : null;

  // SF2: A1 vs B2
  const sf2Team1 = a1;
  const sf2Team2 = b2;
  const sf2Winner = isTeamValid(bracketPicks.sf2Winner) ? bracketPicks.sf2Winner : null;

  // Final: SF1 winner vs SF2 winner
  const finalTeam1 = sf1Winner;
  const finalTeam2 = sf2Winner;
  const champion = isTeamValid(bracketPicks.champion) ? bracketPicks.champion : null;

  // Check completeness
  const step1Complete = Boolean(a1 && a2 && b1 && b2 && a1 !== a2 && b1 !== b2);
  const step2Complete = Boolean(sf1Winner && sf2Winner);
  const step3Complete = Boolean(champion);
  const hasAnyPicks = Boolean(a1 || a2 || b1 || b2 || sf1Winner || sf2Winner || champion);

  const groupPickCount = (a1 ? 1 : 0) + (a2 ? 1 : 0) + (b1 ? 1 : 0) + (b2 ? 1 : 0);
  const sfPickCount = (sf1Winner ? 1 : 0) + (sf2Winner ? 1 : 0);

  // Calculate wizard progress percentage for the bottom progress track
  const progressPct = useMemo(() => {
    if (currentStep === 1) {
      return Math.max(10, Math.round((groupPickCount / 4) * 25));
    }
    if (currentStep === 2) {
      return 25 + Math.round((sfPickCount / 2) * 25);
    }
    if (currentStep === 3) {
      return champion ? 75 : 55;
    }
    return 100;
  }, [currentStep, groupPickCount, sfPickCount, champion]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-[#C7D6FF]">
        <div className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl shadow-xl">
          <div className="w-5 h-5 border-2 border-[#00E676] border-t-transparent rounded-full animate-spin" />
          <span className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">
            Loading Tournament Bracket...
          </span>
        </div>
      </div>
    );
  }

  // After lock state
  if (isLocked) {
    if (!hasAnyPicks) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-md mx-auto text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 w-full">
            <div className="font-heading text-2xl font-extrabold text-[#FF1744] uppercase mb-2">
              Predictions Closed
            </div>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#C7D6FF] uppercase tracking-wide leading-relaxed mb-6">
              Bracket predictions for the tournament locked on November 5 at 15:30 BST.
            </p>
            <button
              onClick={() => navigate('/')}
              className="min-h-[48px] px-6 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] w-full flex items-center justify-center gap-2 cursor-pointer"
              style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    // Locked with existing picks: Read-only review view
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-white">
              Your <span className="text-3d-green">Bracket Picks</span>
            </h1>
            <p className="font-heading font-bold text-[10px] sm:text-[11px] tracking-[0.2em] text-[#C7D6FF] uppercase mt-0.5">
              Predictions locked • Read-only
            </p>
          </div>
          <button
            onClick={() => navigate('/card?type=bracket')}
            className="min-h-[44px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_8px_20px_rgba(0,184,83,0.35)] flex items-center gap-1.5 cursor-pointer"
            style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
          >
            <span>View Card</span>
            <span>→</span>
          </button>
        </div>

        {/* Read only bracket summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <h3 className="font-heading font-extrabold text-xs tracking-wider text-[#00E676] uppercase">Group A</h3>
              <span className="text-[10px] font-heading font-extrabold text-[#C7D6FF]/70 uppercase tracking-wider">Qualifiers</span>
            </div>
            <div className="p-4 sm:p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[10px] text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 rounded border border-[#00E676]/30 uppercase">1st</span>
                <TeamFlag flagCode={teamMap.get(a1 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                <span className="font-heading font-extrabold text-white text-sm uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{teamMap.get(a1 || '')?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[10px] text-[#6EA8FF] bg-[#6EA8FF]/10 px-1.5 py-0.5 rounded border border-[#6EA8FF]/30 uppercase">2nd</span>
                <TeamFlag flagCode={teamMap.get(a2 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                <span className="font-heading font-extrabold text-white text-sm uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{teamMap.get(a2 || '')?.name}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <h3 className="font-heading font-extrabold text-xs tracking-wider text-[#00E676] uppercase">Group B</h3>
              <span className="text-[10px] font-heading font-extrabold text-[#C7D6FF]/70 uppercase tracking-wider">Qualifiers</span>
            </div>
            <div className="p-4 sm:p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[10px] text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 rounded border border-[#00E676]/30 uppercase">1st</span>
                <TeamFlag flagCode={teamMap.get(b1 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                <span className="font-heading font-extrabold text-white text-sm uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{teamMap.get(b1 || '')?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[10px] text-[#6EA8FF] bg-[#6EA8FF]/10 px-1.5 py-0.5 rounded border border-[#6EA8FF]/30 uppercase">2nd</span>
                <TeamFlag flagCode={teamMap.get(b2 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                <span className="font-heading font-extrabold text-white text-sm uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{teamMap.get(b2 || '')?.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/40 border-t-[#00E676]/65 shadow-[0_16px_48px_rgba(0,230,118,0.16),0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden text-center relative">
          <div className="px-5 sm:px-6 py-3.5 border-b border-[#00E676]/20 flex items-center justify-between text-xs bg-white/[0.03]">
            <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#00E676]">
              Grand Final • Nov 17
            </span>
            <span className="text-[10px] sm:text-[11px] font-heading font-extrabold tracking-wider text-[#00E676] uppercase">
              Tournament Champion
            </span>
          </div>
          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-3 bg-white text-[#0A1270] px-6 sm:px-8 py-3.5 rounded-full border-b-4 border-[#007033] ring-4 ring-[#00E676]/30 shadow-2xl">
              <TeamFlag flagCode={teamMap.get(champion || '')?.flagCode} className="w-8 h-6 rounded shadow-sm shrink-0" />
              <span className="font-heading text-xl text-[#0A1270] font-extrabold uppercase tracking-wide">
                {teamMap.get(champion || '')?.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isGroupAComplete = Boolean(a1 && a2);
  const isGroupBComplete = Boolean(b1 && b2);
  const isSf1Complete = Boolean(sf1Winner);
  const isSf2Complete = Boolean(sf2Winner);

  // Active Wizard flow
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 w-full space-y-6">
      {/* Step Indicator Header with 3D Stadium Progress Track */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
            {currentStep === 1 && (
              <>
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Pick</span>{' '}
                <span className="text-[#00E676]">Group Qualifiers</span>
              </>
            )}
            {currentStep === 2 && (
              <>
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Pick</span>{' '}
                <span className="text-[#00E676]">Semi-Final Winners</span>
              </>
            )}
            {currentStep === 3 && (
              <>
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Pick</span>{' '}
                <span className="text-[#00E676]">The Champion</span>
              </>
            )}
            {currentStep === 4 && (
              <>
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Your</span>{' '}
                <span className="text-[#00E676]">Bracket Summary</span>
              </>
            )}
          </h1>
        </div>

        {/* 3D Stadium Step Indicator with Active Connector Track */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-inner">
          {[1, 2, 3].map((step, idx) => {
            const isCompleted =
              (step === 1 && step1Complete) ||
              (step === 2 && step2Complete) ||
              (step === 3 && step3Complete);
            const isCurrent = currentStep === step;

            return (
              <React.Fragment key={step}>
                {idx > 0 && (
                  <div
                    className={`w-4 sm:w-6 h-[2px] transition-all duration-300 ${
                      currentStep > step - 1
                        ? 'bg-[#00E676] shadow-[0_0_6px_#00E676]'
                        : 'bg-white/15'
                    }`}
                  />
                )}
                <button
                  type="button"
                  disabled={
                    (step === 2 && !step1Complete) ||
                    (step === 3 && (!step1Complete || !step2Complete))
                  }
                  onClick={() => setCurrentStep(step as any)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-heading font-extrabold text-xs transition-all cursor-pointer select-none ${
                    isCurrent
                      ? 'bg-white text-[#0A1270] shadow-[0_3px_10px_rgba(0,0,0,0.35)] border-b-2 border-slate-300 ring-2 ring-[#00E676]'
                      : isCompleted
                      ? 'bg-[#00E676] text-[#0A1270] shadow-[0_0_10px_rgba(0,230,118,0.45)]'
                      : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/15 disabled:cursor-not-allowed'
                  }`}
                >
                  {isCompleted && !isCurrent ? '✓' : step}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: GROUPS */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <p className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#C7D6FF]/90 leading-relaxed">
            Select the 1st and 2nd place finishers for Group A and Group B.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Group A Card */}
          <div
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              isGroupAComplete
                ? 'bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/35 border-t-[#00E676]/60 shadow-[0_12px_36px_rgba(0,230,118,0.12),0_4px_16px_rgba(0,0,0,0.4)]'
                : 'bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70'
            }`}
          >
            {/* Group Header Bar */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xs sm:text-sm font-extrabold tracking-wider uppercase text-white">
                  GROUP A
                </h2>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-heading font-extrabold tracking-[0.16em] uppercase px-2.5 py-0.5 rounded-full border transition-all ${
                  isGroupAComplete
                    ? 'text-[#00E676] bg-[#00E676]/15 border-[#00E676]/40 shadow-[0_0_8px_rgba(0,230,118,0.25)]'
                    : 'text-[#C7D6FF]/70 bg-white/[0.05] border-white/10'
                }`}
              >
                {isGroupAComplete ? '✓ QUALIFIERS SELECTED' : 'PICK 1ST & 2ND'}
              </span>
            </div>

            {/* Group Card Body */}
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1st Place Group A */}
                <div>
                  <label className="flex items-center gap-1.5 font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#00E676] mb-2 select-none">
                    <span>1st Place (Winner)</span>
                  </label>
                  <div className="space-y-2">
                    {groupATeams.map((team) => {
                      const isSelected = a1 === team.id;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setBracketPick('groupAFirst', null);
                            } else {
                              setBracketPick('groupAFirst', team.id);
                              if (a2 === team.id) setBracketPick('groupASecond', null);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#0A1270] font-bold border-b-2 border-emerald-400 shadow-[0_4px_14px_rgba(0,230,118,0.25)] ring-2 ring-[#00E676] active:translate-y-[1px]'
                              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.99]'
                          }`}
                        >
                          <TeamFlag flagCode={team.flagCode} className="w-6 h-4.5 rounded shadow-sm shrink-0" />
                          <span
                            className={`flex-1 font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap truncate ${
                              isSelected ? 'text-[#0A1270]' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                            }`}
                          >
                            {team.name}
                          </span>
                          {isSelected && (
                            <span className="bg-[#00E676] text-black font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 rounded shadow-sm uppercase shrink-0">
                              1ST
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2nd Place Group A */}
                <div>
                  <label className="flex items-center gap-1.5 font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#6EA8FF] mb-2 select-none">
                    <span>2nd Place (Runner-up)</span>
                  </label>
                  <div className="space-y-2">
                    {groupATeams.map((team) => {
                      const isSelected = a2 === team.id;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setBracketPick('groupASecond', null);
                            } else {
                              setBracketPick('groupASecond', team.id);
                              if (a1 === team.id) setBracketPick('groupAFirst', null);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#0A1270] font-bold border-b-2 border-sky-400 shadow-[0_4px_14px_rgba(110,168,255,0.25)] ring-2 ring-[#6EA8FF] active:translate-y-[1px]'
                              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.99]'
                          }`}
                        >
                          <TeamFlag flagCode={team.flagCode} className="w-6 h-4.5 rounded shadow-sm shrink-0" />
                          <span
                            className={`flex-1 font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap truncate ${
                              isSelected ? 'text-[#0A1270]' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                            }`}
                          >
                            {team.name}
                          </span>
                          {isSelected && (
                            <span className="bg-[#6EA8FF] text-[#0A1270] font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 rounded shadow-sm uppercase shrink-0">
                              2ND
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Group B Card */}
          <div
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              isGroupBComplete
                ? 'bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/35 border-t-[#00E676]/60 shadow-[0_12px_36px_rgba(0,230,118,0.12),0_4px_16px_rgba(0,0,0,0.4)]'
                : 'bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70'
            }`}
          >
            {/* Group Header Bar */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-xs sm:text-sm font-extrabold tracking-wider uppercase text-white">
                  GROUP B
                </h2>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-heading font-extrabold tracking-[0.16em] uppercase px-2.5 py-0.5 rounded-full border transition-all ${
                  isGroupBComplete
                    ? 'text-[#00E676] bg-[#00E676]/15 border-[#00E676]/40 shadow-[0_0_8px_rgba(0,230,118,0.25)]'
                    : 'text-[#C7D6FF]/70 bg-white/[0.05] border-white/10'
                }`}
              >
                {isGroupBComplete ? '✓ QUALIFIERS SELECTED' : 'PICK 1ST & 2ND'}
              </span>
            </div>

            {/* Group Card Body */}
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1st Place Group B */}
                <div>
                  <label className="flex items-center gap-1.5 font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#00E676] mb-2 select-none">
                    <span>1st Place (Winner)</span>
                  </label>
                  <div className="space-y-2">
                    {groupBTeams.map((team) => {
                      const isSelected = b1 === team.id;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setBracketPick('groupBFirst', null);
                            } else {
                              setBracketPick('groupBFirst', team.id);
                              if (b2 === team.id) setBracketPick('groupBSecond', null);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#0A1270] font-bold border-b-2 border-emerald-400 shadow-[0_4px_14px_rgba(0,230,118,0.25)] ring-2 ring-[#00E676] active:translate-y-[1px]'
                              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.99]'
                          }`}
                        >
                          <TeamFlag flagCode={team.flagCode} className="w-6 h-4.5 rounded shadow-sm shrink-0" />
                          <span
                            className={`flex-1 font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap truncate ${
                              isSelected ? 'text-[#0A1270]' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                            }`}
                          >
                            {team.name}
                          </span>
                          {isSelected && (
                            <span className="bg-[#00E676] text-black font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 rounded shadow-sm uppercase shrink-0">
                              1ST
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2nd Place Group B */}
                <div>
                  <label className="flex items-center gap-1.5 font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#6EA8FF] mb-2 select-none">
                    <span>2nd Place (Runner-up)</span>
                  </label>
                  <div className="space-y-2">
                    {groupBTeams.map((team) => {
                      const isSelected = b2 === team.id;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setBracketPick('groupBSecond', null);
                            } else {
                              setBracketPick('groupBSecond', team.id);
                              if (b1 === team.id) setBracketPick('groupBFirst', null);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#0A1270] font-bold border-b-2 border-sky-400 shadow-[0_4px_14px_rgba(110,168,255,0.25)] ring-2 ring-[#6EA8FF] active:translate-y-[1px]'
                              : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.99]'
                          }`}
                        >
                          <TeamFlag flagCode={team.flagCode} className="w-6 h-4.5 rounded shadow-sm shrink-0" />
                          <span
                            className={`flex-1 font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap truncate ${
                              isSelected ? 'text-[#0A1270]' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                            }`}
                          >
                            {team.name}
                          </span>
                          {isSelected && (
                            <span className="bg-[#6EA8FF] text-[#0A1270] font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 rounded shadow-sm uppercase shrink-0">
                              2ND
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* STEP 2: SEMI-FINALS */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <p className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#C7D6FF]/90 leading-relaxed">
            Tap the winner of each semi-final match to advance them to the Final.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Semi-Final 1 */}
          <div
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              isSf1Complete
                ? 'bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#6EA8FF]/35 border-t-[#6EA8FF]/60 shadow-[0_12px_36px_rgba(110,168,255,0.15),0_4px_16px_rgba(0,0,0,0.4)]'
                : 'bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70'
            }`}
          >
            {/* Match Header Bar */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#6EA8FF]">
                  Semi-Final 1
                </span>
                <span className="text-white/30 font-normal">|</span>
                <span className="font-heading font-extrabold text-[11px] text-[#C7D6FF] uppercase tracking-wider">
                  Nov 14, 15:00 BST
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-heading font-bold tracking-wider text-[#C7D6FF]/70 uppercase">
                Group B 1st vs Group A 2nd
              </span>
            </div>

            {/* Match Card Body */}
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 relative">
                {/* Contender 1 */}
                <button
                  type="button"
                  onClick={() => setBracketPick('sf1Winner', sf1Winner === sf1Team1 ? null : sf1Team1)}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    sf1Winner === sf1Team1
                      ? 'bg-white text-[#0A1270] font-bold border-b-2 border-emerald-400 shadow-[0_6px_20px_rgba(0,230,118,0.35)] ring-2 ring-[#00E676] active:translate-y-[1px]'
                      : sf1Winner === sf1Team2
                      ? 'bg-white/[0.04] border-white/10 opacity-55 text-white/70 hover:opacity-80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.98]'
                  }`}
                >
                  <TeamFlag flagCode={teamMap.get(sf1Team1 || '')?.flagCode} className="w-10 h-7 rounded shadow-md" />
                  <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                    {teamMap.get(sf1Team1 || '')?.name}
                  </span>
                  <span className="text-[10px] font-heading font-bold tracking-wider uppercase opacity-75">
                    Group B 1st
                  </span>
                  {sf1Winner === sf1Team1 && (
                    <span className="bg-[#00E676] text-black font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,230,118,0.4)] uppercase mt-0.5">
                      ★ ADVANCES
                    </span>
                  )}
                </button>

                {/* Contender 2 */}
                <button
                  type="button"
                  onClick={() => setBracketPick('sf1Winner', sf1Winner === sf1Team2 ? null : sf1Team2)}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    sf1Winner === sf1Team2
                      ? 'bg-white text-[#0A1270] font-bold border-b-2 border-emerald-400 shadow-[0_6px_20px_rgba(0,230,118,0.35)] ring-2 ring-[#00E676] active:translate-y-[1px]'
                      : sf1Winner === sf1Team1
                      ? 'bg-white/[0.04] border-white/10 opacity-55 text-white/70 hover:opacity-80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.98]'
                  }`}
                >
                  <TeamFlag flagCode={teamMap.get(sf1Team2 || '')?.flagCode} className="w-10 h-7 rounded shadow-md" />
                  <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                    {teamMap.get(sf1Team2 || '')?.name}
                  </span>
                  <span className="text-[10px] font-heading font-bold tracking-wider uppercase opacity-75">
                    Group A 2nd
                  </span>
                  {sf1Winner === sf1Team2 && (
                    <span className="bg-[#00E676] text-black font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,230,118,0.4)] uppercase mt-0.5">
                      ★ ADVANCES
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Semi-Final 2 */}
          <div
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              isSf2Complete
                ? 'bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#6EA8FF]/35 border-t-[#6EA8FF]/60 shadow-[0_12px_36px_rgba(110,168,255,0.15),0_4px_16px_rgba(0,0,0,0.4)]'
                : 'bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70'
            }`}
          >
            {/* Match Header Bar */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#6EA8FF]">
                  Semi-Final 2
                </span>
                <span className="text-white/30 font-normal">|</span>
                <span className="font-heading font-extrabold text-[11px] text-[#C7D6FF] uppercase tracking-wider">
                  Nov 14, 20:30 BST
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-heading font-bold tracking-wider text-[#C7D6FF]/70 uppercase">
                Group A 1st vs Group B 2nd
              </span>
            </div>

            {/* Match Card Body */}
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 relative">
                {/* Contender 1 */}
                <button
                  type="button"
                  onClick={() => setBracketPick('sf2Winner', sf2Winner === sf2Team1 ? null : sf2Team1)}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    sf2Winner === sf2Team1
                      ? 'bg-white text-[#0A1270] font-bold border-b-2 border-emerald-400 shadow-[0_6px_20px_rgba(0,230,118,0.35)] ring-2 ring-[#00E676] active:translate-y-[1px]'
                      : sf2Winner === sf2Team2
                      ? 'bg-white/[0.04] border-white/10 opacity-55 text-white/70 hover:opacity-80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.98]'
                  }`}
                >
                  <TeamFlag flagCode={teamMap.get(sf2Team1 || '')?.flagCode} className="w-10 h-7 rounded shadow-md" />
                  <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                    {teamMap.get(sf2Team1 || '')?.name}
                  </span>
                  <span className="text-[10px] font-heading font-bold tracking-wider uppercase opacity-75">
                    Group A 1st
                  </span>
                  {sf2Winner === sf2Team1 && (
                    <span className="bg-[#00E676] text-black font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,230,118,0.4)] uppercase mt-0.5">
                      ★ ADVANCES
                    </span>
                  )}
                </button>

                {/* Contender 2 */}
                <button
                  type="button"
                  onClick={() => setBracketPick('sf2Winner', sf2Winner === sf2Team2 ? null : sf2Team2)}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    sf2Winner === sf2Team2
                      ? 'bg-white text-[#0A1270] font-bold border-b-2 border-emerald-400 shadow-[0_6px_20px_rgba(0,230,118,0.35)] ring-2 ring-[#00E676] active:translate-y-[1px]'
                      : sf2Winner === sf2Team1
                      ? 'bg-white/[0.04] border-white/10 opacity-55 text-white/70 hover:opacity-80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.98]'
                  }`}
                >
                  <TeamFlag flagCode={teamMap.get(sf2Team2 || '')?.flagCode} className="w-10 h-7 rounded shadow-md" />
                  <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase">
                    {teamMap.get(sf2Team2 || '')?.name}
                  </span>
                  <span className="text-[10px] font-heading font-bold tracking-wider uppercase opacity-75">
                    Group B 2nd
                  </span>
                  {sf2Winner === sf2Team2 && (
                    <span className="bg-[#00E676] text-black font-heading font-extrabold text-[9px] sm:text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,230,118,0.4)] uppercase mt-0.5">
                      ★ ADVANCES
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* STEP 3: FINAL / CHAMPION */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
          <p className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#C7D6FF]/90 leading-relaxed text-center">
            Tap the team you predict will win the SAFF Championship 2026!
          </p>

          <div className="rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/40 border-t-[#00E676]/65 shadow-[0_16px_48px_rgba(0,230,118,0.16),0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden relative">
            {/* Ambient emerald glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#00E676]/15 blur-3xl pointer-events-none rounded-full" />

            {/* Header Bar */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-[#00E676]/20 flex items-center justify-between text-xs bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#00E676]">
                  Grand Final
                </span>
                <span className="text-white/30 font-normal">|</span>
                <span className="font-heading font-extrabold text-[11px] text-[#C7D6FF] uppercase tracking-wider">
                  Nov 17, 20:00 BST
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-heading font-extrabold tracking-wider text-[#00E676] uppercase">
                Championship
              </span>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-8 text-center">
              <div className="font-heading text-lg sm:text-xl md:text-2xl font-extrabold uppercase mb-6 text-white tracking-wide">
                Who Will Win The Championship?
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setBracketPick('champion', champion === finalTeam1 ? null : finalTeam1)}
                  className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center gap-3 cursor-pointer ${
                    champion === finalTeam1
                      ? 'bg-white text-[#0A1270] font-bold border-b-4 border-[#007033] ring-4 ring-[#00E676]/40 shadow-[0_8px_30px_rgba(0,230,118,0.35)] active:translate-y-[2px]'
                      : champion === finalTeam2
                      ? 'bg-white/[0.04] border-white/10 opacity-55 text-white/70 hover:opacity-80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.98]'
                  }`}
                >
                  <TeamFlag flagCode={teamMap.get(finalTeam1 || '')?.flagCode} className="w-12 h-8 sm:w-14 sm:h-9 shadow-md rounded" />
                  <span className="font-heading text-sm sm:text-base font-extrabold uppercase tracking-wide">
                    {teamMap.get(finalTeam1 || '')?.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-wider opacity-75">
                    Winner SF 1
                  </span>
                  {champion === finalTeam1 && (
                    <span className="mt-1 bg-gradient-to-r from-[#00E676] to-[#00B853] text-[#0A1270] font-heading font-extrabold text-[10px] tracking-[0.18em] px-3 py-1 rounded-full uppercase shadow-[0_0_12px_rgba(0,230,118,0.4)] flex items-center gap-1.5 shrink-0">
                      ★ Champion Pick
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setBracketPick('champion', champion === finalTeam2 ? null : finalTeam2)}
                  className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center gap-3 cursor-pointer ${
                    champion === finalTeam2
                      ? 'bg-white text-[#0A1270] font-bold border-b-4 border-[#007033] ring-4 ring-[#00E676]/40 shadow-[0_8px_30px_rgba(0,230,118,0.35)] active:translate-y-[2px]'
                      : champion === finalTeam1
                      ? 'bg-white/[0.04] border-white/10 opacity-55 text-white/70 hover:opacity-80'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border-white/15 backdrop-blur-md text-white shadow-inner active:scale-[0.98]'
                  }`}
                >
                  <TeamFlag flagCode={teamMap.get(finalTeam2 || '')?.flagCode} className="w-12 h-8 sm:w-14 sm:h-9 shadow-md rounded" />
                  <span className="font-heading text-sm sm:text-base font-extrabold uppercase tracking-wide">
                    {teamMap.get(finalTeam2 || '')?.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-wider opacity-75">
                    Winner SF 2
                  </span>
                  {champion === finalTeam2 && (
                    <span className="mt-1 bg-gradient-to-r from-[#00E676] to-[#00B853] text-[#0A1270] font-heading font-extrabold text-[10px] tracking-[0.18em] px-3 py-1 rounded-full uppercase shadow-[0_0_12px_rgba(0,230,118,0.4)] flex items-center gap-1.5 shrink-0">
                      ★ Champion Pick
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fade-in">
          <p className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#C7D6FF]/90 leading-relaxed">
            Review your complete tournament bracket before generating your shareable card.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Group A Review */}
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
                <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#00E676]">
                  GROUP A
                </span>
                <span className="text-[10px] font-heading font-extrabold text-[#C7D6FF]/70 uppercase tracking-wider">Qualifiers</span>
              </div>
              <div className="p-4 sm:p-5 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#C7D6FF]">
                    1st (Winner):
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamFlag flagCode={teamMap.get(a1 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                    <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {teamMap.get(a1 || '')?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#C7D6FF]">
                    2nd (Runner-up):
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamFlag flagCode={teamMap.get(a2 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                    <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {teamMap.get(a2 || '')?.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Group B Review */}
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
                <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#00E676]">
                  GROUP B
                </span>
                <span className="text-[10px] font-heading font-extrabold text-[#C7D6FF]/70 uppercase tracking-wider">Qualifiers</span>
              </div>
              <div className="p-4 sm:p-5 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#C7D6FF]">
                    1st (Winner):
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamFlag flagCode={teamMap.get(b1 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                    <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {teamMap.get(b1 || '')?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#C7D6FF]">
                    2nd (Runner-up):
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamFlag flagCode={teamMap.get(b2 || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                    <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {teamMap.get(b2 || '')?.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Semi-finals Review */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-white/[0.03]">
              <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#6EA8FF]">
                SEMI-FINAL WINNERS
              </span>
              <span className="text-[10px] font-heading font-extrabold text-[#C7D6FF]/70 uppercase tracking-wider">Finalists</span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white/[0.07] backdrop-blur-md p-3.5 rounded-xl flex items-center justify-between border border-white/15 shadow-inner">
                  <span className="font-heading font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#C7D6FF]">
                    SF1 Winner:
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamFlag flagCode={teamMap.get(sf1Winner || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                    <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {teamMap.get(sf1Winner || '')?.name}
                    </span>
                  </div>
                </div>
                <div className="bg-white/[0.07] backdrop-blur-md p-3.5 rounded-xl flex items-center justify-between border border-white/15 shadow-inner">
                  <span className="font-heading font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-[#C7D6FF]">
                    SF2 Winner:
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamFlag flagCode={teamMap.get(sf2Winner || '')?.flagCode} className="w-5 h-3.5 rounded shadow-sm shrink-0" />
                    <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {teamMap.get(sf2Winner || '')?.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Champion Review */}
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/40 border-t-[#00E676]/65 shadow-[0_16px_48px_rgba(0,230,118,0.16),0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden text-center relative">
            <div className="px-5 sm:px-6 py-3.5 border-b border-[#00E676]/20 flex items-center justify-between text-xs bg-white/[0.03]">
              <span className="font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.25em] text-[#00E676] uppercase">
                ★ Tournament Champion Pick
              </span>
              <span className="text-[10px] sm:text-[11px] font-heading font-extrabold tracking-wider text-[#00E676] uppercase">
                Grand Final
              </span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-3 bg-white text-[#0A1270] px-6 sm:px-8 py-3.5 rounded-full border border-[#00E676]/40 ring-2 ring-[#00E676]/30 shadow-xl">
                <TeamFlag flagCode={teamMap.get(champion || '')?.flagCode} className="w-8 h-6 rounded shadow-sm shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold uppercase text-[#0A1270] tracking-wide">
                  {teamMap.get(champion || '')?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Island Capsule at bottom (matching Predictions Page) */}
      <div className="fixed bottom-3 left-2 right-2 sm:left-4 sm:right-4 z-30 pointer-events-none transition-all">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl backdrop-blur-xl bg-[#0b1464]/92 border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/80 pointer-events-auto flex items-center justify-between gap-2.5 sm:gap-3 relative overflow-hidden">
          {/* Real-time Fill Progress Track */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6EA8FF] to-[#00E676] transition-all duration-500 shadow-[0_0_8px_#00E676]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Left Context Readout */}
          <div className="text-left min-w-0 flex-1">
            <span className="font-heading font-extrabold text-[8px] sm:text-[10px] tracking-[0.2em] text-[#C7D6FF] uppercase block truncate">
              {currentStep === 1 && 'Step 1 of 3 • Groups'}
              {currentStep === 2 && 'Step 2 of 3 • Semi-Finals'}
              {currentStep === 3 && 'Step 3 of 3 • Champion'}
              {currentStep === 4 && 'Bracket Complete'}
            </span>
            <span className="font-heading font-extrabold text-[11px] sm:text-sm text-white uppercase tracking-wide block truncate">
              {currentStep === 1 && (groupPickCount === 4 ? 'All 4 Qualifiers Picked' : `${groupPickCount} of 4 Picked`)}
              {currentStep === 2 && (sfPickCount === 2 ? 'Both Finalists Chosen' : `${sfPickCount} of 2 Finalists`)}
              {currentStep === 3 && (champion ? 'Champion Selected' : 'Choose Champion')}
              {currentStep === 4 && 'Ready To Generate Card'}
            </span>
          </div>

          {/* Action Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="min-h-[42px] sm:min-h-[46px] px-3 sm:px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all select-none active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="min-h-[42px] sm:min-h-[46px] px-3 sm:px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all select-none active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                Home
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={
                  (currentStep === 1 && !step1Complete) ||
                  (currentStep === 2 && !step2Complete) ||
                  (currentStep === 3 && !step3Complete)
                }
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="min-h-[42px] sm:min-h-[46px] px-4 sm:px-8 rounded-full font-heading font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.55)] disabled:opacity-40 disabled:pointer-events-none select-none flex items-center gap-1.5 sm:gap-2 group cursor-pointer whitespace-nowrap"
                style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
              >
                <span>Next</span>
                <span className="text-xs sm:text-sm group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/card?type=bracket')}
                className="min-h-[42px] sm:min-h-[46px] px-4 sm:px-8 rounded-full font-heading font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.55)] select-none flex items-center gap-1.5 sm:gap-2 group cursor-pointer whitespace-nowrap"
                style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
              >
                <span>Create <span className="hidden min-[400px]:inline">My </span>Card</span>
                <span className="text-xs sm:text-sm group-hover:translate-x-1 transition-transform">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
