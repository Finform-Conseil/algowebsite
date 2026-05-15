// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/hooks/useMasterRenderLoop.ts
// [TENOR 2026 SRE] SCAR-DOUBLE-RAF: Master Render Loop Orchestrator.
// Eradicates multiple concurrent requestAnimationFrame loops.
// Synchronizes all Canvas 2D rendering into a single VSync-aligned frame.
// Implements Frame Drop Monitoring (SRE Observability) and Stale Closure Protection.
// ================================================================================

import { useLayoutEffect, useRef } from "react";

export interface RenderFrameMeta {
  delta: number;
  isDegraded: boolean;
  subscriberCount: number;
}

export type RenderCallback = (time: number, meta: RenderFrameMeta) => void;

interface RenderSubscriber {
  callback: RenderCallback;
  label: string;
  lastDuration: number;
  maxDuration: number;
  totalDuration: number;
  calls: number;
}

const FRAME_DROP_THRESHOLD_MS = 34;
const SEVERE_FRAME_DROP_STREAK = 5;
const DEGRADATION_TRIGGER_MS = 50;
const DEGRADATION_WINDOW_MS = 700;
const SLOW_SUBSCRIBER_MS = 8;

/**
 * [TENOR 2026 HDR] Singleton Orchestrator
 * Manages a single requestAnimationFrame loop for the entire application.
 * O(1) subscription management via Set.
 */
class MasterRenderLoop {
  private subscribers: Map<RenderCallback, RenderSubscriber> = new Map();
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private consecutiveDrops: number = 0;
  private degradedUntil: number = 0;

  private getTopOffenders(): string {
    const offenders = Array.from(this.subscribers.values())
      .sort((a, b) => b.lastDuration - a.lastDuration)
      .slice(0, 3);

    if (offenders.length === 0) return "none";

    return offenders
      .map((item) => {
        const avg = item.calls > 0 ? item.totalDuration / item.calls : 0;
        return `${item.label} last=${item.lastDuration.toFixed(1)}ms avg=${avg.toFixed(1)}ms max=${item.maxDuration.toFixed(1)}ms`;
      })
      .join(" | ");
  }

  private getSlowestLastDuration(): number {
    let slowest = 0;
    this.subscribers.forEach((subscriber) => {
      slowest = Math.max(slowest, subscriber.lastDuration);
    });
    return slowest;
  }

  private getFrameDropDiagnosis(delta: number): string {
    const slowestSubscriber = this.getSlowestLastDuration();
    const subscriberSummary = this.getTopOffenders();

    if (slowestSubscriber < SLOW_SUBSCRIBER_MS) {
      return (
        `Likely external main-thread stall: frame gap=${delta.toFixed(1)}ms, ` +
        `slowest subscriber=${slowestSubscriber.toFixed(1)}ms. ` +
        `Subscribers: ${subscriberSummary}`
      );
    }

    return (
      `Likely slow RAF subscriber: frame gap=${delta.toFixed(1)}ms. ` +
      `Top subscribers: ${subscriberSummary}`
    );
  }

  private loop = (time: number) => {
    // [SRE] Frame Drop Monitor (Threshold: 33ms ≈ <30 FPS)
    const delta = this.lastFrameTime === 0 ? 16.7 : time - this.lastFrameTime;
    if (this.lastFrameTime !== 0) {
      if (delta > FRAME_DROP_THRESHOLD_MS) {
        this.consecutiveDrops++;
        if (delta > DEGRADATION_TRIGGER_MS) {
          this.degradedUntil = Math.max(this.degradedUntil, time + DEGRADATION_WINDOW_MS);
        }
        if (this.consecutiveDrops > SEVERE_FRAME_DROP_STREAK) {
          console.warn(`[SRE-RAF] Severe Frame Drop Detected. ${this.getFrameDropDiagnosis(delta)}`);
          this.consecutiveDrops = 0; // Reset after warning to avoid console spam
        }
      } else {
        this.consecutiveDrops = 0;
      }
    }
    this.lastFrameTime = time;

    const meta: RenderFrameMeta = {
      delta,
      isDegraded: time < this.degradedUntil,
      subscriberCount: this.subscribers.size,
    };

    // Execute all subscribers synchronously
    this.subscribers.forEach((subscriber) => {
      const startedAt = performance.now();
      try {
        subscriber.callback(time, meta);
      } catch (error) {
        // Isolate failures: One bad renderer shouldn't kill the master loop
        console.error(`[SRE-RAF] MasterRenderLoop callback exception in ${subscriber.label}:`, error);
      } finally {
        const duration = performance.now() - startedAt;
        subscriber.lastDuration = duration;
        subscriber.maxDuration = Math.max(subscriber.maxDuration, duration);
        subscriber.totalDuration += duration;
        subscriber.calls += 1;

        if (duration > SLOW_SUBSCRIBER_MS) {
          this.degradedUntil = Math.max(this.degradedUntil, time + DEGRADATION_WINDOW_MS);
        }
      }
    });

    // Continue loop if there are still subscribers
    if (this.subscribers.size > 0) {
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      this.rafId = null;
      this.lastFrameTime = 0;
    }
  };

  public subscribe(callback: RenderCallback, label = "anonymous"): () => void {
    // SSR Guard: Do nothing on the server
    if (typeof window === "undefined") {
      return () => {};
    }

    this.subscribers.set(callback, {
      callback,
      label,
      lastDuration: 0,
      maxDuration: 0,
      totalDuration: 0,
      calls: 0,
    });

    // Boot the loop if it's sleeping
    if (this.rafId === null) {
      this.lastFrameTime = 0;
      this.rafId = requestAnimationFrame(this.loop);
    }

    // Return cleanup function
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0 && this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.lastFrameTime = 0;
      }
    };
  }

  public getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

// Export the singleton instance for direct access if needed outside React
export const masterLoopInstance = new MasterRenderLoop();

/**
 * [TENOR 2026] React Hook for Master RAF Subscription.
 * Uses `useLayoutEffect` and a mutable `useRef` to guarantee Stale Closure Protection.
 * The callback inside the RAF will ALWAYS have access to the latest React state,
 * without needing to unsubscribe/resubscribe to the RAF loop on every render.
 * 
 * @param callback The render function to execute every frame.
 */
export const useMasterRenderLoop = (callback: RenderCallback, label = "anonymous") => {
  // 1. Store the latest callback in a ref
  const savedCallback = useRef<RenderCallback>(callback);

  // 2. Update the ref synchronously before the browser paints
  useLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 3. Subscribe to the master loop ONCE on mount
  useLayoutEffect(() => {
    const tick: RenderCallback = (time, meta) => {
      if (savedCallback.current) {
        savedCallback.current(time, meta);
      }
    };

    const unsubscribe = masterLoopInstance.subscribe(tick, label);

    // 4. Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [label]);
};

// --- EOF ---
