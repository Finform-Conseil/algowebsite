'use client';

import { useState } from 'react';
import { TOOL_GROUPS, DRAWING_ACTIONS, getToolsByGroup } from '@/config/drawingToolsRegistry';
import { MagnetMode } from '@/types/drawingTools';

interface DrawingToolsV2Props {
  selectedTool: string;
  onSelectTool: (toolId: string) => void;
  magnetMode: MagnetMode;
  onMagnetModeChange: (mode: MagnetMode) => void;
  stayInDrawingMode: boolean;
  onStayInDrawingModeChange: (stay: boolean) => void;
  drawingsLocked: boolean;
  onDrawingsLockedChange: (locked: boolean) => void;
  drawingsVisible: boolean;
  onDrawingsVisibleChange: (visible: boolean) => void;
  onRemoveAll: () => void;
}

export default function DrawingToolsV2({
  selectedTool,
  onSelectTool,
  magnetMode,
  onMagnetModeChange,
  stayInDrawingMode,
  onStayInDrawingModeChange,
  drawingsLocked,
  onDrawingsLockedChange,
  drawingsVisible,
  onDrawingsVisibleChange,
  onRemoveAll,
}: DrawingToolsV2Props) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const handleGroupClick = (groupId: string) => {
    setOpenGroupId(openGroupId === groupId ? null : groupId);
  };

  const handleToolSelect = (toolId: string) => {
    onSelectTool(toolId);
    setOpenGroupId(null);
  };

  const handleMagnetToggle = () => {
    const modes: MagnetMode[] = ['off', 'weak', 'strong'];
    const currentIndex = modes.indexOf(magnetMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onMagnetModeChange(modes[nextIndex]);
  };

  const getIconSvg = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      cursor: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
      ),
      crosshair: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      'trending-up': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      'arrow-right': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      ),
      minus: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      'separator-vertical': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      ),
      plus: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      square: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        </svg>
      ),
      circle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      type: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
      'arrow-up': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      ),
      'arrow-down': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      ),
      magnet: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 15v-2a6 6 0 1 1 12 0v2" />
          <path d="M6 15v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
        </svg>
      ),
      pin: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
        </svg>
      ),
      lock: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      'eye-off': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ),
      'trash-2': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      ),
    };
    return icons[iconName] || icons.cursor;
  };

  return (
    <div className="drawing-tools-v2">
      {/* Tool Groups */}
      <div className="tool-groups">
        {TOOL_GROUPS.map((group) => {
          const tools = getToolsByGroup(group.id);
          const isOpen = openGroupId === group.id;
          const isGroupActive = tools.some(t => t.id === selectedTool);

          return (
            <div key={group.id} className="tool-group-container">
              <button
                className={`tool-group-btn ${isGroupActive ? 'active' : ''}`}
                onClick={() => handleGroupClick(group.id)}
                title={group.label}
              >
                {getIconSvg(group.icon)}
              </button>

              {isOpen && (
                <div className="tool-flyout">
                  <div className="tool-flyout-header">{group.label}</div>
                  <div className="tool-flyout-items">
                    {tools.map((tool) => (
                      <button
                        key={tool.id}
                        className={`tool-flyout-item ${selectedTool === tool.id ? 'active' : ''}`}
                        onClick={() => handleToolSelect(tool.id)}
                      >
                        {getIconSvg(tool.icon)}
                        <span>{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Separator */}
      <div className="tool-separator" />

      {/* Actions */}
      <div className="tool-actions">
        {/* Magnet */}
        <button
          className={`tool-action-btn ${magnetMode !== 'off' ? 'active' : ''}`}
          onClick={handleMagnetToggle}
          title={`Aimant: ${magnetMode === 'off' ? 'Désactivé' : magnetMode === 'weak' ? 'Faible' : 'Fort'}`}
        >
          {getIconSvg('magnet')}
          {magnetMode !== 'off' && (
            <span className="magnet-indicator">{magnetMode === 'weak' ? 'W' : 'S'}</span>
          )}
        </button>

        {/* Stay in Drawing Mode */}
        <button
          className={`tool-action-btn ${stayInDrawingMode ? 'active' : ''}`}
          onClick={() => onStayInDrawingModeChange(!stayInDrawingMode)}
          title="Rester en mode dessin"
        >
          {getIconSvg('pin')}
        </button>

        {/* Lock */}
        <button
          className={`tool-action-btn ${drawingsLocked ? 'active' : ''}`}
          onClick={() => onDrawingsLockedChange(!drawingsLocked)}
          title="Verrouiller les dessins"
        >
          {getIconSvg('lock')}
        </button>

        {/* Hide */}
        <button
          className={`tool-action-btn ${!drawingsVisible ? 'active' : ''}`}
          onClick={() => onDrawingsVisibleChange(!drawingsVisible)}
          title="Masquer les dessins"
        >
          {getIconSvg('eye-off')}
        </button>

        {/* Remove All */}
        <button
          className="tool-action-btn danger"
          onClick={onRemoveAll}
          title="Supprimer tous les dessins"
        >
          {getIconSvg('trash-2')}
        </button>
      </div>
    </div>
  );
}
