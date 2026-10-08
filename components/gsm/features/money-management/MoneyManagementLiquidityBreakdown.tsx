import { Donut, Legende, type DonutDatum } from '../home/HomeWidgets';
import { Card, Eyebrow } from '../../shared/ui/UiAtoms';
import { C } from '../../shared/theme/theme';

const DIMENSIONS = [
  'Devise',
  'Marché',
  'Profil de risque',
  'Type de portefeuille',
] as const;

export type LiquidityDimension = (typeof DIMENSIONS)[number];

export function MoneyManagementLiquidityBreakdown({
  dimension,
  data,
  onDimensionChange,
}: {
  dimension: LiquidityDimension;
  data: DonutDatum[];
  onDimensionChange: (dimension: LiquidityDimension) => void;
}) {
  return (
    <section className="gsm-native-moneymanagementliquiditybreakdown-edd0c211b">
      <div className="gsm-native-moneymanagementliquiditybreakdown-3efc83993">
        <div>
          <Eyebrow>5. Répartition et concentration de la liquidité</Eyebrow>
          <div className="gsm-native-moneymanagementliquiditybreakdown-80979d478" style={{ color: C.sub }}>
            Analyse de la liquidité disponible selon les principales dimensions
            déjà utilisées dans la plateforme.
          </div>
        </div>
        <div className="gsm-chip-scroll">
          {DIMENSIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onDimensionChange(item)}
              className="gsm-native-moneymanagementliquiditybreakdown-5bbf782d3"
              style={{
                background: dimension === item ? C.activeBackground : C.surfaceInset,
                color: dimension === item ? C.textPrimary : C.sub,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <Card className="gsm-native-moneymanagementliquiditybreakdown-63800d71a">
        <div className="gsm-native-moneymanagementliquiditybreakdown-854853e9a">
          <div><Donut data={data} size={210} /></div>
          <div>
            <div className="gsm-native-moneymanagementliquiditybreakdown-c4184e4af" style={{ color: C.sub }}>
              Liquidité actuelle ventilée par {dimension.toLowerCase()}.
            </div>
            <Legende data={data} />
          </div>
        </div>
      </Card>
    </section>
  );
}
