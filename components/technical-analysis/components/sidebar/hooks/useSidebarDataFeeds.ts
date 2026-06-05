import { useEffect, useMemo, useRef, useState } from "react";
import { createEmptyFundamentals, isFundamentalsForTicker, normalizeTicker, type BRVMFundamentals, type FundamentalsStatus } from "../data/sidebarFundamentals";
import { fetchSidebarBonds, fetchSidebarFundamentals, fetchSidebarIndices, fetchSidebarNews, type BRVMBond, type BRVMIndexData, type BRVMNewsItem } from "../data/sidebarFetchers";

interface UseSidebarDataFeedsInput {
  dataMode: "mock" | "real";
  isSecondaryWorkReady: boolean;
  securityTicker: string;
}

export function useSidebarDataFeeds({
  dataMode,
  isSecondaryWorkReady,
  securityTicker,
}: UseSidebarDataFeedsInput) {
  const normalizedSecurityTicker = useMemo(() => normalizeTicker(securityTicker), [securityTicker]);
  const [news, setNews] = useState<BRVMNewsItem[]>([]);
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);
  const [isNewsHovered, setIsNewsHovered] = useState(false);
  const [fundamentals, setFundamentals] = useState<BRVMFundamentals | null>(null);
  const [fundamentalsStatus, setFundamentalsStatus] = useState<FundamentalsStatus>("idle");
  const [isIndicesOpen, setIsIndicesOpen] = useState(false);
  const [indicesData, setIndicesData] = useState<Record<string, BRVMIndexData> | null>(null);
  const [indicesError, setIndicesError] = useState<string | null>(null);
  const [isIndicesLoading, setIsIndicesLoading] = useState(false);
  const [topBonds, setTopBonds] = useState<BRVMBond[]>([]);
  const [bondsLoading, setBondsLoading] = useState(true);
  const fundamentalsCacheRef = useRef<Map<string, BRVMFundamentals>>(new Map());
  const fundamentalsRequestIdRef = useRef(0);

  useEffect(() => {
    if (!isIndicesOpen) return;

    const controller = new AbortController();
    setIsIndicesLoading(true);
    setIndicesError(null);

    void fetchSidebarIndices(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setIndicesData(data);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setIndicesData(null);
        setIndicesError(error instanceof Error ? error.message : "Erreur reseau");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsIndicesLoading(false);
      });

    return () => controller.abort();
  }, [isIndicesOpen]);

  useEffect(() => {
    if (!isSecondaryWorkReady) return;

    const controllers = new Set<AbortController>();
    const fetchNews = async () => {
      const controller = new AbortController();
      controllers.add(controller);

      try {
        const items = await fetchSidebarNews(controller.signal);
        if (!controller.signal.aborted) setNews(items);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setNews([]);
      } finally {
        controllers.delete(controller);
      }
    };

    void fetchNews();
    const interval = window.setInterval(fetchNews, 30 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, [isSecondaryWorkReady]);

  const safeNews = useMemo(
    () => news.filter((item) => item.title && item.date && item.link),
    [news],
  );

  useEffect(() => {
    if (currentNewsIdx === 0 && safeNews.length === 0) return;
    if (currentNewsIdx < safeNews.length) return;
    setCurrentNewsIdx(0);
  }, [currentNewsIdx, safeNews.length]);

  useEffect(() => {
    if (safeNews.length <= 1 || isNewsHovered) return;
    const interval = window.setInterval(() => {
      setCurrentNewsIdx((previous) => (previous + 1) % safeNews.length);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [safeNews.length, isNewsHovered]);

  useEffect(() => {
    setFundamentals(null);
    setFundamentalsStatus("idle");

    if (dataMode !== "real" || normalizedSecurityTicker.length === 0 || !isSecondaryWorkReady) {
      fundamentalsRequestIdRef.current += 1;
      return;
    }

    const cachedFundamentals = fundamentalsCacheRef.current.get(normalizedSecurityTicker);
    if (cachedFundamentals) {
      setFundamentals(cachedFundamentals);
      setFundamentalsStatus("ready");
      return;
    }

    const requestId = fundamentalsRequestIdRef.current + 1;
    fundamentalsRequestIdRef.current = requestId;
    const controller = new AbortController();

    setFundamentalsStatus("loading");

    void fetchSidebarFundamentals(normalizedSecurityTicker, controller.signal)
      .then((normalized) => {
        if (controller.signal.aborted || fundamentalsRequestIdRef.current !== requestId) return;
        fundamentalsCacheRef.current.set(normalizedSecurityTicker, normalized);
        setFundamentals(normalized);
        setFundamentalsStatus("ready");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (controller.signal.aborted || fundamentalsRequestIdRef.current !== requestId) return;
        setFundamentals(createEmptyFundamentals(normalizedSecurityTicker));
        setFundamentalsStatus("error");
      });

    return () => controller.abort();
  }, [dataMode, isSecondaryWorkReady, normalizedSecurityTicker]);

  useEffect(() => {
    if (!isSecondaryWorkReady) return;

    const controller = new AbortController();
    setBondsLoading(true);

    void fetchSidebarBonds(controller.signal)
      .then((bonds) => {
        if (!controller.signal.aborted) setTopBonds(bonds.slice(0, 3));
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setTopBonds([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBondsLoading(false);
      });

    return () => controller.abort();
  }, [isSecondaryWorkReady]);

  const validFundamentals = isFundamentalsForTicker(fundamentals, normalizedSecurityTicker) ? fundamentals : null;
  const isFundamentalsPending = isSecondaryWorkReady && dataMode === "real" && normalizedSecurityTicker.length > 0 && !validFundamentals;

  return {
    activeNews: safeNews[currentNewsIdx] ?? null,
    bondsLoading,
    currentNewsIdx,
    fundamentalsStatus,
    indicesData,
    indicesError,
    isFundamentalsLoading: isFundamentalsPending || fundamentalsStatus === "loading",
    isIndicesLoading,
    isIndicesOpen,
    normalizedSecurityTicker,
    setIsIndicesOpen,
    setIsNewsHovered,
    topBonds,
    validFundamentals,
  };
}
