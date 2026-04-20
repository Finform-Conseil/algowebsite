"use client";

/**
 * [TENOR 2026] useIntradayData — Hook de collecte et lecture de bougies intraday
 * 
 * ARCHITECTURE :
 * 1. COLLECTE (Client → Serveur toutes les ~1 minute) :
 *    → fetch /api/market-data/brvm-live (prix actuel)
 *    → POST /api/market-data/brvm-collect (persistance dans JSON)
 * 
 * 2. LECTURE (Serveur → Client toutes les ~1 minute) :
 *    → GET /api/market-data/brvm-intraday?ticker=SMBC&timeframe=5m
 *    → Retourne des bougies OHLCV agrégées pour le timeframe demandé
 * 
 * ACTIVATION :
 * - Seulement si mode === "real" (jamais en DEMO/SANDBOX)
 * - Seulement pendant les heures de marché BRVM (09:00-15:30 UTC)
 * - Seulement pour les timeframes intraday : 1m, 5m, 15m, 1H, 4H
 * 
 * RETOUR :
 * - intradayData → tableau de ChartDataPoint pour ECharts
 * - isIntradayTf → true si le timeframe actuel est intraday
 * - isLoading → true pendant le premier fetch
 */

import { useState, useEffect, useRef } from "react";
import { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

// Timeframes qui déclenchent ce hook
const INTRADAY_TIMEFRAMES = new Set(["1m", "5m", "15m", "1H", "4H"]);

// Fréquence de collecte
const COLLECT_INTERVAL_MS = 60 * 1000; // 1 minute
// Fréquence de lecture des bougies agrégées
const FETCH_INTERVAL_MS = 60 * 1000; // 1 minute

// Heures de marché BRVM en UTC
const MARKET_OPEN_UTC_HOUR = 9; // 09:00 UTC
const MARKET_CLOSE_UTC_HOUR = 15; // 15:00 UTC (fermeture stricte)

function isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0=dim, 6=sam
    if (day === 0 || day === 6) return false;
    const hour = now.getUTCHours();
    return hour >= MARKET_OPEN_UTC_HOUR && hour < MARKET_CLOSE_UTC_HOUR;
}

interface UseIntradayDataOptions {
    symbol: string;
    timeframe: string;
    mode: "real" | "mock";
}

export const useIntradayData = ({
    symbol,
    timeframe,
    mode,
}: UseIntradayDataOptions) => {
    const [intradayData, setIntradayData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Est-ce qu'on est sur un timeframe intraday ?
    const isIntradayTf = INTRADAY_TIMEFRAMES.has(timeframe);

    // [TENOR 2026] SYNC STATE DURING RENDER
    // Pattern recommandé pour réinitialiser un état quand les props changent
    // Évite les "cascading renders" des useEffect
    const [prevParams, setPrevParams] = useState({ symbol, mode, isIntradayTf });

    if (symbol !== prevParams.symbol || mode !== prevParams.mode || isIntradayTf !== prevParams.isIntradayTf) {
        setPrevParams({ symbol, mode, isIntradayTf });
        // Si on change de symbole ou de mode, on vide les anciennes données
        // Ou si on quitte le mode intraday/réel
        if (symbol !== prevParams.symbol || !isIntradayTf || mode !== "real") {
            setIntradayData([]);
        }
    }

    // Ref pour le symbol (évite les deps stale dans les intervals)
    const symbolRef = useRef(symbol);
    const timeframeRef = useRef(timeframe);

    useEffect(() => {
        symbolRef.current = symbol;
    }, [symbol]);

    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);

    // ════════════════════════════════════════════════════════════
    // 1. EFFET DE COLLECTE — snapshot toutes les minutes
    // Fetch le prix live → POST au serveur pour persistance JSON
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isIntradayTf || mode !== "real") return;

        const collectSnapshot = async () => {
            if (!isMarketOpen()) return;

            try {
                // [TENOR 2026] SYNC ALL TICKERS
                // On fetch tout le marché d'un coup (plus propre, plus riche)
                const res = await fetch(
                    `/api/market-data/brvm-live?ticker=ALL`,
                    { cache: "no-store" }
                );

                if (!res.ok) return;

                // [TENOR 2026 FIX] SAFE JSON PARSING
                // Empêche le crash "Unexpected token '<'" si Vercel renvoie une erreur 504 HTML
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.warn("[IntradayData] Expected JSON but received HTML/Text. Aborting collect.");
                    return;
                }

                const allTickersData = await res.json();

                if (!Array.isArray(allTickersData) || allTickersData.length === 0) return;

                // [TENOR 2026] Persistance globale (MARKET_YYYY-MM-DD.json)
                const timestamp = Date.now();
                const snapshots = allTickersData.map((d: { symbol: string; price: number; volume: number }) => ({
                    ticker: d.symbol,
                    price: d.price,
                    volume: d.volume,
                    timestamp
                }));

                await fetch("/api/market-data/brvm-collect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ snapshots }),
                }).catch(() => {
                    // Silencieux
                });

            } catch {
                // Silencieux
            }
        };

        // Collecter immédiatement puis toutes les minutes
        collectSnapshot();
        const collectInterval = setInterval(collectSnapshot, COLLECT_INTERVAL_MS);

        return () => clearInterval(collectInterval);
    }, [isIntradayTf, mode, symbol]); // Keep symbol to maintain stable array size

    // ════════════════════════════════════════════════════════════
    // 2. EFFET DE LECTURE — récupère les bougies agrégées
    // GET /api/market-data/brvm-intraday?ticker=X&timeframe=Y
    // ════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isIntradayTf || mode !== "real") {
            return;
        }

        const today = new Date().toISOString().split("T")[0];

        const fetchCandles = async (isInitial = false) => {
            if (isInitial) setIsLoading(true);

            try {
                const res = await fetch(
                    `/api/market-data/brvm-intraday?ticker=${symbolRef.current}&timeframe=${timeframeRef.current}&date=${today}`,
                    { cache: "no-store" }
                );

                if (!res.ok) return;

                // [TENOR 2026 FIX] SAFE JSON PARSING
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.warn("[IntradayData] Expected JSON but received HTML/Text. Aborting fetch.");
                    return;
                }

                const candles: ChartDataPoint[] = await res.json();

                if (candles.length > 0) {
                    setIntradayData(candles);
                }
            } catch {
                // Silencieux
            } finally {
                if (isInitial) setIsLoading(false);
            }
        };

        // Premier fetch immédiat
        fetchCandles(true);

        // Puis toutes les minutes
        const fetchInterval = setInterval(fetchCandles, FETCH_INTERVAL_MS);

        return () => clearInterval(fetchInterval);
    }, [isIntradayTf, mode, symbol, timeframe]);

    return {
        intradayData,
        isIntradayTf,
        isLoading,
    };
};
// --- EOF ---