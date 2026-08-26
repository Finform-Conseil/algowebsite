import { useEffect, useMemo, useRef, useState } from "react";
import { createEmptyFundamentals, isFundamentalsForTicker, normalizeTicker, type BRVMFundamentals, type FundamentalsStatus } from "../data/sidebarFundamentals";
import { fetchSidebarBonds, fetchSidebarFundamentals, fetchSidebarIndices, fetchSidebarNews, type BRVMBond, type BRVMIndexData, type BRVMNewsItem } from "../data/sidebarFetchers";
import { readSidebarSnapshot, writeSidebarSnapshot } from "../data/sidebarPersistence";
import { useSidebarDataPort } from "../data/sidebarDataPortAdapter";

type NewsStatus = "idle" | "loading" | "ready" | "error";
type IndicesStatus = "idle" | "loading" | "ready" | "error";
const SIDEBAR_MARKET = "BRVM";

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
  const port = useSidebarDataPort();
  const normalizedSecurityTicker = useMemo(() => normalizeTicker(securityTicker), [securityTicker]);
  const [news, setNews] = useState<BRVMNewsItem[]>([]);
  const [newsStatus, setNewsStatus] = useState<NewsStatus>("idle");
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);
  const [isNewsHovered, setIsNewsHovered] = useState(false);
  const [fundamentals, setFundamentals] = useState<BRVMFundamentals | null>(null);
  const [fundamentalsStatus, setFundamentalsStatus] = useState<FundamentalsStatus>("idle");
  const [isIndicesOpen, setIsIndicesOpen] = useState(false);
  const [indicesData, setIndicesData] = useState<Record<string, BRVMIndexData> | null>(null);
  const [indicesError, setIndicesError] = useState<string | null>(null);
  const [isIndicesLoading, setIsIndicesLoading] = useState(false);
  const [indicesStatus, setIndicesStatus] = useState<IndicesStatus>("idle");
  const [topBonds, setTopBonds] = useState<BRVMBond[]>([]);
  const [bondsLoading, setBondsLoading] = useState(true);
  const bondsCacheRef = useRef<BRVMBond[]>([]);
  const latestIndicesRef = useRef<Record<string, BRVMIndexData> | null>(null);
  const latestNewsRef = useRef<BRVMNewsItem[]>([]);
  const fundamentalsCacheRef = useRef<Map<string, BRVMFundamentals>>(new Map());
  const fundamentalsRequestIdRef = useRef(0);
  const hasBondsDataRef = useRef(false);

  useEffect(() => {
    if (!isIndicesOpen) return;

    const controller = new AbortController();
    void readSidebarSnapshot("indices", SIDEBAR_MARKET, "GLOBAL").then((cached) => {
      if (!controller.signal.aborted && cached && Object.keys(cached).length > 0) {
        latestIndicesRef.current = cached;
        setIndicesData(cached);
        setIndicesStatus("ready");
      }
    });
    setIsIndicesLoading(!latestIndicesRef.current);
    setIndicesStatus("loading");
    setIndicesError(null);

    void fetchSidebarIndices(port, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          latestIndicesRef.current = data;
          setIndicesData(data);
          setIndicesStatus("ready");
          void writeSidebarSnapshot("indices", SIDEBAR_MARKET, "GLOBAL", data);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (controller.signal.aborted) return;
        if (latestIndicesRef.current) {
          setIndicesData(latestIndicesRef.current);
          setIndicesError(null);
        } else {
          setIndicesData(null);
          setIndicesError(error instanceof Error ? error.message : "Erreur reseau");
        }
        setIndicesStatus("error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsIndicesLoading(false);
      });

    return () => controller.abort();
  }, [dataMode, isIndicesOpen, port]);

  useEffect(() => {
    if (!isSecondaryWorkReady) {
      setNewsStatus("idle");
      return;
    }

    const controllers = new Set<AbortController>();
    const fetchNews = async () => {
      const controller = new AbortController();
      controllers.add(controller);
      const isInitialFetch = latestNewsRef.current.length === 0;
      if (isInitialFetch) setNewsStatus("loading");

      try {
        const items = await fetchSidebarNews(port, controller.signal);
        if (!controller.signal.aborted) {
          latestNewsRef.current = items;
          setNews(items);
          setNewsStatus("ready");
          void writeSidebarSnapshot("news", SIDEBAR_MARKET, "GLOBAL", items);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (latestNewsRef.current.length === 0) setNews([]);
        setNewsStatus("error");
      } finally {
        controllers.delete(controller);
      }
    };

    void readSidebarSnapshot("news", SIDEBAR_MARKET, "GLOBAL").then((cached) => {
      if (Array.isArray(cached) && cached.length > 0) {
        latestNewsRef.current = cached;
        setNews(cached);
        setNewsStatus("ready");
      }
    });
    void fetchNews();
    const interval = window.setInterval(fetchNews, 30 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, [dataMode, isSecondaryWorkReady, port]);

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

    void readSidebarSnapshot("fundamentals", SIDEBAR_MARKET, normalizedSecurityTicker).then((cached) => {
      if (fundamentalsRequestIdRef.current === requestId && isFundamentalsForTicker(cached, normalizedSecurityTicker)) {
        fundamentalsCacheRef.current.set(normalizedSecurityTicker, cached);
        setFundamentals(cached);
        setFundamentalsStatus("ready");
      }
    });

    void fetchSidebarFundamentals(port, normalizedSecurityTicker, controller.signal)
      .then((normalized) => {
        if (controller.signal.aborted || fundamentalsRequestIdRef.current !== requestId) return;
        fundamentalsCacheRef.current.set(normalizedSecurityTicker, normalized);
        setFundamentals(normalized);
        setFundamentalsStatus("ready");
        void writeSidebarSnapshot("fundamentals", SIDEBAR_MARKET, normalizedSecurityTicker, normalized);
      })
      .catch(() => {
        if (controller.signal.aborted || fundamentalsRequestIdRef.current !== requestId) return;
        if (fundamentalsCacheRef.current.has(normalizedSecurityTicker)) {
          setFundamentalsStatus("ready");
          return;
        }
        setFundamentals(createEmptyFundamentals(normalizedSecurityTicker));
        setFundamentalsStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [dataMode, isSecondaryWorkReady, normalizedSecurityTicker, port]);

  useEffect(() => {
    if (!isSecondaryWorkReady || dataMode !== "real") return;

    const controllers = new Set<AbortController>();
    const fetchBonds = async () => {
      const controller = new AbortController();
      controllers.add(controller);
      if (!hasBondsDataRef.current) setBondsLoading(true);

      try {
        const bonds = await fetchSidebarBonds(port, controller.signal);
        if (!controller.signal.aborted) {
          setTopBonds(bonds.slice(0, 5));
          bondsCacheRef.current = bonds.slice(0, 5);
          hasBondsDataRef.current = bonds.length > 0;
          void writeSidebarSnapshot("bonds", SIDEBAR_MARKET, "GLOBAL", bonds.slice(0, 5));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (bondsCacheRef.current.length === 0) setTopBonds([]);
      } finally {
        if (!controller.signal.aborted) setBondsLoading(false);
        controllers.delete(controller);
      }
    };

    void readSidebarSnapshot("bonds", SIDEBAR_MARKET, "GLOBAL").then((cached) => {
      if (Array.isArray(cached) && cached.length > 0) {
        hasBondsDataRef.current = true;
        bondsCacheRef.current = cached;
        setTopBonds(cached);
        setBondsLoading(false);
      }
    });
    void fetchBonds();
    const interval = window.setInterval(fetchBonds, 30 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, [isSecondaryWorkReady, dataMode, port]);

  const validFundamentals = isFundamentalsForTicker(fundamentals, normalizedSecurityTicker) ? fundamentals : null;
  const isFundamentalsPending = (
    isSecondaryWorkReady
    && dataMode === "real"
    && normalizedSecurityTicker.length > 0
    && !validFundamentals
    && (fundamentalsStatus === "idle" || fundamentalsStatus === "loading")
  );
  const hasIndicesData = indicesData ? Object.keys(indicesData).length > 0 : false;
  const isIndicesPanelLoading = isIndicesOpen && (
    (isIndicesLoading && !hasIndicesData)
    || (!indicesError && !hasIndicesData && (indicesStatus === "idle" || indicesStatus === "loading"))
  );

  return {
    activeNews: safeNews[currentNewsIdx] ?? null,
    bondsLoading,
    currentNewsIdx,
    fundamentalsStatus,
    indicesData,
    indicesError,
    isFundamentalsLoading: isFundamentalsPending,
    isIndicesLoading: isIndicesPanelLoading,
    isIndicesOpen,
    isNewsLoading: isSecondaryWorkReady && safeNews.length === 0 && (newsStatus === "idle" || newsStatus === "loading"),
    newsStatus,
    normalizedSecurityTicker,
    setIsIndicesOpen,
    setIsNewsHovered,
    topBonds,
    validFundamentals,
  };
}
