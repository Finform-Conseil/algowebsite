import React from "react";

export type MetricFamily = "overview" | "performance" | "valuation" | "profitability" | "growth" | "dividends" | "technical" | "momentum" | "custom";

export type ColumnConfig = {
  key: string;
  label: string;
  accessor: (action: any) => any;
  className?: string;
  format?: (value: any) => string;
  sortKey?: string;
  sortable?: boolean;
};

export type FamilyConfig = {
  id: MetricFamily;
  label: string;
  icon: JSX.Element;
  columns: ColumnConfig[];
};

export const familiesConfig: FamilyConfig[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    columns: [
      { key: "sector", label: "Sector", accessor: (action) => action.society?.sector || 'N/A', sortable: false },
      { key: "price", label: "Price", accessor: (action) => action.latest_price_metric?.price, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}` : 'N/A', sortKey: "latest_price_metric__price", sortable: true },
      { key: "market_cap", label: "Market Cap", accessor: (action) => action.latest_valuation_ratio?.market_cap, className: "number-col", format: (val) => val != null ? `${(val / 1000000).toFixed(0)}M` : 'N/A', sortKey: "latest_valuation_ratio__market_cap", sortable: true },
      { key: "volume", label: "Volume", accessor: (action) => action.latest_price_metric?.volume, className: "number-col", format: (val) => val != null ? `${(val / 1000).toFixed(0)}K` : 'N/A', sortKey: "latest_price_metric__volume", sortable: true },
      { key: "change_1d", label: "Change (1D)", accessor: (action) => action.latest_price_metric?.change_1d_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_1d_pct", sortable: true },
    ]
  },
  {
    id: "performance",
    label: "Performance",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>,
    columns: [
      { key: "perf_1w", label: "1 Week", accessor: (action) => action.latest_price_metric?.change_1w_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_1w_pct", sortable: true },
      { key: "perf_1m", label: "1 Month", accessor: (action) => action.latest_price_metric?.change_1m_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_1m_pct", sortable: true },
      { key: "perf_3m", label: "3 Months", accessor: (action) => action.latest_price_metric?.change_3m_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_3m_pct", sortable: true },
      { key: "perf_6m", label: "6 Months", accessor: (action) => action.latest_price_metric?.change_6m_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_6m_pct", sortable: true },
      { key: "perf_ytd", label: "YTD", accessor: (action) => action.latest_price_metric?.change_ytd_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_ytd_pct", sortable: true },
      { key: "perf_1y", label: "1 Year", accessor: (action) => action.latest_price_metric?.change_1y_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_1y_pct", sortable: true },
      { key: "perf_3y", label: "3 Years", accessor: (action) => action.latest_price_metric?.change_3y_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_3y_pct", sortable: true },
      { key: "perf_5y", label: "5 Years", accessor: (action) => action.latest_price_metric?.change_5y_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_5y_pct", sortable: true },
    ]
  },
  {
    id: "valuation",
    label: "Valuation",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    columns: [
      { key: "pe_ttm", label: "P/E (TTM)", accessor: (action) => action.latest_valuation_ratio?.pe_ttm, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__pe_ttm", sortable: true },
      { key: "pe_forward", label: "P/E (Fwd)", accessor: (action) => action.latest_valuation_ratio?.pe_forward, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__pe_forward", sortable: true },
      { key: "pb_ratio", label: "P/B", accessor: (action) => action.latest_valuation_ratio?.pb_ratio, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__pb_ratio", sortable: true },
      { key: "ps_ratio", label: "P/S", accessor: (action) => action.latest_valuation_ratio?.ps_ratio, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__ps_ratio", sortable: true },
      { key: "peg_ratio", label: "PEG", accessor: (action) => action.latest_valuation_ratio?.peg_ratio, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__peg_ratio", sortable: true },
      { key: "ev_ebitda", label: "EV/EBITDA", accessor: (action) => action.latest_valuation_ratio?.ev_ebitda, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__ev_ebitda", sortable: true },
    ]
  },
  {
    id: "profitability",
    label: "Profitability",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    columns: [
      { key: "gross_margin", label: "Gross Margin", accessor: (action) => action.latest_valuation_ratio?.gross_margin, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__gross_margin", sortable: true },
      { key: "operating_margin", label: "Op. Margin", accessor: (action) => action.latest_valuation_ratio?.operating_margin, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__operating_margin", sortable: true },
      { key: "net_margin", label: "Net Margin", accessor: (action) => action.latest_valuation_ratio?.net_margin, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__net_margin", sortable: true },
      { key: "roe", label: "ROE", accessor: (action) => action.latest_valuation_ratio?.roe, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__roe", sortable: true },
      { key: "roa", label: "ROA", accessor: (action) => action.latest_valuation_ratio?.roa, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__roa", sortable: true },
      { key: "roic", label: "ROIC", accessor: (action) => action.latest_valuation_ratio?.roic, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__roic", sortable: true },
    ]
  },
  {
    id: "growth",
    label: "Growth",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
    columns: [
      { key: "revenue_growth_yoy", label: "Revenue (YoY)", accessor: (action) => action.latest_valuation_ratio?.revenue_growth_yoy, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__revenue_growth_yoy", sortable: true },
      { key: "revenue_growth_3y", label: "Revenue (3Y)", accessor: (action) => action.latest_valuation_ratio?.revenue_growth_3y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__revenue_growth_3y", sortable: true },
      { key: "eps_growth_yoy", label: "EPS (YoY)", accessor: (action) => action.latest_valuation_ratio?.eps_growth_yoy, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__eps_growth_yoy", sortable: true },
      { key: "eps_growth_3y", label: "EPS (3Y)", accessor: (action) => action.latest_valuation_ratio?.eps_growth_3y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__eps_growth_3y", sortable: true },
      { key: "net_income_growth_yoy", label: "Net Income (YoY)", accessor: (action) => action.latest_valuation_ratio?.net_income_growth_yoy, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__net_income_growth_yoy", sortable: true },
    ]
  },
  {
    id: "dividends",
    label: "Dividends",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    columns: [
      { key: "dividend_yield", label: "Div. Yield", accessor: (action) => action.latest_valuation_ratio?.dividend_yield, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__dividend_yield", sortable: true },
      { key: "payout_ratio", label: "Payout Ratio", accessor: (action) => action.latest_valuation_ratio?.payout_ratio, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__payout_ratio", sortable: true },
      { key: "dividend_growth_3y", label: "Div. Growth (3Y)", accessor: (action) => action.latest_valuation_ratio?.dividend_growth_3y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__dividend_growth_3y", sortable: true },
      { key: "dividend_growth_5y", label: "Div. Growth (5Y)", accessor: (action) => action.latest_valuation_ratio?.dividend_growth_5y, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__dividend_growth_5y", sortable: true },
      { key: "shareholder_yield", label: "Shareholder Yield", accessor: (action) => action.latest_valuation_ratio?.shareholder_yield, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_valuation_ratio__shareholder_yield", sortable: true },
    ]
  },
  {
    id: "technical",
    label: "Technical",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
    columns: [
      { key: "rsi_14", label: "RSI (14)", accessor: (action) => action.latest_technical_indicator?.rsi_14, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_technical_indicator__rsi_14", sortable: true },
      { key: "macd_histogram", label: "MACD Hist", accessor: (action) => action.latest_technical_indicator?.macd_histogram, className: "number-col", format: (val) => val != null ? val.toFixed(4) : 'N/A', sortKey: "latest_technical_indicator__macd_histogram", sortable: true },
      { key: "adx", label: "ADX", accessor: (action) => action.latest_technical_indicator?.adx, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_technical_indicator__adx", sortable: true },
      { key: "price_vs_sma50", label: "vs SMA50", accessor: (action) => action.latest_technical_indicator?.price_vs_sma50_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_technical_indicator__price_vs_sma50_pct", sortable: true },
      { key: "price_vs_sma200", label: "vs SMA200", accessor: (action) => action.latest_technical_indicator?.price_vs_sma200_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_technical_indicator__price_vs_sma200_pct", sortable: true },
      { key: "bb_pct", label: "BB %", accessor: (action) => action.latest_technical_indicator?.bb_pct, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_technical_indicator__bb_pct", sortable: true },
    ]
  },
  {
    id: "momentum",
    label: "Momentum",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    columns: [
      { key: "vol_relative", label: "Rel. Volume", accessor: (action) => action.latest_price_metric?.vol_relative, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_price_metric__vol_relative", sortable: true },
      { key: "change_52w_high", label: "vs 52W High", accessor: (action) => action.latest_price_metric?.change_52w_high_pct, className: "number-col", format: (val) => val != null ? `${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_52w_high_pct", sortable: true },
      { key: "change_52w_low", label: "vs 52W Low", accessor: (action) => action.latest_price_metric?.change_52w_low_pct, className: "number-col", format: (val) => val != null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A', sortKey: "latest_price_metric__change_52w_low_pct", sortable: true },
      { key: "beta_5y", label: "Beta (5Y)", accessor: (action) => action.latest_valuation_ratio?.beta_5y, className: "number-col", format: (val) => val != null ? val.toFixed(2) : 'N/A', sortKey: "latest_valuation_ratio__beta_5y", sortable: true },
      { key: "rs_rating", label: "RS Rating", accessor: (action) => action.latest_valuation_ratio?.rs_rating, className: "number-col", format: (val) => val != null ? val.toFixed(0) : 'N/A', sortKey: "latest_valuation_ratio__rs_rating", sortable: true },
    ]
  },
];

// Helper pour créer la famille Custom à partir des ColumnDefinition
import { ColumnDefinition } from './ColumnRegistry';

export const createCustomFamily = (customColumns: ColumnDefinition[]): FamilyConfig => {
  return {
    id: "custom",
    label: "Custom",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
    columns: customColumns.map((col) => ({
      key: col.id,
      label: col.name,
      accessor: col.accessor,
      className: "number-col",
      format: col.format,
      sortKey: col.backendField,
      sortable: true,
    })),
  };
};
