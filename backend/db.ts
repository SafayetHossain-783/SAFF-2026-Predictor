import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'tournament.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    shortName TEXT NOT NULL,
    flagCode TEXT NOT NULL,
    groupLetter TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    stage TEXT NOT NULL,
    matchNumber INTEGER NOT NULL,
    homeTeamId TEXT,
    awayTeamId TEXT,
    kickoff TEXT NOT NULL,
    venue TEXT NOT NULL DEFAULT 'National Stadium, Dhaka',
    groupLetter TEXT,
    homeScore INTEGER,
    awayScore INTEGER,
    penaltyWinner TEXT,
    teamsConfirmed INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (homeTeamId) REFERENCES teams(id),
    FOREIGN KEY (awayTeamId) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default settings
const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
const setSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

if (!getSetting.get('bracketLockTime')) {
  // First kickoff: Nov 5, 2026 at 15:30 BST (UTC+6)
  setSetting.run('bracketLockTime', '2026-11-05T15:30:00+06:00');
}

if (!getSetting.get('demoMode')) {
  setSetting.run('demoMode', '1');
}

// Seed teams if table is empty
const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
if (teamCount.count === 0) {
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, shortName, flagCode, groupLetter)
    VALUES (@id, @name, @shortName, @flagCode, @groupLetter)
  `);

  const initialTeams = [
    { id: 'BAN', name: 'Bangladesh', shortName: 'BAN', flagCode: 'BAN', groupLetter: 'A' },
    { id: 'BHU', name: 'Bhutan', shortName: 'BHU', flagCode: 'BHU', groupLetter: 'A' },
    { id: 'SRI', name: 'Sri Lanka', shortName: 'SRI', flagCode: 'SRI', groupLetter: 'A' },
    { id: 'IND', name: 'India', shortName: 'IND', flagCode: 'IND', groupLetter: 'B' },
    { id: 'MDV', name: 'Maldives', shortName: 'MDV', flagCode: 'MDV', groupLetter: 'B' },
    { id: 'PAK', name: 'Pakistan', shortName: 'PAK', flagCode: 'PAK', groupLetter: 'B' },
  ];

  const seedTeams = db.transaction(() => {
    for (const team of initialTeams) {
      insertTeam.run(team);
    }
  });
  seedTeams();
}

// Seed matches if table is empty
const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number };
if (matchCount.count === 0) {
  const insertMatch = db.prepare(`
    INSERT INTO matches (id, stage, matchNumber, homeTeamId, awayTeamId, kickoff, venue, groupLetter, homeScore, awayScore, penaltyWinner, teamsConfirmed)
    VALUES (@id, @stage, @matchNumber, @homeTeamId, @awayTeamId, @kickoff, @venue, @groupLetter, @homeScore, @awayScore, @penaltyWinner, @teamsConfirmed)
  `);

  const initialMatches = [
    // 5 November 2026
    {
      id: 'M1',
      stage: 'group',
      matchNumber: 1,
      homeTeamId: 'PAK',
      awayTeamId: 'IND',
      kickoff: '2026-11-05T15:30:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: 'B',
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 1,
    },
    {
      id: 'M2',
      stage: 'group',
      matchNumber: 2,
      homeTeamId: 'BHU',
      awayTeamId: 'BAN',
      kickoff: '2026-11-05T20:00:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: 'A',
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 1,
    },
    // 8 November 2026
    {
      id: 'M3',
      stage: 'group',
      matchNumber: 3,
      homeTeamId: 'MDV',
      awayTeamId: 'PAK',
      kickoff: '2026-11-08T15:30:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: 'B',
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 1,
    },
    {
      id: 'M4',
      stage: 'group',
      matchNumber: 4,
      homeTeamId: 'SRI',
      awayTeamId: 'BHU',
      kickoff: '2026-11-08T20:00:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: 'A',
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 1,
    },
    // 11 November 2026
    {
      id: 'M5',
      stage: 'group',
      matchNumber: 5,
      homeTeamId: 'IND',
      awayTeamId: 'MDV',
      kickoff: '2026-11-11T15:30:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: 'B',
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 1,
    },
    {
      id: 'M6',
      stage: 'group',
      matchNumber: 6,
      homeTeamId: 'BAN',
      awayTeamId: 'SRI',
      kickoff: '2026-11-11T20:00:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: 'A',
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 1,
    },
    // Knockouts: Semi-Final 1 (Nov 14, 15:00 BST)
    {
      id: 'M7',
      stage: 'semi-final',
      matchNumber: 7,
      homeTeamId: null,
      awayTeamId: null,
      kickoff: '2026-11-14T15:00:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: null,
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 0,
    },
    // Knockouts: Semi-Final 2 (Nov 14, 20:30 BST)
    {
      id: 'M8',
      stage: 'semi-final',
      matchNumber: 8,
      homeTeamId: null,
      awayTeamId: null,
      kickoff: '2026-11-14T20:30:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: null,
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 0,
    },
    // Knockouts: Final (Nov 17, 20:00 BST)
    {
      id: 'M9',
      stage: 'final',
      matchNumber: 9,
      homeTeamId: null,
      awayTeamId: null,
      kickoff: '2026-11-17T20:00:00+06:00',
      venue: 'National Stadium, Dhaka',
      groupLetter: null,
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
      teamsConfirmed: 0,
    },
  ];

  const seedMatches = db.transaction(() => {
    for (const match of initialMatches) {
      insertMatch.run(match);
    }
  });
  seedMatches();
}
