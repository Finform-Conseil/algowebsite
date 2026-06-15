import React from "react";
import clsx from "clsx";
import { Bell, Lightbulb, Radio, Search, Sparkles, UserRound } from "lucide-react";

type CommunityTab = "for-you" | "notifications" | "your-posts" | "ideas" | "indicators";

interface CommunityItem {
  author: string;
  badge: string;
  body: string;
  id: string;
  meta: string;
  symbol: string;
  title: string;
}

interface CommunityRailPanelProps {
  marketLabel: string;
  sector: string;
  ticker: string;
}

const COMMUNITY_TABS: Array<{ id: CommunityTab; label: string }> = [
  { id: "for-you", label: "For you" },
  { id: "notifications", label: "Notifications" },
  { id: "your-posts", label: "Your posts" },
  { id: "ideas", label: "Ideas" },
  { id: "indicators", label: "Indicators" },
];

const COMMUNITY_IDEAS: CommunityItem[] = [
  {
    author: "Desk Abidjan",
    badge: "Market note",
    body: "Les bancaires gardent le leadership, mais la confirmation vient uniquement avec volume relatif au-dessus de la moyenne.",
    id: "desk-abidjan-banks",
    meta: "12 min · BRVM",
    symbol: "BANKS",
    title: "Leadership bancaire sous surveillance",
  },
  {
    author: "Quant UEMOA",
    badge: "Setup",
    body: "Signal neutre tant que le prix reste sous SMA20; invalidation si le fixing casse le plus haut de la semaine.",
    id: "quant-uemoa-sma20",
    meta: "34 min · Technique",
    symbol: "TECH",
    title: "Compression autour de la SMA20",
  },
  {
    author: "BRVM Income",
    badge: "Fundamental",
    body: "Les titres a rendement dividende eleve restent favoris si le spread carnet reste inferieur au seuil de liquidite.",
    id: "brvm-income-dividend",
    meta: "1 h · Dividendes",
    symbol: "YIELD",
    title: "Rendement et liquidite",
  },
];

const COMMUNITY_INDICATORS: CommunityItem[] = [
  {
    author: "Research Desk",
    badge: "Indicator",
    body: "RSI14 + SMA50, utile sur les titres liquides quand les clotures verifiees couvrent au moins 50 seances.",
    id: "rsi-sma-regime",
    meta: "Template local",
    symbol: "RSI",
    title: "RSI/SMA regime filter",
  },
  {
    author: "Market Microstructure",
    badge: "Scanner",
    body: "Volume relatif et spread proxy pour detecter les cassures fragiles avant activation d'une alerte.",
    id: "volume-spread-proxy",
    meta: "BRVM watch",
    symbol: "VOL",
    title: "Volume-spread confirmation",
  },
];

const renderTab = (tab: { id: CommunityTab; label: string }, activeTab: CommunityTab, onSelect: (tab: CommunityTab) => void) => (
  <button
    aria-controls={"gp-community-panel-" + tab.id}
    aria-selected={activeTab === tab.id}
    className={clsx("gp-community-tab", activeTab === tab.id && "active")}
    id={"gp-community-tab-" + tab.id}
    key={tab.id}
    onClick={() => onSelect(tab.id)}
    role="tab"
    type="button"
  >
    {tab.label}
  </button>
);

const renderCommunityItem = (item: CommunityItem) => (
  <article className="gp-community-card" key={item.id}>
    <div className="gp-community-card-head">
      <span className="gp-community-symbol">{item.symbol}</span>
      <span className="gp-community-meta">{item.meta}</span>
    </div>
    <strong>{item.title}</strong>
    <p>{item.body}</p>
    <div className="gp-community-author">
      <UserRound size={13} strokeWidth={1.8} />
      <span>{item.author}</span>
      <small>{item.badge}</small>
    </div>
  </article>
);

const renderEmptyState = (ticker: string) => (
  <div className="gp-community-empty">
    <span className="gp-community-empty-icon" aria-hidden="true">
      <Bell size={22} strokeWidth={1.8} />
    </span>
    <strong>No notifications in your orbit yet</strong>
    <p>Engage avec les idees {ticker}, les discussions BRVM et les indicateurs locaux pour alimenter ce flux.</p>
    <button type="button">Explore posts</button>
  </div>
);

const renderForYouPanel = (marketLabel: string, sector: string, ticker: string) => (
  <div className="gp-community-pane" id="gp-community-panel-for-you" role="tabpanel" aria-labelledby="gp-community-tab-for-you">
    <div className="gp-community-hero">
      <Radio size={20} strokeWidth={1.8} />
      <div>
        <span className="gp-sidebar-title">Community</span>
        <p>{marketLabel} · {sector}</p>
      </div>
      <strong>{ticker}</strong>
    </div>
    <div className="gp-community-search">
      <Search size={14} strokeWidth={1.8} />
      <span>Search community posts</span>
    </div>
    {COMMUNITY_IDEAS.slice(0, 2).map(renderCommunityItem)}
  </div>
);

const renderIdeasPanel = () => (
  <div className="gp-community-pane" id="gp-community-panel-ideas" role="tabpanel" aria-labelledby="gp-community-tab-ideas">
    {COMMUNITY_IDEAS.map(renderCommunityItem)}
  </div>
);

const renderIndicatorsPanel = () => (
  <div className="gp-community-pane" id="gp-community-panel-indicators" role="tabpanel" aria-labelledby="gp-community-tab-indicators">
    {COMMUNITY_INDICATORS.map(renderCommunityItem)}
  </div>
);

const renderYourPostsPanel = (ticker: string) => (
  <div className="gp-community-pane" id="gp-community-panel-your-posts" role="tabpanel" aria-labelledby="gp-community-tab-your-posts">
    <div className="gp-community-empty">
      <span className="gp-community-empty-icon" aria-hidden="true">
        <Lightbulb size={22} strokeWidth={1.8} />
      </span>
      <strong>No posts published for {ticker}</strong>
      <p>La publication reste desactivee tant qu'un backend community et une moderation ne sont pas branches.</p>
      <button type="button" disabled>Publish locked</button>
    </div>
  </div>
);

export const CommunityRailPanel = React.memo(({ marketLabel, sector, ticker }: CommunityRailPanelProps) => {
  const [activeTab, setActiveTab] = React.useState<CommunityTab>("notifications");

  return (
    <section className="gp-sidebar-section gp-community-rail-panel" aria-label="Community BRVM">
      <div className="gp-community-titlebar">
        <span className="gp-sidebar-title">Community</span>
        <Sparkles size={16} strokeWidth={1.8} />
      </div>
      <div className="gp-community-tabs" role="tablist" aria-label="Community">
        {COMMUNITY_TABS.map((tab) => renderTab(tab, activeTab, setActiveTab))}
      </div>
      {activeTab === "for-you" && renderForYouPanel(marketLabel, sector, ticker)}
      {activeTab === "notifications" && (
        <div className="gp-community-pane" id="gp-community-panel-notifications" role="tabpanel" aria-labelledby="gp-community-tab-notifications">
          <div className="gp-community-subtabs" role="tablist" aria-label="Notification filters">
            <button className="active" type="button">All</button>
            <button type="button">Comments</button>
          </div>
          {renderEmptyState(ticker)}
        </div>
      )}
      {activeTab === "your-posts" && renderYourPostsPanel(ticker)}
      {activeTab === "ideas" && renderIdeasPanel()}
      {activeTab === "indicators" && renderIndicatorsPanel()}
    </section>
  );
});

CommunityRailPanel.displayName = "CommunityRailPanel";
