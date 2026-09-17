import { EngineV2MicroBenchmarkWorkbench } from "@/components/technical-analysis/engine-v2/EngineV2MicroBenchmarkWorkbench";
import { parseBenchmarkScenario } from "@/components/technical-analysis/engine-v2/benchmark/benchmarkScenario";

type EngineV2BenchmarkRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EngineV2BenchmarkRoute({ searchParams }: EngineV2BenchmarkRouteProps) {
  const initialScenario = parseBenchmarkScenario(await searchParams);

  return (
    <main style={{ minHeight: "100vh" }} data-engine-v2-isolated-benchmark="true">
      <EngineV2MicroBenchmarkWorkbench initialScenario={initialScenario} />
    </main>
  );
}
