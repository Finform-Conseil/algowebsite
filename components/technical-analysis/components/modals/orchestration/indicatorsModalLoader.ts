import type React from "react";
import type { IndicatorObjectId } from "../../../config/object-tree/indicatorObjectVisibility";

type IndicatorsModalModule = typeof import("../indicators/IndicatorsModal");

let indicatorsModalLoadPromise: Promise<IndicatorsModalModule> | null = null;

export const preloadIndicatorsModal = () => {
  if (!indicatorsModalLoadPromise) {
    indicatorsModalLoadPromise = import("../indicators/IndicatorsModal");
  }

  return indicatorsModalLoadPromise;
};

export const loadIndicatorsModalComponent = async () => {
  const loadedModule = await preloadIndicatorsModal();
  return loadedModule.IndicatorsModal as React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    initialScrollTop?: number;
    onScrollPositionChange?: (scrollTop: number) => void;
    onRevealObjectIds?: (objectIds: readonly IndicatorObjectId[]) => void;
  }>;
};
