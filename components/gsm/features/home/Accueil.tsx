import type { Navigate } from '../../shared/ui/Navigation';
import { Accueil as HomeMainScreen } from './HomeMainScreen';

export interface AccueilProps {
  go: Navigate;
  openClient: (
    clientId: string,
    reportOpen?: boolean,
    reportPeriod?: string
  ) => void;
  devise: string;
  onDeviseChange: (currency: string) => void;
  cessionRetraitEtats?: Array<Record<string, unknown>>;
  dependencies?: unknown;
}

export function Accueil({
  go,
  openClient,
  devise,
  onDeviseChange,
  cessionRetraitEtats = [],
}: AccueilProps) {
  return (
    <HomeMainScreen
      go={go}
      openClient={openClient}
      devise={devise}
      onDeviseChange={onDeviseChange}
      cessionRetraitEtats={cessionRetraitEtats}
    />
  );
}
