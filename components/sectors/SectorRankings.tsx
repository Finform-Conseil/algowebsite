'use client';

import { useState } from 'react';
import { Sector, RankingType } from '@/types/sectors';
import SectorIcon from './SectorIcon';

interface SectorRankingsProps {
  sectors: Sector[];
  onSectorSelect: (sectorId: string) => void;
}

export default function SectorRankings({ sectors, onSectorSelect }: SectorRankingsProps) {
  const [activeTab, setActiveTab] = useState<RankingType>('growth');

  const getRankingValue = (sector: Sector, type: RankingType): number => {
    switch (type) {
      case 'growth':
        return sector.ytdReturn;
      case 'profitability':
        return sector.averageROE;
      case 'volume':
        return sector.dailyVolume;
      default:
        return 0;
    }
  };

  const getValueLabel = (type: RankingType): string => {
    switch (type) {
      case 'growth':
        return 'YTD';
      case 'profitability':
        return 'ROE Moyen';
      case 'volume':
        return 'Volume/jour';
      default:
        return '';
    }
  };

  const formatValue = (value: number, type: RankingType): string => {
    switch (type) {
      case 'growth':
      case 'profitability':
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
      case 'volume':
        return `$${value.toFixed(1)}M`;
      default:
        return value.toFixed(1);
    }
  };

  const rankedSectors = [...sectors].sort((a, b) => 
    getRankingValue(b, activeTab) - getRankingValue(a, activeTab)
  );

  return (
    <div className="sector-rankings">
      {/* <div className="section-header">
        <h2>Classements Dynamiques</h2>
        <p>Top secteurs par critère de performance</p>
      </div> */}

      {/* Tabs */}
      <div className="rankings-tabs">
        <button
          className={`ranking-tab ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          {/* <span className="tab-icon">🔥</span> */}
          <span className="tab-label">Top Croissance</span>
        </button>
        <button
          className={`ranking-tab ${activeTab === 'profitability' ? 'active' : ''}`}
          onClick={() => setActiveTab('profitability')}
        >
          {/* <span className="tab-icon">💰</span> */}
          <span className="tab-label">Top Rentabilité</span>
        </button>
        <button
          className={`ranking-tab ${activeTab === 'volume' ? 'active' : ''}`}
          onClick={() => setActiveTab('volume')}
        >
          {/* <span className="tab-icon">📈</span> */}
          <span className="tab-label">Top Volume</span>
        </button>
      </div>

      {/* Rankings List */}
      <div className="rankings-list">
        {rankedSectors.map((sector, index) => {
          const value = getRankingValue(sector, activeTab);
          const isPositive = value >= 0;
          const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

          return (
            <div
              key={sector.id}
              className="ranking-card"
              onClick={() => onSectorSelect(sector.id)}
            >
              <div className="ranking-position">
                {medalEmoji || (
                  <span className="position-number">#{index + 1}</span>
                )}
              </div>

              <div className="ranking-sector">
                <div className="sector-icon-large" style={{ backgroundColor: `${sector.color}20`, color: sector.color }}>
                  <SectorIcon icon={sector.icon} size={20} />
                </div>
                <div className="sector-info">
                  <h4 className="sector-name">{sector.name}</h4>
                  <p className="sector-meta">
                    {sector.stockCount} actions • ${(sector.totalMarketCap / 1000).toFixed(1)}B cap.
                  </p>
                </div>
              </div>

              <div className="ranking-metrics">
                <div className="metric-primary">
                  <span className="metric-label">{getValueLabel(activeTab)}</span>
                  <span className={`metric-value ${activeTab !== 'volume' && isPositive ? 'positive' : activeTab !== 'volume' && !isPositive ? 'negative' : ''}`}>
                    {formatValue(value, activeTab)}
                  </span>
                </div>

                {/* Sparkline */}
                <div className="metric-sparkline">
                  <svg width="80" height="30" viewBox="0 0 80 30">
                    <polyline
                      points={sector.monthlyReturns
                        .slice(-6)
                        .map((val, i) => {
                          const x = (i / 5) * 80;
                          const y = 30 - ((val + 5) / 10) * 30;
                          return `${x},${Math.max(0, Math.min(30, y))}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={sector.color}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="ranking-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
