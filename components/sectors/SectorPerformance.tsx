'use client';

import { Sector, Period } from '@/types/sectors';
import SectorIcon from './SectorIcon';

interface SectorPerformanceProps {
  sectors: Sector[];
  period: Period;
  selectedSectorId?: string;
  onSectorSelect: (sectorId: string) => void;
}

export default function SectorPerformance({
  sectors,
  period,
  selectedSectorId,
  onSectorSelect
}: SectorPerformanceProps) {
  
  const getPerformanceByPeriod = (sector: Sector) => {
    switch (period) {
      case '1M': return sector.monthlyReturns[sector.monthlyReturns.length - 1];
      case '3M': return sector.quarterReturn;
      case '6M': return sector.ytdReturn / 2;
      case '1Y': return sector.yearReturn;
      case '3Y': return sector.threeYearReturn;
      case '5Y': return sector.fiveYearReturn;
      default: return sector.ytdReturn;
    }
  };

  return (
    <div className="sector-performance">
      {/* <div className="section-header">
        <h2>Performances Sectorielles</h2>
        <p>Analyse comparative des rendements et de la volatilité</p>
      </div> */}

      <div className="performance-grid">
        {/* Performance Comparison Chart */}
        <div className="performance-card full-width">
          <div className="card-header">
            <h3>Rendement par secteur ({period})</h3>
            <div className="chart-legend-inline">
              {sectors.slice(0, 3).map(sector => (
                <div key={sector.id} className="legend-item-inline">
                  <div className="legend-dot" style={{ backgroundColor: sector.color }}></div>
                  <span>
                    <SectorIcon icon={sector.icon} size={12} />
                    {sector.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <div className="line-chart">
              {sectors.map((sector) => {
                const performance = getPerformanceByPeriod(sector);
                const isPositive = performance >= 0;
                
                return (
                  <div
                    key={sector.id}
                    className={`line-item ${selectedSectorId === sector.id ? 'selected' : ''}`}
                    onClick={() => onSectorSelect(sector.id)}
                  >
                    <div className="line-label">
                      <SectorIcon icon={sector.icon} size={16} />
                      <span className="line-name">{sector.name}</span>
                    </div>
                    <div className="line-bar-wrapper">
                      <div className="line-bar-track">
                        <div
                          className={`line-bar-fill ${isPositive ? 'positive' : 'negative'}`}
                          style={{
                            width: `${Math.abs(performance) * 2}%`,
                            maxWidth: '100%',
                            backgroundColor: sector.color
                          }}
                        ></div>
                      </div>
                      <span className={`line-value ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{performance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Volatility vs Return Scatter */}
        <div className="performance-card">
          <div className="card-header">
            <h3>Volatilité vs Rendement</h3>
            <span className="card-badge">Analyse risque/rendement</span>
          </div>
          <div className="chart-container">
            <div className="scatter-plot">
              <div className="scatter-grid">
                {/* Grid lines */}
                <div className="scatter-axis-y"></div>
                <div className="scatter-axis-x"></div>
                
                {/* Data points */}
                {sectors.map((sector) => {
                  const performance = getPerformanceByPeriod(sector);
                  const volatility = sector.volatility;
                  
                  // Normalize positions (0-100%)
                  const x = Math.min(Math.max((volatility / 30) * 100, 0), 100);
                  const y = Math.min(Math.max(100 - ((performance + 10) / 40) * 100, 0), 100);
                  
                  return (
                    <div
                      key={sector.id}
                      className={`scatter-point ${selectedSectorId === sector.id ? 'selected' : ''}`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: sector.color
                      }}
                      onClick={() => onSectorSelect(sector.id)}
                      title={`${sector.name}: ${performance.toFixed(1)}% rendement, ${volatility.toFixed(1)}% volatilité`}
                    >
                      <SectorIcon icon={sector.icon} size={16} />
                    </div>
                  );
                })}
              </div>
              
              {/* Axis labels */}
              <div className="scatter-labels">
                <div className="scatter-label-x">Volatilité →</div>
                <div className="scatter-label-y">← Rendement</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Table */}
        <div className="performance-card">
          <div className="card-header">
            <h3>Indicateurs clés</h3>
            <span className="card-badge">{sectors.length} secteurs</span>
          </div>
          <div className="chart-container">
            <div className="kpis-table">
              <div className="kpis-header">
                <div className="kpi-col">Secteur</div>
                <div className="kpi-col">Rend.</div>
                <div className="kpi-col">Vol.</div>
                <div className="kpi-col">ROE</div>
                <div className="kpi-col">Div.</div>
              </div>
              <div className="kpis-body">
                {sectors
                  .sort((a, b) => getPerformanceByPeriod(b) - getPerformanceByPeriod(a))
                  .map((sector) => {
                    const performance = getPerformanceByPeriod(sector);
                    const isPositive = performance >= 0;
                    
                    return (
                      <div
                        key={sector.id}
                        className={`kpis-row ${selectedSectorId === sector.id ? 'selected' : ''}`}
                        onClick={() => onSectorSelect(sector.id)}
                      >
                        <div className="kpi-col sector-col">
                          <SectorIcon icon={sector.icon} size={16} />
                          <span className="sector-name">{sector.name}</span>
                        </div>
                        <div className={`kpi-col ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? '+' : ''}{performance.toFixed(1)}%
                        </div>
                        <div className="kpi-col">{sector.volatility.toFixed(1)}%</div>
                        <div className="kpi-col">{sector.averageROE.toFixed(1)}%</div>
                        <div className="kpi-col">{sector.averageDividendYield.toFixed(1)}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
