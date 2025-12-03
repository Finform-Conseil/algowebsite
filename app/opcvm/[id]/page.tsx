'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import IndependentChartView from '@/components/technical/IndependentChartView';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

type OPCVMDetail = {
  id: string;
  name: string;
  isin: string;
  exchange: string;
  category: string; // Actions, Obligations, Monétaire, Mixte
  legalForm: string; // FCP, SICAV
  managementCompany: string;
  currentNav: number;
  navChange: number;
  navChangePercent: number;
  netAssets: number; // in currency
  currency: string;
  resultAllocation: string; // Capitalisation, Distribution
  performance1M: number;
  performance3M: number;
  performance6M: number;
  performance1Y: number;
  performanceYTD: number;
  volatility: number;
  sharpeRatio: number;
  rating: number;
  inceptionDate: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
};

export default function OPCVMDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  // Mock data - À remplacer par un fetch API
  const opcvmData: OPCVMDetail = {
    id: id || '1',
    name: 'NSIA Actions Côte d\'Ivoire',
    isin: 'CI0001234567',
    exchange: 'BRVM',
    category: 'Actions',
    legalForm: 'FCP',
    managementCompany: 'NSIA Gestion',
    currentNav: 12547.80,
    navChange: 45.30,
    navChangePercent: 0.36,
    netAssets: 15000000000,
    currency: 'XOF',
    resultAllocation: 'Capitalisation',
    performance1M: 2.3,
    performance3M: 5.8,
    performance6M: 11.2,
    performance1Y: 18.3,
    performanceYTD: 14.7,
    volatility: 12.5,
    sharpeRatio: 1.46,
    rating: 5,
    inceptionDate: '2018-03-15',
    location: {
      lat: 5.3600,
      lng: -4.0083,
      city: 'Abidjan',
      country: 'Côte d\'Ivoire'
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'YTD'>('1Y');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatLargeCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)} Mds`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)} M`;
    }
    return formatCurrency(amount);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={star <= rating ? '#F59E0B' : 'none'}
            stroke={star <= rating ? '#F59E0B' : '#D1D5DB'}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  const getPerformanceByPeriod = () => {
    switch (selectedPeriod) {
      case '1M': return opcvmData.performance1M;
      case '3M': return opcvmData.performance3M;
      case '6M': return opcvmData.performance6M;
      case '1Y': return opcvmData.performance1Y;
      case 'YTD': return opcvmData.performanceYTD;
      default: return opcvmData.performance1Y;
    }
  };

  return (
    <div className="opcvm-detail-page">
      {/* Breadcrumb */}
      <div className="opcvm-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <Link href="/opcvm">OPCVM</Link>
        <span>/</span>
        <span>{opcvmData.name}</span>
      </div>

      {/* Header */}
      <div className="opcvm-detail-header">
        <div className="header-content">
          <div className="header-left">
            <div className="fund-badges">
              <span className="badge exchange">{opcvmData.exchange}</span>
              <span className="badge category">{opcvmData.category}</span>
            </div>
            <h1>{opcvmData.name}</h1>
            <div className="fund-meta">
              <span className="isin">ISIN: {opcvmData.isin}</span>
              <span className="separator">•</span>
              <span className="management">{opcvmData.managementCompany}</span>
            </div>
          </div>

          <div className="header-right">
            <div className="nav-display">
              <div className="nav-label">Valeur Liquidative</div>
              <div className="nav-value">
                {formatCurrency(opcvmData.currentNav)} <span className="currency">{opcvmData.currency}</span>
              </div>
              <div className={`nav-change ${opcvmData.navChangePercent >= 0 ? 'positive' : 'negative'}`}>
                {opcvmData.navChangePercent >= 0 ? '+' : ''}{opcvmData.navChangePercent}% 
                ({opcvmData.navChange >= 0 ? '+' : ''}{formatCurrency(opcvmData.navChange)})
              </div>
            </div>
            <div className="fund-rating">
              {renderStars(opcvmData.rating)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="opcvm-detail-content">
        {/* Left Column */}
        <div className="content-left">
          {/* Performance Section */}
          <div className="performance-section">
            <h3>Performances</h3>
            <div className="performance-grid">
              <div className="perf-card">
                <div className="perf-label">1 Mois</div>
                <div className={`perf-value ${opcvmData.performance1M >= 0 ? 'positive' : 'negative'}`}>
                  {opcvmData.performance1M >= 0 ? '+' : ''}{opcvmData.performance1M}%
                </div>
              </div>
              <div className="perf-card">
                <div className="perf-label">3 Mois</div>
                <div className={`perf-value ${opcvmData.performance3M >= 0 ? 'positive' : 'negative'}`}>
                  {opcvmData.performance3M >= 0 ? '+' : ''}{opcvmData.performance3M}%
                </div>
              </div>
              <div className="perf-card">
                <div className="perf-label">6 Mois</div>
                <div className={`perf-value ${opcvmData.performance6M >= 0 ? 'positive' : 'negative'}`}>
                  {opcvmData.performance6M >= 0 ? '+' : ''}{opcvmData.performance6M}%
                </div>
              </div>
              <div className="perf-card">
                <div className="perf-label">1 An</div>
                <div className={`perf-value ${opcvmData.performance1Y >= 0 ? 'positive' : 'negative'}`}>
                  {opcvmData.performance1Y >= 0 ? '+' : ''}{opcvmData.performance1Y}%
                </div>
              </div>
              <div className="perf-card">
                <div className="perf-label">YTD</div>
                <div className={`perf-value ${opcvmData.performanceYTD >= 0 ? 'positive' : 'negative'}`}>
                  {opcvmData.performanceYTD >= 0 ? '+' : ''}{opcvmData.performanceYTD}%
                </div>
              </div>
              <div className="perf-card highlight">
                <div className="perf-label">Depuis création</div>
                <div className="perf-value positive">+{opcvmData.performance1Y}%</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="chart-section">
            {/* <div className="section-header">
              <h3>Évolution de la VL</h3>
              <div className="period-selector">
                {(['1M', '3M', '6M', '1Y', 'YTD'] as const).map((period) => (
                  <button
                    key={period}
                    className={selectedPeriod === period ? 'active' : ''}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div> */}
            <div className="chart-container">
              <IndependentChartView chartId={1} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="content-right">
          {/* Key Info Section */}
          <div className="info-section">
            <h3>Informations Clés</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">VL Actuelle</div>
                <div className="info-value">{formatCurrency(opcvmData.currentNav)} {opcvmData.currency}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Catégorie</div>
                <div className="info-value">{opcvmData.category}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Nature Juridique</div>
                <div className="info-value">{opcvmData.legalForm}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Société de Gestion</div>
                <div className="info-value">{opcvmData.managementCompany}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Actif Net</div>
                <div className="info-value">{formatLargeCurrency(opcvmData.netAssets)} {opcvmData.currency}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Affectation des Résultats</div>
                <div className="info-value">{opcvmData.resultAllocation}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Date de Création</div>
                <div className="info-value">{new Date(opcvmData.inceptionDate).toLocaleDateString('fr-FR')}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Code ISIN</div>
                <div className="info-value">{opcvmData.isin}</div>
              </div>
            </div>
          </div>

          {/* Risk Metrics Section */}
          <div className="risk-section">
            <h3>Indicateurs de Risque</h3>
            <div className="risk-grid">
              <div className="risk-item">
                <div className="risk-label">Volatilité</div>
                <div className="risk-value">{opcvmData.volatility}%</div>
                <div className="risk-bar">
                  <div className="risk-fill" style={{ width: `${Math.min(opcvmData.volatility * 5, 100)}%` }}></div>
                </div>
              </div>
              <div className="risk-item">
                <div className="risk-label">Ratio de Sharpe</div>
                <div className="risk-value">{opcvmData.sharpeRatio.toFixed(2)}</div>
                <div className="risk-description">Performance ajustée au risque</div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="location-section">
            <h3>Localisation</h3>
            <div className="location-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{opcvmData.location.city}, {opcvmData.location.country}</span>
            </div>
            <div className="map-container">
              <MapContainer
                center={[opcvmData.location.lat, opcvmData.location.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[opcvmData.location.lat, opcvmData.location.lng]}>
                  <Popup>
                    <strong>{opcvmData.managementCompany}</strong><br />
                    {opcvmData.location.city}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
