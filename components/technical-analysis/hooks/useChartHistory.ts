import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_MAX_HISTORY_STATES = 100;
const DEFAULT_COMMIT_DELAY_MS = 220;

type HistoryEntry<T> = {
  snapshot: T;
  fingerprint: string;
};

export type ChartHistoryController = {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
};

type UseChartHistoryOptions<T> = {
  snapshot: T;
  restore: (snapshot: T) => void;
  /**
   * Fingerprint of state mutations that must become undoable once React has
   * actually observed the new state. Keeping this separate from the complete
   * snapshot prevents background/live-data renders from polluting history.
   */
  trackedMutationSignal?: string;
  maxStates?: number;
  commitDelayMs?: number;
};

const fingerprintSnapshot = <T,>(snapshot: T): string => JSON.stringify(snapshot);

const isHistoryControlTarget = (target: EventTarget | null): boolean => (
  target instanceof Element
  && Boolean(target.closest('[data-name="undo"], [data-name="redo"]'))
);

const isTextEditingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
};

export const useChartHistory = <T,>({
  snapshot,
  restore,
  trackedMutationSignal,
  maxStates = DEFAULT_MAX_HISTORY_STATES,
  commitDelayMs = DEFAULT_COMMIT_DELAY_MS,
}: UseChartHistoryOptions<T>): ChartHistoryController => {
  const fingerprint = useMemo(() => fingerprintSnapshot(snapshot), [snapshot]);
  const latestEntryRef = useRef<HistoryEntry<T>>({ snapshot, fingerprint });
  latestEntryRef.current = { snapshot, fingerprint };

  const historyRef = useRef<HistoryEntry<T>[]>([]);
  const historyIndexRef = useRef(-1);
  const interactionActiveRef = useRef(false);
  const pendingCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTargetFingerprintRef = useRef<string | null>(null);
  const trackedMutationSignalRef = useRef(trackedMutationSignal);
  const [availability, setAvailability] = useState({ canUndo: false, canRedo: false });

  const syncAvailability = useCallback(() => {
    const index = historyIndexRef.current;
    const length = historyRef.current.length;
    setAvailability({
      canUndo: index > 0,
      canRedo: index >= 0 && index < length - 1,
    });
  }, []);

  const ensureBaseline = useCallback(() => {
    const latest = latestEntryRef.current;
    if (historyIndexRef.current < 0 || historyRef.current.length === 0) {
      historyRef.current = [latest];
      historyIndexRef.current = 0;
      syncAvailability();
      return;
    }

    // Background hydration/live-data derived renders are not user history.
    // Before a new user transaction, fold them into the current baseline.
    historyRef.current[historyIndexRef.current] = latest;
  }, [syncAvailability]);

  const commitEntry = useCallback((entry: HistoryEntry<T>) => {
    const current = historyRef.current[historyIndexRef.current];
    if (current?.fingerprint === entry.fingerprint) {
      syncAvailability();
      return;
    }

    let nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(entry);

    if (nextHistory.length > maxStates) {
      nextHistory = nextHistory.slice(nextHistory.length - maxStates);
    }

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    syncAvailability();
  }, [maxStates, syncAvailability]);

  const cancelPendingCommit = useCallback(() => {
    if (pendingCommitRef.current !== null) {
      clearTimeout(pendingCommitRef.current);
      pendingCommitRef.current = null;
    }
  }, []);

  const flushPendingCommit = useCallback(() => {
    if (pendingCommitRef.current === null) return;
    clearTimeout(pendingCommitRef.current);
    pendingCommitRef.current = null;
    if (restoreTargetFingerprintRef.current !== null) return;
    commitEntry(latestEntryRef.current);
  }, [commitEntry]);

  const beginInteraction = useCallback(() => {
    if (restoreTargetFingerprintRef.current !== null) return;
    // Never discard a completed user mutation merely because another
    // interaction starts before the debounce timer expires.
    flushPendingCommit();
    ensureBaseline();
    interactionActiveRef.current = true;
  }, [ensureBaseline, flushPendingCommit]);

  const commitInteraction = useCallback(() => {
    if (!interactionActiveRef.current || restoreTargetFingerprintRef.current !== null) return;
    interactionActiveRef.current = false;
    cancelPendingCommit();
    pendingCommitRef.current = setTimeout(() => {
      pendingCommitRef.current = null;
      commitEntry(latestEntryRef.current);
    }, commitDelayMs);
  }, [cancelPendingCommit, commitDelayMs, commitEntry]);

  useEffect(() => {
    ensureBaseline();
  }, [ensureBaseline]);

  useEffect(() => {
    const previousSignal = trackedMutationSignalRef.current;
    trackedMutationSignalRef.current = trackedMutationSignal;

    if (trackedMutationSignal === undefined || previousSignal === trackedMutationSignal) return;
    if (restoreTargetFingerprintRef.current !== null) return;

    // Pointer-up can happen before a heavy indicator/playbook render has
    // produced its new Redux snapshot. Debounce from the observed mutation,
    // not from an arbitrary input-event timestamp.
    cancelPendingCommit();
    pendingCommitRef.current = setTimeout(() => {
      pendingCommitRef.current = null;
      if (restoreTargetFingerprintRef.current !== null) return;
      commitEntry(latestEntryRef.current);
    }, commitDelayMs);
  }, [cancelPendingCommit, commitDelayMs, commitEntry, trackedMutationSignal]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (isHistoryControlTarget(event.target)) return;
      beginInteraction();
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (isHistoryControlTarget(event.target)) return;
      commitInteraction();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const commandModifier = event.ctrlKey || event.metaKey;
      if (commandModifier && (key === "z" || key === "y")) return;
      if (isTextEditingTarget(event.target)) return;
      beginInteraction();
      commitInteraction();
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isTextEditingTarget(event.target)) return;
      beginInteraction();
    };
    const handleChange = () => commitInteraction();
    const handleFocusOut = () => commitInteraction();

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("change", handleChange, true);
    window.addEventListener("focusout", handleFocusOut, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("change", handleChange, true);
      window.removeEventListener("focusout", handleFocusOut, true);
    };
  }, [beginInteraction, commitInteraction]);

  useEffect(() => {
    const restoreTarget = restoreTargetFingerprintRef.current;
    if (restoreTarget !== null && restoreTarget === fingerprint) {
      restoreTargetFingerprintRef.current = null;
    }
  }, [fingerprint]);

  useEffect(() => () => cancelPendingCommit(), [cancelPendingCommit]);

  const flushInteraction = useCallback(() => {
    const shouldCommit = interactionActiveRef.current || pendingCommitRef.current !== null;
    cancelPendingCommit();
    interactionActiveRef.current = false;
    if (restoreTargetFingerprintRef.current !== null || !shouldCommit) return;
    commitEntry(latestEntryRef.current);
  }, [cancelPendingCommit, commitEntry]);

  const undo = useCallback(() => {
    flushInteraction();
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current -= 1;
    const entry = historyRef.current[historyIndexRef.current];
    restoreTargetFingerprintRef.current = entry.fingerprint;
    syncAvailability();
    restore(entry.snapshot);
  }, [flushInteraction, restore, syncAvailability]);

  const redo = useCallback(() => {
    cancelPendingCommit();
    interactionActiveRef.current = false;
    if (historyIndexRef.current < 0 || historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current += 1;
    const entry = historyRef.current[historyIndexRef.current];
    restoreTargetFingerprintRef.current = entry.fingerprint;
    syncAvailability();
    restore(entry.snapshot);
  }, [cancelPendingCommit, restore, syncAvailability]);

  return {
    canUndo: availability.canUndo,
    canRedo: availability.canRedo,
    undo,
    redo,
  };
};
