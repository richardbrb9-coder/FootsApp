import { useEffect, useReducer, useRef, useState } from 'react';
import {
  TIMER_MODES,
  buildResult,
  createGame,
  currentCountry,
  formatClock,
  gameReducer,
  isFinalTurn,
  pointsAvailable,
  POINTS_BY_CLUES,
} from '../utils/gameEngine';
import { IconArrowRight, IconBulb, IconCheck, IconClock, IconSkip, IconX } from './Icons';
import './Gameplay.css';

const NUMBER_KEYS = ['1', '2', '3', '4', '5'];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function Gameplay({ config, onEndGame, onReturnToOptions }) {
  // All game state lives in one reducer (see utils/gameEngine.js)
  const [state, dispatch] = useReducer(gameReducer, config, createGame);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const endedRef = useRef(false);

  const { turn, players, active, timerMode, rounds, playerMode } = state;
  const player = players[active];
  const country = currentCountry(state);
  const revealed = turn.phase === 'revealed';
  const paused = confirmQuit;

  // --- Clock: one tick per second while a question is open ------------------
  const ticking = timerMode !== TIMER_MODES.none && !revealed && !paused && !state.finished;
  useEffect(() => {
    if (!ticking) return undefined;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [ticking, state.turnCount]);

  // --- Move on automatically after the answer is shown (cleared on unmount) --
  useEffect(() => {
    if (!revealed || paused) return undefined;
    const delay = turn.outcome === 'correct' ? 1400 : 2400;
    const id = setTimeout(() => dispatch({ type: 'NEXT' }), delay);
    return () => clearTimeout(id);
  }, [revealed, paused, turn.outcome, state.turnCount]);

  // --- Hand the result back exactly once ------------------------------------
  useEffect(() => {
    if (state.finished && !endedRef.current) {
      endedRef.current = true;
      onEndGame(buildResult(state));
    }
  }, [state, onEndGame]);

  // --- Keyboard shortcuts ----------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        setConfirmQuit((open) => !open);
        return;
      }
      if (confirmQuit || !country) return;

      if (revealed) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dispatch({ type: 'NEXT' });
        }
        return;
      }

      const key = e.key.toUpperCase();
      let idx = NUMBER_KEYS.indexOf(e.key);
      if (idx === -1) idx = LETTERS.indexOf(key);
      if (idx >= 0 && idx < country.options.length) {
        dispatch({ type: 'ANSWER', option: country.options[idx] });
      } else if (key === 'H') {
        dispatch({ type: 'HINT' });
      } else if (key === 'S') {
        dispatch({ type: 'SKIP' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmQuit, revealed, country]);

  if (!country) return <div className="screen game-screen" />;

  // --- Derived display values -----------------------------------------------
  const totalTurns = rounds * players.length;
  const turnsDone = players.reduce((sum, p) => sum + p.answered, 0) + (revealed ? 1 : 0);
  const progress = Math.min(100, (turnsDone / totalTurns) * 100);
  const worth = pointsAvailable(turn);
  const hintsLeft = country.hints.length - turn.clues;
  const nextHintCost = worth - POINTS_BY_CLUES[Math.min(turn.clues + 1, POINTS_BY_CLUES.length - 1)];
  const finalTurn = revealed && isFinalTurn(state);

  const attackPct = timerMode === TIMER_MODES.attack ? (turn.timeLeft / state.attackSeconds) * 100 : 0;
  const clockValue =
    timerMode === TIMER_MODES.attack ? `${turn.timeLeft}s` : timerMode === TIMER_MODES.trial ? formatClock(player.timeLeft) : null;
  const clockWarning =
    (timerMode === TIMER_MODES.attack && turn.timeLeft <= 5) || (timerMode === TIMER_MODES.trial && player.timeLeft <= 10);

  const optionState = (opt) => {
    if (turn.wrong.includes(opt)) return 'is-wrong';
    if (!revealed) return '';
    return opt === country.name ? 'is-correct' : 'is-dim';
  };

  const feedback = (() => {
    if (!revealed) return null;
    const answer = <strong>{country.name}</strong>;
    switch (turn.outcome) {
      case 'correct':
        return {
          tone: 'success',
          text: (
            <>
              Correct! <strong>+{turn.points} pts</strong>
              {player.streak >= 3 && <span className="streak"> · {player.streak} in a row</span>}
            </>
          ),
        };
      case 'wrong':
        return { tone: 'danger', text: <>Not quite — it's {answer}</> };
      case 'timeout':
        return { tone: 'danger', text: <>Time's up — it's {answer}</> };
      default:
        return { tone: 'neutral', text: <>Skipped — it's {answer}</> };
    }
  })();

  return (
    <div className="screen game-screen">
      <div className="game-wrap">
        {/* Top bar: quit · progress · score */}
        <header className="game-topbar">
          <button className="btn btn-ghost btn-icon" onClick={() => setConfirmQuit(true)} aria-label="Quit game">
            <IconX />
          </button>
          <div className="progress">
            <div className="progress-label">
              <span>
                Flag {Math.min(player.answered + 1, rounds)} <span className="muted">of {rounds}</span>
              </span>
              {playerMode === '1P' && <span className="score-label">{player.score} pts</span>}
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        {/* Two-player scoreboard */}
        {playerMode === '2P' && (
          <div className="scoreboard">
            {players.map((p, i) => (
              <div key={i} className={`player-tile ${i === active ? 'is-active' : ''} ${p.done ? 'is-done' : ''}`}>
                <div className="player-tile-top">
                  <span className="player-tile-name">{p.name}</span>
                  {i === active ? (
                    <span className="turn-tag">Your turn</span>
                  ) : p.done ? (
                    <span className="turn-tag done">Finished</span>
                  ) : null}
                </div>
                <div className="player-tile-bottom">
                  <span className="player-tile-score">{p.score}</span>
                  <span className="player-tile-meta">
                    {timerMode === TIMER_MODES.trial && <>{formatClock(p.timeLeft)} · </>}
                    {p.answered}/{rounds}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question card */}
        <main className="card quiz-card">
          {timerMode === TIMER_MODES.attack && (
            <div className="turn-timer" aria-hidden="true">
              <div
                key={state.turnCount}
                className={`turn-timer-fill ${clockWarning ? 'warn' : ''}`}
                style={{ width: `${attackPct}%` }}
              />
            </div>
          )}

          <div className="quiz-meta">
            <span className="worth-chip">
              {revealed ? 'Answer' : <>Worth <strong>{worth}</strong> pts</>}
            </span>
            {clockValue && (
              <span className={`clock-chip ${clockWarning && !revealed ? 'warn' : ''}`}>
                <IconClock width={15} height={15} /> {clockValue}
              </span>
            )}
          </div>

          <div className="flag-stage">
            <img
              key={`${country.id}-${state.turnCount}`}
              src={country.flag}
              alt="Flag to identify"
              className="flag-img"
              draggable="false"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          </div>

          <h2 className="quiz-prompt">
            {playerMode === '2P' ? `${player.name}, which country is this?` : 'Which country is this?'}
          </h2>

          <div className="answer-list">
            {country.options.map((opt, idx) => {
              const s = optionState(opt);
              return (
                <button
                  key={opt}
                  className={`answer-btn ${s}`}
                  onClick={() => dispatch({ type: 'ANSWER', option: opt })}
                  disabled={revealed || turn.wrong.includes(opt)}
                >
                  <span className="answer-key">{LETTERS[idx]}</span>
                  <span className="answer-text">{opt}</span>
                  {s === 'is-correct' && <IconCheck className="answer-icon" />}
                  {s === 'is-wrong' && <IconX className="answer-icon" />}
                </button>
              );
            })}
          </div>

          {turn.clues > 0 && (
            <ol className="hint-list">
              {country.hints.slice(0, turn.clues).map((hint) => (
                <li key={hint} className="hint-item">
                  <IconBulb width={16} height={16} />
                  <span>{hint}</span>
                </li>
              ))}
            </ol>
          )}

          <footer className="quiz-footer">
            {feedback ? (
              <div className={`feedback feedback-${feedback.tone}`} role="status">
                <span className="feedback-text">{feedback.text}</span>
                <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'NEXT' })}>
                  {finalTurn ? 'See results' : 'Next'} <IconArrowRight width={16} height={16} />
                </button>
              </div>
            ) : (
              <>
                {turn.wrong.length > 0 && <p className="try-again">Not quite — here's a clue. Try again.</p>}
                <div className="quiz-actions">
                  <button className="btn" onClick={() => dispatch({ type: 'HINT' })} disabled={hintsLeft <= 0}>
                    <IconBulb width={16} height={16} />
                    {hintsLeft > 0 ? (
                      <>
                        Hint <span className="cost">−{nextHintCost}</span>
                      </>
                    ) : (
                      'No hints left'
                    )}
                  </button>
                  <button className="btn btn-ghost" onClick={() => dispatch({ type: 'SKIP' })}>
                    <IconSkip width={16} height={16} /> Skip
                  </button>
                </div>
              </>
            )}
          </footer>
        </main>

        <p className="kbd-tip">
          Keys: <kbd>A</kbd>–<kbd>{LETTERS[country.options.length - 1]}</kbd> answer · <kbd>H</kbd> hint ·{' '}
          <kbd>S</kbd> skip · <kbd>Enter</kbd> next
        </p>
      </div>

      {confirmQuit && (
        <div className="modal-backdrop" onClick={() => setConfirmQuit(false)}>
          <div className="card modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Leave this game?</h3>
            <p>Your progress in this game won't be saved.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmQuit(false)} autoFocus>
                Keep playing
              </button>
              <button className="btn btn-primary" onClick={onReturnToOptions}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}