import { fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow } from '../../shared/ui/UiAtoms';
import { C, F_DISPLAY } from '../../shared/theme/theme';

export function MoneyManagementSummary({
  currency,
  totalLiquidity,
  liquidityRatio,
  totalEntries30d,
  totalExits30d,
  forecastLiquidity,
  forecastLiquidityRatio,
  portfoliosBelowTarget,
}: {
  currency: string;
  totalLiquidity: number;
  liquidityRatio: number;
  totalEntries30d: number;
  totalExits30d: number;
  forecastLiquidity: number;
  forecastLiquidityRatio: number;
  portfoliosBelowTarget: number;
}) {
  return (
    <section className="gsm-money-summary">
      <div className="gsm-money-summary__heading">
        <div>
          <Eyebrow>1. Synthèse consolidée de la liquidité</Eyebrow>
          <div className="gsm-native-moneymanagementsummary-1a3d98e82" style={{ color: C.sub }}>
            Vue immédiate de la capacité de trésorerie actuelle et
            prévisionnelle des portefeuilles filtrés.
          </div>
        </div>
        <Badge tone={portfoliosBelowTarget > 0 ? 'coral' : 'teal'}>
          {portfoliosBelowTarget} sous cible
        </Badge>
      </div>

      <div className="gsm-money-summary__grid">
        <SummaryCard
          label="Liquidité disponible"
          value={`${fmt(Math.round(totalLiquidity))} ${currency}`}
          note={`${liquidityRatio.toFixed(1)}% de l'encours`}
        />
        <SummaryCard
          label="Encaissements à 30 j"
          value={`+${fmt(Math.round(totalEntries30d))} ${currency}`}
          note="Dividendes, coupons et flux entrants"
          valueColor={C.teal}
        />
        <SummaryCard
          label="Décaissements à 30 j"
          value={`-${fmt(Math.round(totalExits30d))} ${currency}`}
          note="Ordres ouverts et règlements attendus"
          valueColor={C.coral}
        />
        <SummaryCard
          label="Liquidité prévisionnelle"
          value={`${fmt(Math.round(forecastLiquidity))} ${currency}`}
          note={`${forecastLiquidityRatio.toFixed(1)}% de l'encours`}
        />
        <SummaryCard
          label="Portefeuilles à surveiller"
          value={String(portfoliosBelowTarget)}
          note="Sous la cible après flux à 30 jours"
          valueColor={portfoliosBelowTarget > 0 ? C.coral : C.teal}
          large
        />
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  note,
  valueColor = C.ink,
  large = false,
}: {
  label: string;
  value: string;
  note: string;
  valueColor?: string;
  large?: boolean;
}) {
  return (
    <Card className="gsm-money-summary__card">
      <div className="gsm-native-moneymanagementsummary-1a3d98e82" style={{ color: C.sub }}>{label}</div>
      <div
        className={`gsm-money-summary__value${large ? ' gsm-money-summary__value--large' : ''}`}
        style={{ ...F_DISPLAY, color: valueColor }}
      >
        {value}
      </div>
      <div className="gsm-money-summary__note" style={{ color: C.sub }}>{note}</div>
    </Card>
  );
}
