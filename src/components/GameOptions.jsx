import { useState } from 'react';
import { ALL_CONTINENTS, countByContinent, getPool } from '../utils/gameEngine';
import { IconArrowLeft, IconArrowRight, IconCheck } from './Icons';
import './GameOptions.css';

const SETTINGS_KEY = 'fotw_settings_v1';
const ROUND_LENGTHS = [10, 20, 25, 40];
const ATTACK_SECONDS = [10, 15, 20, 30];
const TRIAL_SECONDS = [60, 120, 180, 300];
const CONTINENT_COUNTS = countByContinent();

const DEFAULTS = {
  playerMode: '1P',
  player1Name: '',
  player2Name: '',
  roundLength: 10,
  selectedContinents: ['Europe'],
  timerMode: 'none',
  attackSeconds: 15,
  trialSeconds: 120,
};

// Remember the last-used settings between visits
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const merged = { ...DEFAULTS, ...saved };
    const continents = (merged.selectedContinents || []).filter((c) => ALL_CONTINENTS.includes(c));
    merged.selectedContinents = continents.length ? continents : DEFAULTS.selectedContinents;
    if (!['none', 'attack', 'trial'].includes(merged.timerMode)) merged.timerMode = 'none';
    return merged;
  } catch {
    return { ...DEFAULTS };
  }
}

const TIMER_INFO = {
  none: 'Take as long as you like on each flag.',
  attack: 'Beat the clock on every flag.',
  trial: 'One clock for your whole game — keep moving!',
};

export default function GameOptions({ onBack, onStartGame }) {
  const [settings, setSettings] = useState(loadSettings);
  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const { playerMode, player1Name, player2Name, roundLength, selectedContinents, timerMode } = settings;
  const poolSize = getPool(selectedContinents).length;
  const allSelected = selectedContinents.length === ALL_CONTINENTS.length;

  const handleContinentToggle = (continent) => {
    setSettings((s) => {
      const has = s.selectedContinents.includes(continent);
      if (has && s.selectedContinents.length === 1) return s; // keep at least one
      return {
        ...s,
        selectedContinents: has
          ? s.selectedContinents.filter((c) => c !== continent)
          : [...s.selectedContinents, continent],
      };
    });
  };

  const handleStart = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — not critical */
    }
    onStartGame({ ...settings, roundLength: Math.min(roundLength, poolSize) });
  };

  return (
    <div className="screen options-screen">
      <div className="options-wrap">
        <header className="options-header">
          <button className="btn btn-ghost btn-icon" onClick={onBack} aria-label="Back to title">
            <IconArrowLeft />
          </button>
          <h1>New game</h1>
        </header>

        <div className="card options-card">
          {/* Players */}
          <section className="option-section">
            <div className="option-label">Players</div>
            <div className="segmented" role="group" aria-label="Number of players">
              <button aria-pressed={playerMode === '1P'} onClick={() => set({ playerMode: '1P' })}>
                Solo
              </button>
              <button aria-pressed={playerMode === '2P'} onClick={() => set({ playerMode: '2P' })}>
                2 Players
              </button>
            </div>
            <div className={`name-fields ${playerMode === '2P' ? 'two' : ''}`}>
              <input
                className="input"
                value={player1Name}
                onChange={(e) => set({ player1Name: e.target.value })}
                placeholder={playerMode === '2P' ? 'Player 1 name' : 'Your name'}
                maxLength={18}
                aria-label="Player 1 name"
              />
              {playerMode === '2P' && (
                <input
                  className="input"
                  value={player2Name}
                  onChange={(e) => set({ player2Name: e.target.value })}
                  placeholder="Player 2 name"
                  maxLength={18}
                  aria-label="Player 2 name"
                />
              )}
            </div>
          </section>

          {/* Continents */}
          <section className="option-section">
            <div className="option-label-row">
              <div className="option-label">Continents</div>
              <button
                className="link-btn"
                onClick={() => set({ selectedContinents: allSelected ? ['Europe'] : [...ALL_CONTINENTS] })}
              >
                {allSelected ? 'Reset' : 'Select all'}
              </button>
            </div>
            <div className="chip-grid">
              {ALL_CONTINENTS.map((continent) => {
                const active = selectedContinents.includes(continent);
                return (
                  <button
                    key={continent}
                    type="button"
                    className="chip continent-chip"
                    aria-pressed={active}
                    onClick={() => handleContinentToggle(continent)}
                  >
                    <span className="chip-check">{active && <IconCheck width={14} height={14} strokeWidth={3} />}</span>
                    {continent}
                    <span className="chip-count">{CONTINENT_COUNTS[continent]}</span>
                  </button>
                );
              })}
            </div>
            <p className="option-hint">{poolSize} flags in play</p>
          </section>

          {/* Round length */}
          <section className="option-section">
            <div className="option-label">{playerMode === '2P' ? 'Flags per player' : 'Flags'}</div>
            <div className="segmented" role="group" aria-label="Number of flags">
              {ROUND_LENGTHS.map((n) => (
                <button key={n} aria-pressed={roundLength === n} onClick={() => set({ roundLength: n })}>
                  {n}
                </button>
              ))}
            </div>
            {roundLength > poolSize && (
              <p className="option-hint warn">
                Only {poolSize} flags available for this selection — the game will use all {poolSize}.
              </p>
            )}
          </section>

          {/* Timer */}
          <section className="option-section">
            <div className="option-label">Timer</div>
            <div className="segmented" role="group" aria-label="Timer mode">
              <button aria-pressed={timerMode === 'none'} onClick={() => set({ timerMode: 'none' })}>
                Relaxed
              </button>
              <button aria-pressed={timerMode === 'attack'} onClick={() => set({ timerMode: 'attack' })}>
                Time Attack
              </button>
              <button aria-pressed={timerMode === 'trial'} onClick={() => set({ timerMode: 'trial' })}>
                Time Trial
              </button>
            </div>
            <p className="option-hint">{TIMER_INFO[timerMode]}</p>

            {timerMode === 'attack' && (
              <div className="chip-row">
                {ATTACK_SECONDS.map((s) => (
                  <button
                    key={s}
                    className="chip"
                    aria-pressed={settings.attackSeconds === s}
                    onClick={() => set({ attackSeconds: s })}
                  >
                    {s}s per flag
                  </button>
                ))}
              </div>
            )}
            {timerMode === 'trial' && (
              <div className="chip-row">
                {TRIAL_SECONDS.map((s) => (
                  <button
                    key={s}
                    className="chip"
                    aria-pressed={settings.trialSeconds === s}
                    onClick={() => set({ trialSeconds: s })}
                  >
                    {s / 60} min
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="options-footer">
          <button className="btn btn-primary btn-lg options-start" onClick={handleStart}>
            Start game <IconArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}