export type PrimaryChartLoadStatus = "idle" | "loading" | "loaded" | "empty" | "failed";

export interface PrimaryChartAsyncPresentationInput {
  hasExplicitSymbol: boolean;
  hasDisplayData: boolean;
  isInitialBootstrapLoading: boolean;
  loadStatus: PrimaryChartLoadStatus;
}

export interface PrimaryChartAsyncPresentation {
  showLoader: boolean;
  showError: boolean;
  showEmpty: boolean;
}

/**
 * Resolves the mutually-exclusive async presentation state of the canonical chart.
 *
 * The global bootstrap loader is intentionally independent from symbol hydration:
 * immediately after a hard reload the market-data bootstrap is already running,
 * while the persisted layout/ticker binding may not yet be restored. Requiring an
 * explicit symbol in that window produces a blank chart instead of feedback.
 */
export const resolvePrimaryChartAsyncPresentation = ({
  hasExplicitSymbol,
  hasDisplayData,
  isInitialBootstrapLoading,
  loadStatus,
}: PrimaryChartAsyncPresentationInput): PrimaryChartAsyncPresentation => {
  const showLoader = !hasDisplayData && (
    isInitialBootstrapLoading
    || (hasExplicitSymbol && (loadStatus === "idle" || loadStatus === "loading"))
  );

  const showError = hasExplicitSymbol
    && !hasDisplayData
    && !showLoader
    && loadStatus === "failed";

  const showEmpty = hasExplicitSymbol
    && !hasDisplayData
    && !showLoader
    && !showError
    && (loadStatus === "empty" || loadStatus === "loaded");

  return { showLoader, showError, showEmpty };
};
