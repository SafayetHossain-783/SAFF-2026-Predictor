import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { usePredictorStore } from '../stores/usePredictorStore';
import { getTeams, getMatches } from '../api/client';
import { TeamFlag } from '../components/Flags';
import { SAFF_LOGO_URL } from '../branding';
import type { Team, Match } from '../types';

export const CardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = (searchParams.get('type') === 'matches' ? 'matches' : 'bracket') as 'bracket' | 'matches';

  const { bracketPicks, matchPredictions, cardUserName, setCardUserName } = usePredictorStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [downloading, setDownloading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.35);

  useEffect(() => {
    Promise.all([getTeams(), getMatches()]).then(([teamsData, matchesData]) => {
      setTeams(teamsData);
      setMatches(matchesData);
    });
  }, []);

  // Responsive scale calculation for the 1920x1080 widescreen 16:9 preview canvas
  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = Math.max(260, previewContainerRef.current.clientWidth - 24);
      const calculated = Math.min(0.85, Math.max(0.12, containerWidth / 1920));
      setPreviewScale(calculated);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  // Check empty state
  const hasBracketPicks = Boolean(
    bracketPicks.groupAFirst ||
    bracketPicks.groupASecond ||
    bracketPicks.groupBFirst ||
    bracketPicks.groupBSecond ||
    bracketPicks.sf1Winner ||
    bracketPicks.sf2Winner ||
    bracketPicks.champion
  );

  const hasMatchPicks = Object.keys(matchPredictions).length > 0;

  // Group and Knockout match segmentation
  const groupAMatches = useMemo(
    () => matches.filter((m) => m.stage === 'group' && m.groupLetter === 'A').sort((a, b) => a.matchNumber - b.matchNumber),
    [matches]
  );
  const groupBMatches = useMemo(
    () => matches.filter((m) => m.stage === 'group' && m.groupLetter === 'B').sort((a, b) => a.matchNumber - b.matchNumber),
    [matches]
  );
  const sf1Match = useMemo(
    () => matches.find((m) => m.matchNumber === 7 || (m.stage === 'semi-final' && m.id === 'M7')),
    [matches]
  );
  const sf2Match = useMemo(
    () => matches.find((m) => m.matchNumber === 8 || (m.stage === 'semi-final' && m.id === 'M8')),
    [matches]
  );
  const finalMatch = useMemo(
    () => matches.find((m) => m.stage === 'final' || m.matchNumber === 9 || m.id === 'M9'),
    [matches]
  );

  // Handle PNG Download (1920 x 1080 Widescreen 16:9 Ultra HD)
  const handleDownload = async () => {
    if (!cardRef.current || !cardUserName.trim()) return;

    try {
      setDownloading(true);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Ultra HD clarity (3840 x 2160)
        width: 1920,
        height: 1080,
      });

      const link = document.createElement('a');
      link.download = `saff-2026-${activeTab}-card-16x9.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export widescreen card image', err);
    } finally {
      setDownloading(false);
    }
  };

  // Bracket teams for shareable tournament tree
  const a1Team = teamMap.get(bracketPicks.groupAFirst || '');
  const a2Team = teamMap.get(bracketPicks.groupASecond || '');
  const b1Team = teamMap.get(bracketPicks.groupBFirst || '');
  const b2Team = teamMap.get(bracketPicks.groupBSecond || '');

  // Determine advancing winners for Left Wing (A1 vs B2) and Right Wing (B1 vs A2)
  const leftWinnerId =
    bracketPicks.sf2Winner === a1Team?.id || bracketPicks.sf2Winner === b2Team?.id
      ? bracketPicks.sf2Winner
      : bracketPicks.sf1Winner === a1Team?.id || bracketPicks.sf1Winner === b2Team?.id
      ? bracketPicks.sf1Winner
      : undefined;

  const rightWinnerId =
    bracketPicks.sf1Winner === b1Team?.id || bracketPicks.sf1Winner === a2Team?.id
      ? bracketPicks.sf1Winner
      : bracketPicks.sf2Winner === b1Team?.id || bracketPicks.sf2Winner === a2Team?.id
      ? bracketPicks.sf2Winner
      : undefined;

  const leftWinnerTeam = leftWinnerId ? teamMap.get(leftWinnerId) : undefined;
  const rightWinnerTeam = rightWinnerId ? teamMap.get(rightWinnerId) : undefined;
  const championTeam = bracketPicks.champion ? teamMap.get(bracketPicks.champion) : undefined;

  const isNameEntered = Boolean(cardUserName.trim());

  // Resolve knockout match teams with user's bracket projections if match DB has null
  const getResolvedMatchTeams = (m: Match) => {
    let home = m.homeTeam || (m.homeTeamId ? teamMap.get(m.homeTeamId) : undefined);
    let away = m.awayTeam || (m.awayTeamId ? teamMap.get(m.awayTeamId) : undefined);

    if (!home) {
      if (m.matchNumber === 7 && bracketPicks.groupBFirst) {
        home = teamMap.get(bracketPicks.groupBFirst);
      } else if (m.matchNumber === 8 && bracketPicks.groupAFirst) {
        home = teamMap.get(bracketPicks.groupAFirst);
      } else if (m.matchNumber === 9 && (bracketPicks.sf1Winner || rightWinnerId)) {
        home = teamMap.get(bracketPicks.sf1Winner || rightWinnerId || '');
      }
    }

    if (!away) {
      if (m.matchNumber === 7 && bracketPicks.groupASecond) {
        away = teamMap.get(bracketPicks.groupASecond);
      } else if (m.matchNumber === 8 && bracketPicks.groupBSecond) {
        away = teamMap.get(bracketPicks.groupBSecond);
      } else if (m.matchNumber === 9 && (bracketPicks.sf2Winner || leftWinnerId)) {
        away = teamMap.get(bracketPicks.sf2Winner || leftWinnerId || '');
      }
    }

    const isSemi = m.stage === 'semi-final';
    const isFinal = m.stage === 'final';

    const defaultHomeLabel =
      isSemi
        ? m.matchNumber === 7
          ? 'WINNER GROUP B'
          : 'WINNER GROUP A'
        : isFinal
        ? 'WINNER SF1'
        : 'TBD';

    const defaultAwayLabel =
      isSemi
        ? m.matchNumber === 7
          ? 'RUNNER-UP GROUP A'
          : 'RUNNER-UP GROUP B'
        : isFinal
        ? 'WINNER SF2'
        : 'TBD';

    return {
      homeTeam: home,
      awayTeam: away,
      homeLabel: home?.name || defaultHomeLabel,
      awayLabel: away?.name || defaultAwayLabel,
    };
  };

  // Helper: Format kickoff date/time for match card (Always in Dhaka BST)
  const formatKickoff = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const day = d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'Asia/Dhaka' });
      const month = d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Dhaka' }).toUpperCase();
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dhaka' });
      return `${day} ${month} • ${time} BST`;
    } catch {
      return '';
    }
  };

  // Resolved champion for match predictions card
  const finalResolved = finalMatch ? getResolvedMatchTeams(finalMatch) : null;
  const finalPrediction = finalMatch ? (matchPredictions[finalMatch.id] || (matchPredictions as any)[finalMatch.matchNumber]) : undefined;

  const matchCardChampion = useMemo(() => {
    if (finalPrediction && typeof finalPrediction.homeScore === 'number' && typeof finalPrediction.awayScore === 'number') {
      if (finalPrediction.homeScore > finalPrediction.awayScore) {
        return finalResolved?.homeTeam;
      }
      if (finalPrediction.awayScore > finalPrediction.homeScore) {
        return finalResolved?.awayTeam;
      }
      if (finalPrediction.penaltyWinner) {
        return teamMap.get(finalPrediction.penaltyWinner);
      }
    }
    if (bracketPicks.champion) {
      return teamMap.get(bracketPicks.champion);
    }
    return undefined;
  }, [finalPrediction, finalResolved, bracketPicks.champion, teamMap]);

  // Render Group Match Card (Compact Tree Pill with Scores)
  const renderGroupMatchPill = (m: Match) => {
    const pred = matchPredictions[m.id] || (matchPredictions as any)[m.matchNumber];
    const { homeTeam, awayTeam, homeLabel, awayLabel } = getResolvedMatchTeams(m);
    const homeScore = pred && typeof pred.homeScore === 'number' ? pred.homeScore : null;
    const awayScore = pred && typeof pred.awayScore === 'number' ? pred.awayScore : null;
    const isHomeWinner = homeScore !== null && awayScore !== null && homeScore > awayScore;
    const isAwayWinner = homeScore !== null && awayScore !== null && awayScore > homeScore;

    return (
      <div
        key={m.id}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xl px-4 py-3 flex flex-col justify-between text-slate-900 select-none h-[185px]"
      >
        {/* Top Header: M01 • 05 NOV • DHAKA */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-black text-[11px] px-2 py-0.5 rounded-full bg-[#1A2BD6]/10 text-[#1A2BD6] border border-[#1A2BD6]/20 uppercase">
              M{m.matchNumber < 10 ? `0${m.matchNumber}` : m.matchNumber}
            </span>
            <span className="font-heading font-extrabold text-[11px] text-slate-500 uppercase tracking-wide">
              {formatKickoff(m.kickoff).split('•')[0]?.trim()}
            </span>
          </div>
          <span className="font-heading font-bold text-[10px] text-slate-400 uppercase tracking-wider">
            Group {m.groupLetter}
          </span>
        </div>

        {/* Home Team Row */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamFlag flagCode={homeTeam?.flagCode} className="w-8 h-5.5 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
            <span className="font-heading font-black text-sm uppercase truncate text-slate-900">
              {homeTeam?.shortName || homeTeam?.name || homeLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isHomeWinner && (
              <span className="font-heading font-black text-[9px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-1.5 py-0.5 rounded uppercase">
                WIN
              </span>
            )}
            <span
              className={`w-9 h-8 rounded-lg flex items-center justify-center font-heading font-black text-base ${
                isHomeWinner
                  ? 'bg-[#00E676]/20 text-[#007033] border border-[#00B853]'
                  : homeScore !== null
                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                  : 'bg-slate-50 text-slate-300 border border-slate-200/60'
              }`}
            >
              {homeScore !== null ? homeScore : '-'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Away Team Row */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamFlag flagCode={awayTeam?.flagCode} className="w-8 h-5.5 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
            <span className="font-heading font-black text-sm uppercase truncate text-slate-900">
              {awayTeam?.shortName || awayTeam?.name || awayLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isAwayWinner && (
              <span className="font-heading font-black text-[9px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-1.5 py-0.5 rounded uppercase">
                WIN
              </span>
            )}
            <span
              className={`w-9 h-8 rounded-lg flex items-center justify-center font-heading font-black text-base ${
                isAwayWinner
                  ? 'bg-[#00E676]/20 text-[#007033] border border-[#00B853]'
                  : awayScore !== null
                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                  : 'bg-slate-50 text-slate-300 border border-slate-200/60'
              }`}
            >
              {awayScore !== null ? awayScore : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Knockout Semi-Final Match Card with Scores
  const renderKnockoutMatchPill = (m: Match | undefined, label: string) => {
    if (!m) return null;
    const pred = matchPredictions[m.id] || (matchPredictions as any)[m.matchNumber];
    const { homeTeam, awayTeam, homeLabel, awayLabel } = getResolvedMatchTeams(m);
    const homeScore = pred && typeof pred.homeScore === 'number' ? pred.homeScore : null;
    const awayScore = pred && typeof pred.awayScore === 'number' ? pred.awayScore : null;
    const isHomeWinner = pred && (
      (homeScore !== null && awayScore !== null && homeScore > awayScore) ||
      (homeScore === awayScore && pred.penaltyWinner === homeTeam?.id)
    );
    const isAwayWinner = pred && (
      (homeScore !== null && awayScore !== null && awayScore > homeScore) ||
      (homeScore === awayScore && pred.penaltyWinner === awayTeam?.id)
    );

    return (
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xl p-4 flex flex-col justify-between text-slate-900 select-none w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs mb-1">
          <span className="font-heading font-black text-xs px-2.5 py-0.5 rounded-full bg-[#1A2BD6]/10 text-[#1A2BD6] border border-[#1A2BD6]/20 uppercase">
            {label}
          </span>
          <span className="font-heading font-extrabold text-[11px] text-slate-500 uppercase tracking-wide">
            14 NOV • DHAKA
          </span>
        </div>

        {/* Home Team Row */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {homeTeam?.flagCode ? (
              <TeamFlag flagCode={homeTeam.flagCode} className="w-8 h-5.5 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
            ) : (
              <div className="w-8 h-5.5 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center font-heading font-black text-[10px] text-slate-400 shrink-0">
                {m.matchNumber === 8 ? '1A' : '1B'}
              </div>
            )}
            <span className="font-heading font-black text-base text-slate-900 uppercase truncate">
              {homeTeam?.shortName || homeTeam?.name || homeLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isHomeWinner && (
              <span className="font-heading font-black text-[10px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2 py-0.5 rounded uppercase">
                ADV
              </span>
            )}
            <span
              className={`w-10 h-9 rounded-xl flex items-center justify-center font-heading font-black text-xl ${
                isHomeWinner
                  ? 'bg-[#00E676]/20 text-[#007033] border-2 border-[#00B853]'
                  : homeScore !== null
                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                  : 'bg-slate-50 text-slate-300 border border-slate-200/60'
              }`}
            >
              {homeScore !== null ? homeScore : '-'}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Away Team Row */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {awayTeam?.flagCode ? (
              <TeamFlag flagCode={awayTeam.flagCode} className="w-8 h-5.5 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
            ) : (
              <div className="w-8 h-5.5 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center font-heading font-black text-[10px] text-slate-400 shrink-0">
                {m.matchNumber === 8 ? '2B' : '2A'}
              </div>
            )}
            <span className="font-heading font-black text-base text-slate-900 uppercase truncate">
              {awayTeam?.shortName || awayTeam?.name || awayLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAwayWinner && (
              <span className="font-heading font-black text-[10px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2 py-0.5 rounded uppercase">
                ADV
              </span>
            )}
            <span
              className={`w-10 h-9 rounded-xl flex items-center justify-center font-heading font-black text-xl ${
                isAwayWinner
                  ? 'bg-[#00E676]/20 text-[#007033] border-2 border-[#00B853]'
                  : awayScore !== null
                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                  : 'bg-slate-50 text-slate-300 border border-slate-200/60'
              }`}
            >
              {awayScore !== null ? awayScore : '-'}
            </span>
          </div>
        </div>

        {/* Penalty shootout decider if tied */}
        {pred && homeScore === awayScore && homeScore !== null && pred.penaltyWinner && (
          <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-heading font-extrabold text-[9px] text-slate-500 uppercase tracking-wide">
              Penalties
            </span>
            <span className="font-heading font-black text-[10px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2 py-0.5 rounded-full uppercase">
              Won: {teamMap.get(pred.penaltyWinner)?.shortName || 'Winner'} (P)
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render Center Grand Final Match Card with Scores & Champion Showcase
  const renderCenterFinalCard = () => {
    if (!finalMatch) return null;
    const pred = matchPredictions[finalMatch.id] || (matchPredictions as any)[finalMatch.matchNumber];
    const { homeTeam, awayTeam, homeLabel, awayLabel } = getResolvedMatchTeams(finalMatch);
    const homeScore = pred && typeof pred.homeScore === 'number' ? pred.homeScore : null;
    const awayScore = pred && typeof pred.awayScore === 'number' ? pred.awayScore : null;
    const isHomeWinner = pred && (
      (homeScore !== null && awayScore !== null && homeScore > awayScore) ||
      (homeScore === awayScore && pred.penaltyWinner === homeTeam?.id)
    );
    const isAwayWinner = pred && (
      (homeScore !== null && awayScore !== null && awayScore > homeScore) ||
      (homeScore === awayScore && pred.penaltyWinner === awayTeam?.id)
    );

    return (
      <div className="w-full">
        <span className="text-base font-heading font-black text-[#00E676] uppercase tracking-widest block mb-2 text-center drop-shadow-[0_2px_8px_rgba(0,230,118,0.4)]">
          Grand Final
        </span>
        <div className="bg-white rounded-3xl border-2 border-[#00E676] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs mb-1">
            <span className="font-heading font-black text-xs px-3 py-0.5 rounded-full bg-[#00E676] text-[#0A1270] shadow-sm uppercase tracking-wide">
              THE FINAL • M09
            </span>
            <span className="font-heading font-extrabold text-[11px] text-slate-500 uppercase tracking-wide">
              17 NOV • 20:00 BST
            </span>
          </div>

          {/* Finalist 1 (SF2 / Left Winner) */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3 min-w-0">
              {homeTeam?.flagCode ? (
                <TeamFlag flagCode={homeTeam.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
              ) : (
                <div className="w-9 h-6 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center font-heading font-black text-xs text-slate-400 shrink-0">
                  SF2
                </div>
              )}
              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                {homeTeam?.name || homeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isHomeWinner && (
                <span className="font-heading font-black text-[11px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2 py-0.5 rounded uppercase">
                  CHAMPION
                </span>
              )}
              <span
                className={`w-12 h-10 rounded-xl flex items-center justify-center font-heading font-black text-2xl ${
                  isHomeWinner
                    ? 'bg-[#00E676]/20 text-[#007033] border-2 border-[#00B853]'
                    : homeScore !== null
                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                    : 'bg-slate-50 text-slate-300 border border-slate-200/60'
                }`}
              >
                {homeScore !== null ? homeScore : '-'}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Finalist 2 (SF1 / Right Winner) */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3 min-w-0">
              {awayTeam?.flagCode ? (
                <TeamFlag flagCode={awayTeam.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
              ) : (
                <div className="w-9 h-6 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center font-heading font-black text-xs text-slate-400 shrink-0">
                  SF1
                </div>
              )}
              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                {awayTeam?.name || awayLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAwayWinner && (
                <span className="font-heading font-black text-[11px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2 py-0.5 rounded uppercase">
                  CHAMPION
                </span>
              )}
              <span
                className={`w-12 h-10 rounded-xl flex items-center justify-center font-heading font-black text-2xl ${
                  isAwayWinner
                    ? 'bg-[#00E676]/20 text-[#007033] border-2 border-[#00B853]'
                    : awayScore !== null
                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                    : 'bg-slate-50 text-slate-300 border border-slate-200/60'
                }`}
              >
                {awayScore !== null ? awayScore : '-'}
              </span>
            </div>
          </div>

          {/* Penalty shootout decider if tied */}
          {pred && homeScore === awayScore && homeScore !== null && pred.penaltyWinner && (
            <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-heading font-extrabold text-[10px] text-slate-500 uppercase tracking-wide">
                Penalty Shootout
              </span>
              <span className="font-heading font-black text-[11px] text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2.5 py-0.5 rounded-full uppercase">
                Won on penalties: {teamMap.get(pred.penaltyWinner)?.name || 'Winner'} (P)
              </span>
            </div>
          )}

          {/* Congratulations Champion Showcase */}
          {matchCardChampion ? (
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-2xl py-3 px-4 text-center my-2 shadow-inner">
              <span className="text-[10px] font-heading font-black text-slate-500 uppercase tracking-widest block">
                Congratulations
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <TeamFlag flagCode={matchCardChampion.flagCode} className="w-8 h-5.5 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                <span className="font-heading font-black text-lg text-[#0A1270] uppercase truncate">
                  {matchCardChampion.name}!
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-dashed border-slate-300 rounded-2xl py-2.5 px-4 text-center my-2 shadow-inner">
              <span className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-widest block">
                Tournament Champion
              </span>
              <span className="font-heading font-black text-xs text-slate-400 uppercase mt-0.5 block">
                Prediction Pending
              </span>
            </div>
          )}

          {/* Match Details Underlined */}
          <div className="text-center mt-2">
            <span className="text-xs font-heading font-bold text-slate-500 underline">
              M09 • 17 NOV 2026 • DHAKA
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
      {/* Switch between the two cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-white">
            Your <span className="text-3d-green">Prediction Card</span>
          </h1>
          <p className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#C7D6FF]/90 leading-relaxed mt-0.5">
            Download and share your official tournament prediction card.
          </p>
        </div>

        {/* Tab switcher - 3D Stadium Segmented Track */}
        <div className="flex items-center p-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 shadow-inner shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSearchParams({ type: 'bracket' })}
            className={`px-5 py-2 rounded-full font-heading font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer ${
              activeTab === 'bracket'
                ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Bracket
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ type: 'matches' })}
            className={`px-5 py-2 rounded-full font-heading font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Matches
          </button>
        </div>
      </div>

      {/* Name Input Bar - Emerald Green Glassmorphism Card System */}
      <div
        className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-4 ${
          isNameEntered
            ? 'bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/45 border-t-[#00E676]/75 shadow-[0_12px_36px_rgba(0,230,118,0.2),0_4px_16px_rgba(0,0,0,0.4)]'
            : 'bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-[#00E676]/25 border-t-[#00E676]/45 shadow-2xl shadow-blue-950/70'
        }`}
      >
        <div className="w-full sm:flex-1">
          <label className="flex items-center justify-between font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] text-[#00E676] uppercase mb-1.5 select-none">
            <span className="flex items-center gap-2">
              <span>Your Name (Printed on Card)</span>
            </span>
            {!isNameEntered && (
              <span className="text-[#6EA8FF] text-[9px] sm:text-[10px] tracking-widest font-heading font-bold">
                Required to export
              </span>
            )}
          </label>
          <input
            type="text"
            value={cardUserName}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[\x00-\x1F\x7F<>]/g, '').slice(0, 32);
              setCardUserName(sanitized);
            }}
            placeholder="ENTER YOUR FULL NAME..."
            maxLength={32}
            className="w-full bg-black/35 border border-[#00E676]/30 hover:border-[#00E676]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 font-heading font-bold uppercase tracking-wide transition-all shadow-inner"
          />
        </div>

        <button
          type="button"
          disabled={
            !cardUserName.trim() ||
            downloading ||
            (activeTab === 'bracket' && !hasBracketPicks) ||
            (activeTab === 'matches' && !hasMatchPicks)
          }
          onClick={handleDownload}
          className="w-full sm:w-auto min-h-[48px] px-8 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.55)] disabled:opacity-40 disabled:pointer-events-none select-none flex items-center justify-center gap-2 shrink-0 cursor-pointer sm:self-end"
          style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
        >
          {downloading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating PNG...</span>
            </>
          ) : (
            <span>Download PNG Card</span>
          )}
        </button>
      </div>

      {/* EMPTY STATES */}
      {activeTab === 'bracket' && !hasBracketPicks && (
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-[#00E676]/25 border-t-[#00E676]/45 shadow-[0_12px_36px_rgba(0,230,118,0.1),0_4px_16px_rgba(0,0,0,0.4)] text-center space-y-4">
          <div className="font-heading text-xl sm:text-2xl font-extrabold text-white uppercase tracking-wide">
            No Bracket Picks Yet
          </div>
          <p className="font-heading font-semibold text-xs sm:text-sm text-[#C7D6FF] uppercase tracking-wide max-w-sm mx-auto leading-relaxed">
            You haven't predicted the tournament bracket. Pick your group qualifiers and champion first.
          </p>
          <button
            onClick={() => navigate('/bracket')}
            className="min-h-[48px] px-8 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.55)] inline-flex items-center gap-2 cursor-pointer"
            style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
          >
            <span>Start Bracket Prediction</span>
            <span className="text-base font-bold">→</span>
          </button>
        </div>
      )}

      {activeTab === 'matches' && !hasMatchPicks && (
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-[#00E676]/25 border-t-[#00E676]/45 shadow-[0_12px_36px_rgba(0,230,118,0.1),0_4px_16px_rgba(0,0,0,0.4)] text-center space-y-4">
          <div className="font-heading text-xl sm:text-2xl font-extrabold text-white uppercase tracking-wide">
            No Match Predictions Yet
          </div>
          <p className="font-heading font-semibold text-xs sm:text-sm text-[#C7D6FF] uppercase tracking-wide max-w-sm mx-auto leading-relaxed">
            You haven't predicted any match scores yet. Enter your score predictions to generate your card.
          </p>
          <button
            onClick={() => navigate('/predictions')}
            className="min-h-[48px] px-8 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.55)] inline-flex items-center gap-2 cursor-pointer"
            style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
          >
            <span>Predict Match Scores</span>
            <span className="text-base font-bold">→</span>
          </button>
        </div>
      )}

      {/* CARD PREVIEW CONTAINER - 1080 x 1080 SQUARE */}
      {((activeTab === 'bracket' && hasBracketPicks) ||
        (activeTab === 'matches' && hasMatchPicks)) && (
        <div className="space-y-3">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs text-[#C7D6FF] px-1 font-heading font-extrabold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>Card Preview</span>
            </div>
            <Link
              to={activeTab === 'bracket' ? '/card?type=matches' : '/card?type=bracket'}
              className="text-[#00E676] hover:underline flex items-center gap-1 cursor-pointer text-[11px] sm:text-xs shrink-0"
            >
              <span>Switch to {activeTab === 'bracket' ? 'Matches' : 'Bracket'} Card</span>
              <span>→</span>
            </Link>
          </div>

          {/* Dynamically scaled widescreen 16:9 preview frame */}
          <div
            ref={previewContainerRef}
            className="w-full flex justify-center items-start overflow-hidden rounded-2xl border border-[#00E676]/25 border-t-[#00E676]/45 shadow-[0_12px_36px_rgba(0,230,118,0.08),0_4px_24px_rgba(0,0,0,0.5)] bg-black/40 p-2 sm:p-4 backdrop-blur-md"
            style={{
              height: `${Math.round(1080 * previewScale) + 32}px`,
            }}
          >
            <div
              style={{
                width: '1920px',
                height: '1080px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
              }}
              className="shrink-0"
            >
              {/* EXACT 1920 x 1080 WIDESCREEN 16:9 CANVAS (ONE SHADE ONLY: TOP RIGHT CORNER ROYAL BLUE #1A2BD6) */}
              <div
                ref={cardRef}
                style={{
                  width: '1920px',
                  height: '1080px',
                  backgroundColor: '#1A2BD6',
                }}
                className="relative px-10 py-6 flex flex-col justify-between text-white font-body select-none overflow-hidden"
              >
                {/* HEADER SECTION: Tournament Logo + Title (Replacing Official Predictions badge) */}
                <div className="flex flex-col items-center text-center z-10 pt-1 pb-1">
                  {SAFF_LOGO_URL && (
                    <div className="relative flex justify-center items-center mb-2.5">
                      <img
                        src={SAFF_LOGO_URL}
                        alt="SAFF Championship"
                        className="relative z-10 h-28 w-auto max-w-[280px] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.55)]"
                        style={{
                          maskImage: 'radial-gradient(ellipse at center, black 75%, transparent 100%)',
                          WebkitMaskImage: 'radial-gradient(ellipse at center, black 75%, transparent 100%)',
                        }}
                      />
                    </div>
                  )}
                  <h2 className="font-heading text-5xl font-black uppercase tracking-tight text-white mb-1 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                    {activeTab === 'bracket' ? 'BRACKET PREDICTION' : 'MATCH PREDICTIONS'}
                  </h2>
                  <p className="font-heading text-xs text-[#00E676] font-extrabold tracking-[0.22em] uppercase drop-shadow-[0_2px_8px_rgba(0,230,118,0.5)]">
                    SAFF CHAMPIONSHIP BANGLADESH 2026 • 5–17 NOV • DHAKA
                  </p>
                </div>

                {/* BODY SECTION: BRACKET PICKS CARD - TOURNAMENT TREE (16:9 WIDESCREEN WORLD CUP FORMAT) */}
                {activeTab === 'bracket' && (
                  <div className="flex-1 w-full flex flex-col items-center justify-center z-10 my-auto">
                    {/* COLUMN ROUND HEADERS (Round of 16 / Semi-final / Final across the top) - Brought down snugly right above the columns */}
                    <div className="w-[1820px] flex items-center justify-between text-sm font-heading font-black text-[#C7D6FF] uppercase tracking-widest px-2 mb-1.5">
                      <div className="w-[280px] text-center">Group Qualifiers</div>
                      <div className="w-[60px]" />
                      <div className="w-[320px] text-center">Semi-final</div>
                      <div className="w-[50px]" />
                      <div className="w-[400px] text-center">Final</div>
                      <div className="w-[50px]" />
                      <div className="w-[320px] text-center">Semi-final</div>
                      <div className="w-[60px]" />
                      <div className="w-[280px] text-center">Group Qualifiers</div>
                    </div>

                    <div className="relative w-[1820px] h-[680px] flex items-center justify-between">
                      {/* COL 1: Left Seeds (Group A 1st & Group B 2nd) */}
                      <div className="relative w-[280px] h-full shrink-0">
                        {/* Top Seed: Group A Winner (1A) - Raised to sit snugly right below Group Qualifiers header */}
                        <div className="absolute top-[65px] left-0 w-full -translate-y-1/2">
                          <span className="text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-widest block mb-1.5 text-left">
                            Group A 1st Place
                          </span>
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-4 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={a1Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {a1Team?.shortName || a1Team?.name || '1A'}
                              </span>
                            </div>
                            <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                              ADV
                            </span>
                          </div>
                        </div>

                        {/* Bottom Seed: Group B Runner-Up (2B) */}
                        <div className="absolute top-[615px] left-0 w-full -translate-y-1/2">
                          <span className="text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-widest block mb-1.5 text-left">
                            Group B 2nd Place
                          </span>
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-4 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={b2Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {b2Team?.shortName || b2Team?.name || '2B'}
                              </span>
                            </div>
                            <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                              ADV
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CONNECTOR 1: Left Seeds (1A & 2B) -> SF2 Connector Line */}
                      <div className="relative w-[60px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="65" x2="30" y2="65" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="0" y1="615" x2="30" y2="615" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="30" y1="65" x2="30" y2="615" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
                          <line x1="30" y1="340" x2="60" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 2: Semi-Final 2 (1A vs 2B) Match - TWO SEPARATE WHITE PILLS */}
                      <div className="relative w-[320px] h-full shrink-0">
                        <div className="absolute top-[340px] left-0 w-full -translate-y-1/2">
                          <span className="text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-widest block mb-2 text-left">
                            Semi-Final 2 • M08 • Nov 14
                          </span>

                          {/* Pill 1: Team 1 (1A) */}
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3.5 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={a1Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {a1Team?.shortName || a1Team?.name || '1A'}
                              </span>
                            </div>
                            {bracketPicks.sf2Winner === a1Team?.id && (
                              <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                                ADV
                              </span>
                            )}
                          </div>

                          {/* Pill 2: Team 2 (2B) */}
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3.5 flex items-center justify-between shadow-2xl mt-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={b2Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {b2Team?.shortName || b2Team?.name || '2B'}
                              </span>
                            </div>
                            {bracketPicks.sf2Winner === b2Team?.id && (
                              <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                                ADV
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CONNECTOR 2: SF1 -> Final Bridge */}
                      <div className="relative w-[50px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="340" x2="50" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 3: GRAND FINAL & CONGRATULATIONS CHAMPION */}
                      <div className="relative w-[400px] h-full shrink-0">
                        <div className="absolute top-[340px] left-0 w-full -translate-y-1/2">
                          <span className="text-base font-heading font-black text-[#00E676] uppercase tracking-widest block mb-2 text-center drop-shadow-[0_2px_8px_rgba(0,230,118,0.4)]">
                            Final
                          </span>
                          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
                            <span className="text-xs font-heading font-extrabold text-slate-400 uppercase tracking-wider block mb-2.5 text-left">
                              Championship Match
                            </span>

                            {/* Finalist 1 Pill */}
                            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs mb-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <TeamFlag flagCode={leftWinnerTeam?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-xs border border-slate-200/60" />
                                <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                  {leftWinnerTeam?.shortName || leftWinnerTeam?.name || 'FINALIST 1'}
                                </span>
                              </div>
                              {bracketPicks.champion === leftWinnerTeam?.id && (
                                <span className="font-heading font-black text-xs text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2.5 py-1 rounded uppercase tracking-wide">
                                  WIN
                                </span>
                              )}
                            </div>

                            {/* Finalist 2 Pill */}
                            <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs mb-3.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <TeamFlag flagCode={rightWinnerTeam?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-xs border border-slate-200/60" />
                                <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                  {rightWinnerTeam?.shortName || rightWinnerTeam?.name || 'FINALIST 2'}
                                </span>
                              </div>
                              {bracketPicks.champion === rightWinnerTeam?.id && (
                                <span className="font-heading font-black text-xs text-[#007033] bg-[#00E676]/20 border border-[#00B853]/40 px-2.5 py-1 rounded uppercase tracking-wide">
                                  WIN
                                </span>
                              )}
                            </div>

                            {/* Congratulations Box (Matching Reference Image) */}
                            {championTeam ? (
                              <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-2xl py-4 px-4 text-center my-2 shadow-inner">
                                <span className="text-xs font-heading font-black text-slate-500 uppercase tracking-widest block">
                                  Congratulations
                                </span>
                                <div className="flex items-center justify-center gap-2.5 mt-1.5">
                                  <TeamFlag flagCode={championTeam.flagCode} className="w-8 h-5.5 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                                  <span className="font-heading font-black text-xl text-[#0A1270] uppercase truncate">
                                    {championTeam.name}!
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-dashed border-slate-300 rounded-2xl py-3 px-4 text-center my-2 shadow-inner">
                                <span className="text-xs font-heading font-black text-slate-400 uppercase tracking-widest block">
                                  Tournament Champion
                                </span>
                                <span className="font-heading font-black text-sm text-slate-400 uppercase mt-1 block">
                                  Pick Pending In Bracket
                                </span>
                              </div>
                            )}

                            {/* Match Number Underlined (Matching M104 in Reference) */}
                            <div className="text-center mt-3">
                              <span className="text-xs font-heading font-bold text-slate-500 underline">
                                M09 • 17 NOV 2026
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CONNECTOR 3: Final -> SF2 Bridge */}
                      <div className="relative w-[50px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="340" x2="50" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 4: Semi-Final 1 (1B vs 2A) Match - TWO SEPARATE WHITE PILLS */}
                      <div className="relative w-[320px] h-full shrink-0">
                        <div className="absolute top-[340px] left-0 w-full -translate-y-1/2">
                          <span className="text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-widest block mb-2 text-left">
                            Semi-Final 1 • M07 • Nov 14
                          </span>

                          {/* Pill 1: Team 1 (1B) */}
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3.5 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={b1Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {b1Team?.shortName || b1Team?.name || '1B'}
                              </span>
                            </div>
                            {bracketPicks.sf1Winner === b1Team?.id && (
                              <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                                ADV
                              </span>
                            )}
                          </div>

                          {/* Pill 2: Team 2 (2A) */}
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3.5 flex items-center justify-between shadow-2xl mt-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={a2Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {a2Team?.shortName || a2Team?.name || '2A'}
                              </span>
                            </div>
                            {bracketPicks.sf1Winner === a2Team?.id && (
                              <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                                ADV
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CONNECTOR 4: Right Seeds -> SF1 Connector Line */}
                      <div className="relative w-[60px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="340" x2="30" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="30" y1="65" x2="30" y2="615" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
                          <line x1="30" y1="65" x2="60" y2="65" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="30" y1="615" x2="60" y2="615" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 5: Right Seeds (1B at Top, 2A at Bottom) */}
                      <div className="relative w-[280px] h-full shrink-0">
                        {/* Top Seed: Group B Winner (1B) - Raised to sit snugly right below Group Qualifiers header */}
                        <div className="absolute top-[65px] left-0 w-full -translate-y-1/2">
                          <span className="text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-widest block mb-1.5 text-left">
                            Group B 1st Place
                          </span>
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-4 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={b1Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {b1Team?.shortName || b1Team?.name || '1B'}
                              </span>
                            </div>
                            <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                              ADV
                            </span>
                          </div>
                        </div>

                        {/* Bottom Seed: Group A Runner-Up (2A) */}
                        <div className="absolute top-[615px] left-0 w-full -translate-y-1/2">
                          <span className="text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-widest block mb-1.5 text-left">
                            Group A 2nd Place
                          </span>
                          <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-4 flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamFlag flagCode={a2Team?.flagCode} className="w-9 h-6 rounded-xs shrink-0 shadow-sm border border-slate-200/60" />
                              <span className="font-heading font-black text-lg text-slate-900 uppercase truncate">
                                {a2Team?.shortName || a2Team?.name || '2A'}
                              </span>
                            </div>
                            <span className="font-heading font-black text-base text-slate-900 border-b-2 border-[#00B853] pb-0.5 px-1">
                              ADV
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BODY SECTION: MATCH PREDICTIONS CARD (16:9 WIDESCREEN TOURNAMENT TREE FORMAT WITH SCORES) */}
                {activeTab === 'matches' && (
                  <div className="flex-1 w-full flex flex-col items-center justify-center z-10 my-auto">
                    {/* COLUMN ROUND HEADERS */}
                    <div className="w-[1820px] flex items-center justify-between text-sm font-heading font-black text-[#C7D6FF] uppercase tracking-widest px-2 mb-1.5">
                      <div className="w-[310px] text-center">Group A Matches</div>
                      <div className="w-[45px]" />
                      <div className="w-[310px] text-center">Semi-Final 2</div>
                      <div className="w-[50px]" />
                      <div className="w-[380px] text-center">Grand Final</div>
                      <div className="w-[50px]" />
                      <div className="w-[310px] text-center">Semi-Final 1</div>
                      <div className="w-[45px]" />
                      <div className="w-[310px] text-center">Group B Matches</div>
                    </div>

                    <div className="relative w-[1820px] h-[680px] flex items-center justify-between">
                      {/* COL 1: Left Wing - Group A Matches (3 matches: M2, M4, M6) */}
                      <div className="relative w-[310px] h-full shrink-0 flex flex-col justify-between py-1">
                        {groupAMatches.map((m) => renderGroupMatchPill(m))}
                      </div>

                      {/* CONNECTOR 1: Group A -> SF2 (Converging tree bracket) */}
                      <div className="relative w-[45px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="95" x2="22.5" y2="95" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="0" y1="585" x2="22.5" y2="585" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="22.5" y1="95" x2="22.5" y2="585" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
                          <line x1="22.5" y1="340" x2="45" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 2: Semi-Final 2 (A1 vs B2) Match Pill with Scores */}
                      <div className="relative w-[310px] h-full shrink-0">
                        <div className="absolute top-[340px] left-0 w-full -translate-y-1/2">
                          {renderKnockoutMatchPill(sf2Match, 'SEMI-FINAL 2 • M08')}
                        </div>
                      </div>

                      {/* CONNECTOR 2: SF2 -> Final Bridge */}
                      <div className="relative w-[50px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="340" x2="50" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 3: GRAND FINAL & CONGRATULATIONS CHAMPION */}
                      <div className="relative w-[380px] h-full shrink-0">
                        <div className="absolute top-[340px] left-0 w-full -translate-y-1/2">
                          {renderCenterFinalCard()}
                        </div>
                      </div>

                      {/* CONNECTOR 3: Final -> SF1 Bridge */}
                      <div className="relative w-[50px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="340" x2="50" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 4: Semi-Final 1 (B1 vs A2) Match Pill with Scores */}
                      <div className="relative w-[310px] h-full shrink-0">
                        <div className="absolute top-[340px] left-0 w-full -translate-y-1/2">
                          {renderKnockoutMatchPill(sf1Match, 'SEMI-FINAL 1 • M07')}
                        </div>
                      </div>

                      {/* CONNECTOR 4: SF1 -> Group B (Converging tree bracket) */}
                      <div className="relative w-[45px] h-full shrink-0">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="340" x2="22.5" y2="340" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="22.5" y1="95" x2="22.5" y2="585" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
                          <line x1="22.5" y1="95" x2="45" y2="95" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                          <line x1="22.5" y1="585" x2="45" y2="585" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* COL 5: Right Wing - Group B Matches (3 matches: M1, M3, M5) */}
                      <div className="relative w-[310px] h-full shrink-0 flex flex-col justify-between py-1">
                        {groupBMatches.map((m) => renderGroupMatchPill(m))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FOOTER SECTION: Name at the bottom, strictly no logos, strictly no italics */}
                <div className="z-10 pt-3 pb-1 flex items-center justify-between border-t border-white/20 text-white">
                  <div className="text-left">
                    <span className="text-[10px] font-heading font-extrabold block uppercase tracking-[0.2em] mb-0.5 text-[#00E676]">
                      PREDICTED BY
                    </span>
                    <span className="font-heading text-2xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                      {cardUserName.trim() || 'ANONYMOUS FAN'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-heading font-extrabold block uppercase tracking-[0.2em] mb-0.5 text-[#C7D6FF]">
                      5 – 17 NOVEMBER 2026
                    </span>
                    <span className="font-heading text-lg font-black uppercase tracking-wider text-white">
                      DHAKA, BANGLADESH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
