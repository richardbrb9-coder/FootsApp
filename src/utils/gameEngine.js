// Core quiz logic, kept free of React so it is easy to reason about and test.
// All game state changes go through `gameReducer`, which means a turn can only
// be resolved once (no double-scoring from fast clicks) and timers never fire
// against a stale question.

import { COUNTRIES_DATA } from '../data/countries.js';

export const ALL_CONTINENTS = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'];

// Tiered scoring: 10pts (0 clues), 7pts (1 clue), 5pts (2 clues), 3pts (3 clues)
export const POINTS_BY_CLUES = [10, 7, 5, 3];

export const TIMER_MODES = {
  none: 'none',
  attack: 'attack', // fixed time per flag
  trial: 'trial', // one clock per player for the whole game
};

export const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export function getPool(continents) {
  if (!continents?.length || continents.includes('All')) return COUNTRIES_DATA;
  const wanted = new Set(continents);
  return COUNTRIES_DATA.filter((c) => wanted.has(c.continent));
}

export function countByContinent() {
  const counts = {};
  COUNTRIES_DATA.forEach((c) => {
    counts[c.continent] = (counts[c.continent] || 0) + 1;
  });
  return counts;
}

/**
 * Turns the raw dataset clues into up to three useful hints, ordered from
 * weakest to strongest. Filler text is dropped, and the continent is only
 * mentioned when it actually narrows things down.
 */
export function buildClues(country, singleContinent) {
  const find = (prefix) => country.clues.find((c) => c.startsWith(prefix));
  const capital = find('Capital city:');
  const language = find('Official language');
  const borders = find('Borders:');
  const trait = country.clues.find((c) =>
    ['Landlocked nation', 'Caribbean island nation', 'Island or large coastal nation'].includes(c)
  );

  const where = singleContinent ? '' : ` in ${country.continent}`;
  let descriptor = null;
  if (trait === 'Landlocked nation') descriptor = `Landlocked nation${where}`;
  else if (trait === 'Caribbean island nation') descriptor = 'Caribbean island nation';
  else if (trait) descriptor = `Island or coastal nation${where}`;
  else if (!singleContinent) descriptor = `Located in ${country.continent}`;

  const list = [descriptor, language, borders, capital].filter(Boolean);
  // Keep three clues, always finishing on the strongest one (usually the capital)
  if (list.length > 3) list.splice(list.length - 2, 1);
  return list.length ? list : country.clues.slice(0, 3);
}

const newTurn = (state) => ({
  clues: 0,
  wrong: [],
  phase: 'answering', // 'answering' | 'revealed'
  outcome: null, // 'correct' | 'wrong' | 'timeout' | 'skipped'
  points: 0,
  timeLeft: state.timerMode === TIMER_MODES.attack ? state.attackSeconds : null,
});

export function createGame(config = {}) {
  const playerMode = config.playerMode === '2P' ? '2P' : '1P';
  const continents = config.selectedContinents?.length ? config.selectedContinents : ['Europe'];
  const pool = getPool(continents);
  const rounds = Math.max(1, Math.min(config.roundLength || 10, pool.length));
  const singleContinent = continents.length === 1 && continents[0] !== 'All';
  const timerMode = TIMER_MODES[config.timerMode] ? config.timerMode : TIMER_MODES.none;
  const attackSeconds = config.attackSeconds || 15;
  const trialSeconds = config.trialSeconds || 120;

  const names = playerMode === '2P' ? [config.player1Name, config.player2Name] : [config.player1Name];

  const players = names.map((name, i) => ({
    name: name?.trim() || `Player ${i + 1}`,
    score: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: timerMode === TIMER_MODES.trial ? trialSeconds : null,
    done: false,
    // Each player gets their own shuffled flags and shuffled answer order
    queue: shuffle(pool)
      .slice(0, rounds)
      .map((c) => ({ ...c, options: shuffle(c.options), hints: buildClues(c, singleContinent) })),
  }));

  const state = {
    playerMode,
    continents,
    rounds,
    timerMode,
    attackSeconds,
    trialSeconds,
    players,
    active: playerMode === '2P' ? (Math.random() < 0.5 ? 0 : 1) : 0,
    turnCount: 0,
    finished: false,
  };
  state.turn = newTurn(state);
  return state;
}

export const currentCountry = (state) => {
  const p = state.players[state.active];
  return p.queue[p.answered];
};

export const pointsAvailable = (turn) => POINTS_BY_CLUES[Math.min(turn.clues, POINTS_BY_CLUES.length - 1)];

const updateActive = (state, fn) =>
  state.players.map((p, i) => (i === state.active ? fn(p) : p));

const reveal = (state, turnPatch, playerFn = (p) => p) => ({
  ...state,
  players: updateActive(state, playerFn),
  turn: { ...state.turn, ...turnPatch, phase: 'revealed' },
});

const resetStreak = (p) => ({ ...p, streak: 0 });

/** Who plays next after the current turn, or -1 if the game is over. */
function nextPlayerIndex(players, active) {
  if (players.length === 2) {
    const other = 1 - active;
    if (!players[other].done) return other;
  }
  return players[active].done ? -1 : active;
}

/** True when resolving the current turn will end the game. */
export function isFinalTurn(state) {
  const players = state.players.map((p, i) => {
    if (i !== state.active) return p;
    const answered = p.answered + 1;
    return { ...p, done: answered >= state.rounds || p.timeLeft === 0 };
  });
  return nextPlayerIndex(players, state.active) === -1;
}

export function gameReducer(state, action) {
  if (state.finished) return state;
  const { turn } = state;

  switch (action.type) {
    case 'ANSWER': {
      if (turn.phase !== 'answering' || turn.wrong.includes(action.option)) return state;
      const country = currentCountry(state);

      if (action.option === country.name) {
        const points = pointsAvailable(turn);
        return reveal(state, { outcome: 'correct', points }, (p) => ({
          ...p,
          score: p.score + points,
          correct: p.correct + 1,
          streak: p.streak + 1,
          bestStreak: Math.max(p.bestStreak, p.streak + 1),
        }));
      }

      const wrong = [...turn.wrong, action.option];
      const outOfGuesses = wrong.length >= country.options.length - 1 || turn.clues >= country.hints.length;
      if (outOfGuesses) {
        return reveal(state, { outcome: 'wrong', wrong }, resetStreak);
      }
      // Wrong but still in play: reveal the next clue automatically
      return {
        ...state,
        turn: { ...turn, wrong, clues: Math.min(turn.clues + 1, country.hints.length) },
      };
    }

    case 'HINT': {
      const country = currentCountry(state);
      if (turn.phase !== 'answering' || turn.clues >= country.hints.length) return state;
      return { ...state, turn: { ...turn, clues: turn.clues + 1 } };
    }

    case 'SKIP': {
      if (turn.phase !== 'answering') return state;
      return reveal(state, { outcome: 'skipped' }, resetStreak);
    }

    case 'TICK': {
      if (turn.phase !== 'answering') return state;

      if (state.timerMode === TIMER_MODES.attack) {
        const timeLeft = Math.max(0, turn.timeLeft - 1);
        if (timeLeft === 0) return reveal(state, { outcome: 'timeout', timeLeft }, resetStreak);
        return { ...state, turn: { ...turn, timeLeft } };
      }

      if (state.timerMode === TIMER_MODES.trial) {
        const p = state.players[state.active];
        const timeLeft = Math.max(0, p.timeLeft - 1);
        if (timeLeft === 0) {
          return reveal(state, { outcome: 'timeout' }, (pl) => ({ ...pl, timeLeft, streak: 0 }));
        }
        return { ...state, players: updateActive(state, (pl) => ({ ...pl, timeLeft })) };
      }
      return state;
    }

    case 'NEXT': {
      if (turn.phase !== 'revealed') return state;
      const players = updateActive(state, (p) => {
        const answered = p.answered + 1;
        return { ...p, answered, done: answered >= state.rounds || p.timeLeft === 0 };
      });
      const next = nextPlayerIndex(players, state.active);
      if (next === -1) {
        return { ...state, players, finished: true };
      }
      const nextState = { ...state, players, active: next, turnCount: state.turnCount + 1 };
      nextState.turn = newTurn(nextState);
      return nextState;
    }

    default:
      return state;
  }
}

/** Plain summary handed to the results screen / leaderboard. */
export function buildResult(state) {
  return {
    playerMode: state.playerMode,
    rounds: state.rounds,
    timerMode: state.timerMode,
    continents: state.continents,
    players: state.players.map(({ name, score, correct, answered, bestStreak, timeLeft }) => ({
      name,
      score,
      correct,
      answered,
      bestStreak,
      ranOutOfTime: timeLeft === 0,
    })),
  };
}

export function describeContinents(continents) {
  if (!continents?.length || continents.includes('All') || continents.length === ALL_CONTINENTS.length) {
    return 'All continents';
  }
  if (continents.length <= 2) return continents.join(' & ');
  return `${continents.length} continents`;
}

export const formatClock = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
