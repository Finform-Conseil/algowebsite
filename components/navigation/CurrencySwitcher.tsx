'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';

export default function CurrencySwitcher() {
    const { displayCurrency, currencyInfo, ratesTimestamp, ratesFetched, switchCurrency, supportedCurrencies } = useCurrency();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const ratesAge = ratesTimestamp
        ? Math.round((Date.now() - new Date(ratesTimestamp).getTime()) / 60_000)
        : null;

    const ratesLabel =
        ratesFetched && ratesAge != null
            ? ratesAge < 60
                ? `Taux mis à jour il y a ${ratesAge} min`
                : `Taux mis à jour il y a ${Math.round(ratesAge / 60)} h`
            : 'Taux indicatifs (statiques)';

    return (
        <div className="currency-switcher" ref={ref}>
            <button
                className="currency-trigger"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="currency-flag">{currencyInfo?.flag ?? '💱'}</span>
                <span className="currency-code">{displayCurrency}</span>
                <svg
                    className={`currency-caret ${open ? 'open' : ''}`}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                >
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div className="currency-dropdown" role="listbox">
                    <div className="currency-dropdown__header">
                        <span>Devise d&apos;affichage</span>
                        <span className="currency-rates-label">{ratesLabel}</span>
                    </div>
                    <ul className="currency-list">
                        {supportedCurrencies.map((c) => (
                            <li key={c.code}>
                                <button
                                    role="option"
                                    aria-selected={c.code === displayCurrency}
                                    className={`currency-option ${c.code === displayCurrency ? 'active' : ''}`}
                                    onClick={() => {
                                        switchCurrency(c.code);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="currency-option__flag">{c.flag}</span>
                                    <span className="currency-option__code">{c.code}</span>
                                    <span className="currency-option__name">{c.name}</span>
                                    <span className="currency-option__symbol">{c.symbol}</span>
                                    {c.code === displayCurrency && (
                                        <svg className="currency-option__check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="currency-dropdown__footer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        Les conversions sont indicatives et calculées côté client.
                    </div>
                </div>
            )}
        </div>
    );
}
