'use client';

import MultiSelect from '@/components/corporate-events/MultiSelect';
interface SectorsHeaderProps {
  selectedExchanges: string[];
  onExchangeToggle: (exchangeId: string) => void;
  onExchangesChange?: (exchanges: string[]) => void;
  totalSectors: number;
  totalStocks: number;
  totalMarketCap: number;
}

const EXCHANGES = [
  { id: 'brvm', name: 'BRVM' },
  { id: 'cse', name: 'CSE' },
  { id: 'gse', name: 'GSE' },
  { id: 'jse', name: 'JSE' },
  { id: 'ngx', name: 'NGX' },
  { id: 'nse', name: 'NSE' },
];


export default function SectorsHeader({
  selectedExchanges,
  onExchangeToggle,
  onExchangesChange,
  totalSectors,
  totalStocks,
  totalMarketCap
}: SectorsHeaderProps) {

  const formatMarketCap = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}T`;
    }
    return `$${value.toFixed(1)}B`;
  };

  return (
    <div className="sectors-header">
      {/* Hero Section with Slider */}
      <div 
        className="sectors-header__hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`
        }}
      >
        <div className="sectors-header__content">
          <div className="content-left">
            <h1 className="sectors-header__title">Secteurs & Industries</h1>
            <p className="sectors-header__subtitle">
              Vue agrégée et comparative des dynamiques sectorielles africaines
            </p>
          </div>
          
          {/* KPIs */}
          <div className="sectors-header__kpis">
            {/* Exchange MultiSelect */}
            <div className="exchange-multiselect">
              <MultiSelect
                label="Bourses"
                options={EXCHANGES.map(ex => ({ value: ex.id, label: ex.name }))}
                selected={selectedExchanges}
                onChange={(selected) => {
                  if (selected.length === 0) return; // Don't allow empty selection
                  if (onExchangesChange) {
                    onExchangesChange(selected);
                  }
                }}
                placeholder="Sélectionnez des bourses"
              />
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{totalSectors}</div>
              <div className="kpi-label">Secteurs</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{totalStocks}</div>
              <div className="kpi-label">Actions</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{formatMarketCap(totalMarketCap)}</div>
              <div className="kpi-label">Capitalisation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
