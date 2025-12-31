'use client';

import { useState } from 'react';
import Link from 'next/link';
import IndependentChartView from '@/components/technical/IndependentChartView';

export default function TechnicalAnalysisPage() {
  const [layoutMode, setLayoutMode] = useState<'1' | '2h' | '2v' | '4'>('1');
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  return (
    <div className="technical-analysis-page">
      {/* Breadcrumb + Layout Controls */}
      <div className="technical-analysis-breadcrumb">
        <div className="breadcrumb-left">
          <Link href="/">Accueil</Link>
          <span>/</span>
          <span>Analyse Technique</span>
        </div>
        
        {/* Layout Selector */}
        <div className="layout-selector">
          <button className="icon-btn" onClick={() => setShowLayoutMenu(!showLayoutMenu)} title="Disposition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          {showLayoutMenu && (
            <div className="layout-menu">
              <button className="layout-option" onClick={() => { setLayoutMode('1'); setShowLayoutMenu(false); }}>
                <svg width="40" height="30" viewBox="0 0 40 30">
                  <rect x="2" y="2" width="36" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>1 Chart</span>
              </button>
              <button className="layout-option" onClick={() => { setLayoutMode('2h'); setShowLayoutMenu(false); }}>
                <svg width="40" height="30" viewBox="0 0 40 30">
                  <rect x="2" y="2" width="36" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="2" y="17" width="36" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>2 Horizontal</span>
              </button>
              <button className="layout-option" onClick={() => { setLayoutMode('2v'); setShowLayoutMenu(false); }}>
                <svg width="40" height="30" viewBox="0 0 40 30">
                  <rect x="2" y="2" width="16" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="22" y="2" width="16" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>2 Vertical</span>
              </button>
              <button className="layout-option" onClick={() => { setLayoutMode('4'); setShowLayoutMenu(false); }}>
                <svg width="40" height="30" viewBox="0 0 40 30">
                  <rect x="2" y="2" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="22" y="2" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="2" y="17" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="22" y="17" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>4 Charts</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Charts Layout */}
      <div className={`charts-layout charts-layout--${layoutMode}`}>
        {layoutMode === '1' ? (
          <IndependentChartView chartId={1} />
        ) : layoutMode === '2h' ? (
          <>
            <IndependentChartView chartId={1} />
            <IndependentChartView chartId={2} />
          </>
        ) : layoutMode === '2v' ? (
          <>
            <IndependentChartView chartId={1} />
            <IndependentChartView chartId={2} />
          </>
        ) : (
          <>
            <IndependentChartView chartId={1} />
            <IndependentChartView chartId={2} />
            <IndependentChartView chartId={3} />
            <IndependentChartView chartId={4} />
          </>
        )}
      </div>
    </div>
  );
}
