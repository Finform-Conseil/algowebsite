'use client';

import { useState } from 'react';

interface DrawingToolsProps {
  onSelectTool: (tool: string) => void;
  selectedTool?: string;
}

const DRAWING_TOOLS = [
  {
    id: 'cursor',
    name: 'Curseur',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
    ),
  },
  {
    id: 'line',
    name: 'Ligne',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="19" x2="19" y2="5" />
      </svg>
    ),
  },
  {
    id: 'trendline',
    name: 'Ligne de tendance',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 20 8 16 12 18 16 14 20 16" />
        <line x1="4" y1="20" x2="20" y2="12" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'horizontal',
    name: 'Ligne horizontale',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    id: 'vertical',
    name: 'Ligne verticale',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'cross',
    name: 'Croix',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'parallel',
    name: 'Lignes parallèles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    ),
  },
  {
    id: 'ray',
    name: 'Rayon',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="4" cy="20" r="1" fill="currentColor" />
        <line x1="5" y1="19" x2="21" y2="3" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="7" width="14" height="10" />
      </svg>
    ),
  },
  {
    id: 'circle',
    name: 'Cercle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    id: 'triangle',
    name: 'Triangle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5 L4 19 L20 19 Z" />
      </svg>
    ),
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="20" x2="20" y2="4" />
        <line x1="4" y1="4" x2="20" y2="4" strokeDasharray="2 2" />
        <line x1="4" y1="8" x2="20" y2="8" strokeDasharray="2 2" />
        <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" />
        <line x1="4" y1="16" x2="20" y2="16" strokeDasharray="2 2" />
        <line x1="4" y1="20" x2="20" y2="20" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: 'pitchfork',
    name: 'Fourche d\'Andrews',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="12" y1="4" x2="4" y2="20" />
        <line x1="12" y1="4" x2="20" y2="20" />
      </svg>
    ),
  },
  {
    id: 'arrow',
    name: 'Flèche',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="19" x2="19" y2="5" />
        <polyline points="13 5 19 5 19 11" />
      </svg>
    ),
  },
  {
    id: 'text',
    name: 'Texte',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    id: 'note',
    name: 'Note',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'measure',
    name: 'Règle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 3L3 21" />
        <path d="M7 7L5 9" />
        <path d="M11 11L9 13" />
        <path d="M15 15L13 17" />
        <path d="M19 19L17 21" />
      </svg>
    ),
  },
  {
    id: 'brush',
    name: 'Pinceau',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 5l4 4" />
        <path d="M13 7L8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
        <path d="M8 6l2-2" />
        <path d="M13 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M9 16h6" />
      </svg>
    ),
  },
  {
    id: 'eraser',
    name: 'Gomme',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 20H8l-6-6 8-8 8 8-2 2" />
        <path d="M16 16l2 2" />
      </svg>
    ),
  },
];

export default function DrawingTools({ onSelectTool, selectedTool = 'cursor' }: DrawingToolsProps) {
  return (
    <div className="drawing-tools-sidebar">
      {DRAWING_TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`drawing-tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
          onClick={() => onSelectTool(tool.id)}
          title={tool.name}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
