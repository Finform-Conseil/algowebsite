'use client';

import { useState, useRef, useEffect } from 'react';

type OptionType = string | { value: string; label: string };

interface MultiSelectProps {
  label: string;
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({ label, options, selected, onChange, placeholder = 'Sélectionner...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helpers pour gérer les deux types d'options
  const getOptionValue = (option: OptionType): string => {
    return typeof option === 'string' ? option : option.value;
  };

  const getOptionLabel = (option: OptionType): string => {
    return typeof option === 'string' ? option : option.label;
  };

  // Filtrer les options selon la recherche
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option);
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleOption = (option: OptionType) => {
    const value = getOptionValue(option);
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  // Trouver le label pour une valeur sélectionnée
  const getSelectedLabel = (value: string): string => {
    const option = options.find(opt => getOptionValue(opt) === value);
    return option ? getOptionLabel(option) : value;
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="multiselect" ref={dropdownRef}>
      <label className="multiselect__label">{label}</label>
      
      <div 
        className={`multiselect__trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="multiselect__selected">
          {selected.length === 0 ? (
            <span className="multiselect__placeholder">{placeholder}</span>
          ) : (
            <div className="multiselect__tags">
              {selected.map(value => (
                <span key={value} className="multiselect__tag">
                  {getSelectedLabel(value)}
                  <button
                    className="multiselect__tag-remove"
                    onClick={(e) => removeOption(value, e)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="multiselect__actions">
          {selected.length > 0 && (
            <button className="multiselect__clear" onClick={clearAll}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <svg 
            className={`multiselect__arrow ${isOpen ? 'rotate' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="multiselect__dropdown">
          {/* Search input */}
          <div className="multiselect__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="multiselect__options">
            {filteredOptions.length === 0 ? (
              <div className="multiselect__no-results">Aucun résultat</div>
            ) : (
              filteredOptions.map(option => {
                const value = getOptionValue(option);
                const label = getOptionLabel(option);
                return (
                  <div
                    key={value}
                    className={`multiselect__option ${selected.includes(value) ? 'selected' : ''}`}
                    onClick={() => toggleOption(option)}
                  >
                    <div className="multiselect__checkbox">
                      {selected.includes(value) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
