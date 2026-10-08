import { convertCurrency, fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow } from '../../shared/ui/UiAtoms';
import { C, F_MONO } from '../../shared/theme/theme';

export interface MarketVolumeDatum {
  marche: string;
  type: 'Action' | 'Obligation' | string;
  volume: number;
  devise: string;
}

export function MarketVolumeCard({
  exchanges,
  volumeData,
  currencies,
  selectedCurrencies,
  onCurrencyChange,
}: {
  exchanges: string[];
  volumeData: MarketVolumeDatum[];
  currencies: string[];
  selectedCurrencies: Record<string, string>;
  onCurrencyChange: (exchange: string, currency: string) => void;
}) {
  return (
    <Card className="gsm-native-marketvolumecard-7c0f7188d">
      <div className="gsm-responsive-header gsm-native-marketvolumecard-058691d0b">
        <Eyebrow>Volume d'échange du jour — marchés</Eyebrow>
        <span className="gsm-native-marketvolumecard-a8a301614" style={{ color: C.sub }}>
          Devise d'affichage réglable par bourse
        </span>
      </div>

      <div className="gsm-native-marketvolumecard-e4fe30d3a">
        {exchanges.map((exchange) => {
          const action = volumeData.find(
            (item) =>
              item.marche === exchange && item.type === 'Action'
          );
          const bond = volumeData.find(
            (item) =>
              item.marche === exchange &&
              item.type === 'Obligation'
          );
          const targetCurrency = selectedCurrencies[exchange];

          if (!action || !bond || !targetCurrency) {
            return null;
          }

          return (
            <div
              key={exchange}
              className="gsm-native-marketvolumecard-d80e5f00d"
              style={{ borderColor: C.line }}
            >
              <div className="gsm-responsive-inline-row gsm-native-marketvolumecard-f2689505c">
                <Badge tone="navy">{exchange}</Badge>
                <select name="gsm-marketvolumecard-59" aria-label="Sélection marketvolumecard"
                  value={targetCurrency}
                  onChange={(event) =>
                    onCurrencyChange(
                      exchange,
                      event.target.value
                    )
                  }
                  className="gsm-native-marketvolumecard-8129d2631"
                  style={{ borderColor: C.line }}
                >
                  {currencies.map((currency) => (
                    <option key={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div className="gsm-native-marketvolumecard-a8a301614" style={{ color: C.sub }}>
                Actions
              </div>
              <div
                className="gsm-native-marketvolumecard-18923eda1"
                style={F_MONO}
              >
                {fmt(
                  Math.round(
                    convertCurrency(
                      action.volume,
                      action.devise,
                      targetCurrency
                    )
                  )
                )}{' '}
                {targetCurrency}
              </div>

              <div className="gsm-native-marketvolumecard-a8a301614" style={{ color: C.sub }}>
                Obligations
              </div>
              <div className="gsm-native-marketvolumecard-70f727093" style={F_MONO}>
                {fmt(
                  Math.round(
                    convertCurrency(
                      bond.volume,
                      bond.devise,
                      targetCurrency
                    )
                  )
                )}{' '}
                {targetCurrency}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
