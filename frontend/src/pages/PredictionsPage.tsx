import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatches, getTeams } from '../api/client';
import { usePredictorStore } from '../stores/usePredictorStore';
import { TeamFlag } from '../components/Flags';
import type { Match, Team } from '../types';

export const PredictionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { bracketPicks, matchPredictions, setMatchPrediction, clearMatchPrediction } = usePredictorStore();

  const [matches, setMatches] = useState<(Match & { locked: boolean })[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<'all' | 'group' | 'knockout'>('all');

  useEffect(() => {
    Promise.all([getMatches(), getTeams()])
      .then(([mats, tms]) => {
        setMatches(mats);
        setTeams(tms);
      })
      .catch((err) => console.error('Failed to fetch matches', err))
      .finally(() => setLoading(false));
  }, []);

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  const handleScoreChange = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    penaltyWinner?: string | null
  ) => {
    const existing = matchPredictions[matchId];
    let pw = penaltyWinner !== undefined ? penaltyWinner : existing?.penaltyWinner;
    const clampedHome = Math.min(9, Math.max(0, homeScore));
    const clampedAway = Math.min(9, Math.max(0, awayScore));
    if (clampedHome !== clampedAway) {
      pw = null;
    }
    setMatchPrediction(matchId, {
      homeScore: clampedHome,
      awayScore: clampedAway,
      penaltyWinner: pw,
    });
  };

  const handlePenaltyPick = (matchId: string, teamId: string) => {
    const existing = matchPredictions[matchId] || { homeScore: 0, awayScore: 0 };
    setMatchPrediction(matchId, {
      ...existing,
      penaltyWinner: teamId,
    });
  };

  const formatMatchTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const dayMonth = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Dhaka',
      });
      const time = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Dhaka',
      });
      return `${dayMonth}, ${time} BST`;
    } catch {
      return isoString;
    }
  };

  // Resolve match teams (database or projected from user bracket picks)
  const getResolvedMatch = (match: Match) => {
    let homeTeam = match.homeTeam || (match.homeTeamId ? teamMap.get(match.homeTeamId) : null);
    let awayTeam = match.awayTeam || (match.awayTeamId ? teamMap.get(match.awayTeamId) : null);
    let homeTeamId = homeTeam?.id || match.homeTeamId;
    let awayTeamId = awayTeam?.id || match.awayTeamId;

    let placeholderHome = 'TBD';
    let placeholderAway = 'TBD';

    if (match.stage !== 'group') {
      if (match.matchNumber === 7) {
        placeholderHome = '1st Group B';
        placeholderAway = '2nd Group A';
        if (!homeTeam && bracketPicks.groupBFirst) {
          homeTeam = teamMap.get(bracketPicks.groupBFirst) || null;
          homeTeamId = homeTeam?.id || null;
        }
        if (!awayTeam && bracketPicks.groupASecond) {
          awayTeam = teamMap.get(bracketPicks.groupASecond) || null;
          awayTeamId = awayTeam?.id || null;
        }
      } else if (match.matchNumber === 8) {
        placeholderHome = '1st Group A';
        placeholderAway = '2nd Group B';
        if (!homeTeam && bracketPicks.groupAFirst) {
          homeTeam = teamMap.get(bracketPicks.groupAFirst) || null;
          homeTeamId = homeTeam?.id || null;
        }
        if (!awayTeam && bracketPicks.groupBSecond) {
          awayTeam = teamMap.get(bracketPicks.groupBSecond) || null;
          awayTeamId = awayTeam?.id || null;
        }
      } else if (match.matchNumber === 9) {
        placeholderHome = 'Winner SF1';
        placeholderAway = 'Winner SF2';
        if (!homeTeam && bracketPicks.sf1Winner) {
          homeTeam = teamMap.get(bracketPicks.sf1Winner) || null;
          homeTeamId = homeTeam?.id || null;
        }
        if (!awayTeam && bracketPicks.sf2Winner) {
          awayTeam = teamMap.get(bracketPicks.sf2Winner) || null;
          awayTeamId = awayTeam?.id || null;
        }
      }
    }

    const isReady = Boolean(homeTeam && awayTeam);

    return {
      homeTeam,
      awayTeam,
      homeTeamId,
      awayTeamId,
      isReady,
      placeholderHome,
      placeholderAway,
    };
  };

  const isMatchPredicted = (matchId: string) => {
    const p = matchPredictions[matchId];
    return Boolean(p && typeof p.homeScore === 'number' && typeof p.awayScore === 'number');
  };

  const groupMatches = matches.filter((m) => m.stage === 'group');
  const knockoutMatches = matches.filter((m) => m.stage !== 'group');
  const predictedCount = matches.filter((m) => isMatchPredicted(m.id)).length;
  const groupPredictedCount = groupMatches.filter((m) => isMatchPredicted(m.id)).length;
  const knockoutPredictedCount = knockoutMatches.filter((m) => isMatchPredicted(m.id)).length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-saff-label">
        <div className="animate-pulse text-lg font-medium">Loading match fixtures...</div>
      </div>
    );
  }

  const filteredMatches = matches.filter((m) => {
    if (stageFilter === 'group') return m.stage === 'group';
    if (stageFilter === 'knockout') return m.stage !== 'group';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase leading-tight select-none">
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Match</span>{' '}
            <span className="text-3d-green">Predictions</span>
          </h1>
          <p className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#C7D6FF]/90 leading-relaxed mt-0.5">
            Predict exact scores for each match. Each fixture locks at kickoff.
          </p>
        </div>

        {/* Counter Badge with Celebration State */}
        <div
          className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-sm text-right shrink-0 transition-all ${
            predictedCount === 9
              ? 'bg-[#00E676]/15 border-[#00E676]/45 shadow-[0_0_14px_rgba(0,230,118,0.35)]'
              : 'bg-white/10 border-white/15'
          }`}
        >
          <span
            className={`font-heading text-base sm:text-lg font-extrabold ${
              predictedCount === 9 ? 'text-[#00E676]' : 'text-white'
            }`}
          >
            {predictedCount}
            <span
              className={`text-xs font-semibold ${
                predictedCount === 9 ? 'text-[#00E676]/80' : 'text-[#C7D6FF]/70'
              }`}
            >
              {' '}
              / 9
            </span>
          </span>
          <div
            className={`text-[9px] font-heading font-extrabold uppercase tracking-[0.16em] ${
              predictedCount === 9 ? 'text-[#00E676]' : 'text-[#C7D6FF]'
            }`}
          >
            {predictedCount === 9 ? '✓ Completed' : 'Predicted'}
          </div>
        </div>
      </div>

      {/* 2-Column Grid on Desktop (Max-w-6xl Baseline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Stage Filter & Fixtures List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Phase Segmented Filter Track (Stadium 3D Toggle) */}
          <div className="flex items-center p-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 shadow-inner mb-6">
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className={`flex-1 py-2 px-3 rounded-full font-heading font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 ${
            stageFilter === 'all'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>All Matches</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
              stageFilter === 'all'
                ? 'bg-[#0A1270]/10 text-[#0A1270]'
                : 'bg-white/15 text-white/80'
            }`}
          >
            {matches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStageFilter('group')}
          className={`flex-1 py-2 px-3 rounded-full font-heading font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 ${
            stageFilter === 'group'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>Group Stage</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
              stageFilter === 'group'
                ? 'bg-[#0A1270]/10 text-[#0A1270]'
                : 'bg-white/15 text-white/80'
            }`}
          >
            {groupMatches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStageFilter('knockout')}
          className={`flex-1 py-2 px-3 rounded-full font-heading font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 ${
            stageFilter === 'knockout'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>Knockouts</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
              stageFilter === 'knockout'
                ? 'bg-[#0A1270]/10 text-[#0A1270]'
                : 'bg-white/15 text-white/80'
            }`}
          >
            {knockoutMatches.length}
          </span>
        </button>
      </div>

      {/* Scrollable list of match cards */}
      <div className="space-y-4">
        {filteredMatches.map((match, index) => {
          const isKnockout = match.stage !== 'group';
          const { homeTeam, awayTeam, homeTeamId, awayTeamId, isReady, placeholderHome, placeholderAway } = getResolvedMatch(match);
          const prediction = matchPredictions[match.id];
          const isPredicted = Boolean(prediction && prediction.homeScore !== null && prediction.awayScore !== null);
          const homeScore = isPredicted ? prediction.homeScore : null;
          const awayScore = isPredicted ? prediction.awayScore : null;
          const isLevel = isPredicted && homeScore !== null && awayScore !== null && homeScore === awayScore;
          const isLocked = match.locked;

          const showGroupHeader =
            match.stage === 'group' &&
            (index === 0 || filteredMatches[index - 1]?.stage !== 'group');
          const showSemiHeader =
            match.stage === 'semi-final' &&
            (index === 0 || filteredMatches[index - 1]?.stage !== 'semi-final');
          const showFinalHeader =
            match.stage === 'final' &&
            (index === 0 || filteredMatches[index - 1]?.stage !== 'final');

          return (
            <React.Fragment key={match.id}>
              {showGroupHeader && (
                <div className="flex items-center gap-3 pt-2 pb-1">
                  <span className="font-heading font-extrabold text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#00E676]">
                    Group Stage • Nov 5 – 11
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
                </div>
              )}

              {showSemiHeader && (
                <div className="flex items-center gap-3 pt-3 pb-1">
                  <span className="font-heading font-extrabold text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#6EA8FF]">
                    Semi-Finals • Nov 14
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
                </div>
              )}

              {showFinalHeader && (
                <div className="flex items-center gap-3 pt-3 pb-1">
                  <span className="font-heading font-extrabold text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#00E676]">
                    Grand Final • Nov 17
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
                </div>
              )}

              <div
                className={`transition-all duration-300 ${
                  isLocked
                    ? 'rounded-2xl bg-black/40 backdrop-blur-lg border border-white/10 opacity-75 overflow-hidden shadow-lg'
                    : isPredicted
                    ? 'rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-[#00E676]/45 border-t-[#00E676]/75 shadow-[0_12px_36px_rgba(0,230,118,0.2),0_4px_16px_rgba(0,0,0,0.4)] overflow-hidden'
                    : 'rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-[#00E676]/25 border-t-[#00E676]/45 shadow-2xl shadow-blue-950/70 overflow-hidden'
                }`}
              >
                {/* Match Header Bar */}
                <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-[#00E676]/15 flex items-center justify-between text-xs bg-white/[0.03] gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="font-heading font-extrabold text-[11px] sm:text-xs tracking-wider uppercase text-[#00E676] whitespace-nowrap">
                      Match {match.matchNumber}
                    </span>
                    <span className="text-white/30 font-normal">|</span>
                    <span className="font-heading font-extrabold text-[10px] sm:text-[11px] text-[#C7D6FF] uppercase tracking-wider whitespace-nowrap">
                      {match.stage === 'group' ? `Group ${match.groupLetter}` : match.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[9px] sm:text-[11px] font-heading font-extrabold text-[#C7D6FF] uppercase tracking-wide whitespace-nowrap">
                      {formatMatchTime(match.kickoff)}
                    </span>
                    {isLocked ? (
                      <span className="bg-[#FF1744]/20 border border-[#FF1744]/40 text-[#FF1744] font-heading font-extrabold text-[8px] sm:text-[10px] tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                        Locked
                      </span>
                    ) : isPredicted ? (
                      <span className="text-[8px] sm:text-[10px] font-heading font-extrabold tracking-[0.14em] uppercase px-2 sm:px-2.5 py-0.5 rounded-full text-[#00E676] bg-[#00E676]/15 border border-[#00E676]/40 shadow-[0_0_8px_rgba(0,230,118,0.25)] whitespace-nowrap">
                        ✓ PREDICTED
                      </span>
                    ) : (
                      <span className="text-[8px] sm:text-[10px] font-heading font-extrabold tracking-[0.14em] uppercase text-[#C7D6FF]/60 bg-white/[0.05] border border-white/10 px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        NOT PREDICTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Card Body: Two-Row Versus Stack */}
                <div className="p-3.5 sm:p-5 space-y-2.5">
                  {!isReady ? (
                    <div className="py-5 px-4 rounded-xl bg-black/25 border border-white/10 text-center text-[#C7D6FF] flex flex-col items-center justify-center gap-2 shadow-inner">
                      <div className="flex items-center gap-2 font-heading font-extrabold text-xs sm:text-sm uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        <span>{placeholderHome}</span>
                        <span className="text-[#00E676] px-1">VS</span>
                        <span>{placeholderAway}</span>
                      </div>
                      <p className="font-heading font-semibold text-[11px] text-[#C7D6FF]/80 uppercase tracking-wide max-w-md">
                        {match.matchNumber === 9
                          ? 'Select your semi-final winners in the Knockout Bracket to unlock the Grand Final score prediction.'
                          : 'Select your group qualifiers in the Knockout Bracket to unlock this match score prediction.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/bracket')}
                        className="mt-1 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#00E676] font-heading font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Go to Knockout Bracket →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Recessed Stadium Team Rows Container */}
                      <div className="rounded-xl bg-black/25 border border-white/10 overflow-hidden shadow-inner">
                        {/* ROW 1: Home Team */}
                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                          {/* Team Info (Left) */}
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <TeamFlag flagCode={homeTeam?.flagCode} className="w-8 h-5.5 sm:w-9 sm:h-6 rounded shadow-sm shrink-0" />
                            <span className="font-heading font-extrabold text-xs sm:text-sm md:text-base text-white tracking-wide uppercase truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {homeTeam?.name}
                            </span>
                          </div>

                          {/* Home Stepper / Display (Right) */}
                          <div className="shrink-0">
                            {isLocked ? (
                              <span className="w-10 h-9 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 font-heading font-extrabold text-base text-white">
                                {homeScore !== null ? homeScore : '-'}
                              </span>
                            ) : (
                              <div className="flex items-stretch bg-black/40 rounded-full border border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.25)] overflow-hidden backdrop-blur-md h-8.5 sm:h-9">
                                <button
                                  type="button"
                                  disabled={!isPredicted || (homeScore ?? 0) <= 0}
                                  onClick={() =>
                                    handleScoreChange(
                                      match.id,
                                      (homeScore ?? 1) - 1,
                                      awayScore ?? 0
                                    )
                                  }
                                  className="w-7 sm:w-8 flex items-center justify-center text-white/90 hover:text-white bg-transparent hover:bg-white/[0.15] active:bg-white/[0.25] font-heading font-extrabold text-sm border-r border-white/15 transition-all select-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                                  title="Decrease home score"
                                >
                                  -
                                </button>
                                <span
                                  className={`w-9 sm:w-10 flex items-center justify-center bg-black/45 font-heading font-extrabold text-base sm:text-lg tabular-nums select-none border-x border-white/10 shadow-inner ${
                                    isPredicted ? 'text-[#00E676]' : 'text-white/40'
                                  }`}
                                >
                                  {homeScore !== null ? homeScore : '-'}
                                </span>
                                <button
                                  type="button"
                                  disabled={isPredicted && (homeScore ?? 0) >= 9}
                                  onClick={() =>
                                    handleScoreChange(
                                      match.id,
                                      isPredicted ? (homeScore ?? 0) + 1 : 1,
                                      awayScore ?? 0
                                    )
                                  }
                                  className="w-7 sm:w-8 flex items-center justify-center text-white/90 hover:text-white bg-transparent hover:bg-white/[0.15] active:bg-white/[0.25] font-heading font-extrabold text-sm border-l border-white/15 transition-all select-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                                  title="Increase home score"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Divider with subtle VS marker */}
                        <div className="relative border-t border-white/[0.08] flex items-center justify-center">
                          <span className="absolute bg-[#0D187A] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold uppercase text-[#C7D6FF]/50 border border-white/10 shadow-sm tracking-widest">
                            VS
                          </span>
                        </div>

                        {/* ROW 2: Away Team */}
                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                          {/* Team Info (Left) */}
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <TeamFlag flagCode={awayTeam?.flagCode} className="w-8 h-5.5 sm:w-9 sm:h-6 rounded shadow-sm shrink-0" />
                            <span className="font-heading font-extrabold text-xs sm:text-sm md:text-base text-white tracking-wide uppercase truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {awayTeam?.name}
                            </span>
                          </div>

                          {/* Away Stepper / Display (Right) */}
                          <div className="shrink-0">
                            {isLocked ? (
                              <span className="w-10 h-9 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 font-heading font-extrabold text-base text-white">
                                {awayScore !== null ? awayScore : '-'}
                              </span>
                            ) : (
                              <div className="flex items-stretch bg-black/40 rounded-full border border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.25)] overflow-hidden backdrop-blur-md h-8.5 sm:h-9">
                                <button
                                  type="button"
                                  disabled={!isPredicted || (awayScore ?? 0) <= 0}
                                  onClick={() =>
                                    handleScoreChange(
                                      match.id,
                                      homeScore ?? 0,
                                      (awayScore ?? 1) - 1
                                    )
                                  }
                                  className="w-7 sm:w-8 flex items-center justify-center text-white/90 hover:text-white bg-transparent hover:bg-white/[0.15] active:bg-white/[0.25] font-heading font-extrabold text-sm border-r border-white/15 transition-all select-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                                  title="Decrease away score"
                                >
                                  -
                                </button>
                                <span
                                  className={`w-9 sm:w-10 flex items-center justify-center bg-black/45 font-heading font-extrabold text-base sm:text-lg tabular-nums select-none border-x border-white/10 shadow-inner ${
                                    isPredicted ? 'text-[#00E676]' : 'text-white/40'
                                  }`}
                                >
                                  {awayScore !== null ? awayScore : '-'}
                                </span>
                                <button
                                  type="button"
                                  disabled={isPredicted && (awayScore ?? 0) >= 9}
                                  onClick={() =>
                                    handleScoreChange(
                                      match.id,
                                      homeScore ?? 0,
                                      isPredicted ? (awayScore ?? 0) + 1 : 1
                                    )
                                  }
                                  className="w-7 sm:w-8 flex items-center justify-center text-white/90 hover:text-white bg-transparent hover:bg-white/[0.15] active:bg-white/[0.25] font-heading font-extrabold text-sm border-l border-white/15 transition-all select-none cursor-pointer disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                                  title="Increase away score"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ROW 3: Action Button */}
                      {!isLocked && (
                        <div className="flex items-center justify-end text-xs px-1 pt-0.5">
                          {isPredicted ? (
                            <button
                              type="button"
                              onClick={() => clearMatchPrediction(match.id)}
                              className="text-[9px] sm:text-[10px] font-heading font-extrabold uppercase tracking-wider text-white/50 hover:text-[#FF5252] bg-white/[0.05] hover:bg-[#FF1744]/15 px-3 py-1 rounded-full border border-white/10 hover:border-[#FF1744]/30 active:scale-95 transition-all cursor-pointer shadow-sm select-none"
                            >
                              Clear
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleScoreChange(match.id, 0, 0)}
                              className="text-[9px] sm:text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#C7D6FF]/80 hover:text-[#00E676] bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1 rounded-full border border-white/10 hover:border-[#00E676]/30 transition-all cursor-pointer shadow-sm select-none"
                            >
                              Set 0 – 0
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Knockout level score: "Who wins on penalties?" */}
                  {isReady && isKnockout && isLevel && homeTeamId && awayTeamId && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-center animate-fade-in">
                      <span className="font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-[#00E676] block mb-2.5">
                        Who Wins On Penalties?
                      </span>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handlePenaltyPick(match.id, homeTeamId)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-heading font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                            prediction?.penaltyWinner === homeTeamId
                              ? 'bg-[#00B853] text-white border-b-2 border-[#007033] shadow-[0_0_16px_rgba(0,184,83,0.4)]'
                              : 'bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white/90 backdrop-blur-md shadow-inner active:scale-[0.98]'
                          }`}
                        >
                          <TeamFlag flagCode={homeTeam?.flagCode} className="w-5 h-3.5 shadow-sm rounded" />
                          <span>{homeTeam?.shortName || homeTeam?.name} on Penalties</span>
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handlePenaltyPick(match.id, awayTeamId)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-heading font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                            prediction?.penaltyWinner === awayTeamId
                              ? 'bg-[#00B853] text-white border-b-2 border-[#007033] shadow-[0_0_16px_rgba(0,184,83,0.4)]'
                              : 'bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white/90 backdrop-blur-md shadow-inner active:scale-[0.98]'
                          }`}
                        >
                          <TeamFlag flagCode={awayTeam?.flagCode} className="w-5 h-3.5 shadow-sm rounded" />
                          <span>{awayTeam?.shortName || awayTeam?.name} on Penalties</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
          </div>
        </div>

        {/* Right Column: Sticky Live Prediction Summary & Export Card (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 select-none">
            <div className="flex items-center justify-between text-xs font-heading font-extrabold text-[#C7D6FF] uppercase tracking-wider mb-3 pb-2.5 border-b border-white/10">
              <span className="flex items-center gap-2">
                <span>Live Summary</span>
              </span>
              <span className="text-[#00E676] text-[11px] font-black">
                {Math.round((predictedCount / 9) * 100)}% Done
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden mb-4 p-[1px] border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6EA8FF] to-[#00E676] transition-all duration-500 shadow-[0_0_8px_#00E676]"
                style={{ width: `${(predictedCount / 9) * 100}%` }}
              />
            </div>

            <div className="space-y-2.5 mb-5 text-xs font-heading">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.05] border border-white/10">
                <span className="text-white/80 font-bold uppercase tracking-wide text-[11px]">Group Stage (M01–M06)</span>
                <span className="font-extrabold text-[#00E676] text-xs">{groupPredictedCount} / 6</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.05] border border-white/10">
                <span className="text-white/80 font-bold uppercase tracking-wide text-[11px]">Knockouts (SF & Final)</span>
                <span className="font-extrabold text-[#6EA8FF] text-xs">{knockoutPredictedCount} / 3</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/card?type=matches')}
              className="w-full min-h-[46px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] flex items-center justify-center gap-2 group cursor-pointer"
              style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              <span>Export Match Card</span>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create-card button always visible (Floating Island Capsule at bottom) */}
      <div className="fixed bottom-3 left-2 right-2 sm:left-4 sm:right-4 z-30 pointer-events-none transition-all">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl backdrop-blur-xl bg-[#0b1464]/92 border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/80 pointer-events-auto flex items-center justify-between gap-2.5 sm:gap-3 relative overflow-hidden">
          {/* Real-time Fill Progress Track */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6EA8FF] to-[#00E676] transition-all duration-500 shadow-[0_0_8px_#00E676]"
              style={{ width: `${(predictedCount / 9) * 100}%` }}
            />
          </div>

          <div className="text-left min-w-0 flex-1">
            <span className="font-heading font-extrabold text-[8px] sm:text-[10px] tracking-[0.2em] text-[#C7D6FF] uppercase block truncate">
              Predictions Saved
            </span>
            <span className="font-heading font-extrabold text-[11px] sm:text-sm text-white uppercase tracking-wide block truncate">
              {predictedCount > 0 ? `${predictedCount} of 9 Predicted` : 'No scores entered yet'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/card?type=matches')}
            className="min-h-[42px] sm:min-h-[46px] px-4 sm:px-6 rounded-full font-heading font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.55)] flex items-center justify-center gap-1.5 sm:gap-2 group select-none shrink-0 whitespace-nowrap cursor-pointer"
            style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
          >
            <span>Create <span className="hidden min-[400px]:inline">My </span>Card</span>
            <span className="text-xs sm:text-sm group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
