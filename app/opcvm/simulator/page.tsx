'use client';

import { useState, useMemo, useEffect } from 'react';
import OPCVMSelector from '@/components/comparison/OPCVMSelector';
import TechnicalAnalysisChart from '@/components/charts/TechnicalAnalysisChart';
import { useOpcvmMetricRepository } from '@/core/infra/repositories/opcvm.repository.impl';
import { OPCVMEntity, OPCVMMetricEntity } from '@/core/domain/entities/opcvm.entity';

type OperationType = 'subscription' | 'redemption';

export default function OPCVMSimulatorPage() {
  // Selected Fund
  const [selectedFund, setSelectedFund] = useState<OPCVMEntity | null>(null);
  const [sortedData, setSortedData] = useState<OPCVMMetricEntity[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'strategy'>('fees');
  
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

  // Popup state
  const [showFundsPopup, setShowFundsPopup] = useState(false);
  const { allOpcvmMetricsData, getAllOpcvmMetrics } = useOpcvmMetricRepository();

  const selectedOPCVMs = selectedFund ? [selectedFund] : [];
  const fundNav = selectedFund?.latest_metrics?.liquidative_value ?? selectedFund?.valeur_demarrage ?? 0;
  const entryFees = selectedFund?.max_souscription ?? 0;
  const exitFees = selectedFund?.max_rachat ?? 0;
  const managementFees = selectedFund?.max_gestion ?? 0;
  const minSubscription = selectedFund?.souscription_min ?? selectedFund?.valeur_demarrage ?? 0;
  const fundManager = typeof selectedFund?.sgo === 'string' ? selectedFund.sgo : selectedFund?.sgo?.name;

  const handleSelectFund = (opcvm: OPCVMEntity) => {
    setSelectedFund(opcvm);
    setShowFundsPopup(false);
  };

  const handleRemoveFund = () => {
    setSelectedFund(null);
  };

  useEffect(() => {
    if (!selectedFund?.id) {
      setSortedData([]);
      return;
    }

    getAllOpcvmMetrics({ view_type: "screener", page: -1, opcvm: selectedFund.id });
  }, [selectedFund?.id]);

  useEffect(() => {
    const sortedMetrics = allOpcvmMetricsData?.data ? [...allOpcvmMetricsData.data].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) : [];

    setSortedData(sortedMetrics);
  }, [allOpcvmMetricsData]);

  useEffect(() =>
  {
    console.log("Current OPCVM Data", selectedFund);
  }, [selectedFund])


  // Calculations for Subscription
  const subscriptionResults = useMemo(() => {
    if (!selectedFund || !investmentAmount) return null;

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount < minSubscription || fundNav <= 0) return null;

    const entryFeesAmount = (amount * entryFees) / 100;
    const netAmount = amount - entryFeesAmount;
    const numberOfShares = netAmount / fundNav;

    const projections = [
      { period: '3 months', value: netAmount * 1.02, return: 2 },
      { period: '1 year', value: netAmount * 1.08, return: 8 },
      { period: '3 years', value: netAmount * 1.26, return: 26 }
    ];

    return {
      grossAmount: amount,
      entryFees: entryFeesAmount,
      netAmount,
      numberOfShares,
      navUsed: fundNav,
      projections
    };
  }, [selectedFund, investmentAmount, minSubscription, fundNav, entryFees]);

  // Calculations for Redemption
  const redemptionResults = useMemo(() => {
    if (!selectedFund) return null;

    let shares = 0;
    if (redemptionType === 'shares') {
      shares = parseFloat(numberOfShares);
    } else {
      const amount = parseFloat(redemptionAmount);
      if (!isNaN(amount)) {
        shares = amount / fundNav;
      }
    }

    if (isNaN(shares) || shares <= 0 || fundNav <= 0) return null;

    const grossValue = shares * fundNav;
    const exitFeesAmount = (grossValue * exitFees) / 100;
    const netAmount = grossValue - exitFeesAmount;

    const initialNav = fundNav * 0.9;
    const initialInvestment = shares * initialNav;
    const capitalGain = netAmount - initialInvestment;
    const returnPercentage = ((netAmount - initialInvestment) / initialInvestment) * 100;

    return {
      numberOfShares: shares,
      navUsed: fundNav,
      grossValue,
      exitFees: exitFeesAmount,
      netAmount,
      initialInvestment,
      capitalGain,
      returnPercentage
    };
  }, [selectedFund, redemptionType, numberOfShares, redemptionAmount, fundNav, exitFees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDetailCurrency = (amount?: number | null) => {
    if (amount) {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
    return "--";
  };

  const formatLargeCurrency = (amount?: number | null) => {
    if (amount) {
      if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(2)} Mds`;
      } else if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(2)} M`;
      }
      return formatDetailCurrency(amount);
    }
    return "--";
  };

  const getPeriodicite = (periodicite: string): string => {
    switch(periodicite){
      case 'J':
        return 'Daily';
      case 'H':
        return 'Weekly';
      case 'M':
        return 'Monthly';
      case 'T':
        return 'Quarterly';
      case 'S':
        return 'Semi-Annual';
      case 'A':
        return 'Annual';
      default:
        return 'Not defined';
    }
  };

  return (
    <div className="opcvm-simulator-page">
      {/* Simplified Header */}
      <div className="simulator-header">
        <div 
          className="simulator-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
          }}
        >
          <div className="header-content">
            <div className="header-top">
              <div className="header-title">
                <h1>Subscription / Redemption Simulator</h1>
                <p>Estimate your investments and withdrawals taking into account NAV and fees</p>
              </div>
              
              {selectedFund && (
                <div className="selected-fund-badge">
                  <div className="badge-content">
                    <span className="badge-label">Selected Fund:</span>
                    <span className="badge-name">{selectedFund.intitule}</span>
                  </div>
                  <button 
                    className="badge-change-btn"
                    onClick={() => setShowFundsPopup(true)}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        className="floating-add-fund-btn"
        onClick={() => setShowFundsPopup(true)}
        title="Select a fund"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Select Fund</span>
      </button>

      {/* Funds Selection Popup */}
      {showFundsPopup && (
        <div className="funds-popup-overlay" onClick={() => setShowFundsPopup(false)}>
          <div className="funds-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Select a Fund</h2>
              <button className="popup-close" onClick={() => setShowFundsPopup(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="popup-funds-list">
              <OPCVMSelector
                selectedOPCVMs={selectedOPCVMs}
                onAddStock={handleSelectFund}
                onRemoveStock={handleRemoveFund}
                maxStocks={1}
              />
            </div>
          </div>
        </div>
      )}

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
              <h3>Select a Fund</h3>
              <p>Click the button below to choose a fund and view its chart</p>
            </div>
          ) : (
            <div className="content-chart">
              <div className="chart-section">
                {sortedData.length > 0 ? (
                  <TechnicalAnalysisChart
                    data={sortedData}
                    defaultMetrics={['liquidative_value']}
                    defaultTimeFrame="1Y"
                    showToolbox={true}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                  }}>
                    {allOpcvmMetricsData ? 'No historical data available' : 'Loading chart data...'}
                  </div>
                )}
              </div>

              <div className="details-section">
                <div className="details-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fees')}
                  >
                    Fees & Commissions
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                  >
                    General Information
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('strategy')}
                  >
                    Strategy
                  </button>
                </div>

                <div className="details-content">
                  {activeTab === 'general' && (
                    <div className="details-grid full-width">
                      <div className="detail-column">
                        <div className="detail-item">
                          <span className="label">Manager</span>
                          <span className="value">{fundManager || "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Promoters</span>
                          <span className="value">{selectedFund.promoteurs ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Custodian</span>
                          <span className="value">{selectedFund.depositaire ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Auditors</span>
                          <span className="value">{selectedFund.commissaires_comptes ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">CEO</span>
                          <span className="value">{selectedFund.directeur_general ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">NAV Frequency</span>
                          <span className="value">{getPeriodicite(selectedFund.periodicite || '')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'fees' && (
                    <div className="details-grid two-columns">
                      <div className="detail-column">
                        <div className="detail-item">
                          <span className="label">Subscription Fee</span>
                          <span className="value">{selectedFund.max_souscription ?? "--"}%</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Redemption Fee</span>
                          <span className="value">{selectedFund.max_rachat ?? "--"}%</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Management Fee</span>
                          <span className="value">{selectedFund.max_gestion ?? "--"}%</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Account Commission</span>
                          <span className="value">{selectedFund.commission_au_compte}{selectedFund.commission_au_compte_type === 'amount' ? (typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol) : '%'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Market Authority Fee</span>
                          <span className="value">{selectedFund.redevance_autorite_marche}{selectedFund.redevance_autorite_marche_type === 'amount' ? (typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol) : '%'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Commission Retrocession</span>
                          <span className="value">{selectedFund.retrocession_commission ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Income Allocation</span>
                          <span className="value">{selectedFund.affectation_resultat ? selectedFund.affectation_resultat.toUpperCase() : "--"}</span>
                        </div>
                      </div>

                      <div className="detail-column">
                        <div className="detail-item">
                          <span className="label">Minimum Subscription</span>
                          <span className="value">{formatLargeCurrency(selectedFund.souscription_min)} </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Initial Value</span>
                          <span className="value">{formatDetailCurrency(selectedFund.valeur_demarrage)} {typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Initial Capital</span>
                          <span className="value">{formatLargeCurrency(selectedFund.capital_initial)} {typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Recommended Holding Period</span>
                          <span className="value">{selectedFund.duree_placement_recommandee ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Settlement Period</span>
                          <span className="value">{selectedFund.delai_reglement_depositaire ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Creation Date</span>
                          <span className="value">{selectedFund.date_creation ? new Date(selectedFund.date_creation).toLocaleDateString('en-EN') : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Approval Date</span>
                          <span className="value">{selectedFund.date_agrement ? new Date(selectedFund.date_agrement).toLocaleDateString('en-EN') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'strategy' && (
                    <div className="details-grid full-width">
                      <div className="detail-column">
                        <div className="detail-item vertical">
                          <span className="label">Investment Objective</span>
                          <p className="value-text">
                            {selectedFund.objectif_investissement ?? "--"}
                          </p>
                        </div>
                        <div className="detail-item vertical">
                          <span className="label">Strategic Orientation</span>
                          <p className="value-text">
                            {selectedFund.orientation_strategique ?? "--"}
                          </p>
                        </div>
                        <div className="detail-item">
                          <span className="label">Benchmark Index</span>
                          <span className="value">{selectedFund.indice_description ?? "--"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">SRI (Socially Responsible Investment)</span>
                          <span className={`value ${selectedFund.isr ? "badge-yes" : "badge-no"}`}>{selectedFund.isr ? "Yes" : "No"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">SDG Contribution</span>
                          <span className="value">ODD {selectedFund.contribution_odd ?? "--"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              <h3>Select a Fund</h3>
              <p>Choose a fund to start your simulation</p>
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
                  Subscription
                </button>
                <button
                  className={`tab-btn ${operationType === 'redemption' ? 'active' : ''}`}
                  onClick={() => setOperationType('redemption')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Redemption
                </button>
              </div>

              {/* Subscription Form */}
              {operationType === 'subscription' && (
                <div className="operation-form">
                  <h3>Subscription Simulation</h3>
                  
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Amount to Invest</label>
                      <div className="input-with-currency">
                        <input
                          type="number"
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          placeholder="0"
                          min={minSubscription}
                        />
                        <span className="currency">{typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol}</span>
                      </div>
                      {investmentAmount && parseFloat(investmentAmount) < minSubscription && (
                        <span className="error-message">
                          Minimum amount: {formatCurrency(minSubscription)}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Subscription Date</label>
                      <input
                        type="date"
                        value={investmentDate}
                        onChange={(e) => setInvestmentDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Entry Fee</label>
                      <input
                        type="text"
                        value={`${entryFees}%`}
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
                        <span>Scheduled Payments</span>
                      </label>
                    </div>

                    {recurringPayments && (
                      <>
                        <div className="form-group">
                          <label>Monthly Amount</label>
                          <div className="input-with-currency">
                            <input
                              type="number"
                              value={monthlyAmount}
                              onChange={(e) => setMonthlyAmount(e.target.value)}
                              placeholder="0"
                            />
                            <span className="currency">{typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol}</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Number of Months</label>
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
                      <h4>Simulation Results</h4>
                      
                      <div className="results-grid">
                        <div className="result-card primary">
                          <div className="result-label">Number of Shares Received</div>
                          <div className="result-value">{subscriptionResults.numberOfShares.toFixed(4)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Gross Amount Invested</div>
                          <div className="result-value">{formatCurrency(subscriptionResults.grossAmount)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Entry Fee</div>
                          <div className="result-value negative">-{formatCurrency(subscriptionResults.entryFees)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Net Amount Invested</div>
                          <div className="result-value">{formatCurrency(subscriptionResults.netAmount)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">NAV Used</div>
                          <div className="result-value">{formatCurrency(subscriptionResults.navUsed)}</div>
                        </div>
                      </div>

                      <div className="projections">
                        <h5>Projections (estimates)</h5>
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
                  <h3>Redemption Simulation</h3>
                  
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Redemption Type</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            value="shares"
                            checked={redemptionType === 'shares'}
                            onChange={(e) => setRedemptionType(e.target.value as 'shares' | 'amount')}
                          />
                          <span>By Number of Shares</span>
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            value="amount"
                            checked={redemptionType === 'amount'}
                            onChange={(e) => setRedemptionType(e.target.value as 'shares' | 'amount')}
                          />
                          <span>By Amount</span>
                        </label>
                      </div>
                    </div>

                    {redemptionType === 'shares' ? (
                      <div className="form-group full-width">
                        <label>Number of Shares to Redeem</label>
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
                        <label>Desired Amount</label>
                        <div className="input-with-currency">
                          <input
                            type="number"
                            value={redemptionAmount}
                            onChange={(e) => setRedemptionAmount(e.target.value)}
                            placeholder="0"
                          />
                          <span className="currency">{typeof selectedFund.currency === 'string' ? selectedFund.currency : selectedFund.currency?.symbol}</span>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Redemption Date</label>
                      <input
                        type="date"
                        value={redemptionDate}
                        onChange={(e) => setRedemptionDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Exit Fee</label>
                      <input
                        type="text"
                        value={`${exitFees}%`}
                        disabled
                        className="disabled-input"
                      />
                    </div>
                  </div>

                  {/* Results */}
                  {redemptionResults && (
                    <div className="results-section">
                      <h4>Simulation Results</h4>
                      
                      <div className="results-grid">
                        <div className="result-card primary">
                          <div className="result-label">Net Amount to Receive</div>
                          <div className="result-value positive">{formatCurrency(redemptionResults.netAmount)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Number of Shares</div>
                          <div className="result-value">{redemptionResults.numberOfShares.toFixed(4)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Redemption NAV</div>
                          <div className="result-value">{formatCurrency(redemptionResults.navUsed)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Gross Value</div>
                          <div className="result-value">{formatCurrency(redemptionResults.grossValue)}</div>
                        </div>

                        <div className="result-card">
                          <div className="result-label">Exit Fee</div>
                          <div className="result-value negative">-{formatCurrency(redemptionResults.exitFees)}</div>
                        </div>
                      </div>

                      <div className="performance-summary">
                        <h5>Investment Performance</h5>
                        <div className="performance-grid">
                          <div className="performance-item">
                            <span className="performance-label">Initial Investment</span>
                            <span className="performance-value">{formatCurrency(redemptionResults.initialInvestment)}</span>
                          </div>
                          <div className="performance-item">
                            <span className="performance-label">Capital Gain/Loss</span>
                            <span className={`performance-value ${redemptionResults.capitalGain >= 0 ? 'positive' : 'negative'}`}>
                              {redemptionResults.capitalGain >= 0 ? '+' : ''}{formatCurrency(redemptionResults.capitalGain)}
                            </span>
                          </div>
                          <div className="performance-item">
                            <span className="performance-label">Return</span>
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
                  <strong>Disclaimer:</strong> The results of this simulation are provided for informational purposes only.
                  Past performance is not indicative of future performance. Projections are based on assumptions
                  and do not constitute a guarantee of return.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
