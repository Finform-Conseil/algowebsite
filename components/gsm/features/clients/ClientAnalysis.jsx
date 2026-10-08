import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { convertCurrency, fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { Donut, Legende } from '../home/HomeWidgets';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { ClientBreadcrumb } from './ClientCommon';

export function createClientAnalysisScreen(dependencies) {
  const {
    CLIENT_GESTION_LIBRE,
    CLIENT_HISTORY,
    clientCashIn,
    clientLineValue,
    clientPortfolioValueIn,
    clientSector,
  } = dependencies;

  function ClientAnalysis({ devise }) {
  const portefeuilles = CLIENT_GESTION_LIBRE.portefeuilles;
  const [filtrePaysHistorique, setFiltrePaysHistorique] = useState('Tous');
  const [filtreSgiHistorique, setFiltreSgiHistorique] = useState('Toutes');
  const [dateDebutHistorique, setDateDebutHistorique] = useState(
    CLIENT_HISTORY[0]?.date || ''
  );

  const paysDisponiblesHistorique = [
    'Tous',
    ...new Set(portefeuilles.map((portefeuille) => portefeuille.pays)),
  ];
  const sgiDisponiblesHistorique = [
    'Toutes',
    ...new Set(
      portefeuilles
        .filter(
          (portefeuille) =>
            filtrePaysHistorique === 'Tous' ||
            portefeuille.pays === filtrePaysHistorique
        )
        .map((portefeuille) => portefeuille.sgi)
    ),
  ];

  const portefeuillesHistoriques = portefeuilles.filter(
    (portefeuille) =>
      (filtrePaysHistorique === 'Tous' ||
        portefeuille.pays === filtrePaysHistorique) &&
      (filtreSgiHistorique === 'Toutes' ||
        portefeuille.sgi === filtreSgiHistorique)
  );

  const patrimoine = portefeuilles.reduce(
    (somme, portefeuille) =>
      somme + clientPortfolioValueIn(portefeuille, devise),
    0
  );

  const pays = {};
  const secteurs = {};
  const lignes = [];
  let patrimoineInvesti = 0;

  portefeuilles.forEach((portefeuille) => {
    const valeurPf = clientPortfolioValueIn(portefeuille, devise);
    pays[portefeuille.pays] = (pays[portefeuille.pays] || 0) + valeurPf;

    portefeuille.lignes.forEach((ligne) => {
      const valeur = convertCurrency(
        clientLineValue(ligne),
        portefeuille.devise,
        devise
      );
      const secteur = clientSector(ligne.instrument);

      patrimoineInvesti += valeur;
      secteurs[secteur] = (secteurs[secteur] || 0) + valeur;
      lignes.push({
        instrument: ligne.instrument,
        sgi: portefeuille.sgi,
        valeur,
      });
    });
  });

  const topLignes = lignes.sort((a, b) => b.valeur - a.valeur).slice(0, 5);
  const expositionPays = Object.entries(pays).map(([name, montant]) => ({
    name,
    montant,
    value:
      patrimoine > 0 ? Number(((montant / patrimoine) * 100).toFixed(1)) : 0,
    devise,
  }));
  const expositionSectorielle = Object.entries(secteurs)
    .map(([name, montant]) => ({
      name,
      montant,
      value:
        patrimoineInvesti > 0
          ? Number(((montant / patrimoineInvesti) * 100).toFixed(1))
          : 0,
      devise,
    }))
    .sort((a, b) => b.montant - a.montant);
  const concentrationTop3 =
    patrimoine > 0
      ? (topLignes.slice(0, 3).reduce((s, ligne) => s + ligne.valeur, 0) /
          patrimoine) *
        100
      : 0;

  const pointsHistoriqueAffiches = CLIENT_HISTORY.map(
    (point, indexOriginal) => ({
      ...point,
      indexOriginal,
    })
  ).filter(
    (point) =>
      !dateDebutHistorique ||
      point.date.slice(0, 7) >= dateDebutHistorique.slice(0, 7)
  );
  const periodesHistorique = pointsHistoriqueAffiches.map(
    (point) => point.mois
  );
  const dateMinHistorique = CLIENT_HISTORY[0]?.date || '';
  const dateMaxHistorique = '2026-08-31';
  const libelleDebutHistorique =
    pointsHistoriqueAffiches[0]?.mois || CLIENT_HISTORY[0]?.mois || '—';
  const couleursHistorique = [
    C.gold,
    C.teal,
    C.indigo,
    C.coral,
    C.chartSeriesMuted,
    C.chartSeriesViolet,
    C.chartSeriesBlue,
    C.chartSeriesBronze,
  ];
  const formatCompact = (montant) =>
    new Intl.NumberFormat('fr-FR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(montant || 0));
  const formatMontantTooltip = (montant) =>
    `${fmt(Math.round(Number(montant || 0)))} ${devise}`;
  const seedTexte = (texte) =>
    String(texte)
      .split('')
      .reduce(
        (somme, caractere, index) =>
          somme + caractere.charCodeAt(0) * (index + 1),
        0
      );
  const indiceBase100 = (nom, index, famille = 'secteur') => {
    const seed = seedTexte(`${famille}-${nom}`);
    const tendance =
      famille === 'secteur'
        ? 0.32 + (seed % 7) * 0.07
        : 0.28 + (seed % 6) * 0.08;
    const volatilite =
      famille === 'secteur' ? 0.9 + (seed % 5) * 0.22 : 0.7 + (seed % 4) * 0.2;
    const phase = (seed % 11) * 0.31;
    const valeurBrute = (rang) =>
      100 +
      rang * tendance +
      Math.sin(rang * 0.86 + phase) * volatilite +
      Math.cos(rang * 0.41 + phase / 2) * volatilite * 0.45;
    return Number((100 + valeurBrute(index) - valeurBrute(0)).toFixed(2));
  };

  const secteursFiltresMontants = {};
  portefeuillesHistoriques.forEach((portefeuille) => {
    portefeuille.lignes.forEach((ligne) => {
      const secteur = clientSector(ligne.instrument);
      const valeur = convertCurrency(
        clientLineValue(ligne),
        portefeuille.devise,
        devise
      );
      secteursFiltresMontants[secteur] =
        (secteursFiltresMontants[secteur] || 0) + valeur;
    });
  });

  const seriesSecteurs = Object.entries(secteursFiltresMontants)
    .sort((a, b) => b[1] - a[1])
    .map(([name, montant], index) => ({
      name,
      montant,
      key: `secteur_${index}`,
      color: couleursHistorique[index % couleursHistorique.length],
    }));
  const [visibiliteSecteurs, setVisibiliteSecteurs] = useState(() => {
    const tousSecteurs = [
      ...new Set(
        portefeuilles.flatMap((portefeuille) =>
          portefeuille.lignes.map((ligne) => clientSector(ligne.instrument))
        )
      ),
    ];
    return {
      general: true,
      ...Object.fromEntries(tousSecteurs.map((secteur) => [secteur, true])),
    };
  });

  const historiqueSecteurs = periodesHistorique.map((mois, index) => {
    const indexOriginal =
      pointsHistoriqueAffiches[index]?.indexOriginal ?? index;
    const ligneHistorique = { mois };
    let investissementGeneralMontant = 0;

    seriesSecteurs.forEach((serie) => {
      const indice = indiceBase100(serie.name, index, 'secteur');
      const indiceFinal = indiceBase100(
        serie.name,
        periodesHistorique.length - 1,
        'secteur'
      );      const montant =
        indiceFinal !== 0
          ? (serie.montant * indice) / indiceFinal
          : serie.montant;
      ligneHistorique[serie.key] = indice;
      ligneHistorique[`${serie.key}Montant`] = montant;
      investissementGeneralMontant += montant;
    });

    ligneHistorique.generalMontant = investissementGeneralMontant;
    return ligneHistorique;
  });
  const baseInvestissementGeneral = historiqueSecteurs[0]?.generalMontant || 1;
  historiqueSecteurs.forEach((ligneHistorique) => {
    ligneHistorique.general = Number(
      (
        (ligneHistorique.generalMontant / baseInvestissementGeneral) *
        100
      ).toFixed(2)
    );
  });

  const facteursFluxEspeces = [
    0, 0.045, -0.028, 0.062, -0.038, 0.024, 0.051, -0.044, 0.035, -0.021, 0.058,
    -0.017,
  ];
  historiqueSecteurs.forEach((ligneHistorique, index) => {
    const indexOriginal =
      pointsHistoriqueAffiches[index]?.indexOriginal ?? index;
    const facteurFlux = facteursFluxEspeces[indexOriginal] ?? 0;

    ligneHistorique.cashVariation = portefeuillesHistoriques.reduce(
      (somme, portefeuille) => {
        const cash = clientCashIn(portefeuille, devise);
        const seed = seedTexte(portefeuille.sgi);
        const amplitude = 0.82 + (seed % 5) * 0.09;
        const alternance = (seed + indexOriginal) % 4 === 0 ? -0.35 : 1;
        return somme + cash * facteurFlux * amplitude * alternance;
      },
      0
    );
  });

  const sgiFiltresMontants = {};
  portefeuillesHistoriques.forEach((portefeuille) => {
    const investissement = portefeuille.lignes.reduce(
      (somme, ligne) =>
        somme +
        convertCurrency(clientLineValue(ligne), portefeuille.devise, devise),
      0
    );
    const cash = clientCashIn(portefeuille, devise);
    if (!sgiFiltresMontants[portefeuille.sgi]) {
      sgiFiltresMontants[portefeuille.sgi] = {
        investissement: 0,
        cash: 0,
      };
    }
    sgiFiltresMontants[portefeuille.sgi].investissement += investissement;
    sgiFiltresMontants[portefeuille.sgi].cash += cash;
  });

  const seriesSgi = Object.entries(sgiFiltresMontants)
    .sort((a, b) => b[1].investissement - a[1].investissement)
    .map(([name, valeurs], index) => ({
      name,
      ...valeurs,
      key: `sgi_${index}`,
      cashKey: `sgi_cash_${index}`,
      color: couleursHistorique[index % couleursHistorique.length],
    }));
  const [visibiliteSgi, setVisibiliteSgi] = useState(() => ({
    general: true,
    ...Object.fromEntries(
      [...new Set(portefeuilles.map((portefeuille) => portefeuille.sgi))].map(
        (sgi) => [sgi, true]
      )
    ),
  }));

  const facteursSoldeCash = [
    0.8, 0.84, 0.79, 0.88, 0.91, 0.87, 0.94, 0.9, 0.96, 0.93, 0.98, 1,
  ];
  const historiqueSgi = periodesHistorique.map((mois, index) => {
    const indexOriginal =
      pointsHistoriqueAffiches[index]?.indexOriginal ?? index;
    const ligneHistorique = { mois };
    let investissementGeneralMontant = 0;

    seriesSgi.forEach((serie) => {
      const indice = indiceBase100(serie.name, index, 'sgi');
      const indiceFinal = indiceBase100(
        serie.name,
        periodesHistorique.length - 1,
        'sgi'
      );
      const montantInvesti =
        indiceFinal !== 0
          ? (serie.investissement * indice) / indiceFinal
          : serie.investissement;
      const seed = seedTexte(`cash-${serie.name}`);
      const modulation = 0.88 + (seed % 5) * 0.04;
      const facteurCash =
        1 + (facteursSoldeCash[indexOriginal] - 1) * modulation;
      const montantCash = serie.cash * facteurCash;

      ligneHistorique[serie.key] = indice;
      ligneHistorique[`${serie.key}Montant`] = montantInvesti;
      ligneHistorique[serie.cashKey] = montantCash;
      investissementGeneralMontant += montantInvesti;
    });

    ligneHistorique.generalMontant = investissementGeneralMontant;
    return ligneHistorique;
  });
  const baseGeneralSgi = historiqueSgi[0]?.generalMontant || 1;
  historiqueSgi.forEach((ligneHistorique) => {
    ligneHistorique.general = Number(
      ((ligneHistorique.generalMontant / baseGeneralSgi) * 100).toFixed(2)
    );
  });

  const metaGraphiqueSecteurs = {
    general: {
      label: 'Investissement général',
      type: 'base100',
      amountKey: 'generalMontant',
    },
    cashVariation: {
      label: 'Variation compte espèces',
      type: 'cashVariation',
    },
    ...Object.fromEntries(
      seriesSecteurs.map((serie) => [
        serie.key,
        {
          label: serie.name,
          type: 'base100',
          amountKey: `${serie.key}Montant`,
        },
      ])
    ),
  };

  const metaGraphiqueSgi = {
    general: {
      label: 'Investissement général',
      type: 'base100',
      amountKey: 'generalMontant',
    },
    ...Object.fromEntries(
      seriesSgi.flatMap((serie) => [
        [
          serie.key,
          {
            label: `${serie.name} · Investissement`,
            type: 'base100',
            amountKey: `${serie.key}Montant`,
          },
        ],
        [
          serie.cashKey,
          {
            label: `${serie.name} · Compte espèces`,
            type: 'cashBalance',
          },
        ],
      ])
    ),
  };

  const renderTooltipHistorique = (meta) =>
    function TooltipHistorique({ active, payload, label }) {
      if (!active || !payload?.length) return null;
      const point = payload[0]?.payload || {};
      const entrees = payload.filter((item) => meta[item.dataKey]);

      return (
        <div
          className="gsm-native-clientanalysis-fad5ba51e"
          style={{ borderColor: C.line, minWidth: 210, ...F_BODY }}
        >
          <div className="gsm-native-clientanalysis-20d894779" style={{ color: C.ink }}>
            {label}
          </div>
          <div className="gsm-native-clientanalysis-00bfb20ec">
            {entrees.map((item) => {
              const info = meta[item.dataKey];
              if (!info) return null;
              return (
                <div key={item.dataKey} className="gsm-native-clientanalysis-b0c3082e0">
                  <div
                    className="gsm-native-clientanalysis-b1065793c"
                    style={{ color: item.color || C.ink }}
                  >
                    <span>{info.label}</span>
                    {info.type === 'base100' ? (
                      <span style={F_MONO}>
                        Indice {Number(item.value).toFixed(2)}
                      </span>                    ) : (
                      <span style={F_MONO}>
                        {info.type === 'cashVariation' && Number(item.value) > 0
                          ? '+'
                          : ''}
                        {formatMontantTooltip(item.value)}
                      </span>
                    )}
                  </div>
                  {info.type === 'base100' && (
                    <>
                      <div
                        className="gsm-native-clientanalysis-0f46ac3c7"
                        style={{ color: C.sub }}
                      >
                        <span>Variation vs base 100</span>
                        <span style={F_MONO}>
                          {Number(item.value) - 100 >= 0 ? '+' : ''}
                          {(Number(item.value) - 100).toFixed(2)}%
                        </span>
                      </div>
                      <div
                        className="gsm-native-clientanalysis-0f46ac3c7"
                        style={{ color: C.sub }}
                      >
                        <span>Montant</span>
                        <span style={F_MONO}>
                          {formatMontantTooltip(point[info.amountKey])}
                        </span>
                      </div>
                    </>
                  )}
                  {info.type === 'cashVariation' && (
                    <div className="gsm-native-clientanalysis-6e92d4b15" style={{ color: C.sub }}>
                      {Number(item.value) >= 0
                        ? 'Ajout net de liquidité'
                        : 'Retrait net de liquidité'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

  const TooltipSecteurs = renderTooltipHistorique(metaGraphiqueSecteurs);
  const TooltipSgi = renderTooltipHistorique(metaGraphiqueSgi);

  return (
    <div className="gsm-native-clientanalysis-49eb2993e">
      <ClientBreadcrumb items={['Espace Client', 'Performance & risque']} />
      <div>
        <h2
          className="gsm-native-clientanalysis-e95708a90"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          Performance & risque
        </h2>
        <div className="gsm-native-clientanalysis-746458460" style={{ color: C.sub }}>
          Analyse consolidée de votre patrimoine, indépendamment de la SGI qui
          détient chaque position.
        </div>
      </div>

      <Card className="gsm-native-clientanalysis-a7da79528" style={{ borderColor: C.borderSubtle }}>
        <div className="gsm-native-clientanalysis-fc064d375">
          <div>
            <Eyebrow>Filtres des historiques</Eyebrow>
            <div className="gsm-native-clientanalysis-dd8fa2a16" style={{ color: C.sub }}>
              Les deux graphiques utilisent le même périmètre pour comparer
              secteurs, SGI et mouvements de trésorerie.
            </div>
          </div>
          <div className="gsm-native-clientanalysis-423b7a942">
            <div>
              <label
                className="gsm-native-clientanalysis-00b29e3ef"
                style={{ color: C.sub }}
              >
                Date de début
              </label>
              <input name="gsm-clientanalysis-508"
                type="date"
                min={dateMinHistorique}
                max={dateMaxHistorique}
                value={dateDebutHistorique}
                onChange={(e) => setDateDebutHistorique(e.target.value)}
                className="gsm-native-clientanalysis-faf503a17"
                style={{ borderColor: C.line, background: C.surfaceCard, ...F_MONO }}
                aria-label="Date de début d'affichage des graphiques historiques"
              />
            </div>
            <div>
              <label
                className="gsm-native-clientanalysis-00b29e3ef"
                style={{ color: C.sub }}
              >
                Pays
              </label>
              <select name="gsm-clientanalysis-526" aria-label="Sélection clientanalysis"
                value={filtrePaysHistorique}
                onChange={(e) => {
                  setFiltrePaysHistorique(e.target.value);
                  setFiltreSgiHistorique('Toutes');
                }}
                className="gsm-native-clientanalysis-faf503a17"
                style={{ borderColor: C.line, background: C.surfaceCard }}
              >
                {paysDisponiblesHistorique.map((paysOption) => (
                  <option key={paysOption}>{paysOption}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="gsm-native-clientanalysis-00b29e3ef"
                style={{ color: C.sub }}
              >
                Société de gestion / SGI
              </label>
              <select name="gsm-clientanalysis-547" aria-label="Sélection clientanalysis"
                value={filtreSgiHistorique}
                onChange={(e) => setFiltreSgiHistorique(e.target.value)}
                className="gsm-native-clientanalysis-25ca376c2"
                style={{ borderColor: C.line, background: C.surfaceCard }}
              >
                {sgiDisponiblesHistorique.map((sgiOption) => (
                  <option key={sgiOption}>{sgiOption}</option>
                ))}
              </select>
            </div>
            <div className="gsm-native-clientanalysis-19e323567">
              {dateDebutHistorique !== dateMinHistorique && (
                <button
                  type="button"
                  onClick={() => setDateDebutHistorique(dateMinHistorique)}
                  className="gsm-native-clientanalysis-bc9eeaa67"
                  style={{
                    borderColor: C.line,
                    color: C.navy,
                    background: C.surfaceCard,
                  }}
                >
                  Tout l'historique
                </button>
              )}
              <Badge tone="gold">
                Depuis {libelleDebutHistorique} ·{' '}
                {portefeuillesHistoriques.length} portefeuille(s) ·{' '}
                {seriesSgi.length} SGI
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="gsm-native-clientanalysis-0af17b48c">
        <Card className="gsm-native-clientanalysis-c105fc813">
          <div className="gsm-native-clientanalysis-d4b6afc1a">
            <div>
              <Eyebrow>
                Historique par secteur — base 100 &amp; flux espèces
              </Eyebrow>
              <div className="gsm-native-clientanalysis-bc2ea7507" style={{ color: C.sub }}>
                Axe gauche : performance rebasée à 100 au début de la période ·
                Axe droit : apports (+) et retraits (−) de liquidité en {devise}
                .
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={historiqueSecteurs}
              margin={{ top: 12, right: 22, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 9, fill: C.sub }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                yAxisId="base100"
                orientation="left"
                tick={{ fontSize: 9, fill: C.sub }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 3', 'dataMax + 3']}
                label={{
                  value: 'Base 100',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 9, fill: C.sub },
                }}
              />              <YAxis
                yAxisId="cash"
                orientation="right"
                tick={{ fontSize: 9, fill: C.sub }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
                label={{
                  value: `Flux espèces (${devise})`,
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 9, fill: C.sub },
                }}
              />
              <Tooltip content={<TooltipSecteurs />} />
              {visibiliteSecteurs.general && (
                <Line
                  yAxisId="base100"
                  type="monotone"
                  dataKey="general"
                  name="Investissement général"
                  stroke={C.navy}
                  strokeWidth={2.8}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
              {seriesSecteurs.map(
                (serie) =>
                  visibiliteSecteurs[serie.name] !== false && (
                    <Line
                      key={serie.key}
                      yAxisId="base100"
                      type="monotone"
                      dataKey={serie.key}
                      name={serie.name}
                      stroke={serie.color}
                      strokeWidth={1.9}
                      dot={{ r: 1.8 }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  )
              )}
              <Line
                yAxisId="cash"
                type="monotone"
                dataKey="cashVariation"
                name="Variation compte espèces"
                stroke={C.coral}
                strokeWidth={2}
                strokeDasharray="7 5"
                dot={{ r: 2.2 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div
            className="gsm-native-clientanalysis-0df13cc2e"
            style={F_BODY}
          >
            <button
              type="button"
              onClick={() =>
                setVisibiliteSecteurs((courant) => ({
                  ...courant,
                  general: !courant.general,
                }))
              }
              className="gsm-native-clientanalysis-e16a1806b"
              style={{
                color: C.ink,
                opacity: visibiliteSecteurs.general ? 1 : 0.35,
                textDecoration: visibiliteSecteurs.general
                  ? 'none'
                  : 'line-through',
              }}
            >
              <span
                className="gsm-native-clientanalysis-b172fa915"
                style={{ height: 3, background: C.navy }}
              />
              Général
            </button>
            {seriesSecteurs.map((serie) => {
              const visible = visibiliteSecteurs[serie.name] !== false;
              return (
                <button
                  key={serie.key}
                  type="button"
                  onClick={() =>
                    setVisibiliteSecteurs((courant) => ({
                      ...courant,
                      [serie.name]: !visible,
                    }))
                  }
                  className="gsm-native-clientanalysis-e16a1806b"
                  style={{
                    color: C.ink,
                    opacity: visible ? 1 : 0.35,
                    textDecoration: visible ? 'none' : 'line-through',
                  }}
                >
                  <span
                    className="gsm-native-clientanalysis-b172fa915"
                    style={{ height: 3, background: serie.color }}
                  />
                  {serie.name}
                </button>
              );
            })}
            <span
              className="gsm-native-clientanalysis-e16a1806b"
              style={{ color: C.coral }}
            >
              <span
                className="gsm-native-clientanalysis-ef09d6902"
                style={{ borderTop: `2px dashed ${C.coral}` }}
              />
              Flux espèces
            </span>
          </div>
        </Card>

        <Card className="gsm-native-clientanalysis-c105fc813">
          <div className="gsm-native-clientanalysis-d4b6afc1a">
            <div>
              <Eyebrow>
                Historique par SGI — base 100 &amp; comptes espèces
              </Eyebrow>
              <div className="gsm-native-clientanalysis-bc2ea7507" style={{ color: C.sub }}>
                Traits pleins : investissement rebasé à 100 au début de la
                période · Traits pointillés : solde du compte espèces de la même
                SGI en {devise}.
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={historiqueSgi}
              margin={{ top: 12, right: 22, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 9, fill: C.sub }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                yAxisId="base100"
                orientation="left"
                tick={{ fontSize: 9, fill: C.sub }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 3', 'dataMax + 3']}
                label={{
                  value: 'Base 100',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 9, fill: C.sub },
                }}
              />
              <YAxis
                yAxisId="cash"
                orientation="right"
                tick={{ fontSize: 9, fill: C.sub }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
                label={{
                  value: `Compte espèces (${devise})`,
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 9, fill: C.sub },
                }}
              />
              <Tooltip content={<TooltipSgi />} />
              {visibiliteSgi.general && (
                <Line
                  yAxisId="base100"
                  type="monotone"
                  dataKey="general"
                  name="Investissement général"
                  stroke={C.navy}
                  strokeWidth={2.8}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
              {seriesSgi.map(
                (serie) =>
                  visibiliteSgi[serie.name] !== false && (
                    <Line                      key={serie.key}
                      yAxisId="base100"
                      type="monotone"
                      dataKey={serie.key}
                      name={`${serie.name} · Investissement`}
                      stroke={serie.color}
                      strokeWidth={1.9}
                      dot={{ r: 1.7 }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  )
              )}
              {seriesSgi.map(
                (serie) =>
                  visibiliteSgi[serie.name] !== false && (
                    <Line
                      key={serie.cashKey}
                      yAxisId="cash"
                      type="monotone"
                      dataKey={serie.cashKey}
                      name={`${serie.name} · Compte espèces`}
                      stroke={serie.color}
                      strokeWidth={1.7}
                      strokeDasharray="7 5"
                      dot={{ r: 1.7 }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  )
              )}
            </LineChart>
          </ResponsiveContainer>

          <div
            className="gsm-native-clientanalysis-0df13cc2e"
            style={F_BODY}
          >
            <button
              type="button"
              onClick={() =>
                setVisibiliteSgi((courant) => ({
                  ...courant,
                  general: !courant.general,
                }))
              }
              className="gsm-native-clientanalysis-e16a1806b"
              style={{
                color: C.ink,
                opacity: visibiliteSgi.general ? 1 : 0.35,
                textDecoration: visibiliteSgi.general ? 'none' : 'line-through',
              }}
            >
              <span
                className="gsm-native-clientanalysis-b172fa915"
                style={{ height: 3, background: C.navy }}
              />
              Général
            </button>
            {seriesSgi.map((serie) => {
              const visible = visibiliteSgi[serie.name] !== false;
              return (
                <button
                  key={serie.key}
                  type="button"
                  onClick={() =>
                    setVisibiliteSgi((courant) => ({
                      ...courant,
                      [serie.name]: !visible,
                    }))
                  }
                  className="gsm-native-clientanalysis-e16a1806b"
                  style={{
                    color: C.ink,
                    opacity: visible ? 1 : 0.35,
                    textDecoration: visible ? 'none' : 'line-through',
                  }}
                  title="Afficher/masquer à la fois l'investissement et le compte espèces"
                >
                  <span className="gsm-native-clientanalysis-5a37c4ccc">
                    <span
                      className="gsm-native-clientanalysis-b172fa915"
                      style={{ height: 2, background: serie.color }}
                    />
                    <span
                      className="gsm-native-clientanalysis-ef09d6902"
                      style={{ borderTop: `1px dashed ${serie.color}` }}
                    />
                  </span>
                  {serie.name}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="gsm-native-clientanalysis-70f0ff89e">
        <Eyebrow>Concentration</Eyebrow>
        <div className="gsm-native-clientanalysis-c45709a28">
          <div>
            <div className="gsm-native-clientanalysis-dd8fa2a16" style={{ color: C.sub }}>
              Poids des 3 principales lignes
            </div>
            <div className="gsm-native-clientanalysis-6cb0953d5" style={F_DISPLAY}>
              {concentrationTop3.toFixed(1)}%
            </div>
          </div>
          {topLignes.slice(0, 3).map((ligne) => (
            <div
              key={`${ligne.sgi}-${ligne.instrument}`}
              className="gsm-native-clientanalysis-3372eb17f"
              style={{ borderColor: C.line }}
            >
              <div className="gsm-native-clientanalysis-27fc03bad">{ligne.instrument}</div>
              <div className="gsm-native-clientanalysis-05332f8ae" style={{ color: C.sub }}>
                {ligne.sgi}
              </div>
              <div className="gsm-native-clientanalysis-88ce9651f" style={F_MONO}>
                {patrimoine > 0
                  ? ((ligne.valeur / patrimoine) * 100).toFixed(1)
                  : '0.0'}
                %
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="gsm-native-clientanalysis-411e74c27">
        <Card className="gsm-native-clientanalysis-70f0ff89e">
          <Eyebrow>Exposition géographique</Eyebrow>
          <Donut data={expositionPays} size={170} />
          <Legende data={expositionPays} />
        </Card>
        <Card className="gsm-native-clientanalysis-70f0ff89e">
          <Eyebrow>Exposition sectorielle</Eyebrow>
          <div className="gsm-native-clientanalysis-81734848b" style={{ color: C.sub }}>
            Répartition des actifs investis par secteur · hors liquidité
          </div>
          <Donut data={expositionSectorielle} size={170} />
          <Legende data={expositionSectorielle} />
        </Card>
      </div>

      <Card className="gsm-native-clientanalysis-3ea7befd9">
        <div className="gsm-native-clientanalysis-a7da79528">
          <Eyebrow>Principales positions consolidées</Eyebrow>
        </div>
        <table className="gsm-native-clientanalysis-ed511e707">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Instrument</Th>
              <Th>SGI</Th>
              <Th>Valeur équiv. {devise}</Th>
              <Th>Poids patrimoine</Th>
            </tr>
          </thead>
          <tbody>
            {topLignes.map((ligne) => (
              <tr
                key={`${ligne.sgi}-${ligne.instrument}`}
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                <Td className="gsm-native-clientanalysis-08bb8a3b7">{ligne.instrument}</Td>
                <Td>{ligne.sgi}</Td>
                <Td mono>
                  {fmt(Math.round(ligne.valeur))} {devise}
                </Td>
                <Td mono>
                  {patrimoine > 0
                    ? ((ligne.valeur / patrimoine) * 100).toFixed(1)
                    : '0.0'}
                  %
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


  return { ClientAnalysis };
}
