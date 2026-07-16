export const PRICE_AXIS_INTERACTIVE_TARGET_SELECTORS = [
  ".gp-price-axis-action-menu",
  ".gp-price-axis-menu-portal",
  ".gp-price-axis-cursor-action",
] as const;

export const isPriceAxisInteractiveTarget = (target: EventTarget | null): boolean => {
  const element = target as Element | null;
  if (!element || typeof element.closest !== "function") return false;
  return PRICE_AXIS_INTERACTIVE_TARGET_SELECTORS.some((selector) => Boolean(element.closest(selector)));
};
