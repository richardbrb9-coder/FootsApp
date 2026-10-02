import React from 'react';
import './ScoreScreen.css';

export default function ScoreScreen({ scoreData, onPlayAgain, onHome }) {
  const isTwoPlayer = scoreData?.playerMode === '2P';

  return (
    <div className="score-screen">
      <div className="trophy-icon">🏆</div>
      <h2 className="score-title">Game Over!</h2>

      <div className="score-card-container">
        {isTwoPlayer ? (
          <div className="two-player-scores">
            <div className="player-final-score">
              <h3>{scoreData.p1Name || 'Player 1'}</h3>
              <p className="points-display">{scoreData.p1Score || 0} pts</p>
            </div>
            <div className="player-final-score">
              <h3>{scoreData.p2Name || 'Player 2'}</h3>
              <p className="points-display">{scoreData.p2Score || 0} pts</p>
            </div>
          </div>
        ) : (
          <div className="single-player-score">
            <h3>{scoreData?.p1Name || 'Player'}</h3>
            <p className="points-display">{scoreData?.p1Score || 0} Points</p>
          </div>
        )}
      </div>

      <div className="score-actions">
        <button className="retro-button primary" onClick={onPlayAgain}>Play Again</button>
        <button className="retro-button secondary" onClick={onHome}>Main Menu</button>
      </div>
    </div>
  );
}