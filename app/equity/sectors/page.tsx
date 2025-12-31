'use client';

import { useState } from 'react';
import Link from 'next/link';
import SectorsHeader from '@/components/sectors/SectorsHeader';
import SectorDistribution from '@/components/sectors/SectorDistribution';
import SectorPerformance from '@/components/sectors/SectorPerformance';
import SectorRankings from '@/components/sectors/SectorRankings';
import SectorIcon from '@/components/sectors/SectorIcon';
import { AFRICAN_SECTORS, getTotalMarketCap, getTotalStockCount } from '@/core/data/SectorsData';
import { Period, ComparisonMode } from '@/types/sectors';

type TabType = 'distribution' | 'performance' | 'rankings' | 'comparison' | 'heatmap' | 'table';

export default function SectorsPage() {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(['brvm', 'jse', 'ngx', 'cse']);
  const [period, setPeriod] = useState<Period>('1Y');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('inter-bourses');
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<TabType>('distribution');

  const handleExchangeToggle = (exchangeId: string) => {
    setSelectedExchanges(prev =>
      prev.includes(exchangeId)
        ? prev.filter(id => id !== exchangeId)
        : [...prev, exchangeId]
    );
  };

  // Filter sectors based on selected exchanges
  const filteredSectors = AFRICAN_SECTORS.filter(sector =>
    sector.exchangeBreakdown.some(ex => selectedExchanges.includes(ex.exchangeId))
  );

  const totalMarketCap = getTotalMarketCap();
  const totalStocks = getTotalStockCount();

  const tabs = [
    { id: 'distribution' as TabType, label: 'Répartition', icon: 'pie-chart' },
    { id: 'performance' as TabType, label: 'Performance', icon: 'trending-up' },
    { id: 'rankings' as TabType, label: 'Classements', icon: 'award' },
    { id: 'comparison' as TabType, label: 'Comparaison', icon: 'scale' },
    { id: 'heatmap' as TabType, label: 'Heatmap', icon: 'flame' },
    { id: 'table' as TabType, label: 'Détails', icon: 'list' }
  ];

  return (
    <div className="sectors-page">
      {/* Breadcrumb */}
      <div className="sectors-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>›</span>
        <span>Secteurs & Industries</span>
      </div>

      {/* Header with filters */}
      <SectorsHeader
        selectedExchanges={selectedExchanges}
        onExchangeToggle={handleExchangeToggle}
        period={period}
        onPeriodChange={setPeriod}
        comparisonMode={comparisonMode}
        onComparisonModeChange={setComparisonMode}
        totalSectors={AFRICAN_SECTORS.length}
        totalStocks={totalStocks}
        totalMarketCap={totalMarketCap}
      />

      {/* Tabs Navigation */}
      <div className="sectors-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <SectorIcon icon={tab.icon} size={18} />
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content with Tabs */}
      <div className="sectors-content">
        {activeTab === 'distribution' && (
          <SectorDistribution
            sectors={filteredSectors}
            onSectorSelect={setSelectedSectorId}
            selectedSectorId={selectedSectorId}
          />
        )}

        {activeTab === 'performance' && (
          <SectorPerformance
            sectors={filteredSectors}
            period={period}
            selectedSectorId={selectedSectorId}
            onSectorSelect={setSelectedSectorId}
          />
        )}

        {activeTab === 'rankings' && (
          <SectorRankings
            sectors={filteredSectors}
            onSectorSelect={setSelectedSectorId}
          />
        )}

        {activeTab === 'comparison' && (
          <div className="tab-content">
            <div className="heatmap-container">
              <div className="heatmap">
                <div className="heatmap-header">
                  <div className="heatmap-cell header-cell"></div>
                  {selectedExchanges.map(exchangeId => (
                    <div key={exchangeId} className="heatmap-cell header-cell">
                      {exchangeId.toUpperCase()}
                    </div>
                  ))}
                </div>
                {filteredSectors.map(sector => (
                  <div key={sector.id} className="heatmap-row">
                    <div className="heatmap-cell row-header">
                      <SectorIcon icon={sector.icon} size={16} />
                      <span className="cell-name">{sector.name}</span>
                    </div>
                    {selectedExchanges.map(exchangeId => {
                      const exchangeData = sector.exchangeBreakdown.find(
                        ex => ex.exchangeId === exchangeId
                      );
                      const weight = exchangeData?.weightInExchange || 0;
                      const intensity = Math.min(weight / 40, 1);

                      return (
                        <div
                          key={`${sector.id}-${exchangeId}`}
                          className="heatmap-cell data-cell"
                          style={{
                            backgroundColor: `${sector.color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`
                          }}
                          title={`${sector.name} sur ${exchangeId.toUpperCase()}: ${weight.toFixed(1)}%`}
                        >
                          <span className="cell-value">{weight.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="tab-content">
            <div className="heatmap-grid">
              {filteredSectors
                .sort((a, b) => b.totalMarketCap - a.totalMarketCap)
                .map(sector => {
                  const performance = sector.ytdReturn;
                  const isPositive = performance >= 0;
                  const intensity = Math.min(Math.abs(performance) / 30, 1);

                  return (
                    <div
                      key={sector.id}
                      className={`heatmap-card ${selectedSectorId === sector.id ? 'selected' : ''}`}
                      style={{
                        flex: sector.weightInTotal,
                        minWidth: '120px',
                        backgroundColor: isPositive
                          ? `rgba(16, 185, 129, ${intensity * 0.3})`
                          : `rgba(239, 68, 68, ${intensity * 0.3})`,
                        borderColor: sector.color
                      }}
                      onClick={() => setSelectedSectorId(sector.id)}
                    >
                      <SectorIcon icon={sector.icon} size={24} />
                      <div className="heatmap-card-name">{sector.name}</div>
                      <div className={`heatmap-card-performance ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{performance.toFixed(1)}%
                      </div>
                      <div className="heatmap-card-metrics">
                        <span>Vol: {sector.volatility.toFixed(1)}%</span>
                        <span>Poids: {sector.weightInTotal.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div className="tab-content">
            <div className="table-wrapper">
              <table className="sectors-table">
                <thead>
                  <tr>
                    <th>Secteur</th>
                    <th>Industrie</th>
                    <th>Actions</th>
                    <th>Cap. Moy.</th>
                    <th>Performance</th>
                    <th>Volatilité</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSectors.map(sector =>
                    sector.industries.map((industry, index) => (
                      <tr
                        key={industry.id}
                        className={selectedSectorId === sector.id ? 'highlighted' : ''}
                      >
                        {index === 0 && (
                          <td rowSpan={sector.industries.length} className="sector-cell">
                            <div className="sector-cell-content">
                              <SectorIcon icon={sector.icon} size={16} />
                              <span className="sector-name">{sector.name}</span>
                            </div>
                          </td>
                        )}
                        <td>{industry.name}</td>
                        <td>{industry.stockCount}</td>
                        <td>${(industry.totalMarketCap / industry.stockCount).toFixed(0)}M</td>
                        <td className={industry.ytdReturn >= 0 ? 'positive' : 'negative'}>
                          {industry.ytdReturn >= 0 ? '+' : ''}{industry.ytdReturn.toFixed(1)}%
                        </td>
                        <td>{industry.volatility.toFixed(1)}%</td>
                        <td>${(sector.dailyVolume / sector.industries.length).toFixed(1)}M</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
