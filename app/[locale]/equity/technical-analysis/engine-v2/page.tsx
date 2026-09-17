import { TechnicalAnalysisProviderTree } from "@/components/technical-analysis/context/TechnicalAnalysisProviders";
import { EngineV2BenchmarkWorkbench } from "@/components/technical-analysis/engine-v2/EngineV2BenchmarkWorkbench";
import { parseBenchmarkScenario } from "@/components/technical-analysis/engine-v2/benchmark/benchmarkScenario";

type EngineV2RouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TechnicalAnalysisEngineV2Route({ searchParams }: EngineV2RouteProps) {
  const initialScenario = parseBenchmarkScenario(await searchParams);
  return (
    <main style={{ minHeight: "100vh" }}>
      <TechnicalAnalysisProviderTree>
        <EngineV2BenchmarkWorkbench initialScenario={initialScenario} />
      </TechnicalAnalysisProviderTree>
    </main>
  );
}
