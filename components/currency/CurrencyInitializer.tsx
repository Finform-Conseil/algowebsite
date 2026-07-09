'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/core/infra/store/hooks';
import { initFromStorage, updateRates } from '@/core/infra/store/slices/currencySlice';
import {
    CURRENCY_STORAGE_KEY,
    RATES_STORAGE_KEY,
    RATES_TIMESTAMP_KEY,
    EXCHANGE_RATE_API_URL,
    RATES_CACHE_TTL_MS,
} from '@/core/data/exchangeRates';

/**
 * Composant client sans rendu visuel.
 * Responsabilités :
 *   1. Lit la devise préférée dans localStorage et l'injecte dans le store Redux
 *   2. Lit les taux mis en cache dans localStorage (si valides)
 *   3. Tente de rafraîchir les taux depuis l'API si le cache est expiré
 */
export default function CurrencyInitializer() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) || 'USD';
        const savedRates = localStorage.getItem(RATES_STORAGE_KEY);
        const savedTimestamp = localStorage.getItem(RATES_TIMESTAMP_KEY);

        let cachedRates: Record<string, number> | undefined;
        let cachedTimestamp: string | undefined;

        if (savedRates && savedTimestamp) {
            const age = Date.now() - new Date(savedTimestamp).getTime();
            if (age < RATES_CACHE_TTL_MS) {
                try {
                    cachedRates = JSON.parse(savedRates);
                    cachedTimestamp = savedTimestamp;
                } catch {
                    // cache corrompu — on ignore
                }
            }
        }

        dispatch(
            initFromStorage({
                currency: savedCurrency,
                rates: cachedRates,
                timestamp: cachedTimestamp,
            })
        );

        if (!cachedRates) {
            fetchAndCacheRates(dispatch);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}

async function fetchAndCacheRates(dispatch: ReturnType<typeof useAppDispatch>) {
    try {
        const res = await fetch(EXCHANGE_RATE_API_URL, { next: { revalidate: 0 } });
        if (!res.ok) return;

        const data = await res.json();
        if (data.result !== 'success' || !data.rates) return;

        const timestamp = new Date().toISOString();
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(data.rates));
        localStorage.setItem(RATES_TIMESTAMP_KEY, timestamp);

        dispatch(updateRates({ rates: data.rates, timestamp }));
    } catch {
        // Silencieux — les taux statiques restent actifs
    }
}
