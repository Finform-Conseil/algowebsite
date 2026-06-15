import React from "react";
import clsx from "clsx";
import {
  Activity,
  BarChart3,
  Bell,
  BellDot,
  BookOpen,
  Calendar,
  Layers,
  LineChart,
  List,
  MessagesSquare,
  Radio,
  Target,
  TrendingUp,
  type LucideProps,
} from "lucide-react";
import type { ProductsMenuEntryId } from "./panels/ProductsMenuPopover";

export type SidebarRailEntryId =
  | "watchlist"
  | "alerts"
  | "object-tree"
  | "chats"
  | "screeners"
  | "strategies"
  | "calendar"
  | "ideas"
  | "notifications"
  | "products"
  | "help"
  | "fundamentals"
  | "bonds"
  | "seasonality"
  | "volatility"
  | "income"
  | "model"
  | "performance";

const PineRailIcon = ({ size = 20, strokeWidth = 1.7, ...props }: LucideProps) => (
  <svg aria-hidden="true" focusable="false" height={size} viewBox="0 0 28 28" width={size} {...props}>
    <path d="M14 3.5 24 13.5H4L14 3.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={strokeWidth} />
    <path d="M5.5 24H22.5L14 15.5 5.5 24Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={strokeWidth} />
    <path d="M8.5 13.5 12.2 17.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={strokeWidth} />
    <path d="M19.5 13.5 15.8 17.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={strokeWidth} />
  </svg>
);

const BentoGridIcon = ({ size = 20, strokeWidth = 1.7, ...props }: LucideProps) => (
  <svg aria-hidden="true" focusable="false" height={size} viewBox="0 0 24 24" width={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

interface SidebarRailEntry {
  id: SidebarRailEntryId;
  label: string;
  tradingViewLabel: string;
  icon: React.ComponentType<LucideProps>;
  group: "top" | "bottom";
}

const SIDEBAR_RAIL_ENTRIES: SidebarRailEntry[] = [
  { id: "watchlist", label: "Liste BRVM, détails et news", tradingViewLabel: "Watchlist, details, and news", icon: List, group: "top" },
  { id: "alerts", label: "Alertes marché BRVM", tradingViewLabel: "Alerts", icon: Bell, group: "top" },
  { id: "object-tree", label: "Objets et fenêtre de données", tradingViewLabel: "Object tree and data window", icon: Layers, group: "top" },
  { id: "chats", label: "Chats BRVM", tradingViewLabel: "Chats", icon: MessagesSquare, group: "top" },
  { id: "screeners", label: "Screener actions et obligations", tradingViewLabel: "Screeners", icon: Target, group: "bottom" },
  { id: "strategies", label: "Pine", tradingViewLabel: "Pine", icon: PineRailIcon, group: "bottom" },
  { id: "calendar", label: "Calendars", tradingViewLabel: "Calendars", icon: Calendar, group: "bottom" },
  { id: "ideas", label: "Community BRVM", tradingViewLabel: "Community", icon: Radio, group: "bottom" },
  { id: "notifications", label: "Notifications BRVM", tradingViewLabel: "Notifications", icon: BellDot, group: "bottom" },
  { id: "products", label: "Produits de marché", tradingViewLabel: "Products", icon: BentoGridIcon, group: "bottom" },
  { id: "help", label: "Aide BRVM", tradingViewLabel: "Help Center", icon: BookOpen, group: "bottom" },
  { id: "fundamentals", label: "Fondamentaux BRVM", tradingViewLabel: "Fundamental Graphs", icon: TrendingUp, group: "bottom" },
  { id: "bonds", label: "Obligations BRVM", tradingViewLabel: "Yield Curves", icon: LineChart, group: "bottom" },
  { id: "seasonality", label: "Saisonnalité BRVM", tradingViewLabel: "Seasonality", icon: Calendar, group: "bottom" },
  { id: "volatility", label: "Volatilité BRVM", tradingViewLabel: "Volatility", icon: Activity, group: "bottom" },
  { id: "income", label: "Compte de résultat", tradingViewLabel: "Income Statement", icon: BarChart3, group: "bottom" },
  { id: "model", label: "Modèle heuristique", tradingViewLabel: "Model Heuristic", icon: Activity, group: "bottom" },
  { id: "performance", label: "Performance BRVM", tradingViewLabel: "Performance", icon: TrendingUp, group: "bottom" },
];

interface SidebarRailProps {
  activeEntry: SidebarRailEntryId;
  isProductsMenuOpen?: boolean;
  onSelect: (entryId: SidebarRailEntryId) => void;
  onProductsClick?: () => void;
  pinnedItems?: ProductsMenuEntryId[];
}

const renderRailButton = (
  entry: SidebarRailEntry,
  activeEntry: SidebarRailEntryId,
  onSelect: (entryId: SidebarRailEntryId) => void,
) => {
  const Icon = entry.icon;
  const isActive = activeEntry === entry.id;
  const selectEntry = () => onSelect(entry.id);
  const tooltipLabel = entry.label === entry.tradingViewLabel ? entry.label : entry.label + " (" + entry.tradingViewLabel + ")";
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectEntry();
  };
  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    selectEntry();
  };

  return (
    <button
      key={entry.id}
      type="button"
      className={clsx("gp-toolbar-btn", "gp-sidebar-rail-btn", "hover-lift", isActive && "active", isActive && "btn-primary-outline", isActive && "border")}
      title={tooltipLabel}
      aria-label={entry.label}
      aria-pressed={isActive}
      data-sidebar-entry={entry.id}
      data-tradingview-label={entry.tradingViewLabel}
      onClick={selectEntry}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <Icon aria-hidden="true" focusable="false" />
    </button>
  );
};

const PRODUCTS_ENTRY: SidebarRailEntry = SIDEBAR_RAIL_ENTRIES.find((e) => e.id === "products")!;

export const SidebarRail = React.memo(({ activeEntry, isProductsMenuOpen = false, onSelect, onProductsClick, pinnedItems = [] }: SidebarRailProps) => {
  const topEntries = SIDEBAR_RAIL_ENTRIES.filter((entry) => entry.group === "top");
  const bottomEntries = SIDEBAR_RAIL_ENTRIES.filter((entry) => entry.group === "bottom" && entry.id !== "products");
  const pinnedBottomEntries = bottomEntries.filter((entry) => pinnedItems.includes(entry.id as ProductsMenuEntryId));

  const handleProductsClick = () => {
    if (onProductsClick) onProductsClick();
  };

  const handleProductsKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleProductsClick();
  };

  const ProductsIcon = PRODUCTS_ENTRY.icon;

  return (
    <div className={clsx("gp-toolbar-scroll-container", "gp-sidebar-rail", "p-1")} role="toolbar" aria-label="Panneaux BRVM inspirés TradingView">
      {topEntries.map((entry) => renderRailButton(entry, activeEntry, onSelect))}
      <div className="gp-sidebar-rail-spacer" aria-hidden="true" />
      {pinnedBottomEntries.map((entry) => renderRailButton(entry, activeEntry, onSelect))}
      <button
        type="button"
        className={clsx("gp-toolbar-btn", "gp-sidebar-rail-btn", "gp-sidebar-rail-products-btn", "hover-lift")}
        title="Products (Menu des produits)"
        aria-label="Products"
        aria-haspopup="menu"
        aria-expanded={isProductsMenuOpen}
        onClick={handleProductsClick}
        onKeyDown={handleProductsKeyDown}
        data-sidebar-entry="products"
      >
        <ProductsIcon aria-hidden="true" focusable="false" />
      </button>
    </div>
  );
});

SidebarRail.displayName = "SidebarRail";
