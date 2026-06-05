import { useCallback, useState, type MouseEvent, type RefObject } from "react";

import { useFloatingMenu } from "../../../hooks/useFloatingMenu";
import type {
  ChartPatternsDropdownView,
  FibDropdownView,
  ForecastingDropdownView,
  TrendDropdownView,
} from "./drawingToolFilters";

export const useDrawingToolbarMenuState = (
  mainContainerRef: RefObject<HTMLElement | null>,
) => {
  const trendMenu = useFloatingMenu(mainContainerRef);
  const fibMenu = useFloatingMenu(mainContainerRef);
  const chartPatternsMenu = useFloatingMenu(mainContainerRef);
  const forecastingMenu = useFloatingMenu(mainContainerRef);
  const { isOpen: isTrendMenuOpen, setIsOpen: setTrendMenuOpen, toggle: toggleTrendMenu } = trendMenu;
  const { isOpen: isFibMenuOpen, setIsOpen: setFibMenuOpen, toggle: toggleFibMenu } = fibMenu;
  const {
    isOpen: isChartPatternsMenuOpen,
    setIsOpen: setChartPatternsMenuOpen,
    toggle: toggleChartPatternsMenu,
  } = chartPatternsMenu;
  const {
    isOpen: isForecastingMenuOpen,
    setIsOpen: setForecastingMenuOpen,
    toggle: toggleForecastingMenu,
  } = forecastingMenu;

  const [trendSearchQuery, setTrendSearchQuery] = useState("");
  const [trendDropdownView, setTrendDropdownView] = useState<TrendDropdownView>("categories");
  const [fibSearchQuery, setFibSearchQuery] = useState("");
  const [fibDropdownView, setFibDropdownView] = useState<FibDropdownView>("categories");
  const [chartPatternsSearchQuery, setChartPatternsSearchQuery] = useState("");
  const [chartPatternsDropdownView, setChartPatternsDropdownView] = useState<ChartPatternsDropdownView>("categories");
  const [forecastingSearchQuery, setForecastingSearchQuery] = useState("");
  const [forecastingDropdownView, setForecastingDropdownView] = useState<ForecastingDropdownView>("categories");

  const closeAllDropdowns = useCallback(() => {
    setTrendMenuOpen(false);
    setFibMenuOpen(false);
    setChartPatternsMenuOpen(false);
    setForecastingMenuOpen(false);
  }, [setTrendMenuOpen, setFibMenuOpen, setChartPatternsMenuOpen, setForecastingMenuOpen]);

  const toggleTrendDropdown = useCallback((event: MouseEvent) => {
    if (!isTrendMenuOpen) {
      setTrendDropdownView("categories");
      setFibMenuOpen(false);
      setChartPatternsMenuOpen(false);
      setForecastingMenuOpen(false);
    }
    toggleTrendMenu(event);
  }, [
    isTrendMenuOpen,
    setFibMenuOpen,
    setChartPatternsMenuOpen,
    setForecastingMenuOpen,
    toggleTrendMenu,
  ]);

  const toggleFibDropdown = useCallback((event: MouseEvent) => {
    if (!isFibMenuOpen) {
      setFibDropdownView("categories");
      setTrendMenuOpen(false);
      setChartPatternsMenuOpen(false);
      setForecastingMenuOpen(false);
    }
    toggleFibMenu(event);
  }, [
    isFibMenuOpen,
    setTrendMenuOpen,
    setChartPatternsMenuOpen,
    setForecastingMenuOpen,
    toggleFibMenu,
  ]);

  const toggleChartPatternsDropdown = useCallback((event: MouseEvent) => {
    if (!isChartPatternsMenuOpen) {
      setChartPatternsDropdownView("categories");
      setTrendMenuOpen(false);
      setFibMenuOpen(false);
      setForecastingMenuOpen(false);
    }
    toggleChartPatternsMenu(event);
  }, [
    isChartPatternsMenuOpen,
    setTrendMenuOpen,
    setFibMenuOpen,
    setForecastingMenuOpen,
    toggleChartPatternsMenu,
  ]);

  const toggleForecastingDropdown = useCallback((event: MouseEvent) => {
    if (!isForecastingMenuOpen) {
      setForecastingDropdownView("categories");
      setTrendMenuOpen(false);
      setFibMenuOpen(false);
      setChartPatternsMenuOpen(false);
    }
    toggleForecastingMenu(event);
  }, [
    isForecastingMenuOpen,
    setTrendMenuOpen,
    setFibMenuOpen,
    setChartPatternsMenuOpen,
    toggleForecastingMenu,
  ]);

  return {
    trend: {
      ...trendMenu,
      searchQuery: trendSearchQuery,
      setSearchQuery: setTrendSearchQuery,
      view: trendDropdownView,
      setView: setTrendDropdownView,
      toggle: toggleTrendDropdown,
    },
    fib: {
      ...fibMenu,
      searchQuery: fibSearchQuery,
      setSearchQuery: setFibSearchQuery,
      view: fibDropdownView,
      setView: setFibDropdownView,
      toggle: toggleFibDropdown,
    },
    chartPatterns: {
      ...chartPatternsMenu,
      searchQuery: chartPatternsSearchQuery,
      setSearchQuery: setChartPatternsSearchQuery,
      view: chartPatternsDropdownView,
      setView: setChartPatternsDropdownView,
      toggle: toggleChartPatternsDropdown,
    },
    forecasting: {
      ...forecastingMenu,
      searchQuery: forecastingSearchQuery,
      setSearchQuery: setForecastingSearchQuery,
      view: forecastingDropdownView,
      setView: setForecastingDropdownView,
      toggle: toggleForecastingDropdown,
    },
    closeAllDropdowns,
  };
};
