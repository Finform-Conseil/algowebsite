import type { IDrawingStrategy } from "./interfaces/IDrawingStrategy";
import { LineMeasureStrategy } from "./implementations/LineMeasureStrategy";
import { FibonacciStrategy } from "./implementations/FibonacciStrategy";
import { PitchforkStrategy } from "./implementations/PitchforkStrategy";
import { ChannelsStrategy } from "./implementations/ChannelsStrategy";
import { GannStrategy } from "./implementations/GannStrategy";
import { AdvancedToolsStrategy } from "./implementations/AdvancedToolsStrategy";
import { ChartPatternsStrategy } from "./implementations/ChartPatternsStrategy";
import { ForecastingStrategy } from "./implementations/ForecastingStrategy";

/**
 * Strategy Registry - lazy instance construction.
 * Strategy modules are imported eagerly; only strategy instances and the lookup Map
 * are created on the first render or hit-test request.
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