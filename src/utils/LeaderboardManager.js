// LeaderboardManager handles saving/loading top scores to localStorage
// Browser-compatible implementation for PWA and regular web
// Stores leaderboard data in browser localStorage

export const LEADERBOARD_STORAGE_KEY = 'fotw_leaderboard_v1';
const MAX_ENTRIES = 100;

// Default leaderboard structure (a factory, so callers never share/mutate one array)
export const createEmptyLeaderboard = () => ({
  topScores: [],
  totalGamesPlayed: 0,
  lastUpdated: new Date().toISOString(),
});

export const defaultLeaderboard = createEmptyLeaderboard();

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Highest score first; on a tie, whoever got there first ranks higher
const byRank = (a, b) => b.score - a.score || String(a.date).localeCompare(String(b.date));

// Load leaderboard from localStorage
export function loadLeaderboard() {
  try {
    const data = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!data) return createEmptyLeaderboard();

    const parsed = JSON.parse(data);
    if (!parsed || !Array.isArray(parsed.topScores)) return createEmptyLeaderboard();
    return parsed;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return createEmptyLeaderboard();
  }
}

// Save leaderboard to localStorage
export function saveLeaderboard(data) {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid leaderboard data');
    }

    const topScores = Array.isArray(data.topScores) ? [...data.topScores] : [];
    // Sort BEFORE trimming so a new high score is never cut off
    topScores.sort(byRank);

    const sanitized = {
      topScores: topScores.slice(0, MAX_ENTRIES),
      totalGamesPlayed: data.totalGamesPlayed || 0,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (error) {
    console.error('Error saving leaderboard:', error);
    return false;
  }
}

/**
 * Add every player's result from one finished game.
 * @param {Array<{playerName: string, score: number, playerMode: string}>} entries
 * @returns {{ leaderboard: object, ids: string[] }} the saved board and the new entry ids
 */
export function addScores(entries) {
  const leaderboard = loadLeaderboard();
  const date = new Date().toISOString();

  const newEntries = entries.map((entry) => ({
    ...entry,
    id: makeId(),
    playerName: entry.playerName?.trim() || 'Player',
    score: Number(entry.score) || 0,
    date: entry.date || date,
  }));

  leaderboard.topScores = [...leaderboard.topScores, ...newEntries];
  leaderboard.totalGamesPlayed = (leaderboard.totalGamesPlayed || 0) + 1;

  saveLeaderboard(leaderboard);
  return { leaderboard: loadLeaderboard(), ids: newEntries.map((e) => e.id) };
}

// Add a single score to the leaderboard (kept for backwards compatibility)
export function addScore(playerName, score, playerMode, timestamp = null) {
  return addScores([{ playerName, score, playerMode, date: timestamp || undefined }]).leaderboard;
}

// Get top N scores
export function getTopScores(count = 10) {
  return loadLeaderboard().topScores.slice(0, count);
}

// Clear leaderboard
export function clearLeaderboard() {
  localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
}

// Get leaderboard stats
export function getLeaderboardStats() {
  const leaderboard = loadLeaderboard();
  return {
    totalEntries: leaderboard.topScores.length,
    highestScore: leaderboard.topScores.length > 0 ? leaderboard.topScores[0].score : 0,
    topEntry: leaderboard.topScores[0] || null,
    totalGamesPlayed: leaderboard.totalGamesPlayed || 0,
    lastUpdated: leaderboard.lastUpdated,
  };
}

export default {
  loadLeaderboard,
  saveLeaderboard,
  addScore,
  addScores,
  getTopScores,
  clearLeaderboard,
  getLeaderboardStats,
};