import { useCallback, useEffect, useRef, type MouseEvent } from "react";

export const INDICATOR_DOUBLE_CLICK_DELAY_MS = 240;

export const useSingleDoubleClick = (
  onSingleClick: () => void,
  onDoubleClick: () => void,
) => {
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const clearPendingClick = useCallback(() => {
    if (timerRef.current === null) return;
    globalThis.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const handleClick = useCallback(() => {
    clearPendingClick();
    timerRef.current = globalThis.setTimeout(() => {
      timerRef.current = null;
      onSingleClick();
    }, INDICATOR_DOUBLE_CLICK_DELAY_MS);
  }, [clearPendingClick, onSingleClick]);

  const handleNativeDoubleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
    clearPendingClick();
    onDoubleClick();
  }, [clearPendingClick, onDoubleClick]);

  useEffect(() => clearPendingClick, [clearPendingClick]);

  return { handleClick, handleNativeDoubleClick };
};
