import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setModalOpen, setSearchMode } from "../../../store/technicalAnalysisSlice";
import { copySidebarText, getSidebarClipboardLabel, type SidebarClipboardStatus } from "../actions/sidebarClipboard";
import type { SidebarClipboardKey, TechnicalAnalysisSidebarProps } from "../TechnicalAnalysisSidebar.types";
import type { WatchlistSettings } from "../panels/WatchlistPanel";
import { useSidebarChartRuntimeReady, useSidebarSecondaryWorkReady } from "./useSidebarSecondaryWorkReady";
import { useSidebarDataFeeds } from "./useSidebarDataFeeds";
import { useSidebarDerivedMetrics } from "./useSidebarDerivedMetrics";
import { useSidebarMarketClock } from "./useSidebarMarketClock";

export function useTechnicalAnalysisSidebarController(props: TechnicalAnalysisSidebarProps) {
  const {
    chartData,
    dataMode,
    lastUpdate,
    liveMarketCap,
    livePeRatio,
    livePrice,
    liveReturnYTD,
    marketSourceLabel,
    marketSourceStatus,
    security,
  } = props;
  const dispatch = useDispatch();
  const isSecondaryWorkReady = useSidebarSecondaryWorkReady();
  const isChartRuntimeReady = useSidebarChartRuntimeReady(isSecondaryWorkReady);
  const marketClock = useSidebarMarketClock(lastUpdate);
  const feeds = useSidebarDataFeeds({ dataMode, isSecondaryWorkReady, securityTicker: security.ticker });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDividendModalOpen, setIsDividendModalOpen] = useState(false);
  const [incomeViewMode, setIncomeViewMode] = useState<"annual" | "quarterly">("annual");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [clipboardStatus, setClipboardStatus] = useState<Record<SidebarClipboardKey, SidebarClipboardStatus>>({
    figi: "idle",
    isin: "idle",
  });
  const [watchlistSettings, setWatchlistSettings] = useState<WatchlistSettings>({
    showChange: true,
    showChangePercent: true,
    showLast: true,
    showLogo: true,
    showName: true,
    showSymbol: false,
    showVolume: true,
  });
  const analystRatingChartRef = useRef<HTMLDivElement | null>(null);
  const incomeChartRef = useRef<HTMLDivElement | null>(null);
  const seasonalChartRef = useRef<HTMLDivElement | null>(null);
  const technicalsChartRef = useRef<HTMLDivElement | null>(null);
  const volatilityChartRef = useRef<HTMLDivElement | null>(null);
  const volatilityCurveChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [security.ticker]);

  const displayReturnYTD = liveReturnYTD !== undefined ? liveReturnYTD : security.returnYTD;
  const displayPeRatio = livePeRatio !== undefined ? livePeRatio : security.peRatio;
  const displayMarketCap = liveMarketCap !== undefined ? liveMarketCap : security.marketCap;
  const derived = useSidebarDerivedMetrics({
    chartData,
    dataMode,
    displayMarketCap,
    displayPeRatio,
    displayReturnYTD,
    isSecondaryWorkReady,
    lastUpdate,
    livePrice,
    marketSourceLabel,
    marketSourceStatus,
    normalizedSecurityTicker: feeds.normalizedSecurityTicker,
    security,
    validFundamentals: feeds.validFundamentals,
  });
  const isFundamentalsPanelLoading = Boolean(props.isLoading || feeds.isFundamentalsLoading);

  const handleIdentifierCopy = async (key: SidebarClipboardKey, value: string | null | undefined) => {
    const result = await copySidebarText(value);
    setClipboardStatus((current) => ({ ...current, [key]: result.status }));
    window.setTimeout(() => {
      setClipboardStatus((current) => ({ ...current, [key]: "idle" }));
    }, 2_200);
  };

  return {
    chartConfig: {
      analystData: derived.analystData,
      analystRatingChartRef,
      benefitsChartRef: props.benefitsChartRef,
      canRenderIncomeStatement: derived.canRenderIncomeStatement && (dataMode !== "real" || incomeViewMode === "annual"),
      chartData,
      dataMode,
      dividendsChartRef: props.dividendsChartRef,
      financialMetrics: derived.financialMetrics,
      hasVerifiedDividends: derived.hasVerifiedDividends,
      hasVerifiedEarnings: derived.hasVerifiedEarnings,
      incomeChartRef,
      incomeViewMode,
      isChartRuntimeReady,
      isFundamentalsLoading: feeds.isFundamentalsLoading,
      isFundamentalsPanelLoading,
      isLoading: Boolean(props.isLoading),
      normalizedSecurityTicker: feeds.normalizedSecurityTicker,
      seasonalChartRef,
      seasonalYears: derived.seasonalYears,
      technicalData: derived.technicalData,
      technicalsChartRef,
      validFundamentals: feeds.validFundamentals,
      volatilityChartRef,
      volatilityCurveChartRef,
    },
    clipboardStatus,
    displayMarketCap,
    displayPeRatio,
    displayReturnYTD,
    feeds,
    getClipboardLabel: getSidebarClipboardLabel,
    incomeViewMode,
    isDescriptionExpanded,
    isDividendModalOpen,
    isFundamentalsPanelLoading,
    isSettingsOpen,
    marketClock,
    metrics: derived,
    props,
    refs: {
      analystRatingChartRef,
      incomeChartRef,
      seasonalChartRef,
      technicalsChartRef,
      volatilityChartRef,
      volatilityCurveChartRef,
    },
    actions: {
      copyIdentifier: handleIdentifierCopy,
      openSearch: () => {
        dispatch(setSearchMode("replace"));
        dispatch(setModalOpen({ modal: "search", isOpen: true }));
      },
      setIncomeViewMode,
      setIsDividendModalOpen,
      setIsNewsHovered: feeds.setIsNewsHovered,
      setWatchlistSetting: (key: keyof WatchlistSettings, value: boolean) => setWatchlistSettings((current) => ({ ...current, [key]: value })),
      toggleDescription: () => setIsDescriptionExpanded((current) => !current),
      toggleIndices: () => feeds.setIsIndicesOpen((current) => !current),
      toggleSettings: () => setIsSettingsOpen((current) => !current),
    },
    watchlistSettings,
  };
}

export type TechnicalAnalysisSidebarController = ReturnType<typeof useTechnicalAnalysisSidebarController>;
