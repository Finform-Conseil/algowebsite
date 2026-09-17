export const BENCHMARK_ENGINE_IDS = [
  "legacy-echarts",
  "vela-canvas2d",
  "vela-webgl2",
] as const;

export const BENCHMARK_CHART_COUNTS = [1, 2, 4] as const;
export const BENCHMARK_LOAD_SIZES = [1_000, 10_000, 50_000, 100_000] as const;

export type BenchmarkEngine = (typeof BENCHMARK_ENGINE_IDS)[number];
export type BenchmarkChartCount = (typeof BENCHMARK_CHART_COUNTS)[number];
export type BenchmarkLoadSize = (typeof BENCHMARK_LOAD_SIZES)[number];

export interface BenchmarkScenario {
  engine: BenchmarkEngine;
  chartCount: BenchmarkChartCount;
  loadSize: BenchmarkLoadSize;
}

export type BenchmarkScenarioQuery = Readonly<Record<string, string | string[] | undefined>>;

export const DEFAULT_BENCHMARK_SCENARIO: BenchmarkScenario = Object.freeze({
  engine: "legacy-echarts",
  chartCount: 1,
  loadSize: 1_000,
});

const firstQueryValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const isBenchmarkEngine = (value: string | undefined): value is BenchmarkEngine =>
  BENCHMARK_ENGINE_IDS.includes(value as BenchmarkEngine);

const parseChartCount = (value: string | undefined): BenchmarkChartCount => {
  const parsed = Number(value);
  return BENCHMARK_CHART_COUNTS.includes(parsed as BenchmarkChartCount)
    ? parsed as BenchmarkChartCount
    : DEFAULT_BENCHMARK_SCENARIO.chartCount;
};

const parseLoadSize = (value: string | undefined): BenchmarkLoadSize => {
  const parsed = Number(value);
  return BENCHMARK_LOAD_SIZES.includes(parsed as BenchmarkLoadSize)
    ? parsed as BenchmarkLoadSize
    : DEFAULT_BENCHMARK_SCENARIO.loadSize;
};

export const parseBenchmarkScenario = (query: BenchmarkScenarioQuery): BenchmarkScenario => {
  const engineValue = firstQueryValue(query.engine);
  return {
    engine: isBenchmarkEngine(engineValue) ? engineValue : DEFAULT_BENCHMARK_SCENARIO.engine,
    chartCount: parseChartCount(firstQueryValue(query.charts)),
    loadSize: parseLoadSize(firstQueryValue(query.bars)),
  };
};

export const benchmarkScenarioSearchParams = (scenario: BenchmarkScenario): URLSearchParams => {
  const params = new URLSearchParams();
  params.set("engine", scenario.engine);
  params.set("charts", String(scenario.chartCount));
  params.set("bars", String(scenario.loadSize));
  return params;
};
