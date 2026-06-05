// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/hooks/MarketData/useCurrencyConverter.ts
// RÔLE : Oracle de conversion monétaire (Frankfurter API v2).
// [TENOR 2026 FIX] SCAR-134: Triangulation Routing via EUR. Bypasses API base currency restrictions.
// ================================================================================

import { useState, useEffect, useRef } from 'react';

export type CurrencyConversionStatus = "native" | "loading" | "live" | "unavailable";

// [TENOR 2026] In-memory cache to avoid spamming the API during the same session.
// Persists across component mounts/unmounts.
const rateCache = new Map<string, number>();

export const useCurrencyConverter = (baseCurrency: string, targetCurrency: string) => {
  const isNativeRate = !baseCurrency || !targetCurrency || baseCurrency === targetCurrency;
  const [exchangeRate, setExchangeRate] = useState<number | null>(isNativeRate ? 1 : null);
  const [conversionStatus, setConversionStatus] = useState<CurrencyConversionStatus>(isNativeRate ? "native" : "loading");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cacheKey = `${baseCurrency}_${targetCurrency}`;
  const [prevCacheKey, setPrevCacheKey] = useState<string>(cacheKey);

  // [TENOR 2026] Sync state during render for Identical/Cached cases (Zero latency)
  // This replaces synchronouse setState inside useEffect to avoid cascading renders (ERR-02/WARN-04).
  if (cacheKey !== prevCacheKey) {
    setPrevCacheKey(cacheKey);
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) {
      setExchangeRate(1);
      setConversionStatus("native");
      setIsConverting(false);
    } else if (rateCache.has(cacheKey)) {
      setExchangeRate(rateCache.get(cacheKey)!);
      setConversionStatus("live");
      setIsConverting(false);
    } else {
      setExchangeRate(null);
      setConversionStatus("loading");
      setIsConverting(false);
    }
  }

  useEffect(() => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency) {
      setExchangeRate(1);
      setConversionStatus("native");
      setIsConverting(false);
      return;
    }

    const cachedRate = rateCache.get(cacheKey);
    if (cachedRate !== undefined) {
      setExchangeRate(cachedRate);
      setConversionStatus("live");
      setIsConverting(false);
      return;
    }

    // 3. Fetch from Frankfurter API v2 (Triangulation via EUR)
    const fetchRate = async () => {
      setIsConverting(true);
      setConversionStatus("loading");
      setExchangeRate(null);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // [TENOR 2026] Strict URI Encoding for security
        const safeBase = encodeURIComponent(baseCurrency);
        const safeQuote = encodeURIComponent(targetCurrency);

        // [TENOR 2026 FIX] SCAR-134: Triangulation Routing
        // Free APIs often reject exotic currencies (like XOF) as the 'base' parameter.
        // Using EUR as the base improves coverage by requesting BOTH currencies as
        // quotes, then calculating the cross rate from the live response.
        // Example: XOF -> USD = Rate(EUR->USD) / Rate(EUR->XOF)
        
        let queryQuotes = "";
        if (baseCurrency === 'EUR') {
          queryQuotes = safeQuote;
        } else if (targetCurrency === 'EUR') {
          queryQuotes = safeBase;
        } else {
          queryQuotes = `${safeBase},${safeQuote}`;
        }

        const response = await fetch(
          `https://api.frankfurter.dev/v2/rates?base=EUR&quotes=${queryQuotes}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Frankfurter API error: ${response.status}`);
        }

        const data = await response.json();
        
        let rateBase: number | null = baseCurrency === 'EUR' ? 1 : null;
        let rateQuote: number | null = targetCurrency === 'EUR' ? 1 : null;

        // Parse the array response
        if (Array.isArray(data)) {
          data.forEach((item: { quote: string; rate: number }) => {
            if (item.quote === baseCurrency) rateBase = item.rate;
            if (item.quote === targetCurrency) rateQuote = item.rate;
          });
        }

        // Calculate Cross Rate
        if (rateBase !== null && rateQuote !== null && rateBase > 0) {
          const finalRate = rateQuote / rateBase;
          rateCache.set(cacheKey, finalRate);
          setExchangeRate(finalRate);
          setConversionStatus("live");
        } else {
          throw new Error("Missing currency data in Frankfurter API response");
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (err.name !== 'AbortError') {
          console.warn(`[CurrencyConverter] Rate unavailable for ${baseCurrency}->${targetCurrency}.`, err);
          setExchangeRate(null);
          setConversionStatus("unavailable");
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsConverting(false);
        }
      }
    };

    fetchRate();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [baseCurrency, targetCurrency, cacheKey]);

  return { exchangeRate, isConverting, conversionStatus };
};
