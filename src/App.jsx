import { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import GameOptions from './components/GameOptions';
import Gameplay from './components/Gameplay';
import TrophyScreen from './components/TrophyScreen';
import LeaderboardManager from './utils/LeaderboardManager';
import { describeContinents } from './utils/gameEngine';

export default function App() {
  const [screen, setScreen] = useState('title'); // 'title' | 'options' | 'game' | 'trophy'
  const [gameConfig, setGameConfig] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [gameId, setGameId] = useState(0); // forces a fresh Gameplay on "Play again"

  const handleStartClick = () => {
    setScreen('options');
  };

  const handleStartGame = (config) => {
    setGameConfig(config);
    setGameId((id) => id + 1);
    setScreen('game');
  };

  // Scores are saved exactly once, here, when the game ends (not during render)
  const handleEndGame = (result) => {
    const { leaderboard, ids } = LeaderboardManager.addScores(
      result.players.map((p) => ({
        playerName: p.name,
        score: p.score,
        playerMode: result.playerMode,
        correct: p.correct,
        rounds: result.rounds,
        timerMode: result.timerMode,
        continents: describeContinents(result.continents),
      }))
    );
    setGameResult({ ...result, newEntryIds: ids, leaderboard: leaderboard.topScores });
    setScreen('trophy');
  };

  const handleReturnToOptions = () => {
    setScreen('options');
  };

  const handlePlayAgain = () => {
    setGameId((id) => id + 1);
    setScreen('game');
  };

  return (
    <div className="app-container">
      {screen === 'title' && <TitleScreen onStartClick={handleStartClick} />}

      {screen === 'options' && (
        <GameOptions onBack={() => setScreen('title')} onStartGame={handleStartGame} />
      )}

      {screen === 'game' && (
        <Gameplay
          key={gameId}
          config={gameConfig}
          onReturnToOptions={handleReturnToOptions}
          onEndGame={handleEndGame}
        />
      )}

      {screen === 'trophy' && (
        <TrophyScreen
          gameResult={gameResult}
          onPlayAgain={handlePlayAgain}
          onReturnToOptions={handleReturnToOptions}
        />
      )}
    </div>
  );
}