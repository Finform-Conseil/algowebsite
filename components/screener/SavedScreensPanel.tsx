'use client';

import { useState } from 'react';
import { ActiveFilter } from '@/core/data/StockScreenerV2';

interface SavedScreen {
  id: string;
  name: string;
  filters: ActiveFilter[];
  createdAt: Date;
  folder?: string;
}

interface SavedScreensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScreen: (filters: ActiveFilter[]) => void;
  currentFilters: ActiveFilter[];
}

export default function SavedScreensPanel({
  isOpen,
  onClose,
  onLoadScreen,
  currentFilters,
}: SavedScreensPanelProps) {
  const [savedScreens, setSavedScreens] = useState<SavedScreen[]>([
    {
      id: '1',
      name: 'Dividend Kings',
      filters: [],
      createdAt: new Date(),
      folder: 'Dividendes',
    },
    {
      id: '2',
      name: 'Tech Undervalued',
      filters: [],
      createdAt: new Date(),
      folder: 'Tech',
    },
    {
      id: '3',
      name: 'Low Debt Growth',
      filters: [],
      createdAt: new Date(),
      folder: 'Croissance',
    },
  ]);
  const [newScreenName, setNewScreenName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');

  const folders = Array.from(new Set(savedScreens.map((s) => s.folder).filter(Boolean)));

  const handleSaveCurrentScreen = () => {
    if (!newScreenName.trim()) return;

    const newScreen: SavedScreen = {
      id: Date.now().toString(),
      name: newScreenName,
      filters: currentFilters,
      createdAt: new Date(),
      folder: selectedFolder || undefined,
    };

    setSavedScreens([...savedScreens, newScreen]);
    setNewScreenName('');
    setSelectedFolder('');
  };

  const handleDeleteScreen = (id: string) => {
    setSavedScreens(savedScreens.filter((s) => s.id !== id));
  };

  const handleLoadScreen = (screen: SavedScreen) => {
    onLoadScreen(screen.filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="saved-screens-overlay" onClick={onClose} />
      <div className="saved-screens-panel">
        <div className="saved-screens-panel__header">
          <h3>Screens Sauvegardés</h3>
          <button className="saved-screens-panel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="saved-screens-panel__body">
          {/* Sauvegarder le screen actuel */}
          {currentFilters.length > 0 && (
            <div className="save-current-screen">
              <h4>Sauvegarder le screen actuel</h4>
              <input
                type="text"
                placeholder="Nom du screen..."
                value={newScreenName}
                onChange={(e) => setNewScreenName(e.target.value)}
                className="screen-name-input"
              />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="folder-select"
              >
                <option value="">Sans dossier</option>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
                <option value="__new__">+ Nouveau dossier</option>
              </select>
              <button className="save-screen-btn" onClick={handleSaveCurrentScreen}>
                Sauvegarder
              </button>
            </div>
          )}

          {/* Liste des screens sauvegardés */}
          <div className="saved-screens-list">
            <h4>Mes Screens ({savedScreens.length})</h4>

            {folders.map((folder) => (
              <div key={folder} className="folder-group">
                <div className="folder-header">{folder}</div>
                <div className="folder-screens">
                  {savedScreens
                    .filter((s) => s.folder === folder)
                    .map((screen) => (
                      <div key={screen.id} className="saved-screen-item">
                        <div className="screen-info">
                          <div className="screen-name">{screen.name}</div>
                          <div className="screen-meta">
                            {screen.filters.length} filtres •{' '}
                            {new Date(screen.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="screen-actions">
                          <button
                            className="screen-action-btn screen-action-btn--load"
                            onClick={() => handleLoadScreen(screen)}
                          >
                            Charger
                          </button>
                          <button
                            className="screen-action-btn screen-action-btn--delete"
                            onClick={() => handleDeleteScreen(screen.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {/* Screens sans dossier */}
            {savedScreens.filter((s) => !s.folder).length > 0 && (
              <div className="folder-group">
                <div className="folder-header">Sans dossier</div>
                <div className="folder-screens">
                  {savedScreens
                    .filter((s) => !s.folder)
                    .map((screen) => (
                      <div key={screen.id} className="saved-screen-item">
                        <div className="screen-info">
                          <div className="screen-name">{screen.name}</div>
                          <div className="screen-meta">
                            {screen.filters.length} filtres •{' '}
                            {new Date(screen.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="screen-actions">
                          <button
                            className="screen-action-btn screen-action-btn--load"
                            onClick={() => handleLoadScreen(screen)}
                          >
                            Charger
                          </button>
                          <button
                            className="screen-action-btn screen-action-btn--delete"
                            onClick={() => handleDeleteScreen(screen.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
