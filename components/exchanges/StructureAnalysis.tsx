'use client';

import { useState } from 'react';
import { StockExchange } from '@/types/exchanges';

interface StructureAnalysisProps {
  exchanges: StockExchange[];
  selectedExchange: string;
  onExchangeSelect: (exchangeId: string) => void;
}

export default function StructureAnalysis({ 
  exchanges, 
  selectedExchange, 
  onExchangeSelect 
}: StructureAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'regulation' | 'sectors' | 'trading' | 'access'>('regulation');

  const tabs = [
    { id: 'regulation', label: 'Réglementation', icon: '⚖️' },
    { id: 'sectors', label: 'Secteurs', icon: '🏭' },
    { id: 'trading', label: 'Trading', icon: '📈' },
    { id: 'access', label: 'Accès Étrangers', icon: '🌍' }
  ];

  const currentExchange = exchanges.find(e => e.id === selectedExchange);

  const renderSectorPieChart = (sectors: string[]) => {
    const sectorCounts = sectors.reduce((acc, sector) => {
      acc[sector] = (acc[sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(sectorCounts).reduce((sum, count) => sum + count, 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    
    let cumulativePercentage = 0;
    
    return (
      <div className="pie-chart-container">
        <svg className="pie-chart" viewBox="0 0 200 200">
          {Object.entries(sectorCounts).map(([sector, count], index) => {
            const percentage = (count / total) * 100;
            const startAngle = (cumulativePercentage * 360) / 100;
            const endAngle = ((cumulativePercentage + percentage) * 360) / 100;
            
            const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            cumulativePercentage += percentage;
            
            return (
              <path
                key={sector}
                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                className="pie-slice"
              />
            );
          })}
        </svg>
        
        <div className="pie-legend">
          {Object.entries(sectorCounts).map(([sector, count], index) => (
            <div key={sector} className="legend-item">
              <div 
                className="legend-color"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="legend-label">{sector}</span>
              <span className="legend-percentage">
                {((count / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRegulationTab = () => {
    if (!currentExchange) return null;

    return (
      <div className="regulation-content">
        <div className="regulation-overview">
          <div className="regulation-level">
            <label>Niveau de réglementation</label>
            <div className={`level-badge ${currentExchange.regulation.level}`}>
              {currentExchange.regulation.level === 'high' ? '🔒 Élevée' : 
               currentExchange.regulation.level === 'medium' ? '⚖️ Moyenne' : '🔓 Faible'}
            </div>
          </div>
          
          <div className="regulation-description">
            <p>{currentExchange.regulation.description}</p>
          </div>
        </div>

        <div className="regulation-restrictions">
          <h4>Restrictions principales</h4>
          <div className="restrictions-list">
            {currentExchange.regulation.restrictions.map((restriction, index) => (
              <div key={index} className="restriction-item">
                <div className="restriction-icon">⚠️</div>
                <span>{restriction}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="maturity-level">
          <label>Maturité du marché</label>
          <div className={`maturity-badge ${currentExchange.marketMaturity.level}`}>
            {currentExchange.marketMaturity.level === 'mature' ? '🏛️ Mature' : 
             currentExchange.marketMaturity.level === 'developing' ? '🏗️ En développement' : '🌱 Émergent'}
          </div>
          <p className="maturity-description">{currentExchange.marketMaturity.description}</p>
        </div>
      </div>
    );
  };

  const renderSectorsTab = () => {
    if (!currentExchange) return null;

    return (
      <div className="sectors-content">
        <div className="sectors-visualization">
          <h4>Répartition sectorielle</h4>
          {renderSectorPieChart(currentExchange.dominantSectors)}
        </div>

        <div className="sectors-details">
          <h4>Secteurs dominants</h4>
          <div className="sectors-list">
            {currentExchange.dominantSectors.map((sector, index) => (
              <div key={index} className="sector-item">
                <div className="sector-rank">#{index + 1}</div>
                <div className="sector-info">
                  <span className="sector-name">{sector}</span>
                  <div className="sector-bar">
                    <div 
                      className="sector-fill"
                      style={{ 
                        width: `${100 - (index * 15)}%`,
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTradingTab = () => {
    if (!currentExchange) return null;

    return (
      <div className="trading-content">
        <div className="trading-hours">
          <h4>Horaires de trading</h4>
          <div className="hours-grid">
            <div className="hours-item">
              <label>Ouverture</label>
              <span className="hours-value">{currentExchange.tradingHours.open}</span>
            </div>
            <div className="hours-item">
              <label>Fermeture</label>
              <span className="hours-value">{currentExchange.tradingHours.close}</span>
            </div>
            {currentExchange.tradingHours.lunchBreak && (
              <div className="hours-item">
                <label>Pause déjeuner</label>
                <span className="hours-value">{currentExchange.tradingHours.lunchBreak}</span>
              </div>
            )}
            <div className="hours-item">
              <label>Jours de trading</label>
              <span className="hours-value">{currentExchange.tradingHours.days.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="settlement-info">
          <h4>Méthode de règlement</h4>
          <div className="settlement-card">
            <div className="settlement-type">
              <span className="type-badge">{currentExchange.settlementMethod.type}</span>
              <span className="type-description">{currentExchange.settlementMethod.description}</span>
            </div>
            <div className="settlement-visual">
              <div className="timeline">
                <div className="timeline-point trade">Trade</div>
                <div className="timeline-line" />
                <div className="timeline-point settlement">Settlement</div>
              </div>
              <span className="timeline-days">{currentExchange.settlementMethod.type}</span>
            </div>
          </div>
        </div>

        <div className="trading-stats">
          <h4>Statistiques de trading</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <label>Volume moyen quotidien</label>
              <span className="stat-value">${currentExchange.dailyVolume.toFixed(1)}M</span>
            </div>
            <div className="stat-card">
              <label>Nombre de sociétés</label>
              <span className="stat-value">{currentExchange.listedCompanies}</span>
            </div>
            <div className="stat-card">
              <label>Capitalisation totale</label>
              <span className="stat-value">${currentExchange.totalMarketCap.toFixed(1)}B</span>
            </div>
            <div className="stat-card">
              <label>Dynamisme</label>
              <span className="stat-value">{currentExchange.dynamism}/100</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccessTab = () => {
    if (!currentExchange) return null;

    return (
      <div className="access-content">
        <div className="access-overview">
          <div className="access-level">
            <label>Niveau d'accès étranger</label>
            <div className={`access-badge ${currentExchange.foreignAccess.level}`}>
              {currentExchange.foreignAccess.level === 'open' ? '🌐 Ouvert' : 
               currentExchange.foreignAccess.level === 'restricted' ? '🔐 Restreint' : '⛔ Limité'}
            </div>
          </div>
          
          <div className="access-description">
            <p>{currentExchange.foreignAccess.description}</p>
          </div>
        </div>

        <div className="access-requirements">
          <h4>Prérequis pour investisseurs étrangers</h4>
          <div className="requirements-list">
            {currentExchange.foreignAccess.requirements.map((requirement, index) => (
              <div key={index} className="requirement-item">
                <div className="requirement-icon">📋</div>
                <span>{requirement}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="access-restrictions">
          <h4>Restrictions spécifiques</h4>
          <div className="restrictions-grid">
            <div className="restriction-card">
              <div className="restriction-header">
                <span className="restriction-icon">⚠️</span>
                <span>Participation étrangère</span>
              </div>
              <div className="restriction-details">
                {currentExchange.foreignAccess.level === 'limited' ? 'Limitée à certains secteurs' :
                 currentExchange.foreignAccess.level === 'restricted' ? 'Conditions spécifiques requises' :
                 'Aucune restriction majeure'}
              </div>
            </div>
            
            <div className="restriction-card">
              <div className="restriction-header">
                <span className="restriction-icon">💰</span>
                <span>Minimum d'investissement</span>
              </div>
              <div className="restriction-details">
                {currentExchange.foreignAccess.level === 'limited' ? 'Élevé (> $100K)' :
                 currentExchange.foreignAccess.level === 'restricted' ? 'Modéré ($10K-100K)' :
                 'Faible (< $10K)'}
              </div>
            </div>
            
            <div className="restriction-card">
              <div className="restriction-header">
                <span className="restriction-icon">🏛️</span>
                <span>Approbations requises</span>
              </div>
              <div className="restriction-details">
                {currentExchange.foreignAccess.level === 'limited' ? 'Multiples approbations' :
                 currentExchange.foreignAccess.level === 'restricted' ? 'Approbation réglementaire' :
                 'Standard (KYC/CDD)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'regulation':
        return renderRegulationTab();
      case 'sectors':
        return renderSectorsTab();
      case 'trading':
        return renderTradingTab();
      case 'access':
        return renderAccessTab();
      default:
        return null;
    }
  };

  return (
    <div className="structure-analysis">
      {/* Exchange Selector */}
      <div className="exchange-selector">
        <label>Analyser la structure:</label>
        <div className="exchange-tabs">
          {exchanges.map(exchange => (
            <button
              key={exchange.id}
              className={`exchange-tab ${selectedExchange === exchange.id ? 'active' : ''}`}
              onClick={() => onExchangeSelect(exchange.id)}
            >
              <img src={exchange.logo} alt={exchange.shortName} className="tab-logo" />
              <span>{exchange.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="structure-tabs">
        <div className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
