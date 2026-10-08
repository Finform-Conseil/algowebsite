import { fmt } from '../../shared/lib/finance';
import { Card, Eyebrow, Pct } from '../../shared/ui/UiAtoms';
import { C, F_BODY } from '../../shared/theme/theme';

export interface PortfolioReportSummary {
  nom: string;
  encours: number;
  devise: string;
  perf: number;
  rentabilite: number;
}

export function PortfolioReportNoticeCard({
  visible,
  client,
  period,
  profitabilityComment,
}: {
  visible: boolean;
  client: PortfolioReportSummary;
  period: string;
  profitabilityComment: string;
}) {
  if (!visible) return null;

  const periodVariation = Math.round(
    client.encours - client.encours / (1 + client.perf / 100)
  );

  return (
    <Card className="gsm-native-portfolioreportnoticecard-37ccb28d4" style={{ borderColor: C.borderSubtle }}>
      <Eyebrow>
        Rapport d'analyse — {client.nom} · {period}
      </Eyebrow>

      <div className="gsm-native-portfolioreportnoticecard-c24683aa3" style={F_BODY}>
        <ReportMetric
          label="Situation globale"
          value={`${fmt(client.encours)} ${client.devise}`}
        />
        <div>
          <div className="gsm-native-portfolioreportnoticecard-10df81a5e" style={{ color: C.sub }}>
            Variation période
          </div>
          <div className="gsm-native-portfolioreportnoticecard-4289ef100">
            {fmt(periodVariation)} {client.devise}{' '}
            <Pct v={client.perf} />
          </div>
        </div>
        <div>
          <div className="gsm-native-portfolioreportnoticecard-10df81a5e" style={{ color: C.sub }}>
            Rentabilité période
          </div>
          <div className="gsm-native-portfolioreportnoticecard-4289ef100">
            <Pct v={client.rentabilite} />
          </div>
        </div>
      </div>

      <div className="gsm-native-portfolioreportnoticecard-443becc7a" style={F_BODY}>
        <ReportMetric label="Acquisitions" value="3 opérations" />
        <ReportMetric label="Cessions / Encaiss." value="2 opérations" />
        <ReportMetric label="Retenues" value="Fiscalité sur coupons" />
      </div>

      <div
        className="gsm-native-portfolioreportnoticecard-7ec0120c3"
        style={{
          borderTop: `1px solid ${C.borderSubtle}`,
          color: C.sub,
        }}
      >
        <b style={{ color: C.ink }}>Commentaire de Gestion :</b> la performance de la période reflète
        principalement le renforcement de la ligne Télécoms et
        l'encaissement d'un coupon obligataire ; l'écart d'allocation
        Actions reste au-dessus de la cible et justifie un arbitrage.
      </div>

      <div className="gsm-native-portfolioreportnoticecard-44fa16b40" style={{ color: C.sub }}>
        <b style={{ color: C.ink }}>Commentaire (rentabilité) :</b>{' '}
        {profitabilityComment}
      </div>
    </Card>
  );
}

function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="gsm-native-portfolioreportnoticecard-10df81a5e" style={{ color: C.sub }}>
        {label}
      </div>
      <div className="gsm-native-portfolioreportnoticecard-4289ef100">{value}</div>
    </div>
  );
}
