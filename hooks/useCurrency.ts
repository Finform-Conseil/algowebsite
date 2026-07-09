'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/infra/store/hooks';
import { setDisplayCurrency } from '@/core/infra/store/slices/currencySlice';
import { SUPPORTED_CURRENCIES, CURRENCY_STORAGE_KEY } from '@/core/data/exchangeRates';

export function useCurrency() {
    const dispatch = useAppDispatch();
    const { displayCurrency, rates, ratesTimestamp, ratesFetched } = useAppSelector(
        (state) => state.currency
    );

    const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === displayCurrency);

    /**
     * Convertit un montant depuis sa devise source vers la devise d'affichage.
     * Pivot : USD (1 USD = rates[X]).
     */
    const convert = useCallback(
        (amount: number | null | undefined, fromCurrencyCode: string): number | null => {
            if (amount == null || isNaN(amount)) return null;
            if (fromCurrencyCode === displayCurrency) return amount;

            const fromRate = rates[fromCurrencyCode] ?? 1;
            const toRate = rates[displayCurrency] ?? 1;

            return (amount / fromRate) * toRate;
        },
        [displayCurrency, rates]
    );

    /**
     * Formate un montant converti avec symbole de devise.
     * Ajuste automatiquement le nombre de décimales selon l'ordre de grandeur.
     */
    const format = useCallback(
        (
            amount: number | null | undefined,
            fromCurrencyCode: string,
            decimals?: number
        ): string => {
            const converted = convert(amount, fromCurrencyCode);
            if (converted == null) return '—';

            const symbol = currencyInfo?.symbol ?? displayCurrency;

            let d = decimals;
            if (d == null) {
                const abs = Math.abs(converted);
                d = abs >= 10_000 ? 0 : abs >= 100 ? 0 : abs >= 1 ? 2 : 4;
            }

            const formatted = converted.toLocaleString('fr-FR', {
                minimumFractionDigits: d,
                maximumFractionDigits: d,
            });

            return `${formatted} ${symbol}`;
        },
        [convert, currencyInfo, displayCurrency]
    );

    /**
     * Formate un grand montant avec suffixe K / M / Mds.
     */
    const formatLarge = useCallback(
        (amount: number | null | undefined, fromCurrencyCode: string): string => {
            const converted = convert(amount, fromCurrencyCode);
            if (converted == null) return '—';

            const symbol = currencyInfo?.symbol ?? displayCurrency;
            const abs = Math.abs(converted);

            if (abs >= 1_000_000_000) {
                return `${(converted / 1_000_000_000).toFixed(2)} Mds ${symbol}`;
            } else if (abs >= 1_000_000) {
                return `${(converted / 1_000_000).toFixed(2)} M ${symbol}`;
            } else if (abs >= 1_000) {
                return `${(converted / 1_000).toFixed(1)} K ${symbol}`;
            }

            return `${converted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
        },
        [convert, currencyInfo, displayCurrency]
    );

    /**
     * Change la devise d'affichage et persiste dans localStorage.
     */
    const switchCurrency = useCallback(
        (code: string) => {
            dispatch(setDisplayCurrency(code));
            if (typeof window !== 'undefined') {
                localStorage.setItem(CURRENCY_STORAGE_KEY, code);
            }
        },
        [dispatch]
    );

    return {
        displayCurrency,
        currencyInfo,
        rates,
        ratesTimestamp,
        ratesFetched,
        convert,
        format,
        formatLarge,
        switchCurrency,
        supportedCurrencies: SUPPORTED_CURRENCIES,
    };
}
