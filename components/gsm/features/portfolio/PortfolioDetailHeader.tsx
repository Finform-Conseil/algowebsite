import { Badge, Btn } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { C, F_BODY, F_DISPLAY } from '../../shared/theme/theme';

export interface PortfolioDetailHeaderClient {
  id: string;
  nom: string;
  type: string;
  marche: string;
  devise: string;
  risque: string;
}

export function PortfolioDetailHeader({
  client,
  rebalanceCount,
  reportPeriod,
  onReportPeriodChange,
  onRebalance,
  onGenerateReport,
}: {
  client: PortfolioDetailHeaderClient;
  rebalanceCount: number;
  reportPeriod: string;
  onReportPeriodChange: (period: string) => void;
  onRebalance: () => void;
  onGenerateReport: () => void;
}) {
  return (
    <>
      <Breadcrumb items={['Accueil', 'Portefeuilles', client.nom]} />
      <div className="gsm-native-portfoliodetailheader-4cb80da8e">
        <div>
          <h2 className="gsm-native-portfoliodetailheader-7c5ea464b" style={{ ...F_DISPLAY, color: C.ink }}>
            {client.nom}
          </h2>
          <div className="gsm-native-portfoliodetailheader-306abb4cd">
            <Badge tone="navy">{client.type}</Badge>
            <Badge tone="navy">{client.marche} · {client.devise}</Badge>
            <Badge tone="slate">Risque {client.risque}</Badge>
          </div>
        </div>
        <div className="gsm-native-portfoliodetailheader-90c77c656">
          {rebalanceCount > 0 ? (
            <Btn tone="ghost" onClick={onRebalance}>
              Voir {rebalanceCount} écart(s) → Rééquilibrage
            </Btn>
          ) : (
            <Badge tone="teal">Allocation conforme — aucun rééquilibrage</Badge>
          )}
          <div className="gsm-native-portfoliodetailheader-90c77c656">
            <select name="gsm-portfoliodetailheader-52"
              value={reportPeriod}
              onChange={(event) => onReportPeriodChange(event.target.value)}
              className="gsm-native-portfoliodetailheader-36f79f93a"
              style={{ borderColor: C.line, ...F_BODY }}
              aria-label="Période du rapport du portefeuille"
              title="Définir la période du rapport"
            >
              <option>Trimestre en cours</option>
              <option>Année en cours</option>
              <option>Personnalisée</option>
            </select>
            <Btn onClick={onGenerateReport}>Générer rapport</Btn>
          </div>
        </div>
      </div>
    </>
  );
}
