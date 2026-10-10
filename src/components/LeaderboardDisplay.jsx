const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardDisplay({ leaderboard = [], highlightIds = [], limit = 10 }) {
  const top = leaderboard.slice(0, limit);
  const highlight = new Set(highlightIds);

  // If a new score didn't make the top list, show where it landed underneath
  const outside = leaderboard
    .map((entry, index) => ({ entry, rank: index + 1 }))
    .filter(({ entry, rank }) => rank > limit && highlight.has(entry.id));

  const renderRow = (entry, rank) => {
    const isNew = highlight.has(entry.id);
    const meta = [
      entry.rounds ? `${entry.correct ?? '–'}/${entry.rounds}` : null,
      entry.continents,
      entry.playerMode === '2P' ? '2P' : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <li key={entry.id} className={`lb-row ${isNew ? 'is-new' : ''}`}>
        <span className="lb-rank">{rank <= 3 ? MEDALS[rank - 1] : rank}</span>
        <span className="lb-player">
          <span className="lb-name">
            {entry.playerName}
            {isNew && <span className="lb-new">New</span>}
          </span>
          {meta && <span className="lb-meta">{meta}</span>}
        </span>
        <span className="lb-score">{entry.score}</span>
      </li>
    );
  };

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <h2>Leaderboard</h2>
        {top.length > 0 && <span className="lb-sub">Top {top.length}</span>}
      </div>

      {top.length === 0 ? (
        <p className="lb-empty">Finish a game to get on the board.</p>
      ) : (
        <ol className="lb-list">
          {top.map((entry, i) => renderRow(entry, i + 1))}
          {outside.length > 0 && <li className="lb-gap" aria-hidden="true">···</li>}
          {outside.map(({ entry, rank }) => renderRow(entry, rank))}
        </ol>
      )}
    </div>
  );
}