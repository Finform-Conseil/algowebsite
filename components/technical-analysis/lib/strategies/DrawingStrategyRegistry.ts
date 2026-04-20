// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/DrawingStrategyRegistry.ts
import { IDrawingStrategy } from "./interfaces/IDrawingStrategy";
import { LineMeasureStrategy } from "./implementations/LineMeasureStrategy";
import { FibonacciStrategy } from "./implementations/FibonacciStrategy";
import { PitchforkStrategy } from "./implementations/PitchforkStrategy";
import { ChannelsStrategy } from "./implementations/ChannelsStrategy";
import { GannStrategy } from "./implementations/GannStrategy";
import { AdvancedToolsStrategy } from "./implementations/AdvancedToolsStrategy";
import { ChartPatternsStrategy } from "./implementations/ChartPatternsStrategy";
import { ForecastingStrategy } from "./implementations/ForecastingStrategy";

/**
 * [TENOR 2026 HDR] Strategy Registry - Lazy Initialization Pattern
 * Optimise le Time To Interactive (TTI) en différant l'instanciation des stratégies
 * et la construction de la Map jusqu'au premier besoin réel de rendu ou de hit-test.
 * Éradique l'Eager Loading au démarrage de l'application.
 */
class StrategyRegistry {
  private strategies: Map<string, IDrawingStrategy> | null = null;

  /**
   * Initialisation paresseuse (JIT - Just In Time).
   * N'est appelée que lors du premier accès au registre.
   */
  private initialize(): Map<string, IDrawingStrategy> {
    const map = new Map<string, IDrawingStrategy>();
    
    const register = (strategy: IDrawingStrategy) => {
      const tools = strategy.supportedTools;
      for (let i = 0; i < tools.length; i++) {
        map.set(tools[i], strategy);
      }
    };

    // Instanciation différée des stratégies
    register(new LineMeasureStrategy());
    register(new FibonacciStrategy());
    register(new PitchforkStrategy());
    register(new ChannelsStrategy());
    register(new GannStrategy());
    register(new AdvancedToolsStrategy());
    register(new ChartPatternsStrategy());
    register(new ForecastingStrategy());

    return map;
  }

  /**
   * Récupère la stratégie associée à un outil.
   * Initialise le registre silencieusement si c'est le premier appel.
   */
  getStrategy(toolType: string): IDrawingStrategy | undefined {
    if (this.strategies === null) {
      this.strategies = this.initialize();
    }
    return this.strategies.get(toolType);
  }
}

// Export d'un singleton paresseux (Lazy Singleton)
export const drawingStrategyRegistry = new StrategyRegistry();
// --- EOF ---