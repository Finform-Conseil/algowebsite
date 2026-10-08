import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BRVMNewsItem } from "../data/sidebarFetchers";

interface SidebarNewsPanelProps {
  exchange: string;
  activeNews: BRVMNewsItem | null;
  isLoading: boolean;
  newsKey: number;
  onHoverChange: (isHovered: boolean) => void;
}

const SidebarNewsSkeleton = () => (
  <div className="gp-sidebar-news-skeleton" aria-hidden="true">
    <div className="gp-sidebar-news-skeleton-icon-frame">
      <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-news-skeleton-icon" />
    </div>
    <div className="gp-sidebar-news-skeleton-copy">
      <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-news-skeleton-date" />
      <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-news-skeleton-title" />
      <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-news-skeleton-title-short" />
    </div>
    <div className="is-loading-skeleton gp-sidebar-skeleton-line gp-sidebar-news-skeleton-chevron" />
  </div>
);

const formatNewsDate = (value: string) => {
  const date = value.trim();
  if (date.toLowerCase() === "aujourd'hui") return "Aujourd'hui";

  // Official feeds use ISO 8601, RSS feeds use RFC 2822. Both must display
  // as one compact, legible date inside the fixed-height 70px news card.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/.exec(date);
  const parsed = iso
    ? new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))
    : new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }).format(parsed);
  }
  return date.charAt(0).toUpperCase() + date.slice(1);
};

const formatNewsTitle = (title: string) => {
  if (!title) return "";

  const isMostlyUpper = (title.match(/[A-Z]/g) || []).length > title.length * 0.5;
  if (!isMostlyUpper) return title;

  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()
    .replace(/brvm/g, "BRVM")
    .replace(/uemoa/g, "UEMOA")
    .replace(/crrh/g, "CRRH")
    .replace(/bceao/g, "BCEAO");
};

const getNewsPublisherDomain = (link: string): string | null => {
  try {
    const url = new URL(link);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.hostname.replace(/^www\./i, "").toLowerCase() || null;
  } catch {
    return null;
  }
};

export const SidebarNewsPanel = React.memo(({
  exchange,
  activeNews,
  isLoading,
  newsKey,
  onHoverChange,
}: SidebarNewsPanelProps) => {
  const reduceMotion = useReducedMotion();
  const declaredPublisher = activeNews?.sourceDomain?.trim().toLowerCase();
  const publisherDomain = declaredPublisher && /^[a-z0-9.-]+$/.test(declaredPublisher)
    ? declaredPublisher
    : activeNews ? getNewsPublisherDomain(activeNews.link) : null;
  const hasLink = Boolean(publisherDomain);
  return (
  <div
    className="gp-sidebar-news-container"
    onMouseEnter={() => onHoverChange(true)}
    onMouseLeave={() => onHoverChange(false)}
  >
    {isLoading ? (
      <SidebarNewsSkeleton />
    ) : !activeNews ? (
      <div className="gp-sidebar-news-empty" role="status"><i className="bi bi-newspaper" aria-hidden="true" /><span>Aucune actualité {exchange.toUpperCase()} disponible</span></div>
    ) : (
      <AnimatePresence mode="wait" initial={false}>
        <motion.a
          key={`${newsKey}-${activeNews.link}`}
          href={hasLink ? activeNews.link : undefined}
          target={hasLink ? "_blank" : undefined}
          rel={hasLink ? "noopener noreferrer" : undefined}
          aria-disabled={!hasLink}
          tabIndex={hasLink ? 0 : -1}
          title={exchange.toUpperCase() === "BRVM" ? formatNewsTitle(activeNews.title) : activeNews.title}
          className="gp-sidebar-news-card"
          initial={reduceMotion ? false : { opacity: 0, x: 42, rotateY: -18, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -42, rotateY: 18, scale: 0.94 }}
          transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="gp-sidebar-news-card__signal" aria-hidden="true"><i className="bi bi-lightning-charge-fill" /></span>
          <span className="gp-sidebar-news-card__body">
            <span className="gp-sidebar-news-card__meta"><span className="gp-sidebar-news-card__source">{exchange.toUpperCase()}</span><span aria-hidden="true">·</span><span>{formatNewsDate(activeNews.date)}</span></span>
            <span className="gp-sidebar-news-card__title">{exchange.toUpperCase() === "BRVM" ? formatNewsTitle(activeNews.title) : activeNews.title}</span>
            {publisherDomain && <span className="gp-sidebar-news-card__publisher" title={`Site source : ${publisherDomain}`}><span className="gp-sidebar-news-card__publisher-label">Source ·</span><span className="gp-sidebar-news-card__publisher-domain">{publisherDomain}</span></span>}
          </span>
          <span className="gp-sidebar-news-card__action" aria-hidden="true"><i className="bi bi-chevron-right" /></span>
        </motion.a>
      </AnimatePresence>
    )}
  </div>
  );
});

SidebarNewsPanel.displayName = "SidebarNewsPanel";
