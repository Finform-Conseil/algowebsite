// ================================================================================
// FICHIER : src/shared/utils/circuit-breaker.ts
// RÔLE : CIRCUIT BREAKER POUR PROTECTION CONTRE LES PANNES D'API
// NIVEAU : HDR (Habilitation à Diriger des Recherches) - Production Grade
// ================================================================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number; // Nombre d'échecs avant ouverture (défaut: 5)
  resetTimeout: number; // Délai avant tentative de récupération en ms (défaut: 30000)
  halfOpenMaxAttempts: number; // Nombre de tentatives en HALF_OPEN (défaut: 1)
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  rejectedRequests: number;
  lastFailureTime: number | null;
  lastStateChange: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private nextAttemptTime = 0;
  private halfOpenAttempts = 0;

  private metrics: CircuitMetrics = {
    failures: 0,
    successes: 0,
    rejectedRequests: 0,
    lastFailureTime: null,
    lastStateChange: Date.now(),
  };

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 secondes
      halfOpenMaxAttempts: 1,
    }
  ) { }

  /**
   * Exécute une fonction avec protection du circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Vérifier si on peut tenter la requête
    if (!this.canAttempt()) {
      this.metrics.rejectedRequests++;
      throw new Error(
        `Circuit breaker is OPEN for '${this.name}'. API is temporarily unavailable.`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Détermine si une requête peut être tentée.
   * [TENOR 2026 FIX] SCAR-119: Synchronous State Mutation
   * L'incrémentation de halfOpenAttempts DOIT se faire ici de manière synchrone
   * pour éviter le problème du "Thundering Herd" (troupeau foudroyant) où des
   * requêtes concurrentes passeraient toutes la condition avant que la première
   * n'ait eu le temps de répondre.
   */
  private canAttempt(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Vérifier si le timeout de reset est écoulé
        if (now >= this.nextAttemptTime) {
          this.transitionTo('HALF_OPEN');
          // C'est la première requête de sonde (probe)
          this.halfOpenAttempts++;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        // Limiter le nombre de tentatives en HALF_OPEN
        if (this.halfOpenAttempts < this.config.halfOpenMaxAttempts) {
          this.halfOpenAttempts++; // [CRITICAL FIX] Incrémentation manquante
          return true;
        }
        return false;
    }
  }

  /**
   * Gère un succès de requête
   */
  private onSuccess(): void {
    this.metrics.successes++;
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      console.log(`[CIRCUIT_BREAKER] '${this.name}' recovered. Closing circuit.`);
      this.transitionTo('CLOSED');
    }
  }

  /**
   * Gère un échec de requête
   */
  private onFailure(): void {
    this.failures++;
    this.metrics.failures++;
    this.metrics.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      console.warn(`[CIRCUIT_BREAKER] '${this.name}' still failing. Re-opening circuit.`);
      this.transitionTo('OPEN');
      return;
    }

    if (this.state === 'CLOSED' && this.failures >= this.config.failureThreshold) {
      console.error(
        `[CIRCUIT_BREAKER] '${this.name}' failure threshold reached (${this.failures}/${this.config.failureThreshold}). Opening circuit.`
      );
      this.transitionTo('OPEN');
    }
  }

  /**
   * Change l'état du circuit
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.metrics.lastStateChange = Date.now();

    switch (newState) {
      case 'OPEN':
        this.nextAttemptTime = Date.now() + this.config.resetTimeout;
        break;
      case 'HALF_OPEN':
        this.halfOpenAttempts = 0;
        break;
      case 'CLOSED':
        this.failures = 0;
        this.halfOpenAttempts = 0;
        break;
    }

    console.log(
      `[CIRCUIT_BREAKER] '${this.name}' transitioned: ${oldState} → ${newState}`
    );
  }

  /**
   * Obtenir l'état actuel du circuit
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Obtenir les métriques du circuit
   */
  getMetrics(): Readonly<CircuitMetrics> {
    return { ...this.metrics };
  }

  /**
   * Réinitialiser le circuit manuellement (pour les tests)
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttemptTime = 0;
    this.halfOpenAttempts = 0;
    this.metrics = {
      failures: 0,
      successes: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastStateChange: Date.now(),
    };
  }
}

// ================================================================================
// SINGLETON PAR API TARGET
// ================================================================================
// Note de sécurité : Les clés utilisées ici (apiIdentifier) sont strictement 
// bornées (ex: '1', '2', '9') par le proxy. Il n'y a pas de risque de fuite 
// de mémoire (Memory Leak) par accumulation de clés dynamiques infinies.
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Obtenir ou créer un circuit breaker pour une API spécifique
 */
export function getCircuitBreaker(
  apiIdentifier: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(apiIdentifier)) {
    circuitBreakers.set(
      apiIdentifier,
      new CircuitBreaker(apiIdentifier, config as CircuitBreakerConfig)
    );
  }
  return circuitBreakers.get(apiIdentifier)!;
}