import logoMapping from "@/public/logos-brvm/mapping.json";

const BRVM_LOGO_BASE_PATH = "/logos-brvm";

type BrvmLogoMapping = Record<string, string>;

const rawLogoMapping = logoMapping as BrvmLogoMapping;
const hasOwn = Object.prototype.hasOwnProperty;

const normalizeLogoKey = (ticker: string): string => ticker.trim().toLowerCase();

const buildLogoPaths = (mapping: BrvmLogoMapping): Readonly<Record<string, string>> => {
  const entries = Object.keys(mapping).map((ticker) => {
    const key = normalizeLogoKey(ticker);
    return [key.toUpperCase(), `${BRVM_LOGO_BASE_PATH}/${key}.png`] as const;
  });

  return Object.freeze(Object.fromEntries(entries));
};

export const BRVM_LOGO_MAPPING: Readonly<BrvmLogoMapping> = Object.freeze({ ...rawLogoMapping });

export const BRVM_LOGO_TICKERS: readonly string[] = Object.freeze(
  Object.keys(BRVM_LOGO_MAPPING).map((ticker) => ticker.toUpperCase()).sort(),
);

const BRVM_LOGO_PATHS = buildLogoPaths(BRVM_LOGO_MAPPING);

export const normalizeBrvmLogoTicker = (ticker: string): string => ticker.trim().toUpperCase();

export const hasBrvmLogo = (ticker: string): boolean => {
  const normalizedTicker = normalizeBrvmLogoTicker(ticker);
  return hasOwn.call(BRVM_LOGO_PATHS, normalizedTicker);
};

export const getBrvmLogoUrl = (ticker: string): string | undefined => {
  const normalizedTicker = normalizeBrvmLogoTicker(ticker);
  return BRVM_LOGO_PATHS[normalizedTicker];
};

export const getBrvmLogoIssuerName = (ticker: string): string | undefined => {
  const mappingKey = normalizeLogoKey(ticker);
  return BRVM_LOGO_MAPPING[mappingKey];
};
