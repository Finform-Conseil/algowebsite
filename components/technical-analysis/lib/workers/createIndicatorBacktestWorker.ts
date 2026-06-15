export const createIndicatorBacktestWorker = (): Worker => (
  new Worker(new URL("./indicatorBacktest.worker.ts", import.meta.url), {
    name: "AlgowayIndicatorBacktestWorker",
    type: "module",
  })
);
