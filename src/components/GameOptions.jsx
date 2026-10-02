import React, { useState } from 'react';
import './GameOptions.css';

const ALL_CONTINENTS = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania'];

export default function GameOptions({ onBack, onStartGame }) {
  const [playerMode, setPlayerMode] = useState('1P');
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [roundLength, setRoundLength] = useState(10);
  const [selectedContinents, setSelectedContinents] = useState(['Europe']);
  const [timerMode, setTimerMode] = useState('No Timers');
  const [timerDuration, setTimerDuration] = useState(15);

  const handleTimerModeChange = (mode) => {
    setTimerMode(mode);
    if (mode === 'Time Attack') setTimerDuration(15);
    if (mode === 'Time Trial') setTimerDuration(140);
  };

  const handleContinentToggle = (continent) => {
    setSelectedContinents(prev => {
      if (prev.includes(continent)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== continent);
      } else {
        return [...prev, continent];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedContinents([...ALL_CONTINENTS]);
  };

  const handleStart = () => {
    onStartGame({
      playerMode,
      player1Name,
      player2Name,
      roundLength,
      selectedContinents,
      timerMode,
      timerDuration
    });
  };

  return (
    <div className="modern-options-screen">
      <div className="modern-options-card">
        <h2>Game Options</h2>
        
        <div className="modern-option-group">
          <label>Player Mode</label>
          <div className="modern-button-row">
            <button className={playerMode === '1P' ? 'active' : ''} onClick={() => setPlayerMode('1P')}>1 Player</button>
            <button className={playerMode === '2P' ? 'active' : ''} onClick={() => setPlayerMode('2P')}>2 Players</button>
          </div>
        </div>

        <div className="modern-option-group">
          <label>Player Name(s)</label>
          <input type="text" value={player1Name} onChange={(e) => setPlayer1Name(e.target.value)} className="modern-input" />
          {playerMode === '2P' && (
            <input type="text" value={player2Name} onChange={(e) => setPlayer2Name(e.target.value)} className="modern-input" style={{ marginTop: '10px' }} />
          )}
        </div>

        <div className="modern-option-group">
          <label>Round Length</label>
          <select value={roundLength} onChange={(e) => setRoundLength(Number(e.target.value))} className="modern-select">
            <option value={10}>10 Flags</option>
            <option value={20}>20 Flags</option>
            <option value={25}>25 Flags</option>
            <option value={40}>40 Flags</option>
          </select>
        </div>

        <div className="modern-option-group">
          <label>Continents</label>
          <div className="modern-continents-grid">
            {ALL_CONTINENTS.map((continent) => (
              <label key={continent} className="continent-checkbox">
                <input
                  type="checkbox"
                  checked={selectedContinents.includes(continent)}
                  onChange={() => handleContinentToggle(continent)}
                />
                <span>{continent}</span>
              </label>
            ))}
          </div>
          <button className="modern-btn-small" onClick={handleSelectAll}>Select All</button>
        </div>

        <div className="modern-option-group">
          <label>Timer Mode</label>
          <select value={timerMode} onChange={(e) => handleTimerModeChange(e.target.value)} className="modern-select">
            <option value="No Timers">No Timers</option>
            <option value="Time Attack">Time Attack</option>
            <option value="Time Trial">Time Trial</option>
          </select>
          {timerMode === 'Time Attack' && (
            <div className="modern-option-group">
              <label>Round Time</label>
              <select value={timerDuration} onChange={(e) => setTimerDuration(Number(e.target.value))} className="modern-select">
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds</option>
              </select>
            </div>
          )}
          {timerMode === 'Time Trial' && (
            <div className="modern-option-group">
              <label>Total Round Time</label>
              <select value={timerDuration} onChange={(e) => setTimerDuration(Number(e.target.value))} className="modern-select">
                <option value={140}>2 Minutes 20 Seconds</option>
                <option value={210}>3 Minutes 30 Seconds</option>
                <option value={300}>5 Minutes</option>
              </select>
            </div>
          )}
        </div>

        <div className="modern-action-row">
          <button className="modern-btn secondary" onClick={onBack}>Back</button>
          <button className="modern-btn primary" onClick={handleStart}>Start Game</button>
        </div>
      </div>
    </div>
  );
}