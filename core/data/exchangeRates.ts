export type SupportedCurrency = {
    code: string;
    symbol: string;
    name: string;
    flag: string;
};

// Devises disponibles dans le sélecteur
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
    { code: 'USD', symbol: '$',    name: 'Dollar américain',   flag: '🇺🇸' },
    { code: 'EUR', symbol: '€',    name: 'Euro',               flag: '🇪🇺' },
    { code: 'GBP', symbol: '£',    name: 'Livre sterling',     flag: '🇬🇧' },
    { code: 'XOF', symbol: 'CFA',  name: 'Franc CFA (BCEAO)', flag: '🌍' },
    { code: 'NGN', symbol: '₦',    name: 'Naira nigérian',     flag: '🇳🇬' },
    { code: 'ZAR', symbol: 'R',    name: 'Rand sud-africain',  flag: '🇿🇦' },
    { code: 'MAD', symbol: 'DH',   name: 'Dirham marocain',   flag: '🇲🇦' },
    { code: 'GHS', symbol: 'GH₵', name: 'Cedi ghanéen',       flag: '🇬🇭' },
    { code: 'EGP', symbol: 'E£',   name: 'Livre égyptienne',  flag: '🇪🇬' },
    { code: 'KES', symbol: 'KSh',  name: 'Shilling kényan',   flag: '🇰🇪' },
];

/**
 * Taux de référence statiques (1 USD = X unités de devise).
 * Utilisés comme fallback si l'API externe est indisponible.
 * Mis à jour manuellement à chaque déploiement — Juin 2025.
 */
export const STATIC_EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    XOF: 615,
    XAF: 615,
    NGN: 1570,
    ZAR: 18.2,
    MAD: 10.1,
    GHS: 16.5,
    EGP: 49.5,
    KES: 130,
    TZS: 2580,
    ZMW: 26.8,
    MWK: 1730,
    ZWL: 360,
};

// API publique gratuite, sans clé — basée USD, mise à jour quotidienne
export const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

// TTL du cache des taux en localStorage (4 heures en ms)
export const RATES_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export const CURRENCY_STORAGE_KEY = 'afrimarket_display_currency';
export const RATES_STORAGE_KEY = 'afrimarket_exchange_rates';
export const RATES_TIMESTAMP_KEY = 'afrimarket_rates_timestamp';
