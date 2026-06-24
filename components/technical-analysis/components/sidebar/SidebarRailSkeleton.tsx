"use client";

import React from "react";

const SKELETON_TOP_COUNT = 4;
const SKELETON_BOTTOM_COUNT = 5;

const RailSkeletonBlock: React.FC = () => (
  <span
    className="is-loading-skeleton gp-toolbar-btn gp-sidebar-rail-btn"
    aria-hidden="true"
    style={{
      display: "block",
      width: "var(--gp-toolbar-btn-size, 32px)",
      height: "var(--gp-toolbar-btn-size, 32px)",
      borderRadius: "var(--gp-radius-sm, 6px)",
      flexShrink: 0,
    }}
  />
);

export const SidebarRailSkeleton: React.FC = () => (
  <div className="gp-toolbar-scroll-container gp-sidebar-rail p-1" aria-busy="true" aria-label="Chargement des panneaux BRVM">
    {Array.from({ length: SKELETON_TOP_COUNT }, (_, i) => (
      <RailSkeletonBlock key={`top-${i}`} />
    ))}
    <div className="gp-sidebar-rail-spacer" aria-hidden="true" />
    {Array.from({ length: SKELETON_BOTTOM_COUNT }, (_, i) => (
      <RailSkeletonBlock key={`bottom-${i}`} />
    ))}
    <RailSkeletonBlock />
  </div>
);

export default SidebarRailSkeleton;
