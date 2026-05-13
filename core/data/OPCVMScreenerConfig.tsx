import React from "react";

export type Period = "1M" | "3M" | "6M" | "9M" | "1Y" | "3Y" | "5Y";

export type MetricFamily = "general" | "performance" | "volatility" | "sharpe_ratio" | "sortino_ratio" | "calmar_ratio" | "treynor_ratio" | "information_ratio" | "alpha" | "beta" | "downside_deviation" | "max_drawdown" | "tracking_error" | "correlation_benchmark" | "active_return" | "benchmark_return";

export type ColumnConfig = {
  key: string;
  label: string;
  accessor: (fund: any, period?: Period) => any;
  className?: string;
  format?: (value: any) => string;
  sortKey?: string; // Clé utilisée pour le tri backend
  sortable?: boolean; // Indique si la colonne est triable
};

export type FamilyConfig = {
  id: MetricFamily;
  label: string;
  icon: JSX.Element;
  columns: ColumnConfig[];
};

export const familiesConfig: FamilyConfig[] = [
  {
    id: "general",
    label: "General",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    columns: [
      { key: "sgo", label: "Asset Management", accessor: (fund) => typeof fund.sgo === 'string' ? fund.sgo : fund.sgo?.name, sortable: false },
      { key: "nature", label: "Nature", accessor: (fund) => fund.nature, className: "badge-col", sortKey: "nature", sortable: true },
      { key: "type", label: "Type", accessor: (fund) => fund.type, sortKey: "type", sortable: true },
      { key: "currency", label: "Currency", accessor: (fund) => typeof fund.currency === 'string' ? fund.currency : fund.currency?.code, sortable: false },
      { key: "aum", label: "AUM (M)", accessor: (fund) => fund.aum, className: "number-col", format: (val) => `${(val / 1000000).toFixed(0)}M`, sortKey: "aum", sortable: true },
      { key: "risk", label: "Risk", accessor: (fund) => fund.niveau_risque, className: "number-col", sortKey: "niveau_risque", sortable: true },
    ]
  },
  {
    id: "performance",
    label: "Performance",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>,
    columns: [
      { key: "perf_1m", label: "Perf (1M)", accessor: (fund) => fund.latest_metrics?.performance_1m, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_1m", sortable: true },
      { key: "perf_3m", label: "Perf (3M)", accessor: (fund) => fund.latest_metrics?.performance_3m, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_3m", sortable: true },
      { key: "perf_6m", label: "Perf (6M)", accessor: (fund) => fund.latest_metrics?.performance_6m, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_6m", sortable: true },
      { key: "perf_9m", label: "Perf (9M)", accessor: (fund) => fund.latest_metrics?.performance_9m, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_9m", sortable: true },
      { key: "perf_1y", label: "Perf (1Y)", accessor: (fund) => fund.latest_metrics?.performance_1y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_1y", sortable: true },
      { key: "perf_3y", label: "Perf (3Y)", accessor: (fund) => fund.latest_metrics?.performance_3y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_3y", sortable: true },
      { key: "perf_5y", label: "Perf (5Y)", accessor: (fund) => fund.latest_metrics?.performance_5y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${Number(val).toFixed(2)}%` : 'N/A', sortKey: "performance_5y", sortable: true },
    ]
  },
  {
    id: "volatility",
    label: "Volatility",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>,
    columns: [
      { key: "vol_1m", label: "Vol (1M)", accessor: (fund) => fund.latest_metrics?.volatility_1m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_1m", sortable: true },
      { key: "vol_3m", label: "Vol (3M)", accessor: (fund) => fund.latest_metrics?.volatility_3m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_3m", sortable: true },
      { key: "vol_6m", label: "Vol (6M)", accessor: (fund) => fund.latest_metrics?.volatility_6m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_6m", sortable: true },
      { key: "vol_9m", label: "Vol (9M)", accessor: (fund) => fund.latest_metrics?.volatility_9m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_9m", sortable: true },
      { key: "vol_1y", label: "Vol (1Y)", accessor: (fund) => fund.latest_metrics?.volatility_1y, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_1y", sortable: true },
      { key: "vol_3y", label: "Vol (3Y)", accessor: (fund) => fund.latest_metrics?.volatility_3y, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_3y", sortable: true },
      { key: "vol_5y", label: "Vol (5Y)", accessor: (fund) => fund.latest_metrics?.volatility_5y, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "volatility_5y", sortable: true },
    ]
  },
  {
    id: "sharpe_ratio",
    label: "Sharpe Ratio",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
    columns: [
      { key: "sharpe_1m", label: "Sharpe (1M)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_1m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_1m", sortable: true },
      { key: "sharpe_3m", label: "Sharpe (3M)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_3m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_3m", sortable: true },
      { key: "sharpe_6m", label: "Sharpe (6M)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_6m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_6m", sortable: true },
      { key: "sharpe_9m", label: "Sharpe (9M)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_9m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_9m", sortable: true },
      { key: "sharpe_1y", label: "Sharpe (1Y)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_1y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_1y", sortable: true },
      { key: "sharpe_3y", label: "Sharpe (3Y)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_3y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_3y", sortable: true },
      { key: "sharpe_5y", label: "Sharpe (5Y)", accessor: (fund) => fund.latest_metrics?.sharpe_ratio_5y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sharpe_ratio_5y", sortable: true },
    ]
  },
  {
    id: "sortino_ratio",
    label: "Sortino Ratio",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    columns: [
      { key: "sortino_1m", label: "Sortino (1M)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_1m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_1m", sortable: true },
      { key: "sortino_3m", label: "Sortino (3M)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_3m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_3m", sortable: true },
      { key: "sortino_6m", label: "Sortino (6M)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_6m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_6m", sortable: true },
      { key: "sortino_9m", label: "Sortino (9M)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_9m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_9m", sortable: true },
      { key: "sortino_1y", label: "Sortino (1Y)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_1y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_1y", sortable: true },
      { key: "sortino_3y", label: "Sortino (3Y)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_3y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_3y", sortable: true },
      { key: "sortino_5y", label: "Sortino (5Y)", accessor: (fund) => fund.latest_metrics?.sortino_ratio_5y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "sortino_ratio_5y", sortable: true },
    ]
  },
  {
    id: "max_drawdown",
    label: "Max Drawdown",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /></svg>,
    columns: [
      { key: "dd_1m", label: "DD (1M)", accessor: (fund) => fund.latest_metrics?.max_drawdown_1m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_1m", sortable: true },
      { key: "dd_3m", label: "DD (3M)", accessor: (fund) => fund.latest_metrics?.max_drawdown_3m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_3m", sortable: true },
      { key: "dd_6m", label: "DD (6M)", accessor: (fund) => fund.latest_metrics?.max_drawdown_6m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_6m", sortable: true },
      { key: "dd_9m", label: "DD (9M)", accessor: (fund) => fund.latest_metrics?.max_drawdown_9m, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_9m", sortable: true },
      { key: "dd_1y", label: "DD (1Y)", accessor: (fund) => fund.latest_metrics?.max_drawdown_1y, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_1y", sortable: true },
      { key: "dd_3y", label: "DD (3Y)", accessor: (fund) => fund.latest_metrics?.max_drawdown_3y, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_3y", sortable: true },
      { key: "dd_5y", label: "DD (5Y)", accessor: (fund) => fund.latest_metrics?.max_drawdown_5y, className: "number-col", format: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'N/A', sortKey: "max_drawdown_5y", sortable: true },
    ]
  },
  {
    id: "alpha",
    label: "Alpha",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
    columns: [
      { key: "alpha_1m", label: "Alpha (1M)", accessor: (fund) => fund.latest_metrics?.alpha_1m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_1m", sortable: true },
      { key: "alpha_3m", label: "Alpha (3M)", accessor: (fund) => fund.latest_metrics?.alpha_3m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_3m", sortable: true },
      { key: "alpha_6m", label: "Alpha (6M)", accessor: (fund) => fund.latest_metrics?.alpha_6m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_6m", sortable: true },
      { key: "alpha_9m", label: "Alpha (9M)", accessor: (fund) => fund.latest_metrics?.alpha_9m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_9m", sortable: true },
      { key: "alpha_1y", label: "Alpha (1Y)", accessor: (fund) => fund.latest_metrics?.alpha_1y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_1y", sortable: true },
      { key: "alpha_3y", label: "Alpha (3Y)", accessor: (fund) => fund.latest_metrics?.alpha_3y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_3y", sortable: true },
      { key: "alpha_5y", label: "Alpha (5Y)", accessor: (fund) => fund.latest_metrics?.alpha_5y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "alpha_5y", sortable: true },
    ]
  },
  {
    id: "beta",
    label: "Beta",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>,
    columns: [
      { key: "beta_1m", label: "Beta (1M)", accessor: (fund) => fund.latest_metrics?.beta_1m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_1m", sortable: true },
      { key: "beta_3m", label: "Beta (3M)", accessor: (fund) => fund.latest_metrics?.beta_3m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_3m", sortable: true },
      { key: "beta_6m", label: "Beta (6M)", accessor: (fund) => fund.latest_metrics?.beta_6m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_6m", sortable: true },
      { key: "beta_9m", label: "Beta (9M)", accessor: (fund) => fund.latest_metrics?.beta_9m, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_9m", sortable: true },
      { key: "beta_1y", label: "Beta (1Y)", accessor: (fund) => fund.latest_metrics?.beta_1y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_1y", sortable: true },
      { key: "beta_3y", label: "Beta (3Y)", accessor: (fund) => fund.latest_metrics?.beta_3y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_3y", sortable: true },
      { key: "beta_5y", label: "Beta (5Y)", accessor: (fund) => fund.latest_metrics?.beta_5y, className: "number-col", format: (val) => val != null ? Number(val).toFixed(2) : 'N/A', sortKey: "beta_5y", sortable: true },
    ]
  },
];

export const getMetricsByPeriod = (fund: any, selectedPeriod: Period) => {
  const parseMetric = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? null : parsed;
  };

  const periodMap = {
    '1M': { 
      perf: parseMetric(fund.performance_1m), 
      vol: parseMetric(fund.volatility_1m), 
      sharpe: parseMetric(fund.sharpe_ratio_1m) 
    },
    '3M': { 
      perf: parseMetric(fund.performance_3m), 
      vol: parseMetric(fund.volatility_3m), 
      sharpe: parseMetric(fund.sharpe_ratio_3m) 
    },
    '6M': { 
      perf: parseMetric(fund.performance_6m), 
      vol: parseMetric(fund.volatility_6m), 
      sharpe: parseMetric(fund.sharpe_ratio_6m) 
    },
    '9M': { 
      perf: parseMetric(fund.performance_9m), 
      vol: parseMetric(fund.volatility_9m), 
      sharpe: parseMetric(fund.sharpe_ratio_9m) 
    },
    '1Y': { 
      perf: parseMetric(fund.performance_1y), 
      vol: parseMetric(fund.volatility_1y), 
      sharpe: parseMetric(fund.sharpe_ratio_1y) 
    },
    '3Y': { 
      perf: parseMetric(fund.performance_3y), 
      vol: parseMetric(fund.volatility_3y), 
      sharpe: parseMetric(fund.sharpe_ratio_3y) 
    },
    '5Y': { 
      perf: parseMetric(fund.performance_5y), 
      vol: parseMetric(fund.volatility_5y), 
      sharpe: parseMetric(fund.sharpe_ratio_5y) 
    },
  };
  return periodMap[selectedPeriod] || { perf: null, vol: null, sharpe: null };
};
