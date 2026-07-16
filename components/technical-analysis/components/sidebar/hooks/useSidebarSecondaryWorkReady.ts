import { useEffect, useState } from "react";

const SIDEBAR_SECONDARY_IDLE_DELAY_MS = 4_000;
const SIDEBAR_SECONDARY_IDLE_TIMEOUT_MS = 12_000;

export function useSidebarSecondaryWorkReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return;

    let isDisposed = false;
    let idleId: number | null = null;
    const unlock = () => {
      if (!isDisposed) setIsReady(true);
    };

    const startIdleUnlock = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(unlock, { timeout: SIDEBAR_SECONDARY_IDLE_TIMEOUT_MS });
        return;
      }

      unlock();
    };

    const delayTimer = window.setTimeout(startIdleUnlock, SIDEBAR_SECONDARY_IDLE_DELAY_MS);

    return () => {
      isDisposed = true;
      window.clearTimeout(delayTimer);
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [isReady]);

  return isReady;
}

export function useSidebarChartRuntimeReady(isSecondaryWorkReady: boolean): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (!isSecondaryWorkReady) return;

    if (!idleWindow.requestIdleCallback) {
      const timeoutId = window.setTimeout(() => setIsReady(true), 2_000);
      return () => window.clearTimeout(timeoutId);
    }

    const idleHandle = idleWindow.requestIdleCallback(() => setIsReady(true), { timeout: 4_000 });
    return () => idleWindow.cancelIdleCallback?.(idleHandle);
  }, [isSecondaryWorkReady]);

  return isReady;
}
