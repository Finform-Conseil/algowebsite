'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MultiLineChart from '@/components/opcvm/MultiLineChart';
import { Candle } from '@/core/data/TechnicalAnalysis';

// Types
type OPCVM = {
  id: string;
  name: string;
  manager: string;
  approvalYear: number;
  strategy: string;
  performance: number;
  benchmark: string;
  benchmarkPerformance: number;
  volatility: number;
  riskLevel: 'Faible' | 'Modéré' | 'Élevé';
  managementFees: number;
  feesLevel: 'Faible' | 'Moyen' | 'Élevé';
  successFactors?: string[];
  underperformanceFactors?: string[];
  historicalData?: Candle[];
};

type Exchange = 'BRVM' | 'JSE' | 'NGX' | 'NSE' | 'CSE' | 'GSE';
type ViewMode = 'detailed' | 'table' | 'charts';

export default function OPCVMComparisonReportPage() {
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('BRVM');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-11-30');
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');

  // Générer des données historiques mock pour les graphiques
  const generateHistoricalData = (basePrice: number, trend: 'up' | 'down'): Candle[] => {
    const data: Candle[] = [];
    const days = 90;
    let price = basePrice;
    const startDateObj = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDateObj);
      date.setDate(date.getDate() + i);
      
      const volatility = 0.02;
      const trendFactor = trend === 'up' ? 0.001 : -0.001;
      
      const open = price;
      const change = price * (Math.random() * volatility - volatility / 2 + trendFactor);
      const close = price + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 500000;

      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });

      price = close;
    }

    return data;
  };

  // Mock data - À remplacer par des vraies données API
  const mockTopOPCVM: OPCVM[] = [
    {
      id: '1',
      name: 'NSIA Actions Côte d\'Ivoire',
      manager: 'NSIA Banque',
      approvalYear: 2015,
      strategy: 'Fonds actions investissant principalement dans les grandes capitalisations de la BRVM, avec une approche de gestion active visant à surperformer l\'indice BRVM Composite. Le fonds privilégie les secteurs bancaire, télécommunications et distribution.',
      performance: 18.3,
      benchmark: 'BRVM Composite',
      benchmarkPerformance: 12.5,
      volatility: 12.5,
      riskLevel: 'Élevé',
      managementFees: 1.5,
      feesLevel: 'Moyen',
      historicalData: generateHistoricalData(1000, 'up'),
      successFactors: [
        'Excellente sélection de titres dans le secteur bancaire qui a connu une forte croissance',
        'Surpondération opportune du secteur des télécommunications',
        'Gestion active efficace avec des arbitrages bien timés',
        'Bonne diversification géographique au sein de la zone UEMOA'
      ]
    },
    {
      id: '2',
      name: 'Coris Actions Dynamique',
      manager: 'Coris Asset Management',
      approvalYear: 2018,
      strategy: 'Fonds actions à gestion dynamique investissant dans les valeurs de croissance de la BRVM. Approche momentum avec rotation sectorielle active.',
      performance: 16.8,
      benchmark: 'BRVM Composite',
      benchmarkPerformance: 12.5,
      volatility: 14.2,
      riskLevel: 'Élevé',
      managementFees: 1.8,
      feesLevel: 'Élevé',
      historicalData: generateHistoricalData(950, 'up'),
      successFactors: [
        'Stratégie momentum bien adaptée au contexte haussier du marché',
        'Rotation sectorielle efficace vers les secteurs performants',
        'Exposition importante aux valeurs de croissance',
        'Timing d\'entrée et de sortie optimisé'
      ]
    },
    {
      id: '3',
      name: 'BOA Croissance Plus',
      manager: 'BOA Capital',
      approvalYear: 2016,
      strategy: 'Fonds mixte flexible avec allocation dynamique entre actions (60-80%) et obligations (20-40%). Gestion value avec focus sur les titres sous-évalués.',
      performance: 14.5,
      benchmark: 'BRVM Composite 70% + BRVM Obligations 30%',
      benchmarkPerformance: 10.8,
      volatility: 9.8,
      riskLevel: 'Modéré',
      managementFees: 1.2,
      feesLevel: 'Faible',
      historicalData: generateHistoricalData(900, 'up'),
      successFactors: [
        'Allocation d\'actifs optimale avec surpondération actions au bon moment',
        'Sélection de titres value qui ont connu une revalorisation',
        'Frais de gestion compétitifs maximisant la performance nette',
        'Bonne gestion du risque avec diversification efficace'
      ]
    }
  ];

  const mockFlopOPCVM: OPCVM[] = [
    {
      id: '4',
      name: 'Atlantique Actions Émergentes',
      manager: 'Atlantique Asset Management',
      approvalYear: 2017,
      strategy: 'Fonds actions investissant dans les petites et moyennes capitalisations de la BRVM, avec une approche de croissance à long terme.',
      performance: -3.2,
      benchmark: 'BRVM Composite',
      benchmarkPerformance: 12.5,
      volatility: 18.5,
      riskLevel: 'Élevé',
      managementFees: 2.0,
      feesLevel: 'Élevé',
      historicalData: generateHistoricalData(1000, 'down'),
      underperformanceFactors: [
        'Surexposition aux petites capitalisations qui ont sous-performé',
        'Concentration excessive sur des secteurs en difficulté',
        'Frais de gestion élevés impactant la performance nette',
        'Manque de liquidité sur certaines positions'
      ]
    },
    {
      id: '5',
      name: 'Sahel Obligations Court Terme',
      manager: 'Sahel Finance',
      approvalYear: 2019,
      strategy: 'Fonds obligataire investissant dans des titres de créance à court terme (maturité < 3 ans) émis par des États et entreprises de la zone UEMOA.',
      performance: 2.1,
      benchmark: 'BRVM Obligations',
      benchmarkPerformance: 5.8,
      volatility: 3.2,
      riskLevel: 'Faible',
      managementFees: 0.8,
      feesLevel: 'Faible',
      historicalData: generateHistoricalData(980, 'down'),
      underperformanceFactors: [
        'Sous-pondération des obligations d\'État qui ont bien performé',
        'Exposition à des émetteurs corporate ayant connu des difficultés',
        'Duration trop courte dans un contexte de baisse des taux',
        'Manque de réactivité dans l\'ajustement du portefeuille'
      ]
    },
    {
      id: '6',
      name: 'Ecobank Équilibre',
      manager: 'Ecobank Asset Management',
      approvalYear: 2014,
      strategy: 'Fonds mixte équilibré avec allocation fixe 50% actions / 50% obligations. Gestion passive répliquant les indices de référence.',
      performance: 4.8,
      benchmark: 'BRVM Composite 50% + BRVM Obligations 50%',
      benchmarkPerformance: 9.2,
      volatility: 7.5,
      riskLevel: 'Modéré',
      managementFees: 1.0,
      feesLevel: 'Moyen',
      historicalData: generateHistoricalData(950, 'down'),
      underperformanceFactors: [
        'Gestion passive inadaptée dans un marché nécessitant de l\'arbitrage',
        'Allocation fixe empêchant de profiter des opportunités',
        'Réplication imparfaite des indices de référence',
        'Coûts de transaction élevés impactant le tracking error'
      ]
    }
  ];

  return (
    <div className="comparison-report-page">
      {/* Breadcrumb */}
      <div className="report-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <Link href="/opcvm">OPCVM</Link>
        <span>/</span>
        <span>Rapport de Comparaison</span>
      </div>

      {/* Header */}
      <div className="report-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Rapport de Comparaison d'OPCVM</h1>
            <p>Analyse comparative des Top-3 et Flop-3 OPCVM par bourse</p>
          </div>

          <div className="header-filters">
            <div className="filter-group">
              <label>Bourse</label>
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value as Exchange)}
                className="exchange-select"
              >
                <option value="BRVM">BRVM</option>
                <option value="JSE">JSE</option>
                <option value="NGX">NGX</option>
                <option value="NSE">NSE</option>
                <option value="CSE">CSE</option>
                <option value="GSE">GSE</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Période</label>
              <div className="date-range">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button className="btn-generate">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Générer le rapport
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          className={`tab-btn ${viewMode === 'detailed' ? 'active' : ''}`}
          onClick={() => setViewMode('detailed')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Vue Détaillée
        </button>
        <button
          className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          Vue Tableau
        </button>
        <button
          className={`tab-btn ${viewMode === 'charts' ? 'active' : ''}`}
          onClick={() => setViewMode('charts')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Vue Graphiques
        </button>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {/* Vue Détaillée */}
        {viewMode === 'detailed' && (
          <div className="detailed-view">
            {/* Introduction */}
            <section className="report-section introduction">
              <h2>Introduction</h2>
              <p>
                Ce rapport a pour objectif de fournir aux investisseurs une analyse comparative périodique de six Organismes de Placement Collectif en Valeurs Mobilières (OPCVM) cotés sur la <strong>{selectedExchange}</strong>. Nous avons sélectionné les trois OPCVM ayant affiché les meilleures performances ("Top-3") et les trois ayant enregistré les performances les plus faibles ("Flop-3") sur la période allant du <strong>{new Date(startDate).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(endDate).toLocaleDateString('fr-FR')}</strong>.
              </p>
              <p>
                L'analyse portera sur leur performance, leurs frais de gestion et leurs stratégies d'investissement principales, afin d'aider les investisseurs à mieux comprendre les facteurs de succès et de sous-performance, et à éclairer leurs décisions d'investissement.
              </p>
            </section>

        {/* Méthodologie */}
        <section className="report-section methodology">
          <h2>Méthodologie</h2>
          <p>
            La sélection des OPCVM a été réalisée sur la base du <strong>rendement net total</strong> sur la période analysée. Les informations concernant les frais de gestion et les stratégies d'investissement ont été extraites des Documents d'Information Clé pour l'Investisseur (DICI), des prospectus et des rapports périodiques disponibles publiquement.
          </p>
        </section>

        {/* Top-3 OPCVM */}
        <section className="report-section top-opcvm">
          <div className="section-header">
            <div className="section-icon top">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h2>Analyse Détaillée des Top-3 OPCVM</h2>
          </div>

          <div className="opcvm-cards">
            {mockTopOPCVM.map((opcvm, index) => (
              <div key={opcvm.id} className="opcvm-card top-card">
                <div className="card-header">
                  <div className="rank-badge top-rank">#{index + 1}</div>
                  <h3>{opcvm.name}</h3>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">Société de Gestion:</span>
                    <span className="info-value">{opcvm.manager}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Année d'agrément:</span>
                    <span className="info-value">{opcvm.approvalYear}</span>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Stratégie d'Investissement Principale</h4>
                  <p>{opcvm.strategy}</p>
                </div>

                <div className="card-section">
                  <h4>Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Rendement</span>
                      <span className="metric-value positive">+{opcvm.performance}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Indice de référence</span>
                      <span className="metric-value">{opcvm.benchmark}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Performance indice</span>
                      <span className="metric-value">+{opcvm.benchmarkPerformance}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Volatilité</span>
                      <span className="metric-value">{opcvm.volatility}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Niveau de risque</span>
                      <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                    </div>
                  </div>
                  <p className="performance-text">
                    Avec un rendement de <strong>+{opcvm.performance}%</strong> sur la période, ce fonds a significativement surperformé son indice de référence (<strong>{opcvm.benchmark}</strong> à <strong>+{opcvm.benchmarkPerformance}%</strong>). Sa volatilité de <strong>{opcvm.volatility}%</strong> suggère un niveau de risque <strong>{opcvm.riskLevel.toLowerCase()}</strong> par rapport à sa catégorie.
                  </p>
                </div>

                <div className="card-section">
                  <h4>Frais de Gestion</h4>
                  <p>
                    Les frais de gestion annuels s'élèvent à <strong>{opcvm.managementFees}%</strong>, ce qui se situe dans une fourchette <strong>{opcvm.feesLevel.toLowerCase()}</strong> par rapport à sa catégorie.
                  </p>
                </div>

                {opcvm.successFactors && (
                  <div className="card-section">
                    <h4>Facteurs de Succès Potentiels</h4>
                    <ul className="factors-list">
                      {opcvm.successFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Flop-3 OPCVM */}
        <section className="report-section flop-opcvm">
          <div className="section-header">
            <div className="section-icon flop">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
            <h2>Analyse Détaillée des Flop-3 OPCVM</h2>
          </div>

          <div className="opcvm-cards">
            {mockFlopOPCVM.map((opcvm, index) => (
              <div key={opcvm.id} className="opcvm-card flop-card">
                <div className="card-header">
                  <div className="rank-badge flop-rank">#{index + 1}</div>
                  <h3>{opcvm.name}</h3>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">Société de Gestion:</span>
                    <span className="info-value">{opcvm.manager}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Année d'agrément:</span>
                    <span className="info-value">{opcvm.approvalYear}</span>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Stratégie d'Investissement Principale</h4>
                  <p>{opcvm.strategy}</p>
                </div>

                <div className="card-section">
                  <h4>Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Rendement</span>
                      <span className={`metric-value ${opcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                        {opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Indice de référence</span>
                      <span className="metric-value">{opcvm.benchmark}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Performance indice</span>
                      <span className="metric-value">+{opcvm.benchmarkPerformance}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Volatilité</span>
                      <span className="metric-value">{opcvm.volatility}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Niveau de risque</span>
                      <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                    </div>
                  </div>
                  <p className="performance-text">
                    Avec un rendement de <strong>{opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%</strong> sur la période, ce fonds a significativement sous-performé son indice de référence (<strong>{opcvm.benchmark}</strong> à <strong>+{opcvm.benchmarkPerformance}%</strong>). Sa volatilité de <strong>{opcvm.volatility}%</strong> suggère un niveau de risque <strong>{opcvm.riskLevel.toLowerCase()}</strong>.
                  </p>
                </div>

                <div className="card-section">
                  <h4>Frais de Gestion</h4>
                  <p>
                    Les frais de gestion annuels s'élèvent à <strong>{opcvm.managementFees}%</strong>, ce qui se situe dans une fourchette <strong>{opcvm.feesLevel.toLowerCase()}</strong> par rapport à sa catégorie.
                  </p>
                </div>

                {opcvm.underperformanceFactors && (
                  <div className="card-section">
                    <h4>Facteurs de Sous-Performance Potentiels</h4>
                    <ul className="factors-list">
                      {opcvm.underperformanceFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

            {/* Avertissement */}
            <section className="report-section disclaimer">
              <div className="disclaimer-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2>Avertissement Important</h2>
              <p>
                <strong>Les performances passées ne préjugent en aucun cas des performances futures.</strong> Ce rapport est basé sur des données historiques et ne constitue en aucun cas un conseil en investissement. Les investisseurs doivent réaliser leur propre analyse approfondie et consulter un conseiller financier avant de prendre toute décision d'investissement.
              </p>
              <p>
                Les frais de gestion sont un facteur important à considérer, car ils impactent directement la performance nette de l'investisseur.
              </p>
            </section>
          </div>
        )}

        {/* Vue Tableau */}
        {viewMode === 'table' && (
          <div className="table-view">
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th className="metric-header">Critères</th>
                    <th className="top-header" colSpan={3}>
                      <div className="header-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                        Top-3 OPCVM
                      </div>
                    </th>
                    <th className="flop-header" colSpan={3}>
                      <div className="header-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                          <polyline points="17 18 23 18 23 12" />
                        </svg>
                        Flop-3 OPCVM
                      </div>
                    </th>
                  </tr>
                  <tr className="sub-header">
                    <th></th>
                    {mockTopOPCVM.map((opcvm, idx) => (
                      <th key={opcvm.id} className="top-col">#{idx + 1}</th>
                    ))}
                    {mockFlopOPCVM.map((opcvm, idx) => (
                      <th key={opcvm.id} className="flop-col">#{idx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric-label">Nom du Fonds</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell font-weight-600">{opcvm.name}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell font-weight-600">{opcvm.name}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Société de Gestion</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.manager}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.manager}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Année d'agrément</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.approvalYear}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.approvalYear}</td>
                    ))}
                  </tr>
                  <tr className="highlight-row">
                    <td className="metric-label">Performance</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">
                        <span className="performance-value positive">+{opcvm.performance}%</span>
                      </td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">
                        <span className={`performance-value ${opcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                          {opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Indice de référence</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell small-text">{opcvm.benchmark}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell small-text">{opcvm.benchmark}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Performance Indice</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">+{opcvm.benchmarkPerformance}%</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">+{opcvm.benchmarkPerformance}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Volatilité</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.volatility}%</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.volatility}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Niveau de Risque</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">
                        <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                      </td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">
                        <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Frais de Gestion</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.managementFees}%</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.managementFees}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Niveau des Frais</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.feesLevel}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.feesLevel}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer compact pour table view */}
            <div className="table-disclaimer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Avertissement:</strong> Les performances passées ne préjugent en aucun cas des performances futures. Ce rapport ne constitue pas un conseil en investissement.
              </p>
            </div>
          </div>
        )}

        {/* Vue Graphiques */}
        {viewMode === 'charts' && (
          <div className="charts-view">
            <div className="charts-grid">
              {/* Top-3 Chart */}
              <div className="chart-section top-section">
                <div className="chart-header">
                  <div className="chart-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h3>Performance Top-3 OPCVM</h3>
                  </div>
                  <div className="chart-legend">
                    {mockTopOPCVM.map((opcvm, idx) => (
                      <div key={opcvm.id} className="legend-item">
                        <span className={`legend-color top-${idx + 1}`}></span>
                        <span className="legend-label">{opcvm.name}</span>
                        <span className="legend-value positive">+{opcvm.performance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-wrapper">
                  <MultiLineChart
                    series={mockTopOPCVM.map((opcvm, idx) => ({
                      name: opcvm.name,
                      data: opcvm.historicalData || [],
                      color: idx === 0 ? '#10b981' : idx === 1 ? '#34d399' : '#6ee7b7'
                    }))}
                    type="top"
                  />
                </div>
              </div>

              {/* Flop-3 Chart */}
              <div className="chart-section flop-section">
                <div className="chart-header">
                  <div className="chart-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      <polyline points="17 18 23 18 23 12" />
                    </svg>
                    <h3>Performance Flop-3 OPCVM</h3>
                  </div>
                  <div className="chart-legend">
                    {mockFlopOPCVM.map((opcvm, idx) => (
                      <div key={opcvm.id} className="legend-item">
                        <span className={`legend-color flop-${idx + 1}`}></span>
                        <span className="legend-label">{opcvm.name}</span>
                        <span className={`legend-value ${opcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                          {opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-wrapper">
                  <MultiLineChart
                    series={mockFlopOPCVM.map((opcvm, idx) => ({
                      name: opcvm.name,
                      data: opcvm.historicalData || [],
                      color: idx === 0 ? '#ef4444' : idx === 1 ? '#f87171' : '#fca5a5'
                    }))}
                    type="flop"
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer compact pour charts view */}
            <div className="charts-disclaimer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Avertissement:</strong> Les performances passées ne préjugent en aucun cas des performances futures. Ce rapport ne constitue pas un conseil en investissement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
