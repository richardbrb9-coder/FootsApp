import React from 'react';
import './TitleScreen.css';

export default function TitleScreen({ onStartClick }) {
  return (
    <div className="modern-title-screen">
      <div className="modern-content-wrapper">
        {/* Empty space filler that forces everything below it down to the bottom */}
        <div className="flex-spacer"></div>

        <div className="bottom-action-container">
          <button className="modern-start-btn" onClick={onStartClick}>
            Start Game
          </button>
          
          <div className="modern-footer">
            <span>© 2026 Flags of the World</span>
          </div>
        </div>
      </div>
    </div>
  );
}