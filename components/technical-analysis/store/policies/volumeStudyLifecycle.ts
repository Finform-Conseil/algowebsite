import type { ChartAppearance, ChartState } from "../../config/state/chartStateTypes";

export interface VolumeStudyLifecycleInput {
  indicators: ChartState["indicators"];
  appearance: Pick<ChartAppearance, "showVolume">;
}

export interface VolumeStudyLifecycle {
  attached: boolean;
  studyVisible: boolean;
  outputEnabled: boolean;
  paneAttached: boolean;
  barsVisible: boolean;
}

/**
 * Pure lifecycle contract for native Volume.
 * Remove, Hide/Show and Settings > Style > Volume are orthogonal operations.
 */
export const resolveVolumeStudyLifecycle = ({
  indicators,
  appearance,
}: VolumeStudyLifecycleInput): VolumeStudyLifecycle => {
  const attached = indicators.volume === true;
  // Legacy persisted snapshots may not have volumeVisible yet; missing means visible.
  const studyVisibilityEnabled = indicators.volumeVisible !== false;
  const outputEnabled = appearance.showVolume === true;
  const studyVisible = attached && studyVisibilityEnabled;

  return {
    attached,
    studyVisible,
    outputEnabled,
    paneAttached: attached,
    barsVisible: studyVisible && outputEnabled,
  };
};
