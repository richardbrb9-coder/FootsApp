import React, { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import GameOptions from './components/GameOptions';
import Gameplay from './components/Gameplay';
import TrophyScreen from './components/TrophyScreen';

export default function App() {
  const [screen, setScreen] = useState('title'); // 'title' | 'options' | 'game' | 'trophy'
  const [gameConfig, setGameConfig] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  const handleStartClick = () => {
    setScreen('options');
  };

  const handleStartGame = (config) => {
    setGameConfig(config);
    setScreen('game');
  };

  const handleEndGame = (resultData) => {
    setGameResult(resultData);
    setScreen('trophy');
  };

  const handleReturnToOptions = () => {
    setScreen('options');
  };

  return (
    <div className="app-container">
      {screen === 'title' && <TitleScreen onStartClick={handleStartClick} />}
      
      {screen === 'options' && (
        <GameOptions 
          onBack={() => setScreen('title')} 
          onStartGame={handleStartGame} 
        />
      )}

      {screen === 'game' && (
        <Gameplay 
          config={gameConfig} 
          onReturnToOptions={handleReturnToOptions} 
          onEndGame={handleEndGame} 
        />
      )}

      {screen === 'trophy' && (
        <TrophyScreen 
          gameResult={gameResult} 
          onPlayAgain={() => setScreen('game')} 
          onReturnToOptions={handleReturnToOptions} 
        />
      )}
    </div>
  );
}