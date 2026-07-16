/**
 * Tooltip / aria-label for the per-drawing Lock toolbar button.
 * TradingView shows "Unlock" when the drawing is already locked, "Lock" otherwise.
 */
export function getLockTooltip(isLocked: boolean | undefined): string {
  return isLocked ? "Déverrouiller" : "Verrouiller";
}
