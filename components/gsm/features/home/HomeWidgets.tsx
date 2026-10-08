import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { fmt, fmtPrice } from '../../shared/lib/finance';
import { Card, Eyebrow, Pct } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_MONO, PALETTE } from '../../shared/theme/theme';

export interface DonutDatum {
  name: string;
  value: number;
  montant?: number;
  devise?: string;
  color?: string;
  [key: string]: unknown;
}

interface DonutProps {
  data: DonutDatum[];
  size?: number;
  onSliceClick?: (datum: DonutDatum) => void;
}

export function Donut({ data, size = 150, onSliceClick }: DonutProps) {
  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={size * 0.28}
          outerRadius={size * 0.46}
          paddingAngle={2}
          onClick={(_, index) => {
            const selected = data[index];
            if (selected) onSliceClick?.(selected);
          }}
          style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
        >
          {data.map((item: DonutDatum, i: number) => (
            <Cell
              key={i}
              fill={item?.color || PALETTE[i % PALETTE.length]}
              stroke="none"
              style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => `${v}%`}
          contentStyle={{
            borderRadius: 10,
            border: `1px solid ${C.line}`,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Legende({ data }: { data: DonutDatum[] }) {
  return (
    <div className="gsm-native-homewidgets-accf85b11">
      {data.map((d: DonutDatum, i: number) => (
        <div
          key={d.name}
          className="gsm-native-homewidgets-351198286"
          style={F_BODY}
        >
          <span
            className="gsm-native-homewidgets-4acbbb4f1"
            style={{ color: C.ink }}
          >
            <span
              className="gsm-native-homewidgets-0a84069d7"
              style={{
                background: d?.color || PALETTE[i % PALETTE.length],
              }}
            />
            <span className="gsm-native-homewidgets-415837836">{d.name}</span>
          </span>
          <span
            className="gsm-native-homewidgets-e8d456288"
            style={{ color: C.sub, ...F_MONO }}
          >
            <span className="gsm-native-homewidgets-1299817d9">{d.value}%</span>
            {typeof d.montant === 'number' && Number.isFinite(d.montant) && d.devise && (
              <span className="gsm-native-homewidgets-4980f0b01">
                {fmt(Math.round(d.montant))} {d.devise}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

const HISTORY_SERIES = [
  {
    dataKey: 'gestionTwr',
    label: 'Gestion globale (TWR)',
    color: C.navy,
  },
  {
    dataKey: 'brvm',
    label: 'BRVM Composite',
    color: C.gold,
  },
  {
    dataKey: 'ngxAsi',
    label: 'NGX ASI',
    color: C.teal,
  },
] as const;

type HistorySeriesKey =
  (typeof HISTORY_SERIES)[number]['dataKey'];

export function HistoryLegend({
  visibility,
  onToggle,
}: {
  visibility: Record<HistorySeriesKey, boolean>;
  onToggle: (dataKey: HistorySeriesKey) => void;
}) {
  return (
    <div
      className="gsm-native-homewidgets-ced4efd18"
      style={F_BODY}
    >
      {HISTORY_SERIES.map((series) => {
        const visible = visibility[series.dataKey];

        return (
          <button
            key={series.dataKey}
            type="button"
            onClick={() => onToggle(series.dataKey)}
            aria-pressed={visible}
            title={
              visible
                ? `Masquer ${series.label}`
                : `Afficher ${series.label}`
            }
            className="gsm-native-homewidgets-c5c96d83c"
            style={{
              color: visible ? C.ink : C.sub,
              opacity: visible ? 1 : 0.4,
              textDecoration: visible
                ? 'none'
                : 'line-through',
              cursor: 'pointer',
            }}
          >
            <span
              className="gsm-native-homewidgets-b03553573"
              style={{
                height: 3,
                background: series.color,
                opacity: visible ? 1 : 0.45,
              }}
            />
            {series.label}
          </button>
        );
      })}
    </div>
  );
}

export interface MarketTickerItem {
  nom: string;
  marche: string;
  devise: string;
  cours: number;
  variation: number;
  [key: string]: unknown;
}

export function MarketTicker({
  markets,
  onInstrumentClick,
  onViewAll,
}: {
  markets: MarketTickerItem[];
  onInstrumentClick?: (market: MarketTickerItem) => void;
  onViewAll?: () => void;
}) {
  const tickerMarkets = [...markets].sort(
    (a, b) => b.variation - a.variation
  );

  return (
    <Card className="gsm-native-homewidgets-78522c1d1">
      <div className="gsm-native-homewidgets-611d35245">
        <Eyebrow>Vue des Marchés</Eyebrow>
        <button
          type="button"
          onClick={onViewAll}
          className="gsm-native-homewidgets-53f9a94b5"
          style={{ color: C.navy }}
        >
          Voir tous les marchés →
        </button>
      </div>

      <div
        className="gsm-native-homewidgets-ed5549a58"
        style={{
          borderTop: `1px solid ${C.line}`,
          marginTop: 8,
        }}
      >
        <div
          className="gsm-native-homewidgets-39e6502e1"
          style={{
            animation: 'ticker-scroll 28s linear infinite',
          }}
        >
          {[...tickerMarkets, ...tickerMarkets].map(
            (market, index) => (
              <button
                key={`${market.nom}-${index}`}
                type="button"
                onClick={() =>
                  onInstrumentClick?.(market)
                }
                className="gsm-native-homewidgets-9f0ee3eaf"
                style={{ borderColor: C.line }}
                title={`Ouvrir ${market.nom} · ${market.marche}`}
              >
                <span
                  className="gsm-native-homewidgets-42a6bf231"
                  style={{
                    color: C.ink,
                    ...F_BODY,
                  }}
                >
                  {market.nom}
                </span>

                <span
                  className="gsm-native-homewidgets-51c9a3b2d"
                  style={{
                    ...F_MONO,
                    color: C.sub,
                  }}
                >
                  {fmtPrice(market.cours)} {market.devise} ·{' '}
                  {market.marche}
                </span>

                <Pct v={market.variation} />
              </button>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
