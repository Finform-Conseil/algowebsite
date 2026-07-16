export const horizontalToolbarClassNames = [
  "gp-horizontal-toolbar",
  "prepare-animation",
  "gsap-target-toolbar",
  "animated-element",
] as const;

export const toolbarButtonClassNames = ["gp-toolbar-btn", "hover-lift"] as const;

export const toolbarSecondaryButtonClassNames = [
  ...toolbarButtonClassNames,
  "text-secondary",
] as const;

export const publishButtonClassNames = [
  "btn btn-sm rounded-pill flex-shrink-0 d-flex align-items-center justify-content-center",
  "btn-publish",
  "hover-lift",
  "gp-hide-on-small",
] as const;
