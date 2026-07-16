import React from "react";
import clsx from "clsx";
import {
  Bell,
  BellDot,
  BookOpen,
  Calendar,
  Layers,
  List,
  MessagesSquare,
  Radio,
  Target,
  TrendingUp,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  type LucideProps,
} from "lucide-react";
import type { SidebarRailEntryId } from "../SidebarRail";

export type ProductsMenuEntryId = Exclude<SidebarRailEntryId, "products" | "help" | "object-tree">;

interface ProductsMenuItem {
  id: ProductsMenuEntryId;
  label: string;
  tradingViewLabel: string;
  icon: React.ComponentType<LucideProps>;
}

const PRODUCTS_SECTION: ProductsMenuItem[] = [
  { id: "screeners", label: "Screeners", tradingViewLabel: "Screeners", icon: Target },
  { id: "strategies", label: "Pine Editor", tradingViewLabel: "Pine Editor", icon: TrendingUp },
  { id: "calendar", label: "Calendars", tradingViewLabel: "Calendars", icon: Calendar },
  { id: "watchlist", label: "News Flow", tradingViewLabel: "News Flow", icon: List },
  { id: "fundamentals", label: "Fundamental Graphs", tradingViewLabel: "Fundamental Graphs", icon: BarChart3 },
  { id: "bonds", label: "Yield Curves", tradingViewLabel: "Yield Curves", icon: LineChart },
  { id: "seasonality", label: "Seasonality", tradingViewLabel: "Seasonality", icon: Activity },
  { id: "volatility", label: "Volatility", tradingViewLabel: "Volatility", icon: PieChart },
  { id: "income", label: "Income Statement", tradingViewLabel: "Income Statement", icon: BarChart3 },
  { id: "model", label: "Model Heuristic", tradingViewLabel: "Model Heuristic", icon: Activity },
  { id: "performance", label: "Performance", tradingViewLabel: "Performance", icon: TrendingUp },
];

const SOCIAL_SECTION: ProductsMenuItem[] = [
  { id: "ideas", label: "Community", tradingViewLabel: "Community", icon: Radio },
  { id: "notifications", label: "Notifications", tradingViewLabel: "Notifications", icon: BellDot },
];

const ALL_ITEMS: ProductsMenuItem[] = [...PRODUCTS_SECTION, ...SOCIAL_SECTION];

const DEFAULT_PINNED: ProductsMenuEntryId[] = [
  "screeners",
  "strategies",
  "calendar",
  "ideas",
  "notifications",
];

interface ProductsMenuPopoverProps {
  isOpen: boolean;
  pinnedItems: ProductsMenuEntryId[];
  onSelect: (entryId: SidebarRailEntryId) => void;
  onTogglePin: (entryId: ProductsMenuEntryId) => void;
  onClose: () => void;
  positionStyle?: React.CSSProperties;
}

const renderStarIcon = (isPinned: boolean) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill={isPinned ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const renderMenuItem = (
  item: ProductsMenuItem,
  isPinned: boolean,
  onSelect: (entryId: SidebarRailEntryId) => void,
  onTogglePin: (entryId: ProductsMenuEntryId) => void,
  onClose: () => void,
) => {
  const Icon = item.icon;

  const handleSelect = () => {
    onSelect(item.id);
    onClose();
  };

  const handleTogglePin = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onTogglePin(item.id);
  };

  const handleStarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTogglePin(e);
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      key={item.id}
      className="gp-products-menu-item"
      data-sidebar-entry={item.id}
      data-pinned={isPinned}
      onClick={handleSelect}
      onKeyDown={handleItemKeyDown}
      role="button"
      tabIndex={0}
    >
      <span className="gp-products-menu-item-icon">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <span className="gp-products-menu-item-label">
        {item.label}
      </span>
      <span
        className="gp-products-menu-star"
        data-pinned={isPinned}
        onClick={handleTogglePin}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTogglePin(e); } }}
        title={isPinned ? "Desepingler du rail" : "Epingler au rail"}
        aria-label={isPinned ? "Desepingler " + item.label : "Epingler " + item.label}
        role="button"
        tabIndex={0}
      >
        {renderStarIcon(isPinned)}
      </span>
    </div>
  );
};

export const ProductsMenuPopover = React.memo(({
  isOpen,
  pinnedItems,
  onSelect,
  onTogglePin,
  onClose,
  positionStyle,
}: ProductsMenuPopoverProps) => {
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('[data-sidebar-entry="products"]')) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="gp-products-menu-popover"
      ref={popoverRef}
      role="menu"
      aria-label="Products menu"
      style={positionStyle}
    >
      <div className="gp-products-menu-section">
        <span className="gp-products-menu-section-title">Products</span>
        {PRODUCTS_SECTION.map((item) =>
          renderMenuItem(item, pinnedItems.includes(item.id), onSelect, onTogglePin, onClose),
        )}
      </div>

      <div className="gp-products-menu-divider" />

      <div className="gp-products-menu-section">
        <span className="gp-products-menu-section-title">Social</span>
        {SOCIAL_SECTION.map((item) =>
          renderMenuItem(item, pinnedItems.includes(item.id), onSelect, onTogglePin, onClose),
        )}
      </div>

      <div className="gp-products-menu-footer">
        <span>
          {pinnedItems.length} item{pinnedItems.length !== 1 ? "s" : ""} epinglé{pinnedItems.length !== 1 ? "s" : ""} au rail
        </span>
      </div>
    </div>
  );
});

ProductsMenuPopover.displayName = "ProductsMenuPopover";

export { DEFAULT_PINNED };
