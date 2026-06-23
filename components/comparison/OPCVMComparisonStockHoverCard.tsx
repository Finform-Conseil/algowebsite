'use client';

import { useEffect, useState } from 'react';
import { OPCVMEntity } from '@/core/domain/entities/opcvm.entity';
import { useOpcvmMetricRepository } from '@/core/infra/repositories/opcvm.repository.impl';

interface OPCVMComparisonStockHoverCardProps {
  opcvm: OPCVMEntity;
  children: React.ReactNode;
}

const NATURE_INFO: Record<string, { fullName: string; description: string }> = {
  FCP: {
    fullName: 'Fonds Commun de Placement',
    description: 'Copropriété de valeurs mobilières',
  },
  SICAV: {
    fullName: 'Société d\'Investissement à Capital Variable',
    description: 'Société anonyme à capital variable',
  },
};

export default function OPCVMComparisonStockHoverCard({ opcvm, children }: OPCVMComparisonStockHoverCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { allOpcvmMetricsData, getAllOpcvmMetrics } = useOpcvmMetricRepository();
  useEffect(() => { getAllOpcvmMetrics({opcvm:opcvm.id, page:1, page_size:10}); }, [opcvm.id]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const natureInfo = NATURE_INFO[opcvm.nature] || {
    fullName: opcvm.nature,
    description: '',
  };

  // Calculer min/max des valeurs liquidatives
  const values = allOpcvmMetricsData?.data?.map(m => m.liquidative_value) || [];
  const minPrice = values.length > 0 ? Math.min(...values) : 0;
  const maxPrice = values.length > 0 ? Math.max(...values) : 0;

  return (
    <div className="stock-hover-trigger" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}

      {isVisible && (
        <div
          className="stock-hover-card"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="stock-hover-card__header">
            <div className="stock-hover-card__logo">{opcvm.intitule.substring(0, 2).toUpperCase()}</div>
            <div className="stock-hover-card__title">
              <div className="stock-hover-card__ticker">{opcvm.intitule}</div>
              <div className="stock-hover-card__name">{opcvm.isin}</div>
            </div>
          </div>

          {/* Nature Info */}
          <div className="stock-hover-card__market">
            <div className="market-badge">{opcvm.nature}</div>
            <div className="market-details">
              <div className="market-fullname">{natureInfo.fullName}</div>
              <div className="market-location">{opcvm.type}</div>
            </div>
          </div>

          <div className="stock-hover-card__price">
            <span className="stock-hover-card__price-value">
              {allOpcvmMetricsData?.data?.[0]?.liquidative_value || 'N/A'} {typeof opcvm.currency === 'string' ? opcvm.currency : opcvm.currency?.code}
            </span>
            <span className={`stock-hover-card__change ${(opcvm.latest_metrics?.rendement ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              {(opcvm.latest_metrics?.rendement ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(opcvm.latest_metrics?.rendement ?? 0).toFixed(2)}%
            </span>
          </div>

          <div className="stock-hover-card__metrics">
            <div className="metric">
              <span className="metric__label">AUM</span>
              <span className="metric__value">{(opcvm.aum / 1000000).toFixed(1)}M</span>
            </div>
            <div className="metric">
              <span className="metric__label">Risque</span>
              <span className="metric__value">{opcvm.niveau_risque}/10</span>
            </div>
            <div className="metric">
              <span className="metric__label">Perf 1Y</span>
              <span className="metric__value">{Number(opcvm.latest_metrics?.performance_1y)?.toFixed(1) ?? 'N/A'}%</span>
            </div>
            <div className="metric">
              <span className="metric__label">SGO</span>
              <span className="metric__value">{typeof opcvm.sgo === 'string' ? opcvm.sgo : opcvm.sgo?.name}</span>
            </div>
          </div>

          {/* Mini sparkline */}
          <div className="stock-hover-card__sparkline">
            <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                points={allOpcvmMetricsData?.data?.map((metric, i) => {
                    const x = (i / (allOpcvmMetricsData?.data?.length - 1)) * 100;
                    const y = 30 - ((metric.liquidative_value - minPrice) / (maxPrice - minPrice)) * 28;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={(opcvm.latest_metrics?.rendement ?? 0) >= 0 ? '#4ade80' : '#f87171'}
                strokeWidth="2"
              />
            </svg>
            <div className="sparkline-label">6 mois</div>
          </div>
        </div>
      )}
    </div>
  );
}
