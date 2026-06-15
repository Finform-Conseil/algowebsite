import React from "react";
import clsx from "clsx";
import { CalendarClock, ExternalLink, Search } from "lucide-react";
import type { CorporateEvent } from "@/types/corporate-events";
import type { IPO, UpcomingIPO } from "@/types/ipo";
import type { BRVMBond } from "../data/sidebarFetchers";
import type { BRVMDividendPoint } from "../data/sidebarFundamentals";

type CalendarEventKind = "session" | "dividend" | "bond" | "ipo" | "corporate-action";
type CalendarFilter = "all" | CalendarEventKind;
type CalendarTone = "neutral" | "success" | "warning";

interface CalendarEvent {
  id: string;
  dateLabel: string;
  detail: string;
  kind: CalendarEventKind;
  sortKey: number;
  source: string;
  ticker: string;
  title: string;
  tone: CalendarTone;
}

interface CalendarRailPanelProps {
  auditDate: string;
  bonds: BRVMBond[];
  corporateEvents: CorporateEvent[];
  displayTimeZoneLabel: string;
  dividends: BRVMDividendPoint[];
  ipos: IPO[];
  isBondLoading: boolean;
  isFundamentalsLoading: boolean;
  marketStatusLabel: string;
  onOpenBondsPage: () => void;
  onOpenDividends: () => void;
  sessionUpdateLabel: string;
  ticker: string;
  upcomingIPOs: UpcomingIPO[];
}

const EXCHANGE_LABELS: Record<string, string> = {
  BRVM: "BRVM",
  JSE: "Johannesburg",
  CSE: "Casablanca",
  NGX: "Nigeria",
  GSE: "Ghana",
  NSE: "Nairobi",
  EGX: "Egypt",
  TUNSE: "Tunis",
};

const FILTERS: Array<{ id: CalendarFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "session", label: "Sessions" },
  { id: "dividend", label: "Dividends" },
  { id: "bond", label: "Bonds" },
  { id: "ipo", label: "IPOs" },
  { id: "corporate-action", label: "Actions" },
];

const EVENT_KIND_LABELS: Record<CalendarEventKind, string> = {
  bond: "Bond",
  "corporate-action": "Corporate action",
  dividend: "Dividend",
  ipo: "IPO",
  session: "Session",
};

const formatMoney = (value: number) => (
  Number.isFinite(value) ? value.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " FCFA" : "N/D"
);

const parseSortKey = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const timestamp = Date.parse(value);
  if (Number.isFinite(timestamp)) return timestamp;
  const yearMatch = value.match(/\b(20\d{2})\b/);
  return yearMatch ? Date.UTC(Number(yearMatch[1]), 11, 31) : fallback;
};

const toDisplayDate = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Date(timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const buildDividendEvents = (dividends: BRVMDividendPoint[], ticker: string): CalendarEvent[] => (
  dividends.slice(-6).map((dividend, index) => {
    const dateValue = dividend.payDate || dividend.exDate || dividend.year;
    const lifecycle = dividend.payDate ? "Pay date" : dividend.exDate ? "Ex-date" : "Fiscal year";
    return {
      dateLabel: toDisplayDate(dateValue, dividend.year),
      detail: lifecycle + " - " + formatMoney(dividend.value),
      id: `dividend-${dividend.year}-${index}`,
      kind: "dividend",
      sortKey: parseSortKey(dateValue, Date.UTC(Number(dividend.year) || 1970, 11, 31)),
      source: "BRVM fundamentals",
      ticker,
      title: "Dividend " + dividend.year,
      tone: dividend.isEstimate ? "warning" : "success",
    };
  })
);

const buildBondEvents = (bonds: BRVMBond[]): CalendarEvent[] => (
  bonds.slice(0, 8).map((bond, index) => ({
    dateLabel: toDisplayDate(bond.maturityDate, bond.maturityDate || "N/D"),
    detail: "YTM " + (Number.isFinite(bond.ytm) ? bond.ytm.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + "%" : "N/D"),
    id: `bond-${bond.name}-${index}`,
    kind: "bond",
    sortKey: parseSortKey(bond.maturityDate, Number.MAX_SAFE_INTEGER - index),
    source: "BRVM bonds",
    ticker: "UMOA",
    title: bond.name || "Bond maturity",
    tone: "neutral",
  }))
);

const isBusinessDay = (date: Date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

const formatSessionDate = (date: Date) => (
  date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
);

const buildUpcomingSessionEvents = (timezone: string, ticker: string, count = 5): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (events.length < count) {
    if (isBusinessDay(cursor)) {
      const sortKey = cursor.getTime();
      events.push({
        dateLabel: formatSessionDate(cursor),
        detail: "Session reguliere de marche - " + timezone,
        id: "session-upcoming-" + cursor.toISOString().slice(0, 10),
        kind: "session",
        sortKey,
        source: "Market calendar",
        ticker,
        title: "BRVM trading session",
        tone: "neutral",
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
};

const buildSessionEvents = (status: string, updateLabel: string, timezone: string, ticker: string): CalendarEvent[] => ([
  {
    dateLabel: updateLabel || "Now",
    detail: timezone,
    id: "session-current",
    kind: "session",
    sortKey: Date.now(),
    source: "Market clock",
    ticker,
    title: status || "Market session",
    tone: /ouvert|open/i.test(status) ? "success" : "neutral",
  },
  ...buildUpcomingSessionEvents(timezone, ticker),
]);

const buildCorporateActionEvents = (events: CorporateEvent[]): CalendarEvent[] => (
  events.map((event) => ({
    dateLabel: toDisplayDate(event.date, event.date),
    detail: (event.type === "Split" || event.type === "Reverse Split") && event.details?.splitRatio
      ? event.type + " " + event.details.splitRatio
      : event.type === "Merger" && event.details?.dealValue
        ? event.details.dealValue.toLocaleString("fr-FR") + " FCFA"
        : event.type === "Dividend" && event.details?.dividendAmount
          ? event.details.dividendAmount.toLocaleString("fr-FR") + " FCFA"
          : event.description.slice(0, 80),
    id: event.id,
    kind: "corporate-action" as CalendarEventKind,
    sortKey: parseSortKey(event.date, Date.now()),
    source: EXCHANGE_LABELS[event.exchange] || event.exchange,
    ticker: event.companyTicker,
    title: event.title,
    tone: (event.type === "Delisting" || event.type === "Bankruptcy" ? "warning" : "neutral") as CalendarTone,
  }))
);

const buildIPOEvents = (ipos: IPO[], upcoming: UpcomingIPO[]): CalendarEvent[] => {
  const completed: CalendarEvent[] = ipos.map((ipo) => ({
    dateLabel: toDisplayDate(ipo.listingDate || ipo.ipoDate, ipo.ipoDate),
    detail: (ipo.currentReturn !== undefined ? ipo.currentReturn.toFixed(1) + "% return" : ipo.totalRaisedUSD.toLocaleString("fr-FR") + " USD"),
    id: ipo.id,
    kind: "ipo" as CalendarEventKind,
    sortKey: parseSortKey(ipo.ipoDate, Date.now()),
    source: EXCHANGE_LABELS[ipo.exchange] || ipo.exchange,
    ticker: ipo.ticker,
    title: "IPO " + ipo.companyName,
    tone: (ipo.currentReturn !== undefined && ipo.currentReturn > 0 ? "success" : "neutral") as CalendarTone,
  }));
  const upcomingEvents: CalendarEvent[] = upcoming.map((ipo) => ({
    dateLabel: toDisplayDate(ipo.expectedDate, "TBA"),
    detail: "Expected " + ipo.expectedDate + (ipo.subscriptionStatus === "open" ? " · Subscribing" : ""),
    id: ipo.id,
    kind: "ipo" as CalendarEventKind,
    sortKey: parseSortKey(ipo.expectedDate, Date.now()),
    source: EXCHANGE_LABELS[ipo.exchange] || ipo.exchange,
    ticker: ipo.ticker,
    title: "Upcoming IPO " + ipo.companyName,
    tone: (ipo.subscriptionStatus === "open" ? "success" : "warning") as CalendarTone,
  }));
  return [...completed, ...upcomingEvents];
};

const buildStatusEvent = (
  kind: Exclude<CalendarEventKind, "session">,
  ticker: string,
  title: string,
  detail: string,
  sortOffset: number,
): CalendarEvent => ({
  dateLabel: "To verify",
  detail,
  id: "status-" + kind,
  kind,
  sortKey: Date.now() + sortOffset,
  source: "Data status",
  ticker,
  title,
  tone: "warning",
});

const filterEvents = (events: CalendarEvent[], filter: CalendarFilter, query: string) => {
  const needle = query.trim().toLowerCase();
  return events.filter((event) => {
    if (filter !== "all" && event.kind !== filter) return false;
    if (!needle) return true;
    return [event.title, event.detail, event.ticker, event.source].some((value) => value.toLowerCase().includes(needle));
  });
};

const renderFilter = (filter: { id: CalendarFilter; label: string }, activeFilter: CalendarFilter, onSelect: (value: CalendarFilter) => void) => (
  <button
    aria-pressed={activeFilter === filter.id}
    className={clsx(activeFilter === filter.id && "is-active")}
    key={filter.id}
    onClick={() => onSelect(filter.id)}
    type="button"
  >
    {filter.label}
  </button>
);

const renderEvent = (event: CalendarEvent) => (
  <article className={clsx("gp-calendar-rail-event", "is-" + event.tone)} key={event.id}>
    <time>{event.dateLabel}</time>
    <div>
      <span>{EVENT_KIND_LABELS[event.kind]}</span>
      <strong>{event.title}</strong>
      <p>{event.detail}</p>
      <small>{event.ticker} - {event.source}</small>
    </div>
  </article>
);

export const CalendarRailPanel = React.memo(({
  auditDate,
  bonds,
  corporateEvents,
  displayTimeZoneLabel,
  dividends,
  ipos,
  isBondLoading,
  isFundamentalsLoading,
  marketStatusLabel,
  onOpenBondsPage,
  onOpenDividends,
  sessionUpdateLabel,
  ticker,
  upcomingIPOs,
}: CalendarRailPanelProps) => {
  const [activeFilter, setActiveFilter] = React.useState<CalendarFilter>("all");
  const [query, setQuery] = React.useState("");
  const events = React.useMemo(() => {
    const sessionEvents = buildSessionEvents(marketStatusLabel, sessionUpdateLabel, displayTimeZoneLabel, ticker);
    const dividendEvents = buildDividendEvents(dividends, ticker);
    const bondEvents = buildBondEvents(bonds);
    const corporateActionEvents = buildCorporateActionEvents(corporateEvents);
    const ipoEvents = buildIPOEvents(ipos, upcomingIPOs);
    const statusEvents = [
      ...(dividendEvents.length > 0 ? [] : [buildStatusEvent("dividend", ticker, "Dividend calendar pending", "Aucune date de dividende verifiee chargee pour ce titre.", 1)]),
      ...(bondEvents.length > 0 ? [] : [buildStatusEvent("bond", "UMOA", "Bond maturities pending", "Aucune echeance obligataire verifiee chargee dans le rail.", 2)]),
      ...(ipoEvents.length > 0 ? [] : [buildStatusEvent("ipo", "BRVM", "IPO calendar pending", "Aucun evenement IPO verifie charge pour le marche BRVM.", 3)]),
      ...(corporateActionEvents.length > 0 ? [] : [buildStatusEvent("corporate-action", ticker, "Corporate actions pending", "Aucune action corporate verifiee chargee pour ce titre.", 4)]),
    ];

    return [
      sessionEvents[0],
      ...statusEvents,
      ...sessionEvents.slice(1),
      ...dividendEvents,
      ...bondEvents,
      ...corporateActionEvents,
      ...ipoEvents,
    ].sort((left, right) => left.sortKey - right.sortKey);
  }, [
    bonds,
    corporateEvents,
    displayTimeZoneLabel,
    dividends,
    ipos,
    marketStatusLabel,
    sessionUpdateLabel,
    ticker,
    upcomingIPOs,
  ]);
  const visibleEvents = React.useMemo(() => filterEvents(events, activeFilter, query), [activeFilter, events, query]);
  const isLoading = isBondLoading || isFundamentalsLoading;

  return (
    <section className="gp-sidebar-section gp-calendar-rail-panel" aria-labelledby="gp-calendar-rail-title">
      <div className="gp-calendar-rail-header">
        <div>
          <span id="gp-calendar-rail-title" className="gp-sidebar-title">Calendars</span>
          <div className="gp-calendar-rail-subtitle">Events, IPOs, sessions, dividends, bonds and corporate actions</div>
        </div>
        <CalendarClock aria-hidden="true" />
      </div>

      <label className="gp-calendar-rail-search">
        <Search aria-hidden="true" />
        <input
          aria-label="Search calendars"
          id="gp-calendar-rail-search"
          name="calendar-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events"
          type="search"
          value={query}
        />
      </label>

      <div className="gp-calendar-rail-filters" aria-label="Calendar filters">
        {FILTERS.map((filter) => renderFilter(filter, activeFilter, setActiveFilter))}
      </div>

      <div className="gp-calendar-rail-summary" aria-label="Calendar summary">
        <span><strong>{visibleEvents.length}</strong> visible</span>
        <span>{displayTimeZoneLabel}</span>
        <span>Audit {auditDate || "N/D"}</span>
      </div>

      {isLoading && (
        <div className="gp-calendar-rail-skeleton" aria-label="Loading calendar data">
          <span /><span /><span />
        </div>
      )}

      {!isLoading && visibleEvents.length === 0 && (
        <div className="gp-calendar-rail-empty">
          <strong>No calendar events match this filter.</strong>
          <span>Try All or clear the search field.</span>
        </div>
      )}

      <div className="gp-calendar-rail-list" role="list" aria-label="Calendar events">
        {visibleEvents.map(renderEvent)}
      </div>

      <div className="gp-calendar-rail-actions">
        <button type="button" onClick={onOpenDividends}><ExternalLink aria-hidden="true" /> Dividends</button>
        <button type="button" onClick={onOpenBondsPage}><ExternalLink aria-hidden="true" /> Bonds</button>
      </div>
    </section>
  );
});

CalendarRailPanel.displayName = "CalendarRailPanel";
