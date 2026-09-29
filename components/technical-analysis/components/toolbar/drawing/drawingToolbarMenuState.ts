import { useCallback, useState, type MouseEvent, type RefObject } from "react";

import { useFloatingMenu } from "../../../hooks/useFloatingMenu";
import type {
  AnnotationDropdownView,
  ChartPatternsDropdownView,
  FibDropdownView,
  ForecastingDropdownView,
  TrendDropdownView,
} from "./drawingToolFilters";

export const useDrawingToolbarMenuState = (
  mainContainerRef: RefObject<HTMLElement | null>,
  onBeforeMenuOpen?: () => void,
) => {
  const trendMenu = useFloatingMenu(mainContainerRef);
  const fibMenu = useFloatingMenu(mainContainerRef);
  const chartPatternsMenu = useFloatingMenu(mainContainerRef);
  const forecastingMenu = useFloatingMenu(mainContainerRef);
  const annotationsMenu = useFloatingMenu(mainContainerRef);
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
  const {
    isOpen: isAnnotationsMenuOpen,
    setIsOpen: setAnnotationsMenuOpen,
    toggle: toggleAnnotationsMenu,
  } = annotationsMenu;

  const [trendSearchQuery, setTrendSearchQuery] = useState("");
  const [trendDropdownView, setTrendDropdownView] = useState<TrendDropdownView>("categories");
  const [fibSearchQuery, setFibSearchQuery] = useState("");
  const [fibDropdownView, setFibDropdownView] = useState<FibDropdownView>("categories");
  const [chartPatternsSearchQuery, setChartPatternsSearchQuery] = useState("");
  const [chartPatternsDropdownView, setChartPatternsDropdownView] = useState<ChartPatternsDropdownView>("categories");
  const [forecastingSearchQuery, setForecastingSearchQuery] = useState("");
  const [forecastingDropdownView, setForecastingDropdownView] = useState<ForecastingDropdownView>("categories");
  const [annotationsSearchQuery, setAnnotationsSearchQuery] = useState("");
  const [annotationsDropdownView, setAnnotationsDropdownView] = useState<AnnotationDropdownView>("categories");

  const closeAllDropdowns = useCallback(() => {
    setTrendMenuOpen(false);
    setFibMenuOpen(false);
    setChartPatternsMenuOpen(false);
    setForecastingMenuOpen(false);
    setAnnotationsMenuOpen(false);
  }, [setTrendMenuOpen, setFibMenuOpen, setChartPatternsMenuOpen, setForecastingMenuOpen, setAnnotationsMenuOpen]);

  const toggleTrendDropdown = useCallback((event: MouseEvent) => {
    if (!isTrendMenuOpen) {
      onBeforeMenuOpen?.();
      closeAllDropdowns();
      setTrendDropdownView("categories");
    }
    toggleTrendMenu(event);
  }, [closeAllDropdowns, isTrendMenuOpen, onBeforeMenuOpen, toggleTrendMenu]);

  const toggleFibDropdown = useCallback((event: MouseEvent) => {
    if (!isFibMenuOpen) {
      onBeforeMenuOpen?.();
      closeAllDropdowns();
      setFibDropdownView("categories");
    }
    toggleFibMenu(event);
  }, [closeAllDropdowns, isFibMenuOpen, onBeforeMenuOpen, toggleFibMenu]);

  const toggleChartPatternsDropdown = useCallback((event: MouseEvent) => {
    if (!isChartPatternsMenuOpen) {
      onBeforeMenuOpen?.();
      closeAllDropdowns();
      setChartPatternsDropdownView("categories");
    }
    toggleChartPatternsMenu(event);
  }, [closeAllDropdowns, isChartPatternsMenuOpen, onBeforeMenuOpen, toggleChartPatternsMenu]);

  const toggleForecastingDropdown = useCallback((event: MouseEvent) => {
    if (!isForecastingMenuOpen) {
      onBeforeMenuOpen?.();
      closeAllDropdowns();
      setForecastingDropdownView("categories");
    }
    toggleForecastingMenu(event);
  }, [closeAllDropdowns, isForecastingMenuOpen, onBeforeMenuOpen, toggleForecastingMenu]);

  const toggleAnnotationsDropdown = useCallback((event: MouseEvent) => {
    if (!isAnnotationsMenuOpen) {
      onBeforeMenuOpen?.();
      closeAllDropdowns();
      setAnnotationsDropdownView("categories");
    }
    toggleAnnotationsMenu(event);
  }, [closeAllDropdowns, isAnnotationsMenuOpen, onBeforeMenuOpen, toggleAnnotationsMenu]);

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
    annotations: {
      ...annotationsMenu,
      searchQuery: annotationsSearchQuery,
      setSearchQuery: setAnnotationsSearchQuery,
      view: annotationsDropdownView,
      setView: setAnnotationsDropdownView,
      toggle: toggleAnnotationsDropdown,
    },
    closeAllDropdowns,
  };
};
