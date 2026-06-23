'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import MultiSelect from '@/components/corporate-events/MultiSelect';

type BondType = 'financial-primary' | 'financial-secondary' | 'mtp-secondary' | 'mtp-primary';


export default function BondDetailPage() {
  const params = useParams();
  const bondType = params.type as BondType;
  const isin = params.isin as string;

  // Mock bond data based on type
  const bondData = useMemo(() => {
    if (bondType === 'financial-primary') {
      return {
        isin: isin || 'CIBRVM001',
        name: 'Côte d\'Ivoire 6.5% 2028',
        issuer: 'Republic of Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Corporate Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 6.5,
        couponFrequency: 'Semi-annual',
        issueDate: '2024-01-15',
        valueDate: '2024-01-20',
        maturityDate: '2028-12-31',
        issuePrice: 98.5,
        currentPrice: 99.2,
        ytm: 7.8,
        spread: 2.5,
        duration: 4.2,
        convexity: 18.5,
        redemptionType: 'In fine',
        dayCount: '30/360',
        settlement: 'T+2',
        outstanding: 50000000000,
        minSubscription: 10000,
      };
    } else if (bondType === 'financial-secondary') {
      return {
        isin: isin || 'CIBRVM101',
        name: 'Côte d\'Ivoire 6.5% 2028',
        issuer: 'Republic of Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Corporate Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 6.5,
        currentPrice: 99.5,
        previousPrice: 98.8,
        yield: 7.8,
        previousYield: 7.5,
        spread: 1.7,
        tradedVolume: 15000000,
        tradedValue: 14925000000,
        exchangeRatio: 0.85,
        transactionCount: 12,
        maturityDate: '2028-01-15',
      };
    } else if (bondType === 'mtp-secondary') {
      return {
        isin: isin || 'TPCI0001',
        name: 'Trésor Public CI 5.5% 2027',
        issuer: 'Trésor Public de Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Treasury Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 5.5,
        currentPrice: 100.2,
        yield: 5.3,
        spread: 1.2,
        tradedVolume: 25000000,
        exchangeRatio: 0.92,
        transactionCount: 18,
        maturityDate: '2027-06-30',
      };
    } else {
      return {
        isin: isin || 'TPCI0002',
        name: 'Trésor Public CI 6.0% 2026',
        issuer: 'Trésor Public de Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Treasury Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 6.0,
        issuePrice: 99.0,
        avgYield: 6.2,
        marginalPrice: 98.8,
        absorptionRate: 85.5,
        participantCount: 22,
        submissionCount: 45,
        coverageRatio: 1.25,
        maturityDate: '2026-12-15',
      };
    }
  }, [bondType, isin]);


  const getCountryFlag = (country: string): string => {
    const flags: { [key: string]: string } = {
      'Côte d\'Ivoire': '🇨🇮',
      'Senegal': '🇸🇳',
      'Benin': '🇧🇯',
    };
    return flags[country] || '🏳️';
  };


  const [activeTab, setActiveTab] = useState('overview');
  const [purchasePrice, setPurchasePrice] = useState(bondData.currentPrice || 100);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [reinvestmentRate, setReinvestmentRate] = useState(5.0);
  const [stressTestShock, setStressTestShock] = useState(0);

  // Mock data pour les graphiques et tableaux
  const priceHistoryData = useMemo(() => {
    const data = [];
    const startDate = new Date(bondData.issueDate || '2024-01-01');
    const endDate = new Date(bondData.maturityDate);
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= Math.min(days, 365); i += 7) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const price = 98 + Math.random() * 4 + (i / days) * 2;
      data.push({ date: date.toISOString().split('T')[0], price: price.toFixed(2) });
    }
    return data;
  }, [bondData]);

  const cashflowData = useMemo(() => {
    const flows = [];
    const startDate = new Date(bondData.issueDate || '2024-01-01');
    const maturityDate = new Date(bondData.maturityDate);
    const frequency = bondData.couponFrequency === 'Semi-annual' ? 6 : 12;
    
    let currentDate = new Date(startDate);
    let flowNumber = 1;
    
    while (currentDate <= maturityDate) {
      currentDate.setMonth(currentDate.getMonth() + frequency);
      if (currentDate <= maturityDate) {
        const couponAmount = (bondData.nominal || 10000) * (bondData.coupon || 6.5) / 100 / (12 / frequency);
        const daysRemaining = Math.floor((currentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const discountedFlow = couponAmount / Math.pow(1 + (bondData.ytm || 7) / 100, daysRemaining / 365);
        
        flows.push({
          date: currentDate.toISOString().split('T')[0],
          type: 'Coupon',
          coupon: couponAmount,
          principal: 0,
          total: couponAmount,
          discounted: discountedFlow,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        });
      }
    }
    
    // Remboursement du principal à maturité
    const principalAmount = bondData.nominal || 10000;
    const daysToMaturity = Math.floor((maturityDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    flows.push({
      date: bondData.maturityDate,
      type: 'Principal + Coupon',
      coupon: (bondData.nominal || 10000) * (bondData.coupon || 6.5) / 100 / (12 / frequency),
      principal: principalAmount,
      total: principalAmount + ((bondData.nominal || 10000) * (bondData.coupon || 6.5) / 100 / (12 / frequency)),
      discounted: principalAmount / Math.pow(1 + (bondData.ytm || 7) / 100, daysToMaturity / 365),
      daysRemaining: daysToMaturity > 0 ? daysToMaturity : 0
    });
    
    return flows.filter(f => f.daysRemaining >= 0);
  }, [bondData]);

  const stressTestData = useMemo(() => {
    const baseYield = bondData.ytm || bondData.yield || 7;
    const shocks = [-200, -100, -50, 0, 50, 100, 200];
    
    return shocks.map(shock => {
      const newYield = baseYield + (shock / 100);
      const basePrice = bondData.currentPrice || 100;
      const priceChange = -(bondData.duration || 4.2) * (shock / 100);
      const newPrice = basePrice * (1 + priceChange / 100);
      
      return {
        shock,
        newYield: newYield.toFixed(2),
        price: newPrice.toFixed(2),
        changePercent: priceChange.toFixed(2),
        changeValue: ((newPrice - basePrice) * (bondData.nominal || 10000) / 100).toFixed(0)
      };
    });
  }, [bondData]);

  const volumeHistoryData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      volume: Math.floor(Math.random() * 50000000) + 10000000
    }));
  }, []);

  const spreadHistoryData = useMemo(() => {
    const data = [];
    for (let i = 12; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        date: date.toISOString().split('T')[0].substring(0, 7),
        spread: 150 + Math.random() * 100
      });
    }
    return data;
  }, []);

  const issuerBondsData = useMemo(() => {
    return [
      { name: 'CI 5.5% 2026', maturity: 2.5, ytm: 6.2, isin: 'CIBRVM001' },
      { name: 'CI 6.0% 2027', maturity: 3.5, ytm: 6.8, isin: 'CIBRVM002' },
      { name: 'CI 6.5% 2028', maturity: 4.5, ytm: 7.2, isin: bondData.isin, current: true },
      { name: 'CI 7.0% 2030', maturity: 6.5, ytm: 7.8, isin: 'CIBRVM004' },
    ];
  }, [bondData.isin]);

  const calculateRemainingDays = () => {
    const today = new Date();
    const maturity = new Date(bondData.maturityDate);
    return Math.floor((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateYTM = (price: number) => {
    const baseYTM = bondData.ytm || 7;
    const priceChange = ((bondData.currentPrice || 100) - price) / (bondData.currentPrice || 100);
    return baseYTM + priceChange * 10;
  };

  return (
    <div className="bond-detail-page">
      <div className="bond-detail-header">
        <div 
          className="bond-detail-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
          }}
        >
          <div className="bond-title-section">
            <div className="title-row">
              <h1>
                <span className="country-flag">{getCountryFlag(bondData.country)}</span>
                {bondData.name}
              </h1>
              <div className="bond-meta">
                <span className="badge badge-isin">{bondData.isin}</span>
                <span className="badge badge-type">{bondData.bondType}</span>
              </div>
            </div>
            <div className="key-metrics">
              {bondData.currentPrice && <div className="metric"><span>Price:</span> <strong>{bondData.currentPrice.toFixed(2)}%</strong></div>}
              {bondData.ytm && <div className="metric"><span>YTM:</span> <strong>{bondData.ytm.toFixed(2)}%</strong></div>}
              {bondData.yield && <div className="metric"><span>Yield:</span> <strong>{bondData.yield.toFixed(2)}%</strong></div>}
              {bondData.spread && <div className="metric"><span>Spread:</span> <strong>{bondData.spread.toFixed(2)}%</strong></div>}
              <div className="metric"><span>Maturity:</span> <strong>{new Date(bondData.maturityDate).toLocaleDateString('en-US')}</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bond-detail-content">
        {/* Tabs Navigation */}
        <div className="bond-tabs">
          <button 
            className={`bond-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button 
            className={`bond-tab ${activeTab === 'cashflows' ? 'active' : ''}`}
            onClick={() => setActiveTab('cashflows')}
          >
            Cashflows & Rendement
          </button>
          <button 
            className={`bond-tab ${activeTab === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            Analyse de Risque
          </button>
          <button 
            className={`bond-tab ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            Marché & Momentum
          </button>
          <button 
            className={`bond-tab ${activeTab === 'issuer' ? 'active' : ''}`}
            onClick={() => setActiveTab('issuer')}
          >
            Émetteur & Historique
          </button>
        </div>

        {/* Tab Content */}
        <div className="bond-tab-content">
          {activeTab === 'overview' && (
            <div className="tab-pane active">
              <div className="row g-3">
                {/* Fiche Instrument */}
                <div className="col-lg-4">
                  <div className="bond-card">
                    <h3 className="card-title">Fiche Instrument</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Émetteur</span>
                        <span className="value">{bondData.issuer}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Pays</span>
                        <span className="value">{getCountryFlag(bondData.country)} {bondData.country}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">ISIN</span>
                        <span className="value">{bondData.isin}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Date d'émission</span>
                        <span className="value">{new Date(bondData.issueDate || bondData.valueDate || '2024-01-01').toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Date de maturité</span>
                        <span className="value">{new Date(bondData.maturityDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Durée résiduelle</span>
                        <span className="value">{calculateRemainingDays()} jours ({(calculateRemainingDays() / 365).toFixed(1)} ans)</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Valeur nominale</span>
                        <span className="value">{(bondData.nominal || 10000).toLocaleString()} {bondData.currency}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Type de taux</span>
                        <span className="value">Fixe</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Taux facial</span>
                        <span className="value">{bondData.coupon}%</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Fréquence</span>
                        <span className="value">{bondData.couponFrequency || 'Semestriel'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Rang de créance</span>
                        <span className="value">Senior</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Convention</span>
                        <span className="value">{bondData.dayCount || '30/360'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Settlement</span>
                        <span className="value">{bondData.settlement || 'T+2'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Encours</span>
                        <span className="value">{((bondData.outstanding || 50000000000) / 1000000000).toFixed(1)}B {bondData.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graphique de valorisation */}
                <div className="col-lg-8">
                  <div className="bond-card">
                    <div className="card-header-with-filters">
                      <h3 className="card-title">Historique de Valorisation</h3>
                      <div className="filter-buttons">
                        <button className="btn-filter active">Depuis émission</button>
                        <button className="btn-filter">1 an</button>
                        <button className="btn-filter">6 mois</button>
                        <button className="btn-filter">Résiduel</button>
                      </div>
                    </div>
                    <div className="chart-container">
                      <LineChart
                        data={{
                          categories: priceHistoryData.map(d => d.date),
                          series: [{
                            name: 'Prix théorique (%)',
                            values: priceHistoryData.map(d => parseFloat(d.price)),
                            color: 'rgb(37, 99, 235)'
                          }]
                        }}
                        height="300px"
                      />
                    </div>
                  </div>
                </div>

                {/* Fenêtre d'opportunité */}
                <div className="col-lg-6">
                  <div className="bond-card opportunity-card">
                    <h3 className="card-title">Fenêtre d'Opportunité</h3>
                    <div className="opportunity-content">
                      <div className="opportunity-comparison">
                        <div className="price-block">
                          <span className="label">Prix de marché</span>
                          <span className="value">{(bondData.currentPrice || 100).toFixed(2)}%</span>
                        </div>
                        <div className="vs-separator">vs</div>
                        <div className="price-block">
                          <span className="label">Valorisation indicative</span>
                          <span className="value">{((bondData.currentPrice || 100) - 0.5).toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="opportunity-gap">
                        <span className="gap-label">Écart</span>
                        <span className="gap-value positive">+0.50% (+{((bondData.nominal || 10000) * 0.005).toFixed(0)} {bondData.currency})</span>
                      </div>
                      <div className="opportunity-signal">
                        <span className="badge badge-opportunity">Légèrement sous-évalué</span>
                      </div>
                      <p className="opportunity-text">
                        Le titre se négocie légèrement au-dessus de sa valorisation théorique, 
                        suggérant une demande soutenue. L'écart reste dans les normes du marché.
                      </p>
                      <div className="sparkline-container">
                        <small className="text-muted">30 derniers jours</small>
                        <div className="mini-chart">
                          {priceHistoryData.slice(-30).map((d, i) => (
                            <div 
                              key={i} 
                              className="bar" 
                              style={{ height: `${(parseFloat(d.price) - 97) * 10}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicateurs de momentum */}
                <div className="col-lg-6">
                  <div className="bond-card">
                    <h3 className="card-title">Indicateurs de Momentum</h3>
                    <div className="momentum-grid">
                      <div className="momentum-item">
                        <span className="label">Tendance 5j</span>
                        <span className="value positive">+0.8% ↗</span>
                      </div>
                      <div className="momentum-item">
                        <span className="label">Tendance 20j</span>
                        <span className="value positive">+1.2% ↗</span>
                      </div>
                      <div className="momentum-item">
                        <span className="label">Tendance 60j</span>
                        <span className="value negative">-0.5% ↘</span>
                      </div>
                      <div className="momentum-item">
                        <span className="label">Volume relatif</span>
                        <span className="value">1.15x</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '115%' }}></div>
                        </div>
                      </div>
                      <div className="momentum-item">
                        <span className="label">Séances sans cotation</span>
                        <span className="value">0 jours</span>
                      </div>
                      <div className="momentum-item full-width">
                        <span className="label">Score Momentum</span>
                        <div className="momentum-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`star ${star <= 4 ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cashflows' && (
            <div className="tab-pane active">
              <div className="row g-3">
                {/* Échéancier */}
                <div className="col-12">
                  <div className="bond-card">
                    <div className="card-header-with-action">
                      <h3 className="card-title">Échéancier des Flux</h3>
                      <button className="btn btn-sm btn-export">
                        <span>📥</span> Export CSV
                      </button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Date de paiement</th>
                            <th>Type</th>
                            <th className="text-end">Coupon</th>
                            <th className="text-end">Principal</th>
                            <th className="text-end">Flux total</th>
                            <th className="text-end">Flux actualisé</th>
                            <th className="text-end">Jours restants</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashflowData.map((flow, idx) => (
                            <tr key={idx}>
                              <td>{new Date(flow.date).toLocaleDateString('fr-FR')}</td>
                              <td><span className={`badge badge-${flow.type === 'Coupon' ? 'info' : 'success'}`}>{flow.type}</span></td>
                              <td className="text-end">{flow.coupon.toLocaleString()} {bondData.currency}</td>
                              <td className="text-end">{flow.principal > 0 ? flow.principal.toLocaleString() : '-'} {flow.principal > 0 ? bondData.currency : ''}</td>
                              <td className="text-end"><strong>{flow.total.toLocaleString()} {bondData.currency}</strong></td>
                              <td className="text-end">{flow.discounted.toFixed(0).toLocaleString()} {bondData.currency}</td>
                              <td className="text-end">{flow.daysRemaining}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-total">
                            <td colSpan={2}><strong>Total</strong></td>
                            <td className="text-end"><strong>{cashflowData.reduce((sum, f) => sum + f.coupon, 0).toLocaleString()} {bondData.currency}</strong></td>
                            <td className="text-end"><strong>{(bondData.nominal || 10000).toLocaleString()} {bondData.currency}</strong></td>
                            <td className="text-end"><strong>{cashflowData.reduce((sum, f) => sum + f.total, 0).toLocaleString()} {bondData.currency}</strong></td>
                            <td className="text-end"><strong>{cashflowData.reduce((sum, f) => sum + f.discounted, 0).toFixed(0).toLocaleString()} {bondData.currency}</strong></td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Calculateur de rendement */}
                <div className="col-12">
                  <div className="bond-card">
                    <h3 className="card-title">Calculateur de Rendement & TRI</h3>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Prix d'achat (%)</label>
                          <input 
                            type="number" 
                            className="form-control" 
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Date d'achat</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Taux de réinvestissement des coupons (%)</label>
                          <input 
                            type="number" 
                            className="form-control" 
                            value={reinvestmentRate}
                            onChange={(e) => setReinvestmentRate(parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="yield-results">
                      <div className="row g-3 mt-3">
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">YTM (Yield to Maturity)</span>
                            <span className="result-value">{calculateYTM(purchasePrice).toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">Rendement courant</span>
                            <span className="result-value">{((bondData.coupon || 6.5) / purchasePrice * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">Duration de Macaulay</span>
                            <span className="result-value">{(bondData.duration || 4.2).toFixed(2)} ans</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">Duration modifiée</span>
                            <span className="result-value">{((bondData.duration || 4.2) / (1 + calculateYTM(purchasePrice) / 100)).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">Convexité</span>
                            <span className="result-value">{(bondData.convexity || 18.5).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">Coût de portage</span>
                            <span className="result-value">{((bondData.coupon || 6.5) - calculateYTM(purchasePrice)).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="tab-pane active">
              <div className="row g-3">
                {/* Stress Testing - Taux */}
                <div className="col-lg-8">
                  <div className="bond-card">
                    <h3 className="card-title">Stress Testing - Sensibilité aux Taux</h3>
                    <div className="table-responsive">
                      <table className="table table-stress">
                        <thead>
                          <tr>
                            <th>Choc (bps)</th>
                            <th className="text-end">Nouveau taux</th>
                            <th className="text-end">Prix théorique</th>
                            <th className="text-end">Variation (%)</th>
                            <th className="text-end">Variation (valeur)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stressTestData.map((row, idx) => (
                            <tr key={idx} className={row.shock === 0 ? 'reference-row' : ''}>
                              <td><strong>{row.shock > 0 ? '+' : ''}{row.shock}</strong></td>
                              <td className="text-end">{row.newYield}%</td>
                              <td className="text-end">{row.price}%</td>
                              <td className={`text-end ${parseFloat(row.changePercent) > 0 ? 'positive' : parseFloat(row.changePercent) < 0 ? 'negative' : ''}`}>
                                {row.changePercent}%
                              </td>
                              <td className={`text-end ${parseFloat(row.changeValue) > 0 ? 'positive' : parseFloat(row.changeValue) < 0 ? 'negative' : ''}`}>
                                {parseFloat(row.changeValue) > 0 ? '+' : ''}{row.changeValue} {bondData.currency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="custom-shock mt-3">
                      <label>Choc personnalisé: <strong>{stressTestShock} bps</strong></label>
                      <input 
                        type="range" 
                        className="form-range" 
                        min="-300" 
                        max="300" 
                        step="10"
                        value={stressTestShock}
                        onChange={(e) => setStressTestShock(parseInt(e.target.value))}
                      />
                      <div className="shock-result">
                        Prix estimé: <strong>{((bondData.currentPrice || 100) * (1 - (bondData.duration || 4.2) * stressTestShock / 10000)).toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stress Testing - Spread crédit */}
                <div className="col-lg-4">
                  <div className="bond-card">
                    <h3 className="card-title">Choc de Spread Crédit</h3>
                    <div className="spread-stress-list">
                      {[50, 100, 200].map(shock => {
                        const priceImpact = -(bondData.duration || 4.2) * (shock / 100);
                        const newPrice = (bondData.currentPrice || 100) * (1 + priceImpact / 100);
                        return (
                          <div key={shock} className="spread-stress-item">
                            <div className="shock-label">+{shock} bps</div>
                            <div className="shock-details">
                              <div className="detail-row">
                                <span>Prix:</span>
                                <span className="negative">{newPrice.toFixed(2)}%</span>
                              </div>
                              <div className="detail-row">
                                <span>Impact:</span>
                                <span className="negative">{priceImpact.toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Risque de liquidité */}
                <div className="col-lg-6">
                  <div className="bond-card">
                    <h3 className="card-title">Risque de Liquidité</h3>
                    <div className="liquidity-stats">
                      <div className="stat-card">
                        <span className="stat-label">Bid-ask spread moyen (30j)</span>
                        <span className="stat-value">0.25%</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Fréquence de cotation</span>
                        <span className="stat-value">28/30 jours (93%)</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Volume moyen journalier</span>
                        <span className="stat-value">{((bondData.tradedVolume || 15000000) / 30).toFixed(0).toLocaleString()} {bondData.currency}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Volume total depuis émission</span>
                        <span className="stat-value">{((bondData.outstanding || 50000000000) * 0.15 / 1000000000).toFixed(1)}B {bondData.currency}</span>
                      </div>
                    </div>
                    <div className="chart-container mt-3">
                      <h4 className="chart-subtitle">Volume mensuel (12 mois)</h4>
                      <BarChart
                        data={{
                          categories: volumeHistoryData.map(d => d.month),
                          values: volumeHistoryData.map(d => d.volume)
                        }}
                        color="rgba(37, 99, 235, 0.7)"
                        height="200px"
                      />
                    </div>
                  </div>
                </div>

                {/* Risque crédit & souverain */}
                <div className="col-lg-6">
                  <div className="bond-card">
                    <h3 className="card-title">Risque Crédit & Souverain</h3>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="risk-section">
                          <h4 className="section-subtitle">Spread de crédit</h4>
                          <div className="spread-info">
                            <div className="info-row">
                              <span>Spread actuel vs courbe souveraine</span>
                              <span className="value">{((bondData.spread || 2.5) * 100).toFixed(0)} bps</span>
                            </div>
                            <div className="info-row">
                              <span>Percentile historique</span>
                              <span className="value">65e percentile</span>
                            </div>
                          </div>
                          <div className="chart-container mt-2">
                            <LineChart
                              data={{
                                categories: spreadHistoryData.map(d => d.date),
                                series: [{
                                  name: 'Spread (bps)',
                                  values: spreadHistoryData.map(d => d.spread),
                                  color: 'rgb(239, 68, 68)'
                                }]
                              }}
                              height="200px"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="risk-section">
                          <h4 className="section-subtitle">Risque pays</h4>
                          <div className="country-risk-info">
                            <div className="info-row">
                              <span>Pays émetteur</span>
                              <span className="value">{getCountryFlag(bondData.country)} {bondData.country}</span>
                            </div>
                            <div className="info-row">
                              <span>Dette/PIB</span>
                              <span className="value">52.3%</span>
                            </div>
                            <div className="info-row">
                              <span>Déficit budgétaire</span>
                              <span className="value negative">-4.2%</span>
                            </div>
                            <div className="info-row">
                              <span>Notation souveraine</span>
                              <span className="value">BB- (S&P)</span>
                            </div>
                            <div className="info-row">
                              <span>Exposition devise</span>
                              <span className="value">{bondData.currency} (Locale)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="tab-pane active">
              <div className="row g-3">
                {/* Courbe des taux émetteur */}
                <div className="col-12">
                  <div className="bond-card">
                    <h3 className="card-title">Courbe des Taux Émetteur</h3>
                    <div className="chart-container">
                      <LineChart
                        data={{
                          categories: issuerBondsData.map(b => b.maturity.toFixed(1)),
                          series: [{
                            name: 'YTM (%)',
                            values: issuerBondsData.map(b => b.ytm),
                            color: 'rgb(37, 99, 235)'
                          }]
                        }}
                        height="300px"
                      />
                    </div>
                    <div className="bonds-list mt-3">
                      {issuerBondsData.map((bond, idx) => (
                        <div key={idx} className={`bond-item ${bond.current ? 'current' : ''}`}>
                          <span className="bond-name">{bond.name}</span>
                          <span className="bond-maturity">{bond.maturity.toFixed(1)} ans</span>
                          <span className="bond-ytm">{bond.ytm}%</span>
                          {!bond.current && (
                            <Link href={`/fixed-income/bond-detail/${bondType}/${bond.isin}`} className="bond-link">
                              Voir →
                            </Link>
                          )}
                          {bond.current && <span className="badge badge-current">Titre actuel</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issuer' && (
            <div className="tab-pane active">
              <div className="row g-3">
                {/* Profil émetteur */}
                <div className="col-lg-6">
                  <div className="bond-card">
                    <h3 className="card-title">Profil Émetteur</h3>
                    <div className="issuer-profile">
                      <div className="profile-header">
                        <h4>{bondData.issuer}</h4>
                        <span className="badge badge-type">{bondData.bondType === 'Treasury Bond' ? 'Souverain' : 'Corporatif'}</span>
                      </div>
                      <div className="profile-info">
                        <div className="info-row">
                          <span>Pays</span>
                          <span>{getCountryFlag(bondData.country)} {bondData.country}</span>
                        </div>
                        <div className="info-row">
                          <span>Secteur</span>
                          <span>Gouvernement / Trésor Public</span>
                        </div>
                        <div className="info-row">
                          <span>Encours total de dette</span>
                          <span>2.5T {bondData.currency}</span>
                        </div>
                        <div className="info-row">
                          <span>Ratio service dette/revenus</span>
                          <span>18.5%</span>
                        </div>
                      </div>
                      
                      <div className="repayment-history mt-3">
                        <h5>Historique des remboursements</h5>
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th className="text-end">Montant</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>15/12/2024</td>
                              <td>Coupon</td>
                              <td className="text-end">325M {bondData.currency}</td>
                              <td><span className="badge badge-success">✓ Honoré</span></td>
                            </tr>
                            <tr>
                              <td>15/06/2024</td>
                              <td>Coupon</td>
                              <td className="text-end">325M {bondData.currency}</td>
                              <td><span className="badge badge-success">✓ Honoré</span></td>
                            </tr>
                            <tr>
                              <td>31/12/2023</td>
                              <td>Principal</td>
                              <td className="text-end">10B {bondData.currency}</td>
                              <td><span className="badge badge-success">✓ Honoré</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <Link href={`/issuers/${bondData.issuer}`} className="btn btn-primary btn-sm mt-3">
                        Voir tous les titres de cet émetteur →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Historique & événements */}
                <div className="col-lg-6">
                  <div className="bond-card">
                    <h3 className="card-title">Historique & Documents</h3>
                    
                    <div className="history-tabs">
                      <ul className="nav nav-tabs" role="tablist">
                        <li className="nav-item">
                          <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#events">
                            Événements
                          </button>
                        </li>
                        <li className="nav-item">
                          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#documents">
                            Documents
                          </button>
                        </li>
                      </ul>
                      
                      <div className="tab-content">
                        <div className="tab-pane fade show active" id="events">
                          <div className="timeline">
                            <div className="timeline-item">
                              <div className="timeline-marker"></div>
                              <div className="timeline-content">
                                <div className="timeline-date">15 Déc 2024</div>
                                <div className="timeline-title">Paiement de coupon</div>
                                <div className="timeline-description">
                                  Paiement du coupon semestriel de 325M {bondData.currency}
                                </div>
                              </div>
                            </div>
                            <div className="timeline-item">
                              <div className="timeline-marker"></div>
                              <div className="timeline-content">
                                <div className="timeline-date">15 Jan 2024</div>
                                <div className="timeline-title">Adjudication réussie</div>
                                <div className="timeline-description">
                                  Taux retenu: 6.5% | Montant levé: 50B {bondData.currency} | Taux de couverture: 1.85x
                                </div>
                              </div>
                            </div>
                            <div className="timeline-item">
                              <div className="timeline-marker"></div>
                              <div className="timeline-content">
                                <div className="timeline-date">10 Jan 2024</div>
                                <div className="timeline-title">Avis d'émission</div>
                                <div className="timeline-description">
                                  Publication de l'avis d'émission sur le marché primaire
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="tab-pane fade" id="documents">
                          <div className="documents-list">
                            <div className="document-item">
                              <div className="document-icon">📄</div>
                              <div className="document-info">
                                <div className="document-name">Prospectus d'émission</div>
                                <div className="document-meta">PDF • 2.5 MB • 15 Jan 2024</div>
                              </div>
                              <button className="btn btn-sm btn-download">⬇</button>
                            </div>
                            <div className="document-item">
                              <div className="document-icon">📄</div>
                              <div className="document-info">
                                <div className="document-name">Note d'information</div>
                                <div className="document-meta">PDF • 1.8 MB • 15 Jan 2024</div>
                              </div>
                              <button className="btn btn-sm btn-download">⬇</button>
                            </div>
                            <div className="document-item">
                              <div className="document-icon">📄</div>
                              <div className="document-info">
                                <div className="document-name">Circulaire BRVM</div>
                                <div className="document-meta">PDF • 450 KB • 10 Jan 2024</div>
                              </div>
                              <button className="btn btn-sm btn-download">⬇</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
