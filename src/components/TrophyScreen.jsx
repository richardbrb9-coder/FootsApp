import React from 'react';
import './TrophyScreen.css';

export default function TrophyScreen({ results, onPlayAgain, onReturnToOptions }) {
  const { playerMode, player1Name, player2Name, p1Score, p2Score } = results || {};

  return (
    <div className="trophy-screen">
      <div className="trophy-card">
        <h2>Game Over</h2>
        
        <div className="trophy-display">
          <div className="trophy-display-content">
            {playerMode === '2P' ? (
              <>
                <div className="player-score-line" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '3.5rem' }}>🥇</span>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '1.3rem', color: '#1e293b' }}>{player1Name}</span>
                    <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#2563eb', marginLeft: '6px' }}>:</span>
                    <span style={{ fontSize: '1.1rem', marginLeft: '4px', color: '#2563eb' }}>{p1Score} pts</span>
                  </div>
                </div>
                <div className="player-score-line" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '3.5rem' }}>🥈</span>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '1.3rem', color: '#1e293b' }}>{player2Name}</span>
                    <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#2563eb', marginLeft: '6px' }}>:</span>
                    <span style={{ fontSize: '1.1rem', marginLeft: '4px', color: '#2563eb' }}>{p2Score} pts</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>
                  {p1Score > p2Score ? `${player1Name} Wins!` : p2Score > p1Score ? `${player2Name} Wins!` : "It's a Tie!"}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '4rem' }}>🏆</span>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.6rem', color: '#0f172a' }}>{player1Name}'s Final Score:</span>
                    <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>{p1Score} pts</span>
                  </div>
                  <p style={{ marginTop: '6px', fontSize: '0.95rem', color: '#64748b', margin: 0, textAlign: 'center' }}>Ready for next round?</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="leaderboard-section">
          <h3>Leaderboard</h3>
          <div className="no-scores">Scores saved to browser storage.</div>
        </div>

        <div className="action-row">
          <button className="modern-button secondary" onClick={onReturnToOptions}>OPTIONS</button>
          <button className="modern-button primary" onClick={onPlayAgain}>PLAY AGAIN</button>
        </div>
      </div>
    </div>
  );
}