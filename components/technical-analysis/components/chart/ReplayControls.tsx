"use client";

import React from "react";

export interface ReplayControlsProps {
  isPaused: boolean;
  speed: number;
  currentIndex: number;
  totalCandles: number;
  currentTime?: string;
  onTogglePause: () => void;
  onStepForward: () => void;
  onSpeedChange: (speedMs: number) => void;
  onJumpToRealtime: () => void;
  onExit: () => void;
}

const SPEED_OPTIONS = [
  { label: "0.5x", value: 2000 },
  { label: "1x", value: 1000 },
  { label: "2x", value: 500 },
  { label: "4x", value: 250 },
  { label: "10x", value: 100 },
] as const;

const formatReplayTime = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPaused,
  speed,
  currentIndex,
  totalCandles,
  currentTime,
  onTogglePause,
  onStepForward,
  onSpeedChange,
  onJumpToRealtime,
  onExit,
}) => {
  const progress = totalCandles > 0 ? Math.min(100, ((currentIndex + 1) / totalCandles) * 100) : 0;
  const isAtEnd = totalCandles > 0 && currentIndex >= totalCandles - 1;

  return (
    <div className="gp-replay-controls" role="toolbar" aria-label="Contrôles Bar Replay">
      <div className="gp-replay-controls__status" aria-live="polite">
        <span className="gp-replay-controls__dot" aria-hidden="true" />
        <strong>Bar Replay</strong>
        <span className="gp-replay-controls__time">{formatReplayTime(currentTime)}</span>
      </div>

      <div className="gp-replay-controls__actions">
        <button
          type="button"
          className="gp-replay-controls__button"
          onClick={onTogglePause}
          disabled={isAtEnd}
          aria-label={isPaused ? "Lire le replay" : "Mettre le replay en pause"}
          title={isPaused ? "Lire" : "Pause"}
        >
          <i className={`bi ${isPaused ? "bi-play-fill" : "bi-pause-fill"}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="gp-replay-controls__button"
          onClick={onStepForward}
          disabled={isAtEnd}
          aria-label="Avancer d'une bougie"
          title="Avancer d'une bougie"
        >
          <i className="bi bi-skip-forward-fill" aria-hidden="true" />
        </button>

        <label className="gp-replay-controls__speed" title="Vitesse de lecture">
          <span className="visually-hidden">Vitesse de lecture</span>
          <select
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            aria-label="Vitesse du Bar Replay"
          >
            {SPEED_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="gp-replay-controls__progress" aria-label={`${currentIndex + 1} sur ${totalCandles} bougies`}>
          <span>{Math.min(currentIndex + 1, totalCandles)}/{totalCandles}</span>
          <span className="gp-replay-controls__progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
        </div>

        <button
          type="button"
          className="gp-replay-controls__button gp-replay-controls__button--text"
          onClick={onJumpToRealtime}
          title="Revenir au graphique temps réel"
        >
          <i className="bi bi-lightning-fill" aria-hidden="true" />
          <span>Temps réel</span>
        </button>
        <button
          type="button"
          className="gp-replay-controls__button"
          onClick={onExit}
          aria-label="Quitter Bar Replay"
          title="Quitter Bar Replay"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
