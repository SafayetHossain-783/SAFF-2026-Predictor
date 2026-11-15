import React, { useState, useEffect } from 'react';
import {
  adminLogin,
  getTeams,
  getMatches,
  adminSaveTeam,
  adminDeleteTeam,
  adminUpdateMatch,
  adminConfirmKnockoutTeams,
  adminSaveResult,
  adminGetSettings,
  adminToggleDemoMode,
  adminResetScores,
} from '../api/client';
import { TeamFlag, BUILT_IN_FLAGS } from '../components/Flags';
import type { Team, Match } from '../types';

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem('saff_admin_token') || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'teams' | 'fixtures' | 'knockouts' | 'results'>('teams');

  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [resettingScores, setResettingScores] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, string>>({}); // id -> "Saved" message

  // Team form state (for add/edit)
  const [newTeam, setNewTeam] = useState<Team>({
    id: '',
    name: '',
    shortName: '',
    flagCode: 'BAN',
    group: 'A',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getTeams(),
      getMatches(),
      adminGetSettings(token).catch(() => ({ demoMode: true, bracketLockTime: '' })),
    ])
      .then(([tData, mData, sData]) => {
        setTeams(tData);
        setMatches(mData);
        if (sData) {
          setDemoMode(sData.demoMode);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleToggleDemoMode = async () => {
    try {
      const nextMode = !demoMode;
      await adminToggleDemoMode(nextMode, token);
      setDemoMode(nextMode);
      showSavedMessage('demo-mode');
    } catch (err: any) {
      alert(err.message || 'Failed to update demo mode');
    }
  };

  const handleResetScores = async () => {
    if (!window.confirm('Reset all 9 match scores to unplayed (null)? All entered fixture results will be cleared for fresh prediction.')) return;
    try {
      setResettingScores(true);
      await adminResetScores(token);
      showSavedMessage('reset-scores');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset scores');
    } finally {
      setResettingScores(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await adminLogin(passwordInput);
      if (res.token) {
        setToken(res.token);
        sessionStorage.setItem('saff_admin_token', res.token);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect admin password');
    }
  };

  const showSavedMessage = (key: string) => {
    setFeedback((prev) => ({ ...prev, [key]: 'Saved!' }));
    setTimeout(() => {
      setFeedback((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 2500);
  };

  // Team handlers
  const handleSaveTeam = async (teamToSave: Team) => {
    try {
      await adminSaveTeam(teamToSave, token);
      showSavedMessage(`team-${teamToSave.id || 'new'}`);
      loadData();
      if (!teamToSave.id || newTeam.id === teamToSave.id) {
        setNewTeam({ id: '', name: '', shortName: '', flagCode: 'BAN', group: 'A' });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm(`Delete team ${teamId}? This will remove it from all matches.`)) return;
    try {
      await adminDeleteTeam(teamId, token);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Fixture handler
  const handleUpdateFixture = async (match: Match) => {
    try {
      await adminUpdateMatch(
        match.id,
        {
          stage: match.stage,
          matchNumber: match.matchNumber,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          kickoff: match.kickoff,
          venue: match.venue,
          groupLetter: match.groupLetter,
        },
        token
      );
      showSavedMessage(`fixture-${match.id}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Knockout confirmation handler
  const handleConfirmKnockout = async (match: Match) => {
    try {
      await adminConfirmKnockoutTeams(match.id, match.homeTeamId, match.awayTeamId, token);
      showSavedMessage(`knockout-${match.id}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Result handler
  const handleSaveResult = async (match: Match) => {
    try {
      await adminSaveResult(match.id, match.homeScore, match.awayScore, match.penaltyWinner, token);
      showSavedMessage(`result-${match.id}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Unauthenticated view
  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16 max-w-md mx-auto w-full">
        <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white w-full">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-extrabold uppercase text-white mt-1">
              Admin <span className="text-3d-green">Login</span>
            </h1>
            <p className="font-heading font-bold text-xs text-[#C7D6FF]/80 uppercase tracking-wide mt-1">
              Enter tournament administration password to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-heading font-extrabold text-[10px] sm:text-[11px] tracking-[0.2em] text-[#00E676] uppercase block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="ENTER ADMIN PASSWORD..."
                className="w-full bg-black/35 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 font-heading font-bold uppercase tracking-wide transition-all shadow-inner"
                required
              />
            </div>

            {authError && (
              <div className="p-3 bg-[#FF1744]/20 border border-[#FF1744]/40 rounded-xl font-heading font-extrabold text-xs text-[#FF1744] uppercase tracking-wide">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_10px_24px_rgba(0,184,83,0.38)] w-full flex items-center justify-center gap-2 cursor-pointer"
              style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
            >
              Sign In to Admin →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-white flex items-center gap-3">
            <span>Admin <span className="text-3d-green">Panel</span></span>
            {loading && <span className="text-xs font-semibold text-[#00E676] animate-pulse normal-case tracking-normal">(Syncing...)</span>}
          </h1>
        </div>

        <button
          onClick={() => {
            setToken('');
            sessionStorage.removeItem('saff_admin_token');
          }}
          className="min-h-[42px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer self-start sm:self-auto active:scale-[0.98]"
        >
          Sign Out
        </button>
      </div>

      {/* Showcase / Demo Mode Control Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.03] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 select-none">
            <span className="font-heading font-extrabold text-[10px] tracking-[0.2em] text-[#C7D6FF] uppercase">
              {demoMode ? 'Demo Mode Active • Simulated 01 Nov 2026' : 'Live Tournament Mode • Real Time Clock'}
            </span>
          </div>
          <h2 className="font-heading text-lg font-extrabold uppercase text-white tracking-wide">
            Showcase & Evaluation State
          </h2>
          <p className="font-heading font-semibold text-xs text-[#C7D6FF]/80 uppercase tracking-wider mt-1">
            {demoMode
              ? 'Predictions & Brackets unlocked anytime so evaluators can try all features.'
              : 'Real time kickoff locks enforced. Fixtures lock when scheduled match begins.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleDemoMode}
            className={`min-h-[44px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs transition-all cursor-pointer select-none active:scale-[0.98] ${
              demoMode
                ? 'bg-[#00B853] text-white border-b-4 border-[#007033] shadow-[0_6px_20px_rgba(0,184,83,0.35)]'
                : 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/20'
            }`}
          >
            {feedback['demo-mode'] ? 'Saved!' : demoMode ? '✓ Demo Mode (Nov 1 Open)' : 'Switch to Demo Mode'}
          </button>

          <button
            type="button"
            disabled={resettingScores}
            onClick={handleResetScores}
            className="min-h-[44px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50"
          >
            {feedback['reset-scores'] ? 'Reset Done!' : resettingScores ? 'Resetting...' : 'Reset Scores to Unplayed'}
          </button>
        </div>
      </div>

      {/* 4 Tabs: 3D Stadium Segmented Nav Track */}
      <div className="flex items-center p-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 shadow-inner overflow-x-auto">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 sm:px-5 py-2 rounded-full font-heading font-extrabold text-xs tracking-wider uppercase transition-all select-none whitespace-nowrap cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          1. Teams & Groups
        </button>
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`px-4 sm:px-5 py-2 rounded-full font-heading font-extrabold text-xs tracking-wider uppercase transition-all select-none whitespace-nowrap cursor-pointer ${
            activeTab === 'fixtures'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          2. Fixtures
        </button>
        <button
          onClick={() => setActiveTab('knockouts')}
          className={`px-4 sm:px-5 py-2 rounded-full font-heading font-extrabold text-xs tracking-wider uppercase transition-all select-none whitespace-nowrap cursor-pointer ${
            activeTab === 'knockouts'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          3. Knockout Teams
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 sm:px-5 py-2 rounded-full font-heading font-extrabold text-xs tracking-wider uppercase transition-all select-none whitespace-nowrap cursor-pointer ${
            activeTab === 'results'
              ? 'bg-white text-[#0A1270] shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-b-2 border-slate-300'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          4. Results
        </button>
      </div>

      {/* TAB 1: TEAMS & GROUPS */}
      {activeTab === 'teams' && (
        <div className="space-y-6 animate-fade-in">
          {/* Add / Edit Team - Frosted Stadium Glass Panel */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white">
            <h2 className="font-heading text-lg font-extrabold uppercase text-white mb-4">
              Add Or Update Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div>
                <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                  Team Code (e.g. NEP)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={newTeam.id}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, id: e.target.value.toUpperCase(), shortName: e.target.value.toUpperCase() })
                  }
                  placeholder="NEP"
                  className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                />
              </div>

              <div>
                <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Nepal"
                  className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                />
              </div>

              <div>
                <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                  Flag
                </label>
                <select
                  value={newTeam.flagCode}
                  onChange={(e) => setNewTeam({ ...newTeam, flagCode: e.target.value })}
                  className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                >
                  {BUILT_IN_FLAGS.map((f) => (
                    <option key={f.code} value={f.code} className="bg-[#0b1464] text-white">
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                  Group
                </label>
                <select
                  value={newTeam.group}
                  onChange={(e) => setNewTeam({ ...newTeam, group: e.target.value as 'A' | 'B' })}
                  className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                >
                  <option value="A" className="bg-[#0b1464] text-white">Group A</option>
                  <option value="B" className="bg-[#0b1464] text-white">Group B</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleSaveTeam(newTeam)}
                  className="min-h-[42px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_8px_20px_rgba(0,184,83,0.35)] w-full flex items-center justify-center cursor-pointer"
                  style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
                >
                  Save Team
                </button>
              </div>
            </div>
            {feedback['team-new'] && (
              <span className="font-heading font-extrabold text-xs text-[#00E676] uppercase tracking-wide block mt-3">
                ✓ {feedback['team-new']}
              </span>
            )}
          </div>

          {/* Existing Teams Table */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white">
            <h2 className="font-heading text-lg font-extrabold uppercase text-white mb-4">
              Current Tournament Teams
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/15 text-[#C7D6FF] font-heading font-extrabold uppercase tracking-wider">
                    <th className="py-2.5">Flag</th>
                    <th className="py-2.5">Code</th>
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Group</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <TeamFlag flagCode={team.flagCode} className="w-6 h-4 shadow-sm rounded" />
                      </td>
                      <td className="py-3 font-heading font-extrabold text-white">{team.id}</td>
                      <td className="py-3 font-medium text-white/90">{team.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/30 text-[#00E676] font-heading font-extrabold text-[10px] uppercase">
                          Group {team.group}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-3">
                        <button
                          type="button"
                          onClick={() => setNewTeam(team)}
                          className="font-heading font-bold text-xs uppercase text-[#6EA8FF] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(team.id)}
                          className="font-heading font-bold text-xs uppercase text-[#FF1744] hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIXTURES */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white">
            <h2 className="font-heading text-lg font-extrabold uppercase text-white mb-2">
              Edit Match Fixtures
            </h2>
            <p className="font-heading font-semibold text-xs text-[#C7D6FF]/80 uppercase tracking-wide mb-6">
              Revise kickoff times, teams, or venues. Existing predictions and scores are strictly preserved.
            </p>

            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="p-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <span className="font-heading text-xs font-extrabold text-[#00E676] uppercase tracking-wider">
                      Match {match.matchNumber} • {match.stage.toUpperCase()} {match.groupLetter ? `(GROUP ${match.groupLetter})` : ''}
                    </span>
                    {feedback[`fixture-${match.id}`] && (
                      <span className="font-heading font-extrabold text-xs text-[#00E676] uppercase tracking-wide">
                        ✓ {feedback[`fixture-${match.id}`]}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                        Home Team
                      </label>
                      <select
                        value={match.homeTeamId || ''}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          setMatches((prev) =>
                            prev.map((m) => (m.id === match.id ? { ...m, homeTeamId: val } : m))
                          );
                        }}
                        className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                      >
                        <option value="" className="bg-[#0b1464] text-white">(None / TBD)</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id} className="bg-[#0b1464] text-white">
                            {t.name} ({t.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                        Away Team
                      </label>
                      <select
                        value={match.awayTeamId || ''}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          setMatches((prev) =>
                            prev.map((m) => (m.id === match.id ? { ...m, awayTeamId: val } : m))
                          );
                        }}
                        className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                      >
                        <option value="" className="bg-[#0b1464] text-white">(None / TBD)</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id} className="bg-[#0b1464] text-white">
                            {t.name} ({t.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                        Kickoff (ISO/BST)
                      </label>
                      <input
                        type="text"
                        value={match.kickoff}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMatches((prev) =>
                            prev.map((m) => (m.id === match.id ? { ...m, kickoff: val } : m))
                          );
                        }}
                        className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 font-mono text-[11px] text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateFixture(match)}
                        className="min-h-[40px] px-4 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_8px_20px_rgba(0,184,83,0.35)] w-full flex items-center justify-center cursor-pointer"
                        style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
                      >
                        Save Fixture
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOCKOUT TEAMS */}
      {activeTab === 'knockouts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white">
            <h2 className="font-heading text-lg font-extrabold uppercase text-white mb-2">
              Knockout Team Confirmation
            </h2>
            <p className="font-heading font-semibold text-xs text-[#C7D6FF]/80 uppercase tracking-wide mb-6">
              Confirm teams for Semi-Finals and the Final. Clicking <b>Confirm</b> opens match predictions for all users.
            </p>

            <div className="space-y-4">
              {matches
                .filter((m) => m.stage !== 'group')
                .map((match) => (
                  <div key={match.id} className="p-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                      <span className="font-heading text-xs font-extrabold text-[#00E676] uppercase tracking-wider">
                        {match.stage === 'semi-final' ? `Semi-Final (${match.id})` : 'Grand Final (M9)'}
                      </span>
                      <span className="font-heading font-extrabold text-xs uppercase">
                        Status:{' '}
                        {match.teamsConfirmed ? (
                          <span className="text-[#00E676]">Predictions Open</span>
                        ) : (
                          <span className="text-[#6EA8FF]">Pending Confirmation</span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-end">
                      <div>
                        <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                          Team 1
                        </label>
                        <select
                          value={match.homeTeamId || ''}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            setMatches((prev) =>
                              prev.map((m) => (m.id === match.id ? { ...m, homeTeamId: val } : m))
                            );
                          }}
                          className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                        >
                          <option value="" className="bg-[#0b1464] text-white">(Select Team 1)</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id} className="bg-[#0b1464] text-white">
                              {t.name} ({t.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                          Team 2
                        </label>
                        <select
                          value={match.awayTeamId || ''}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            setMatches((prev) =>
                              prev.map((m) => (m.id === match.id ? { ...m, awayTeamId: val } : m))
                            );
                          }}
                          className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                        >
                          <option value="" className="bg-[#0b1464] text-white">(Select Team 2)</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id} className="bg-[#0b1464] text-white">
                              {t.name} ({t.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleConfirmKnockout(match)}
                          className="min-h-[40px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_8px_20px_rgba(0,184,83,0.35)] w-full flex items-center justify-center cursor-pointer"
                          style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
                        >
                          Confirm & Open Match
                        </button>
                      </div>
                    </div>

                    {feedback[`knockout-${match.id}`] && (
                      <span className="font-heading font-extrabold text-xs text-[#00E676] uppercase tracking-wide block mt-2">
                        ✓ {feedback[`knockout-${match.id}`]}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.09] via-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/20 border-t-white/35 shadow-2xl shadow-blue-950/70 text-white">
            <h2 className="font-heading text-lg font-extrabold uppercase text-white mb-2">
              Enter Official Match Results
            </h2>
            <p className="font-heading font-semibold text-xs text-[#C7D6FF]/80 uppercase tracking-wide mb-6">
              Enter final scores after matches conclude. For knockout ties, select the penalty shootout winner.
            </p>

            <div className="space-y-4">
              {matches.map((match) => {
                const isKnockout = match.stage !== 'group';
                const isTie = match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore;

                return (
                  <div key={match.id} className="p-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                      <span className="font-heading text-xs font-extrabold text-[#00E676] uppercase tracking-wider">
                        Match {match.matchNumber} • {match.homeTeam?.name || 'TBD'} vs {match.awayTeam?.name || 'TBD'}
                      </span>
                      {feedback[`result-${match.id}`] && (
                        <span className="font-heading font-extrabold text-xs text-[#00E676] uppercase tracking-wide">
                          ✓ {feedback[`result-${match.id}`]}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
                      <div>
                        <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                          {match.homeTeam?.name || 'Home'} Score
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={match.homeScore !== null ? match.homeScore : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            setMatches((prev) =>
                              prev.map((m) => (m.id === match.id ? { ...m, homeScore: val } : m))
                            );
                          }}
                          className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-center font-heading font-extrabold text-white text-base focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                          placeholder="-"
                        />
                      </div>

                      <div>
                        <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                          {match.awayTeam?.name || 'Away'} Score
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={match.awayScore !== null ? match.awayScore : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            setMatches((prev) =>
                              prev.map((m) => (m.id === match.id ? { ...m, awayScore: val } : m))
                            );
                          }}
                          className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-center font-heading font-extrabold text-white text-base focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                          placeholder="-"
                        />
                      </div>

                      {isKnockout && isTie ? (
                        <div>
                          <label className="font-heading font-extrabold text-[10px] tracking-[0.2em] uppercase text-[#00E676] block mb-1">
                            Penalty Winner
                          </label>
                          <select
                            value={match.penaltyWinner || ''}
                            onChange={(e) => {
                              const val = e.target.value || null;
                              setMatches((prev) =>
                                prev.map((m) => (m.id === match.id ? { ...m, penaltyWinner: val } : m))
                              );
                            }}
                            className="w-full bg-black/35 border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30 shadow-inner"
                          >
                            <option value="" className="bg-[#0b1464] text-white">(Select Winner)</option>
                            {match.homeTeamId && (
                              <option value={match.homeTeamId} className="bg-[#0b1464] text-white">{match.homeTeam?.name}</option>
                            )}
                            {match.awayTeamId && (
                              <option value={match.awayTeamId} className="bg-[#0b1464] text-white">{match.awayTeam?.name}</option>
                            )}
                          </select>
                        </div>
                      ) : (
                        <div />
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() => handleSaveResult(match)}
                          className="min-h-[40px] px-5 rounded-full font-heading font-extrabold uppercase tracking-wider text-xs text-white bg-[#00B853] border-b-4 border-[#007033] hover:bg-[#00A84B] active:translate-y-[2px] active:border-b-2 transition-all shadow-[0_8px_20px_rgba(0,184,83,0.35)] w-full flex items-center justify-center cursor-pointer"
                          style={{ textShadow: '0 1px 0 #005a28, 0 2px 4px rgba(0, 0, 0, 0.4)' }}
                        >
                          Save Result
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
