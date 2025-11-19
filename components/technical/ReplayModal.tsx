'use client';

import { useState } from 'react';

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReplayModal({ isOpen, onClose }: ReplayModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [replaySpeed, setReplaySpeed] = useState<'0.5x' | '1x' | '2x' | '5x'>('1x');
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="replay-modal">
        <div className="replay-modal__header">
          <h3>Mode Replay</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="replay-modal__body">
          {/* Date Selection */}
          <div className="form-group">
            <label className="form-label">Date de départ</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Speed Control */}
          <div className="form-group">
            <label className="form-label">Vitesse de replay</label>
            <div className="speed-selector">
              {(['0.5x', '1x', '2x', '5x'] as const).map((speed) => (
                <button
                  key={speed}
                  className={`speed-btn ${replaySpeed === speed ? 'active' : ''}`}
                  onClick={() => setReplaySpeed(speed)}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="replay-controls">
            <button className="replay-control-btn" title="Précédent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>
            
            <button
              className="replay-control-btn replay-control-btn--play"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button className="replay-control-btn" title="Suivant">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="replay-progress">
            <div className="replay-progress__bar">
              <div className="replay-progress__fill" style={{ width: '35%' }} />
            </div>
            <div className="replay-progress__time">
              <span>35%</span>
              <span>Jan 15, 2024</span>
            </div>
          </div>
        </div>

        <div className="replay-modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Fermer
          </button>
          <button className="btn btn--primary">
            Démarrer Replay
          </button>
        </div>
      </div>
    </>
  );
}
