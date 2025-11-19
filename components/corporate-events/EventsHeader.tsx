'use client';

import { useState, useEffect } from 'react';
import MultiSelect from './MultiSelect';

interface EventsHeaderProps {
  onFilterChange: (filters: any) => void;
}

const BACKGROUND_IMAGES = [
  '/images/events-header-1.jpg',
  '/images/events-header-2.jpg',
  '/images/events-header-3.jpg',
  '/images/events-header-4.jpg'
];

const SUBTITLES = [
  'Suivi chronologique des événements corporatifs majeurs',
  'IPO, Fusions, Acquisitions et Radiations',
  'Analyse de l\'impact sur la performance boursière',
  'Alertes en temps réel sur les nouveaux événements'
];

export default function EventsHeader({ onFilterChange }: EventsHeaderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedImportance, setSelectedImportance] = useState<string[]>([]);

  const years = ['2024', '2023', '2022', '2021', '2020'];
  const exchanges = ['BRVM', 'JSE', 'CSE', 'NGX', 'GSE', 'NSE', 'EGX', 'TUNSE'];
  const eventTypes = ['IPO', 'Split', 'Reverse Split', 'Merger', 'Acquisition', 'Delisting', 'Bankruptcy', 'Spin-off', 'Dividend', 'Rights Issue', 'Share Buyback'];
  const importance = ['Majeur', 'Mineur'];

  // Slider automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Notifier les changements de filtres
  useEffect(() => {
    onFilterChange({
      years: selectedYears.map(y => parseInt(y)),
      exchanges: selectedExchanges,
      types: selectedTypes,
      importance: selectedImportance.map(i => i === 'Majeur' ? 'major' : 'minor')
    });
  }, [selectedYears, selectedExchanges, selectedTypes, selectedImportance, onFilterChange]);

  return (
    <div className="events-header">
      <div className="events-header__hero">
        {/* Background slider */}
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`events-header__bg ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        
        {/* Overlay */}
        <div className="events-header__overlay" />
        
        {/* Content */}
        <div className="events-header__content">
          <h1 className="events-header__title">Opérations & Événements sur Titres</h1>
          <p className="events-header__subtitle">{SUBTITLES[currentSlide]}</p>
        </div>
      </div>

      {/* Filtres globaux avec MultiSelect */}
      <div className="events-header__filters">
        <MultiSelect
          label="Années"
          options={years}
          selected={selectedYears}
          onChange={setSelectedYears}
          placeholder="Toutes les années"
        />
        
        <MultiSelect
          label="Bourses"
          options={exchanges}
          selected={selectedExchanges}
          onChange={setSelectedExchanges}
          placeholder="Toutes les bourses"
        />
        
        <MultiSelect
          label="Types d'événements"
          options={eventTypes}
          selected={selectedTypes}
          onChange={setSelectedTypes}
          placeholder="Tous les types"
        />
        
        <MultiSelect
          label="Importance"
          options={importance}
          selected={selectedImportance}
          onChange={setSelectedImportance}
          placeholder="Toutes"
        />
      </div>
    </div>
  );
}
