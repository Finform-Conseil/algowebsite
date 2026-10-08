import type { ComponentProps, ReactNode } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt } from '../../shared/lib/finance';
import { HistoryLegend } from './HomeWidgets';
import { Badge, Btn, Card, Eyebrow } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_MONO } from '../../shared/theme/theme';

type HistoricalDot = ComponentProps<typeof Line>['dot'];

export interface PerformanceHistoryPoint {
  mois: string;
  gestionTwr: number;
  brvm: number;
  ngxAsi: number;
  encoursBrut: number;
  fluxNet: number;
  evenements?: unknown;
  [key: string]: unknown;
}

export interface PerformanceHistoryVisibility {
  gestionTwr: boolean;
  brvm: boolean;
  ngxAsi: boolean;
}

export function HomePerformanceHistory({
  currency,
  history,
  managementPerformance,
  brvmPerformance,
  ngxPerformance,
  netClientFlows,
  visibility,
  eventTypes,
  eventColor,
  dot,
  onToggleSeries,
  onOpenCurrencyExposure,
  renderEvents,
}: {
  currency: string;
  history: PerformanceHistoryPoint[];
  managementPerformance: number;
  brvmPerformance: number;
  ngxPerformance: number;
  netClientFlows: number;
  visibility: PerformanceHistoryVisibility;
  eventTypes: readonly string[];
  eventColor: (type: string) => string;
  dot: HistoricalDot;
  onToggleSeries: (key: keyof PerformanceHistoryVisibility) => void;
  onOpenCurrencyExposure: () => void;
  renderEvents: (events: unknown, currency: string) => ReactNode;
}) {
  const stats = [
    {
      label: 'Gestion TWR',
      value: `${managementPerformance >= 0 ? '+' : ''}${managementPerformance.toFixed(1)}%`,
      color: managementPerformance >= 0 ? C.teal : C.coral,
    },
    {
      label: 'BRVM Composite',
      value: `${brvmPerformance >= 0 ? '+' : ''}${brvmPerformance.toFixed(1)}%`,
      color: C.gold,
    },
    {
      label: 'NGX ASI',
      value: `${ngxPerformance >= 0 ? '+' : ''}${ngxPerformance.toFixed(1)}%`,
      color: C.teal,
    },
    {
      label: 'Flux clients nets',
      value: `${netClientFlows >= 0 ? '+' : '-'}${fmt(Math.abs(netClientFlows))} ${currency}`,
      color: C.sub,
    },
  ];

  const brvmSpread = managementPerformance - brvmPerformance;
  const ngxSpread = managementPerformance - ngxPerformance;

  return (
    <Card className="gsm-native-homeperformancehistory-5b1207536">
      <div className="gsm-native-homeperformancehistory-34d41a311">
        <div>
          <Eyebrow>Historique de l'encours</Eyebrow>
          <div className="gsm-native-homeperformancehistory-3c0169f3c" style={{ color: C.sub }}>
            Performance de la gestion neutralisée des dépôts et retraits
          </div>
        </div>
        <div className="gsm-native-homeperformancehistory-ea3038a40">
          <Btn tone="ghost" onClick={onOpenCurrencyExposure}>
            Variations en devise
          </Btn>
          <Badge tone="navy">Base 100 · méthode TWR</Badge>
        </div>
      </div>

      <div className="gsm-native-homeperformancehistory-ae2c2ab9a">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="gsm-native-homeperformancehistory-b75e6d1a8"
            style={{ borderColor: C.line, background: C.surfaceElevated }}
          >
            <div
              className="gsm-native-homeperformancehistory-bf60003e9"
              style={{ color: C.sub }}
            >
              {stat.label}
            </div>
            <div
              className="gsm-native-homeperformancehistory-0a689bb74"
              style={{ color: stat.color, ...F_MONO }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="gsm-native-homeperformancehistory-9727bc962"
        style={{ color: C.sub }}
      >
        <span>
          Écart vs BRVM :{' '}
          <b
            style={{
              color: brvmSpread >= 0 ? C.teal : C.coral,
              ...F_MONO,
            }}
          >
            {brvmSpread >= 0 ? '+' : ''}
            {brvmSpread.toFixed(1)} pt
          </b>
        </span>
        <span>·</span>
        <span>
          Écart vs NGX :{' '}
          <b
            style={{
              color: ngxSpread >= 0 ? C.teal : C.coral,
              ...F_MONO,
            }}
          >
            {ngxSpread >= 0 ? '+' : ''}
            {ngxSpread.toFixed(1)} pt
          </b>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={history}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: C.sub }}
            axisLine={{ stroke: C.line }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: C.sub }}
            axisLine={false}
            tickLine={false}
            domain={['dataMin - 2', 'dataMax + 2']}
            tickFormatter={(value) => Number(value).toFixed(0)}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as
                | PerformanceHistoryPoint
                | undefined;
              if (!point) return null;

              const fluxLabel =
                point.fluxNet > 0
                  ? 'Dépôt net'
                  : point.fluxNet < 0
                  ? 'Retrait net'
                  : 'Flux client';

              return (
                <div
                  className="gsm-native-homeperformancehistory-a7d2a6ce2"
                  style={{
                    background: C.surfaceCard,
                    borderColor: C.line,
                    ...F_BODY,
                  }}
                >
                  <div className="gsm-native-homeperformancehistory-634bbee01" style={{ color: C.ink }}>
                    {String(label || '')}
                  </div>
                  <div className="gsm-native-homeperformancehistory-e671cbd10" style={{ color: C.sub }}>
                    <div>
                      Gestion TWR :{' '}
                      <b style={{ color: C.navy, ...F_MONO }}>
                        {Number(point.gestionTwr).toFixed(2)}
                      </b>
                    </div>
                    <div>
                      BRVM Composite :{' '}
                      <b style={{ color: C.gold, ...F_MONO }}>
                        {Number(point.brvm).toFixed(2)}
                      </b>
                    </div>
                    <div>
                      NGX ASI :{' '}
                      <b style={{ color: C.teal, ...F_MONO }}>
                        {Number(point.ngxAsi).toFixed(2)}
                      </b>
                    </div>
                    <div
                      className="gsm-native-homeperformancehistory-5f6ab2754"
                      style={{ borderTop: `1px solid ${C.line}` }}
                    >
                      Encours brut :{' '}
                      <b style={{ color: C.ink, ...F_MONO }}>
                        {fmt(point.encoursBrut)} {currency}
                      </b>
                    </div>
                    <div>
                      {fluxLabel} :{' '}
                      <b
                        style={{
                          color: point.fluxNet >= 0 ? C.teal : C.coral,
                          ...F_MONO,
                        }}
                      >
                        {point.fluxNet >= 0 ? '+' : '-'}
                        {fmt(Math.abs(point.fluxNet))} {currency}
                      </b>
                    </div>
                    {renderEvents(point.evenements, currency)}
                  </div>
                </div>
              );
            }}
          />
          {visibility.gestionTwr && (
            <Line
              type="monotone"
              dataKey="gestionTwr"
              name="Gestion globale (TWR)"
              stroke={C.navy}
              strokeWidth={2.8}
              dot={dot}
              activeDot={{ r: 7 }}
            />
          )}
          {visibility.brvm && (
            <Line
              type="monotone"
              dataKey="brvm"
              name="BRVM Composite"
              stroke={C.gold}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          )}
          {visibility.ngxAsi && (
            <Line
              type="monotone"
              dataKey="ngxAsi"
              name="NGX ASI"
              stroke={C.teal}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <HistoryLegend
        visibility={visibility}
        onToggle={onToggleSeries}
      />

      <div
        className="gsm-native-homeperformancehistory-7499bf85f"
        style={{ color: C.sub }}
      >
        {eventTypes.map((type) => (
          <span key={type} className="gsm-native-homeperformancehistory-44d3ea357">
            <span
              className="gsm-native-homeperformancehistory-be9783a60"
              style={{
                borderColor: eventColor(type),
                background: C.surfaceCard,
              }}
            />
            {type}
          </span>
        ))}
        <span>Survolez un point pour voir le résumé des mouvements.</span>
      </div>

      <div
        className="gsm-native-homeperformancehistory-a8bc3177e"
        style={{ background: C.surfaceElevated, color: C.sub, ...F_BODY }}
      >
        <b style={{ color: C.ink }}>Lecture :</b> la courbe « Gestion
        globale (TWR) » mesure uniquement la performance de gestion. Les
        points signalent les dépôts, retraits, coupons et dividendes reçus
        pendant chaque période. Dépôts et retraits sont neutralisés dans le
        calcul du TWR ; coupons et dividendes restent des revenus de
        portefeuille. En production, ces marqueurs seront alimentés par les
        mouvements et revenus réellement comptabilisés.
      </div>
    </Card>
  );
}
