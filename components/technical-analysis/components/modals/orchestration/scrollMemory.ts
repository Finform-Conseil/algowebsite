const INDICATORS_MODAL_SCROLL_STORAGE_KEY = "technical-analysis:indicators-modal-scroll-top";

export const normalizeScrollTop = (scrollTop: number) => (
  Number.isFinite(scrollTop) ? Math.max(0, Math.round(scrollTop)) : 0
);

export const readStoredIndicatorsModalScrollTop = () => {
  if (typeof window === "undefined") return 0;

  try {
    return normalizeScrollTop(Number(window.sessionStorage.getItem(INDICATORS_MODAL_SCROLL_STORAGE_KEY)));
  } catch {
    return 0;
  }
};

export const storeIndicatorsModalScrollTop = (scrollTop: number) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(INDICATORS_MODAL_SCROLL_STORAGE_KEY, String(normalizeScrollTop(scrollTop)));
  } catch {
    // Storage can be unavailable in restricted browser contexts; in-memory refs still preserve the current session.
  }
};
