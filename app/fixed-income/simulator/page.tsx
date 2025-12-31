'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type SimulatorType = 'rates' | 'financial-market' | 'mtp';
type OperationType = 'emission' | 'rachat' | 'echange';

interface RatesInputs {
  operationType: OperationType;
  country: string;
  maturity: number;
}

interface FinancialMarketInputs {
  isin: string;
  volume: number;
  price: number;
  purchaseDate: string;
  couponRate: number;
  maturity: string;
  nominal: number;
}

interface MTPInputs {
  yield: number;
  quantity: number;
  maturity: number;
  annualRate: number;
  nominal: number;
}

interface AmortizationRow {
  period: number;
  valueDate: string;
  livingTitles: number;
  debtStart: number;
  coupons: number;
  theoreticalAmortized: number;
  periodAmortization: number;
  periodicFlows: number;
}

export default function SimulatorPage() {
  const [activeSimulator, setActiveSimulator] = useState<SimulatorType>('rates');
  
  // Rates Simulator State
  const [ratesInputs, setRatesInputs] = useState<RatesInputs>({
    operationType: 'emission',
    country: 'Benin',
    maturity: 5,
  });

  // Financial Market Simulator State
  const [financialInputs, setFinancialInputs] = useState<FinancialMarketInputs>({
    isin: 'BJ0000000001',
    volume: 1000000,
    price: 99.5,
    purchaseDate: new Date().toISOString().split('T')[0],
    couponRate: 6.5,
    maturity: '2030-12-31',
    nominal: 10000,
  });

  // MTP Simulator State
  const [mtpInputs, setMTPInputs] = useState<MTPInputs>({
    yield: 7.5,
    quantity: 5000,
    maturity: 7,
    annualRate: 6.8,
    nominal: 10000,
  });

  const [showResults, setShowResults] = useState(false);

  // Calculate Rates Results
  const ratesResults = useMemo(() => {
    const baseRate = 5.5;
    const countryPremium = ratesInputs.country === 'Benin' ? 0.5 : ratesInputs.country === 'Togo' ? 0.6 : 0.7;
    const maturityPremium = ratesInputs.maturity * 0.15;
    const operationAdjustment = ratesInputs.operationType === 'emission' ? 0 : ratesInputs.operationType === 'rachat' ? -0.2 : 0.1;
    
    const estimatedRate = baseRate + countryPremium + maturityPremium + operationAdjustment;
    const minRate = estimatedRate - 0.5;
    const maxRate = estimatedRate + 0.5;
    
    return {
      estimatedRate: estimatedRate.toFixed(2),
      minRate: minRate.toFixed(2),
      maxRate: maxRate.toFixed(2),
      marketCondition: estimatedRate > 7 ? 'Favorable' : estimatedRate > 6 ? 'Normal' : 'Unfavorable',
      recommendation: estimatedRate > 7 ? 'Attractive investment opportunity' : 'Standard market conditions',
    };
  }, [ratesInputs]);

  // Calculate Financial Market Results
  const financialResults = useMemo(() => {
    const totalInvestment = (financialInputs.volume / financialInputs.nominal) * financialInputs.price * financialInputs.nominal / 100;
    const annualCoupon = financialInputs.volume * (financialInputs.couponRate / 100);
    const yearsToMaturity = Math.floor((new Date(financialInputs.maturity).getTime() - new Date(financialInputs.purchaseDate).getTime()) / (365 * 24 * 60 * 60 * 1000));
    const totalCoupons = annualCoupon * yearsToMaturity;
    const redemptionValue = financialInputs.volume;
    const totalReturn = totalCoupons + redemptionValue - totalInvestment;
    const yieldToMaturity = ((totalReturn / totalInvestment) / yearsToMaturity) * 100;

    return {
      totalInvestment: totalInvestment.toFixed(2),
      annualCoupon: annualCoupon.toFixed(2),
      totalCoupons: totalCoupons.toFixed(2),
      redemptionValue: redemptionValue.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      yieldToMaturity: yieldToMaturity.toFixed(2),
      yearsToMaturity,
    };
  }, [financialInputs]);

  // Calculate MTP Amortization Schedule
  const mtpAmortizationSchedule = useMemo((): AmortizationRow[] => {
    const schedule: AmortizationRow[] = [];
    const totalDebt = mtpInputs.quantity * mtpInputs.nominal;
    const annualAmortization = mtpInputs.quantity / mtpInputs.maturity;
    
    for (let i = 1; i <= mtpInputs.maturity; i++) {
      const livingTitlesStart = mtpInputs.quantity - (annualAmortization * (i - 1));
      const debtStart = livingTitlesStart * mtpInputs.nominal;
      const coupons = debtStart * (mtpInputs.annualRate / 100);
      const periodAmortization = annualAmortization * mtpInputs.nominal;
      const periodicFlows = coupons + periodAmortization;
      
      const valueDate = new Date();
      valueDate.setFullYear(valueDate.getFullYear() + i);
      
      schedule.push({
        period: i,
        valueDate: valueDate.toLocaleDateString('fr-FR'),
        livingTitles: Math.round(livingTitlesStart),
        debtStart: debtStart,
        coupons: coupons,
        theoreticalAmortized: Math.round(annualAmortization),
        periodAmortization: periodAmortization,
        periodicFlows: periodicFlows,
      });
    }
    
    return schedule;
  }, [mtpInputs]);

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    if (activeSimulator === 'rates') {
      setRatesInputs({ operationType: 'emission', country: 'Benin', maturity: 5 });
    } else if (activeSimulator === 'financial-market') {
      setFinancialInputs({
        isin: 'BJ0000000001',
        volume: 1000000,
        price: 99.5,
        purchaseDate: new Date().toISOString().split('T')[0],
        couponRate: 6.5,
        maturity: '2030-12-31',
        nominal: 10000,
      });
    } else {
      setMTPInputs({ yield: 7.5, quantity: 5000, maturity: 7, annualRate: 6.8, nominal: 10000 });
    }
  };

  return (
    <div className="simulator-page">
      <div className="simulator-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/fixed-income">Fixed Income</Link>
        <span>/</span>
        <span>Simulator</span>
      </div>

      <div className="simulator-header">
        <div className="header-content">
          <h1>Bond Simulator</h1>
          <p>Simulate and analyze different bond scenarios</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Active Simulator</span>
            <strong className="stat-value">{activeSimulator === 'rates' ? 'Rates' : activeSimulator === 'financial-market' ? 'Financial' : 'MTP'}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Simulations</span>
            <strong className="stat-value">{showResults ? '1' : '0'}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Status</span>
            <strong className="stat-value">{showResults ? 'Complete' : 'Ready'}</strong>
          </div>
        </div>
      </div>

      <div className="simulator-content">
        <div className="simulator-tabs">
          <button
            className={activeSimulator === 'rates' ? 'active' : ''}
            onClick={() => { setActiveSimulator('rates'); setShowResults(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Interest Rate Simulator
          </button>
          <button
            className={activeSimulator === 'financial-market' ? 'active' : ''}
            onClick={() => { setActiveSimulator('financial-market'); setShowResults(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Financial Market
          </button>
          <button
            className={activeSimulator === 'mtp' ? 'active' : ''}
            onClick={() => { setActiveSimulator('mtp'); setShowResults(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            MTP Simulator
          </button>
        </div>

        <div className="simulator-body">
          <div className="simulator-inputs">
            {activeSimulator === 'rates' && (
              <>
                <h3>Simulation Parameters</h3>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Operation Type</label>
                    <select
                      value={ratesInputs.operationType}
                      onChange={(e) => setRatesInputs({ ...ratesInputs, operationType: e.target.value as OperationType })}
                    >
                      <option value="emission">Issuance</option>
                      <option value="rachat">Buyback</option>
                      <option value="echange">Exchange</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Country</label>
                    <select
                      value={ratesInputs.country}
                      onChange={(e) => setRatesInputs({ ...ratesInputs, country: e.target.value })}
                    >
                      <option value="Benin">🇧🇯 Bénin</option>
                      <option value="Togo">🇹🇬 Togo</option>
                      <option value="Senegal">🇸🇳 Sénégal</option>
                      <option value="Cote d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                      <option value="Mali">🇲🇱 Mali</option>
                      <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                      <option value="Niger">🇳🇪 Niger</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Maturité (années)</label>
                    <input
                      type="number"
                      value={ratesInputs.maturity}
                      onChange={(e) => setRatesInputs({ ...ratesInputs, maturity: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSimulator === 'financial-market' && (
              <>
                <h3>Simulation Parameters</h3>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Code ISIN</label>
                    <input
                      type="text"
                      value={financialInputs.isin}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, isin: e.target.value })}
                      placeholder="BJ0000000001"
                    />
                  </div>
                  <div className="input-group">
                    <label>Volume (units)</label>
                    <input
                      type="number"
                      value={financialInputs.volume}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, volume: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Prix (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={financialInputs.price}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={financialInputs.purchaseDate}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Coupon Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={financialInputs.couponRate}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, couponRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Maturity Date</label>
                    <input
                      type="date"
                      value={financialInputs.maturity}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, maturity: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Nominal Value</label>
                    <input
                      type="number"
                      value={financialInputs.nominal}
                      onChange={(e) => setFinancialInputs({ ...financialInputs, nominal: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </>
            )}

            {activeSimulator === 'mtp' && (
              <>
                <h3>Simulation Parameters</h3>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Yield (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={mtpInputs.yield}
                      onChange={(e) => setMTPInputs({ ...mtpInputs, yield: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Number of Securities</label>
                    <input
                      type="number"
                      value={mtpInputs.quantity}
                      onChange={(e) => setMTPInputs({ ...mtpInputs, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Maturity (years)</label>
                    <input
                      type="number"
                      value={mtpInputs.maturity}
                      onChange={(e) => setMTPInputs({ ...mtpInputs, maturity: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="30"
                    />
                  </div>
                  <div className="input-group">
                    <label>Annual Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={mtpInputs.annualRate}
                      onChange={(e) => setMTPInputs({ ...mtpInputs, annualRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Nominal Value</label>
                    <input
                      type="number"
                      value={mtpInputs.nominal}
                      onChange={(e) => setMTPInputs({ ...mtpInputs, nominal: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="action-buttons">
              <button className="btn-calculate" onClick={handleCalculate}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Calculate
              </button>
              <button className="btn-reset" onClick={handleReset}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Reset
              </button>
            </div>
          </div>

          {showResults && (
            <div className="simulator-results">
              {activeSimulator === 'rates' && (
                <>
                  <h3>Simulation Results</h3>
                  <div className="results-grid">
                    <div className="result-card highlight">
                      <div className="result-label">Estimated Rate</div>
                      <div className="result-value">{ratesResults.estimatedRate}%</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Minimum Rate</div>
                      <div className="result-value">{ratesResults.minRate}%</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Maximum Rate</div>
                      <div className="result-value">{ratesResults.maxRate}%</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Market Condition</div>
                      <div className="result-value">{ratesResults.marketCondition}</div>
                    </div>
                  </div>
                  <div className="recommendation-box">
                    <h4>Recommendation</h4>
                    <p>{ratesResults.recommendation}</p>
                  </div>
                </>
              )}

              {activeSimulator === 'financial-market' && (
                <>
                  <h3>Security Profile</h3>
                  <div className="identity-sections">
                    <div className="identity-section">
                      <h4>Summary Characteristics</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Code ISIN</span>
                          <strong>{financialInputs.isin}</strong>
                        </div>
                        <div className="info-item">
                          <span>Volume</span>
                          <strong>{financialInputs.volume.toLocaleString()} unités</strong>
                        </div>
                        <div className="info-item">
                          <span>Prix d'achat</span>
                          <strong>{financialInputs.price}%</strong>
                        </div>
                        <div className="info-item">
                          <span>Remaining Duration</span>
                          <strong>{financialResults.yearsToMaturity} years</strong>
                        </div>
                      </div>
                    </div>

                    <div className="identity-section">
                      <h4>Financial Charges</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Total Investment</span>
                          <strong>{parseFloat(financialResults.totalInvestment).toLocaleString()} XOF</strong>
                        </div>
                        <div className="info-item">
                          <span>Annual Coupon</span>
                          <strong>{parseFloat(financialResults.annualCoupon).toLocaleString()} XOF</strong>
                        </div>
                        <div className="info-item">
                          <span>Total Coupons</span>
                          <strong>{parseFloat(financialResults.totalCoupons).toLocaleString()} XOF</strong>
                        </div>
                      </div>
                    </div>

                    <div className="identity-section">
                      <h4>Total Cost</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Redemption Value</span>
                          <strong>{parseFloat(financialResults.redemptionValue).toLocaleString()} XOF</strong>
                        </div>
                        <div className="info-item">
                          <span>Total Return</span>
                          <strong>{parseFloat(financialResults.totalReturn).toLocaleString()} XOF</strong>
                        </div>
                        <div className="info-item">
                          <span>Yield to Maturity</span>
                          <strong>{financialResults.yieldToMaturity}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="identity-section">
                      <h4>Sale Conditions</h4>
                      <div className="info-items">
                        <div className="info-item">
                          <span>Purchase Date</span>
                          <strong>{new Date(financialInputs.purchaseDate).toLocaleDateString('fr-FR')}</strong>
                        </div>
                        <div className="info-item">
                          <span>Maturity Date</span>
                          <strong>{new Date(financialInputs.maturity).toLocaleDateString('fr-FR')}</strong>
                        </div>
                        <div className="info-item">
                          <span>Coupon Rate</span>
                          <strong>{financialInputs.couponRate}%</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSimulator === 'mtp' && (
                <>
                  <h3>Amortization Schedule</h3>
                  <div className="amortization-table-wrapper">
                    <table className="amortization-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Value Date</th>
                          <th className="number-col">Living Securities</th>
                          <th className="number-col">Starting Debt</th>
                          <th className="number-col">Coupons</th>
                          <th className="number-col">Amortized Securities</th>
                          <th className="number-col">Amortization</th>
                          <th className="number-col">Periodic Flows</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mtpAmortizationSchedule.map((row) => (
                          <tr key={row.period}>
                            <td>{row.period}</td>
                            <td>{row.valueDate}</td>
                            <td className="number-col">{row.livingTitles.toLocaleString()}</td>
                            <td className="number-col">{row.debtStart.toLocaleString()}</td>
                            <td className="number-col">{row.coupons.toLocaleString()}</td>
                            <td className="number-col">{row.theoreticalAmortized.toLocaleString()}</td>
                            <td className="number-col">{row.periodAmortization.toLocaleString()}</td>
                            <td className="number-col">{row.periodicFlows.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
