'use client';

import { Sector } from '@/types/sectors';
import SectorIcon from './SectorIcon';

interface SectorDistributionProps {
  sectors: Sector[];
  onSectorSelect: (sectorId: string) => void;
  selectedSectorId?: string;
}

export default function SectorDistribution({
  sectors,
  onSectorSelect,
  selectedSectorId
}: SectorDistributionProps) {
  
  const totalMarketCap = sectors.reduce((sum, s) => sum + s.totalMarketCap, 0);

  return (
    <div className="sector-distribution">
      {/* <div className="section-header">
        <h2>Répartition Sectorielle</h2>
        <p>Vue d'ensemble de la structure des marchés africains</p>
      </div> */}

      <div className="distribution-grid">
        {/* Stock Count Chart */}
        <div className="distribution-card">
          <div className="card-header">
            <h3>Actions par secteur</h3>
            <span className="card-badge">{sectors.reduce((sum, s) => sum + s.stockCount, 0)} actions</span>
          </div>
          <div className="chart-container">
            <div className="bar-chart-horizontal">
              {sectors
                .sort((a, b) => b.stockCount - a.stockCount)
                .map((sector) => (
                  <div
                    key={sector.id}
                    className={`bar-item ${selectedSectorId === sector.id ? 'selected' : ''}`}
                    onClick={() => onSectorSelect(sector.id)}
                  >
                    <div className="bar-label">
                      <SectorIcon icon={sector.icon} size={16} />
                      <span className="bar-name">{sector.name}</span>
                    </div>
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(sector.stockCount / sectors[0].stockCount) * 100}%`,
                          backgroundColor: sector.color
                        }}
                      ></div>
                      <span className="bar-value">{sector.stockCount}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Market Cap Pie Chart */}
        <div className="distribution-card">
          <div className="card-header">
            <h3>Pondération par capitalisation</h3>
            <span className="card-badge">${(totalMarketCap / 1000).toFixed(1)}T</span>
          </div>
          <div className="chart-container">
            <div className="pie-chart">
              <svg viewBox="0 0 200 200" className="pie-svg">
                {(() => {
                  let currentAngle = 0;
                  const outerRadius = 80;
                  const innerRadius = 50; // Doughnut hole
                  
                  return sectors
                    .sort((a, b) => b.totalMarketCap - a.totalMarketCap)
                    .map((sector) => {
                      const percentage = (sector.totalMarketCap / totalMarketCap) * 100;
                      const angle = (percentage / 100) * 360;
                      const startAngle = currentAngle;
                      currentAngle += angle;

                      // Outer arc
                      const startXOuter = 100 + outerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
                      const startYOuter = 100 + outerRadius * Math.sin((startAngle - 90) * Math.PI / 180);
                      const endXOuter = 100 + outerRadius * Math.cos((currentAngle - 90) * Math.PI / 180);
                      const endYOuter = 100 + outerRadius * Math.sin((currentAngle - 90) * Math.PI / 180);
                      
                      // Inner arc
                      const startXInner = 100 + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
                      const startYInner = 100 + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180);
                      const endXInner = 100 + innerRadius * Math.cos((currentAngle - 90) * Math.PI / 180);
                      const endYInner = 100 + innerRadius * Math.sin((currentAngle - 90) * Math.PI / 180);
                      
                      const largeArc = angle > 180 ? 1 : 0;

                      return (
                        <path
                          key={sector.id}
                          d={`M ${startXOuter} ${startYOuter} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endXOuter} ${endYOuter} L ${endXInner} ${endYInner} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startXInner} ${startYInner} Z`}
                          fill={sector.color}
                          className={`pie-slice ${selectedSectorId === sector.id ? 'selected' : ''}`}
                          onClick={() => onSectorSelect(sector.id)}
                        />
                      );
                    });
                })()}
                {/* Center circle for doughnut effect */}
                <circle cx="100" cy="100" r="45" fill="var(--card-background)" />
              </svg>
              <div className="pie-legend">
                {sectors
                  .sort((a, b) => b.totalMarketCap - a.totalMarketCap)
                  .map((sector) => (
                    <div
                      key={sector.id}
                      className={`legend-item ${selectedSectorId === sector.id ? 'selected' : ''}`}
                      onClick={() => onSectorSelect(sector.id)}
                    >
                      <div
                        className="legend-color"
                        style={{ backgroundColor: sector.color }}
                      ></div>
                      <div className="legend-content">
                        <span className="legend-name">
                          <SectorIcon icon={sector.icon} size={14} />
                          {sector.name}
                        </span>
                        <span className="legend-value">{sector.weightInTotal.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Industries Treemap */}
        <div className="distribution-card full-width">
          <div className="card-header">
            <h3>Structure Secteurs → Industries</h3>
            <span className="card-badge">
              {sectors.reduce((sum, s) => sum + s.industries.length, 0)} industries
            </span>
          </div>
          <div className="chart-container">
            <div className="treemap">
              {sectors
                .sort((a, b) => b.totalMarketCap - a.totalMarketCap)
                .map((sector) => (
                  <div
                    key={sector.id}
                    className={`treemap-sector ${selectedSectorId === sector.id ? 'selected' : ''}`}
                    style={{
                      flex: sector.weightInTotal,
                      backgroundColor: `${sector.color}15`,
                      borderColor: sector.color
                    }}
                    onClick={() => onSectorSelect(sector.id)}
                  >
                    <div className="treemap-header">
                      <SectorIcon icon={sector.icon} size={16} />
                      <span className="treemap-name">{sector.name}</span>
                      <span className="treemap-weight">{sector.weightInTotal.toFixed(1)}%</span>
                    </div>
                    <div className="treemap-industries">
                      {sector.industries.map((industry) => (
                        <div
                          key={industry.id}
                          className="treemap-industry"
                          style={{
                            backgroundColor: `${sector.color}25`
                          }}
                        >
                          <span className="industry-name">{industry.name}</span>
                          <span className="industry-count">{industry.stockCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
