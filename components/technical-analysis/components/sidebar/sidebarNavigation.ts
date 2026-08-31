export const TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE = "technical-analysis:sidebar-navigate";

export type TechnicalAnalysisSidebarDestination = "fundamentals" | "profile" | "news" | "calendar";

export const SIDEBAR_DESTINATION_TARGETS: Record<TechnicalAnalysisSidebarDestination, string | null> = {
  fundamentals: "gp-sidebar-fundamentals",
  profile: "gp-sidebar-profile",
  news: "gp-sidebar-news",
  calendar: null,
};

export const openTechnicalAnalysisSidebarDestination = (destination: TechnicalAnalysisSidebarDestination): void => {
  window.dispatchEvent(new CustomEvent(TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE, { detail: { destination } }));
};
