import type { CurrencyCode } from '../types/domain.types.ts';

export const FX: Readonly<Record<string, number>> = Object.freeze({
  XOF: 1,
  NGN: 1.35,
  GHS: 78,
  USD: 615,
  EUR: 655.957,
});

const fxRate = (currency: CurrencyCode): number => {
  const rate = FX[currency];

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Taux FX indisponible pour la devise "${currency}".`);
  }

  return rate;
};

export const fmt = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value);

export const fmtCompactMontant = (value: number | string): string =>
  new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export const fmtPrice = (value: number | string): string => {
  const numericValue = Number(value);

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const toRef = (
  amount: number,
  currency: CurrencyCode
): number => Math.round(amount * fxRate(currency));

export const convertCurrency = (
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number => (amount * fxRate(from)) / fxRate(to);
