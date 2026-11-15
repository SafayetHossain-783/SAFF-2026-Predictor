import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'saff2026';

app.use(cors());
app.use(express.json());

// Public: Server clock and lock state
app.get('/api/time', (_req: Request, res: Response) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('bracketLockTime') as { value: string } | undefined;
  const demoRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('demoMode') as { value: string } | undefined;

  const bracketLockTime = row ? row.value : '2026-11-05T15:30:00+06:00';
  const isDemo = demoRow ? demoRow.value === '1' : true;

  // Simulated 01 Nov 2026 12:00 BST in demo mode, or real current time
  const now = isDemo ? new Date('2026-11-01T12:00:00+06:00') : new Date();
  const lockDate = new Date(bracketLockTime);

  res.json({
    now: now.toISOString(),
    bracketLockTime,
    bracketLocked: isDemo ? false : now.getTime() >= lockDate.getTime(),
    demoMode: isDemo,
  });
});

// Public: Get all teams
app.get('/api/teams', (_req: Request, res: Response) => {
  const teams = db.prepare('SELECT *, groupLetter as "group" FROM teams ORDER BY groupLetter ASC, name ASC').all();
  res.json(teams);
});

// Public: Get all matches with team data and lock status
app.get('/api/matches', (_req: Request, res: Response) => {
  const matches = db.prepare(`
    SELECT 
      m.*,
      ht.name as homeTeamName, ht.shortName as homeTeamShortName, ht.flagCode as homeTeamFlagCode, ht.groupLetter as homeTeamGroup,
      at.name as awayTeamName, at.shortName as awayTeamShortName, at.flagCode as awayTeamFlagCode, at.groupLetter as awayTeamGroup
    FROM matches m
    LEFT JOIN teams ht ON m.homeTeamId = ht.id
    LEFT JOIN teams at ON m.awayTeamId = at.id
    ORDER BY m.matchNumber ASC
  `).all();

  const demoRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('demoMode') as { value: string } | undefined;
  const isDemo = demoRow ? demoRow.value === '1' : true;
  const now = isDemo ? new Date('2026-11-01T12:00:00+06:00').getTime() : new Date().getTime();

  const formatted = matches.map((m: any) => {
    const kickoffTime = new Date(m.kickoff).getTime();
    return {
      id: m.id,
      stage: m.stage,
      matchNumber: m.matchNumber,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      kickoff: m.kickoff,
      venue: m.venue,
      groupLetter: m.groupLetter,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      penaltyWinner: m.penaltyWinner,
      teamsConfirmed: Boolean(m.teamsConfirmed),
      locked: isDemo ? false : now >= kickoffTime,
      homeTeam: m.homeTeamId ? {
        id: m.homeTeamId,
        name: m.homeTeamName,
        shortName: m.homeTeamShortName,
        flagCode: m.homeTeamFlagCode,
        group: m.homeTeamGroup,
      } : null,
      awayTeam: m.awayTeamId ? {
        id: m.awayTeamId,
        name: m.awayTeamName,
        shortName: m.awayTeamShortName,
        flagCode: m.awayTeamFlagCode,
        group: m.awayTeamGroup,
      } : null,
    };
  });

  res.json(formatted);
});

// Admin authentication middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-admin-token'];

  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }
};

// Admin: Login verify
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Incorrect admin password' });
  }
});

// Admin: Save/Update team
app.post('/api/admin/teams', requireAdmin, (req: Request, res: Response) => {
  const { id, name, shortName, flagCode, groupLetter } = req.body;
  if (!id || !name || !shortName || !flagCode || !groupLetter) {
    return res.status(400).json({ error: 'Missing required team fields' });
  }

  const upsert = db.prepare(`
    INSERT INTO teams (id, name, shortName, flagCode, groupLetter)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      shortName = excluded.shortName,
      flagCode = excluded.flagCode,
      groupLetter = excluded.groupLetter
  `);

  upsert.run(id.toUpperCase().trim(), name.trim(), shortName.toUpperCase().trim(), flagCode.toUpperCase().trim(), groupLetter.toUpperCase().trim());
  res.json({ success: true, message: 'Saved' });
});

// Admin: Delete team
app.delete('/api/admin/teams/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;

  // Unset references in matches and mark teams as unconfirmed
  db.prepare('UPDATE matches SET homeTeamId = NULL, teamsConfirmed = 0 WHERE homeTeamId = ?').run(id);
  db.prepare('UPDATE matches SET awayTeamId = NULL, teamsConfirmed = 0 WHERE awayTeamId = ?').run(id);
  db.prepare('DELETE FROM teams WHERE id = ?').run(id);

  res.json({ success: true, message: 'Team deleted' });
});

// Admin: Edit match fixture (preserves scores)
app.put('/api/admin/matches/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, matchNumber, homeTeamId, awayTeamId, kickoff, venue, groupLetter } = req.body;

  const home = homeTeamId || null;
  const away = awayTeamId || null;
  const isConfirmed = Boolean(home && away) ? 1 : 0;

  const update = db.prepare(`
    UPDATE matches
    SET stage = COALESCE(?, stage),
        matchNumber = COALESCE(?, matchNumber),
        homeTeamId = ?,
        awayTeamId = ?,
        kickoff = COALESCE(?, kickoff),
        venue = COALESCE(?, venue),
        groupLetter = ?,
        teamsConfirmed = ?
    WHERE id = ?
  `);

  update.run(stage, matchNumber, home, away, kickoff, venue, groupLetter || null, isConfirmed, id);
  res.json({ success: true, message: 'Saved' });
});

// Admin: Confirm Knockout Teams
app.post('/api/admin/knockouts/confirm', requireAdmin, (req: Request, res: Response) => {
  const { matchId, homeTeamId, awayTeamId } = req.body;
  if (!matchId) {
    return res.status(400).json({ error: 'matchId is required' });
  }

  const update = db.prepare(`
    UPDATE matches
    SET homeTeamId = ?,
        awayTeamId = ?,
        teamsConfirmed = 1
    WHERE id = ?
  `);

  update.run(homeTeamId || null, awayTeamId || null, matchId);
  res.json({ success: true, message: 'Saved' });
});

// Admin: Update Match Result
app.post('/api/admin/results/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { homeScore, awayScore, penaltyWinner } = req.body;

  const update = db.prepare(`
    UPDATE matches
    SET homeScore = ?,
        awayScore = ?,
        penaltyWinner = ?
    WHERE id = ?
  `);

  update.run(
    homeScore !== null && homeScore !== undefined && homeScore !== '' ? Number(homeScore) : null,
    awayScore !== null && awayScore !== undefined && awayScore !== '' ? Number(awayScore) : null,
    penaltyWinner || null,
    id
  );

  res.json({ success: true, message: 'Saved' });
});

// Admin: Update bracket lock time
app.post('/api/admin/lock-time', requireAdmin, (req: Request, res: Response) => {
  const { bracketLockTime } = req.body;
  if (!bracketLockTime) {
    return res.status(400).json({ error: 'bracketLockTime is required' });
  }

  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('bracketLockTime', bracketLockTime);
  res.json({ success: true, message: 'Saved' });
});

// Admin: Get settings (demo mode & lock time)
app.get('/api/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  const demoRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('demoMode') as { value: string } | undefined;
  const lockRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('bracketLockTime') as { value: string } | undefined;
  res.json({
    demoMode: demoRow ? demoRow.value === '1' : true,
    bracketLockTime: lockRow ? lockRow.value : '2026-11-05T15:30:00+06:00',
  });
});

// Admin: Toggle Demo Mode
app.post('/api/admin/demo-mode', requireAdmin, (req: Request, res: Response) => {
  const { demoMode } = req.body;
  const value = demoMode ? '1' : '0';
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('demoMode', value);
  res.json({ success: true, demoMode: Boolean(demoMode), message: `Demo mode ${demoMode ? 'enabled' : 'disabled'}` });
});

// Admin: Reset all match scores to unplayed
app.post('/api/admin/reset-scores', requireAdmin, (_req: Request, res: Response) => {
  db.prepare('UPDATE matches SET homeScore = NULL, awayScore = NULL, penaltyWinner = NULL').run();
  res.json({ success: true, message: 'All match scores reset to unplayed' });
});

// Serve frontend in production if built
const distDir = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});