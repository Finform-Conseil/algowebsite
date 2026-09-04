import type { ChartViewportChange } from "../useChartViewport";

export const VIEWPORT_CHANGE_COMMIT_IDLE_MS = 140;

export interface ViewportCommitTimer {
  set(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clear(timerId: ReturnType<typeof setTimeout>): void;
}

const defaultTimer: ViewportCommitTimer = {
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (timerId) => clearTimeout(timerId),
};

export const areViewportChangesEqual = (
  left: ChartViewportChange | null,
  right: ChartViewportChange | null,
): boolean => Boolean(
  left
  && right
  && left.startTime === right.startTime
  && left.endTime === right.endTime
  && left.yScale === right.yScale
  && left.isYManual === right.isYManual,
);

/**
 * Separates the 60fps imperative viewport from durable React/Redux persistence.
 * Wheel/pointer gestures may produce one viewport per animation frame. Persisting
 * every frame forces Redux, React reconciliation and IndexedDB work into the hot
 * render loop. The renderer stays immediate while this buffer commits only the
 * latest logical viewport once the gesture becomes idle.
 */
export class ViewportChangeCommitBuffer {
  private pending: ChartViewportChange | null = null;
  private lastCommitted: ChartViewportChange | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly commit: (viewport: ChartViewportChange) => void,
    private readonly idleMs = VIEWPORT_CHANGE_COMMIT_IDLE_MS,
    private readonly timer: ViewportCommitTimer = defaultTimer,
  ) {}

  schedule(viewport: ChartViewportChange): void {
    const snapshot = { ...viewport };
    if (areViewportChangesEqual(this.pending, snapshot)) return;
    if (!this.pending && areViewportChangesEqual(this.lastCommitted, snapshot)) return;

    this.pending = snapshot;
    if (this.timerId !== null) this.timer.clear(this.timerId);
    this.timerId = this.timer.set(() => {
      this.timerId = null;
      this.flush();
    }, this.idleMs);
  }

  flush(): void {
    if (this.timerId !== null) {
      this.timer.clear(this.timerId);
      this.timerId = null;
    }
    const pending = this.pending;
    this.pending = null;
    if (!pending || areViewportChangesEqual(this.lastCommitted, pending)) return;
    this.lastCommitted = { ...pending };
    this.commit({ ...pending });
  }

  reset(): void {
    if (this.timerId !== null) {
      this.timer.clear(this.timerId);
      this.timerId = null;
    }
    this.pending = null;
    this.lastCommitted = null;
  }

  cancel(): void {
    if (this.timerId !== null) this.timer.clear(this.timerId);
    this.timerId = null;
    this.pending = null;
  }
}
