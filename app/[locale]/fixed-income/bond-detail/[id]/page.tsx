'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import { usePrimaryRepository } from '@/core/infra/repositories/primary.repository.impl';
import { useSecondaryRepository } from '@/core/infra/repositories/secondary.repository.impl';
import { useRateRepository } from '@/core/infra/repositories/rate.repository.impl';
import { SecondaryEntity } from '@/core/domain/entities/secondary.entity';
import { RateEntity } from '@/core/domain/entities/rate.entity';
import { BondCashflowEntity } from '@/core/domain/entities/bond-cashflow.entity';
import { IssuerEntity } from '@/core/domain/entities/issuer.entity';
import { PrimaryEntity } from '@/core/domain/entities/primary.entity';


const parseNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPercent = (value: string | number | null | undefined): number => {
  const num = parseNumber(value);
  return num > 1 ? num : num * 100;
};

const getMaturityYear = (maturityDate?: string): string => {
  if (!maturityDate) return '';
  return maturityDate.split('-')[0];
};

export default function BondDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [bondSearchQuery, setBondSearchQuery] = useState('');
  const [bondSearchResults, setBondSearchResults] = useState<PrimaryEntity[]>([]);
  const [isBondSearchFocused, setIsBondSearchFocused] = useState(false);

  const {
    currentPrimaryData,
    getPrimaryById,
    getBondCashflowsBySecurity,
    bondCashflowsData,
    isLoadingPrimaryById,
    getAllPrimaries,
    allPrimariesData,
  } = usePrimaryRepository();

  const {
    getAllSecondaries,
    allSecondariesData: secondariesData,
  } = useSecondaryRepository();

  const {
    getAllRates,
    allRatesData: ratesData,
  } = useRateRepository();

  useEffect(() => { getPrimaryById(id); }, [id, getPrimaryById]);

  useEffect(() => {
    if (bondSearchQuery.trim().length >= 2) {
      getAllPrimaries({ search: bondSearchQuery, page_size: 8 });
    } else {
      setBondSearchResults([]);
    }
  }, [bondSearchQuery, getAllPrimaries]);

  useEffect(() => {
    if (!bondSearchQuery.trim() || bondSearchQuery.trim().length < 2) return;
    const q = bondSearchQuery.toLowerCase();
    const filtered = (allPrimariesData?.data ?? []).filter((p) =>
      p.isin?.toLowerCase().includes(q) ||
      p.ticker?.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q)
    ).slice(0, 8);
    setBondSearchResults(filtered);
  }, [allPrimariesData, bondSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsBondSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (id) {
      getAllSecondaries({ primary: id, page_size: 100 });
    }
  }, [id, getAllSecondaries]);

  const secondariesStartDate = useMemo(() => {
    if (!secondariesData?.data?.length) return undefined;
    const sorted = [...secondariesData.data]
      .filter((s) => s.timestamp)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
    return sorted[0]?.timestamp?.split('T')[0];
  }, [secondariesData]);

  useEffect(() => {
    if (id && secondariesStartDate) {
      getBondCashflowsBySecurity(id, { page: -1 });
      // getBondCashflowsBySecurity(id, { page: -1, start_date: secondariesStartDate });
    }
  }, [id, secondariesStartDate, getBondCashflowsBySecurity]);

  const issuer = useMemo(() => {
    if (!currentPrimaryData?.issuer) return undefined;
    return typeof currentPrimaryData.issuer === 'string'
      ? undefined
      : (currentPrimaryData.issuer as IssuerEntity);
  }, [currentPrimaryData]);

  const issueLot = useMemo(() => currentPrimaryData?.issue_lots?.[0], [currentPrimaryData]);

  const latestCashflow = useMemo(() => currentPrimaryData?.latest_cashflow, [currentPrimaryData]);

  const secondaries = useMemo(
    () => (secondariesData?.data ?? []) as SecondaryEntity[],
    [secondariesData]
  );

  const cashflows = useMemo(
    () => (bondCashflowsData?.data ?? []) as BondCashflowEntity[],
    [bondCashflowsData]
  );

  const rates = useMemo(() => (ratesData?.data ?? []) as RateEntity[], [ratesData]);

  useEffect(() => {
    if (issuer?.country) {
      getAllRates({ country_name: issuer.country, select: "last" });
    }
  }, [issuer?.country, getAllRates]);

  const bondData = useMemo(() => {
    const primary = currentPrimaryData;
    if (!primary) {
      return {
        isin: '',
        name: '',
        issuer: '',
        country: '',
        bondType: '',
        currency: '',
        nominal: 10000,
        coupon: 0,
        couponFrequency: 'Semestriel',
        issueDate: '',
        valueDate: '',
        maturityDate: '',
        issuePrice: 100,
        currentPrice: 100,
        ytm: 0,
        yield: 0,
        spread: 0,
        duration: 0,
        convexity: 0,
        redemptionType: 'In fine',
        dayCount: '',
        settlement: '',
        outstanding: 0,
        minSubscription: 0,
      };
    }

    const latestSecondary = secondaries[secondaries.length - 1];
    const cleanPrice = parseNumber(latestCashflow?.clean_price);
    const dirtyPrice = parseNumber(latestCashflow?.dirty_price);
    const marketPrice = cleanPrice > 0 ? cleanPrice : dirtyPrice > 0 ? dirtyPrice : 100;
    const secondaryPrice = parseNumber(latestSecondary?.closing_price);
    const currentPrice = secondaryPrice > 0 ? secondaryPrice : marketPrice;
    const ytm = parseNumber(issueLot?.clearing_yield) * 100;
    const yieldValue = parseNumber(latestSecondary?.traded_yield || latestSecondary?.closing_yield) * 100;
    const couponRate = formatPercent(primary.coupon_rate);
    const nominal = parseNumber(primary.initial_unit_nominal) || parseNumber(primary.minimum_trade_unit) || 10000;
    const outstanding = parseNumber(latestCashflow?.outstanding_nominal);

    return {
      isin: primary.isin || '',
      name: `${primary.reference || ''} ${couponRate.toFixed(2)}% ${getMaturityYear(issueLot?.maturity_date || latestCashflow?.timestamp)}`.trim(),
      issuer: issuer?.name || '',
      country: issuer?.country || '',
      bondType: primary.type_name || primary.type || '',
      currency: primary.currency || '',
      nominal,
      coupon: couponRate,
      couponFrequency: primary.coupon_frequency === 1 ? 'Annuel' : primary.coupon_frequency === 4 ? 'Trimestriel' : 'Semestriel',
      issueDate: issueLot?.auction_date || primary.created_at || '',
      valueDate: issueLot?.settlement_date || '',
      maturityDate: issueLot?.maturity_date || latestCashflow?.timestamp || '',
      issuePrice: 100,
      currentPrice,
      ytm,
      yield: yieldValue,
      spread: parseNumber(primary.coupon_rate) > 0 ? ytm - couponRate : 0,
      duration: parseNumber(latestCashflow?.duration_modigliani || latestCashflow?.duration_macaulay),
      duration_macaulay: parseNumber(latestCashflow?.duration_macaulay),
      duration_modigliani: parseNumber(latestCashflow?.duration_modigliani),
      convexity: parseNumber(latestCashflow?.convexity),
      redemptionType: primary.amortization_method === 'BULLET' ? 'In fine' : primary.amortization_method || 'In fine',
      dayCount: primary.day_count_convention || '',
      settlement: primary.payment_day_term || 'MON_TO_FRI',
      outstanding,
      minSubscription: parseNumber(primary.minimum_trade_unit) || nominal,
    };
  }, [currentPrimaryData, secondaries, latestCashflow, issueLot, issuer]);

  const getCountryFlag = (country: string): string => {
    const flags: { [key: string]: string } = {
      'Côte d\'Ivoire': '🇨🇮',
      'Senegal': '🇸🇳',
      'Sénégal': '🇸🇳',
      'Benin': '🇧🇯',
      'Bénin': '🇧🇯',
      'Afrique du Sud': '🇿🇦',
      'South Africa': '🇿🇦',
      'Nigeria': '🇳🇬',
      'Ghana': '🇬🇭',
      'Kenya': '🇰🇪',
      'Morocco': '🇲🇦',
      'Maroc': '🇲🇦',
      'Togo': '🇹🇬',
    };
    return flags[country] || '🏳️';
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [purchasePrice, setPurchasePrice] = useState(bondData.currentPrice || 100);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [reinvestmentRate, setReinvestmentRate] = useState(5.0);
  const [stressTestShock, setStressTestShock] = useState(0);
  const [historyTab, setHistoryTab] = useState<'events' | 'documents'>('events');

  // Données réelles pour les graphiques et tableaux
  const priceHistoryData = useMemo(() => {
    if (!secondaries.length) return [];

    const sortedSecondaries = [...secondaries]
      .filter((s) => s.timestamp)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());

    const minDate = new Date(sortedSecondaries[0].timestamp!);
    const maxDate = new Date(sortedSecondaries[sortedSecondaries.length - 1].timestamp!);

    // Cashflows filtrés sur la période secondaire, triés par date
    const sortedCashflows = cashflows
      .filter((c) => c.timestamp && c.clean_price !== undefined && c.clean_price !== null)
      .map((c) => ({ date: c.timestamp!.split('T')[0], ts: new Date(c.timestamp!.split('T')[0]).getTime(), cleanPrice: parseNumber(c.clean_price) }))
      .filter((c) => c.ts >= minDate.getTime() && c.ts <= maxDate.getTime())
      .sort((a, b) => a.ts - b.ts);

    // Pour chaque date secondaire, trouver le cashflow le plus proche
    const getNearestValuation = (dateStr: string): number | null => {
      if (!sortedCashflows.length) return null;
      const ts = new Date(dateStr).getTime();
      let nearest = sortedCashflows[0];
      for (const c of sortedCashflows) {
        if (Math.abs(c.ts - ts) < Math.abs(nearest.ts - ts)) nearest = c;
      }
      return nearest.cleanPrice > 0 ? nearest.cleanPrice : null;
    };

    return sortedSecondaries.map((s) => {
      const date = s.timestamp!.split('T')[0];
      return {
        date,
        secondaryPrice: parseNumber(s.closing_price),
        valuationPrice: getNearestValuation(date),
      };
    });
  }, [secondaries, cashflows]);

  const cashflowData = useMemo(() => {
    if (!cashflows.length) return [];
    const today = new Date().getTime();
    return [...cashflows]
      .filter((c) => c.timestamp && c.is_payment_date === true && new Date(c.timestamp).getTime() > new Date().getTime())
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime())
      .map((c) => {
        const couponRate = formatPercent(c.coupon_rate);
        const coupon = (couponRate / 100) * bondData.nominal;
        const principal = parseNumber(c.redemption) || parseNumber(c.amortization);
        const computedTotal = coupon + principal;
        const total = parseNumber(c.total_cashflow) || computedTotal;
        const ts = new Date(c.timestamp!).getTime();
        const daysRemaining = Math.floor((ts - today) / (1000 * 60 * 60 * 24));
        const type = principal > 0 ? 'Principal + Coupon' : 'Coupon';
        return {
          date: c.timestamp!,
          type,
          coupon,
          principal,
          total,
          discounted: total / Math.pow(1 + (bondData.ytm || 0) / 100, Math.max(daysRemaining, 0) / 365),
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          status: c.status,
        };
      });
  }, [cashflows, bondData.nominal, bondData.ytm]);

  const pastCashflowData = useMemo(() => {
    if (!cashflows.length) return [];
    const today = new Date().getTime();
    return [...cashflows]
      .filter((c) => c.timestamp && c.is_payment_date === true && new Date(c.timestamp).getTime() <= today)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .map((c) => {
        const couponRate = formatPercent(c.coupon_rate);
        const coupon = (couponRate / 100) * bondData.nominal;
        const principal = parseNumber(c.redemption) || parseNumber(c.amortization);
        const total = parseNumber(c.total_cashflow) || coupon + principal;
        const type = principal > 0 ? 'Principal + Coupon' : 'Coupon';
        return { date: c.timestamp!, type, coupon, principal, total, status: c.status };
      });
  }, [cashflows, bondData.nominal]);

  const todayCashflow = useMemo(() => {
    if (!cashflows.length) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const exact = cashflows.find((c) => c.timestamp?.startsWith(todayStr));
    if (exact) return exact;
    const today = new Date().getTime();
    const recent = [...cashflows]
      .filter((c) => c.timestamp && today - new Date(c.timestamp).getTime() <= 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    return recent[0] ?? null;
  }, [cashflows]);

  const latestRiskMetrics = useMemo(() => {
    if (!cashflows.length) return null;
    const sorted = [...cashflows]
      .filter((c) => c.timestamp)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    return sorted[0] ?? null;
  }, [cashflows]);

  const isBondAlive = useMemo(() => {
    if (!bondData.maturityDate) return true;
    return new Date(bondData.maturityDate).getTime() > Date.now();
  }, [bondData.maturityDate]);

  const activeMetrics = useMemo(() => {
    if (isBondAlive) {
      return todayCashflow ?? latestRiskMetrics;
    }
    return latestRiskMetrics;
  }, [isBondAlive, todayCashflow, latestRiskMetrics]);

  const stressTestData = useMemo(() => {
    const base = activeMetrics;
    const basePrice = base ? parseNumber(base.valorization) : (bondData.currentPrice || 100);
    const baseYield = bondData.ytm || bondData.yield || 7;

    if (base && parseNumber(base.valorization) > 0) {
      return [
        { shock: -100, label: '-100 bps', price: parseNumber(base.economic_value_minus_100bps), changePercent: ((parseNumber(base.economic_value_minus_100bps) - basePrice) / basePrice * 100) },
        { shock: -50,  label: 'Flatten.',  price: parseNumber(base.economic_value_flattening_shock), changePercent: ((parseNumber(base.economic_value_flattening_shock) - basePrice) / basePrice * 100) },
        { shock: -10,  label: 'ST rates ↓', price: parseNumber(base.economic_value_short_rates_shock_down), changePercent: ((parseNumber(base.economic_value_short_rates_shock_down) - basePrice) / basePrice * 100) },
        { shock: 0,    label: 'Base',       price: basePrice, changePercent: 0 },
        { shock: 10,   label: 'ST rates ↑', price: parseNumber(base.economic_value_short_rates_shock_up), changePercent: ((parseNumber(base.economic_value_short_rates_shock_up) - basePrice) / basePrice * 100) },
        { shock: 50,   label: 'Steepen.',   price: parseNumber(base.economic_value_steepening_shock), changePercent: ((parseNumber(base.economic_value_steepening_shock) - basePrice) / basePrice * 100) },
        { shock: 100,  label: '+100 bps',   price: parseNumber(base.economic_value_plus_100bps), changePercent: ((parseNumber(base.economic_value_plus_100bps) - basePrice) / basePrice * 100) },
      ].map((row) => ({
        ...row,
        newYield: (baseYield + row.shock / 100).toFixed(2),
        priceStr: row.price.toFixed(3),
        changePercentStr: row.changePercent.toFixed(3),
        changeValue: ((row.price - basePrice) * parseNumber(base.outstanding_nominal) / 100).toFixed(0),
        isBase: row.shock === 0,
      }));
    }

    // Fallback si pas encore de métriques chargées
    const shocks = [-200, -100, 0, 100, 200];
    return shocks.map(shock => {
      const priceChange = -(bondData.duration || 4.2) * (shock / 100);
      const newPrice = basePrice * (1 + priceChange / 100);
      return {
        shock,
        label: shock === 0 ? 'Base' : `${shock > 0 ? '+' : ''}${shock} bps`,
        price: newPrice,
        priceStr: newPrice.toFixed(2),
        newYield: (baseYield + shock / 100).toFixed(2),
        changePercent: priceChange,
        changePercentStr: priceChange.toFixed(2),
        changeValue: ((newPrice - basePrice) * (bondData.nominal || 10000) / 100).toFixed(0),
        isBase: shock === 0,
      };
    });
  }, [activeMetrics, bondData]);

  const volumeHistoryData = useMemo(() => {
    if (!secondaries.length) return [];
    const map = new Map<string, number>();
    secondaries.forEach((s) => {
      if (!s.timestamp) return;
      const month = s.timestamp.slice(0, 7);
      const volume = parseNumber(s.volume_traded) || parseNumber(s.value_traded);
      map.set(month, (map.get(month) || 0) + volume);
    });
    return Array.from(map.entries()).map(([month, volume]) => ({ month, volume })).sort((a, b) => a.month.localeCompare(b.month));
  }, [secondaries]);

  const spreadHistoryData = useMemo(() => {
    if (!secondaries.length) return [];
    const sorted = [...secondaries]
      .filter((s) => s.timestamp)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
    return sorted.map((s) => ({
      date: s.timestamp!.slice(0, 7),
      spread: parseNumber(s.traded_yield) * 10000,
    }));
  }, [secondaries]);

  const momentumData = useMemo(() => {
    if (!secondaries.length) return { trend5d: 0, trend20d: 0, trend60d: 0, relativeVolume: 1, score: 3 };
    const sorted = [...secondaries]
      .filter((s) => s.timestamp && s.closing_price)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
    const lastObs = sorted[sorted.length - 1];
    const last = lastObs?.closing_price;
    const lastDate = lastObs?.timestamp ? new Date(lastObs.timestamp) : new Date();
    const getPrice = (daysBack: number) => {
      const target = new Date(lastDate);
      target.setDate(target.getDate() - daysBack);
      const candidates = sorted.filter((s) => s.timestamp && new Date(s.timestamp) <= target);
      return candidates[candidates.length - 1]?.closing_price;
    };
    const pct = (from?: number, to?: number) =>
      from && to && from !== 0 ? ((to - from) / from) * 100 : 0;
    const trend5d = pct(parseNumber(getPrice(5)), parseNumber(last));
    const trend20d = pct(parseNumber(getPrice(20)), parseNumber(last));
    const trend60d = pct(parseNumber(getPrice(60)), parseNumber(last));
    const volumes = sorted.slice(-20).map((s) => parseNumber(s.volume_traded)).filter((v) => v > 0);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / Math.max(volumes.length, 1);
    const relativeVolume = avgVolume > 0 ? parseNumber(sorted[sorted.length - 1]?.volume_traded) / avgVolume : 1;
    const score = Math.max(1, Math.min(5, 3 + (trend5d + trend20d > 0 ? 1 : -1)));
    return { trend5d, trend20d, trend60d, relativeVolume, score };
  }, [secondaries]);

  const issuerBondsData = useMemo(() => {
    if (!rates.length) return [];
    const latestRate = rates[rates.length - 1];
    const tenorYears = parseNumber(currentPrimaryData?.tenor);
    const maturityLabels = [
      { key: 'one_year', maturity: 1 },
      { key: 'two_years', maturity: 2 },
      { key: 'three_years', maturity: 3 },
      { key: 'five_years', maturity: 5 },
      { key: 'seven_years', maturity: 7 },
      { key: 'ten_years', maturity: 10 },
      { key: 'fifteen_years', maturity: 15 },
      { key: 'twenty_years', maturity: 20 },
      { key: 'thirty_years', maturity: 30 },
    ];
    const bonds = maturityLabels
      .map(({ key, maturity }) => ({
        name: `${maturity}Y`,
        maturity,
        ytm: parseNumber((latestRate as any)[key]) * 100,
        isin: '',
      }))
      .filter((b) => b.ytm > 0);
    const closest = bonds.reduce((prev, curr) =>
      Math.abs(curr.maturity - tenorYears) < Math.abs(prev.maturity - tenorYears) ? curr : prev,
      bonds[0]
    );
    return bonds.map((b) => ({ ...b, current: b === closest }));
  }, [rates, currentPrimaryData?.tenor]);

  const ratesCurveDate = useMemo(() => {
    if (!rates.length) return null;
    const ts = rates[rates.length - 1]?.timestamp;
    return ts ? new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
  }, [rates]);

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

  const exportCashflowsToCSV = () => {
    const headers = ['Date de paiement', 'Type', 'Coupon', 'Principal', 'Flux total', 'Flux actualise', 'Jours restants'];
    const rows = cashflowData.map((flow) => [
      new Date(flow.date).toLocaleDateString('fr-FR'),
      flow.type,
      flow.coupon.toString(),
      flow.principal > 0 ? flow.principal.toString() : '0',
      flow.total.toString(),
      Math.round(flow.discounted).toString(),
      flow.daysRemaining.toString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `echeancier_${bondData.isin || id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoadingPrimaryById) {
    return (
      <div className="bond-detail-page d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

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
              <div className="bond-title-search" ref={searchRef}>
                <div className="bond-title-input-wrapper">
                  <span className="country-flag">{getCountryFlag(bondData.country)}</span>
                  <input
                    type="text"
                    className="bond-title-input"
                    value={isBondSearchFocused ? bondSearchQuery : ''}
                    placeholder={bondData.name || bondData.isin || 'Rechercher un titre...'}
                    onChange={(e) => setBondSearchQuery(e.target.value)}
                    onFocus={() => { setIsBondSearchFocused(true); setBondSearchQuery(''); }}
                    onBlur={() => setTimeout(() => setIsBondSearchFocused(false), 150)}
                  />
                  {!isBondSearchFocused && (
                    <svg className="search-hint-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  )}
                </div>
                {isBondSearchFocused && bondSearchResults.length > 0 && (
                  <div className="bond-search-dropdown">
                    {bondSearchResults.map((p) => (
                      <div
                        key={p.id}
                        className="bond-search-result-item"
                        onMouseDown={() => {
                          setIsBondSearchFocused(false);
                          setBondSearchQuery('');
                          router.push(`/fixed-income/bond-detail/${p.id}`);
                        }}
                      >
                        <span className="bond-search-isin">{p.isin}</span>
                        <span className="bond-search-ref">{p.ticker || p.reference}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isBondSearchFocused && bondSearchQuery.length >= 2 && bondSearchResults.length === 0 && (
                  <div className="bond-search-dropdown">
                    <div className="bond-search-empty">Aucun résultat pour &ldquo;{bondSearchQuery}&rdquo;</div>
                  </div>
                )}
              </div>
              <div className="bond-meta">
                <span className="badge badge-isin">{bondData.isin}</span>
                <span className="badge badge-type">{bondData.bondType}</span>
              </div>
            </div>
            <div className="key-metrics">
              {bondData.currentPrice > 0 && <div className="metric"><span>Price:</span> <strong>{bondData.currentPrice.toFixed(2)}%</strong></div>}
              {bondData.ytm > 0 &&  <div className="metric"><span>YTM:</span> <strong>{bondData.ytm.toFixed(2)}%</strong></div>}
              {bondData.yield > 0 && <div className="metric"><span>Yield:</span> <strong>{bondData.yield.toFixed(2)}%</strong></div>}
              {bondData.spread !== 0 && <div className="metric"><span>Spread:</span> <strong>{bondData.spread.toFixed(2)}%</strong></div>}
              <div className="metric"><span>Maturity:</span> <strong>{bondData.maturityDate ? new Date(bondData.maturityDate).toLocaleDateString('en-US') : '-'}</strong></div>
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
                        <span className="label">Type d'Émetteur</span>
                        <span className="value">{issuer?.issuer_type || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Pays</span>
                        <span className="value">{getCountryFlag(bondData.country || bondData.issuer)} {bondData.issuer || bondData.country}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Gestionnaire de dette</span>
                        <span className="value">{issuer?.debt_manager || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">ISIN</span>
                        <span className="value">{bondData.isin}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Date d'émission</span>
                        <span className="value">{bondData.issueDate ? new Date(bondData.issueDate).toLocaleDateString('fr-FR') : '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Date de maturité</span>
                        <span className="value">{bondData.maturityDate ? new Date(bondData.maturityDate).toLocaleDateString('fr-FR') : '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Durée résiduelle</span>
                        <span className="value">{bondData.maturityDate ? `${calculateRemainingDays()} jours (${(calculateRemainingDays() / 365).toFixed(1)} ans)` : '-'}</span>
                      </div>
                      {/* <div className="info-item">
                        <span className="label">Valeur nominale</span>
                        <span className="value">{(bondData.nominal || 10000).toLocaleString()} {bondData.currency ? `${bondData.currency}` : ''}</span>
                      </div> */}
                      <div className="info-item">
                        <span className="label">Type de taux</span>
                        <span className="value">{currentPrimaryData?.coupon_type || 'Fixe'}</span>
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
                        <span className="label">Payment Day Term</span>
                        <span className="value">{bondData.settlement == 'MON_TO_FRI' ? 'Monday to Friday' : 'Monday to Saturday'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Encours</span>
                        <span className="value">{((bondData.outstanding || 0) / 1000000000).toFixed(1)}B {bondData.currency ? `${bondData.currency}` : ''}</span>
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
                        {/* <button className="btn-filter">1 an</button>
                        <button className="btn-filter">6 mois</button>
                        <button className="btn-filter">Résiduel</button> */}
                      </div>
                    </div>
                    <div className="chart-container">
                      <LineChart
                        data={{
                          categories: priceHistoryData.map(d => d.date),
                          series: [
                            {
                              name: 'Valorisation (clean price) (%)',
                              values: priceHistoryData.map(d => d.valuationPrice ?? 0),
                              color: 'rgb(37, 99, 235)'
                            },
                            {
                              name: 'Cours secondaire (%)',
                              values: priceHistoryData.map(d => d.secondaryPrice),
                              color: 'rgb(234, 88, 12)'
                            }
                          ]
                        }}
                        height="350px"
                        legendPosition="top"
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
                          <span className="value">
                            {todayCashflow?.clean_price
                              ? parseNumber(todayCashflow.clean_price).toFixed(3)
                              : todayCashflow?.dirty_price
                                ? parseNumber(todayCashflow.dirty_price).toFixed(3)
                                : 'N/A'}%
                          </span>
                        </div>
                      </div>
                      {(() => {
                        const marketPrice = bondData.currentPrice || 100;
                        const valuation = todayCashflow?.clean_price
                          ? parseNumber(todayCashflow.clean_price)
                          : todayCashflow?.dirty_price
                            ? parseNumber(todayCashflow.dirty_price)
                            : null;
                        const gap = valuation !== null ? marketPrice - valuation : null;
                        return (
                          <div className="opportunity-gap">
                            <span className="gap-label">Écart</span>
                            <span className={`gap-value ${gap === null ? '' : gap > 0 ? 'negative' : gap < 0 ? 'positive' : ''}`}>
                              {gap !== null ? `${gap > 0 ? '+' : ''}${gap.toFixed(3)}%` : 'N/A'}
                            </span>
                            <span className={`badge ${gap === null ? 'badge-secondary' : gap > 0 ? 'badge-danger' : gap < 0 ? 'badge-success' : 'badge-secondary'}`}>
                              {gap === null ? 'Données insuffisantes' : gap > 0 ? 'Potentiellement surévalué' : gap < 0 ? 'Potentiellement sous-évalué' : 'Valorisation équilibrée'}
                            </span>
                          </div>
                        );
                      })()}
                      <p className="opportunity-text">
                        Tendance sur 5 séances : {momentumData.trend5d >= 0 ? '+' : ''}{momentumData.trend5d.toFixed(2)}%.
                        {momentumData.trend5d > 0 ? ' La demande semble soutenue.' : momentumData.trend5d < 0 ? ' Le titre est en léger recul.' : ' Le cours est stable.'}
                      </p>
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
                        <span className={`value ${momentumData.trend5d >= 0 ? 'positive' : 'negative'}`}>{momentumData.trend5d >= 0 ? '+' : ''}{momentumData.trend5d.toFixed(2)}%</span>
                      </div>
                      <div className="momentum-item">
                        <span className="label">Tendance 20j</span>
                        <span className={`value ${momentumData.trend20d >= 0 ? 'positive' : 'negative'}`}>{momentumData.trend20d >= 0 ? '+' : ''}{momentumData.trend20d.toFixed(2)}%</span>
                      </div>
                      <div className="momentum-item">
                        <span className="label">Tendance 60j</span>
                        <span className={`value ${momentumData.trend60d >= 0 ? 'positive' : 'negative'}`}>{momentumData.trend60d >= 0 ? '+' : ''}{momentumData.trend60d.toFixed(2)}%</span>
                      </div>
                      <div className="momentum-item full-width">
                        <span className="label">Volume relatif</span>
                        <span className="value">{momentumData.relativeVolume.toFixed(2)}x</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(momentumData.relativeVolume * 100, 100)}%` }}></div>
                        </div>
                      </div>
                      <div className="momentum-item full-width">
                        <span className="label">Score Momentum</span>
                        <div className="momentum-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`star ${star <= momentumData.score ? 'filled' : ''}`}>★</span>
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
                <div className="col-md-8">
                  <div className="bond-card">
                    <div className="card-header-with-action">
                      <h3 className="card-title">Échéancier des Flux</h3>
                      <button className="btn btn-sm btn-export" onClick={exportCashflowsToCSV}>
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
                          {cashflowData.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center" style={{padding:'2rem', color:'var(--text-secondary)', fontStyle:'italic'}}>
                                Aucun échéance à venir
                              </td>
                            </tr>
                          ) : cashflowData.map((flow, idx) => (
                            <tr key={idx}>
                              <td>{new Date(flow.date).toLocaleDateString('fr-FR')}</td>
                              <td><span className={`badge badge-${flow.type === 'Coupon' ? 'info' : 'success'}`}>{flow.type}</span></td>
                              <td className="text-end">{flow.coupon.toLocaleString()}</td>
                              <td className="text-end">{flow.principal > 0 ? flow.principal.toLocaleString() : '-'}</td>
                              <td className="text-end"><strong>{flow.total.toLocaleString()}</strong></td>
                              <td className="text-end">{Math.round(flow.discounted).toLocaleString()}</td>
                              <td className="text-end">{flow.daysRemaining}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-total">
                            <td colSpan={2}>Total</td>
                            <td className="text-end">{cashflowData.reduce((sum, f) => sum + f.coupon, 0).toLocaleString()}</td>
                            <td className="text-end">{(bondData.nominal || 10000).toLocaleString()}</td>
                            <td className="text-end">{cashflowData.reduce((sum, f) => sum + f.total, 0).toLocaleString()}</td>
                            <td className="text-end">{Math.round(cashflowData.reduce((sum, f) => sum + f.discounted, 0)).toLocaleString()}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Calculateur de rendement */}
                <div className="col-md-4">
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
                      <div className="row g-3">
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
                            <span className="result-value">{bondData.duration_macaulay ? bondData.duration_macaulay.toFixed(2): 'N/A'} ans</span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="result-card">
                            <span className="result-label">Duration de Modigliani</span>
                            <span className="result-value">{bondData.duration_modigliani ? bondData.duration_modigliani.toFixed(2) : 'N/A'} ans</span>
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
                <div className="col-lg-8 p-0">
                  <div className="bond-card">
                    <div className="card-title-row">
                      <h3 className="card-title">Stress Testing - Scénarios de taux</h3>
                      {activeMetrics && (
                        <p className="card-subtitle text-muted">
                          Base : valorisation au {new Date(activeMetrics.timestamp!).toLocaleDateString('fr-FR')} — {parseNumber(activeMetrics.valorization).toFixed(3)}%
                          {!isBondAlive && <span className="text-muted" style={{marginLeft:'0.4rem', fontSize:'0.75rem'}}>(dernière valeur — titre échu)</span>}
                        </p>
                      )}
                    </div>
                    <div className="table-responsive">
                      <table className="table table-stress">
                        <thead>
                          <tr>
                            <th>Scénario</th>
                            <th className="text-end">Taux</th>
                            <th className="text-end">Prix (%)</th>
                            <th className="text-end">Variation (%)</th>
                            <th className="text-end">Impact (encours)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stressTestData.map((row, idx) => (
                            <tr key={idx} className={row.isBase ? 'reference-row' : ''}>
                              <td><strong>{row.label}</strong></td>
                              <td className="text-end">{row.newYield}%</td>
                              <td className="text-end">{row.priceStr}%</td>
                              <td className={`text-end ${row.changePercent > 0 ? 'positive' : row.changePercent < 0 ? 'negative' : ''}`}>
                                {row.changePercent > 0 ? '+' : ''}{row.changePercentStr}%
                              </td>
                              <td className={`text-end ${Number(row.changeValue) > 0 ? 'positive' : Number(row.changeValue) < 0 ? 'negative' : ''}`}>
                                {Number(row.changeValue) > 0 ? '+' : ''}{Number(row.changeValue).toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Risque Souverain */}
                <div className="col-lg-4 p-0">
                  <div className="bond-card">
                    <h3 className="card-title">Risque Souverain</h3>
                    <div className="risk-section">
                        <div className="country-risk-info">
                          <div className="info-row">
                            <span>Pays émetteur</span>
                            <span className="value">{getCountryFlag(bondData.country || bondData.issuer)} {bondData.country || bondData.issuer}</span>
                          </div>
                          <div className="info-row">
                            <span>Dette/PIB</span>
                            <span className="value">N/A</span>
                          </div>
                          <div className="info-row">
                            <span>Déficit budgétaire</span>
                            <span className="value">N/A</span>
                          </div>
                          <div className="info-row">
                            <span>Notation souveraine</span>
                            <span className="value">N/A</span>
                          </div>
                          <div className="info-row">
                            <span>Exposition devise</span>
                            <span className="value">{bondData.currency ? `UUID: ${bondData.currency}` : '-'}</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>

                {/* Risque de liquidité */}
                <div className="col-lg-6 p-0">
                  <div className="bond-card">
                    <h3 className="card-title">Risque de Liquidité</h3>
                    <div className="liquidity-stats">
                      <div className="stat-card">
                        <span className="stat-label">Bid-ask spread moyen (30j)</span>
                        <span className="stat-value">N/A</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Nombre de cotations</span>
                        <span className="stat-value">{secondaries.length}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Volume moyen par cotation</span>
                        <span className="stat-value">{Math.round(secondaries.reduce((sum, s) => sum + parseNumber(s.volume_traded), 0) / Math.max(secondaries.length, 1)).toLocaleString()}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Volume total depuis émission</span>
                        <span className="stat-value">{secondaries.reduce((sum, s) => sum + parseNumber(s.volume_traded), 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="chart-container">
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
                <div className="col-lg-6 p-0">
                  <div className="bond-card">
                    <h3 className="card-title">Risque Crédit & Souverain</h3>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="risk-section">
                          {/* <h4 className="section-subtitle">Spread de crédit</h4> */}
                          <div className="spread-info">
                            <div className="info-row">
                              <span>Spread actuel vs courbe souveraine</span>
                              <span className="value">{((bondData.spread || 0) * 100).toFixed(0)} bps</span>
                            </div>
                            <div className="info-row">
                              <span>Spread min/max observé</span>
                              <span className="value">
                                {spreadHistoryData.length
                                  ? `${Math.min(...spreadHistoryData.map((d) => d.spread)).toFixed(0)} / ${Math.max(...spreadHistoryData.map((d) => d.spread)).toFixed(0)} bps`
                                  : 'N/A'}
                              </span>
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
                    </div>
                  </div>
                </div>


                {/* Métriques de sensibilité */}
                <div className="col-12 p-0">
                  <div className="bond-card">
                    <div className="card-title-row">
                      <h3 className="card-title">Métriques de Sensibilité</h3>
                      {activeMetrics && (
                        <p className="card-subtitle text-muted">
                          Données au {new Date(activeMetrics.timestamp!).toLocaleDateString('fr-FR')}
                          {!isBondAlive && <span className="text-muted" style={{marginLeft:'0.4rem', fontSize:'0.75rem'}}>(dernière valeur — titre échu)</span>}
                        </p>
                      )}
                    </div>
                    <div className="row g-3">
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Duration Macaulay</span>
                          <span className="result-value">
                            {activeMetrics?.duration_macaulay ? parseNumber(activeMetrics.duration_macaulay).toFixed(2) : (bondData.duration_macaulay ? bondData.duration_macaulay.toFixed(2) : 'N/A')} ans
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Durée de vie moyenne pondérée</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Duration Modifiée</span>
                          <span className="result-value">
                            {activeMetrics?.duration_modigliani ? parseNumber(activeMetrics.duration_modigliani).toFixed(2) : (bondData.duration_modigliani ? bondData.duration_modigliani.toFixed(2) : 'N/A')}
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Sensibilité prix / taux</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">DV01</span>
                          <span className="result-value">
                            {activeMetrics?.dv01 ? parseNumber(activeMetrics.dv01).toFixed(4) : 'N/A'}
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Variation prix pour 1 bp</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Convexité</span>
                          <span className="result-value">
                            {activeMetrics?.convexity ? parseNumber(activeMetrics.convexity).toFixed(2) : (bondData.convexity ? bondData.convexity.toFixed(2) : 'N/A')}
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Courbure de la relation prix/taux</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Z-Spread</span>
                          <span className="result-value">
                            {activeMetrics?.z_spread ? (parseNumber(activeMetrics.z_spread) * 10000).toFixed(0) : 'N/A'} bps
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Spread vs courbe zéro-coupon</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Cours pied de coupon</span>
                          <span className="result-value">
                            {activeMetrics?.clean_price ? parseNumber(activeMetrics.clean_price).toFixed(3) : 'N/A'}%
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Clean price (sans intérêts courus)</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Cours coupon couru</span>
                          <span className="result-value">
                            {activeMetrics?.dirty_price ? parseNumber(activeMetrics.dirty_price).toFixed(3) : 'N/A'}%
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Dirty price (avec intérêts courus)</span>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="result-card">
                          <span className="result-label">Intérêts courus</span>
                          <span className="result-value">
                            {activeMetrics?.accrued_interest ? parseNumber(activeMetrics.accrued_interest).toFixed(4) : 'N/A'}%
                          </span>
                          <span className="result-hint text-muted" style={{fontSize:'0.7rem'}}>Coupon accumulé depuis dernier paiement</span>
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
                <div className="col-md-8 p-0">
                  <div className="bond-card">
                    <div className="card-title-row">
                      <h3 className="card-title">Courbe des Taux Émetteur</h3>
                      {ratesCurveDate && (
                        <p className="card-subtitle text-muted">au {ratesCurveDate}</p>
                      )}
                    </div>
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
                        height="50vh"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-4 p-0">
                  <div className="bond-card">
                    <div className="bonds-list mt-3">
                      {issuerBondsData.map((bond, idx) => (
                        <div key={idx} className={`bond-item ${bond.current ? 'current' : ''}`}>
                          <span className="bond-name">{bond.name}</span>
                          <span className="bond-maturity">{bond.maturity.toFixed(1)} ans</span>
                          <span className="bond-ytm">{bond.ytm.toFixed(5)}%</span>
                          {!bond.current && (
                            <Link href={`#`} className="bond-link">
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
                <div className="col-lg-6 p-0">
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
                          <span>{getCountryFlag(bondData.country || bondData.issuer)} {bondData.country || bondData.issuer}</span>
                        </div>
                        <div className="info-row">
                          <span>Type d'émetteur</span>
                          <span>{issuer?.issuer_type || 'Souverain'}</span>
                        </div>
                        <div className="info-row">
                          <span>Encours total de dette</span>
                          <span>{((bondData.outstanding || 0) / 1000000000).toFixed(1)}B</span>
                        </div>
                        <div className="info-row">
                          <span>Debt Manager</span>
                          <span>{issuer?.debt_manager || '-'}</span>
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
                              <th className="text-end">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastCashflowData.length === 0 ? (
                              <tr><td colSpan={4} className="text-center" style={{padding:'1.5rem', color:'var(--text-secondary)', fontStyle:'italic'}}>Aucun coupon versé à ce jour</td></tr>
                            ) : pastCashflowData.slice(0, 10).map((flow, idx) => (
                                <tr key={idx}>
                                  <td>{new Date(flow.date).toLocaleDateString('fr-FR')}</td>
                                  <td>{flow.type}</td>
                                  <td className="text-end">{flow.total.toLocaleString()}</td>
                                  <td className="text-end"><span className="badge badge-success">✓ {flow.status || 'Honoré'}</span></td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <Link href={`/issuers/${issuer?.id || bondData.issuer}`} className="btn btn-primary btn-sm mt-3">
                        Voir tous les titres de cet émetteur →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Historique & événements */}
                <div className="col-lg-6 p-0">
                  <div className="bond-card">
                    <h3 className="card-title">Historique & Documents</h3>
                    
                    <div className="history-tabs">
                      <ul className="nav nav-tabs" role="tablist">
                        <li className="nav-item">
                          <button className={`nav-link ${historyTab === 'events' ? 'active' : ''}`} onClick={() => setHistoryTab('events')}>
                            Événements
                          </button>
                        </li>
                        <li className="nav-item">
                          <button className={`nav-link ${historyTab === 'documents' ? 'active' : ''}`} onClick={() => setHistoryTab('documents')}>
                            Documents
                          </button>
                        </li>
                      </ul>
                      
                      <div className="tab-content">
                        {historyTab === 'events' && (
                          <div className="tab-pane show active">
                            <div className="timeline">
                              {currentPrimaryData?.issue_lots?.map((lot, idx) => (
                                <div className="timeline-item" key={idx}>
                                  <div className="timeline-marker"></div>
                                  <div className="timeline-content">
                                    <div className="timeline-date">{lot.auction_date ? new Date(lot.auction_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</div>
                                    <div className="timeline-title">{lot.issue_type === 'NEW_ISSUE' ? 'Émission primaire' : 'Réouverture'}</div>
                                    <div className="timeline-description">
                                      Réf: {lot.reference} | Montant alloué: {parseNumber(lot.amount_allocated).toLocaleString()} | Taux de couverture: {parseNumber(lot.coverage_rate)}x | Clearing yield: {(parseNumber(lot.clearing_yield) * 100).toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(!currentPrimaryData?.issue_lots || currentPrimaryData.issue_lots.length === 0) && (
                                <div className="timeline-item">
                                  <div className="timeline-content">Aucun événement d'émission disponible</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {historyTab === 'documents' && (
                          <div className="tab-pane show active">
                            {currentPrimaryData?.issue_lots?.length ? (
                              <div className="file-explorer">
                                {currentPrimaryData.issue_lots.map((lot, idx) => {
                                  const label = lot.reference || `Lot ${idx + 1}`;
                                  const date = lot.auction_date ? new Date(lot.auction_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                                  const docs = [
                                    { ext: 'pdf', name: `Avis_${label}.pdf`, icon: '📄' },
                                    { ext: 'xlsx', name: `Résultats_${label}.xlsx`, icon: '📊' },
                                  ];
                                  return docs.map((doc, dIdx) => (
                                    <div key={`${idx}-${dIdx}`} className="file-item" title={doc.name}>
                                      <div className="file-icon" data-ext={doc.ext}>
                                        <span className="file-icon-emoji">{doc.icon}</span>
                                        <span className={`file-ext-badge ext-${doc.ext}`}>{doc.ext.toUpperCase()}</span>
                                      </div>
                                      <span className="file-name">{doc.name}</span>
                                      {date && <span className="file-date">{date}</span>}
                                    </div>
                                  ));
                                })}
                              </div>
                            ) : (
                              <p className="text-muted" style={{padding:'1rem', fontStyle:'italic', fontSize:'0.85rem'}}>Aucun document disponible pour le moment.</p>
                            )}
                          </div>
                        )}
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
