import logoMapping from "@/public/logos-brvm/mapping.json";

const BRVM_LOGO_BASE_PATH = "/logos-brvm";

type BrvmLogoMapping = Record<string, string>;

const rawLogoMapping = logoMapping as BrvmLogoMapping;
const hasOwn = Object.prototype.hasOwnProperty;

const normalizeLogoKey = (ticker: string): string => ticker.trim().toLowerCase();

const normalizeIssuerName = (value: string): string => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const buildLogoPaths = (mapping: BrvmLogoMapping): Readonly<Record<string, string>> => {
  const entries = Object.keys(mapping).map((ticker) => {
    const key = normalizeLogoKey(ticker);
    return [key.toUpperCase(), `${BRVM_LOGO_BASE_PATH}/${key}.webp`] as const;
  });

  return Object.freeze(Object.fromEntries(entries));
};

export const BRVM_LOGO_MAPPING: Readonly<BrvmLogoMapping> = Object.freeze({ ...rawLogoMapping });

export const BRVM_LOGO_TICKERS: readonly string[] = Object.freeze(
  Object.keys(BRVM_LOGO_MAPPING).filter((ticker) => ticker.toLowerCase() !== "etit").map((ticker) => ticker.toUpperCase()).sort(),
);

const BRVM_LOGO_PATHS: Readonly<Record<string, string>> = Object.freeze({
  ...buildLogoPaths(BRVM_LOGO_MAPPING),
  ETIT: `${BRVM_LOGO_BASE_PATH}/ecoc.webp`,
});

const BRVM_API_TICKER_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  BOA_BJ: "BOAB",
  BOA_BF: "BOABF",
  BOA_CI: "BOAC",
  BOA_ML: "BOAM",
  BOA_NE: "BOAN",
  BOA_SN: "BOAS",
  BICI_CI: "BICC",
  BIIC_BJ: "BICB",
  SAFCA_CI: "SAFC",
  SGB_CI: "SGBC",
  SMB_CI: "SMBC",
  TOTAL_CI: "TTLC",
  TOTAL_SN: "TTLS",
  AGL_CI: "SDSC",
  CROWN_CI: "SEMC",
  FILTISAC_CI: "FTSC",
  SOLIBRA_CI: "SLBC",
  SETAO_CI: "STAC",
  SICABLE_CI: "CABC",
  CFAO_CI: "CFAC",
  CIE_CI: "CIEC",
  SODE_CI: "SDCC",
  UNIWAX_CI: "UNXC",
});

const BRVM_LOGO_ISSUER_NAMES = Object.freeze(
  Object.keys(BRVM_LOGO_MAPPING).map((ticker) => ({
    key: ticker.trim().toUpperCase(),
    normalized: normalizeIssuerName(BRVM_LOGO_MAPPING[ticker]),
  })),
);

const BRVM_LOGO_ISSUER_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  [normalizeIssuerName("ECOBANK TRANSNATIONAL INCORPORATED")]: "ECOC",
  [normalizeIssuerName("SOCIETE IVOIRIENNE DES TABACS")]: "STBC",
});

export const normalizeBrvmLogoTicker = (ticker: string): string => ticker.trim().toUpperCase();

const resolveBrvmLogoTicker = (ticker: string): string => {
  const normalizedTicker = normalizeBrvmLogoTicker(ticker);
  return BRVM_API_TICKER_ALIASES[normalizedTicker] ?? normalizedTicker;
};

export const hasBrvmLogo = (ticker: string): boolean => {
  const resolvedTicker = resolveBrvmLogoTicker(ticker);
  return hasOwn.call(BRVM_LOGO_PATHS, resolvedTicker);
};

export const getBrvmLogoUrl = (ticker: string): string | undefined => {
  const resolvedTicker = resolveBrvmLogoTicker(ticker);
  return BRVM_LOGO_PATHS[resolvedTicker];
};

export const getBrvmLogoIssuerName = (ticker: string): string | undefined => {
  const mappingKey = normalizeLogoKey(resolveBrvmLogoTicker(ticker));
  return BRVM_LOGO_MAPPING[mappingKey];
};

export const getBrvmLogoUrlByIssuerName = (issuerName: string): string | undefined => {
  const normalizedQuery = normalizeIssuerName(issuerName);
  if (normalizedQuery.length < 4) return undefined;

  const aliasKey = BRVM_LOGO_ISSUER_ALIASES[normalizedQuery];
  if (aliasKey) return getBrvmLogoUrl(aliasKey);

  const exactMatch = BRVM_LOGO_ISSUER_NAMES.find(({ normalized }) => normalized === normalizedQuery);
  const containmentMatch = normalizedQuery.length >= 8
    ? BRVM_LOGO_ISSUER_NAMES.find(({ normalized }) => (
      normalized.includes(normalizedQuery) || normalizedQuery.includes(normalized)
    ))
    : undefined;
  const match = exactMatch ?? containmentMatch;

  return match ? getBrvmLogoUrl(match.key) : undefined;
};
