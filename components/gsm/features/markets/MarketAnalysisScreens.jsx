import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Star } from 'lucide-react';
import { fmt, fmtCompactMontant, fmtPrice } from '../../shared/lib/finance';
import { C, F_DISPLAY, F_BODY, F_MONO } from '../../shared/theme/theme';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { Donut } from '../home/HomeWidgets';
import { ClientBreadcrumb } from '../clients/ClientCommon';
import { RECOS } from '../trading/TradingDomainData';
import {
  BOURSES_ACTIVE_CONFIG,
  buildBourseActiveSnapshot,
  resolveMarketInstrument,
} from './MarketDomainData';

function VueBourses({
  mode = 'gestionnaire',
  go,
  goClient,
  watchlistTitles = [],
  onAddWatch,
}) {
  const [bourse, setBourse] = useState('BRVM');
  const [pulse, setPulse] = useState(0);
  const [simulationActive, setSimulationActive] = useState(true);

  useEffect(() => {
    if (!simulationActive) return undefined;
    const timer = window.setInterval(() => {
      setPulse((current) => current + 1);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [simulationActive]);

  const snapshot = buildBourseActiveSnapshot(bourse, pulse);
  const miseAJour = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const topHausses = [...snapshot.instruments]
    .sort((a, b) => b.variation - a.variation)
    .slice(0, 4);
  const topBaisses = [...snapshot.instruments]
    .sort((a, b) => a.variation - b.variation)
    .slice(0, 4);
  const plusActifs = [...snapshot.instruments]
    .sort((a, b) => b.valeurEchangee - a.valeurEchangee)
    .slice(0, 4);
  const espaceClient = mode === 'client';

  const ouvrirInstruments = () => {
    if (espaceClient) {
      goClient?.('client-markets');
      return;
    }
    go?.('marches');
  };

  const ouvrirProfondeur = (instrument) => {
    const params = {
      marche: snapshot.code,
      instrument: instrument.nom,
      source: 'vue-boursiere',
    };
    if (espaceClient) {
      goClient?.('client-market-depth', params);
      return;
    }
    go?.('profondeur', params);
  };

  const ouvrirAnalyseInstrument = (instrument) => {
    const params = {
      marche: snapshot.code,
      instrument: instrument.nom,
      source: 'vue-boursiere',
    };
    if (espaceClient) {
      goClient?.('client-instrument-analysis', params);
      return;
    }
    go?.('instrument-analysis', params);
  };

  const ajouterWatchlist = (instrument) => {
    if (!watchlistTitles.includes(instrument.nom)) {
      onAddWatch?.(instrument.nom);
    }
  };

  return (
    <div className="gsm-native-marketanalysisscreens-77a829b08">
      {espaceClient ? (
        <ClientBreadcrumb items={['Espace Client', 'Marchés Actions']} />
      ) : (
        <Breadcrumb items={['Accueil', 'Marchés Actions']} />
      )}

      <div className="gsm-native-marketanalysisscreens-3fcaa373c">
        <div>
          <Eyebrow>Tableau de bord boursier</Eyebrow>
          <h2
            className="gsm-native-marketanalysisscreens-fa03e9e18"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Vue des bourses africaines
          </h2>
          <div className="gsm-native-marketanalysisscreens-ef9144c33" style={{ color: C.sub }}>
            Suivi intrajournalier simulé des marchés actions de la BRVM, de la
            NGX et de la GSE : indice principal, activité, breadth, volumes,
            transactions et principaux mouvements de séance. Depuis cette vue,
            chaque valeur peut être analysée, ajoutée à la watchlist, ouverte
            dans son carnet d'ordres ou envoyée directement vers son Ticket
            d'ordre dans l'espace Client.
          </div>
        </div>

        <div className="gsm-native-marketanalysisscreens-fc72cf952">
          <Badge tone={simulationActive ? 'teal' : 'slate'}>
            {simulationActive
              ? '● Marchés actifs · simulation'
              : 'Simulation en pause'}
          </Badge>
          <span className="gsm-native-marketanalysisscreens-e1670ff3f" style={{ color: C.sub, ...F_MONO }}>
            MAJ {miseAJour}
          </span>
        </div>
      </div>

      <div className="gsm-native-marketanalysisscreens-e9d46aecc">
        <div className="gsm-native-marketanalysisscreens-931ef0b85">
          {Object.keys(BOURSES_ACTIVE_CONFIG).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setBourse(code)}
              className="gsm-native-marketanalysisscreens-7ef136009"
              style={{
                background: bourse === code ? C.activeBackground : C.surfaceInset,
                color: bourse === code ? C.textPrimary : C.sub,
                ...F_BODY,
              }}
            >
              {code}
            </button>
          ))}
        </div>
        <Btn tone="ghost" onClick={ouvrirInstruments}>
          Ouvrir le marché obligataire
        </Btn>
      </div>

      <Card className="gsm-native-marketanalysisscreens-d64fb07d4" style={{ borderColor: C.navy }}>
        <div className="gsm-native-marketanalysisscreens-740cc4d5c">
          <div>
            <div className="gsm-native-marketanalysisscreens-a5c870ab5">
              <Badge tone="navy">{snapshot.code}</Badge>
              <Badge tone="teal">Marché actif</Badge>
              <Badge tone="slate">Session {snapshot.session}</Badge>
            </div>
            <div
              className="gsm-native-marketanalysisscreens-8e08b51df"
              style={{ ...F_DISPLAY, color: C.ink }}
            >
              {snapshot.nom}
            </div>
            <div className="gsm-native-marketanalysisscreens-6fab630d4" style={{ color: C.sub }}>
              Indice de référence : {snapshot.indice}
            </div>
          </div>

          <div className="gsm-native-marketanalysisscreens-398b83fb6">
            <div
              className="gsm-native-marketanalysisscreens-935e931f0"
              style={{ color: C.sub }}
            >
              {snapshot.indice}
            </div>
            <div
              className="gsm-native-marketanalysisscreens-ab9991bd6"
              style={{ ...F_MONO, color: C.ink }}
            >
              {fmtPrice(snapshot.niveauIndice)}
            </div>
            <div className="gsm-native-marketanalysisscreens-07821e826">
              <Pct v={snapshot.variationIndice} />
            </div>
          </div>
        </div>
      </Card>

      <div className="gsm-native-marketanalysisscreens-b4c99396e">
        {[
          {
            label: 'Valeur échangée',
            value: `${fmtCompactMontant(snapshot.valeurEchangee)} ${
              snapshot.devise
            }`,
            detail: 'sur l’univers simulé',
          },
          {
            label: 'Volume titres',
            value: fmtCompactMontant(snapshot.totalVolume),
            detail: 'titres négociés',
          },
          {
            label: 'Transactions',
            value: fmt(snapshot.totalTransactions),
            detail: 'exécutions cumulées',
          },
          {
            label: 'Capitalisation',
            value: `${fmtCompactMontant(snapshot.capitalisation)} ${
              snapshot.devise
            }`,
            detail: 'capitalisation simulée',
          },
          {
            label: 'Plus haut indice',
            value: fmtPrice(
              Math.max(
                snapshot.plusHautIndice,
                ...snapshot.intraday.map((point) => point.indice)
              )
            ),
            detail: 'séance',
          },
          {
            label: 'Plus bas indice',
            value: fmtPrice(
              Math.min(
                snapshot.plusBasIndice,
                ...snapshot.intraday.map((point) => point.indice)
              )
            ),
            detail: 'séance',
          },
        ].map((stat) => (
          <Card key={stat.label} className="gsm-native-marketanalysisscreens-4a9a5a194">
            <div
              className="gsm-native-marketanalysisscreens-935e931f0"
              style={{ color: C.sub }}
            >
              {stat.label}
            </div>
            <div
              className="gsm-native-marketanalysisscreens-10494f1a9"
              style={{ color: C.ink, ...F_MONO }}
            >
              {stat.value}
            </div>
            <div className="gsm-native-marketanalysisscreens-f6eb61431" style={{ color: C.sub }}>
              {stat.detail}
            </div>
          </Card>
        ))}
      </div>

      <div className="gsm-native-marketanalysisscreens-5b903e181">
        <Card className="gsm-native-marketanalysisscreens-7da4534d1">
          <div className="gsm-native-marketanalysisscreens-5de05f86a">
            <div>
              <Eyebrow>Indice intrajournalier</Eyebrow>
              <div className="gsm-native-marketanalysisscreens-6ac9a9c77" style={{ color: C.ink }}>
                {snapshot.indice} · séance simulée
              </div>
            </div>
            <Badge tone={snapshot.variationIndice >= 0 ? 'teal' : 'coral'}>
              {snapshot.variationIndice >= 0
                ? 'Tendance positive'
                : 'Tendance négative'}
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={snapshot.intraday}
              margin={{ top: 10, right: 18, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis
                dataKey="heure"
                tick={{ fontSize: 10, fill: C.sub }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: C.sub }}
                axisLine={false}
                tickLine={false}
                width={68}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => fmtPrice(value)}
              />
              <Tooltip
                formatter={(value) => [fmtPrice(value), snapshot.indice]}
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${C.line}`,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="indice"
                name={snapshot.indice}
                stroke={C.navy}
                strokeWidth={2.6}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="gsm-native-marketanalysisscreens-81e8fe499">
          <Eyebrow>État du marché</Eyebrow>
          <div className="gsm-native-marketanalysisscreens-6ac9a9c77" style={{ color: C.ink }}>
            Breadth de séance
          </div>
          <Donut data={snapshot.breadth} size={175} />
          <div className="gsm-native-marketanalysisscreens-f480c8a78">
            <div>
              <div
                className="gsm-native-marketanalysisscreens-b0069918a"
                style={{ color: C.teal, ...F_MONO }}
              >
                {snapshot.hausses}
              </div>
              <div className="gsm-native-marketanalysisscreens-e1670ff3f" style={{ color: C.sub }}>
                Hausses
              </div>
            </div>
            <div>
              <div
                className="gsm-native-marketanalysisscreens-b0069918a"
                style={{ color: C.coral, ...F_MONO }}
              >
                {snapshot.baisses}
              </div>
              <div className="gsm-native-marketanalysisscreens-e1670ff3f" style={{ color: C.sub }}>
                Baisses
              </div>
            </div>
            <div>
              <div
                className="gsm-native-marketanalysisscreens-b0069918a"
                style={{ color: C.sub, ...F_MONO }}
              >
                {snapshot.stables}
              </div>
              <div className="gsm-native-marketanalysisscreens-e1670ff3f" style={{ color: C.sub }}>
                Stables
              </div>
            </div>
          </div>
          <div
            className="gsm-native-marketanalysisscreens-c40b8293e"
            style={{ background: C.surfaceElevated, color: C.sub }}
          >
            Ratio hausse / baisse :{' '}
            <b style={{ color: C.ink }}>
              {snapshot.baisses > 0
                ? (snapshot.hausses / snapshot.baisses).toFixed(2)
                : snapshot.hausses.toFixed(2)}
            </b>
          </div>
        </Card>
      </div>

      <div className="gsm-native-marketanalysisscreens-5b903e181">
        {[
          {
            titre: 'Plus fortes hausses',
            rows: topHausses,
            mode: 'variation',
          },
          {
            titre: 'Plus fortes baisses',
            rows: topBaisses,
            mode: 'variation',
          },
          {
            titre: 'Plus fortes activités',
            rows: plusActifs,
            mode: 'volume',
          },
        ].map((bloc) => (
          <Card key={bloc.titre} className="gsm-native-marketanalysisscreens-d64fb07d4">
            <div
              className="gsm-native-marketanalysisscreens-1d79506db"
              style={{ color: C.sub }}
            >
              {bloc.titre}
            </div>
            <div className="gsm-native-marketanalysisscreens-0cfb89941">
              {bloc.rows.map((instrument, index) => (
                <div
                  key={instrument.nom}
                  className="gsm-native-marketanalysisscreens-99b4cb227"
                  style={{
                    borderTop: index === 0 ? 'none' : `1px solid ${C.line}`,
                  }}
                >
                  <div className="gsm-native-marketanalysisscreens-f0ec6b48b">
                    <div
                      className="gsm-native-marketanalysisscreens-1feb3cead"
                      style={{ color: C.ink }}
                    >
                      {instrument.nom}
                    </div>
                    <div className="gsm-native-marketanalysisscreens-fdc06a5b3" style={{ color: C.sub }}>
                      {instrument.secteur}
                    </div>
                  </div>
                  <div className="gsm-native-marketanalysisscreens-4255398c3">
                    {bloc.mode === 'variation' ? (
                      <Pct v={instrument.variation} />
                    ) : (
                      <>
                        <div
                          className="gsm-native-marketanalysisscreens-bdb85d8c6"
                          style={{ color: C.ink, ...F_MONO }}
                        >
                          {fmtCompactMontant(instrument.volume)}
                        </div>
                        <div className="gsm-native-marketanalysisscreens-fdc06a5b3" style={{ color: C.sub }}>
                          titres
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="gsm-native-marketanalysisscreens-35531364a">
        <div className="gsm-native-marketanalysisscreens-a6e9b9cf5">
          <div>
            <Eyebrow>Cotation</Eyebrow>
            <div className="gsm-native-marketanalysisscreens-6ac9a9c77" style={{ color: C.ink }}>
              Principales valeurs · {snapshot.code}
            </div>
          </div>
          <Badge tone="gold">
            {snapshot.instruments.length} valeurs actives
          </Badge>
        </div>

        <div className="gsm-table-scroll">
          <table className="gsm-table--banking gsm-native-marketanalysisscreens-20d7d8773" style={{ minWidth: 1500 }}>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>Instrument</Th>
                <Th>Secteur</Th>
                <Th>Dernier cours</Th>
                <Th>Var %</Th>
                <Th>Bid</Th>
                <Th>Ask</Th>
                <Th>Plus bas</Th>
                <Th>Plus haut</Th>
                <Th>Volume</Th>
                <Th>Transactions</Th>
                <Th>Valeur échangée</Th>
                <Th>Watchlist</Th>
                <Th>{espaceClient ? 'Actions' : "Carnet d'ordres"}</Th>
              </tr>
            </thead>
            <tbody>
              {[...snapshot.instruments]
                .sort((a, b) => b.valeurEchangee - a.valeurEchangee)
                .map((instrument, index) => (
                  <tr
                    key={instrument.nom}
                    style={{
                      borderTop: `1px solid ${C.line}`,
                      background: index % 2 ? C.rowAlternate : C.surfaceCard,
                    }}
                  >
                    <Td className="gsm-native-marketanalysisscreens-3d6e58413">
                      <button
                        type="button"
                        onClick={() => ouvrirAnalyseInstrument(instrument)}
                        className="gsm-native-marketanalysisscreens-1984266c9"
                        style={{ color: C.indigo }}
                        title={`Analyser ${instrument.nom}`}
                      >
                        {instrument.nom}
                      </button>
                    </Td>
                    <Td>{instrument.secteur}</Td>
                    <Td mono className="gsm-native-marketanalysisscreens-c90215b88">
                      {fmtPrice(instrument.cours)} {snapshot.devise}
                    </Td>
                    <Td>
                      <Pct v={instrument.variation} />
                    </Td>
                    <Td mono>{fmtPrice(instrument.bid)}</Td>
                    <Td mono>{fmtPrice(instrument.ask)}</Td>
                    <Td mono>{fmtPrice(instrument.coursMin)}</Td>
                    <Td mono>{fmtPrice(instrument.coursMax)}</Td>
                    <Td mono>{fmt(instrument.volume)}</Td>
                    <Td mono>{fmt(instrument.transactions)}</Td>
                    <Td mono className="gsm-native-marketanalysisscreens-c90215b88">
                      {fmtCompactMontant(instrument.valeurEchangee)}{' '}
                      {snapshot.devise}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        disabled={watchlistTitles.includes(instrument.nom)}
                        onClick={() => ajouterWatchlist(instrument)}
                        className="gsm-native-marketanalysisscreens-73169af08"
                        style={{
                          background: watchlistTitles.includes(instrument.nom)
                            ? C.positiveBackground
                            : C.warningBackground,
                          color: watchlistTitles.includes(instrument.nom)
                            ? C.teal
                            : C.warningText,
                          cursor: watchlistTitles.includes(instrument.nom)
                            ? 'default'
                            : 'pointer',
                        }}
                      >
                        <Star
                          size={13}
                          fill={
                            watchlistTitles.includes(instrument.nom)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                        {watchlistTitles.includes(instrument.nom)
                          ? 'Ajouté'
                          : 'Add Watch'}
                      </button>
                    </Td>
                    <Td>
                      <div className="gsm-native-marketanalysisscreens-40f5944ec">
                        <button
                          type="button"
                          onClick={() => ouvrirProfondeur(instrument)}
                          className="gsm-native-marketanalysisscreens-bdb85d8c6"
                          style={{ color: C.indigo }}
                        >
                          Voir profondeur →
                        </button>
                        {espaceClient && (
                          <button
                            type="button"
                            onClick={() =>
                              goClient?.('client-ticket', {
                                instrument: instrument.nom,
                                marche: snapshot.code,
                                source: 'vue-boursiere',
                              })
                            }
                            className="gsm-native-marketanalysisscreens-bdb85d8c6"
                            style={{ color: C.navy }}
                          >
                            Ticket d'ordre →
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div
        className="gsm-native-marketanalysisscreens-11ac9823f"
        style={{ background: C.warningBackground, color: C.sub, ...F_BODY }}
      >
        <b style={{ color: C.ink }}>Important :</b> cette vue est une simulation
        destinée à rendre la maquette active. Les cours, indices, volumes,
        capitalisations, transactions, bid/ask et mouvements intrajournaliers
        sont générés localement et ne doivent pas être interprétés comme des
        données officielles de la BRVM, de la NGX ou de la GSE.
      </div>
    </div>
  );
}

/* --------------------- ANALYSE D'UN INSTRUMENT ACTION --------------------- */
/*
 * Page d'analyse ouverte depuis Marchés Actions > Cotation.
 * Les données de marché et fondamentales restent des données de démonstration
 * cohérentes avec la maquette. En production, les séries OHLCV, indicateurs et
 * ratios devront provenir des API/ORM réels de la plateforme.
 */
const technicalSeed = (value) =>
  String(value || '')
    .split('')
    .reduce(
      (total, char, index) => total + char.charCodeAt(0) * (index + 3),
      0
    );

const seededUnit = (seed, index) => {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const buildTechnicalSeries = (instrument, points = 240) => {
  const current = Math.max(0.01, Number(instrument?.cours || 100));
  const seed = technicalSeed(`${instrument?.marche}-${instrument?.nom}`);  const rows = [];
  let close = current * (0.82 + (seed % 14) / 100);
  let cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - Math.ceil(points * 1.45));

  for (let index = 0; rows.length < points; index += 1) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0 || cursor.getDay() === 6) continue;

    const noise = seededUnit(seed, index) - 0.48;
    const cycle = Math.sin((index + (seed % 17)) * 0.16) * 0.0028;
    const drift = 0.00045 + ((seed % 7) - 3) * 0.00003;
    const gap = (seededUnit(seed + 13, index) - 0.5) * 0.006;
    const open = Math.max(0.01, close * (1 + gap));
    const nextClose = Math.max(
      0.01,
      open * (1 + drift + cycle + noise * 0.017)
    );
    const amplitude = 0.004 + seededUnit(seed + 29, index) * 0.014;
    const high = Math.max(open, nextClose) * (1 + amplitude);
    const low = Math.min(open, nextClose) * (1 - amplitude * 0.86);
    const volume = Math.round(
      Number(instrument?.volumeJour || instrument?.volume || 100000) *
        (0.55 + seededUnit(seed + 61, index) * 1.05)
    );

    rows.push({
      date: cursor.toISOString().slice(0, 10),
      label: cursor.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
      open,
      high,
      low,
      close: nextClose,
      volume,
    });
    close = nextClose;
  }

  const scale = current / rows[rows.length - 1].close;
  const scaled = rows.map((row) => ({
    ...row,
    open: row.open * scale,
    high: row.high * scale,
    low: row.low * scale,
    close: row.close * scale,
  }));

  const rollingAverage = (index, period) => {
    if (index + 1 < period) return null;
    const sample = scaled.slice(index - period + 1, index + 1);
    return sample.reduce((sum, row) => sum + row.close, 0) / sample.length;
  };

  return scaled.map((row, index) => ({
    ...row,
    sma20: rollingAverage(index, 20),
    sma50: rollingAverage(index, 50),
  }));
};

const technicalRsi = (rows, period = 14) => {
  if (!rows?.length || rows.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  const start = rows.length - period;
  for (let index = start; index < rows.length; index += 1) {
    const previous = rows[index - 1]?.close ?? rows[index].close;
    const delta = rows[index].close - previous;
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return 100;
  const rs = gains / Math.max(losses, 1e-9);
  return 100 - 100 / (1 + rs);
};

const technicalEma = (values, period) => {
  if (!values.length) return [];
  const multiplier = 2 / (period + 1);
  const output = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    output.push(
      values[index] * multiplier + output[index - 1] * (1 - multiplier)
    );
  }
  return output;
};

const technicalMacd = (rows) => {
  const closes = rows.map((row) => row.close);
  const ema12 = technicalEma(closes, 12);
  const ema26 = technicalEma(closes, 26);
  const macd = closes.map((_, index) => ema12[index] - ema26[index]);
  const signal = technicalEma(macd, 9);
  return {
    macd: macd[macd.length - 1] || 0,
    signal: signal[signal.length - 1] || 0,
    histogram: (macd[macd.length - 1] || 0) - (signal[signal.length - 1] || 0),
  };
};

const technicalVolatility = (rows, period = 20) => {
  const sample = rows.slice(-Math.max(2, period + 1));
  const returns = sample.slice(1).map((row, index) => {
    const previous = sample[index].close;
    return previous > 0 ? row.close / previous - 1 : 0;
  });
  if (!returns.length) return 0;
  const average =
    returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

const buildFundamentalSnapshot = (instrument) => {
  const seed = technicalSeed(`${instrument?.marche}-${instrument?.nom}`);
  const reco = RECOS.find((item) => item.titre === instrument?.nom);
  const secteur = instrument?.secteur || reco?.secteur || 'Autres';
  const isBank = /banque|bank/i.test(secteur);

  return {
    per: Number(
      (reco?.fondamentale?.per ?? 7.5 + ((seed * 7) % 135) / 10).toFixed(1)
    ),
    roe: Number((9 + ((seed * 11) % 210) / 10).toFixed(1)),
    roa: Number(
      (isBank
        ? 0.8 + ((seed * 13) % 260) / 100
        : 3.8 + ((seed * 13) % 105) / 10
      ).toFixed(1)
    ),
    margeNette: Number((6 + ((seed * 17) % 190) / 10).toFixed(1)),
    detteFondsPropres: Number((0.18 + ((seed * 19) % 125) / 100).toFixed(2)),
    croissanceCA: Number((1.5 + ((seed * 23) % 145) / 10).toFixed(1)),
    croissanceBpa: Number((1 + ((seed * 29) % 190) / 10).toFixed(1)),
    rendementDividende: Number((1.2 + ((seed * 31) % 70) / 10).toFixed(1)),
    priceBook: Number((0.8 + ((seed * 37) % 38) / 10).toFixed(1)),
    secteur,
  };
};

const fundamentalRatioExplanation = (key, value, secteur) => {
  if (key === 'per') {
    const lecture =
      value < 9
        ? 'Multiple de bénéfices relativement faible : le marché paie peu chaque unité de bénéfice, ce qui peut refléter une décote ou un risque perçu.'
        : value <= 16
        ? 'Multiple intermédiaire : la valorisation paraît modérée, à comparer aux pairs du même secteur et à la croissance attendue.'
        : 'Multiple élevé : le cours intègre davantage d’anticipations de croissance ; la qualité des bénéfices devient particulièrement importante.';
    return {
      definition:
        'Le PER rapporte le cours de l’action au bénéfice par action. Il mesure le prix payé pour une unité de bénéfice.',
      lecture,
    };
  }
  if (key === 'roe') {
    return {
      definition:
        'Le ROE mesure la rentabilité générée sur les capitaux propres apportés par les actionnaires.',
      lecture:
        value >= 20
          ? 'Rentabilité des fonds propres élevée dans cette maquette. Il faut toutefois vérifier si elle repose sur un endettement important ou sur une rentabilité opérationnelle durable.'
          : value >= 12
          ? 'Rentabilité des capitaux propres correcte à solide ; la comparaison sectorielle reste déterminante.'
          : 'Rentabilité des capitaux propres modérée ; il faut examiner les marges, la rotation des actifs et la structure financière.',
    };
  }
  if (key === 'roa') {
    return {
      definition:
        'Le ROA mesure le bénéfice produit par l’ensemble des actifs utilisés par l’entreprise.',
      lecture: /banque|bank/i.test(secteur)
        ? 'Pour une banque, le ROA est structurellement plus faible que dans de nombreux secteurs industriels : une lecture autour de quelques pourcents peut déjà être significative.'
        : value >= 8
        ? 'Efficacité élevée des actifs dans cette maquette : l’entreprise génère une rentabilité importante par unité d’actif.'
        : value >= 4
        ? 'Efficacité opérationnelle intermédiaire ; à comparer à l’intensité capitalistique du secteur.'
        : 'ROA faible : l’actif économique génère peu de résultat relatif, ce qui mérite une analyse des marges et de l’utilisation des actifs.',
    };
  }
  if (key === 'margeNette') {
    return {
      definition:
        'La marge nette indique la part du chiffre d’affaires qui reste en résultat net après toutes les charges.',
      lecture:
        value >= 15
          ? 'Marge nette confortable dans la maquette, suggérant une bonne capacité à convertir le chiffre d’affaires en bénéfice.'
          : 'Marge à surveiller relativement aux concurrents et à son évolution historique.',
    };
  }
  if (key === 'detteFondsPropres') {
    return {
      definition:
        'Dette / fonds propres mesure le poids de la dette financière relativement aux capitaux propres.',      lecture:
        value <= 0.5
          ? 'Le levier financier apparaît contenu dans la maquette.'
          : value <= 1
          ? 'Le levier est intermédiaire ; son acceptabilité dépend de la stabilité des flux de trésorerie et du secteur.'
          : 'Levier élevé : il convient d’examiner la couverture des intérêts, les échéances et la génération de cash-flow.',
    };
  }
  if (key === 'croissanceCA') {
    return {
      definition:
        'Croissance du chiffre d’affaires : évolution de l’activité commerciale sur la période de référence.',
      lecture:
        value >= 8
          ? 'Dynamique commerciale soutenue dans la maquette.'
          : 'Progression mesurée ; il faut distinguer croissance organique, effet prix et acquisitions.',
    };
  }
  if (key === 'croissanceBpa') {
    return {
      definition:
        'Croissance du BPA : évolution du bénéfice attribuable à chaque action.',
      lecture:
        value >= 10
          ? 'Croissance bénéficiaire soutenue dans la maquette.'
          : 'Croissance bénéficiaire modérée ; à rapprocher du chiffre d’affaires et des marges.',
    };
  }
  if (key === 'rendementDividende') {
    return {
      definition:
        'Le rendement du dividende rapporte le dividende annuel au cours de l’action.',
      lecture:
        'Un rendement élevé n’est pas automatiquement favorable : il faut vérifier la soutenabilité du dividende et le taux de distribution.',
    };
  }
  return {
    definition:
      'Le Price-to-Book compare la capitalisation boursière aux fonds propres comptables.',
    lecture:
      value < 1
        ? 'Une valeur inférieure à 1 peut signaler une décote comptable ou refléter une faible rentabilité attendue.'
        : 'Une valeur supérieure à 1 signifie que le marché valorise l’entreprise au-dessus de ses fonds propres comptables.',
  };
};

function TechnicalPriceChart({ rows, devise }) {
  const [mode, setMode] = useState('Bougies');
  const [tool, setTool] = useState('none');
  const [drawings, setDrawings] = useState([]);
  const [draftStart, setDraftStart] = useState(null);
  const [hover, setHover] = useState(null);
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);

  const width = 1100;
  const height = 430;
  const margin = { left: 72, right: 24, top: 22, bottom: 42 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const minLow = Math.min(...rows.map((row) => row.low));
  const maxHigh = Math.max(...rows.map((row) => row.high));
  const padding = Math.max((maxHigh - minLow) * 0.08, maxHigh * 0.005);
  const minPrice = minLow - padding;
  const maxPrice = maxHigh + padding;
  const xFor = (index) =>
    margin.left +
    (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * plotWidth);
  const yFor = (price) =>
    margin.top + ((maxPrice - price) / (maxPrice - minPrice)) * plotHeight;
  const pathFor = (key) => {
    let started = false;
    return rows
      .map((row, index) => {
        const value = row[key];
        if (value == null) return null;
        const command = started ? 'L' : 'M';
        started = true;
        return `${command} ${xFor(index).toFixed(1)} ${yFor(value).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(' ');
  };
  const closePath = pathFor('close');
  const candleWidth = Math.max(
    2.2,
    Math.min(9, (plotWidth / rows.length) * 0.62)
  );

  const pointerPosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;
    return {
      x: Math.max(margin.left, Math.min(width - margin.right, x)),
      y: Math.max(margin.top, Math.min(height - margin.bottom, y)),
    };
  };

  const handleMove = (event) => {
    const point = pointerPosition(event);
    const relative = (point.x - margin.left) / plotWidth;
    const index = Math.max(
      0,
      Math.min(rows.length - 1, Math.round(relative * (rows.length - 1)))
    );
    setHover({ ...point, index });
  };

  const handleChartClick = (event) => {
    if (tool === 'none') return;
    const point = pointerPosition(event);
    if (tool === 'horizontal') {
      setDrawings((current) => [
        ...current,
        { type: 'horizontal', y: point.y },
      ]);
      return;
    }
    if (!draftStart) {
      setDraftStart(point);
    } else {
      setDrawings((current) => [
        ...current,
        {
          type: 'trend',
          x1: draftStart.x,
          y1: draftStart.y,
          x2: point.x,
          y2: point.y,
        },
      ]);
      setDraftStart(null);
    }
  };

  const selectTool = (next) => {
    setTool(next);
    setDraftStart(null);
  };

  const hoverRow = hover ? rows[hover.index] : null;

  return (
    <div>
      <div className="gsm-native-marketanalysisscreens-745aa650c">
        <div className="gsm-native-marketanalysisscreens-a5c870ab5">
          {['Bougies', 'Linéaire', 'Aire'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className="gsm-native-marketanalysisscreens-f52a6d882"
              style={{
                background: mode === item ? C.activeBackground : C.surfaceInset,
                color: mode === item ? C.textPrimary : C.sub,
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="gsm-native-marketanalysisscreens-a5c870ab5">
          <button
            type="button"
            onClick={() => selectTool(tool === 'trend' ? 'none' : 'trend')}
            className="gsm-native-marketanalysisscreens-e0624abdc"
            style={{
              borderColor: tool === 'trend' ? C.indigo : C.line,
              color: tool === 'trend' ? C.indigo : C.sub,
              background: tool === 'trend' ? C.infoBackground : C.surfaceCard,
            }}
          >
            Trait de tendance
          </button>
          <button
            type="button"
            onClick={() =>
              selectTool(tool === 'horizontal' ? 'none' : 'horizontal')
            }
            className="gsm-native-marketanalysisscreens-e0624abdc"
            style={{
              borderColor: tool === 'horizontal' ? C.gold : C.line,
              color: tool === 'horizontal' ? C.warningText : C.sub,
              background: tool === 'horizontal' ? C.warningBackground : C.surfaceCard,
            }}
          >
            Ligne horizontale
          </button>
          <button
            type="button"
            onClick={() => {
              setDrawings((current) => current.slice(0, -1));
              setDraftStart(null);
            }}
            className="gsm-native-marketanalysisscreens-e0624abdc"
            style={{ borderColor: C.line, color: C.sub }}
          >
            Annuler tracé
          </button>          <button
            type="button"
            onClick={() => {
              setDrawings([]);
              setDraftStart(null);
            }}
            className="gsm-native-marketanalysisscreens-e0624abdc"
            style={{ borderColor: C.line, color: C.coral }}
          >
            Effacer
          </button>
        </div>
      </div>

      <div className="gsm-native-marketanalysisscreens-c646cdfdb">
        <button
          type="button"
          onClick={() => setShowSma20((value) => !value)}
          style={{
            color: showSma20 ? C.indigo : C.sub,
            opacity: showSma20 ? 1 : 0.45,
          }}
        >
          MM20 {showSma20 ? '●' : '○'}
        </button>
        <button
          type="button"
          onClick={() => setShowSma50((value) => !value)}
          style={{
            color: showSma50 ? C.gold : C.sub,
            opacity: showSma50 ? 1 : 0.45,
          }}
        >
          MM50 {showSma50 ? '●' : '○'}
        </button>
        {tool === 'trend' && (
          <span style={{ color: C.indigo }}>
            {draftStart
              ? 'Cliquez le deuxième point du trait.'
              : 'Cliquez deux points sur le graphique.'}
          </span>
        )}
        {tool === 'horizontal' && (
          <span style={{ color: C.warningText }}>
            Cliquez au niveau de prix souhaité.
          </span>
        )}
      </div>

      <div
        className="gsm-native-marketanalysisscreens-8655f25b3"
        style={{ borderColor: C.line, background: C.surfaceCard }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="gsm-native-marketanalysisscreens-0f8e19581"
          style={{
            cursor: tool === 'none' ? 'crosshair' : 'cell',
            minHeight: 340,
          }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onClick={handleChartClick}
        >
          <rect x="0" y="0" width={width} height={height} fill={C.surfaceCard} />
          {Array.from({ length: 6 }).map((_, index) => {
            const y = margin.top + (index / 5) * plotHeight;
            const price = maxPrice - (index / 5) * (maxPrice - minPrice);
            return (
              <g key={`grid-y-${index}`}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke={C.line}
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={C.sub}
                >
                  {fmtPrice(price)}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 6 }).map((_, index) => {
            const dataIndex = Math.min(
              rows.length - 1,
              Math.round((index / 5) * (rows.length - 1))
            );
            const x = xFor(dataIndex);
            return (
              <g key={`grid-x-${index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={margin.top}
                  y2={height - margin.bottom}
                  stroke={C.borderSubtle}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - 15}
                  textAnchor="middle"
                  fontSize="11"
                  fill={C.sub}
                >
                  {rows[dataIndex]?.label}
                </text>
              </g>
            );
          })}

          {mode === 'Bougies' &&
            rows.map((row, index) => {
              const x = xFor(index);
              const openY = yFor(row.open);
              const closeY = yFor(row.close);
              const highY = yFor(row.high);
              const lowY = yFor(row.low);
              const up = row.close >= row.open;
              return (
                <g key={row.date}>
                  <line
                    x1={x}
                    x2={x}
                    y1={highY}
                    y2={lowY}
                    stroke={up ? C.teal : C.coral}
                    strokeWidth="1.25"
                  />
                  <rect
                    x={x - candleWidth / 2}
                    y={Math.min(openY, closeY)}
                    width={candleWidth}
                    height={Math.max(1.5, Math.abs(closeY - openY))}
                    rx="1"
                    fill={up ? C.teal : C.coral}
                    opacity="0.92"
                  />
                </g>
              );
            })}

          {mode === 'Aire' && (
            <path
              d={`${closePath} L ${xFor(rows.length - 1)} ${
                height - margin.bottom
              } L ${xFor(0)} ${height - margin.bottom} Z`}
              fill={C.indigo}
              opacity="0.10"
            />
          )}
          {mode !== 'Bougies' && (
            <path
              d={closePath}
              fill="none"
              stroke={C.navy}
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {showSma20 && (
            <path
              d={pathFor('sma20')}
              fill="none"
              stroke={C.indigo}
              strokeWidth="1.8"
              strokeDasharray="6 4"
            />
          )}
          {showSma50 && (
            <path
              d={pathFor('sma50')}
              fill="none"
              stroke={C.gold}
              strokeWidth="1.8"
              strokeDasharray="3 4"
            />
          )}

          {drawings.map((drawing, index) =>
            drawing.type === 'horizontal' ? (
              <line
                key={`drawing-${index}`}
                x1={margin.left}
                x2={width - margin.right}
                y1={drawing.y}
                y2={drawing.y}
                stroke={C.gold}
                strokeWidth="2"
                strokeDasharray="7 5"
              />            ) : (
              <line
                key={`drawing-${index}`}
                x1={drawing.x1}
                y1={drawing.y1}
                x2={drawing.x2}
                y2={drawing.y2}
                stroke={C.indigo}
                strokeWidth="2.3"
              />
            )
          )}
          {draftStart && hover && tool === 'trend' && (
            <line
              x1={draftStart.x}
              y1={draftStart.y}
              x2={hover.x}
              y2={hover.y}
              stroke={C.indigo}
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          )}

          {hover && (
            <g pointerEvents="none">
              <line
                x1={hover.x}
                x2={hover.x}
                y1={margin.top}
                y2={height - margin.bottom}
                stroke={C.textMuted}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={hover.y}
                y2={hover.y}
                stroke={C.textMuted}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          )}
        </svg>

        {hoverRow && (
          <div
            className="gsm-native-marketanalysisscreens-c3884120a"
            style={{
              background: 'rgba(255,255,255,0.96)',
              borderColor: C.line,
              color: C.ink,
              ...F_MONO,
            }}
          >
            <div className="gsm-native-marketanalysisscreens-905a7c57b">{hoverRow.date}</div>
            <div>
              O {fmtPrice(hoverRow.open)} · H {fmtPrice(hoverRow.high)}
            </div>
            <div>
              B {fmtPrice(hoverRow.low)} · C {fmtPrice(hoverRow.close)}
            </div>
            <div>
              Volume {fmt(hoverRow.volume)} · {devise}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyseInstrument({ ctx, go, mode = 'gestionnaire', goClient }) {
  const instrument =
    resolveMarketInstrument(ctx?.instrument, ctx?.marche) ||
    resolveMarketInstrument(
      BOURSES_ACTIVE_CONFIG.BRVM.instruments[0].nom,
      'BRVM'
    );
  const [horizon, setHorizon] = useState('6M');
  const espaceClient = mode === 'client';
  const allRows = buildTechnicalSeries(instrument, 240);
  const horizonPoints = { '1M': 22, '3M': 66, '6M': 132, '1A': 240 };
  const rows = allRows.slice(-horizonPoints[horizon]);
  const fundamental = buildFundamentalSnapshot(instrument);
  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2] || latest;
  const rsi = technicalRsi(rows);
  const macd = technicalMacd(rows);
  const volatility = technicalVolatility(rows);
  const support = Math.min(...rows.slice(-20).map((row) => row.low));
  const resistance = Math.max(...rows.slice(-20).map((row) => row.high));
  const sma20 = latest?.sma20 || latest?.close || 0;
  const sma50 = latest?.sma50 || latest?.close || 0;
  const trend =
    latest.close > sma20 && sma20 > sma50
      ? 'Tendance haussière'
      : latest.close < sma20 && sma20 < sma50
      ? 'Tendance baissière'
      : 'Tendance neutre / transition';
  const momentum =
    rsi >= 70
      ? 'RSI en zone de surachat'
      : rsi <= 30
      ? 'RSI en zone de survente'
      : 'RSI en zone neutre';
  const dayMove = previous?.close
    ? (latest.close / previous.close - 1) * 100
    : Number(instrument.variation || 0);

  const ratios = [
    { key: 'per', label: 'PER', value: fundamental.per, suffix: 'x' },
    { key: 'roe', label: 'ROE', value: fundamental.roe, suffix: '%' },
    { key: 'roa', label: 'ROA', value: fundamental.roa, suffix: '%' },
    {
      key: 'margeNette',
      label: 'Marge nette',
      value: fundamental.margeNette,
      suffix: '%',
    },
    {
      key: 'detteFondsPropres',
      label: 'Dette / Fonds propres',
      value: fundamental.detteFondsPropres,
      suffix: 'x',
    },
    {
      key: 'croissanceCA',
      label: 'Croissance CA',
      value: fundamental.croissanceCA,
      suffix: '%',
    },
    {
      key: 'croissanceBpa',
      label: 'Croissance BPA',
      value: fundamental.croissanceBpa,
      suffix: '%',
    },
    {
      key: 'rendementDividende',
      label: 'Rendement dividende',
      value: fundamental.rendementDividende,
      suffix: '%',
    },
    {
      key: 'priceBook',
      label: 'Price / Book',
      value: fundamental.priceBook,
      suffix: 'x',
    },
  ];

  return (
    <div className="gsm-native-marketanalysisscreens-77a829b08">
      {espaceClient ? (
        <ClientBreadcrumb
          items={[
            'Espace Client',
            'Marchés Actions',
            `Analyse · ${instrument.nom}`,
          ]}
        />
      ) : (
        <Breadcrumb
          items={[
            'Accueil',
            'Marchés Actions',
            { label: `Analyse · ${instrument.nom}` },
          ]}
        />
      )}

      <div className="gsm-native-marketanalysisscreens-3fcaa373c">
        <div>
          <Eyebrow>Analyse d'instrument</Eyebrow>
          <div className="gsm-native-marketanalysisscreens-a5c870ab5">
            <h2
              className="gsm-native-marketanalysisscreens-c01d866fa"
              style={{ ...F_DISPLAY, color: C.ink }}
            >
              {instrument.nom}
            </h2>
            <Badge tone="navy">{instrument.marche}</Badge>
            <Badge tone="slate">{fundamental.secteur}</Badge>
          </div>
          <div className="gsm-native-marketanalysisscreens-ef9144c33" style={{ color: C.sub }}>
            Analyse technique et fondamentale intégrée. Les valeurs de cette
            page sont simulées pour la maquette et devront être remplacées par
            les données historiques et financières réelles de la plateforme.
          </div>
        </div>
        <div className="gsm-native-marketanalysisscreens-398b83fb6">
          <div
            className="gsm-native-marketanalysisscreens-935e931f0"
            style={{ color: C.sub }}
          >
            Dernier cours
          </div>
          <div
            className="gsm-native-marketanalysisscreens-f82e7b61e"
            style={{ ...F_MONO, color: C.ink }}
          >
            {fmtPrice(latest.close)} {instrument.devise}
          </div>
          <div className="gsm-native-marketanalysisscreens-07821e826">
            <Pct v={dayMove} />
          </div>
        </div>
      </div>

      <div className="gsm-native-marketanalysisscreens-e9d46aecc">
        <div className="gsm-native-marketanalysisscreens-931ef0b85">
          {Object.keys(horizonPoints).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setHorizon(item)}
              className="gsm-native-marketanalysisscreens-f52a6d882"
              style={{
                background: horizon === item ? C.activeBackground : C.surfaceInset,
                color: horizon === item ? C.textPrimary : C.sub,
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="gsm-native-marketanalysisscreens-931ef0b85">
          <Btn
            tone="ghost"
            onClick={() =>
              espaceClient
                ? goClient?.('client-exchanges')
                : go?.('vue-boursiere')
            }
          >
            Retour aux cotations
          </Btn>
          <Btn
            tone="ghost"
            onClick={() => {
              const params = {
                marche: instrument.marche,
                instrument: instrument.nom,
                source: 'vue-boursiere',
              };
              if (espaceClient) {
                goClient?.('client-market-depth', params);
                return;
              }
              go?.('profondeur', params);
            }}
          >
            Voir profondeur
          </Btn>
          {espaceClient && (
            <Btn
              onClick={() =>
                goClient?.('client-ticket', {
                  instrument: instrument.nom,
                  marche: instrument.marche,
                  source: 'vue-boursiere',
                })
              }
            >
              Ticket d'ordre
            </Btn>
          )}
        </div>
      </div>

      <Card className="gsm-native-marketanalysisscreens-81e8fe499">
        <div className="gsm-native-marketanalysisscreens-d5c7c3ffe">
          <div>
            <Eyebrow>Analyse technique</Eyebrow>
            <div className="gsm-native-marketanalysisscreens-c6284fa1f" style={{ color: C.ink }}>
              Prix, tendance et outils graphiques
            </div>
            <div className="gsm-native-marketanalysisscreens-6fab630d4" style={{ color: C.sub }}>
              Bougies OHLC, courbe linéaire ou aire, MM20/MM50 et tracés
              manuels.
            </div>
          </div>
          <Badge
            tone={
              trend.includes('haussière')
                ? 'teal'
                : trend.includes('baissière')
                ? 'coral'
                : 'slate'
            }
          >
            {trend}
          </Badge>
        </div>

        <TechnicalPriceChart rows={rows} devise={instrument.devise} />

        <div className="gsm-native-marketanalysisscreens-6229fcb97">
          {[
            {
              label: 'RSI 14',
              value: rsi.toFixed(1),
              detail: momentum,
            },
            {
              label: 'MACD',
              value: macd.macd.toFixed(2),
              detail:
                macd.histogram >= 0 ? 'Momentum positif' : 'Momentum négatif',
            },
            {
              label: 'MM20',
              value: `${fmtPrice(sma20)} ${instrument.devise}`,
              detail:
                latest.close >= sma20 ? 'Cours au-dessus' : 'Cours en dessous',
            },
            {
              label: 'MM50',
              value: `${fmtPrice(sma50)} ${instrument.devise}`,
              detail: sma20 >= sma50 ? 'MM20 ≥ MM50' : 'MM20 < MM50',
            },
            {
              label: 'Support 20 j',
              value: `${fmtPrice(support)} ${instrument.devise}`,
              detail: 'Plus bas récent',
            },
            {
              label: 'Résistance 20 j',
              value: `${fmtPrice(resistance)} ${instrument.devise}`,
              detail: `Vol. ${volatility.toFixed(1)}% annualisée`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="gsm-native-marketanalysisscreens-896bd7706"
              style={{ borderColor: C.line, background: C.surfaceElevated }}
            >
              <div
                className="gsm-native-marketanalysisscreens-935e931f0"
                style={{ color: C.sub }}
              >
                {item.label}
              </div>
              <div
                className="gsm-native-marketanalysisscreens-10494f1a9"
                style={{ ...F_MONO, color: C.ink }}
              >
                {item.value}
              </div>
              <div className="gsm-native-marketanalysisscreens-f6eb61431" style={{ color: C.sub }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="gsm-native-marketanalysisscreens-81e8fe499">
        <div className="gsm-native-marketanalysisscreens-3fcaa373c">
          <div>
            <Eyebrow>Analyse fondamentale</Eyebrow>
            <div className="gsm-native-marketanalysisscreens-c6284fa1f" style={{ color: C.ink }}>
              Rentabilité, valorisation et qualité financière
            </div>
            <div className="gsm-native-marketanalysisscreens-ef9144c33" style={{ color: C.sub }}>
              Les ratios ci-dessous expliquent ce que le marché paie, la
              rentabilité des capitaux et des actifs, la marge, le levier et la
              croissance.
            </div>
          </div>
          <Badge tone="gold">Ratios de démonstration</Badge>
        </div>

        <div className="gsm-native-marketanalysisscreens-69cc91635">
          {ratios.map((ratio) => {
            const explanation = fundamentalRatioExplanation(
              ratio.key,
              ratio.value,
              fundamental.secteur
            );
            return (
              <div
                key={ratio.key}
                className="gsm-native-marketanalysisscreens-15ac52aff"
                style={{ borderColor: C.line, background: C.surfaceCard }}
              >
                <div className="gsm-native-marketanalysisscreens-f12714dc5">
                  <div>
                    <div
                      className="gsm-native-marketanalysisscreens-935e931f0"
                      style={{ color: C.sub }}
                    >
                      {ratio.label}
                    </div>
                    <div
                      className="gsm-native-marketanalysisscreens-5589741c9"
                      style={{ ...F_MONO, color: C.ink }}
                    >
                      {Number(ratio.value).toFixed(
                        ratio.key === 'detteFondsPropres' ||
                          ratio.key === 'priceBook'
                          ? 2
                          : 1
                      )}
                      {ratio.suffix}
                    </div>
                  </div>
                  <Badge tone="slate">Démo</Badge>
                </div>
                <div
                  className="gsm-native-marketanalysisscreens-7f59c4916"
                  style={{ color: C.sub }}
                >
                  <b style={{ color: C.ink }}>Ce que mesure le ratio :</b>{' '}
                  {explanation.definition}
                </div>
                <div
                  className="gsm-native-marketanalysisscreens-bb37500d1"
                  style={{ color: C.sub }}
                >
                  <b style={{ color: C.ink }}>Lecture :</b>{' '}
                  {explanation.lecture}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="gsm-native-marketanalysisscreens-d64fb07d4" style={{ borderColor: C.gold }}>
        <Eyebrow>Lecture croisée</Eyebrow>
        <div className="gsm-native-marketanalysisscreens-f8cdd7481">
          <div>
            <div className="gsm-native-marketanalysisscreens-51c79037d" style={{ color: C.ink }}>
              Technique
            </div>
            <div
              className="gsm-native-marketanalysisscreens-2fd036c06"
              style={{ color: C.sub }}
            >
              {trend}. {momentum}. Le MACD est{' '}
              {macd.histogram >= 0
                ? 'au-dessus de son signal'
                : 'sous son signal'}{' '}
              ; les niveaux de support et résistance récents se situent autour
              de {fmtPrice(support)} et {fmtPrice(resistance)}{' '}
              {instrument.devise}.
            </div>
          </div>
          <div>
            <div className="gsm-native-marketanalysisscreens-51c79037d" style={{ color: C.ink }}>
              Fondamental
            </div>
            <div
              className="gsm-native-marketanalysisscreens-2fd036c06"
              style={{ color: C.sub }}
            >
              Le PER de démonstration est de {fundamental.per.toFixed(1)}x, avec
              un ROE de {fundamental.roe.toFixed(1)}% et un ROA de{' '}
              {fundamental.roa.toFixed(1)}%. Cette synthèse ne constitue pas une
              recommandation d’achat ou de vente et devra être recalculée avec
              les données financières réelles de l’émetteur.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------- ESPACE CLIENT — GESTION LIBRE ---------------------- */
/*
 * Données de démonstration : un même investisseur consolide ici plusieurs
 * portefeuilles détenus auprès de SGI différentes et sur plusieurs marchés.
 * En production, ces données proviendront des connexions/API ou imports des SGI.
 */

export {
  VueBourses,
  AnalyseInstrument,
};
