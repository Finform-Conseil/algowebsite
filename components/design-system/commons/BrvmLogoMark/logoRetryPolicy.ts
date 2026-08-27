export const LOGO_LOAD_RETRY_DELAYS_MS = [250, 1000] as const;
export const MAX_LOGO_LOAD_RETRIES = LOGO_LOAD_RETRY_DELAYS_MS.length;

export const getLogoRetryDelayMs = (attempt: number): number => {
  const normalizedAttempt = Number.isSafeInteger(attempt) && attempt >= 0 ? attempt : 0;
  return LOGO_LOAD_RETRY_DELAYS_MS[Math.min(normalizedAttempt, LOGO_LOAD_RETRY_DELAYS_MS.length - 1)];
};

export const getLogoRetryUrl = (url: string, attempt: number): string => {
  if (!Number.isSafeInteger(attempt) || attempt <= 0) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}__asset_retry=${attempt}`;
};
