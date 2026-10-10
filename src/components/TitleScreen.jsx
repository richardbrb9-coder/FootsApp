import { useState } from 'react';
import { COUNTRIES_DATA } from '../data/countries';
import { ALL_CONTINENTS } from '../utils/gameEngine';
import LeaderboardManager from '../utils/LeaderboardManager';
import { IconArrowRight, IconTrophy } from './Icons';
import './TitleScreen.css';

const ROW_A = ['gb', 'jp', 'br', 'ca', 'de', 'za', 'in', 'kr', 'mx', 'se', 'ng', 'ar', 'tr', 'au', 'ke', 'fr'];
const ROW_B = ['us', 'it', 'cn', 'gr', 'eg', 'no', 'pt', 'nz', 'ch', 'ie', 'np', 'co', 'ua', 'ma', 'jm', 'sa'];

function FlagRow({ ids, reverse }) {
  // Rendered twice so the strip can loop seamlessly
  const flags = [...ids, ...ids];
  return (
    <div className={`flag-row ${reverse ? 'reverse' : ''}`} aria-hidden="true">
      <div className="flag-track">
        {flags.map((id, i) => (
          <img key={`${id}-${i}`} src={`/images/flags/${id}.svg`} alt="" className="flag-tile" draggable="false" />
        ))}
      </div>
    </div>
  );
}

export default function TitleScreen({ onStartClick }) {
  const [best] = useState(() => LeaderboardManager.getLeaderboardStats().topEntry);

  return (
    <div className="screen title-screen">
      <div className="title-content">
        <span className="title-badge">The flag quiz</span>
        <h1 className="title-heading">
          Flags of the <span>World</span>
        </h1>
        <p className="title-tagline">
          {COUNTRIES_DATA.length} flags · {ALL_CONTINENTS.length} continents · solo or head-to-head
        </p>
      </div>

      <div className="title-marquee">
        <FlagRow ids={ROW_A} />
        <FlagRow ids={ROW_B} reverse />
      </div>

      <div className="title-actions">
        <button className="btn btn-primary btn-lg title-play" onClick={onStartClick} autoFocus>
          Start game <IconArrowRight />
        </button>
        {best && (
          <p className="title-best">
            <IconTrophy width={15} height={15} /> Best score <strong>{best.score} pts</strong> by {best.playerName}
          </p>
        )}
      </div>

      <footer className="title-footer">© 2026 Flags of the World</footer>
    </div>
  );
}