/** Team from the server */
export interface Team {
  id: string;
  name: string;
  shortName: string;
  flagCode: string;
  group: 'A' | 'B';
  groupLetter?: 'A' | 'B';
}

/** Match from the server (with optional populated team objects) */
export interface Match {
  id: string;
  stage: 'group' | 'semi-final' | 'final';
  matchNumber: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  kickoff: string; // ISO datetime
  venue: string;
  groupLetter: string | null;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: string | null;
  teamsConfirmed: boolean;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
}

/** Bracket prediction picks stored in localStorage */
export interface BracketPicks {
  groupAFirst: string | null;
  groupASecond: string | null;
  groupBFirst: string | null;
  groupBSecond: string | null;
  sf1Winner: string | null;
  sf2Winner: string | null;
  champion: string | null;
}

/** Single match score prediction stored in localStorage */
export interface MatchPrediction {
  homeScore: number;
  awayScore: number;
  penaltyWinner?: string | null;
}

/** Response from GET /api/time */
export interface ServerTimeResponse {
  now: string;
  bracketLockTime: string;
  bracketLocked: boolean;
  demoMode?: boolean;
}
