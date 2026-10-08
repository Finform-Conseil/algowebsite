import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readChartHistory, writeChartHistory } from "../config/persistence/chartHistoryRepository";

const DEFAULT_MAX_HISTORY_STATES = 100;
const DEFAULT_COMMIT_DELAY_MS = 220;

type HistoryEntry<T> = {
  snapshot: T;
  fingerprint: string;
  committedAt?: number;
  label?: string;
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
  persistenceScope?: string;
  validateSnapshot?: (value: unknown) => boolean;
  maxStates?: number;
  commitDelayMs?: number;
};

const fingerprintSnapshot = <T,>(snapshot: T): string => JSON.stringify(snapshot);
const MAX_PERSISTED_HISTORY_CHARS = 4_000_000;

const describeInteraction = (target: EventTarget | null): string => {
  if (!(target instanceof Element)) return "Modification du graphique";
  const control = target.closest("button, [role='button'], select, input, [data-name]");
  // Never persist text-field values or arbitrary text content.
  return (
    control?.getAttribute("aria-label")
    || control?.getAttribute("data-name")
    || control?.getAttribute("title")
    || "Modification du graphique"
  ).trim().slice(0, 120);
};

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
  persistenceScope,
  validateSnapshot,
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
  const persistenceReadyRef = useRef(false);
  const userTouchedRef = useRef(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const validateSnapshotRef = useRef(validateSnapshot);
  validateSnapshotRef.current = validateSnapshot;
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const durableRevisionByScopeRef = useRef(new Map<string, number>());
  const initializedScopeRef = useRef<string | undefined>(undefined);
  const lastActionLabelRef = useRef("Modification du graphique");
  const persistenceWarnedRef = useRef(false);
  const persistJournal = useCallback(() => {
    if (!persistenceScope || !persistenceReadyRef.current) return;
    let entries: HistoryEntry<T>[];
    try {
      entries = historyRef.current.map(entry => ({
        snapshot: structuredClone(entry.snapshot),
        fingerprint: entry.fingerprint,
        committedAt: entry.committedAt,
        label: entry.label,
      }));
    } catch (error) {
      console.warn("[TechnicalAnalysis] Undo journal serialization failed; in-memory history remains usable.", error);
      return;
    }
    let index = historyIndexRef.current;
    let estimatedChars = entries.reduce((sum, entry) => sum + entry.fingerprint.length * 2 + 256, 0);
    while (entries.length > 1 && estimatedChars > MAX_PERSISTED_HISTORY_CHARS) {
      const removeAt = index > 0 ? 0 : entries.length - 1;
      const [removed] = entries.splice(removeAt, 1);
      estimatedChars -= removed.fingerprint.length * 2 + 256;
      if (removeAt === 0) index -= 1;
    }
    if (estimatedChars > MAX_PERSISTED_HISTORY_CHARS) return;
    const journal = { version: 1 as const, scope: persistenceScope, index, entries };
    writeQueueRef.current = writeQueueRef.current.catch(() => undefined)
      .then(async () => {
        const expectedRevision = durableRevisionByScopeRef.current.get(persistenceScope) ?? 0;
        const nextRevision = await writeChartHistory(journal, expectedRevision);
        durableRevisionByScopeRef.current.set(persistenceScope, nextRevision);
      }).catch((error: unknown) => {
        if (persistenceWarnedRef.current) return;
        persistenceWarnedRef.current = true;
        console.warn("[TechnicalAnalysis] Undo history could not be persisted.", error);
      });
  }, [persistenceScope]);
  useEffect(() => {
    let cancelled = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    persistenceReadyRef.current = false;
    userTouchedRef.current = false;
    const switchedAnalysis = initializedScopeRef.current !== undefined
      && initializedScopeRef.current !== persistenceScope;
    initializedScopeRef.current = persistenceScope;
    // A different workspace scope must never inherit the preceding journal.
    historyRef.current = [];
    historyIndexRef.current = -1;
    interactionActiveRef.current = false;
    restoreTargetFingerprintRef.current = null;
    if (pendingCommitRef.current !== null) clearTimeout(pendingCommitRef.current);
    pendingCommitRef.current = null;
    setAvailability({ canUndo: false, canRedo: false });
    if (!persistenceScope) return;
    void readChartHistory<T>(persistenceScope, maxStates).then(saved => {
      if (cancelled) return;
      if (saved) durableRevisionByScopeRef.current.set(persistenceScope, saved.revision ?? 0);
      if (!saved || (validateSnapshotRef.current && !saved.entries.every(entry => validateSnapshotRef.current?.(entry.snapshot)))) {
        persistenceReadyRef.current = true;
        return;
      }
      // Let drawing/tool preferences and Redux rehydrate before resuming the
      // persisted workspace. Never overwrite a fresh interaction made meanwhile.
      resumeTimer = setTimeout(() => {
        if (cancelled) return;
        if (userTouchedRef.current) {
          persistenceReadyRef.current = true;
          return;
        }
        const active = saved.entries[saved.index];
        try {
          // Never overwrite an explicitly loaded analysis with a stale journal.
          if (switchedAnalysis && latestEntryRef.current.fingerprint !== active.fingerprint) {
            persistenceReadyRef.current = true;
            return;
          }
          if (latestEntryRef.current.fingerprint !== active.fingerprint) {
            restoreTargetFingerprintRef.current = active.fingerprint;
            restoreRef.current(active.snapshot);
            // Legacy journal fingerprints may not include newer layout fields.
            // Release the guard once the restored Redux state has settled.
            setTimeout(() => {
              if (!cancelled && restoreTargetFingerprintRef.current === active.fingerprint) {
                restoreTargetFingerprintRef.current = null;
              }
            }, 1000);
          }
          historyRef.current = saved.entries;
          historyIndexRef.current = saved.index;
          setAvailability({
            canUndo: saved.index > 0,
            canRedo: saved.index < saved.entries.length - 1,
          });
        } catch {
          restoreTargetFingerprintRef.current = null;
          historyRef.current = [];
          historyIndexRef.current = -1;
          setAvailability({ canUndo: false, canRedo: false });
        } finally {
          persistenceReadyRef.current = true;
        }
      }, 600);
    }).catch(() => {
      if (!cancelled) persistenceReadyRef.current = true;
    });
    return () => {
      cancelled = true;
      persistenceReadyRef.current = false;
      if (resumeTimer !== null) clearTimeout(resumeTimer);
    };
  }, [persistenceScope, maxStates]);

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
    const current = historyRef.current[historyIndexRef.current];
    historyRef.current[historyIndexRef.current] = {
      ...latest,
      committedAt: current?.committedAt,
      label: current?.label,
    };
  }, [syncAvailability]);

  const commitEntry = useCallback((entry: HistoryEntry<T>) => {
    const current = historyRef.current[historyIndexRef.current];
    if (current?.fingerprint === entry.fingerprint) {
      syncAvailability();
      return;
    }

    let nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push({
      ...entry,
      committedAt: Date.now(),
      label: lastActionLabelRef.current,
    });

    if (nextHistory.length > maxStates) {
      nextHistory = nextHistory.slice(nextHistory.length - maxStates);
    }

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    syncAvailability();
    persistJournal();
  }, [maxStates, syncAvailability, persistJournal]);

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

  const beginInteraction = useCallback((label?: string) => {
    userTouchedRef.current = true;
    if (label) lastActionLabelRef.current = label;
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
      beginInteraction(describeInteraction(event.target));
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
      beginInteraction("Action clavier");
      commitInteraction();
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isTextEditingTarget(event.target)) return;
      beginInteraction("Modification de paramètre");
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
    persistJournal();
    restore(entry.snapshot);
  }, [flushInteraction, restore, syncAvailability, persistJournal]);

  const redo = useCallback(() => {
    cancelPendingCommit();
    interactionActiveRef.current = false;
    if (historyIndexRef.current < 0 || historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current += 1;
    const entry = historyRef.current[historyIndexRef.current];
    restoreTargetFingerprintRef.current = entry.fingerprint;
    syncAvailability();
    persistJournal();
    restore(entry.snapshot);
  }, [cancelPendingCommit, restore, syncAvailability, persistJournal]);

  return {
    canUndo: availability.canUndo,
    canRedo: availability.canRedo,
    undo,
    redo,
  };
};
