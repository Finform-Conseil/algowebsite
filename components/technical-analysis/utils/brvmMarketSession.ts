const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const BRVM_PRE_OPEN_UTC_MINUTE = 9 * 60;
const BRVM_OFFICIAL_CLOSE_UTC_MINUTE = 15 * 60;
const BRVM_DISPLAY_TIME_ZONE = "Africa/Porto-Novo";
export const BRVM_DISPLAY_TIME_ZONE_LABEL = "GMT+1";
export const BRVM_OBSERVED_HOLIDAYS_UTC = new Set([
  "2026-01-01",
  "2026-03-16",
  "2026-03-20",
  "2026-04-06",
  "2026-05-01",
  "2026-05-14",
  "2026-05-25",
  "2026-05-27",
  "2026-08-07",
  "2026-08-15",
  "2026-08-26",
  "2026-11-01",
  "2026-11-15",
  "2026-12-25",
]);

type TimeframeUnit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

interface ParsedTimeframe {
  amount: number;
  unit: TimeframeUnit;
}

export interface BrvmCountdownLabel {
  label: string;
  accessibilityLabel: string;
}

export interface BrvmMarketStatus {
  isOpen: boolean;
  label: string;
  title: string;
}

const parseTimeframe = (timeframe?: string | null): ParsedTimeframe | null => {
  const value = timeframe?.trim() || "1D";
  const match = /^(\d+)([smhHDdWwMyY])$/.exec(value);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isInteger(amount) || amount <= 0) return null;

  const suffix = match[2];
  if (suffix === "s") return { amount, unit: "second" };
  if (suffix === "m") return { amount, unit: "minute" };
  if (suffix === "h" || suffix === "H") return { amount, unit: "hour" };
  if (suffix === "D" || suffix === "d") return { amount, unit: "day" };
  if (suffix === "W" || suffix === "w") return { amount, unit: "week" };
  if (suffix === "M") return { amount, unit: "month" };
  if (suffix === "Y" || suffix === "y") return { amount, unit: "year" };

  return null;
};

const formatUtcDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};

export const isBrvmBusinessDay = (date: Date): boolean => {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5 && !BRVM_OBSERVED_HOLIDAYS_UTC.has(formatUtcDateKey(date));
};

const getUtcDayStartMs = (date: Date): number => {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const getUtcSessionMs = (dayStartMs: number, utcMinute: number): number => {
  return dayStartMs + utcMinute * MINUTE_MS;
};

const getCurrentBrvmSession = (nowMs: number): { openMs: number; closeMs: number } | null => {
  const now = new Date(nowMs);
  if (!isBrvmBusinessDay(now)) return null;

  const dayStartMs = getUtcDayStartMs(now);
  const openMs = getUtcSessionMs(dayStartMs, BRVM_PRE_OPEN_UTC_MINUTE);
  const closeMs = getUtcSessionMs(dayStartMs, BRVM_OFFICIAL_CLOSE_UTC_MINUTE);

  if (nowMs < openMs || nowMs >= closeMs) return null;
  return { openMs, closeMs };
};

const getNextBrvmOpenMs = (nowMs: number): number | null => {
  const dayStartMs = getUtcDayStartMs(new Date(nowMs));

  for (let offset = 0; offset < 10; offset += 1) {
    const candidateDayStartMs = dayStartMs + offset * DAY_MS;
    const candidateDate = new Date(candidateDayStartMs);
    if (!isBrvmBusinessDay(candidateDate)) continue;

    const openMs = getUtcSessionMs(candidateDayStartMs, BRVM_PRE_OPEN_UTC_MINUTE);
    if (nowMs < openMs) return openMs;
  }

  return null;
};

const getNextBrvmDailyCloseMs = (nowMs: number): number | null => {
  const dayStartMs = getUtcDayStartMs(new Date(nowMs));

  for (let offset = 0; offset < 10; offset += 1) {
    const candidateDayStartMs = dayStartMs + offset * DAY_MS;
    const candidateDate = new Date(candidateDayStartMs);
    if (!isBrvmBusinessDay(candidateDate)) continue;

    const closeMs = getUtcSessionMs(candidateDayStartMs, BRVM_OFFICIAL_CLOSE_UTC_MINUTE);
    if (nowMs < closeMs) return closeMs;
  }

  return null;
};

const getFixedIntervalBoundaryMs = (nowMs: number, parsed: ParsedTimeframe): number | null => {
  const intervalByUnit: Partial<Record<TimeframeUnit, number>> = {
    second: SECOND_MS,
    minute: MINUTE_MS,
    hour: HOUR_MS,
    day: DAY_MS,
  };
  const unitMs = intervalByUnit[parsed.unit];
  if (!unitMs) return null;

  const intervalMs = parsed.amount * unitMs;
  return Math.floor(nowMs / intervalMs + 1) * intervalMs;
};

const getCalendarBoundaryMs = (nowMs: number, parsed: ParsedTimeframe): number | null => {
  const now = new Date(nowMs);

  if (parsed.unit === "week") {
    const utcDay = (now.getUTCDay() + 6) % 7;
    const weekStartMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - utcDay);
    const intervalMs = parsed.amount * 7 * DAY_MS;
    return Math.floor((nowMs - weekStartMs) / intervalMs + 1) * intervalMs + weekStartMs;
  }

  if (parsed.unit === "month") {
    const monthIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
    const nextMonthIndex = Math.floor(monthIndex / parsed.amount) * parsed.amount + parsed.amount;
    return Date.UTC(Math.floor(nextMonthIndex / 12), nextMonthIndex % 12, 1);
  }

  if (parsed.unit === "year") {
    const nextYear = Math.floor(now.getUTCFullYear() / parsed.amount) * parsed.amount + parsed.amount;
    return Date.UTC(nextYear, 0, 1);
  }

  return getFixedIntervalBoundaryMs(nowMs, parsed);
};

const formatCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / SECOND_MS));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const time = [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");

  return days > 0 ? `${days}D ${time}` : time;
};

const buildCountdownLabel = (
  targetMs: number | null,
  nowMs: number,
  visiblePrefix: string,
  accessibilityLabel: string
): BrvmCountdownLabel | null => {
  if (!targetMs || targetMs <= nowMs) return null;

  return {
    label: `${visiblePrefix} ${formatCountdown(targetMs - nowMs)}`,
    accessibilityLabel,
  };
};

export const getBrvmPriceAxisCountdown = (timeframe: string | undefined, nowMs: number): BrvmCountdownLabel | null => {
  const parsed = parseTimeframe(timeframe);
  if (!parsed) return null;

  if (parsed.unit === "day" && parsed.amount === 1) {
    const session = getCurrentBrvmSession(nowMs);
    if (!session) {
      return buildCountdownLabel(getNextBrvmOpenMs(nowMs), nowMs, "Ouv.", "prochaine ouverture BRVM dans");
    }

    return buildCountdownLabel(session.closeMs, nowMs, "Clôt.", "prochaine clôture daily BRVM dans");
  }

  if (parsed.unit === "second" || parsed.unit === "minute" || parsed.unit === "hour") {
    const session = getCurrentBrvmSession(nowMs);
    if (!session) {
      return buildCountdownLabel(getNextBrvmOpenMs(nowMs), nowMs, "Ouv.", "prochaine ouverture BRVM dans");
    }

    const nextBoundaryMs = getFixedIntervalBoundaryMs(nowMs, parsed);
    const targetMs = nextBoundaryMs ? Math.min(nextBoundaryMs, session.closeMs) : session.closeMs;
    const isSessionClose = targetMs === session.closeMs;
    const visiblePrefix = isSessionClose ? "Clôt." : "T-";
    const context = isSessionClose ? "clôture de session BRVM dans" : "clôture de bougie dans";
    return buildCountdownLabel(targetMs, nowMs, visiblePrefix, context);
  }

  return buildCountdownLabel(getCalendarBoundaryMs(nowMs, parsed), nowMs, "T-", "clôture de période dans");
};

export const getBrvmMarketStatus = (nowMs: number = Date.now()): BrvmMarketStatus => {
  if (getCurrentBrvmSession(nowMs)) {
    return {
      isOpen: true,
      label: "OPEN",
      title: "BRVM ouverte selon les horaires réguliers UTC",
    };
  }

  return {
    isOpen: false,
    label: "FERMÉ",
    title: "BRVM fermée selon les horaires réguliers UTC",
  };
};

export const formatBrvmExchangeClock = (date: Date = new Date()): string => {
  return date.toLocaleTimeString("fr-FR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const formatBrvmDisplayClock = (date: Date = new Date()): string => {
  return date.toLocaleTimeString("fr-FR", {
    timeZone: BRVM_DISPLAY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const formatBrvmDisplayMinute = (date: Date = new Date()): string => {
  return date.toLocaleTimeString("fr-FR", {
    timeZone: BRVM_DISPLAY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
