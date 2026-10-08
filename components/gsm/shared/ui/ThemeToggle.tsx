'use client';

import { Moon, Sun } from 'lucide-react';

type ThemeToggleProps = {
  dark: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <div
      className="gsm-theme-toggle"
      role="group"
      aria-label="Thème d'affichage"
    >
      <button
        type="button"
        className="gsm-theme-toggle__option"
        data-active={!dark || undefined}
        aria-pressed={!dark}
        onClick={() => dark && onToggle()}
        title="Activer le mode clair"
      >
        <Sun size={14} aria-hidden="true" />
        <span>Clair</span>
      </button>

      <button
        type="button"
        className="gsm-theme-toggle__option"
        data-active={dark || undefined}
        aria-pressed={dark}
        onClick={() => !dark && onToggle()}
        title="Activer le mode sombre"
      >
        <Moon size={14} aria-hidden="true" />
        <span>Sombre</span>
      </button>
    </div>
  );
}
