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
import { ChevronRight, X } from 'lucide-react';
import { convertCurrency, fmt, FX, toRef } from '../../shared/lib/finance';
import { C, F_BODY, F_DISPLAY, F_MONO, PALETTE } from '../../shared/theme/theme';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { AvailableWithdrawalsModal } from '../../shared/ui/AvailableWithdrawalsModal';
import { Donut, HistoryLegend, Legende, MarketTicker } from './HomeWidgets';
import {
  CLIENTS,
  PROFILE_TYPE_LABEL,
  VOLUME_JOUR,
  aggregateEncoursBy,
} from '../portfolio/PortfolioUniverse';
import {
  HISTORICAL_EVENT_TYPES,
  HISTORIQUE_TRIMESTRIEL_PORTEFEUILLES,
  HistoricalEventsTooltipBlock,
  renderHistoricalEventDot,
  SECTOR_MIX,
  buildAssetMix,
  buildHistoryTwr,
  historicalEventColor,
} from '../portfolio/PortfolioAnalyticsData';
import { ALERTES, expositionClient } from '../trading/TradingDomainData';
import { MARKETS_DATA } from '../markets/MarketDomainData';
import {
  CESSION_RETRAIT_STATUTS,
  cessionRetraitStatusTone,
} from '../trading/CessionWorkflow';

/*
 * Accueil synchronisé depuis origin/main sans réintroduire App.jsx.
 */
function Accueil({
  go,
  openClient,
  devise,
  onDeviseChange,
  cessionRetraitEtats = /** @type {Array<Record<string, unknown>>} */ ([]),
}) {
  const [dim, setDim] = useState('Profil de risque');
  const [genClient, setGenClient] = useState(CLIENTS[0].id);
  const [reportPeriod, setReportPeriod] = useState('Trimestre en cours');
  const [allReports, setAllReports] = useState(false);
  const [devBourse, setDevBourse] = useState({
    BRVM: 'XOF',
    NGX: 'NGN',
    GSE: 'GHS',
  });
  const [selection, setSelection] = useState(null);
  const [retraitsDisponiblesOuverts, setRetraitsDisponiblesOuverts] =
    useState(false);
  const [seuilExpo, setSeuilExpo] = useState(0);
  const [rechercheClient, setRechercheClient] = useState('');
  const [profilHistoriquePortefeuilles, setProfilHistoriquePortefeuilles] =
    useState('Global');
  const [historyVisibility, setHistoryVisibility] = useState({
    gestionTwr: true,
    brvm: true,
    ngxAsi: true,
  });
  const toggleHistorySeries = (dataKey) => {
    setHistoryVisibility((current) => ({
      ...current,
      [dataKey]: !current[dataKey],
    }));
  };
  const profileTypeMixAccueil = aggregateEncoursBy(
    (client) => PROFILE_TYPE_LABEL[client.type] || client.type,
    CLIENTS
  );
  const riskProfileMixAccueil = aggregateEncoursBy(
    (client) => client.profilRisque,
    CLIENTS
  );
  const assetMixAccueil = buildAssetMix(CLIENTS);
  const marketMixAccueil = aggregateEncoursBy(
    (client) => `${client.marche} (${client.devise})`,
    CLIENTS
  );
  const countryMixAccueil = aggregateEncoursBy(
    (client) => client.pays,
    CLIENTS
  );

  const dims = {
    'Profil de risque': riskProfileMixAccueil,
    "Type d'actif": assetMixAccueil,
    'Marché boursier': marketMixAccueil,
    Pays: countryMixAccueil,
    Secteur: SECTOR_MIX,
    'Type de portefeuille': profileTypeMixAccueil,
  };
  const totalRef = CLIENTS.reduce(
    (s, c) => s + convertCurrency(c.encours, c.devise, devise),
    0
  );

  const repartitionCourante = dims[dim].map((element) => ({
    ...element,
    montant: (totalRef * element.value) / 100,
    devise,
  }));

  const profilsRisqueAccueil = [
    'Équilibré',
    'Prudence',
    'Performance',
    'Croissance',
    'Sérénité',
  ];

  const statistiquesProfilsAccueil = profilsRisqueAccueil.map((profil) => {
    const portefeuilles = CLIENTS.filter((c) => c.profilRisque === profil);
    const encoursProfil = portefeuilles.reduce(
      (s, c) => s + convertCurrency(c.encours, c.devise, devise),
      0
    );
    const variationEncoursPonderee =
      encoursProfil > 0
        ? portefeuilles.reduce(
            (s, c) =>
              s +
              convertCurrency(c.encours, c.devise, devise) *
                Number(c.perf || 0),
            0
          ) / encoursProfil
        : 0;
    const rendementPondere =
      encoursProfil > 0
        ? portefeuilles.reduce(
            (s, c) =>
              s +
              convertCurrency(c.encours, c.devise, devise) *
                Number(c.rentabilite || 0),
            0
          ) / encoursProfil
        : 0;

    return {
      profil,
      nombre: portefeuilles.length,
      encoursProfil,
      variationEncoursPonderee,
      rendementPondere,
    };
  });

  const historiqueNombrePortefeuilles =
    HISTORIQUE_TRIMESTRIEL_PORTEFEUILLES.map(({ trimestre, fin }) => {
      const portefeuillesActifs = CLIENTS.filter(
        (client) => !client.dateEntree || client.dateEntree <= fin
      );
      const ligne = { trimestre, Global: portefeuillesActifs.length };
      profilsRisqueAccueil.forEach((profil) => {
        ligne[profil] = portefeuillesActifs.filter(
          (client) => client.profilRisque === profil
        ).length;
      });
      return ligne;
    });

  const serieHistoriquePortefeuilles = historiqueNombrePortefeuilles.map(
    (ligne) => ({
      trimestre: ligne.trimestre,
      nombre: ligne[profilHistoriquePortefeuilles] || 0,
    })
  );
  const premierPointHistoriquePortefeuilles =
    serieHistoriquePortefeuilles[0]?.nombre || 0;
  const dernierPointHistoriquePortefeuilles =
    serieHistoriquePortefeuilles[serieHistoriquePortefeuilles.length - 1]
      ?.nombre || 0;
  const croissanceHistoriquePortefeuilles =
    dernierPointHistoriquePortefeuilles - premierPointHistoriquePortefeuilles;

  const variationEncoursPondereeGlobale =
    totalRef > 0
      ? CLIENTS.reduce(
          (s, c) =>
            s +
            convertCurrency(c.encours, c.devise, devise) * Number(c.perf || 0),
          0
        ) / totalRef
      : 0;

  const rendementMoyenPondereGlobal =
    totalRef > 0
      ? CLIENTS.reduce(
          (s, c) =>
            s +
            convertCurrency(c.encours, c.devise, devise) *
              Number(c.rentabilite || 0),
          0
        ) / totalRef
      : 0;

  const historiquePerformance = buildHistoryTwr(totalRef, devise);
  const dernierHistorique =
    historiquePerformance[historiquePerformance.length - 1] || {};
  const performanceGestionTwr =
    Number(dernierHistorique.gestionTwr || 100) - 100;
  const performanceBrvm = Number(dernierHistorique.brvm || 100) - 100;
  const performanceNgx = Number(dernierHistorique.ngxAsi || 100) - 100;
  const fluxNetHistorique = historiquePerformance.reduce(
    (somme, point) => somme + Number(point.fluxNet || 0),
    0
  );

  const typesAlertesAccueil = ['Rendement', 'Risque', 'Allocation'];
  const statistiquesAlertesAccueil = typesAlertesAccueil.map((type) => ({
    type,
    nombre: ALERTES.filter((alerte) => alerte.type === type).length,
  }));
  const totalAlertes = statistiquesAlertesAccueil.reduce(
    (somme, stat) => somme + stat.nombre,
    0
  );

  const statistiquesCessionRetraitAccueil = CESSION_RETRAIT_STATUTS.map(
    (statut) => ({
      statut,
      nombre: cessionRetraitEtats.filter((item) => item.statut === statut)
        .length,
    })
  );
  const totalCessionRetraitActifs = cessionRetraitEtats.filter(
    (item) => item.statut !== 'Retrait disponible'
  ).length;
  const retraitsDisponiblesAccueil = cessionRetraitEtats.filter(
    (item) => item.statut === 'Retrait disponible'
  );

  return (
    <div className="gsm-native-homemainscreen-c47e91f89">
      <Breadcrumb items={['Accueil']} />

      <MarketTicker
        markets={MARKETS_DATA}
        onViewAll={() => go('vue-boursiere')}
        onInstrumentClick={(m) =>
          go('instrument-analysis', {
            marche: m.marche,
            instrument: m.nom,
            source: 'accueil-ticker',
          })
        }
      />

      <div className="gsm-native-homemainscreen-63450318e">
        <div className="gsm-native-homemainscreen-b4dcb5eda">
          <span className="gsm-native-homemainscreen-a976298ce" style={{ color: C.sub }}>
            Devise d'affichage du site
          </span>
          <select name="gsm-homemainscreen-266" aria-label="Sélection homemainscreen"
            value={devise}
            onChange={(e) => onDeviseChange(e.target.value)}
            className="gsm-native-homemainscreen-c5f972c4d"
            style={{ borderColor: C.line }}
          >
            {Object.keys(FX).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="gsm-native-homemainscreen-d0b092c55">
        <Card className="gsm-native-homemainscreen-fdcc02d5c">
          <div
            className="gsm-native-homemainscreen-900f3bd87"
            style={{ color: C.sub, ...F_BODY }}
          >
            Encours total (éq. {devise})
          </div>

          <div className="gsm-native-homemainscreen-f40ec76a8">
            <div
              className="gsm-native-homemainscreen-858c76c30"
              style={{ ...F_DISPLAY, color: C.ink }}
            >
              {fmt(Math.round(totalRef))} {devise}
            </div>
            <span className="gsm-native-homemainscreen-f6686ca98" style={{ color: C.sub, ...F_BODY }}>
              Global
            </span>
          </div>

          <div className="gsm-native-homemainscreen-15570316c">
            <Pct v={variationEncoursPondereeGlobale} />
          </div>

          <div
            className="gsm-native-homemainscreen-b0aad8ebf"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {statistiquesProfilsAccueil.map((stat) => (
              <div
                key={stat.profil}
                className="gsm-native-homemainscreen-3e4ff1ec2"
                style={F_BODY}
              >
                <span style={{ color: C.sub }}>{stat.profil}</span>
                <span className="gsm-native-homemainscreen-b72541b5f">
                  <span
                    className="gsm-native-homemainscreen-b543e0e58"
                    style={{ color: C.ink, ...F_MONO }}
                  >
                    {fmt(Math.round(stat.encoursProfil))} {devise}
                  </span>
                  <Pct v={stat.variationEncoursPonderee} />
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gsm-native-homemainscreen-fdcc02d5c">
          <div
            className="gsm-native-homemainscreen-900f3bd87"
            style={{ color: C.sub, ...F_BODY }}
          >
            Portefeuilles gérés
          </div>
          <div className="gsm-native-homemainscreen-f40ec76a8">
            <div
              className="gsm-native-homemainscreen-858c76c30"
              style={{ ...F_DISPLAY, color: C.ink }}
            >
              {CLIENTS.length}
            </div>
            <span className="gsm-native-homemainscreen-f6686ca98" style={{ color: C.sub, ...F_BODY }}>
              Global
            </span>
          </div>

          <div
            className="gsm-native-homemainscreen-b0aad8ebf"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {statistiquesProfilsAccueil.map((stat) => (
              <div
                key={stat.profil}
                className="gsm-native-homemainscreen-d80e7b2c4"
                style={F_BODY}
              >
                <span style={{ color: C.sub }}>{stat.profil}</span>
                <span
                  className="gsm-native-homemainscreen-80b121830"
                  style={{ color: C.ink, ...F_MONO }}
                >
                  {stat.nombre}
                </span>
              </div>
            ))}
          </div>

          <div
            className="gsm-native-homemainscreen-fe1e28ab5"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <div className="gsm-native-homemainscreen-dc5cf878c">
              <span
                className="gsm-native-homemainscreen-694943876"
                style={{ color: C.sub, ...F_BODY }}
              >
                Historique trimestriel · 2 ans
              </span>
              <select name="gsm-homemainscreen-387"
                value={profilHistoriquePortefeuilles}
                onChange={(e) =>
                  setProfilHistoriquePortefeuilles(e.target.value)
                }
                className="gsm-native-homemainscreen-69616fb7d"
                style={{ borderColor: C.line, color: C.ink, ...F_BODY }}
                aria-label="Profil affiché dans l'historique des portefeuilles"
              >
                <option>Global</option>
                {profilsRisqueAccueil.map((profil) => (
                  <option key={profil}>{profil}</option>
                ))}
              </select>
            </div>

            <ResponsiveContainer width="100%" height={86}>
              <LineChart
                data={serieHistoriquePortefeuilles}
                margin={{ top: 5, right: 4, left: 4, bottom: 0 }}
              >
                <XAxis
                  dataKey="trimestre"
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                  tick={{ fontSize: 8, fill: C.sub }}
                />
                <YAxis hide domain={[0, 'dataMax + 1']} />
                <Tooltip
                  formatter={(value) => [
                    `${value} portefeuille(s)`,
                    profilHistoriquePortefeuilles,
                  ]}
                  contentStyle={{
                    borderRadius: 9,
                    border: `1px solid ${C.line}`,
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="nombre"
                  stroke={C.indigo}
                  strokeWidth={2.2}
                  dot={{ r: 1.8 }}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <div
              className="gsm-native-homemainscreen-50713262f"
              style={{ color: C.sub, ...F_BODY }}
            >
              <span>{profilHistoriquePortefeuilles}</span>
              <span style={F_MONO}>
                {dernierPointHistoriquePortefeuilles} actuellement ·{' '}
                {croissanceHistoriquePortefeuilles >= 0 ? '+' : ''}
                {croissanceHistoriquePortefeuilles} sur 2 ans
              </span>
            </div>
          </div>

          <div className="gsm-native-homemainscreen-b91677109" style={{ color: C.sub, ...F_BODY }}>
            3 marchés · 3 devises · 5 profils de risque
          </div>
        </Card>

        <Card className="gsm-native-homemainscreen-fdcc02d5c">
          <div className="gsm-native-homemainscreen-75d0af6b8">
            <div
              className="gsm-native-homemainscreen-900f3bd87"
              style={{ color: C.sub, ...F_BODY }}
            >
              Alertes actives
            </div>
            <button
              onClick={() => go('alertes')}
              className="gsm-native-homemainscreen-5ce137ecc"
              style={{ color: C.coral }}
            >
              Voir →
            </button>
          </div>

          <div className="gsm-native-homemainscreen-f40ec76a8">
            <div
              className="gsm-native-homemainscreen-858c76c30"
              style={{ ...F_DISPLAY, color: C.ink }}
            >
              {totalAlertes}
            </div>
            <span className="gsm-native-homemainscreen-f6686ca98" style={{ color: C.sub, ...F_BODY }}>
              Total
            </span>
          </div>

          <div
            className="gsm-native-homemainscreen-b0aad8ebf"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {statistiquesAlertesAccueil.map((stat) => (
              <div
                key={stat.type}
                className="gsm-native-homemainscreen-d80e7b2c4"
                style={F_BODY}
              >
                <span style={{ color: C.sub }}>{stat.type}</span>
                <Badge
                  tone={
                    stat.type === 'Risque'
                      ? 'coral'
                      : stat.type === 'Rendement'
                      ? 'gold'
                      : 'navy'
                  }
                >
                  {stat.nombre}
                </Badge>
              </div>
            ))}
          </div>

          <div
            className="gsm-native-homemainscreen-f02cb0b12"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <div className="gsm-native-homemainscreen-266b3fb5c">
              <div>
                <div
                  className="gsm-native-homemainscreen-e27bffdb5"
                  style={{ color: C.sub }}
                >
                  État cession-retrait
                </div>
                <div className="gsm-native-homemainscreen-510d4cac8" style={{ color: C.sub }}>
                  {totalCessionRetraitActifs} dossier(s) en traitement
                </div>
              </div>
              <button
                type="button"
                onClick={() => go('cession-retrait')}
                className="gsm-native-homemainscreen-b543e0e58"
                style={{ color: C.indigo }}
              >
                Voir →
              </button>
            </div>

            <div className="gsm-native-homemainscreen-cb3bb15b4">
              {statistiquesCessionRetraitAccueil.map((stat) =>
                stat.statut === 'Retrait disponible' ? (
                  <button
                    type="button"
                    key={stat.statut}
                    disabled={stat.nombre === 0}
                    onClick={() => setRetraitsDisponiblesOuverts(true)}
                    className="gsm-native-homemainscreen-9fbcea5bd"
                    style={{
                      background: stat.nombre > 0 ? C.positiveBackground : 'transparent',
                      cursor: stat.nombre > 0 ? 'pointer' : 'default',
                      opacity: stat.nombre > 0 ? 1 : 0.6,
                    }}
                    title={
                      stat.nombre > 0
                        ? 'Voir les retraits disponibles'
                        : 'Aucun retrait disponible'
                    }
                  >
                    <span
                      className="gsm-native-homemainscreen-adfd5a480"
                      style={{ color: stat.nombre > 0 ? C.teal : C.sub }}
                    >
                      {stat.statut}
                      {stat.nombre > 0 && <ChevronRight size={12} />}
                    </span>
                    <Badge tone={cessionRetraitStatusTone(stat.statut)}>
                      {stat.nombre}
                    </Badge>
                  </button>
                ) : (
                  <div
                    key={stat.statut}
                    className="gsm-native-homemainscreen-8cc88b3e5"
                  >
                    <span style={{ color: C.sub }}>{stat.statut}</span>
                    <Badge tone={cessionRetraitStatusTone(stat.statut)}>
                      {stat.nombre}
                    </Badge>
                  </div>
                )
              )}
            </div>

          </div>
        </Card>

        <AvailableWithdrawalsModal
          open={retraitsDisponiblesOuverts}
          items={retraitsDisponiblesAccueil}
          onClose={() => setRetraitsDisponiblesOuverts(false)}
          onOpenClient={openClient}
          onOpenWithdrawals={() => go('cession-retrait')}
        />

        <Card className="gsm-native-homemainscreen-fdcc02d5c">
          <div
            className="gsm-native-homemainscreen-900f3bd87"
            style={{ color: C.sub, ...F_BODY }}
          >
            Rentabilité moyenne pondérée (1 an)
          </div>
          <div className="gsm-native-homemainscreen-f40ec76a8">
            <div className="gsm-native-homemainscreen-597d1ccd1" style={F_DISPLAY}>
              <Pct v={rendementMoyenPondereGlobal} />
            </div>
            <span className="gsm-native-homemainscreen-f6686ca98" style={{ color: C.sub, ...F_BODY }}>
              Global
            </span>
          </div>

          <div
            className="gsm-native-homemainscreen-b0aad8ebf"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {statistiquesProfilsAccueil.map((stat) => (
              <div
                key={stat.profil}
                className="gsm-native-homemainscreen-d80e7b2c4"
                style={F_BODY}
              >
                <span style={{ color: C.sub }}>{stat.profil}</span>
                <span>
                  <Pct v={stat.rendementPondere} />
                </span>
              </div>
            ))}
          </div>

          <div className="gsm-native-homemainscreen-b91677109" style={{ color: C.sub, ...F_BODY }}>
            Pondération par les encours convertis en {devise}
          </div>
        </Card>
      </div>

      <Card className="gsm-native-homemainscreen-281bba47f">
        <div className="gsm-native-homemainscreen-720dd569e">
          <Eyebrow>Répartition de l'encours</Eyebrow>
          <div className="gsm-native-homemainscreen-4fc50e935">
            {Object.keys(dims).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDim(d);
                  setSelection(null);
                }}
                className="gsm-native-homemainscreen-f707a35f2"
                style={{
                  background: dim === d ? C.navySoft : C.card,
                  color: dim === d ? C.ink : C.sub,
                  border: `1px solid ${dim === d ? C.indigo : C.line}`,
                  ...F_BODY,
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="gsm-native-homemainscreen-02aaab1bb">
          <div className="gsm-native-homemainscreen-4e90ed998">
            <Donut data={repartitionCourante} size={170} />
          </div>
          <div className="gsm-native-homemainscreen-797658532">
            <Legende data={repartitionCourante} />
          </div>
          <div
            className="gsm-native-homemainscreen-f79a60788"
            style={{ borderColor: C.line }}
          >
            {!selection && (
              <>
                <div
                  className="gsm-native-homemainscreen-874ec28f6"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  Cliquez une part pour voir le détail par portefeuille.
                </div>
                <div className="gsm-native-homemainscreen-380fa923a">
                  {repartitionCourante.map((d, i) => (
                    <button
                      key={d.name}
                      onClick={() =>
                        setSelection({ dimension: dim, value: d.name })
                      }
                      className="gsm-native-homemainscreen-3fe031c48"
                      style={{
                        borderColor: C.line,
                        background: C.card,
                        cursor: 'pointer',
                        ...F_BODY,
                      }}
                      title={`Voir le détail ${d.name}`}
                    >
                      <span
                        className="gsm-native-homemainscreen-27d678df3"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                      />
                      <span>
                        <span className="gsm-native-homemainscreen-f1413fc9f">
                          {d.name} · {d.value}%
                        </span>
                        <span
                          className="gsm-native-homemainscreen-6ef6a2eb4"
                          style={{ color: C.sub, ...F_MONO }}
                        >
                          {fmt(Math.round(d.montant))} {d.devise}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {selection &&
              (() => {
                const allExpo = CLIENTS.map((c) => ({
                  client: c,
                  expo: expositionClient(
                    c,
                    selection.dimension,
                    selection.value
                  ),
                }));
                const totalValeurRef = allExpo.reduce(
                  (s, r) => s + toRef(r.expo.valeur, r.client.devise),
                  0
                );
                const rows = allExpo
                  .filter((r) => r.expo.pct > 0 && r.expo.pct >= seuilExpo)
                  .filter((r) =>
                    r.client.nom
                      .toLowerCase()
                      .includes(rechercheClient.toLowerCase())
                  )
                  .sort((a, b) => b.expo.pct - a.expo.pct);
                return (
                  <div>
                    <div className="gsm-native-homemainscreen-fa1b50e17">
                      <div className="gsm-native-homemainscreen-ecfc01b95">
                        <Badge tone="gold">
                          {selection.dimension} : {selection.value}
                        </Badge>
                        {(() => {
                          const elementSelectionne = repartitionCourante.find(
                            (element) => element.name === selection.value
                          );
                          return elementSelectionne ? (
                            <Badge tone="navy">
                              {elementSelectionne.value}% ·{' '}
                              {fmt(Math.round(elementSelectionne.montant))}{' '}
                              {elementSelectionne.devise}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                      <button
                        onClick={() => setSelection(null)}
                        className="gsm-native-homemainscreen-a976298ce"
                        style={{ color: C.sub }}
                      >
                        Retour aux parts{' '}
                        <X size={12} style={{ display: 'inline' }} />
                      </button>
                    </div>
                    <div className="gsm-native-homemainscreen-6ce396a6c">
                      <div>
                        <label
                          className="gsm-native-homemainscreen-ec562243c"
                          style={{ color: C.sub }}
                        >
                          Seuil d'allocation min. (%)
                        </label>
                        <input name="gsm-homemainscreen-910" aria-label="Champ homemainscreen"
                          type="number"
                          min="0"
                          max="100"
                          value={seuilExpo}
                          onChange={(e) => setSeuilExpo(Number(e.target.value))}
                          className="gsm-native-homemainscreen-978292889"
                          style={{ borderColor: C.line, ...F_MONO }}
                        />
                      </div>
                      <div className="gsm-native-homemainscreen-018a16e70">
                        <label
                          className="gsm-native-homemainscreen-ec562243c"
                          style={{ color: C.sub }}
                        >
                          Nom du client
                        </label>
                        <input name="gsm-homemainscreen-927" aria-label="Rechercher…"
                          type="text"
                          value={rechercheClient}
                          onChange={(e) => setRechercheClient(e.target.value)}
                          placeholder="Rechercher…"
                          className="gsm-native-homemainscreen-0b83e8673"
                          style={{ borderColor: C.line, ...F_BODY }}
                        />
                      </div>
                    </div>
                    <div className="gsm-native-homemainscreen-82fcc3134">
                      {selection.dimension === 'Profil de risque' ? (
                        <table className="gsm-native-homemainscreen-9df05a92e">
                          <thead style={{ background: C.navySoft }}>
                            <tr>
                              <Th>Client</Th>
                              <Th>Exposition Actions</Th>
                              <Th>Exposition Obligation</Th>
                              <Th>Allocation</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="gsm-native-homemainscreen-022e40e11"
                                  style={{ color: C.sub }}
                                >
                                  Aucun portefeuille ne correspond à ce profil.
                                </td>
                              </tr>
                            )}
                            {rows.map(({ client, expo }) => {
                              const expositionActions = Number(
                                client.alloc.Actions || 0
                              );
                              const expositionObligations =
                                Number(client.alloc['Obl. souveraines'] || 0) +
                                Number(client.alloc['Obl. privées'] || 0);
                              const allocationProfil =
                                totalValeurRef > 0
                                  ? (toRef(expo.valeur, client.devise) /
                                      totalValeurRef) *
                                    100
                                  : 0;

                              return (
                                <tr
                                  key={client.id}
                                  style={{ borderTop: `1px solid ${C.line}` }}
                                >
                                  <Td className="gsm-native-homemainscreen-80b121830">
                                    {client.nom}
                                  </Td>
                                  <Td mono>{expositionActions.toFixed(1)}%</Td>
                                  <Td mono>
                                    {expositionObligations.toFixed(1)}%
                                  </Td>
                                  <Td mono>{allocationProfil.toFixed(1)}%</Td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <table className="gsm-native-homemainscreen-9df05a92e">
                          <thead style={{ background: C.navySoft }}>
                            <tr>
                              <Th>Client</Th>
                              <Th>Exposition</Th>
                              <Th>Valeur</Th>
                              <Th>Allocation</Th>
                              <Th>Profil risque</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="gsm-native-homemainscreen-022e40e11"
                                  style={{ color: C.sub }}
                                >
                                  Aucun portefeuille ne correspond à ces
                                  critères.
                                </td>
                              </tr>
                            )}
                            {rows.map(({ client, expo }) => (
                              <tr
                                key={client.id}
                                style={{ borderTop: `1px solid ${C.line}` }}
                              >
                                <Td className="gsm-native-homemainscreen-80b121830">{client.nom}</Td>
                                <Td mono>{expo.pct.toFixed(1)}%</Td>
                                <Td mono>
                                  {fmt(expo.valeur)} {client.devise}
                                </Td>
                                <Td mono>
                                  {totalValeurRef > 0
                                    ? (
                                        (toRef(expo.valeur, client.devise) /
                                          totalValeurRef) *
                                        100
                                      ).toFixed(1)
                                    : '0.0'}
                                  %
                                </Td>
                                <Td>
                                  <Badge tone="slate">
                                    {client.profilRisque}
                                  </Badge>
                                </Td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </Card>

      <div className="gsm-native-homemainscreen-42f6e72ab">
        <Card className="gsm-native-homemainscreen-ead172828">
          <div className="gsm-native-homemainscreen-b6be11e11">
            <div>
              <Eyebrow>Historique de l'encours</Eyebrow>
              <div className="gsm-native-homemainscreen-8a6172283" style={{ color: C.sub }}>
                Performance de la gestion neutralisée des dépôts et retraits
              </div>
            </div>
            <div className="gsm-native-homemainscreen-de6be5bd2">
              <Badge tone="navy">Base 100 · méthode TWR</Badge>
            </div>
          </div>

          <div className="gsm-native-homemainscreen-706e33429">
            {[
              {
                label: 'Gestion TWR',
                value: `${
                  performanceGestionTwr >= 0 ? '+' : ''
                }${performanceGestionTwr.toFixed(1)}%`,
                color: performanceGestionTwr >= 0 ? C.teal : C.coral,
              },
              {
                label: 'BRVM Composite',
                value: `${
                  performanceBrvm >= 0 ? '+' : ''
                }${performanceBrvm.toFixed(1)}%`,
                color: C.gold,
              },
              {
                label: 'NGX ASI',
                value: `${
                  performanceNgx >= 0 ? '+' : ''
                }${performanceNgx.toFixed(1)}%`,
                color: C.teal,
              },
              {
                label: 'Flux clients nets',
                value: `${fluxNetHistorique >= 0 ? '+' : '-'}${fmt(
                  Math.abs(fluxNetHistorique)
                )} ${devise}`,
                color: C.sub,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="gsm-native-homemainscreen-bf63a9847"
                style={{ borderColor: C.line, background: C.navySoft }}
              >
                <div
                  className="gsm-native-homemainscreen-dbaa570a1"
                  style={{ color: C.sub }}
                >
                  {stat.label}
                </div>
                <div
                  className="gsm-native-homemainscreen-ee26b5d5a"
                  style={{ color: stat.color, ...F_MONO }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div
            className="gsm-native-homemainscreen-f9adeadb9"
            style={{ color: C.sub }}
          >
            <span>
              Écart vs BRVM :{' '}
              <b
                style={{
                  color:
                    performanceGestionTwr - performanceBrvm >= 0
                      ? C.teal
                      : C.coral,
                  ...F_MONO,
                }}
              >
                {performanceGestionTwr - performanceBrvm >= 0 ? '+' : ''}
                {(performanceGestionTwr - performanceBrvm).toFixed(1)} pt
              </b>
            </span>
            <span>·</span>
            <span>
              Écart vs NGX :{' '}
              <b
                style={{
                  color:
                    performanceGestionTwr - performanceNgx >= 0
                      ? C.teal
                      : C.coral,
                  ...F_MONO,
                }}
              >
                {performanceGestionTwr - performanceNgx >= 0 ? '+' : ''}
                {(performanceGestionTwr - performanceNgx).toFixed(1)} pt
              </b>
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={historiquePerformance}>
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
                  const point = payload[0]?.payload;
                  if (!point) return null;
                  const fluxLabel =
                    point.fluxNet > 0
                      ? 'Dépôt net'
                      : point.fluxNet < 0
                      ? 'Retrait net'
                      : 'Flux client';
                  return (
                    <div
                      className="gsm-native-homemainscreen-c3edc258f"
                      style={{
                        background: C.card,
                        borderColor: C.line,
                        ...F_BODY,
                      }}
                    >
                      <div className="gsm-native-homemainscreen-7c5aaad5d" style={{ color: C.ink }}>
                        {label}
                      </div>
                      <div className="gsm-native-homemainscreen-b8336a182" style={{ color: C.sub }}>
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
                          className="gsm-native-homemainscreen-fdee1624f"
                          style={{ borderTop: `1px solid ${C.line}` }}
                        >
                          Encours brut :{' '}
                          <b style={{ color: C.ink, ...F_MONO }}>
                            {fmt(point.encoursBrut)} {devise}
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
                            {fmt(Math.abs(point.fluxNet))} {devise}
                          </b>
                        </div>

                        <HistoricalEventsTooltipBlock
                          evenements={point.evenements}
                          devise={devise}
                        />
                      </div>
                    </div>
                  );
                }}
              />
              {historyVisibility.gestionTwr && (
                <Line
                  type="monotone"
                  dataKey="gestionTwr"
                  name="Gestion globale (TWR)"
                  stroke={C.navy}
                  strokeWidth={2.8}
                  dot={renderHistoricalEventDot}
                  activeDot={{ r: 7 }}
                />
              )}
              {historyVisibility.brvm && (
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
              {historyVisibility.ngxAsi && (
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
            visibility={historyVisibility}
            onToggle={toggleHistorySeries}
          />
          <div
            className="gsm-native-homemainscreen-1f759d362"
            style={{ color: C.sub }}
          >
            {HISTORICAL_EVENT_TYPES.map((type) => (
              <span key={type} className="gsm-native-homemainscreen-0bcc30433">
                <span
                  className="gsm-native-homemainscreen-0ca33ee8c"
                  style={{
                    borderColor: historicalEventColor(type),
                    background: C.card,
                  }}
                />
                {type}
              </span>
            ))}
            <span>Survolez un point pour voir le résumé des mouvements.</span>
          </div>
          <div
            className="gsm-native-homemainscreen-9de307f57"
            style={{ background: C.navySoft, color: C.sub, ...F_BODY }}
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

        <Card className="gsm-native-homemainscreen-281bba47f">
          <Eyebrow>Rapport d'analyse client</Eyebrow>
          <div className="gsm-native-homemainscreen-c8ca7ff45" style={{ color: C.sub, ...F_BODY }}>
            Situation globale, mouvements et commentaire de rendement sur
            période.
          </div>
          <label
            className="gsm-native-homemainscreen-ec562243c"
            style={{ color: C.sub }}
          >
            Client
          </label>
          <select name="gsm-homemainscreen-1329" aria-label="Sélection homemainscreen"
            value={genClient}
            onChange={(e) => setGenClient(e.target.value)}
            className="gsm-native-homemainscreen-fd16fb95c"
            style={{ borderColor: C.line, ...F_BODY }}
          >
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <label
            className="gsm-native-homemainscreen-ec562243c"
            style={{ color: C.sub }}
          >
            Période
          </label>
          <select name="gsm-homemainscreen-1347" aria-label="Sélection homemainscreen"
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="gsm-native-homemainscreen-83b084634"
            style={{ borderColor: C.line, ...F_BODY }}
          >
            <option>Trimestre en cours</option>
            <option>Année en cours</option>
            <option>Personnalisée</option>
          </select>
          <div className="gsm-native-homemainscreen-b4dcb5eda">
            <Btn onClick={() => openClient(genClient, true, reportPeriod)}>
              Générer le rapport
            </Btn>
          </div>
        </Card>
      </div>

      <Card className="gsm-native-homemainscreen-281bba47f">
        <div className="gsm-native-homemainscreen-720dd569e">
          <Eyebrow>Volume d'échange du jour — marchés</Eyebrow>
          <span className="gsm-native-homemainscreen-8a6172283" style={{ color: C.sub }}>
            Devise d'affichage réglable par bourse
          </span>
        </div>
        <div className="gsm-native-homemainscreen-42f6e72ab">
          {['BRVM', 'NGX', 'GSE'].map((bourse) => {
            const action = VOLUME_JOUR.find(
              (v) => v.marche === bourse && v.type === 'Action'
            );
            const oblig = VOLUME_JOUR.find(
              (v) => v.marche === bourse && v.type === 'Obligation'
            );
            const dev = devBourse[bourse];
            return (
              <div
                key={bourse}
                className="gsm-native-homemainscreen-ae9609d7d"
                style={{ borderColor: C.line }}
              >
                <div className="gsm-native-homemainscreen-ba64ef6c6">
                  <Badge tone="navy">{bourse}</Badge>
                  <select name="gsm-homemainscreen-1389" aria-label="Sélection homemainscreen"
                    value={dev}
                    onChange={(e) =>
                      setDevBourse({ ...devBourse, [bourse]: e.target.value })
                    }
                    className="gsm-native-homemainscreen-3a0615c64"
                    style={{ borderColor: C.line }}
                  >
                    {Object.keys(FX).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="gsm-native-homemainscreen-8a6172283" style={{ color: C.sub }}>
                  Actions
                </div>
                <div className="gsm-native-homemainscreen-7487a5a96" style={F_MONO}>
                  {fmt(
                    Math.round(
                      convertCurrency(action.volume, action.devise, dev)
                    )
                  )}{' '}
                  {dev}
                </div>
                <div className="gsm-native-homemainscreen-8a6172283" style={{ color: C.sub }}>
                  Obligations
                </div>
                <div className="gsm-native-homemainscreen-f4fb55334" style={F_MONO}>
                  {fmt(
                    Math.round(convertCurrency(oblig.volume, oblig.devise, dev))
                  )}{' '}
                  {dev}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export { Accueil };
