import { create } from 'zustand';
import type { BracketPicks, MatchPrediction } from '../types';

interface PredictorState {
  bracketPicks: BracketPicks;
  matchPredictions: Record<string, MatchPrediction>;
  cardUserName: string;

  setBracketPick: <K extends keyof BracketPicks>(key: K, value: BracketPicks[K]) => void;
  setAllBracketPicks: (picks: BracketPicks) => void;
  resetBracketPicks: () => void;

  setMatchPrediction: (matchId: string, prediction: MatchPrediction) => void;
  clearMatchPrediction: (matchId: string) => void;
  resetMatchPredictions: () => void;

  setCardUserName: (name: string) => void;
}

const BRACKET_STORAGE_KEY = 'saff_2026_bracket_picks';
const MATCHES_STORAGE_KEY = 'saff_2026_match_predictions';
const USERNAME_STORAGE_KEY = 'saff_2026_user_name';

const initialBracketPicks: BracketPicks = {
  groupAFirst: null,
  groupASecond: null,
  groupBFirst: null,
  groupBSecond: null,
  sf1Winner: null,
  sf2Winner: null,
  champion: null,
};

function loadStoredBracket(): BracketPicks {
  try {
    const raw = localStorage.getItem(BRACKET_STORAGE_KEY);
    return raw ? { ...initialBracketPicks, ...JSON.parse(raw) } : initialBracketPicks;
  } catch {
    return initialBracketPicks;
  }
}

function loadStoredMatches(): Record<string, MatchPrediction> {
  try {
    const raw = localStorage.getItem(MATCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadStoredUserName(): string {
  try {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export const usePredictorStore = create<PredictorState>((set, get) => ({
  bracketPicks: loadStoredBracket(),
  matchPredictions: loadStoredMatches(),
  cardUserName: loadStoredUserName(),

  setBracketPick: (key, value) => {
    const current = get().bracketPicks;
    const updated = { ...current, [key]: value };

    // Cascade validation across all knockout stages
    // SF1 contenders are Group B 1st vs Group A 2nd
    const validSf1Contenders = [updated.groupBFirst, updated.groupASecond].filter(Boolean);
    if (updated.sf1Winner && !validSf1Contenders.includes(updated.sf1Winner)) {
      updated.sf1Winner = null;
    }

    // SF2 contenders are Group A 1st vs Group B 2nd
    const validSf2Contenders = [updated.groupAFirst, updated.groupBSecond].filter(Boolean);
    if (updated.sf2Winner && !validSf2Contenders.includes(updated.sf2Winner)) {
      updated.sf2Winner = null;
    }

    // Grand Final contenders are SF1 winner vs SF2 winner
    const validFinalContenders = [updated.sf1Winner, updated.sf2Winner].filter(Boolean);
    if (updated.champion && !validFinalContenders.includes(updated.champion)) {
      updated.champion = null;
    }

    try {
      localStorage.setItem(BRACKET_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    set({ bracketPicks: updated });
  },

  setAllBracketPicks: (picks) => {
    try {
      localStorage.setItem(BRACKET_STORAGE_KEY, JSON.stringify(picks));
    } catch {}
    set({ bracketPicks: picks });
  },

  resetBracketPicks: () => {
    try {
      localStorage.removeItem(BRACKET_STORAGE_KEY);
    } catch {}
    set({ bracketPicks: initialBracketPicks });
  },

  setMatchPrediction: (matchId, prediction) => {
    const updated = {
      ...get().matchPredictions,
      [matchId]: prediction,
    };
    try {
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ matchPredictions: updated });
  },

  clearMatchPrediction: (matchId) => {
    const current = { ...get().matchPredictions };
    delete current[matchId];
    try {
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(current));
    } catch {}
    set({ matchPredictions: current });
  },

  resetMatchPredictions: () => {
    try {
      localStorage.removeItem(MATCHES_STORAGE_KEY);
    } catch {}
    set({ matchPredictions: {} });
  },

  setCardUserName: (name) => {
    try {
      localStorage.setItem(USERNAME_STORAGE_KEY, name);
    } catch {}
    set({ cardUserName: name });
  },
}));
