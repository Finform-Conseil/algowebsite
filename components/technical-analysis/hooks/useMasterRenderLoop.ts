// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/hooks/useMasterRenderLoop.ts
// [TENOR 2026 SRE] SCAR-DOUBLE-RAF: Master Render Loop Orchestrator.
// Eradicates multiple concurrent requestAnimationFrame loops.
// Synchronizes all Canvas 2D rendering into a single VSync-aligned frame.
// Implements Frame Drop Monitoring (SRE Observability) and Stale Closure Protection.
// ================================================================================

import { useLayoutEffect, useRef } from "react";

export type RenderCallback = (time: number) => void;

/**
 * [TENOR 2026 HDR] Singleton Orchestrator
 * Manages a single requestAnimationFrame loop for the entire application.
 * O(1) subscription management via Set.
 */
class MasterRenderLoop {
  private subscribers: Set<RenderCallback> = new Set();
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private consecutiveDrops: number = 0;

  private loop = (time: number) => {
    // [SRE] Frame Drop Monitor (Threshold: 33ms ≈ <30 FPS)
    if (this.lastFrameTime !== 0) {
      const delta = time - this.lastFrameTime;
      if (delta > 34) {
        this.consecutiveDrops++;
        if (this.consecutiveDrops > 5) {
          console.warn(`[SRE-RAF] Severe Frame Drop Detected: ${delta.toFixed(1)}ms. Canvas rendering is bottlenecking the main thread.`);
          this.consecutiveDrops = 0; // Reset after warning to avoid console spam
        }
      } else {
        this.consecutiveDrops = 0;
      }
    }
    this.lastFrameTime = time;

    // Execute all subscribers synchronously
    this.subscribers.forEach((callback) => {
      try {
        callback(time);
      } catch (error) {
        // Isolate failures: One bad renderer shouldn't kill the master loop
        console.error("[SRE-RAF] MasterRenderLoop callback exception:", error);
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

  public subscribe(callback: RenderCallback): () => void {
    // SSR Guard: Do nothing on the server
    if (typeof window === "undefined") {
      return () => {};
    }

    this.subscribers.add(callback);

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
export const useMasterRenderLoop = (callback: RenderCallback) => {
  // 1. Store the latest callback in a ref
  const savedCallback = useRef<RenderCallback>(callback);

  // 2. Update the ref synchronously before the browser paints
  useLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 3. Subscribe to the master loop ONCE on mount
  useLayoutEffect(() => {
    const tick: RenderCallback = (time) => {
      if (savedCallback.current) {
        savedCallback.current(time);
      }
    };

    const unsubscribe = masterLoopInstance.subscribe(tick);

    // 4. Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);
};

// --- EOF ---