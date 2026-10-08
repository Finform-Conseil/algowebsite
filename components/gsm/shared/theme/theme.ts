import type { CSSProperties } from 'react';

export const C = {
  // FINFORM semantic runtime contract.
  // Root source: src/styles/finform/_runtime.scss, synchronized from
  // algowebsite/styles/abstracts/_variables.scss.
  surfacePage: 'var(--surface-page)',
  surfaceCard: 'var(--surface-card)',
  surfaceToolbar: 'var(--surface-toolbar)',
  surfaceInset: 'var(--surface-inset)',
  surfaceElevated: 'var(--surface-elevated)',
  rowAlternate: 'var(--row-alternate-background)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border-color)',
  borderSubtle: 'var(--border-subtle)',
  activeBackground: 'var(--active-background)',
  focusRing: 'var(--focus-ring-color)',
  positiveBackground: 'var(--status-positive-bg)',
  positiveBorder: 'var(--status-positive-border)',
  negativeBackground: 'var(--status-negative-bg)',
  negativeBorder: 'var(--status-negative-border)',
  warningBackground: 'var(--status-warning-bg)',
  warningBorder: 'var(--status-warning-border)',
  warningText: 'var(--status-warning-text)',
  infoBackground: 'var(--status-info-bg)',
  infoBorder: 'var(--status-info-border)',
  onPrimary: 'var(--text-on-primary)',
  onAccent: 'var(--text-on-accent)',
  onPositive: 'var(--text-on-positive)',
  onNegative: 'var(--text-on-negative)',
  sidebarBackground: 'var(--gsm-sidebar-background)',
  sidebarText: 'var(--gsm-sidebar-text)',
  sidebarTextStrong: 'var(--gsm-sidebar-text-strong)',
  sidebarTextSoft: 'var(--gsm-sidebar-text-soft)',
  sidebarMuted: 'var(--gsm-sidebar-muted)',
  sidebarMeta: 'var(--gsm-sidebar-meta)',
  sidebarBorder: 'var(--gsm-sidebar-border)',
  sidebarSurfaceHover: 'var(--gsm-sidebar-surface-hover)',
  sidebarSurfaceActive: 'var(--gsm-sidebar-surface-active)',
  sidebarCardBackground: 'var(--gsm-sidebar-card-bg)',
  sidebarCardBorder: 'var(--gsm-sidebar-card-border)',
  sidebarControlBackground: 'var(--gsm-sidebar-control-bg)',
  sidebarFocusRing: 'var(--gsm-sidebar-focus-ring)',
  sidebarManagerBackground: 'var(--gsm-sidebar-manager-bg)',
  sidebarManagerBorder: 'var(--gsm-sidebar-manager-border)',
  sidebarClientBackground: 'var(--gsm-sidebar-client-bg)',
  sidebarClientBorder: 'var(--gsm-sidebar-client-border)',
  sidebarPositive: 'var(--gsm-sidebar-positive)',
  sidebarPositiveSoft: 'var(--gsm-sidebar-positive-soft)',
  sidebarWarningSoft: 'var(--gsm-sidebar-warning-soft)',
  sidebarNegativeSoft: 'var(--gsm-sidebar-negative-soft)',
  sidebarWriteBackground: 'var(--gsm-sidebar-write-bg)',
  sidebarAdminBackground: 'var(--gsm-sidebar-admin-bg)',
  chartSeriesMuted: 'var(--chart-series-muted)',
  chartSeriesViolet: 'var(--chart-series-violet)',
  chartSeriesBlue: 'var(--chart-series-blue)',
  chartSeriesBronze: 'var(--chart-series-bronze)',

  // Compatibility aliases kept while feature modules are migrated.
  navy: 'var(--text-primary)',
  navySurface: 'var(--surface-page)',
  navySoft: 'var(--surface-elevated)',
  ink: 'var(--text-primary)',
  sub: 'var(--text-secondary)',
  bg: 'var(--surface-page)',
  card: 'var(--surface-card)',
  line: 'var(--border-color)',
  gold: 'var(--accent-gold)',
  teal: 'var(--positive-color)',
  coral: 'var(--negative-color)',
  indigo: 'var(--primary-color)',
} as const;

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
`;

export const F_DISPLAY: CSSProperties = {
  fontFamily: 'var(--font-fraunces)',
};

export const F_BODY: CSSProperties = {
  fontFamily: 'var(--font-family-ui)',
};

export const F_MONO: CSSProperties = {
  fontFamily: 'var(--font-dm-mono)',
};

export const PALETTE = [
  C.navy,
  C.gold,
  C.teal,
  C.indigo,
  C.coral,
  C.textMuted,
] as const;
