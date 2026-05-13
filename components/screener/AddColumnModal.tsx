'use client';

import { useState } from 'react';
import { COLUMN_CATEGORIES, ColumnDefinition, ColumnCategory } from '@/core/data/ColumnRegistry';

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (columnId: string) => boolean;
  hasColumn: (columnId: string) => boolean;
  isLimitReached: boolean;
  maxColumns: number;
}

export default function AddColumnModal({
  isOpen,
  onClose,
  onAddColumn,
  hasColumn,
  isLimitReached,
  maxColumns,
}: AddColumnModalProps) {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  // Filtrer les catégories et colonnes en fonction de la recherche
  const filteredCategories = COLUMN_CATEGORIES.map((category) => {
    const filteredColumns = category.columns.filter((column) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        column.name.toLowerCase().includes(query) ||
        column.description.toLowerCase().includes(query) ||
        column.id.toLowerCase().includes(query)
      );
    });

    return {
      ...category,
      columns: filteredColumns,
    };
  }).filter((category) => category.columns.length > 0);

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
  };

  const handleSelectColumn = (column: ColumnDefinition) => {
    setSelectedColumn(column);
  };

  const handleAddColumn = () => {
    if (!selectedColumn) return;
    
    const success = onAddColumn(selectedColumn.id);
    if (success) {
      setSelectedColumn(null);
      onClose();
    }
  };

  return (
    <>
      <div className="filter-modal-overlay" onClick={onClose} />
      <div className="filter-modal filter-modal--two-column">
        {/* Header */}
        <div className="filter-modal__header">
          <div className="filter-modal__header-content">
            <h3>Add Custom Column</h3>
            <p className="filter-modal__subtitle">
              Select a metric to add to your custom columns ({maxColumns - (isLimitReached ? maxColumns : 0)}/{maxColumns} available)
            </p>
          </div>
          <button className="filter-modal__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="filter-modal__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search for a column..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="filter-modal__body">
          {/* Left Column - Categories Navigation */}
          <div className="filter-modal__navigation">
            {filteredCategories.length === 0 ? (
              <div className="config-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h4>No results found</h4>
                <p>Try adjusting your search query</p>
              </div>
            ) : (
              <div className="families-nav">
                {filteredCategories.map((category) => {
                  const isExpanded = searchQuery ? true : expandedCategoryId === category.id;

                  return (
                    <div key={category.id} className="family-nav-item">
                      <button
                        className={`family-nav-item__header ${isExpanded ? 'active' : ''}`}
                        onClick={() => handleToggleCategory(category.id)}
                      >
                        {/* <span className="family-icon">{category.icon}</span> */}
                        <span className="family-name">{category.name}</span>
                        <span className="subfamily-count">({category.columns.length})</span>
                        <svg 
                          className={`chevron ${isExpanded ? 'expanded' : ''}`}
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="criteria-nav-list">
                          {category.columns.map((column) => {
                            const isAdded = hasColumn(column.id);
                            const isSelected = selectedColumn?.id === column.id;

                            return (
                              <button
                                key={column.id}
                                className={`criterion-nav-item ${isSelected ? 'active' : ''} ${isAdded ? 'disabled' : ''}`}
                                onClick={() => !isAdded && handleSelectColumn(column)}
                                disabled={isAdded}
                              >
                                <span className="criterion-nav-name">{column.name}</span>
                                {isAdded ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column - Column Preview */}
          <div className="filter-modal__config">
            {selectedColumn ? (
              <>
                <div className="config-header">
                  <h4 className="config-title">{selectedColumn.name}</h4>
                  <span className="config-badge">
                    {selectedColumn.type === 'percentage' ? 'Percentage' : 
                     selectedColumn.type === 'currency' ? 'Currency' :
                     selectedColumn.type === 'boolean' ? 'Boolean' : 'Number'}
                  </span>
                </div>

                <div className="config-description">
                  <div className="description-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>Description</span>
                  </div>
                  <p className="description-text">{selectedColumn.description}</p>
                </div>

                <div className="config-form">
                  <div className="form-section">
                    <label className="form-label">Field Path</label>
                    <div className="field-path-display">
                      <code>{selectedColumn.field}</code>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Backend Field</label>
                    <div className="field-path-display">
                      <code>{selectedColumn.backendField}</code>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setSelectedColumn(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary config-form__apply" 
                      onClick={handleAddColumn}
                      disabled={isLimitReached || hasColumn(selectedColumn.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      {hasColumn(selectedColumn.id) ? 'Already Added' : isLimitReached ? 'Limit Reached' : 'Add Column'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="config-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <h4>Select a Column</h4>
                <p>Choose a metric from the left menu to preview and add it to your custom columns</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
