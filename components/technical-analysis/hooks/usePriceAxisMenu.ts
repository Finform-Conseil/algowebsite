import { useState, useCallback, useEffect } from "react";
import { PriceAxisActionMenuState } from "../components/overlays/PriceAxisOverlay";

const PRICE_AXIS_MENU_TARGET_WIDTH = 336;
const PRICE_AXIS_MENU_MIN_WIDTH = 248;
const PRICE_AXIS_MENU_MIN_MARGIN = 12;

/**
 * Utilitaire pur pour formater le prix sur l'axe.
 * Exporté pour être réutilisé par les composants connectés.
 */
export const formatPriceAxisLabel = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * [TENOR 2026 SRE] usePriceAxisMenu
 * [ADR-006] State Extraction: Encapsulates the Price Axis Action Menu state,
 * positioning logic (ResizeObserver), and click-outside handling.
 */
export const usePriceAxisMenu = (
  fullscreenChartContainerRef: React.RefObject<HTMLDivElement>,
  cursorPriceActionRef: React.RefObject<HTMLButtonElement>
) => {
  const [priceAxisActionMenu, setPriceAxisActionMenu] = useState<PriceAxisActionMenuState>({
    isOpen: false,
    priceValue: 0,
    priceLabel: "",
    top: 0,
    left: 0,
    width: 0,
  });

  const closePriceAxisActionMenu = useCallback(() => {
    setPriceAxisActionMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, []);

  const computePriceAxisMenuPosition = useCallback((buttonRect: DOMRect, containerRect: DOMRect) => {
    const maxAvailableWidth = Math.max(PRICE_AXIS_MENU_MIN_WIDTH, containerRect.width - PRICE_AXIS_MENU_MIN_MARGIN * 2);
    const width = Math.max(PRICE_AXIS_MENU_MIN_WIDTH, Math.min(PRICE_AXIS_MENU_TARGET_WIDTH, maxAvailableWidth));
    
    const preferredLeft = buttonRect.left - containerRect.left - width - 10;
    const clampedLeft = Math.max(PRICE_AXIS_MENU_MIN_MARGIN, Math.min(preferredLeft, containerRect.width - width - PRICE_AXIS_MENU_MIN_MARGIN));
    
    const preferredTop = buttonRect.top - containerRect.top - 10;
    const estimatedHeight = 256;
    const clampedTop = Math.max(PRICE_AXIS_MENU_MIN_MARGIN, Math.min(preferredTop, containerRect.height - estimatedHeight - PRICE_AXIS_MENU_MIN_MARGIN));
    
    return { left: clampedLeft, top: clampedTop, width };
  }, []);

  const handleAxisPriceActionButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const containerRect = fullscreenChartContainerRef.current?.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    
    const priceValue = Number(button.dataset.price ?? "0");
    const priceLabel = button.dataset.priceLabel ?? formatPriceAxisLabel(priceValue);
    
    if (!containerRect || !Number.isFinite(priceValue)) return;
    
    const nextPos = computePriceAxisMenuPosition(buttonRect, containerRect);
    
    setPriceAxisActionMenu((prev) => ({
      isOpen: !(prev.isOpen && prev.priceLabel === priceLabel),
      priceValue,
      priceLabel,
      top: nextPos.top,
      left: nextPos.left,
      width: nextPos.width,
    }));
  }, [computePriceAxisMenuPosition, fullscreenChartContainerRef]);

  // Click Outside Handler
  useEffect(() => {
    if (!priceAxisActionMenu.isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".gp-price-axis-action-menu") || target?.closest(".gp-price-axis-cursor-action")) return;
      closePriceAxisActionMenu();
    };
    
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [closePriceAxisActionMenu, priceAxisActionMenu.isOpen]);

  // Dynamic Positioning (ResizeObserver)
  useEffect(() => {
    if (!priceAxisActionMenu.isOpen) return;
    
    const updateMenuPosition = () => {
      const button = cursorPriceActionRef.current;
      const container = fullscreenChartContainerRef.current;
      if (!button || !container) return;
      
      const nextPos = computePriceAxisMenuPosition(button.getBoundingClientRect(), container.getBoundingClientRect());
      setPriceAxisActionMenu((prev) => (prev.isOpen ? { ...prev, ...nextPos } : prev));
    };
    
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    
    const container = fullscreenChartContainerRef.current;
    const resizeObserver = container ? new ResizeObserver(updateMenuPosition) : null;
    if (container && resizeObserver) resizeObserver.observe(container);
    
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      resizeObserver?.disconnect();
    };
  }, [computePriceAxisMenuPosition, priceAxisActionMenu.isOpen, cursorPriceActionRef, fullscreenChartContainerRef]);

  return { 
    priceAxisActionMenu, 
    closePriceAxisActionMenu, 
    handleAxisPriceActionButtonClick 
  };
};

// --- EOF ---