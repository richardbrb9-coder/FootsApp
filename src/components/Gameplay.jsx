import React, { useState, useEffect } from 'react';
import { COUNTRIES_DATA } from '../data/countries';
import './Gameplay.css';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Gameplay({ config, onEndGame, onReturnToOptions }) {
  const playerMode = config?.playerMode || '1P';
  const player1Name = config?.player1Name || 'Player 1';
  const player2Name = config?.player2Name || 'Player 2';
  const maxRounds = config?.roundLength || 10;
  
  const rawContinents = config?.selectedContinents || config?.selectedContinent || ['Europe'];
  const targetContinents = Array.isArray(rawContinents) ? rawContinents : [rawContinents];
  
  const timerMode = config?.timerMode || 'No Timers';
  const initialTimeSetting = config?.timerDuration || 15;

  const [p1Queue, setP1Queue] = useState([]);
  const [p2Queue, setP2Queue] = useState([]);
  
  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(0);

  const [activePlayer, setActivePlayer] = useState(1);

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  
  const [cluesRevealedCount, setCluesRevealedCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [roundCounter, setRoundCounter] = useState(1);

  const [timeLeft, setTimeLeft] = useState(initialTimeSetting);

  useEffect(() => {
    const filtered = COUNTRIES_DATA.filter(c => 
      targetContinents.includes('All') || targetContinents.includes(c.continent)
    );
    
    setP1Queue(shuffleArray(filtered));
    setP2Queue(shuffleArray(filtered));

    if (playerMode === '2P') {
      const randomFirst = Math.random() < 0.5 ? 1 : 2;
      setActivePlayer(randomFirst);
    }
  }, [config]);

  const currentCountry = activePlayer === 1 ? p1Queue[p1Index] : p2Queue?.[p2Index];

  useEffect(() => {
    if (timerMode === 'NoTimers' || timerMode === 'No Timers') return;
    setTimeLeft(initialTimeSetting);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [p1Index, p2Index, activePlayer, timerMode, initialTimeSetting]);

  useEffect(() => {
    if (timerMode !== 'NoTimers' && timerMode !== 'No Timers' && timeLeft === 0 && currentCountry) {
      handleTimeOut();
    }
  }, [timeLeft]);

  const handleTimeOut = () => {
    if (!currentCountry) return;

    if (timerMode === 'Time Attack') {
      setFeedbackMessage(`Time's up! It was ${currentCountry.name}. 0 pts`);
      setTimeout(() => {
        advanceTurnOrRound();
      }, 1500);
    } else if (timerMode === 'Time Trial') {
      setFeedbackMessage('Time Trial Finished!');
      setTimeout(() => {
        triggerEndGame();
      }, 1500);
    }
  };

  const handleAnswerSelection = (selectedOption) => {
    if (!currentCountry) return;

    if (selectedOption === currentCountry.name) {
      // Tiered scoring: 10pts (0 clues), 7pts (1 clue), 5pts (2 clues), 3pts (3 clues)
      let pointsEarned = 3;
      if (cluesRevealedCount === 0) pointsEarned = 10;
      else if (cluesRevealedCount === 1) pointsEarned = 7;
      else if (cluesRevealedCount === 2) pointsEarned = 5;
      else if (cluesRevealedCount >= 3) pointsEarned = 3;

      setFeedbackMessage(`Correct! +${pointsEarned} pts`);

      if (activePlayer === 1) {
        setP1Score(prev => prev + pointsEarned);
      } else {
        setP2Score(prev => prev + pointsEarned);
      }

      setTimeout(() => {
        advanceTurnOrRound();
      }, 1200);

    } else {
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);

      if (nextWrong >= 2 || cluesRevealedCount >= 3) {
        setFeedbackMessage(`Incorrect! It was ${currentCountry.name}. 0 pts`);
        setTimeout(() => {
          advanceTurnOrRound();
        }, 1500);
      } else {
        setCluesRevealedCount(prev => Math.min(prev + 1, 3));
        setFeedbackMessage('Wrong! Next clue revealed.');
      }
    }
  };

  const handleRevealClue = () => {
    if (cluesRevealedCount < 3) {
      setCluesRevealedCount(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setFeedbackMessage('Flag skipped!');
    setTimeout(() => {
      advanceTurnOrRound();
    }, 800);
  };

  const triggerEndGame = () => {
    onEndGame({ 
      playerMode, 
      player1Name, 
      player2Name, 
      p1Score, 
      p2Score 
    });
  };

  const advanceTurnOrRound = () => {
    setCluesRevealedCount(0);
    setWrongAttempts(0);
    setFeedbackMessage('');

    if (playerMode === '2P') {
      if (activePlayer === 1) {
        setActivePlayer(2);
      } else {
        setActivePlayer(1);
        if (roundCounter >= maxRounds) {
          triggerEndGame();
        } else {
          setRoundCounter(prev => prev + 1);
          setP1Index(prev => prev + 1);
          setP2Index(prev => prev + 1);
        }
      }
    } else {
      if (roundCounter >= maxRounds) {
        triggerEndGame();
      } else {
        setRoundCounter(prev => prev + 1);
        setP1Index(prev => prev + 1);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs < 10 ? '0' : ''}${secs}s` : `${secs}s`;
  };

  if (!currentCountry || !p2Queue) return <div className="gameplay-screen">Loading Question...</div>;

  return (
    <div className="gameplay-screen">
      <div className="game-header">
        <button className="modern-action-btn" style={{ flex: 'unset', width: 'auto', padding: '8px 16px' }} onClick={onReturnToOptions}>OPTIONS</button>
        <span>ROUND: {roundCounter} / {maxRounds}</span>
        {timerMode !== 'No Timers' && timerMode !== 'NoTimers' && (
          <div className={`timer-display ${timeLeft <= 5 ? 'warning-timer' : ''}`}>
            {timerMode === 'Time Attack' ? `TIME: ${timeLeft}s` : `TRIAL: ${formatTime(timeLeft)}`}
          </div>
        )}
      </div>

      {playerMode === '2P' ? (
        <div className="split-screen-container">
          <div className={`gameplay-card player-card ${activePlayer === 1 ? 'active-card' : 'inactive-card'}`}>
            <h3>{player1Name} {activePlayer === 1 ? '⭐ (YOUR TURN)' : ''} | Score: {p1Score}</h3>
            {activePlayer === 1 && renderQuizArea()}
          </div>
          <div className={`gameplay-card player-card ${activePlayer === 2 ? 'active-card' : 'inactive-card'}`}>
            <h3>{player2Name} {activePlayer === 2 ? '⭐ (YOUR TURN)' : ''} | Score: {p2Score}</h3>
            {activePlayer === 2 && renderQuizArea()}
          </div>
        </div>
      ) : (
        <div className="single-player-container">
          <div className="gameplay-card">
            <div className="player-stats-bar">
              <span>PLAYER: {player1Name}</span>
              <span>SCORE: {p1Score}</span>
            </div>
            {renderQuizArea()}
          </div>
        </div>
      )}
    </div>
  );

  function renderQuizArea() {
    const displayedOptions = currentCountry.options.slice(0, 5);

    return (
      <div className="quiz-box">
        <div className="flag-display">
          <img 
            src={currentCountry.flag} 
            alt={`Flag of ${currentCountry.name}`} 
            className="flag-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="options-grid">
          {displayedOptions.map((opt, idx) => (
            <button key={idx} className="modern-choice-btn" onClick={() => handleAnswerSelection(opt)}>
              {opt}?
            </button>
          ))}
        </div>

        <div className="clues-box">
          {cluesRevealedCount === 0 ? (
            <p className="clue-text" style={{ fontStyle: 'italic', color: '#94a3b8' }}>Clues hidden. Click 'Reveal Clue' if needed!</p>
          ) : (
            currentCountry.clues.slice(0, cluesRevealedCount).map((clue, idx) => (
              <p key={idx} className="clue-text">Clue {idx + 1}: {clue}</p>
            ))
          )}
        </div>

        {feedbackMessage && <p className="feedback-text">{feedbackMessage}</p>}

        <div className="game-controls">
          {cluesRevealedCount < 3 && (
            <button className="modern-action-btn reveal-btn" onClick={handleRevealClue}>REVEAL CLUE</button>
          )}
          <button className="modern-action-btn skip-btn" onClick={handleSkip}>SKIP FLAG?</button>
        </div>
      </div>
    );
  }
}