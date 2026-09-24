import type { EChartsInstance } from "../../lib/types/echarts";

export type IdleChartMutation = (chart: EChartsInstance) => void;

type EChartsMainProcessAware = {
  __flagInMainProcess?: boolean;
};

type PendingChartMutationQueue = {
  order: string[];
  tasks: Map<string, IdleChartMutation>;
  rafId: number | null;
};

const pendingQueues = new WeakMap<EChartsInstance, PendingChartMutationQueue>();

export const isEChartsMainProcessActive = (chart: EChartsInstance): boolean =>
  Boolean((chart as unknown as EChartsMainProcessAware).__flagInMainProcess);

const getQueue = (chart: EChartsInstance): PendingChartMutationQueue => {
  const existing = pendingQueues.get(chart);
  if (existing) return existing;

  const created: PendingChartMutationQueue = {
    order: [],
    tasks: new Map(),
    rafId: null,
  };
  pendingQueues.set(chart, created);
  return created;
};

const scheduleFlush = (chart: EChartsInstance, queue: PendingChartMutationQueue): void => {
  if (queue.rafId !== null || typeof requestAnimationFrame !== "function") return;
  queue.rafId = requestAnimationFrame(() => flushIdleChartMutations(chart, queue));
};

const flushIdleChartMutations = (chart: EChartsInstance, queue: PendingChartMutationQueue): void => {
  queue.rafId = null;

  if (chart.isDisposed()) {
    queue.order = [];
    queue.tasks.clear();
    return;
  }

  if (isEChartsMainProcessActive(chart)) {
    scheduleFlush(chart, queue);
    return;
  }

  const key = queue.order.shift();
  if (!key) return;

  const mutation = queue.tasks.get(key);
  queue.tasks.delete(key);
  if (mutation) mutation(chart);

  if (queue.order.length > 0) scheduleFlush(chart, queue);
};

/**
 * Schedules low-priority ECharts mutations that originate outside the canonical
 * renderer scheduler (for example cursor-title mirroring). Mutations are keyed,
 * latest-wins, and may only execute while ECharts is outside its main process.
 */
export const scheduleIdleChartMutation = (
  chart: EChartsInstance,
  key: string,
  mutation: IdleChartMutation,
): void => {
  if (chart.isDisposed()) return;

  const queue = getQueue(chart);
  if (!queue.tasks.has(key)) queue.order.push(key);
  queue.tasks.set(key, mutation);
  scheduleFlush(chart, queue);
};
