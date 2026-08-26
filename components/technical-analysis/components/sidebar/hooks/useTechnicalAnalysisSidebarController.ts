import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { useDispatch, useSelector } from "react-redux";
import { setChartAppearance, setModalOpen, setPrefilledAlert, setSearchMode } from "../../../store/technicalAnalysisSlice";
import { selectChartAppearance, selectUiState } from "../../../store/selectors";
import { copySidebarText, getSidebarClipboardLabel, type SidebarClipboardStatus } from "../actions/sidebarClipboard";
import type { SidebarClipboardKey, TechnicalAnalysisSidebarProps } from "../TechnicalAnalysisSidebar.types";
import type { AlertsRailDraftRequest } from "../panels/AlertsRailPanel";
import type { WatchlistSettings } from "../panels/WatchlistPanel";
import type { SidebarRailEntryId } from "../SidebarRail";
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
    apiPriceMetric,
    apiTechnicalIndicator,
    apiValuationRatio,
    marketSourceLabel,
    marketSourceStatus,
    security,
    isObjectTreeOpen,
    onToggleObjectTree,
  } = props;
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const chartAppearance = useSelector(selectChartAppearance);
  const isSecondaryWorkReady = useSidebarSecondaryWorkReady(!props.isLoading);
  const isChartRuntimeReady = useSidebarChartRuntimeReady(isSecondaryWorkReady);
  const { convert, displayCurrency } = useCurrency();
  const marketClock = useSidebarMarketClock(lastUpdate, security.exchange);
  const feeds = useSidebarDataFeeds({ dataMode, isSecondaryWorkReady, securityTicker: security.ticker });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDividendModalOpen, setIsDividendModalOpen] = useState(false);
  const [activeSidebarEntry, setActiveSidebarEntry] = useState<SidebarRailEntryId>("watchlist");
  const [incomeViewMode, setIncomeViewMode] = useState<"annual" | "quarterly">("annual");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [alertDraftRequest, setAlertDraftRequest] = useState<AlertsRailDraftRequest | null>(null);
  const [clipboardStatus, setClipboardStatus] = useState<Record<SidebarClipboardKey, SidebarClipboardStatus>>({
    figi: "idle",
    isin: "idle",
  });
  const alertDraftRequestIdRef = useRef(0);
  const hasHandledAlertModalRef = useRef(false);
  const watchlistSettings: WatchlistSettings = chartAppearance.statusLine;
  const analystRatingChartRef = useRef<HTMLDivElement | null>(null);
  const incomeChartRef = useRef<HTMLDivElement | null>(null);
  const seasonalChartRef = useRef<HTMLDivElement | null>(null);
  const technicalsChartRef = useRef<HTMLDivElement | null>(null);
  const volatilityChartRef = useRef<HTMLDivElement | null>(null);
  const volatilityCurveChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [security.ticker]);

  useEffect(() => {
    if (isObjectTreeOpen) {
      setActiveSidebarEntry("object-tree");
      return;
    }
    setActiveSidebarEntry((current) => current === "object-tree" ? "watchlist" : current);
  }, [isObjectTreeOpen]);

  useEffect(() => {
    if (!uiState.modals.alerts) {
      hasHandledAlertModalRef.current = false;
      return;
    }
    if (hasHandledAlertModalRef.current) return;
    hasHandledAlertModalRef.current = true;
    alertDraftRequestIdRef.current += 1;
    setAlertDraftRequest({
      condition: uiState.prefilledAlertCondition,
      id: alertDraftRequestIdRef.current,
      price: uiState.prefilledAlertPrice,
    });
    setActiveSidebarEntry("alerts");
    if (isObjectTreeOpen) onToggleObjectTree?.();
    dispatch(setModalOpen({ modal: "alerts", isOpen: false }));
    dispatch(setPrefilledAlert(null));
  }, [
    dispatch,
    isObjectTreeOpen,
    onToggleObjectTree,
    uiState.modals.alerts,
    uiState.prefilledAlertCondition,
    uiState.prefilledAlertPrice,
  ]);

  const displayReturnYTD = dataMode === "real"
    ? apiPriceMetric?.total_return_ytd_pct ?? apiPriceMetric?.change_ytd_pct ?? null
    : apiPriceMetric?.total_return_ytd_pct ?? apiPriceMetric?.change_ytd_pct ?? liveReturnYTD ?? security.returnYTD;
  const displayPeRatio = dataMode === "real"
    ? apiValuationRatio?.pe_ttm ?? null
    : apiValuationRatio?.pe_ttm ?? livePeRatio ?? security.peRatio;
  const sourceCurrency = props.baseCurrency || security.currency || displayCurrency;
  const nativeMarketCap = dataMode === "real"
    ? apiValuationRatio?.market_cap ?? null
    : apiValuationRatio?.market_cap ?? liveMarketCap ?? security.marketCap;
  const displayMarketCap = convert(nativeMarketCap, sourceCurrency);
  const displayFundamentals = useMemo(() => {
    const fundamentals = feeds.validFundamentals;
    if (!fundamentals || sourceCurrency === displayCurrency) return fundamentals;
    const convertSeries = (rows: typeof fundamentals.earnings) => rows.map((row) => ({
      ...row,
      value: convert(row.value, sourceCurrency) ?? row.value,
    }));
    return {
      ...fundamentals,
      earnings: convertSeries(fundamentals.earnings),
      revenues: convertSeries(fundamentals.revenues),
      dividends: convertSeries(fundamentals.dividends),
    };
  }, [convert, displayCurrency, feeds.validFundamentals, sourceCurrency]);
  const derived = useSidebarDerivedMetrics({
    apiPriceMetric,
    apiTechnicalIndicator,
    apiValuationRatio,
    chartData,
    dataMode,
    displayCurrency,
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
    validFundamentals: displayFundamentals,
  });
  const hasSettledFundamentalsFeed = feeds.fundamentalsStatus === "ready" || feeds.fundamentalsStatus === "error";
  const isFundamentalsPanelLoading = Boolean(feeds.isFundamentalsLoading || (props.isLoading && !hasSettledFundamentalsFeed));

  const handleIdentifierCopy = async (key: SidebarClipboardKey, value: string | null | undefined) => {
    const result = await copySidebarText(value);
    setClipboardStatus((current) => ({ ...current, [key]: result.status }));
    window.setTimeout(() => {
      setClipboardStatus((current) => ({ ...current, [key]: "idle" }));
    }, 2_200);
  };

  return {
    activeSidebarEntry,
    alertDraftRequest,
    chartConfig: {
      sidebarChartMountKey: isObjectTreeOpen ? "object-tree" : activeSidebarEntry,
      analystData: derived.analystData,
      analystRatingChartRef,
      benefitsChartRef: props.benefitsChartRef,
      canRenderIncomeStatement: derived.canRenderIncomeStatement && (dataMode !== "real" || incomeViewMode === "annual"),
      chartData,
      dataMode,
      displayCurrency,
      dividendsChartRef: props.dividendsChartRef,
      financialMetrics: derived.financialMetrics,
      hasVerifiedDividends: derived.hasVerifiedDividends,
      hasVerifiedEarnings: derived.hasVerifiedEarnings,
      incomeChartRef,
      incomeViewMode,
      isChartRuntimeReady,
      isFundamentalsLoading: feeds.isFundamentalsLoading,
      isFundamentalsPanelLoading,
      isSecondaryWorkReady,
      isLoading: Boolean(props.isLoading),
      normalizedSecurityTicker: feeds.normalizedSecurityTicker,
      seasonalChartRef,
      seasonalYears: derived.seasonalYears,
      apiTechnicalIndicator,
      technicalData: derived.technicalData,
      technicalsChartRef,
      validFundamentals: displayFundamentals,
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
    isSecondaryWorkReady,
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
      setActiveSidebarEntry,
      setIncomeViewMode,
      setIsDividendModalOpen,
      setIsNewsHovered: feeds.setIsNewsHovered,
      setWatchlistSetting: (key: keyof WatchlistSettings, value: boolean) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, [key]: value } })),
      toggleDescription: () => setIsDescriptionExpanded((current) => !current),
      toggleIndices: () => feeds.setIsIndicesOpen((current) => !current),
      toggleSettings: () => setIsSettingsOpen((current) => !current),
    },
    watchlistSettings,
  };
}

export type TechnicalAnalysisSidebarController = ReturnType<typeof useTechnicalAnalysisSidebarController>;
