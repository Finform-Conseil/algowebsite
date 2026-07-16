import React from "react";
import clsx from "clsx";
import { Check, Ellipsis, Search } from "lucide-react";

type ChatTab = "public" | "private";
type ChatSoundMode = "all" | "addressed" | "none";

interface ChatMessage {
  author: string;
  avatarUrl: string;
  badge: string;
  body: string;
  id: string;
  symbol: string;
  time: string;
}

interface ChatRoom {
  count: string;
  id: string;
  isFavorite: boolean;
  label: string;
  preview: string;
  time: string;
}

interface ChatsRailPanelProps {
  marketLabel: string;
  sector: string;
  ticker: string;
}

interface PublicPanelControls {
  isTalkSearchOpen: boolean;
  isTalksMenuOpen: boolean;
  onSoundModeChange: (mode: ChatSoundMode) => void;
  onTalkSearchChange: (value: string) => void;
  onToggleFavoriteRoomsOnly: () => void;
  onToggleSnapshotPreview: () => void;
  onToggleTalkSearch: () => void;
  onToggleTalksMenu: () => void;
  showFavoriteRoomsOnly: boolean;
  showSnapshotPreview: boolean;
  soundMode: ChatSoundMode;
  talkSearchQuery: string;
}

const CHAT_TABS: Array<{ id: ChatTab; label: string }> = [
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
];

const CHAT_SOUND_OPTIONS: Array<{ id: ChatSoundMode; label: string }> = [
  { id: "all", label: "Sound on Every Message" },
  { id: "addressed", label: "Sound on Addressed to Me Messages" },
  { id: "none", label: "No Sound Notifications" },
];

const CHAT_ROOM_ACTIONS = [
  "Ignored Users",
  "Toggle Notifications for This Room",
  "Link to This Room",
  "Room Archives",
  "Launch Chat in a Separate Window",
];

const PUBLIC_CHAT_MESSAGES: ChatMessage[] = [
  {
    author: "Awa Traore",
    badge: "Essential",
    avatarUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=160&h=160&q=80",
    body: "Flux calme avant fixing. Je surveille surtout le carnet et le volume relatif.",
    id: "awa-traore",
    symbol: "BRVM",
    time: "12:18",
  },
  {
    author: "Desk Abidjan",
    badge: "Premium",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80",
    body: "Les bancaires gardent le leadership intraday, mais les spreads restent larges.",
    id: "desk-abidjan",
    symbol: "BANKS",
    time: "12:11",
  },
  {
    author: "Quant UEMOA",
    badge: "Pro",
    avatarUrl: "https://images.unsplash.com/photo-1604072366595-e75dc92d6bdc?auto=format&fit=crop&w=160&h=160&q=80",
    body: "Signal technique neutre tant que le prix reste sous la moyenne 20 seances.",
    id: "quant-uemoa",
    symbol: "TECH",
    time: "11:54",
  },
];

const CHAT_ROOMS: ChatRoom[] = [
  {
    count: "12.4K",
    id: "brvm-actions",
    isFavorite: true,
    label: "BRVM Actions",
    preview: "Flux public actions cotees",
    time: "Live",
  },
  {
    count: "4.8K",
    id: "dividends-results",
    isFavorite: true,
    label: "Dividendes & resultats",
    preview: "Annonces, coupons, ex-dates",
    time: "09:45",
  },
  {
    count: "2.1K",
    id: "uemoa-bonds",
    isFavorite: false,
    label: "Obligations UMOA",
    preview: "Rendements, maturites, adjudications",
    time: "Hier",
  },
  {
    count: "1.7K",
    id: "market-microstructure",
    isFavorite: false,
    label: "Microstructure",
    preview: "Volumes, spreads, fixing",
    time: "Lun",
  },
];

const getInitials = (name: string) => (
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
);

const renderTab = (tab: { id: ChatTab; label: string }, activeTab: ChatTab, onSelect: (tab: ChatTab) => void) => (
  <button
    aria-controls={"gp-chats-panel-" + tab.id}
    aria-selected={activeTab === tab.id}
    className={clsx("gp-chats-tab", activeTab === tab.id && "active")}
    id={"gp-chats-tab-" + tab.id}
    key={tab.id}
    onClick={() => onSelect(tab.id)}
    role="tab"
    type="button"
  >
    {tab.label}
  </button>
);

const renderMessage = (message: ChatMessage) => (
  <article className="gp-chats-message" key={message.id}>
    <span className="gp-chats-avatar" aria-hidden="true">
      <img
        alt=""
        loading="lazy"
        onError={(event) => { event.currentTarget.hidden = true; }}
        referrerPolicy="no-referrer"
        src={message.avatarUrl}
      />
      <span>{getInitials(message.author)}</span>
    </span>
    <div className="gp-chats-message-copy">
      <div className="gp-chats-message-head">
        <span className="gp-chats-author">{message.author}</span>
        <span className="gp-chats-badge">{message.badge}</span>
        <time dateTime={"2026-06-11T" + message.time + ":00"}>{message.time}</time>
      </div>
      <div className="gp-chats-message-symbol">{message.symbol}</div>
      <p>{message.body}</p>
    </div>
  </article>
);

const renderTalk = (room: ChatRoom) => (
  <button aria-disabled="true" className="gp-chats-talk" disabled key={room.id} type="button" aria-label={room.label + " " + room.count}>
    <span>
      <strong>{room.label}</strong>
      <small>{room.preview}</small>
    </span>
    <span className="gp-chats-talk-meta">
      <strong>{room.count}</strong>
      <small>{room.time}</small>
    </span>
  </button>
);
const renderTalksMenu = ({
  onSoundModeChange,
  onToggleFavoriteRoomsOnly,
  onToggleSnapshotPreview,
  showFavoriteRoomsOnly,
  showSnapshotPreview,
  soundMode,
}: PublicPanelControls) => (
  <div className="gp-chats-talks-menu" role="menu" aria-label="Talks options">
    {CHAT_SOUND_OPTIONS.map((option) => {
      const isSelected = soundMode === option.id;

      return (
        <button
          aria-checked={isSelected}
          className="gp-chats-menu-item"
          key={option.id}
          onClick={() => onSoundModeChange(option.id)}
          role="menuitemradio"
          type="button"
        >
          <span className={clsx("gp-chats-menu-radio", isSelected && "active")} aria-hidden="true" />
          <span>{option.label}</span>
        </button>
      );
    })}

    <div className="gp-chats-menu-separator" role="separator" />

    <button
      aria-checked={showSnapshotPreview}
      className="gp-chats-menu-item"
      onClick={onToggleSnapshotPreview}
      role="menuitemcheckbox"
      type="button"
    >
      <span className={clsx("gp-chats-menu-check", showSnapshotPreview && "active")} aria-hidden="true">
        {showSnapshotPreview ? <Check size={12} strokeWidth={2.2} /> : null}
      </span>
      <span>Show Chart Snapshot Preview</span>
    </button>
    <button
      aria-checked={showFavoriteRoomsOnly}
      className="gp-chats-menu-item"
      onClick={onToggleFavoriteRoomsOnly}
      role="menuitemcheckbox"
      type="button"
    >
      <span className={clsx("gp-chats-menu-check", showFavoriteRoomsOnly && "active")} aria-hidden="true">
        {showFavoriteRoomsOnly ? <Check size={12} strokeWidth={2.2} /> : null}
      </span>
      <span>Show Only Favorite Rooms</span>
    </button>

    <div className="gp-chats-menu-separator" role="separator" />

    {CHAT_ROOM_ACTIONS.map((label) => (
      <button aria-disabled="true" className="gp-chats-menu-item" disabled key={label} role="menuitem" type="button">
        <span className="gp-chats-menu-spacer" aria-hidden="true" />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

const getVisibleTalkRooms = (query: string, favoriteOnly: boolean) => {
  const normalizedQuery = query.trim().toLowerCase();

  return CHAT_ROOMS.filter((room) => {
    if (favoriteOnly && !room.isFavorite) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (room.label + " " + room.preview).toLowerCase().includes(normalizedQuery);
  });
};

const renderPublicPanel = (ticker: string, marketLabel: string, sector: string, controls: PublicPanelControls) => {
  const visibleRooms = getVisibleTalkRooms(controls.talkSearchQuery, controls.showFavoriteRoomsOnly);

  return (
    <div className="gp-chats-tab-panel" id="gp-chats-panel-public" role="tabpanel" aria-labelledby="gp-chats-tab-public">
      <div className="gp-chats-room-head">
        <div>
          <span className="gp-sidebar-title">Chats BRVM</span>
          <div className="gp-chats-room-meta">{marketLabel} · {sector}</div>
        </div>
        <span>{ticker}</span>
      </div>

      <div className="gp-chats-feed" aria-label="Messages publics BRVM">
        {PUBLIC_CHAT_MESSAGES.map(renderMessage)}
      </div>

      <label className="gp-chats-composer">
        <span className="visually-hidden">Message public</span>
        <textarea aria-disabled="true" disabled placeholder="Have something to say?" rows={2} />
        <small>Messagerie non connectee sur cette tranche produit.</small>
      </label>

      <div className="gp-chats-talks" aria-label="Talks publics">
        <div className="gp-chats-talks-toolbar">
          <span>Talks</span>
          <div className="gp-chats-talks-actions">
            <button
              aria-label="Search talks"
              aria-pressed={controls.isTalkSearchOpen}
              className={clsx(controls.isTalkSearchOpen && "active")}
              onClick={controls.onToggleTalkSearch}
              type="button"
            >
              <Search size={16} strokeWidth={1.9} />
            </button>
            <button
              aria-expanded={controls.isTalksMenuOpen}
              aria-haspopup="menu"
              aria-label="Talks options"
              className={clsx(controls.isTalksMenuOpen && "active")}
              onClick={controls.onToggleTalksMenu}
              type="button"
            >
              <Ellipsis size={17} strokeWidth={2.1} />
            </button>
          </div>
        </div>

        {controls.isTalkSearchOpen ? (
          <label className="gp-chats-talk-search">
            <span className="visually-hidden">Search talks</span>
            <input
              autoComplete="off"
              onChange={(event) => controls.onTalkSearchChange(event.target.value)}
              placeholder="Search talks"
              type="search"
              value={controls.talkSearchQuery}
            />
          </label>
        ) : null}

        {controls.isTalksMenuOpen ? renderTalksMenu(controls) : null}

        {visibleRooms.length > 0 ? (
          visibleRooms.map(renderTalk)
        ) : (
          <div className="gp-chats-talks-empty">No talks match this filter.</div>
        )}
      </div>
    </div>
  );
};

const renderPrivatePanel = () => (
  <div className="gp-chats-tab-panel" id="gp-chats-panel-private" role="tabpanel" aria-labelledby="gp-chats-tab-private">
    <label className="gp-chats-search">
      <span className="visually-hidden">Find existing chat</span>
      <input aria-disabled="true" disabled placeholder="Find existing chat" type="search" />
    </label>
    <div className="gp-chats-empty">
      <strong>You have no private messages yet</strong>
      <span>Les messages directs seront affiches ici quand la messagerie sera connectee.</span>
    </div>
  </div>
);

export const ChatsRailPanel = React.memo(({ marketLabel, sector, ticker }: ChatsRailPanelProps) => {
  const [activeTab, setActiveTab] = React.useState<ChatTab>("public");
  const [isTalkSearchOpen, setIsTalkSearchOpen] = React.useState(false);
  const [isTalksMenuOpen, setIsTalksMenuOpen] = React.useState(false);
  const [showFavoriteRoomsOnly, setShowFavoriteRoomsOnly] = React.useState(false);
  const [showSnapshotPreview, setShowSnapshotPreview] = React.useState(true);
  const [soundMode, setSoundMode] = React.useState<ChatSoundMode>("addressed");
  const [talkSearchQuery, setTalkSearchQuery] = React.useState("");

  const handleSelectTab = React.useCallback((tab: ChatTab) => {
    setActiveTab(tab);

    if (tab !== "public") {
      setIsTalkSearchOpen(false);
      setIsTalksMenuOpen(false);
      setTalkSearchQuery("");
    }
  }, []);

  const handleToggleTalkSearch = React.useCallback(() => {
    setIsTalkSearchOpen((isOpen) => !isOpen);
    setTalkSearchQuery("");
  }, []);

  const publicPanelControls: PublicPanelControls = {
    isTalkSearchOpen,
    isTalksMenuOpen,
    onSoundModeChange: setSoundMode,
    onTalkSearchChange: setTalkSearchQuery,
    onToggleFavoriteRoomsOnly: () => setShowFavoriteRoomsOnly((isVisible) => !isVisible),
    onToggleSnapshotPreview: () => setShowSnapshotPreview((isVisible) => !isVisible),
    onToggleTalkSearch: handleToggleTalkSearch,
    onToggleTalksMenu: () => setIsTalksMenuOpen((isOpen) => !isOpen),
    showFavoriteRoomsOnly,
    showSnapshotPreview,
    soundMode,
    talkSearchQuery,
  };

  return (
    <section className="gp-sidebar-section gp-chats-rail-panel" aria-label="Chats BRVM">
      <div className="gp-chats-tabs" role="tablist" aria-label="Chats">
        {CHAT_TABS.map((tab) => renderTab(tab, activeTab, handleSelectTab))}
      </div>
      {activeTab === "public" ? renderPublicPanel(ticker, marketLabel, sector, publicPanelControls) : renderPrivatePanel()}
    </section>
  );
});

ChatsRailPanel.displayName = "ChatsRailPanel";
