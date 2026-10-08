import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { convertCurrency, fmt, fmtPrice, FX } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Donut, Legende, MarketTicker } from '../home/HomeWidgets';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { ClientBreadcrumb } from './ClientCommon';

export function createClientOverviewScreens(dependencies) {
  const {
    CLIENT_CASHFLOWS,
    CLIENT_GESTION_LIBRE,
    CLIENT_OPEN_ORDER_STATUSES,
    MARKETS_DATA,
    clientAssetClass,
    clientAvailableCash,
    clientAvailableCashIn,
    clientCashIn,
    clientLineCmp,
    clientLinePlusMoinsValue,
    clientLineValue,
    clientMarket,
    clientPortfolioValue,
    clientPortfolioValueIn,
    clientReservedCash,
    clientReservedCashIn,
  } = dependencies;

  function ClientDashboard({ goClient, devise, onDeviseChange, orders }) {
  const portefeuilles = CLIENT_GESTION_LIBRE.portefeuilles;
  const nombreSgi = new Set(
    portefeuilles.map((portefeuille) => portefeuille.sgi)
  ).size;
  const nombrePays = new Set(
    portefeuilles.map((portefeuille) => portefeuille.pays)
  ).size;
  const [allocationActifSelectionne, setAllocationActifSelectionne] =
    useState(null);
  const [allocationPaysSelectionne, setAllocationPaysSelectionne] =
    useState(null);
  const patrimoine = portefeuilles.reduce(
    (somme, portefeuille) =>
      somme + clientPortfolioValueIn(portefeuille, devise),
    0
  );
  const liquiditeTotale = portefeuilles.reduce(
    (somme, portefeuille) => somme + clientCashIn(portefeuille, devise),
    0
  );
  const liquiditeReservee = portefeuilles.reduce(
    (somme, portefeuille) =>
      somme + clientReservedCashIn(portefeuille, orders, devise),
    0
  );
  const liquiditeDisponible = portefeuilles.reduce(
    (somme, portefeuille) =>
      somme + clientAvailableCashIn(portefeuille, orders, devise),
    0
  );
  const perfPonderee =
    patrimoine > 0
      ? portefeuilles.reduce(
          (somme, portefeuille) =>
            somme +
            clientPortfolioValueIn(portefeuille, devise) *
              Number(portefeuille.perfYtd || 0),
          0
        ) / patrimoine
      : 0;

  const allocationMap = {
    Actions: 0,
    Obligations: 0,
    Liquidité: liquiditeTotale,
  };
  portefeuilles.forEach((portefeuille) => {
    portefeuille.lignes.forEach((ligne) => {
      const classe = clientAssetClass(ligne.instrument);
      allocationMap[classe] += convertCurrency(
        clientLineValue(ligne),
        portefeuille.devise,
        devise
      );
    });
  });
  const allocation = Object.entries(allocationMap).map(([name, montant]) => ({
    name,
    montant,
    value:
      patrimoine > 0 ? Number(((montant / patrimoine) * 100).toFixed(1)) : 0,
    devise,
  }));

  const montantActifDansPortefeuille = (portefeuille, classeActif) => {
    if (classeActif === 'Liquidité') {
      return convertCurrency(
        portefeuille.compteEspeces,
        portefeuille.devise,
        devise
      );
    }

    return portefeuille.lignes
      .filter((ligne) => clientAssetClass(ligne.instrument) === classeActif)
      .reduce(
        (somme, ligne) =>
          somme +
          convertCurrency(clientLineValue(ligne), portefeuille.devise, devise),
        0
      );
  };

  const construireRepartitionAllocation = (
    keyFn,
    classeActif,
    filtre = () => true
  ) => {
    const map = {};
    portefeuilles.filter(filtre).forEach((portefeuille) => {
      const montant = montantActifDansPortefeuille(portefeuille, classeActif);
      if (montant <= 0) return;
      const key = keyFn(portefeuille);
      map[key] = (map[key] || 0) + montant;
    });
    const total = Object.values(map).reduce(
      (somme, montant) => somme + montant,
      0
    );    return Object.entries(map)
      .map(([name, montant]) => ({
        name,
        montant,
        value: total > 0 ? Number(((montant / total) * 100).toFixed(1)) : 0,
        devise,
      }))
      .sort((a, b) => b.montant - a.montant);
  };

  const allocationParPays = allocationActifSelectionne
    ? construireRepartitionAllocation(
        (portefeuille) => portefeuille.pays,
        allocationActifSelectionne
      )
    : [];

  const allocationParSgi =
    allocationActifSelectionne && allocationPaysSelectionne
      ? construireRepartitionAllocation(
          (portefeuille) => portefeuille.sgi,
          allocationActifSelectionne,
          (portefeuille) => portefeuille.pays === allocationPaysSelectionne
        )
      : [];

  const choisirActifAllocation = (part) => {
    setAllocationActifSelectionne(part.name);
    setAllocationPaysSelectionne(null);
  };

  const niveauAllocation = allocationPaysSelectionne
    ? 'sgi'
    : allocationActifSelectionne
    ? 'pays'
    : 'actif';

  const allocationAffichee =
    niveauAllocation === 'sgi'
      ? allocationParSgi
      : niveauAllocation === 'pays'
      ? allocationParPays
      : allocation;

  const titreAllocation =
    niveauAllocation === 'sgi'
      ? `Allocation par SGI — ${allocationPaysSelectionne}`
      : niveauAllocation === 'pays'
      ? `Allocation par pays — ${allocationActifSelectionne}`
      : "Allocation par type d'actif";

  const montantTotalAllocation = allocationAffichee.reduce(
    (somme, part) => somme + Number(part.montant || 0),
    0
  );

  const libelleMontantTotalAllocation =
    niveauAllocation === 'sgi'
      ? `Total ${allocationActifSelectionne} · ${allocationPaysSelectionne}`
      : niveauAllocation === 'pays'
      ? `Total ${allocationActifSelectionne}`
      : 'Patrimoine consolidé';

  const sousTitreAllocation =
    niveauAllocation === 'sgi'
      ? `${allocationActifSelectionne} · ${allocationPaysSelectionne}`
      : niveauAllocation === 'pays'
      ? `Répartition de ${allocationActifSelectionne} par pays`
      : "Cliquez sur un type d'actif pour afficher sa répartition par pays.";

  const gererClicAllocation =
    niveauAllocation === 'actif'
      ? choisirActifAllocation
      : niveauAllocation === 'pays'
      ? (part) => setAllocationPaysSelectionne(part.name)
      : undefined;

  const revenirAllocation = () => {
    if (allocationPaysSelectionne) {
      setAllocationPaysSelectionne(null);
      return;
    }
    if (allocationActifSelectionne) {
      setAllocationActifSelectionne(null);
    }
  };

  const ordresOuverts = orders.filter((ordre) =>
    ['En attente', 'En cours'].includes(ordre.statut)
  ).length;
  const revenus30j = CLIENT_CASHFLOWS.reduce(
    (somme, flux) => somme + convertCurrency(flux.montant, flux.devise, devise),
    0
  );

  return (
    <div className="gsm-native-clientoverviewscreens-090215097">
      <ClientBreadcrumb items={['Espace Client', 'Vue consolidée']} />

      <MarketTicker
        markets={MARKETS_DATA}
        onViewAll={() => goClient('client-exchanges')}
        onInstrumentClick={(m) =>
          goClient('client-instrument-analysis', {
            instrument: m.nom,
            marche: m.marche,
            source: 'client-dashboard-ticker',
          })
        }
      />

      <div className="gsm-native-clientoverviewscreens-ec42dad6f">
        <div>
          <Eyebrow>Gestion libre multi-SGI</Eyebrow>
          <h2
            className="gsm-native-clientoverviewscreens-3700f350f"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Bonjour {CLIENT_GESTION_LIBRE.nom}
          </h2>
          <div className="gsm-native-clientoverviewscreens-91d9d0954" style={{ color: C.sub }}>
            Une vue unique de vos portefeuilles détenus auprès de plusieurs SGI
            sur les marchés financier africains.
          </div>
        </div>
        <div className="gsm-native-clientoverviewscreens-4977c3b9a">
          <span className="gsm-native-clientoverviewscreens-9832d573f" style={{ color: C.sub }}>
            Devise consolidée
          </span>
          <select name="gsm-clientoverviewscreens-257" aria-label="Sélection clientoverviewscreens"
            value={devise}
            onChange={(e) => onDeviseChange(e.target.value)}
            className="gsm-native-clientoverviewscreens-d1ca345e8"
            style={{ borderColor: C.line, background: C.surfaceCard }}
          >
            {Object.keys(FX).map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="gsm-native-clientoverviewscreens-da14484d2">
        <Card className="gsm-native-clientoverviewscreens-143266c1c">
          <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
            Patrimoine consolidé
          </div>
          <div className="gsm-native-clientoverviewscreens-e83acf12f" style={F_DISPLAY}>
            {fmt(Math.round(patrimoine))} {devise}
          </div>
          <div className="gsm-native-clientoverviewscreens-5fa9a4f76" style={{ color: C.sub }}>
            {portefeuilles.length} portefeuilles · {nombreSgi} SGI ·{' '}
            {nombrePays} pays
          </div>
        </Card>
        <Card className="gsm-native-clientoverviewscreens-143266c1c">
          <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
            Performance YTD pondérée
          </div>
          <div className="gsm-native-clientoverviewscreens-f84a1a731">
            <Pct v={perfPonderee} />
          </div>
          <div className="gsm-native-clientoverviewscreens-089965f35" style={{ color: C.sub }}>
            Pondération par la valeur de chaque portefeuille
          </div>
        </Card>
        <Card className="gsm-native-clientoverviewscreens-143266c1c">
          <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
            Liquidité disponible
          </div>
          <div className="gsm-native-clientoverviewscreens-e83acf12f" style={F_DISPLAY}>
            {fmt(Math.round(liquiditeDisponible))} {devise}
          </div>
          <div className="gsm-native-clientoverviewscreens-5fa9a4f76" style={{ color: C.sub }}>
            {patrimoine > 0
              ? ((liquiditeDisponible / patrimoine) * 100).toFixed(1)
              : '0.0'}
            % du patrimoine · {fmt(Math.round(liquiditeReservee))} {devise}{' '}
            réservé(s)
          </div>
        </Card>
        <Card className="gsm-native-clientoverviewscreens-143266c1c">
          <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
            Revenus & ordres à suivre
          </div>
          <div className="gsm-responsive-inline-row gsm-native-clientoverviewscreens-6a26f9aab">
            <div className="gsm-native-clientoverviewscreens-b1cb971c2" style={F_DISPLAY}>
              {fmt(Math.round(revenus30j))} {devise}
            </div>
            <Badge tone={ordresOuverts > 0 ? 'gold' : 'teal'}>
              {ordresOuverts} ordre(s)
            </Badge>
          </div>
          <div className="gsm-native-clientoverviewscreens-5fa9a4f76" style={{ color: C.sub }}>
            Revenus financiers attendus dans les prochaines échéances
          </div>
        </Card>
      </div>

      <div className="gsm-native-clientoverviewscreens-e61e01ddf">
        <Card className="gsm-native-clientoverviewscreens-512c646ff">          <div className="gsm-responsive-header gsm-native-clientoverviewscreens-69c6d5110">
            <div>
              <Eyebrow>Mes portefeuilles par SGI</Eyebrow>
              <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
                Valeur, performance et liquidité consolidées par intermédiaire.
              </div>
            </div>
            <button
              onClick={() => goClient('client-portfolios')}
              className="gsm-native-clientoverviewscreens-9832d573f"
              style={{ color: C.navy }}
            >
              Voir le détail →
            </button>
          </div>
          <table className="gsm-native-clientoverviewscreens-3f444c1c5">
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>SGI / pays</Th>
                <Th>Marché</Th>
                <Th>Valeur</Th>
                <Th>Perf. YTD</Th>
                <Th>Liquidité</Th>
              </tr>
            </thead>
            <tbody>
              {portefeuilles.map((portefeuille) => (
                <tr
                  key={portefeuille.id}
                  style={{ borderTop: `1px solid ${C.line}` }}
                >
                  <Td>
                    <div className="gsm-native-clientoverviewscreens-d8c24be4d">{portefeuille.sgi}</div>
                    <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
                      {portefeuille.pays}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="navy">
                      {portefeuille.marche} · {portefeuille.devise}
                    </Badge>
                  </Td>
                  <Td mono>
                    {fmt(
                      Math.round(clientPortfolioValueIn(portefeuille, devise))
                    )}{' '}
                    {devise}
                  </Td>
                  <Td>
                    <Pct v={portefeuille.perfYtd} />
                  </Td>
                  <Td mono>
                    {fmt(Math.round(clientCashIn(portefeuille, devise)))}{' '}
                    {devise}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="gsm-native-clientoverviewscreens-ef175b084">
          <div className="gsm-responsive-header gsm-native-clientoverviewscreens-5e3b37899">
            <div>
              <Eyebrow>Allocation consolidée</Eyebrow>
              <div className="gsm-native-clientoverviewscreens-9832d573f" style={{ color: C.ink }}>
                {titreAllocation}
              </div>
              <div
                className="gsm-native-clientoverviewscreens-9a4800655"
                style={{ color: C.sub, ...F_BODY }}
              >
                {sousTitreAllocation}
              </div>
            </div>
            {niveauAllocation !== 'actif' && (
              <button
                type="button"
                onClick={revenirAllocation}
                className="gsm-native-clientoverviewscreens-7fbb0ee6a"
                style={{
                  color: C.navy,
                  borderColor: C.line,
                  background: C.surfaceCard,
                }}
              >
                ← Retour
              </button>
            )}
          </div>

          <div
            className="gsm-responsive-kpi-row gsm-native-clientoverviewscreens-171fb517e"
            style={{ borderColor: C.line, background: C.surfaceElevated }}
          >
            <div>
              <div
                className="gsm-native-clientoverviewscreens-4f0d08b4e"
                style={{ color: C.sub, ...F_BODY }}
              >                {libelleMontantTotalAllocation}
              </div>
              <div
                className="gsm-native-clientoverviewscreens-dac8ee203"
                style={{ color: C.ink, ...F_DISPLAY }}
              >
                {fmt(Math.round(montantTotalAllocation))} {devise}
              </div>
            </div>
            <Badge tone="navy">100% du niveau</Badge>
          </div>

          <div className="gsm-native-clientoverviewscreens-615ff5872">
            {allocationAffichee.length > 0 ? (
              <>
                <Donut
                  data={allocationAffichee}
                  size={150}
                  onSliceClick={gererClicAllocation}
                />
                <Legende data={allocationAffichee} />
              </>
            ) : (
              <div
                className="gsm-native-clientoverviewscreens-0994c1e86"
                style={{ color: C.sub }}
              >
                Aucune exposition disponible pour cette sélection.
              </div>
            )}
          </div>

          <div
            className="gsm-native-clientoverviewscreens-8905ade8b"
            style={{
              borderTop: `1px solid ${C.line}`,
              color: C.sub,
              ...F_BODY,
            }}
          >
            <span>
              {niveauAllocation === 'actif'
                ? "Niveau 1/3 · Type d'actif"
                : niveauAllocation === 'pays'
                ? 'Niveau 2/3 · Pays'
                : 'Niveau 3/3 · SGI'}
            </span>
            {niveauAllocation !== 'sgi' && (
              <span>Cliquez sur une part pour approfondir</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}


  function ClientPortfolios({ devise, orders }) {
  const portefeuilles = CLIENT_GESTION_LIBRE.portefeuilles;
  const [paysFiltre, setPaysFiltre] = useState('Tous');

  const paysDisponibles = [
    'Tous',
    ...new Set(
      portefeuilles
        .map((portefeuille) => portefeuille.pays)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'fr'))
    ),
  ];

  const portefeuillesFiltres = portefeuilles.filter(
    (portefeuille) => paysFiltre === 'Tous' || portefeuille.pays === paysFiltre
  );

  return (
    <div className="gsm-native-clientoverviewscreens-090215097">
      <ClientBreadcrumb items={['Espace Client', 'Mes portefeuilles & SGI']} />
      <div>
        <h2
          className="gsm-native-clientoverviewscreens-b75a6987e"
          style={{ ...F_DISPLAY, color: C.ink }}
        >
          Mes portefeuilles & SGI
        </h2>
        <div className="gsm-native-clientoverviewscreens-f075de69d" style={{ color: C.sub }}>
          Une fiche par compte-titres afin de conserver la vision de
          l'intermédiaire, de la devise et du marché d'origine, avec distinction
          entre espèces disponibles et espèces déjà mobilisées par des achats
          non exécutés. Le CMP correspond au coût moyen pondéré de la ligne et
          la Plus/Moins-value est affichée en montant dans la devise native du
          portefeuille.
        </div>
      </div>

      <Card className="gsm-native-clientoverviewscreens-143266c1c" style={{ borderColor: C.borderSubtle }}>
        <div className="gsm-native-clientoverviewscreens-7371e8a4c">
          <div className="gsm-native-clientoverviewscreens-cfde5c5c1">
            <label
              className="gsm-native-clientoverviewscreens-a8ffcc822"
              style={{ color: C.sub }}
            >
              Filtrer les portefeuilles par pays
            </label>
            <select name="gsm-clientoverviewscreens-532" aria-label="Sélection clientoverviewscreens"
              value={paysFiltre}
              onChange={(e) => setPaysFiltre(e.target.value)}
              className="gsm-native-clientoverviewscreens-31f238e0b"
              style={{ borderColor: C.line, background: C.surfaceCard, ...F_BODY }}
            >
              {paysDisponibles.map((pays) => (
                <option key={pays} value={pays}>
                  {pays === 'Tous' ? 'Tous les pays' : pays}
                </option>
              ))}
            </select>
          </div>

          <div className="gsm-native-clientoverviewscreens-a242d9724">
            <Badge tone={paysFiltre === 'Tous' ? 'slate' : 'gold'}>
              {paysFiltre === 'Tous' ? 'Tous les pays' : paysFiltre}
            </Badge>
            <Badge tone="navy">
              {portefeuillesFiltres.length} portefeuille(s)
            </Badge>
            <Badge tone="teal">
              {new Set(portefeuillesFiltres.map((p) => p.sgi)).size} SGI
            </Badge>
            {paysFiltre !== 'Tous' && (
              <button
                type="button"
                onClick={() => setPaysFiltre('Tous')}
                className="gsm-native-clientoverviewscreens-44fca82d3"
                style={{
                  borderColor: C.line,
                  color: C.navy,
                  background: C.surfaceCard,
                  ...F_BODY,
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        <div className="gsm-native-clientoverviewscreens-58d600a7d" style={{ color: C.sub, ...F_BODY }}>
          Le filtre agit uniquement sur vos propres comptes de Gestion libre et
          conserve les montants dans la devise native de chaque portefeuille,
          avec l'équivalent dans la devise de vue lorsque nécessaire.
        </div>
      </Card>

      {portefeuillesFiltres.length === 0 && (
        <Card className="gsm-native-clientoverviewscreens-486fee084">
          <div className="gsm-native-clientoverviewscreens-2fd9b071f" style={{ color: C.ink }}>
            Aucun portefeuille pour ce pays          </div>
          <div className="gsm-native-clientoverviewscreens-f075de69d" style={{ color: C.sub }}>
            Sélectionnez un autre pays ou réinitialisez le filtre.
          </div>
        </Card>
      )}

      {portefeuillesFiltres.map((portefeuille) => {
        const total = clientPortfolioValue(portefeuille);
        const liquiditeTotale = Number(portefeuille.compteEspeces || 0);
        const liquiditeReservee = clientReservedCash(portefeuille, orders);
        const liquiditeDisponible = clientAvailableCash(portefeuille, orders);
        const ordresAchatOuverts = orders.filter(
          (ordre) =>
            ordre.portefeuilleId === portefeuille.id &&
            ordre.sens === 'Achat' &&
            CLIENT_OPEN_ORDER_STATUSES.includes(ordre.statut)
        ).length;
        const ordresVenteOuverts = orders.filter(
          (ordre) =>
            ordre.portefeuilleId === portefeuille.id &&
            ordre.sens === 'Vente' &&
            CLIENT_OPEN_ORDER_STATUSES.includes(ordre.statut)
        ).length;

        return (
          <Card
            key={portefeuille.id}
            className="gsm-native-clientoverviewscreens-0e2f02b8a"
            style={{ borderColor: C.gold }}
          >
            <div
              className="gsm-native-clientoverviewscreens-5b6be2b38"
              style={{ background: C.warningBackground }}
            >
              <div>
                <div className="gsm-native-clientoverviewscreens-49b164593" style={F_DISPLAY}>
                  {portefeuille.nom}
                </div>
                <div className="gsm-native-clientoverviewscreens-ca3371284">
                  <Badge tone="navy">{portefeuille.sgi}</Badge>
                  <Badge tone="slate">{portefeuille.pays}</Badge>
                  <Badge tone="slate">
                    {portefeuille.marche} · {portefeuille.devise}
                  </Badge>
                </div>
              </div>
              <div className="gsm-native-clientoverviewscreens-10eb09e7d">
                <div className="gsm-native-clientoverviewscreens-ce4ea07f1" style={{ color: C.sub }}>
                  Valeur du portefeuille
                </div>
                <div className="gsm-native-clientoverviewscreens-b1cb971c2" style={F_DISPLAY}>
                  {fmt(Math.round(total))} {portefeuille.devise}
                </div>
                {portefeuille.devise !== devise && (
                  <div className="gsm-native-clientoverviewscreens-79b11620d" style={{ color: C.sub }}>
                    ≈{' '}
                    {fmt(
                      Math.round(clientPortfolioValueIn(portefeuille, devise))
                    )}{' '}
                    {devise}
                  </div>
                )}
              </div>
            </div>

            <div className="gsm-table-scroll">
              <table className="gsm-table--banking gsm-native-clientoverviewscreens-d84fa8f88" style={{ minWidth: 1060 }}>
                <thead style={{ background: C.surfaceElevated }}>
                  <tr>
                    <Th>Instrument</Th>
                    <Th>Classe</Th>
                    <Th>Quantité</Th>
                    <Th title="Coût Moyen Pondéré">CMP</Th>
                    <Th>Cours</Th>
                    <Th>Valeur</Th>
                    <Th>Plus/Moins-value</Th>
                    <Th>Poids</Th>
                  </tr>
                </thead>
                <tbody>
                  {portefeuille.lignes.map((ligne) => {
                    const marche = clientMarket(ligne.instrument);
                    const cours = Number(marche?.cours || ligne.pru);
                    const valeur = clientLineValue(ligne);
                    const cmp = clientLineCmp(ligne);
                    const plusMoinsValue = clientLinePlusMoinsValue(ligne);
                    const plusMoinsPositive = plusMoinsValue >= 0;

                    return (
                      <tr
                        key={ligne.instrument}
                        style={{ borderTop: `1px solid ${C.line}` }}
                      >
                        <Td className="gsm-native-clientoverviewscreens-d8c24be4d">{ligne.instrument}</Td>
                        <Td>
                          <Badge tone="slate">
                            {clientAssetClass(ligne.instrument)}
                          </Badge>
                        </Td>
                        <Td mono>{fmt(ligne.qte)}</Td>
                        <Td mono className="gsm-native-clientoverviewscreens-48951ee80">
                          {fmtPrice(cmp)} {portefeuille.devise}
                        </Td>
                        <Td mono>
                          {fmtPrice(cours)} {portefeuille.devise}
                        </Td>
                        <Td mono>
                          {fmt(Math.round(valeur))} {portefeuille.devise}
                        </Td>
                        <Td>
                          <div
                            className="gsm-native-clientoverviewscreens-13836efcd"
                            style={{
                              color: plusMoinsPositive ? C.teal : C.coral,
                              ...F_MONO,
                            }}
                            title="Plus/Moins-value latente = Quantité × (Cours actuel − CMP)"
                          >
                            {plusMoinsPositive ? (
                              <ArrowUpRight size={13} />
                            ) : (
                              <ArrowDownRight size={13} />
                            )}
                            {plusMoinsPositive ? '+' : '-'}
                            {fmt(Math.round(Math.abs(plusMoinsValue)))}{' '}
                            {portefeuille.devise}
                          </div>
                        </Td>
                        <Td mono>
                          {total > 0
                            ? ((valeur / total) * 100).toFixed(1)
                            : '0.0'}
                          %
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              className="gsm-native-clientoverviewscreens-143266c1c"
              style={{
                borderTop: `1px solid ${C.line}`,
                background: C.rowAlternate,
              }}
            >
              <div className="gsm-native-clientoverviewscreens-8b907c21a">
                <div>
                  <Eyebrow>Compte espèces</Eyebrow>
                  <div className="gsm-native-clientoverviewscreens-72b631145" style={{ color: C.sub }}>
                    La liquidité disponible est immédiatement investissable. La
                    liquidité réservée correspond aux ordres d'achat ouverts
                    mais pas encore exécutés.
                  </div>
                </div>
                <Badge tone="navy">
                  {total > 0
                    ? ((liquiditeTotale / total) * 100).toFixed(1)
                    : '0.0'}
                  % du portefeuille
                </Badge>
              </div>

              <div className="gsm-native-clientoverviewscreens-f60114f9b">
                <div
                  className="gsm-native-clientoverviewscreens-a1b06b328"
                  style={{ borderColor: C.positiveBorder, background: C.positiveBackground }}
                >
                  <div
                    className="gsm-native-clientoverviewscreens-f3579515c"
                    style={{ color: C.teal }}
                  >
                    Liquidité disponible
                  </div>
                  <div
                    className="gsm-native-clientoverviewscreens-43d944f61"
                    style={{ ...F_DISPLAY, color: C.ink }}
                  >
                    {fmt(Math.round(liquiditeDisponible))} {portefeuille.devise}
                  </div>
                  <div className="gsm-native-clientoverviewscreens-5fa9a4f76" style={{ color: C.sub }}>
                    Montant utilisable pour de nouveaux investissements
                  </div>
                </div>

                <div
                  className="gsm-native-clientoverviewscreens-a1b06b328"
                  style={{ borderColor: C.warningBorder, background: C.warningBackground }}
                >
                  <div
                    className="gsm-native-clientoverviewscreens-f3579515c"
                    style={{ color: C.warningText }}
                  >
                    Liquidité réservée
                  </div>
                  <div
                    className="gsm-native-clientoverviewscreens-43d944f61"                    style={{ ...F_DISPLAY, color: C.ink }}
                  >
                    {fmt(Math.round(liquiditeReservee))} {portefeuille.devise}
                  </div>
                  <div className="gsm-native-clientoverviewscreens-5fa9a4f76" style={{ color: C.sub }}>
                    {ordresAchatOuverts} ordre(s) d'achat ouvert(s)
                  </div>
                </div>

                <div
                  className="gsm-native-clientoverviewscreens-a1b06b328"
                  style={{ borderColor: C.line, background: C.surfaceCard }}
                >
                  <div
                    className="gsm-native-clientoverviewscreens-f3579515c"
                    style={{ color: C.navy }}
                  >
                    Liquidité totale
                  </div>
                  <div
                    className="gsm-native-clientoverviewscreens-43d944f61"
                    style={{ ...F_DISPLAY, color: C.ink }}
                  >
                    {fmt(Math.round(liquiditeTotale))} {portefeuille.devise}
                  </div>
                  <div className="gsm-native-clientoverviewscreens-5fa9a4f76" style={{ color: C.sub }}>
                    Disponible + réservée
                  </div>
                </div>
              </div>

              {ordresVenteOuverts > 0 && (
                <div
                  className="gsm-native-clientoverviewscreens-363f1e34a"
                  style={{ background: C.infoBackground, color: C.sub }}
                >
                  {ordresVenteOuverts} ordre(s) de vente ouvert(s) : les titres
                  concernés sont réservés, mais ils ne diminuent pas le compte
                  espèces tant que la vente n'est pas exécutée.
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}


  return { ClientDashboard, ClientPortfolios };
}
