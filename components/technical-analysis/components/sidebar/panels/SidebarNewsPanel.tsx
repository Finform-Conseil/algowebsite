import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BRVMNewsItem } from "../data/sidebarFetchers";

interface SidebarNewsPanelProps {
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

const formatNewsDate = (date: string) => {
  if (date.toLowerCase() === "aujourd'hui") return "Aujourd'hui";
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

const NEWS_CARD_TRANSITION = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1],
} as const;

const NEWS_CARD_VIEWPORT_STYLE: React.CSSProperties = {
  overflow: "hidden",
  minHeight: "70px",
  position: "relative",
  marginTop: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  perspective: "420px",
};

const NEWS_CARD_STYLE: React.CSSProperties = {
  cursor: "pointer",
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  background: "rgba(139, 92, 246, 0.1)",
  border: "1px solid rgba(139, 92, 246, 0.2)",
  borderRadius: "8px",
  textDecoration: "none",
  transformStyle: "preserve-3d",
  transformOrigin: "center right",
  backfaceVisibility: "hidden",
  willChange: "transform, opacity",
};

export const SidebarNewsPanel = React.memo(({
  activeNews,
  isLoading,
  newsKey,
  onHoverChange,
}: SidebarNewsPanelProps) => (
  <div
    className="gp-sidebar-news-container"
    onMouseEnter={() => onHoverChange(true)}
    onMouseLeave={() => onHoverChange(false)}
    style={NEWS_CARD_VIEWPORT_STYLE}
  >
    {isLoading || !activeNews ? (
      <SidebarNewsSkeleton />
    ) : activeNews ? (
      <AnimatePresence mode="wait" initial={false}>
        <motion.a
          key={`${newsKey}-${activeNews.link}`}
          href={activeNews.link}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 42, rotateY: -18, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          exit={{ opacity: 0, x: -42, rotateY: 18, scale: 0.94 }}
          transition={NEWS_CARD_TRANSITION}
          style={NEWS_CARD_STYLE}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
            <i className="bi bi-lightning-fill" style={{ fontSize: "1.2rem", color: "#8b5cf6", flexShrink: 0 }} />
            <div style={{ fontSize: "0.75rem", lineHeight: "1.25", color: "#f1f5f9", flex: 1, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", marginRight: "4px" }}>{formatNewsDate(activeNews.date)} •</span>
              {formatNewsTitle(activeNews.title)}
            </div>
            <i className="bi bi-chevron-right" style={{ fontSize: "0.9rem", opacity: 0.7, color: "#94a3b8", flexShrink: 0 }} />
          </div>
        </motion.a>
      </AnimatePresence>
    ) : null}
  </div>
));

SidebarNewsPanel.displayName = "SidebarNewsPanel";
