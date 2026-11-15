import type { Team, Match, ServerTimeResponse } from '../types';

const API_BASE = '/api';

export async function getServerTime(): Promise<ServerTimeResponse> {
  const res = await fetch(`${API_BASE}/time`);
  if (!res.ok) throw new Error('Failed to fetch server time');
  return res.json();
}

export async function getTeams(): Promise<Team[]> {
  const res = await fetch(`${API_BASE}/teams`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  const data = await res.json();
  return data.map((t: any) => ({
    ...t,
    group: (t.group || t.groupLetter) as 'A' | 'B',
    groupLetter: (t.groupLetter || t.group) as 'A' | 'B',
  }));
}

export async function getMatches(): Promise<(Match & { locked: boolean })[]> {
  const res = await fetch(`${API_BASE}/matches`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

// Admin API
export async function adminLogin(password: string): Promise<{ success: boolean; token: string }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function adminSaveTeam(team: Team, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      flagCode: team.flagCode,
      groupLetter: team.group,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save team');
  }
  return res.json();
}

export async function adminDeleteTeam(teamId: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete team');
  }
  return res.json();
}

export async function adminUpdateMatch(
  matchId: string,
  matchData: Partial<Match>,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/matches/${matchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(matchData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update match');
  }
  return res.json();
}

export async function adminConfirmKnockoutTeams(
  matchId: string,
  homeTeamId: string | null,
  awayTeamId: string | null,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/knockouts/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ matchId, homeTeamId, awayTeamId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to confirm knockout teams');
  }
  return res.json();
}

export async function adminSaveResult(
  matchId: string,
  homeScore: number | null,
  awayScore: number | null,
  penaltyWinner: string | null,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/results/${matchId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ homeScore, awayScore, penaltyWinner }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save result');
  }
  return res.json();
}

export async function adminUpdateLockTime(
  bracketLockTime: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/lock-time`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bracketLockTime }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update lock time');
  }
  return res.json();
}

export async function adminGetSettings(
  token: string
): Promise<{ demoMode: boolean; bracketLockTime: string }> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch settings');
  }
  return res.json();
}

export async function adminToggleDemoMode(
  demoMode: boolean,
  token: string
): Promise<{ success: boolean; demoMode: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/demo-mode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ demoMode }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update demo mode');
  }
  return res.json();
}

export async function adminResetScores(
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/reset-scores`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to reset scores');
  }
  return res.json();
}
