let indicatorsModalScrollTop = 0;

export const normalizeScrollTop = (scrollTop: number) => (
  Number.isFinite(scrollTop) ? Math.max(0, Math.round(scrollTop)) : 0
);

export const readStoredIndicatorsModalScrollTop = () => indicatorsModalScrollTop;

export const storeIndicatorsModalScrollTop = (scrollTop: number) => {
  indicatorsModalScrollTop = normalizeScrollTop(scrollTop);
};
