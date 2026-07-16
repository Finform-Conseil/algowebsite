import type React from "react";
import type { IndicatorObjectId } from "../../../config/object-tree/indicatorObjectVisibility";

type IndicatorsModalModule = typeof import("../indicators/IndicatorsModal");

export type IndicatorsModalComponent = React.ComponentType<{
  isOpen: boolean;
  onClose: () => void;
  initialScrollTop?: number;
  onScrollPositionChange?: (scrollTop: number) => void;
  onRevealObjectIds?: (objectIds: readonly IndicatorObjectId[]) => void;
}>;

let indicatorsModalLoadPromise: Promise<IndicatorsModalModule> | null = null;
let indicatorsModalLoadedModule: IndicatorsModalModule | null = null;

const importIndicatorsModal = () => import("../indicators/IndicatorsModal");

export const getPreloadedIndicatorsModalComponent = (): IndicatorsModalComponent | null => {
  return indicatorsModalLoadedModule?.IndicatorsModal as IndicatorsModalComponent | undefined ?? null;
};

export const resetIndicatorsModalPreload = () => {
  if (!indicatorsModalLoadedModule) {
    indicatorsModalLoadPromise = null;
  }
};

export const preloadIndicatorsModal = () => {
  if (indicatorsModalLoadedModule) {
    return Promise.resolve(indicatorsModalLoadedModule);
  }

  if (!indicatorsModalLoadPromise) {
    indicatorsModalLoadPromise = importIndicatorsModal()
      .then((loadedModule) => {
        indicatorsModalLoadedModule = loadedModule;
        return loadedModule;
      })
      .catch((error) => {
        indicatorsModalLoadPromise = null;
        throw error;
      });
  }

  return indicatorsModalLoadPromise;
};

export const loadIndicatorsModalComponent = async () => {
  const loadedModule = await preloadIndicatorsModal();
  return loadedModule.IndicatorsModal as IndicatorsModalComponent;
};
