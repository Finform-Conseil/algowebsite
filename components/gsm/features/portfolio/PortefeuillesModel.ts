import type { PortfolioClient } from '../../shared/types/domain.types.ts';

export interface ManagedPortfolio extends PortfolioClient {
  id: string;
  nom: string;
  type: string;
  marche: string;
  devise: string;
  encours: number;
  perf: number;
  risque: string;
  alertes: number;
  alloc: Record<string, number>;
  cible: Record<string, number>;
}

export interface ManagedPortfolioRow {
  client: ManagedPortfolio;
  maxAllocationGap: number;
}

export function maxAllocationGap(
  client: ManagedPortfolio
): number {
  const keys = Object.keys(client.alloc);

  if (keys.length === 0) return 0;

  return Math.max(
    ...keys.map((key) =>
      Math.abs(
        Number(client.alloc[key] || 0) -
          Number(client.cible[key] || 0)
      )
    )
  );
}

export function buildManagedPortfolioRows(
  clients: ManagedPortfolio[],
  query: string
): ManagedPortfolioRow[] {
  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase('fr');

  return clients
    .filter((client) =>
      client.nom
        .toLocaleLowerCase('fr')
        .includes(normalizedQuery)
    )
    .map((client) => ({
      client,
      maxAllocationGap: maxAllocationGap(client),
    }));
}
