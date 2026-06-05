import { useEffect, useMemo, useState } from "react";
import {
  formatBrvmDisplayMinute,
  getBrvmMarketStatus,
} from "../../../utils/brvmMarketSession";

export function useSidebarMarketClock(lastUpdate: string | undefined) {
  const [marketClockNow, setMarketClockNow] = useState<number | null>(null);

  useEffect(() => {
    const syncMarketClock = () => setMarketClockNow(Date.now());
    syncMarketClock();

    const delayToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      syncMarketClock();
      intervalId = window.setInterval(syncMarketClock, 60_000);
    }, delayToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const sidebarMarketStatus = useMemo(
    () => getBrvmMarketStatus(marketClockNow ?? 0),
    [marketClockNow],
  );

  const sidebarLastUpdateLabel = useMemo(() => {
    if (lastUpdate) return formatBrvmDisplayMinute(new Date(lastUpdate));
    if (marketClockNow === null) return "--:--";
    return formatBrvmDisplayMinute(new Date(marketClockNow));
  }, [lastUpdate, marketClockNow]);

  return { marketClockNow, sidebarLastUpdateLabel, sidebarMarketStatus };
}
