import React from "react";
import type {
  IndicatorBacktestDashboard,
  IndicatorBacktestDashboardStatus,
  IndicatorFamilyBacktestDashboardRow,
} from "../../../config/indicators/indicatorBacktestDashboard";

interface IndicatorBacktestComparisonDashboard {
  dashboard: IndicatorBacktestDashboard;
  source?: string;
  symbol: string;
}

interface IndicatorBacktestPanelProps {
  comparisonDashboards?: readonly IndicatorBacktestComparisonDashboard[];
  dashboard: IndicatorBacktestDashboard;
  symbol: string;
  timeframe: string;
}

const STATUS_LABELS: Record<IndicatorBacktestDashboardStatus, string> = {
  "insufficient-data": "DATA",
  "no-trades": "NEUTRE",
  ready: "LIVE",
};

const STATUS_TITLES: Record<IndicatorBacktestDashboardStatus, string> = {
  "insufficient-data": "Historique insuffisant",
  "no-trades": "Aucun trade directionnel",
  ready: "Backtest actif",
};

export const IndicatorBacktestPanel = React.memo(({
  comparisonDashboards = [],
  dashboard,
  symbol,
  timeframe,
}: IndicatorBacktestPanelProps) => {
  const topFamilyLabel = dashboard.topFamily
    ? `${dashboard.topFamily.label} ${formatPercent(dashboard.topFamily.winRate)}`
    : "N/D";
  const sampleLabel = `${dashboard.sampleBars}/${dashboard.bars} bougies`;
  const visibleComparisons = comparisonDashboards.slice(0, 5);

  return (
    <section
      aria-label="Backtesting par famille d'indicateurs"
      className={`gp-indicator-backtest-panel is-${dashboard.status}`}
    >
      <div className="gp-indicator-backtest-head">
        <div>
          <span>Backtesting par famille</span>
          <strong>{symbol} · {timeframe || "1D"}</strong>
        </div>
        <em title={dashboard.caveat}>{STATUS_TITLES[dashboard.status]}</em>
      </div>
      <div className="gp-indicator-backtest-summary">
        <BacktestMetric label="Indicateurs" value={formatInteger(dashboard.totalIndicators)} />
        <BacktestMetric label="Familles" value={formatInteger(dashboard.families.length)} />
        <BacktestMetric label="Trades" value={formatInteger(dashboard.trades)} />
        <BacktestMetric label="Win" value={formatPercent(dashboard.winRate)} tone={resolvePercentTone(dashboard.winRate)} />
        <BacktestMetric label="Moy." value={formatSignedPercent(dashboard.averageReturnPct)} tone={resolveReturnTone(dashboard.averageReturnPct)} />
        <BacktestMetric label="Top" value={topFamilyLabel} />
      </div>
      <div className="gp-indicator-backtest-window">
        <span>{sampleLabel}</span>
        <span>{dashboard.evaluatedIndicators}/{dashboard.totalIndicators} évalués</span>
        <span>{dashboard.ignoredSignals} signaux ignorés</span>
      </div>
      {visibleComparisons.length > 0 && (
        <div className="gp-indicator-backtest-comparison" aria-label="Backtesting comparatif par ticker">
          <span>Comparatif</span>
          <div>
            {visibleComparisons.map((comparison) => (
              <BacktestComparisonChip comparison={comparison} key={comparison.symbol} />
            ))}
          </div>
        </div>
      )}
      <div className="gp-indicator-backtest-family-grid">
        {dashboard.families.map((family) => (
          <BacktestFamilyTile family={family} key={family.family} />
        ))}
      </div>
    </section>
  );
});
IndicatorBacktestPanel.displayName = "IndicatorBacktestPanel";

const BacktestMetric = React.memo(({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) => (
  <span className={`gp-indicator-backtest-metric is-${tone}`}>
    <strong>{value}</strong>
    <small>{label}</small>
  </span>
));
BacktestMetric.displayName = "BacktestMetric";

const BacktestComparisonChip = React.memo(({
  comparison,
}: {
  comparison: IndicatorBacktestComparisonDashboard;
}) => {
  const title = `${comparison.symbol}\n${comparison.dashboard.caveat}`;
  return (
    <article className={`is-${comparison.dashboard.status}`} title={title}>
      <strong>{comparison.symbol}</strong>
      <span className={resolvePercentTone(comparison.dashboard.winRate)}>{formatPercent(comparison.dashboard.winRate)}</span>
      <small>{formatInteger(comparison.dashboard.trades)} trades</small>
      <em className={resolveReturnTone(comparison.dashboard.averageReturnPct)}>{formatSignedPercent(comparison.dashboard.averageReturnPct)}</em>
    </article>
  );
});
BacktestComparisonChip.displayName = "BacktestComparisonChip";

const BacktestFamilyTile = React.memo(({ family }: { family: IndicatorFamilyBacktestDashboardRow }) => {
  const bestLabel = family.bestIndicatorLabel
    ? `${family.bestIndicatorLabel} · ${formatPercent(family.bestIndicatorWinRate)}`
    : family.caveat;
  const modelLabel = family.signalModels.length > 0 ? family.signalModels.join(" · ") : "N/D";

  return (
    <article
      className={`gp-indicator-backtest-family is-${family.status}`}
      title={`${family.label}\n${family.caveat}\n${modelLabel}`}
    >
      <div className="gp-indicator-backtest-family-head">
        <strong>{family.label}</strong>
        <span>{STATUS_LABELS[family.status]}</span>
      </div>
      <div className="gp-indicator-backtest-family-metrics">
        <span>
          <strong className={resolvePercentTone(family.winRate)}>{formatPercent(family.winRate)}</strong>
          <small>Win</small>
        </span>
        <span>
          <strong>{formatInteger(family.trades)}</strong>
          <small>Trades</small>
        </span>
        <span>
          <strong className={resolveReturnTone(family.averageReturnPct)}>{formatSignedPercent(family.averageReturnPct)}</strong>
          <small>Moy.</small>
        </span>
      </div>
      <small className="gp-indicator-backtest-family-best">{bestLabel}</small>
    </article>
  );
});
BacktestFamilyTile.displayName = "BacktestFamilyTile";

const formatInteger = (value: number): string => value.toLocaleString("fr-FR");

const formatPercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "N/D";
  return `${value.toFixed(1)}%`;
};

const formatSignedPercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "N/D";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const resolvePercentTone = (value: number | null): "good" | "bad" | "neutral" => {
  if (value === null) return "neutral";
  if (value >= 55) return "good";
  if (value <= 45) return "bad";
  return "neutral";
};

const resolveReturnTone = (value: number | null): "good" | "bad" | "neutral" => {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "good" : "bad";
};
