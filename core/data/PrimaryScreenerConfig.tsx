import React from "react";
import { PrimaryEntity } from "@/core/domain/entities/primary.entity";

export type PrimaryMetricFamily =
  | "overview"
  | "bond-info"
  | "coupon"
  | "emission-stats"
  | "upcoming-emissions";

export type PrimaryColumnConfig = {
  key: string;
  label: string;
  accessor: (primary: PrimaryEntity) => any;
  className?: string;
  format?: (value: any, primary?: PrimaryEntity) => string;
  sortKey?: string;
  sortable?: boolean;
};

export type PrimaryFamilyConfig = {
  id: PrimaryMetricFamily;
  label: string;
  icon: JSX.Element;
  columns: PrimaryColumnConfig[];
};

export const parseNumeric = (value: string | number | null | undefined): number | null => {
  if (value == null || value === "" || value === "null") return null;
  const parsed = typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatPercent = (value: string | number | null | undefined, decimals = 2): string => {
  const parsed = parseNumeric(value);
  if (parsed == null) return "N/A";
  return `${(parsed * 100).toFixed(decimals)}%`;
};

export const formatDecimal = (value: string | number | null | undefined, decimals = 2): string => {
  const parsed = parseNumeric(value);
  if (parsed == null) return "N/A";
  return parsed.toFixed(decimals);
};

export const formatAmount = (
  value: string | number | null | undefined,
  { unit = "M", decimals = 0 }: { unit?: "M" | "B" | "K"; decimals?: number } = {}
): string => {
  const parsed = parseNumeric(value);
  if (parsed == null) return "N/A";
  const divisor = unit === "B" ? 1e9 : unit === "M" ? 1e6 : 1e3;
  return `${(parsed / divisor).toFixed(decimals)}${unit}`;
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const getIssuerName = (primary: PrimaryEntity): string => {
  if (!primary.issuer) return "N/A";
  if (typeof primary.issuer === "string") return primary.issuer;
  return primary.issuer.name || "N/A";
};

export const aggregateIssueLots = (primary: PrimaryEntity) => {
  const lots = primary.issue_lots || [];
  const totalAllocated = lots.reduce(
    (sum, lot) => sum + (parseNumeric(lot.amount_allocated) || 0),
    0
  );
  const totalBids = lots.reduce(
    (sum, lot) => sum + (parseNumeric(lot.amount_bids_received) || 0),
    0
  );
  const avgCoverage = lots.length
    ? lots.reduce((sum, lot) => sum + (parseNumeric(lot.coverage_rate) || 0), 0) / lots.length
    : null;
  const avgAbsorption = lots.length
    ? lots.reduce((sum, lot) => sum + (parseNumeric(lot.absorption_rate) || 0), 0) / lots.length
    : null;
  const avgClearingYield = lots.length
    ? lots.reduce((sum, lot) => sum + (parseNumeric(lot.clearing_yield) || 0), 0) / lots.length
    : null;
  const avgBidToCover = lots.length
    ? lots.reduce((sum, lot) => sum + (parseNumeric(lot.bid_to_cover_ratio) || 0), 0) / lots.length
    : null;
  return {
    count: lots.length,
    totalAllocated,
    totalBids,
    avgCoverage,
    avgAbsorption,
    avgClearingYield,
    avgBidToCover,
  };
};

export const primaryFamiliesConfig: PrimaryFamilyConfig[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    columns: [
      {
        key: "isin",
        label: "ISIN",
        accessor: (p) => p.isin,
        className: "isin-col",
        sortKey: "isin",
        sortable: true,
      },
      {
        key: "issuer",
        label: "Issuer",
        accessor: (p) => getIssuerName(p),
        sortKey: "issuer__name",
        sortable: true,
      },
      {
        key: "type_name",
        label: "Bond Type",
        accessor: (p) => p.type_name || p.type,
        className: "badge-cell",
        sortKey: "type_name",
        sortable: true,
      },
      {
        key: "reference",
        label: "Reference",
        accessor: (p) => p.reference,
        sortKey: "reference",
        sortable: true,
      },
      {
        key: "coupon_rate",
        label: "Coupon (%)",
        accessor: (p) => p.coupon_rate,
        className: "number-col",
        format: (val) => formatPercent(val, 3),
        sortKey: "coupon_rate",
        sortable: true,
      },
      {
        key: "tenor",
        label: "Tenor (Y)",
        accessor: (p) => p.tenor,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "tenor",
        sortable: true,
      },
      {
        key: "maturity",
        label: "Maturity Date",
        accessor: (p) => p.latest_cashflow?.timestamp || p.issue_lots?.[0]?.maturity_date,
        format: (val) => formatDate(val),
        sortKey: "latest_cashflow__timestamp",
        sortable: true,
      },
      {
        key: "outstanding_nominal",
        label: "Outstanding Nominal",
        accessor: (p) => p.latest_cashflow?.outstanding_nominal,
        className: "number-col",
        format: (val) => formatAmount(val, { unit: "M", decimals: 0 }),
        sortKey: "latest_cashflow__outstanding_nominal",
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        accessor: (p) => p.status,
        className: "badge-cell",
        sortKey: "status",
        sortable: true,
      },
    ],
  },
  {
    id: "bond-info",
    label: "Bond Info",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    columns: [
      {
        key: "isin",
        label: "ISIN",
        accessor: (p) => p.isin,
        className: "isin-col",
        sortKey: "isin",
        sortable: true,
      },
      {
        key: "legal_form",
        label: "Legal Form",
        accessor: (p) => p.legal_form,
        sortKey: "legal_form",
        sortable: true,
      },
      {
        key: "coupon_type",
        label: "Coupon Type",
        accessor: (p) => p.coupon_type,
        className: "badge-cell",
        sortKey: "coupon_type",
        sortable: true,
      },
      {
        key: "coupon_frequency",
        label: "Frequency",
        accessor: (p) => p.coupon_frequency,
        format: (val) => (val == null ? "N/A" : `${val}x / year`),
        sortKey: "coupon_frequency",
        sortable: true,
      },
      {
        key: "day_count_convention",
        label: "Day Count",
        accessor: (p) => p.day_count_convention,
        sortKey: "day_count_convention",
        sortable: true,
      },
      {
        key: "amortization_method",
        label: "Amortization",
        accessor: (p) => p.amortization_method,
        className: "badge-cell",
        sortKey: "amortization_method",
        sortable: true,
      },
      {
        key: "minimum_trade_unit",
        label: "Min. Trade Unit",
        accessor: (p) => p.minimum_trade_unit,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "minimum_trade_unit",
        sortable: true,
      },
      {
        key: "is_fungible",
        label: "Fungible",
        accessor: (p) => p.is_fungible,
        format: (val) => (val ? "Yes" : "No"),
        sortKey: "is_fungible",
        sortable: true,
      },
    ],
  },
  {
    id: "coupon",
    label: "Coupon",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    columns: [
      {
        key: "isin",
        label: "ISIN",
        accessor: (p) => p.isin,
        className: "isin-col",
        sortKey: "isin",
        sortable: true,
      },
      {
        key: "coupon_rate",
        label: "Coupon (%)",
        accessor: (p) => p.coupon_rate,
        className: "number-col",
        format: (val) => formatPercent(val, 3),
        sortKey: "coupon_rate",
        sortable: true,
      },
      {
        key: "coupon_frequency",
        label: "Frequency",
        accessor: (p) => p.coupon_frequency,
        format: (val) => (val == null ? "N/A" : `${val}x / year`),
        sortKey: "coupon_frequency",
        sortable: true,
      },
      {
        key: "coupon_dates",
        label: "Coupon Dates",
        accessor: (p) => p.coupon_dates,
        sortKey: "coupon_dates",
        sortable: true,
      },
      {
        key: "payment_day_term",
        label: "Payment Day Term",
        accessor: (p) => p.payment_day_term,
        sortKey: "payment_day_term",
        sortable: true,
      },
      {
        key: "full_first_coupon",
        label: "Full First Coupon",
        accessor: (p) => p.full_first_coupon,
        format: (val) => (val ? "Yes" : "No"),
        sortKey: "full_first_coupon",
        sortable: true,
      },
      {
        key: "is_amortized",
        label: "Amortized",
        accessor: (p) => p.is_amortized,
        format: (val) => (val ? "Yes" : "No"),
        sortKey: "is_amortized",
        sortable: true,
      },
      {
        key: "is_differed",
        label: "Deferred",
        accessor: (p) => p.is_differed,
        format: (val) => (val ? "Yes" : "No"),
        sortKey: "is_differed",
        sortable: true,
      },
      {
        key: "differed_period",
        label: "Deferred Period",
        accessor: (p) => p.differed_period,
        className: "number-col",
        format: (val) => (val == null ? "N/A" : `${val} days`),
        sortKey: "differed_period",
        sortable: true,
      },
    ],
  },
  {
    id: "emission-stats",
    label: "Emission Statistics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    columns: [
      {
        key: "isin",
        label: "ISIN",
        accessor: (p) => p.isin,
        className: "isin-col",
        sortKey: "isin",
        sortable: true,
      },
      {
        key: "auction_count",
        label: "Auctions",
        accessor: (p) => aggregateIssueLots(p).count,
        className: "number-col",
        sortKey: "issue_lots__count",
        sortable: true,
      },
      {
        key: "total_allocated",
        label: "Total Allocated",
        accessor: (p) => aggregateIssueLots(p).totalAllocated,
        className: "number-col",
        format: (val) => formatAmount(val, { unit: "M", decimals: 0 }),
        sortKey: "issue_lots__amount_allocated",
        sortable: true,
      },
      {
        key: "total_bids",
        label: "Total Bids Received",
        accessor: (p) => aggregateIssueLots(p).totalBids,
        className: "number-col",
        format: (val) => formatAmount(val, { unit: "M", decimals: 0 }),
        sortKey: "issue_lots__amount_bids_received",
        sortable: true,
      },
      {
        key: "avg_coverage",
        label: "Avg. Coverage",
        accessor: (p) => aggregateIssueLots(p).avgCoverage,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "issue_lots__coverage_rate",
        sortable: true,
      },
      {
        key: "avg_absorption",
        label: "Avg. Absorption",
        accessor: (p) => aggregateIssueLots(p).avgAbsorption,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "issue_lots__absorption_rate",
        sortable: true,
      },
      {
        key: "avg_clearing_yield",
        label: "Avg. Clearing Yield (%)",
        accessor: (p) => aggregateIssueLots(p).avgClearingYield,
        className: "number-col",
        format: (val) => formatPercent(val, 3),
        sortKey: "issue_lots__clearing_yield",
        sortable: true,
      },
      {
        key: "avg_bid_to_cover",
        label: "Avg. Bid-to-Cover",
        accessor: (p) => aggregateIssueLots(p).avgBidToCover,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "issue_lots__bid_to_cover_ratio",
        sortable: true,
      },
    ],
  },
  {
    id: "upcoming-emissions",
    label: "Cashflow & Risk",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    columns: [
      {
        key: "isin",
        label: "ISIN",
        accessor: (p) => p.isin,
        className: "isin-col",
        sortKey: "isin",
        sortable: true,
      },
      {
        key: "cashflow_date",
        label: "Latest Cashflow Date",
        accessor: (p) => p.latest_cashflow?.timestamp,
        format: (val) => formatDate(val),
        sortKey: "latest_cashflow__timestamp",
        sortable: true,
      },
      {
        key: "outstanding_nominal",
        label: "Outstanding Nominal",
        accessor: (p) => p.latest_cashflow?.outstanding_nominal,
        className: "number-col",
        format: (val) => formatAmount(val, { unit: "M", decimals: 0 }),
        sortKey: "latest_cashflow__outstanding_nominal",
        sortable: true,
      },
      {
        key: "duration_macaulay",
        label: "Duration Macaulay",
        accessor: (p) => p.latest_cashflow?.duration_macaulay,
        className: "number-col",
        format: (val) => formatDecimal(val, 3),
        sortKey: "latest_cashflow__duration_macaulay",
        sortable: true,
      },
      {
        key: "accrued_interest",
        label: "Accrued Interest",
        accessor: (p) => p.latest_cashflow?.accrued_interest,
        className: "number-col",
        format: (val) => formatAmount(val, { unit: "M", decimals: 2 }),
        sortKey: "latest_cashflow__accrued_interest",
        sortable: true,
      },
      {
        key: "dirty_price",
        label: "Dirty Price",
        accessor: (p) => p.latest_cashflow?.dirty_price,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "latest_cashflow__dirty_price",
        sortable: true,
      },
      {
        key: "clean_price",
        label: "Clean Price",
        accessor: (p) => p.latest_cashflow?.clean_price,
        className: "number-col",
        format: (val) => formatDecimal(val, 2),
        sortKey: "latest_cashflow__clean_price",
        sortable: true,
      },
      {
        key: "dv01",
        label: "DV01",
        accessor: (p) => p.latest_cashflow?.dv01,
        className: "number-col",
        format: (val) => formatDecimal(val, 4),
        sortKey: "latest_cashflow__dv01",
        sortable: true,
      },
      {
        key: "convexity",
        label: "Convexity",
        accessor: (p) => p.latest_cashflow?.convexity,
        className: "number-col",
        format: (val) => formatDecimal(val, 4),
        sortKey: "latest_cashflow__convexity",
        sortable: true,
      },
      {
        key: "cashflow_status",
        label: "Cashflow Status",
        accessor: (p) => p.latest_cashflow?.status,
        className: "badge-cell",
        sortKey: "latest_cashflow__status",
        sortable: true,
      },
    ],
  },
];
