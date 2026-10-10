import { describeContinents } from '../utils/gameEngine';
import LeaderboardDisplay from './LeaderboardDisplay';
import { IconRefresh, IconSliders, IconTrophy } from './Icons';
import './TrophyScreen.css';

const TIMER_LABELS = { none: 'Relaxed', attack: 'Time Attack', trial: 'Time Trial' };

function soloHeadline(accuracy) {
  if (accuracy >= 0.9) return 'Outstanding!';
  if (accuracy >= 0.7) return 'Great job!';
  if (accuracy >= 0.4) return 'Nice effort!';
  return 'Keep practising!';
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function TrophyScreen({ gameResult, onPlayAgain, onReturnToOptions }) {
  const players = gameResult?.players || [];
  const isTwoPlayer = gameResult?.playerMode === '2P' && players.length === 2;
  const rounds = gameResult?.rounds || 0;

  const summary = [
    `${rounds} flags${isTwoPlayer ? ' each' : ''}`,
    describeContinents(gameResult?.continents),
    TIMER_LABELS[gameResult?.timerMode] || 'Relaxed',
  ].join(' · ');

  let headline;
  let winnerIndex = -1;
  if (isTwoPlayer) {
    const [a, b] = players;
    winnerIndex = a.score === b.score ? -1 : a.score > b.score ? 0 : 1;
    headline = winnerIndex === -1 ? "It's a tie!" : `${players[winnerIndex].name} wins!`;
  } else {
    const p = players[0] || { correct: 0 };
    headline = soloHeadline(rounds ? p.correct / rounds : 0);
  }

  return (
    <div className="screen results-screen">
      <div className="results-wrap">
        <div className="card results-card">
          <div className="results-hero">
            <div className="results-badge">
              <IconTrophy width={28} height={28} />
            </div>
            <h1>{headline}</h1>
            <p className="results-summary">{summary}</p>
          </div>

          {isTwoPlayer ? (
            <div className="versus">
              {players.map((p, i) => (
                <div key={i} className={`versus-player ${i === winnerIndex ? 'is-winner' : ''}`}>
                  <span className="versus-name">{p.name}</span>
                  <span className="versus-score">{p.score}</span>
                  <span className="versus-meta">
                    {p.correct}/{rounds} correct{p.ranOutOfTime ? ' · out of time' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            players[0] && (
              <>
                <div className="solo-score">
                  <span className="solo-score-value">{players[0].score}</span>
                  <span className="solo-score-unit">points</span>
                </div>
                <div className="stats">
                  <Stat label="Correct" value={`${players[0].correct}/${rounds}`} />
                  <Stat label="Accuracy" value={`${rounds ? Math.round((players[0].correct / rounds) * 100) : 0}%`} />
                  <Stat label="Best streak" value={players[0].bestStreak} />
                </div>
              </>
            )
          )}

          <div className="results-actions">
            <button className="btn" onClick={onReturnToOptions}>
              <IconSliders width={16} height={16} /> Options
            </button>
            <button className="btn btn-primary" onClick={onPlayAgain} autoFocus>
              <IconRefresh width={16} height={16} /> Play again
            </button>
          </div>
        </div>

        <div className="card leaderboard-card">
          <LeaderboardDisplay leaderboard={gameResult?.leaderboard || []} highlightIds={gameResult?.newEntryIds || []} />
        </div>
      </div>
    </div>
  );
}