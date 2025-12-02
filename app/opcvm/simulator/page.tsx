'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import IndependentChartView from '@/components/technical/IndependentChartView';

// Types
type OPCVMFund = {
  id: string;
  name: string;
  isin: string;
  exchange: string;
  nature: string;
  type: string;
  managementCompany: string;
  nav: number;
  currency: string;
  entryFees: number;
  exitFees: number;
  managementFees: number;
  minSubscription: number;
  var1Week: number;
  var1Month: number;
  var1Year: number;
  riskLevel: string;
  navDate: string;
};

type OperationType = 'subscription' | 'redemption';

export default function OPCVMSimulatorPage() {
  // Filters
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [selectedNature, setSelectedNature] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Fund
  const [selectedFund, setSelectedFund] = useState<OPCVMFund | null>(null);
  
  // Operation Type
  const [operationType, setOperationType] = useState<OperationType>('subscription');

  // Subscription Inputs
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [investmentDate, setInvestmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recurringPayments, setRecurringPayments] = useState<boolean>(false);
  const [monthlyAmount, setMonthlyAmount] = useState<string>('');
  const [numberOfMonths, setNumberOfMonths] = useState<string>('12');

  // Redemption Inputs
  const [redemptionType, setRedemptionType] = useState<'shares' | 'amount'>('shares');
  const [numberOfShares, setNumberOfShares] = useState<string>('');
  const [redemptionAmount, setRedemptionAmount] = useState<string>('');
  const [redemptionDate, setRedemptionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Mock Data
  const mockFunds: OPCVMFund[] = [
    {
      id: 'fund1',
      name: 'NSIA Actions Côte d\'Ivoire',
      isin: 'CI0001234567',
      exchange: 'BRVM',
      nature: 'Actions',
      type: 'OPCVM Actions',
      managementCompany: 'NSIA Gestion',
      nav: 12500,
      currency: 'FCFA',
      entryFees: 2.5,
      exitFees: 1.0,
      managementFees: 1.5,
      minSubscription: 100000,
      var1Week: 1.2,
      var1Month: 3.5,
      var1Year: 18.3,
      riskLevel: 'Élevé',
      navDate: '2024-11-30'
    },
    {
      id: 'fund2',
      name: 'Coris Obligations Plus',
      isin: 'BF0009876543',
      exchange: 'BRVM',
      nature: 'Obligations',
      type: 'OPCVM Obligataire',
      managementCompany: 'Coris Asset Management',
      nav: 10850,
      currency: 'FCFA',
      entryFees: 1.5,
      exitFees: 0.5,
      managementFees: 1.0,
      minSubscription: 50000,
      var1Week: 0.3,
      var1Month: 1.2,
      var1Year: 5.8,
      riskLevel: 'Modéré',
      navDate: '2024-11-30'
    },
    {
      id: 'fund3',
      name: 'BOA Monétaire Dynamique',
      isin: 'SN0005555555',
      exchange: 'BRVM',
      nature: 'Monétaire',
      type: 'OPCVM Monétaire',
      managementCompany: 'BOA Capital',
      nav: 10125,
      currency: 'FCFA',
      entryFees: 0.5,
      exitFees: 0.0,
      managementFees: 0.5,
      minSubscription: 25000,
      var1Week: 0.1,
      var1Month: 0.4,
      var1Year: 2.5,
      riskLevel: 'Faible',
      navDate: '2024-11-30'
    },
    {
      id: 'fund4',
      name: 'Ecobank Mixte Équilibré',
      isin: 'TG0007777777',
      exchange: 'BRVM',
      nature: 'Mixte',
      type: 'OPCVM Mixte',
      managementCompany: 'Ecobank Asset Management',
      nav: 11750,
      currency: 'FCFA',
      entryFees: 2.0,
      exitFees: 0.75,
      managementFees: 1.25,
      minSubscription: 75000,
      var1Week: 0.8,
      var1Month: 2.1,
      var1Year: 10.5,
      riskLevel: 'Modéré',
      navDate: '2024-11-30'
    },
    {
      id: 'fund5',
      name: 'SG Actions Croissance',
      isin: 'CI0002468135',
      exchange: 'BRVM',
      nature: 'Actions',
      type: 'OPCVM Actions',
      managementCompany: 'SG Asset Management Africa',
      nav: 13200,
      currency: 'FCFA',
      entryFees: 3.0,
      exitFees: 1.5,
      managementFees: 1.75,
      minSubscription: 150000,
      var1Week: 1.5,
      var1Month: 4.2,
      var1Year: 22.1,
      riskLevel: 'Élevé',
      navDate: '2024-11-30'
    }
  ];

  // Filtered Funds
  const filteredFunds = useMemo(() => {
    return mockFunds.filter(fund => {
      const matchesExchange = selectedExchange === 'all' || fund.exchange === selectedExchange;
      const matchesNature = selectedNature === 'all' || fund.nature === selectedNature;
      const matchesType = selectedType === 'all' || fund.type === selectedType;
      const matchesSearch = searchQuery === '' || 
        fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fund.managementCompany.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesExchange && matchesNature && matchesType && matchesSearch;
    });
  }, [selectedExchange, selectedNature, selectedType, searchQuery, mockFunds]);

  // Calculations for Subscription
  const subscriptionResults = useMemo(() => {
    if (!selectedFund || !investmentAmount) return null;

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount < selectedFund.minSubscription) return null;

    const entryFeesAmount = (amount * selectedFund.entryFees) / 100;
    const netAmount = amount - entryFeesAmount;
    const numberOfShares = netAmount / selectedFund.nav;

    const projections = [
      { period: '3 mois', value: netAmount * 1.02, return: 2 },
      { period: '1 an', value: netAmount * 1.08, return: 8 },
      { period: '3 ans', value: netAmount * 1.26, return: 26 }
    ];

    return {
      grossAmount: amount,
      entryFees: entryFeesAmount,
      netAmount,
      numberOfShares,
      navUsed: selectedFund.nav,
      projections
    };
  }, [selectedFund, investmentAmount]);

  // Calculations for Redemption
  const redemptionResults = useMemo(() => {
    if (!selectedFund) return null;

    let shares = 0;
    if (redemptionType === 'shares') {
      shares = parseFloat(numberOfShares);
    } else {
      const amount = parseFloat(redemptionAmount);
      if (!isNaN(amount)) {
        shares = amount / selectedFund.nav;
      }
    }

    if (isNaN(shares) || shares <= 0) return null;

    const grossValue = shares * selectedFund.nav;
    const exitFeesAmount = (grossValue * selectedFund.exitFees) / 100;
    const netAmount = grossValue - exitFeesAmount;

    const initialNav = selectedFund.nav * 0.9;
    const initialInvestment = shares * initialNav;
    const capitalGain = netAmount - initialInvestment;
    const returnPercentage = ((netAmount - initialInvestment) / initialInvestment) * 100;

    return {
      numberOfShares: shares,
      navUsed: selectedFund.nav,
      grossValue,
      exitFees: exitFeesAmount,
      netAmount,
      initialInvestment,
      capitalGain,
      returnPercentage
    };
  }, [selectedFund, redemptionType, numberOfShares, redemptionAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="opcvm-simulator-page">
      {/* Breadcrumb */}
      <div className="simulator-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <Link href="/opcvm">OPCVM</Link>
        <span>/</span>
        <span>Simulateur de Souscription/Rachat</span>
      </div>

      {/* Header with Filters and Funds */}
      <div className="simulator-header">
        <div className="header-content">
          <div className="header-top">
            <div className="header-title">
              <h1>Simulateur de Souscription / Rachat</h1>
              <p>Estimez vos investissements et retraits en tenant compte des VL et frais</p>
            </div>

            {/* Inline Filters */}
            <div className="header-filters">
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes Bourses</option>
                <option value="BRVM">BRVM</option>
                <option value="JSE">JSE</option>
                <option value="NGX">NGX</option>
              </select>

              <select
                value={selectedNature}
                onChange={(e) => setSelectedNature(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes Natures</option>
                <option value="Actions">Actions</option>
                <option value="Obligations">Obligations</option>
                <option value="Monétaire">Monétaire</option>
                <option value="Mixte">Mixte</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous Types</option>
                <option value="OPCVM Actions">OPCVM Actions</option>
                <option value="OPCVM Obligataire">OPCVM Obligataire</option>
                <option value="OPCVM Monétaire">OPCVM Monétaire</option>
                <option value="OPCVM Mixte">OPCVM Mixte</option>
              </select>

              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Compact Funds List */}
          <div className="funds-carousel">
            {filteredFunds.length === 0 ? (
              <div className="no-funds">Aucun fonds trouvé</div>
            ) : (
              filteredFunds.map((fund) => (
                <div
                  key={fund.id}
                  className={`fund-chip ${selectedFund?.id === fund.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFund(fund)}
                >
                  <div className="chip-header">
                    <span className="chip-name">{fund.name}</span>
                    <span className="chip-nav">{formatCurrency(fund.nav)}</span>
                  </div>
                  <div className="chip-footer">
                    <span className="chip-company">{fund.managementCompany}</span>
                    <span className={`chip-perf ${fund.var1Year >= 0 ? 'positive' : 'negative'}`}>
                      {fund.var1Year >= 0 ? '+' : ''}{fund.var1Year}% (1A)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="simulator-main">
        {/* Left Panel - Chart and Fund Info */}
        <div className="chart-panel">
          {!selectedFund ? (
            <div className="no-selection">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <h3>Sélectionnez un fonds</h3>
              <p>Choisissez un fonds dans la liste ci-dessus pour visualiser son graphique</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="chart-container">
                <IndependentChartView chartId={1} />
              </div>

              {/* Fund Info Card */}
              <div className="fund-info-card">
                <div className="info-header">
                  <div>
                    <h3>{selectedFund.name}</h3>
                    <p>{selectedFund.managementCompany}</p>
                  </div>
                  <div className="nav-display">
                    <div className="nav-label">VL au {selectedFund.navDate}</div>
                    <div className="nav-value">{formatCurrency(selectedFund.nav)}</div>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">ISIN</span>
                    <span className="info-value">{selectedFund.isin}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Bourse</span>
                    <span className="info-value">{selectedFund.exchange}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Frais d'entrée</span>
                    <span className="info-value">{selectedFund.entryFees}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Frais de sortie</span>
                    <span className="info-value">{selectedFund.exitFees}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Frais de gestion</span>
                    <span className="info-value">{selectedFund.managementFees}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Min. souscription</span>
                    <span className="info-value">{formatCurrency(selectedFund.minSubscription)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Simulator */}
        <div className="simulator-panel">
          {!selectedFund ? (
            <div className="no-selection">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <h3>Sélectionnez un fonds</h3>
              <p>Choisissez un fonds pour commencer votre simulation</p>
            </div>
          ) : (
            <>
              {/* Operation Tabs */}
              <div className="operation-tabs">
                <button
                  className={`tab-btn ${operationType === 'subscription' ? 'active' : ''}`}
                  onClick={() => setOperationType('subscription')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Souscription
                </button>
                <button
                  className={`tab-btn ${operationType === 'redemption' ? 'active' : ''}`}
                  onClick={() => setOperationType('redemption')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Rachat
                </button>
              </div>

              {/* Subscription Form */}
              {operationType === 'subscription' && (
                <div className="operation-form">
                  <h3>Simulation de Souscription</h3>
                  
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Montant à investir</label>
                      <div className="input-with-currency">
                        <input
                          type="number"
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          placeholder="0"
                          min={selectedFund.minSubscription}
                        />
                        <span className="currency">FCFA</span>
                      </div>
                      {investmentAmount && parseFloat(investmentAmount) < selectedFund.minSubscription && (
                        <span className="error-message">
                          Montant minimum: {formatCurrency(selectedFund.minSubscription)}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Date d'investissement</label>
                      <input
                        type="date"
                        value={investmentDate}
                        onChange={(e) => setInvestmentDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Frais d'entrée</label>
                      <input
                        type="text"
                        value={`${selectedFund.entryFees}%`}
                        disabled
                        className="disabled-input"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={recurringPayments}
                          onChange={(e) => setRecurringPayments(e.target.checked)}
                        />
                        <span>Versements programmés</span>
                      </label>
                    </div>

                    {recurringPayments && (
                      <>
                        <div className="form-group">
                          <label>Montant mensuel</label>
                          <div className="input-with-currency">
                            <input
                              type="number"
                              value={monthlyAmount}
                              onChange={(e) => setMonthlyAmount(e.target.value)}
                              placeholder="0"
                            />
                            <span className="currency">FCFA</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Nombre de mois</label>
                          <input
                            type="number"
                            value={numberOfMonths}
                            onChange={(e) => setNumberOfMonths(e.target.value)}
                            min="1"
                            max="60"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Results */}
                  {subscriptionResults && (
                    <div className="results-section">
                      <h4>Résultats de la Simulation</h4>
                      
                      <div className="results-grid">
                        <div className="result-card primary">
                          <div className="result-label">Nombre de parts obtenues</div>
                          <div className="result-value">{subscriptionResults.numberOfShares.toFixed(4)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Montant brut investi</div>
                          <div className="result-value">{formatCurrency(subscriptionResults.grossAmount)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Frais d'entrée</div>
                          <div className="result-value negative">-{formatCurrency(subscriptionResults.entryFees)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Montant net investi</div>
                          <div className="result-value">{formatCurrency(subscriptionResults.netAmount)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">VL utilisée</div>
                          <div className="result-value">{formatCurrency(subscriptionResults.navUsed)}</div>
                        </div>
                      </div>

                      <div className="projections">
                        <h5>Projections (estimations)</h5>
                        <div className="projection-list">
                          {subscriptionResults.projections.map((proj, idx) => (
                            <div key={idx} className="projection-item">
                              <span className="projection-period">{proj.period}</span>
                              <span className="projection-value">{formatCurrency(proj.value)}</span>
                              <span className="projection-return positive">+{proj.return}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Redemption Form */}
              {operationType === 'redemption' && (
                <div className="operation-form">
                  <h3>Simulation de Rachat</h3>
                  
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Type de rachat</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            value="shares"
                            checked={redemptionType === 'shares'}
                            onChange={(e) => setRedemptionType(e.target.value as 'shares' | 'amount')}
                          />
                          <span>Par nombre de parts</span>
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            value="amount"
                            checked={redemptionType === 'amount'}
                            onChange={(e) => setRedemptionType(e.target.value as 'shares' | 'amount')}
                          />
                          <span>Par montant</span>
                        </label>
                      </div>
                    </div>

                    {redemptionType === 'shares' ? (
                      <div className="form-group full-width">
                        <label>Nombre de parts à racheter</label>
                        <input
                          type="number"
                          value={numberOfShares}
                          onChange={(e) => setNumberOfShares(e.target.value)}
                          placeholder="0.0000"
                          step="0.0001"
                        />
                      </div>
                    ) : (
                      <div className="form-group full-width">
                        <label>Montant souhaité</label>
                        <div className="input-with-currency">
                          <input
                            type="number"
                            value={redemptionAmount}
                            onChange={(e) => setRedemptionAmount(e.target.value)}
                            placeholder="0"
                          />
                          <span className="currency">FCFA</span>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Date de rachat</label>
                      <input
                        type="date"
                        value={redemptionDate}
                        onChange={(e) => setRedemptionDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Frais de sortie</label>
                      <input
                        type="text"
                        value={`${selectedFund.exitFees}%`}
                        disabled
                        className="disabled-input"
                      />
                    </div>
                  </div>

                  {/* Results */}
                  {redemptionResults && (
                    <div className="results-section">
                      <h4>Résultats de la Simulation</h4>
                      
                      <div className="results-grid">
                        <div className="result-card primary">
                          <div className="result-label">Montant net à recevoir</div>
                          <div className="result-value positive">{formatCurrency(redemptionResults.netAmount)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Nombre de parts</div>
                          <div className="result-value">{redemptionResults.numberOfShares.toFixed(4)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">VL de cession</div>
                          <div className="result-value">{formatCurrency(redemptionResults.navUsed)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Valeur brute</div>
                          <div className="result-value">{formatCurrency(redemptionResults.grossValue)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Frais de sortie</div>
                          <div className="result-value negative">-{formatCurrency(redemptionResults.exitFees)}</div>
                        </div>
                      </div>

                      <div className="performance-summary">
                        <h5>Performance de l'investissement</h5>
                        <div className="performance-grid">
                          <div className="performance-item">
                            <span className="performance-label">Investissement initial</span>
                            <span className="performance-value">{formatCurrency(redemptionResults.initialInvestment)}</span>
                          </div>
                          <div className="performance-item">
                            <span className="performance-label">Plus/Moins-value</span>
                            <span className={`performance-value ${redemptionResults.capitalGain >= 0 ? 'positive' : 'negative'}`}>
                              {redemptionResults.capitalGain >= 0 ? '+' : ''}{formatCurrency(redemptionResults.capitalGain)}
                            </span>
                          </div>
                          <div className="performance-item">
                            <span className="performance-label">Rendement</span>
                            <span className={`performance-value ${redemptionResults.returnPercentage >= 0 ? 'positive' : 'negative'}`}>
                              {redemptionResults.returnPercentage >= 0 ? '+' : ''}{redemptionResults.returnPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div className="simulator-disclaimer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>
                  <strong>Avertissement:</strong> Les résultats de cette simulation sont fournis à titre indicatif uniquement. 
                  Les performances passées ne préjugent pas des performances futures. Les projections sont basées sur des hypothèses 
                  et ne constituent pas une garantie de rendement.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
