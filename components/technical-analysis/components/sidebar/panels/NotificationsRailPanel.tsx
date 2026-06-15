import React from "react";
import clsx from "clsx";
import {
  Bell,
  BellDot,
  CheckCheck,
  CircleAlert,
  Globe,
  Info,
  Settings,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  X,
} from "lucide-react";

type NotificationTab = "all" | "alerts" | "news" | "system";

interface NotificationItem {
  id: string;
  type: "alert" | "news" | "system" | "price";
  title: string;
  body: string;
  meta: string;
  read: boolean;
  ticker?: string;
}

interface NotificationSettings {
  alertsEnabled: boolean;
  newsEnabled: boolean;
  systemEnabled: boolean;
  priceAlertsEnabled: boolean;
  soundEnabled: boolean;
}

interface NotificationsRailPanelProps {
  ticker: string;
  marketLabel: string;
}

const NOTIFICATION_TABS: Array<{ id: NotificationTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "alerts", label: "Alerts" },
  { id: "news", label: "News" },
  { id: "system", label: "System" },
];

const DEFAULT_SETTINGS: NotificationSettings = {
  alertsEnabled: true,
  newsEnabled: true,
  systemEnabled: true,
  priceAlertsEnabled: true,
  soundEnabled: false,
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-alert-snts-1",
    type: "alert",
    title: "SNTS Crossing 28 250",
    body: "Prix SNTS a franchi le seuil de 28 250 XOF a la hausse.",
    meta: "Il y a 12 min",
    read: false,
    ticker: "SNTS",
  },
  {
    id: "notif-news-brvm-1",
    type: "news",
    title: "Correction marche BRVM",
    body: "L indice BRVM Composite cede 0.8% sur des volumes en hausse.",
    meta: "Il y a 34 min",
    read: false,
  },
  {
    id: "notif-price-boab-1",
    type: "price",
    title: "BOAB — Variation > 5%",
    body: "BOAB affiche une hausse de 5.2% depuis la cloture precedente.",
    meta: "Il y a 1 h",
    read: true,
    ticker: "BOAB",
  },
  {
    id: "notif-system-1",
    type: "system",
    title: "Flux live reconnecte",
    body: "La connexion au flux BRVM live a ete restauree apres une interruption.",
    meta: "Il y a 2 h",
    read: true,
  },
  {
    id: "notif-alert-sgbc-1",
    type: "alert",
    title: "SGBC — Seuil dividende atteint",
    body: "Le rendement dividende SGBC depasse 4% sur les dernieres clotures verifies.",
    meta: "Il y a 3 h",
    read: true,
    ticker: "SGBC",
  },
];

const typeIcon = (type: NotificationItem["type"]) => {
  switch (type) {
    case "alert":
      return <CircleAlert size={14} strokeWidth={2} />;
    case "news":
      return <Globe size={14} strokeWidth={2} />;
    case "price":
      return <TrendingUp size={14} strokeWidth={2} />;
    case "system":
      return <Info size={14} strokeWidth={2} />;
    default:
      return <Bell size={14} strokeWidth={2} />;
  }
};

const typeColor = (type: NotificationItem["type"]) => {
  switch (type) {
    case "alert":
      return "gp-notif-type-alert";
    case "news":
      return "gp-notif-type-news";
    case "price":
      return "gp-notif-type-price";
    case "system":
      return "gp-notif-type-system";
    default:
      return "";
  }
};

const filterByTab = (items: NotificationItem[], tab: NotificationTab): NotificationItem[] => {
  if (tab === "all") return items;
  if (tab === "alerts") return items.filter((n) => n.type === "alert" || n.type === "price");
  if (tab === "news") return items.filter((n) => n.type === "news");
  if (tab === "system") return items.filter((n) => n.type === "system");
  return items;
};

const renderTab = (
  tab: { id: NotificationTab; label: string },
  activeTab: NotificationTab,
  onSelect: (tab: NotificationTab) => void,
  unreadByTab: Record<NotificationTab, number>,
) => (
  <button
    aria-controls={"gp-notif-panel-" + tab.id}
    aria-selected={activeTab === tab.id}
    className={clsx("gp-notif-tab", activeTab === tab.id && "active")}
    id={"gp-notif-tab-" + tab.id}
    key={tab.id}
    onClick={() => onSelect(tab.id)}
    role="tab"
    type="button"
  >
    {tab.label}
    {unreadByTab[tab.id] > 0 && <span className="gp-notif-tab-badge">{unreadByTab[tab.id]}</span>}
  </button>
);

const renderNotificationItem = (item: NotificationItem, onMarkAsRead: (id: string) => void) => (
  <article
    className={clsx("gp-notif-card", !item.read && "unread")}
    key={item.id}
    data-notification-type={item.type}
    data-read={item.read}
    onClick={() => { if (!item.read) onMarkAsRead(item.id); }}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!item.read) onMarkAsRead(item.id); } }}
  >
    <div className={clsx("gp-notif-icon", typeColor(item.type))}>
      {typeIcon(item.type)}
    </div>
    <div className="gp-notif-body">
      <div className="gp-notif-head">
        <strong>{item.title}</strong>
        {!item.read && <span className="gp-notif-dot" aria-label="Non lu" />}
      </div>
      <p>{item.body}</p>
      <span className="gp-notif-meta">{item.meta}</span>
    </div>
  </article>
);

const renderEmptyState = (tab: NotificationTab) => (
  <div className="gp-notif-empty">
    <span className="gp-notif-empty-icon" aria-hidden="true">
      <Bell size={22} strokeWidth={1.8} />
    </span>
    <strong>
      {tab === "all"
        ? "No notifications yet"
        : tab === "alerts"
          ? "No alert triggers"
          : tab === "news"
            ? "No market news"
            : "No system events"}
    </strong>
    <p>
      Les notifications apparaitront ici quand des alertes seront declenchees, des
      actualites de marche publiees ou des evenements systeme detectes.
    </p>
  </div>
);

export const NotificationsRailPanel = React.memo(({ ticker, marketLabel }: NotificationsRailPanelProps) => {
  const [activeTab, setActiveTab] = React.useState<NotificationTab>("all");
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = React.useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const unreadByTab = React.useMemo<Record<NotificationTab, number>>(() => ({
    all: notifications.filter((n) => !n.read).length,
    alerts: notifications.filter((n) => !n.read && (n.type === "alert" || n.type === "price")).length,
    news: notifications.filter((n) => !n.read && n.type === "news").length,
    system: notifications.filter((n) => !n.read && n.type === "system").length,
  }), [notifications]);

  const filteredNotifications = React.useMemo(
    () => filterByTab(notifications, activeTab),
    [notifications, activeTab],
  );

  const handleMarkAllRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleMarkAsRead = React.useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleToggleSetting = React.useCallback((key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleClearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  if (isSettingsOpen) {
    return (
      <section className="gp-sidebar-section gp-notif-rail-panel" aria-label="Parametres notifications">
        <div className="gp-notif-titlebar">
          <div className="gp-notif-title">
            <Settings size={16} strokeWidth={1.8} />
            <span className="gp-sidebar-title">Parametres</span>
          </div>
          <button
            type="button"
            className="gp-notif-action-btn"
            title="Fermer les parametres"
            aria-label="Fermer les parametres"
            onClick={() => setIsSettingsOpen(false)}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>

        <div className="gp-notif-settings">
          <div className="gp-notif-settings-group">
            <span className="gp-notif-settings-label">Types de notifications</span>
            <button type="button" className="gp-notif-settings-row" onClick={() => handleToggleSetting("alertsEnabled")}>
              <CircleAlert size={14} strokeWidth={1.8} />
              <span>Alertes de prix</span>
              {settings.alertsEnabled ? <ToggleRight size={18} className="gp-notif-toggle-on" /> : <ToggleLeft size={18} className="gp-notif-toggle-off" />}
            </button>
            <button type="button" className="gp-notif-settings-row" onClick={() => handleToggleSetting("priceAlertsEnabled")}>
              <TrendingUp size={14} strokeWidth={1.8} />
              <span>Variations fortes</span>
              {settings.priceAlertsEnabled ? <ToggleRight size={18} className="gp-notif-toggle-on" /> : <ToggleLeft size={18} className="gp-notif-toggle-off" />}
            </button>
            <button type="button" className="gp-notif-settings-row" onClick={() => handleToggleSetting("newsEnabled")}>
              <Globe size={14} strokeWidth={1.8} />
              <span>Actualites marche</span>
              {settings.newsEnabled ? <ToggleRight size={18} className="gp-notif-toggle-on" /> : <ToggleLeft size={18} className="gp-notif-toggle-off" />}
            </button>
            <button type="button" className="gp-notif-settings-row" onClick={() => handleToggleSetting("systemEnabled")}>
              <Info size={14} strokeWidth={1.8} />
              <span>Evenements systeme</span>
              {settings.systemEnabled ? <ToggleRight size={18} className="gp-notif-toggle-on" /> : <ToggleLeft size={18} className="gp-notif-toggle-off" />}
            </button>
          </div>

          <div className="gp-notif-settings-group">
            <span className="gp-notif-settings-label">Preferences</span>
            <button type="button" className="gp-notif-settings-row" onClick={() => handleToggleSetting("soundEnabled")}>
              <Bell size={14} strokeWidth={1.8} />
              <span>Son des alertes</span>
              {settings.soundEnabled ? <ToggleRight size={18} className="gp-notif-toggle-on" /> : <ToggleLeft size={18} className="gp-notif-toggle-off" />}
            </button>
          </div>

          <div className="gp-notif-settings-group">
            <span className="gp-notif-settings-label">Gestion</span>
            <button type="button" className="gp-notif-settings-row gp-notif-settings-danger" onClick={handleClearAll} disabled={notifications.length === 0}>
              <span>Supprimer toutes les notifications</span>
            </button>
          </div>
        </div>

        <div className="gp-notif-footer">
          <span className="gp-notif-footer-hint">
            Les preferences seront sauvegardees dans IndexedDB avec le reste des etats TA
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="gp-sidebar-section gp-notif-rail-panel" aria-label="Notifications BRVM">
      <div className="gp-notif-titlebar">
        <div className="gp-notif-title">
          <BellDot size={16} strokeWidth={1.8} />
          <span className="gp-sidebar-title">Notifications</span>
          {unreadCount > 0 && <span className="gp-notif-badge">{unreadCount}</span>}
        </div>
        <div className="gp-notif-actions">
          <button
            type="button"
            className="gp-notif-action-btn"
            title="Marquer toutes comme lues"
            aria-label="Marquer toutes comme lues"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="gp-notif-action-btn"
            title="Parametres notifications"
            aria-label="Parametres notifications"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="gp-notif-market-label">
        <span>{marketLabel}</span>
        <strong>{ticker}</strong>
      </div>

      <div className="gp-notif-tabs" role="tablist" aria-label="Notifications filters">
        {NOTIFICATION_TABS.map((tab) => renderTab(tab, activeTab, setActiveTab, unreadByTab))}
      </div>

      <div
        className="gp-notif-pane"
        id={"gp-notif-panel-" + activeTab}
        role="tabpanel"
        aria-labelledby={"gp-notif-tab-" + activeTab}
      >
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => renderNotificationItem(item, handleMarkAsRead))
        ) : (
          renderEmptyState(activeTab)
        )}
      </div>

      <div className="gp-notif-footer">
        <span className="gp-notif-footer-hint">
          Apercu non connecte — les notifications reelles necessitent un backend
        </span>
      </div>
    </section>
  );
});

NotificationsRailPanel.displayName = "NotificationsRailPanel";
