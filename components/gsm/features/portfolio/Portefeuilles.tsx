import type { ManagedPortfolio } from './PortefeuillesModel';
import { Portefeuilles as PortfolioStateScreen } from './PortfolioStateScreen';

export interface PortefeuillesProps {
  clients: ManagedPortfolio[];
  openClient: (clientId: string) => void;
  initialFilter?: string | null;
  go?: (screen: string, context?: unknown) => void;
}

export function Portefeuilles({
  clients,
  openClient,
  initialFilter,
  go,
}: PortefeuillesProps) {
  void clients;

  return (
    <PortfolioStateScreen
      go={go}
      openClient={openClient}
      initialFilter={initialFilter}
    />
  );
}
