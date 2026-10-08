import { useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { convertCurrency, fmt, fmtPrice } from '../../shared/lib/finance';
import { parseIsoLocalDate } from '../../shared/lib/dateUtils';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { Donut, Legende } from '../home/HomeWidgets';
import { ASSET_KEYS } from '../portfolio/PortfolioAnalyticsData';
import { CLIENTS, PROFILE_TYPE_LABEL, UPCOMING_CASHFLOWS, parseFR } from '../portfolio/PortfolioUniverse';
import { BOND_MARKET_META, BOURSES_ACTIVE_CONFIG, CLIENT_TRADABLE_MARKETS, resolveMarketInstrument } from '../markets/MarketDomainData';
import { RECOS, exposureOf } from './TradingDomainData';
import { liquidityHistorySeed } from '../money-management/LiquidityInfrastructure';
import { orderBookDemo } from '../clients/ClientDomainData';

const CESSION_RETRAIT_REFERENCE_DATE = '2026-09-09';

const CESSION_RETRAIT_FEE_RATE = 0.0025;

const CESSION_RETRAIT_TOLERANCE = 3;

const CESSION_RETRAIT_DEFAULT_PARTICIPATION = 20;

const CESSION_RETRAIT_MAX_WITHDRAWAL_RATIO = 0.95;

const cessionRetraitMinimumAccountBalance = (client) => {
  const candidates = [
    client?.montantMinimumClotureCompte,
    client?.minimumClotureCompte,
    client?.seuilClotureCompte,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  return candidates.length > 0 ? candidates[0] : 0;
};

const CESSION_RETRAIT_SEED = {
  c1: {
    selected: true,
    montant: 35_000_000,
    date: '2026-09-11',
    urgence: 'Haute',
  },
  c3: {
    selected: true,
    montant: 140_000_000,
    date: '2026-09-12',
    urgence: 'Haute',
  },
  c4: {
    selected: true,
    montant: 100_000_000,
    date: '2026-09-15',
    urgence: 'Normale',
  },
  /*
   * Cas de démonstration dédié au marché non coté :
   * c7 détient des obligations privées non cotées et sa demande de retrait
   * provoque une ligne de cession interne visible immédiatement.
   */
  c7: {
    selected: true,
    montant: 65_000_000,
    date: '2026-09-16',
    urgence: 'Normale',
  },
};

const CESSION_RETRAIT_ETATS_DEMO = [
  {
    clientId: 'c1',
    client: 'Aïcha Koné',
    montant: 35_000_000,
    devise: 'XOF',
    statut: 'Demande reçue',
    dateDemande: '2026-09-09',
    dateSouhaitee: '2026-09-11',
    chargeeClientele: 'Mariam Diallo',
    observationChargeeClientele:
      'Demande de retrait reçue et transmise au gestionnaire pour traitement.',
    modePaiement: 'Chèque',
  },
  {
    clientId: 'c3',
    client: 'Emeka Okafor',
    montant: 140_000_000,
    devise: 'NGN',
    statut: 'Processus lancé',
    dateDemande: '2026-09-09',
    dateSouhaitee: '2026-09-12',
    chargeeClientele: 'Aïssatou Ndiaye',
    observationChargeeClientele:
      'Client informé du lancement du processus de mobilisation de la liquidité.',
    modePaiement: 'Virement bancaire',
  },
  {
    clientId: 'c4',
    client: 'Groupe Assurance Sahel',
    montant: 100_000_000,
    devise: 'XOF',
    statut: 'Cession en cours',
    dateDemande: '2026-09-08',
    dateSouhaitee: '2026-09-15',
    chargeeClientele: 'Nadia Kouamé',
    observationChargeeClientele:
      'Cession en cours. Le client sera contacté dès disponibilité complète des fonds.',
    modePaiement: 'Virement bancaire',
  },
  {
    clientId: 'c7',
    client: 'Mariam Traoré',
    montant: 65_000_000,
    devise: 'XOF',
    statut: 'Processus lancé',
    dateDemande: '2026-09-10',
    dateSouhaitee: '2026-09-16',
    chargeeClientele: 'Awa Diop',
    observationChargeeClientele:
      "Cas de démonstration : le portefeuille détient des obligations non cotées à rapprocher par cession interne.",
    modePaiement: 'Virement bancaire',
  },
  {
    clientId: 'c2',
    client: 'Fonds Prévoyance CI',
    montant: 25_000_000,
    devise: 'XOF',
    statut: 'Retrait disponible',
    dateDemande: '2026-09-05',
    dateSouhaitee: '2026-09-09',
    chargeeClientele: 'Fatou Diarra',
    observationChargeeClientele:
      'Liquidité constituée. Le retrait peut être remis au client selon le mode de paiement convenu.',
    modePaiement: 'Chèque',
  },
];

const CESSION_RETRAIT_STATUTS = [
  'Demande reçue',
  'Processus lancé',
  'Cession en cours',
  'Retrait disponible',
];

const cessionRetraitStatusTone = (statut) =>
  statut === 'Retrait disponible'
    ? 'teal'
    : statut === 'Cession en cours'
    ? 'gold'
    : statut === 'Processus lancé'
    ? 'navy'
    : 'coral';

const CESSION_NON_LISTED_BONDS = [
  {
    nom: 'Obligation non cotée CI 7.25% 2030',
    type: 'Obligation',
    assetClass: 'Obl. privées',
    marche: 'BRVM',
    devise: 'XOF',
    cours: 10000,
    variation: 0,
    volumeJour: 0,
    coursMin: 10000,
    coursMax: 10000,
    secteur: 'Corporate',
    emetteur: 'Émetteur privé CI · simulation',
    coupon: 7.25,
    rendement: 7.6,
    duration: 3.1,
    echeance: 2030,
    cotation: 'Non coté',
    listed: false,
  },
  {
    nom: 'Obligation non cotée Sénégal 7.10% 2031',
    type: 'Obligation',
    assetClass: 'Obl. privées',
    marche: 'BRVM',
    devise: 'XOF',
    cours: 10000,
    variation: 0,
    volumeJour: 0,
    coursMin: 10000,
    coursMax: 10000,
    secteur: 'Corporate',
    emetteur: 'Émetteur privé Sénégal · simulation',
    coupon: 7.1,
    rendement: 7.45,
    duration: 3.7,
    echeance: 2031,
    cotation: 'Non coté',
    listed: false,
  },
  {
    nom: 'Obligation non cotée Nigeria 16.25% 2031',
    type: 'Obligation',
    assetClass: 'Obl. privées',
    marche: 'NGX',
    devise: 'NGN',
    cours: 100,
    variation: 0,
    volumeJour: 0,
    coursMin: 100,
    coursMax: 100,
    secteur: 'Corporate',
    emetteur: 'Émetteur privé Nigeria · simulation',
    coupon: 16.25,
    rendement: 16.8,
    duration: 3.0,
    echeance: 2031,
    cotation: 'Non coté',
    listed: false,
  },
  {
    nom: 'Obligation non cotée Ghana 19.00% 2030',
    type: 'Obligation',
    assetClass: 'Obl. privées',
    marche: 'GSE',
    devise: 'GHS',
    cours: 100,
    variation: 0,
    volumeJour: 0,
    coursMin: 100,
    coursMax: 100,
    secteur: 'Corporate',
    emetteur: 'Émetteur privé Ghana · simulation',
    coupon: 19,
    rendement: 19.4,
    duration: 2.5,
    echeance: 2030,
    cotation: 'Non coté',
    listed: false,
  },
];

const CESSION_INSTRUMENT_UNIVERSE = [
  ...CLIENT_TRADABLE_MARKETS.map((instrument) => ({
    ...instrument,
    cotation: 'Coté',
    listed: true,
  })),
  ...CESSION_NON_LISTED_BONDS,
];

const cessionAssetClass = (instrument) => {
  if (!instrument) return 'Autres';
  if (instrument.assetClass) return instrument.assetClass;
  if (instrument.type === 'Action') return 'Actions';
  if (/corporate|priv|non cot/i.test(String(instrument.nom || ''))) {
    return 'Obl. privées';
  }
  return 'Obl. souveraines';
};

const cessionNormalizeNonListedPosition = (
  client,
  position,
  index = 0
) => {
  const instrument =
    CESSION_NON_LISTED_BONDS.find(
      (item) =>
        item.nom === (position?.titre || position?.nom) &&
        (!position?.marche || item.marche === position.marche)
    ) ||
    CESSION_NON_LISTED_BONDS.find(
      (item) =>
        item.marche === (position?.marche || client?.marche)
    );

  if (!instrument) return null;

  const prix = Math.max(
    0.000001,
    Number(
      position?.prixValorisation ??
        position?.prix ??
        position?.cours ??
        instrument.cours ??
        0
    )
  );

  const expositionPctDemandee = Math.max(
    0,
    Number(
      position?.expositionPct ??
        position?.exposition ??
        position?.poids ??
        0
    )
  );

  const valeurDepuisExposition =
    (Number(client?.encours || 0) * expositionPctDemandee) / 100;

  const quantiteExplicite = Number(position?.quantite);
  const quantite =
    Number.isFinite(quantiteExplicite) && quantiteExplicite > 0
      ? Math.floor(quantiteExplicite)
      : Math.max(
          0,
          Math.floor(
            Number(
              position?.valeur ||
                valeurDepuisExposition ||
                0
            ) / prix
          )
        );

  const valeur =
    quantite > 0
      ? quantite * prix
      : Math.max(
          0,
          Number(position?.valeur || valeurDepuisExposition || 0)
        );

  const expositionPct =
    Number(client?.encours || 0) > 0
      ? (valeur / Number(client.encours)) * 100
      : expositionPctDemandee;

  const seed = liquidityHistorySeed(
    `${client?.id || 'client'}-${instrument.nom}-${index}`
  );

  const cmp =
    Number(position?.cmp) > 0
      ? Number(position.cmp)
      : Number(
          (
            prix *
            (1 + (((seed % 9) - 4) / 100))
          ).toFixed(client?.marche === 'BRVM' ? 0 : 2)
        );

  return {
    titre: instrument.nom,
    nom: instrument.nom,
    type: 'Obligation',
    assetClass: 'Obl. privées',
    marche: instrument.marche,
    devise: instrument.devise,
    cotation: 'Non coté',
    listed: false,
    emetteur: instrument.emetteur,
    secteur: instrument.secteur,
    coupon: Number(instrument.coupon || 0),
    rendement: Number(instrument.rendement || 0),
    duration: Number(instrument.duration || 0),
    echeance: instrument.echeance,
    prixValorisation: prix,
    cmp,
    quantite,
    valeur,
    expositionPct: Number(expositionPct.toFixed(2)),
    source:
      position?.source || 'Simulation portefeuille GSM',
  };
};

const cessionGenerateNonListedPositions = (client, index = 0) => {
  const privatePct = Math.max(
    0,
    Number(client?.alloc?.['Obl. privées'] || 0)
  );

  if (privatePct <= 0) return [];

  const candidates = CESSION_NON_LISTED_BONDS.filter(
    (instrument) => instrument.marche === client?.marche
  );

  if (!candidates.length) return [];

  /*
   * On regarde si la place dispose également d'obligations privées cotées.
   * Si ce n'est pas le cas, toute la poche privée peut être matérialisée
   * par les obligations non cotées de démonstration.
   */
  const listedPrivateCandidates = CLIENT_TRADABLE_MARKETS.filter(
    (instrument) =>
      instrument.marche === client?.marche &&
      cessionAssetClass(instrument) === 'Obl. privées'
  );

  const seed = liquidityHistorySeed(
    `${client?.id}-${client?.nom}-${client?.marche}-non-cote-${index}`
  );

  /*
   * BRVM / NGX dans la maquette :
   * la poche privée est matérialisée à 100 % en non coté quand aucun
   * instrument privé coté n'est disponible.
   *
   * GSE :
   * une partie reste sur l'obligation corporate cotée et 55 à 70 %
   * de la poche privée est matérialisée en non coté.
   */
  const totalNonListedPct =
    listedPrivateCandidates.length === 0
      ? privatePct
      : Math.min(
          privatePct,
          privatePct * (0.55 + (seed % 4) * 0.05)
        );

  /*
   * Sur BRVM, deux lignes non cotées peuvent être détenues par un même
   * portefeuille ; NGX et GSE disposent ici d'une ligne de démonstration.
   */
  const selectedCount =
    candidates.length === 1
      ? 1
      : 1 + (seed % Math.min(2, candidates.length));

  const selected = [];
  for (
    let offset = 0;
    selected.length < selectedCount &&
    offset < candidates.length * 3;
    offset += 1
  ) {
    const candidate =
      candidates[(seed + offset) % candidates.length];

    if (
      !selected.some(
        (item) => item.nom === candidate.nom
      )
    ) {
      selected.push(candidate);
    }
  }

  const rawParts =
    selected.length === 1
      ? [1]
      : selected.length === 2
      ? [0.58, 0.42]
      : selected.map(() => 1 / selected.length);

  return selected
    .map((instrument, positionIndex) => {
      const expositionCible =
        totalNonListedPct *
        Number(rawParts[positionIndex] || 0);

      const valeurCible =
        (Number(client?.encours || 0) *
          expositionCible) /
        100;

      const prix = Math.max(
        0.000001,
        Number(instrument.cours || 0)
      );

      const quantite = Math.max(
        1,
        Math.floor(valeurCible / prix)
      );

      const valeur = quantite * prix;

      const expositionPct =
        Number(client?.encours || 0) > 0
          ? (valeur / Number(client.encours)) * 100
          : expositionCible;

      return cessionNormalizeNonListedPosition(
        client,
        {
          ...instrument,
          titre: instrument.nom,
          expositionPct,
          quantite,
          valeur,
          prixValorisation: prix,
          source: 'Simulation portefeuille GSM',
        },
        positionIndex
      );
    })
    .filter(Boolean);
};

const cessionNonListedPositionsForClient = (
  client,
  index = 0
) => {
  const existing = Array.isArray(
    client?.obligationsNonCotees
  )
    ? client.obligationsNonCotees
        .map((position, positionIndex) =>
          cessionNormalizeNonListedPosition(
            client,
            position,
            positionIndex
          )
        )
        .filter(Boolean)
    : [];

  return existing.length > 0
    ? existing
    : cessionGenerateNonListedPositions(client, index);
};

const cessionAttachNonListedPositions = (
  client,
  index = 0
) => ({
  ...client,
  obligationsNonCotees:
    cessionNonListedPositionsForClient(client, index),
});

const cessionInstrumentListingStatus = (instrumentLike) => {
  if (!instrumentLike) return 'Non renseigné';

  const explicit =
    instrumentLike.cotation ??
    instrumentLike.listingStatus ??
    instrumentLike.statutCotation;

  if (explicit) {
    return /non|unlisted|hors/i.test(String(explicit))
      ? 'Non coté'
      : 'Coté';
  }

  if (instrumentLike.listed === false || instrumentLike.estCote === false) {
    return 'Non coté';
  }

  if (instrumentLike.listed === true || instrumentLike.estCote === true) {
    return 'Coté';
  }

  const nom =
    instrumentLike.titre ||
    instrumentLike.nom ||
    instrumentLike.instrument?.nom ||
    '';
  const marche =
    instrumentLike.marche ||
    instrumentLike.instrument?.marche;

  const nonListed = CESSION_NON_LISTED_BONDS.some(
    (instrument) =>
      instrument.nom === nom &&
      (!marche || instrument.marche === marche)
  );
  if (nonListed) return 'Non coté';

  const listed = CLIENT_TRADABLE_MARKETS.some(
    (instrument) =>
      instrument.nom === nom &&
      (!marche || instrument.marche === marche)
  );
  return listed ? 'Coté' : 'Non renseigné';
};

const cessionExecutionChannel = (instrumentLike) => {
  const type =
    instrumentLike?.type ||
    instrumentLike?.instrument?.type ||
    (instrumentLike?.assetClass === 'Actions'
      ? 'Action'
      : instrumentLike?.assetClass?.startsWith('Obl.')
      ? 'Obligation'
      : undefined);

  const listing = cessionInstrumentListingStatus(instrumentLike);

  if (type === 'Action') return 'cote';
  if (type === 'Obligation' && listing === 'Coté') return 'cote';
  if (type === 'Obligation' && listing === 'Non coté') return 'non-cote';

  return 'non-routable';
};

const cessionIsInternalOrder = (order) =>
  cessionExecutionChannel(order) === 'non-cote';

const cessionIsListedOrder = (order) =>
  cessionExecutionChannel(order) === 'cote';

const cessionUpcomingCash = (client, dateRetrait) => {
  const dateDebut = parseIsoLocalDate(CESSION_RETRAIT_REFERENCE_DATE);
  const dateFin = parseIsoLocalDate(
    dateRetrait || CESSION_RETRAIT_REFERENCE_DATE
  );
  if (dateFin < dateDebut) return 0;

  return UPCOMING_CASHFLOWS.reduce((total, flux) => {
    const dateFlux = parseFR(flux.echeance);
    const clients = String(flux.portefeuilles || '')
      .split(',')
      .map((nom) => nom.trim())
      .filter(Boolean);
    if (
      !clients.includes(client.nom) ||
      dateFlux < dateDebut ||
      dateFlux > dateFin
    ) {
      return total;
    }
    const montantClient =
      clients.length > 0 ? flux.montant / clients.length : 0;
    return (
      total +
      convertCurrency(
        montantClient,
        flux.devise || client.devise,
        client.devise
      )
    );
  }, 0);
};

const cessionMarketCandidates = (client, assetClass) =>
  CESSION_INSTRUMENT_UNIVERSE.filter(
    (instrument) =>
      instrument.marche === client.marche &&
      cessionAssetClass(instrument) === assetClass
  );

const cessionSimulatedHoldings = (client, assetClass) => {
  const classValue =
    (Number(client.encours || 0) * Number(client.alloc?.[assetClass] || 0)) /
    100;
  if (classValue <= 0) return [];

  const candidates = cessionMarketCandidates(client, assetClass);
  if (candidates.length === 0) return [];

  const nonListedPositions =
    cessionNonListedPositionsForClient(client);

  const totalNonListedExposurePct =
    nonListedPositions.reduce(
      (sum, position) =>
        sum + Number(position.expositionPct || 0),
      0
    );

  const listedCandidates = candidates.filter(
    (instrument) =>
      cessionExecutionChannel(instrument) === 'cote'
  );

  const remainingPrivateExposurePct =
    assetClass === 'Obl. privées'
      ? Math.max(
          0,
          Number(
            client.alloc?.['Obl. privées'] || 0
          ) - totalNonListedExposurePct
        )
      : 0;

  const rawWeights = candidates.map((instrument) => {
    const nonListedPosition =
      nonListedPositions.find(
        (position) =>
          position.titre === instrument.nom
      );

    if (nonListedPosition) {
      return Math.max(
        0,
        Number(
          nonListedPosition.expositionPct || 0
        )
      );
    }

    /*
     * Le reliquat de la poche privée reste réparti entre les éventuelles
     * obligations privées cotées de la place.
     */
    if (
      assetClass === 'Obl. privées' &&
      cessionExecutionChannel(instrument) === 'cote' &&
      listedCandidates.length > 0
    ) {
      return (
        remainingPrivateExposurePct /
        listedCandidates.length
      );
    }

    return Math.max(
      0,
      Number(
        exposureOf(client.id, instrument.nom) || 0
      )
    );
  });

  const rawTotal = rawWeights.reduce(
    (sum, value) => sum + value,
    0
  );
  const weights =
    rawTotal > 0
      ? rawWeights.map((value) => value / rawTotal)
      : candidates.map(() => 1 / candidates.length);

  return candidates
    .map((instrument, index) => {
      const holdingValue = classValue * weights[index];
      const price = Math.max(0.000001, Number(instrument.cours || 0));
      const quantity = Math.max(0, Math.floor(holdingValue / price));
      const value = quantity * price;
      const volume = Math.max(0, Number(instrument.volumeJour || 0));
      const tradedValue = volume * price;
      const amplitude =
        price > 0
          ? Math.abs(
              Number(instrument.coursMax || price) -
                Number(instrument.coursMin || price)
            ) / price
          : 0;
      const concentration = classValue > 0 ? value / classValue : 0;
      const variation = Number(instrument.variation || 0);
      const bearishBoost = Math.max(0, -variation) / 10;
      const liquidityBoost = Math.min(1, tradedValue / Math.max(classValue, 1));
      const priorityScore =
        concentration * 0.45 + liquidityBoost * 0.35 + bearishBoost * 0.2;

      return {
        instrument,
        quantity,
        value,
        holdingValue: value,
        priorityScore,
        volume,
        tradedValue,
        amplitude,
      };
    })
    .filter((holding) => holding.quantity > 0 && holding.holdingValue > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);
};

const cessionBuildPlan = (
  client,
  request,
  maxParticipation = CESSION_RETRAIT_DEFAULT_PARTICIPATION,
  strategie = 'Équilibrée'
) => {
  const encours = Math.max(0, Number(client.encours || 0));
  const requestedWithdrawal = Math.max(0, Number(request?.montant || 0));
  const withdrawal = Math.min(requestedWithdrawal, encours);

  const maxWithdrawalAllowed = encours * CESSION_RETRAIT_MAX_WITHDRAWAL_RATIO;
  const minimumAccountBalance = cessionRetraitMinimumAccountBalance(client);
  const remainingAfterRequestedWithdrawal = Math.max(
    0,
    encours - requestedWithdrawal
  );
  const exceeds95Percent =
    encours > 0 && requestedWithdrawal > maxWithdrawalAllowed;
  const belowMinimumAccountBalance =
    minimumAccountBalance > 0 &&
    remainingAfterRequestedWithdrawal < minimumAccountBalance;

  const invalidWithdrawal =
    requestedWithdrawal <= 0 ||
    encours <= 0 ||
    exceeds95Percent ||
    belowMinimumAccountBalance;
  const currentCash =
    (Number(client.encours || 0) * Number(client.alloc?.Liquidité || 0)) / 100;
  const upcomingCash = cessionUpcomingCash(client, request?.date);
  const projectedValue = Math.max(0, Number(client.encours || 0) - withdrawal);
  const targetCash =
    (projectedValue * Number(client.cible?.Liquidité || 0)) / 100;
  const cashBeforeSale = currentCash + upcomingCash;
  const netSaleNeed = Math.max(0, withdrawal + targetCash - cashBeforeSale);
  const grossSaleNeed =
    netSaleNeed > 0 ? netSaleNeed / (1 - CESSION_RETRAIT_FEE_RATE) : 0;

  const investedClasses = ['Actions', 'Obl. souveraines', 'Obl. privées'];
  const classDiagnostics = investedClasses.map((assetClass) => {
    const currentValue =
      (Number(client.encours || 0) * Number(client.alloc?.[assetClass] || 0)) /
      100;
    const targetValue =
      (projectedValue * Number(client.cible?.[assetClass] || 0)) / 100;
    const excess = currentValue - targetValue;
    return {
      assetClass,
      currentValue,
      targetValue,
      excess,
      currentPct: Number(client.alloc?.[assetClass] || 0),
      targetPct: Number(client.cible?.[assetClass] || 0),
    };
  });

  let classRemaining = grossSaleNeed;
  const saleByClass = [];

  classDiagnostics
    .filter((item) => item.excess > 0)
    .sort((a, b) => b.excess - a.excess)
    .forEach((item) => {
      if (classRemaining <= 0) return;
      const amount = Math.min(item.excess, classRemaining);
      if (amount > 0) {
        saleByClass.push({ ...item, amount });
        classRemaining -= amount;
      }
    });

  // Si les seuls écarts positifs ne suffisent pas à couvrir les frais/arrondis,
  // on complète sur les classes les plus importantes sans dépasser leur valeur.
  if (classRemaining > 1) {
    classDiagnostics
      .slice()
      .sort((a, b) => b.currentValue - a.currentValue)
      .forEach((item) => {
        if (classRemaining <= 0) return;
        const deja = saleByClass
          .filter((line) => line.assetClass === item.assetClass)
          .reduce((sum, line) => sum + line.amount, 0);
        const disponible = Math.max(0, item.currentValue - deja);
        const amount = Math.min(disponible, classRemaining);
        if (amount > 0) {
          saleByClass.push({ ...item, amount, fallback: true });
          classRemaining -= amount;
        }
      });
  }

  const orders = [];
  let uncoveredMarket = 0;

  saleByClass.forEach((saleClass) => {
    let remaining = saleClass.amount;
    let holdings = cessionSimulatedHoldings(client, saleClass.assetClass);

    if (strategie === 'Exécution rapide') {
      holdings = holdings.sort((a, b) => b.tradedValue - a.tradedValue);
    } else if (strategie === 'Impact minimal') {
      holdings = holdings.sort((a, b) => a.amplitude - b.amplitude);
    } else if (strategie === "Nombre d'ordres minimal") {
      holdings = holdings.sort((a, b) => b.holdingValue - a.holdingValue);
    }

    if (holdings.length === 0) {
      uncoveredMarket += remaining;
      return;
    }

    holdings.forEach((holding) => {
      if (remaining <= 0) return;
      const price = Number(holding.instrument.cours || 0);
      const targetValue = Math.min(remaining, holding.holdingValue);
      const quantity = Math.min(
        holding.quantity,
        Math.max(1, Math.ceil(targetValue / Math.max(price, 0.000001)))
      );
      const gross = quantity * price;
      const cotation = cessionInstrumentListingStatus(
        holding.instrument
      );
      const executionChannel = cessionExecutionChannel(
        holding.instrument
      );
      const dailyVolume =
        executionChannel === 'cote'
          ? Math.max(
              0,
              Number(holding.instrument.volumeJour || 0)
            )
          : 0;
      const participationPct =
        executionChannel === 'cote'
          ? dailyVolume > 0
            ? (quantity / dailyVolume) * 100
            : Infinity
          : 0;
      const sessions =
        executionChannel === 'cote'
          ? Number.isFinite(participationPct)
            ? Math.max(
                1,
                Math.ceil(
                  participationPct /
                    Math.max(1, maxParticipation)
                )
              )
            : 99
          : 1;
      const impact =
        executionChannel === 'non-cote'
          ? 'Interne'
          : participationPct <= maxParticipation
          ? 'Faible'
          : participationPct <= maxParticipation * 5
          ? 'Moyen'
          : 'Élevé';
      const execution =
        executionChannel === 'non-cote'
          ? 'Cession interne'
          : participationPct <= maxParticipation
          ? 'Immédiat'
          : participationPct <= maxParticipation * 5
          ? 'Fractionné'
          : 'Sous contrainte';

      orders.push({
        clientId: client.id,
        client: client.nom,
        assetClass: saleClass.assetClass,
        titre: holding.instrument.nom,
        marche: holding.instrument.marche,
        devise: holding.instrument.devise,
        prix: price,
        quantite: quantity,
        montantBrut: gross,
        fraisEstimes: gross * CESSION_RETRAIT_FEE_RATE,
        montantNet: gross * (1 - CESSION_RETRAIT_FEE_RATE),
        volumeJour: dailyVolume,
        cotation,
        executionChannel,
        participationPct,
        sessions,
        impact,
        execution,
        motif: saleClass.fallback
          ? `${saleClass.assetClass} mobilisée en complément du besoin de liquidité.`
          : `${saleClass.assetClass} surpondérée par rapport à la cible post-retrait.`,
      });
      remaining -= gross;
    });

    if (remaining > 1) uncoveredMarket += remaining;
  });

  const grossSale = orders.reduce((sum, order) => sum + order.montantBrut, 0);
  const fees = orders.reduce((sum, order) => sum + order.fraisEstimes, 0);
  const netSale = orders.reduce((sum, order) => sum + order.montantNet, 0);
  const cashAfterWithdrawal = Math.max(
    0,
    cashBeforeSale + netSale - withdrawal
  );

  const soldByClass = investedClasses.reduce((map, assetClass) => {
    map[assetClass] = orders
      .filter((order) => order.assetClass === assetClass)
      .reduce((sum, order) => sum + order.montantBrut, 0);
    return map;
  }, {});

  const postAmounts = {
    Actions: Math.max(
      0,
      (Number(client.encours || 0) * Number(client.alloc?.Actions || 0)) / 100 -
        Number(soldByClass.Actions || 0)
    ),
    'Obl. souveraines': Math.max(
      0,
      (Number(client.encours || 0) *
        Number(client.alloc?.['Obl. souveraines'] || 0)) /
        100 -
        Number(soldByClass['Obl. souveraines'] || 0)
    ),
    'Obl. privées': Math.max(
      0,
      (Number(client.encours || 0) *
        Number(client.alloc?.['Obl. privées'] || 0)) /
        100 -
        Number(soldByClass['Obl. privées'] || 0)
    ),
    Liquidité: cashAfterWithdrawal,
  };

  const postTotal = Object.values(postAmounts).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const postAllocation = ASSET_KEYS.reduce((map, assetClass) => {
    map[assetClass] =
      postTotal > 0
        ? (Number(postAmounts[assetClass] || 0) / postTotal) * 100
        : 0;
    return map;
  }, {});
  const deviations = ASSET_KEYS.map((assetClass) => ({
    assetClass,
    current: Number(client.alloc?.[assetClass] || 0),
    target: Number(client.cible?.[assetClass] || 0),
    post: Number(postAllocation[assetClass] || 0),
    gap:
      Number(postAllocation[assetClass] || 0) -
      Number(client.cible?.[assetClass] || 0),
  }));
  const maxDeviation = Math.max(
    ...deviations.map((item) => Math.abs(item.gap))
  );
  const listedOrdersForExecution = orders.filter(cessionIsListedOrder);
  const maxOrderParticipation = listedOrdersForExecution.length
    ? Math.max(
        ...listedOrdersForExecution.map(
          (order) => order.participationPct
        )
      )
    : 0;
  const maxSessions = listedOrdersForExecution.length
    ? Math.max(
        ...listedOrdersForExecution.map((order) => order.sessions)
      )
    : 1;
  const marketStatus =
    uncoveredMarket > 1 || !Number.isFinite(maxOrderParticipation)
      ? 'Non exécutable'
      : maxOrderParticipation <= maxParticipation
      ? 'Compatible'
      : maxOrderParticipation <= maxParticipation * 5
      ? 'Fractionnement requis'
      : 'Sous contrainte';
  const allocationCompliant = maxDeviation <= CESSION_RETRAIT_TOLERANCE;
  const amountCovered = netSale + cashBeforeSale + 1 >= withdrawal + targetCash;
  const executable =
    !invalidWithdrawal &&
    amountCovered &&
    uncoveredMarket <= 1 &&
    marketStatus !== 'Non exécutable';
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          maxDeviation * 5 -
          Math.max(0, maxOrderParticipation - maxParticipation) * 0.25 -
          (uncoveredMarket > 1 ? 35 : 0)
      )
    )
  );

  return {
    client,
    request,
    withdrawal,
    currentCash,
    upcomingCash,
    targetCash,
    cashBeforeSale,
    netSaleNeed,
    grossSaleNeed,
    grossSale,
    fees,
    netSale,
    cashAfterWithdrawal,
    projectedValue,
    postTotal,
    postAllocation,
    deviations,
    maxDeviation,
    orders,
    uncoveredMarket,
    maxOrderParticipation,
    maxSessions,
    marketStatus,
    allocationCompliant,
    amountCovered,
    executable,
    invalidWithdrawal,
    maxWithdrawalAllowed,
    minimumAccountBalance,
    remainingAfterRequestedWithdrawal,
    exceeds95Percent,
    belowMinimumAccountBalance,
    score,
  };
};

const cessionManagerEditKey = (order) =>
  `${order.assetClass}::${order.titreSysteme || order.titre}`;

const cessionApplyManagerEdits = (
  basePlan,
  quantityEdits = {},
  titleEdits = {},
  maxParticipation = CESSION_RETRAIT_DEFAULT_PARTICIPATION
) => {
  const investedClasses = ['Actions', 'Obl. souveraines', 'Obl. privées'];
  const usedQuantities = {};

  const proposalLines = (basePlan.orders || []).map((order) => {
    const key = `${order.assetClass}::${order.titre}`;
    const holdings = cessionSimulatedHoldings(
      basePlan.client,
      order.assetClass
    );
    const availableTitles = holdings.map((holding) => holding.instrument.nom);
    const requestedTitle = titleEdits?.[key] || order.titre;
    const selectedHolding =
      holdings.find((holding) => holding.instrument.nom === requestedTitle) ||
      holdings.find((holding) => holding.instrument.nom === order.titre);
    const instrument = selectedHolding?.instrument || {
      nom: order.titre,
      marche: order.marche,
      devise: order.devise,
      cours: order.prix,
      volumeJour: order.volumeJour,
    };
    const selectedTitle = instrument.nom;
    const titleChanged = selectedTitle !== order.titre;
    const stockKey = `${order.assetClass}::${selectedTitle}`;
    const alreadyUsed = Number(usedQuantities[stockKey] || 0);
    const holdingMaxQuantity = Math.max(
      0,
      Number(selectedHolding?.quantity ?? order.quantite ?? 0)
    );
    const maxQuantity = Math.max(0, holdingMaxQuantity - alreadyUsed);
    const price = Math.max(
      0.000001,
      Number(instrument.cours || order.prix || 0)
    );

    const hasQuantityEdit = Object.prototype.hasOwnProperty.call(
      quantityEdits || {},
      key
    );
    const rawQuantity = hasQuantityEdit
      ? quantityEdits[key]
      : titleChanged
      ? Math.round(Number(order.montantBrut || 0) / price)
      : order.quantite;
    const requestedQuantity =
      rawQuantity === '' || rawQuantity == null
        ? 0
        : Math.max(0, Math.floor(Number(rawQuantity) || 0));
    const quantity = Math.min(requestedQuantity, maxQuantity);
    usedQuantities[stockKey] = alreadyUsed + quantity;

    const gross = quantity * price;
    const cotation = cessionInstrumentListingStatus(instrument);
    const executionChannel = cessionExecutionChannel(instrument);
    const dailyVolume =
      executionChannel === 'cote'
        ? Math.max(
            0,
            Number(instrument.volumeJour || order.volumeJour || 0)
          )
        : 0;
    const participationPct =
      executionChannel === 'cote'
        ? dailyVolume > 0
          ? (quantity / dailyVolume) * 100
          : Infinity
        : 0;
    const sessions =
      quantity <= 0
        ? 0
        : executionChannel === 'non-cote'
        ? 1
        : Number.isFinite(participationPct)
        ? Math.max(
            1,
            Math.ceil(
              participationPct /
                Math.max(1, Number(maxParticipation || 1))
            )
          )
        : 99;
    const impact =
      quantity <= 0
        ? 'Aucun'
        : executionChannel === 'non-cote'
        ? 'Interne'
        : participationPct <= maxParticipation
        ? 'Faible'
        : participationPct <= maxParticipation * 5
        ? 'Moyen'
        : 'Élevé';
    const execution =
      quantity <= 0
        ? 'Exclu par le gérant'
        : executionChannel === 'non-cote'
        ? 'Cession interne'
        : participationPct <= maxParticipation
        ? 'Immédiat'
        : participationPct <= maxParticipation * 5
        ? 'Fractionné'
        : 'Sous contrainte';

    return {
      ...order,
      editKey: key,
      titreSysteme: order.titre,
      titre: selectedTitle,
      marche: instrument.marche || order.marche,
      devise: instrument.devise || order.devise,
      prix: price,
      volumeJour: dailyVolume,
      cotation,
      executionChannel,
      availableTitles,
      quantiteSysteme: Number(order.quantite || 0),
      quantite: quantity,
      maxQuantity,
      holdingMaxQuantity,
      montantBrut: gross,
      fraisEstimes: gross * CESSION_RETRAIT_FEE_RATE,
      montantNet: gross * (1 - CESSION_RETRAIT_FEE_RATE),
      participationPct,
      sessions,
      impact,
      execution,
      managerEdited:
        titleChanged ||
        (hasQuantityEdit && quantity !== Number(order.quantite || 0)),
    };
  });

  const orders = proposalLines.filter((order) => order.quantite > 0);
  const grossSale = orders.reduce(
    (sum, order) => sum + Number(order.montantBrut || 0),
    0
  );
  const fees = orders.reduce(
    (sum, order) => sum + Number(order.fraisEstimes || 0),
    0
  );
  const netSale = orders.reduce(
    (sum, order) => sum + Number(order.montantNet || 0),
    0
  );
  const cashAfterWithdrawal = Math.max(
    0,
    Number(basePlan.cashBeforeSale || 0) +
      netSale -
      Number(basePlan.withdrawal || 0)
  );

  const soldByClass = investedClasses.reduce((map, assetClass) => {
    map[assetClass] = orders
      .filter((order) => order.assetClass === assetClass)
      .reduce((sum, order) => sum + Number(order.montantBrut || 0), 0);
    return map;
  }, {});

  const client = basePlan.client;
  const postAmounts = {
    Actions: Math.max(
      0,
      (Number(client.encours || 0) * Number(client.alloc?.Actions || 0)) / 100 -
        Number(soldByClass.Actions || 0)
    ),
    'Obl. souveraines': Math.max(
      0,
      (Number(client.encours || 0) *
        Number(client.alloc?.['Obl. souveraines'] || 0)) /
        100 -
        Number(soldByClass['Obl. souveraines'] || 0)
    ),
    'Obl. privées': Math.max(
      0,
      (Number(client.encours || 0) *
        Number(client.alloc?.['Obl. privées'] || 0)) /
        100 -
        Number(soldByClass['Obl. privées'] || 0)
    ),
    Liquidité: cashAfterWithdrawal,
  };

  const postTotal = Object.values(postAmounts).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const postAllocation = ASSET_KEYS.reduce((map, assetClass) => {
    map[assetClass] =
      postTotal > 0
        ? (Number(postAmounts[assetClass] || 0) / postTotal) * 100
        : 0;
    return map;
  }, {});
  const deviations = ASSET_KEYS.map((assetClass) => ({
    assetClass,
    current: Number(client.alloc?.[assetClass] || 0),
    target: Number(client.cible?.[assetClass] || 0),
    post: Number(postAllocation[assetClass] || 0),
    gap:
      Number(postAllocation[assetClass] || 0) -
      Number(client.cible?.[assetClass] || 0),
  }));
  const maxDeviation = Math.max(
    0,
    ...deviations.map((item) => Math.abs(item.gap))
  );
  const listedOrdersForExecution = orders.filter(cessionIsListedOrder);
  const maxOrderParticipation = listedOrdersForExecution.length
    ? Math.max(
        ...listedOrdersForExecution.map(
          (order) => order.participationPct
        )
      )
    : 0;
  const maxSessions = listedOrdersForExecution.length
    ? Math.max(
        ...listedOrdersForExecution.map((order) => order.sessions)
      )
    : 0;

  const uncoveredMarket = Math.max(
    0,
    Number(basePlan.grossSaleNeed || 0) - grossSale
  );
  const marketStatus =
    uncoveredMarket > 1 ||
    (orders.length > 0 && !Number.isFinite(maxOrderParticipation))
      ? 'Non exécutable'
      : maxOrderParticipation <= maxParticipation
      ? 'Compatible'
      : maxOrderParticipation <= maxParticipation * 5
      ? 'Fractionnement requis'
      : 'Sous contrainte';

  const allocationCompliant = maxDeviation <= CESSION_RETRAIT_TOLERANCE;
  const amountCovered =
    netSale + Number(basePlan.cashBeforeSale || 0) + 1 >=
    Number(basePlan.withdrawal || 0) + Number(basePlan.targetCash || 0);
  const executable =
    !basePlan.invalidWithdrawal &&
    amountCovered &&
    uncoveredMarket <= 1 &&
    marketStatus !== 'Non exécutable';

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          maxDeviation * 5 -
          Math.max(0, maxOrderParticipation - maxParticipation) * 0.25 -
          (uncoveredMarket > 1 ? 35 : 0)
      )
    )
  );

  return {
    ...basePlan,
    proposalLines,
    orders,
    grossSale,
    fees,
    netSale,
    cashAfterWithdrawal,
    postTotal,
    postAllocation,
    deviations,
    maxDeviation,
    uncoveredMarket,
    maxOrderParticipation,
    maxSessions,
    marketStatus,
    allocationCompliant,
    amountCovered,
    executable,
    score,
    managerEdited: proposalLines.some((order) => order.managerEdited),
  };
};

const CESSION_INTERNE_CONSTRAINT_MODES = [
  'Obligatoire',
  'Préférence',
  'Information',
];

const cessionInterneUniqueOptions = (values) =>
  Array.from(
    new Set(
      (values || [])
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
    )
  )
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((value) => ({ value, label: value }));

const cessionInterneClientTypeLabel = (client) =>
  PROFILE_TYPE_LABEL[client?.type] || client?.type || 'Non renseigné';

const cessionInterneInstrumentMeta = (instrumentLike) => {
  const nom =
    typeof instrumentLike === 'string'
      ? instrumentLike
      : instrumentLike?.titre ||
        instrumentLike?.nom ||
        instrumentLike?.instrument?.nom ||
        '';
  const marche =
    typeof instrumentLike === 'string'
      ? undefined
      : instrumentLike?.marche ||
        instrumentLike?.instrument?.marche;

  const instrument =
    CESSION_INSTRUMENT_UNIVERSE.find(
      (item) =>
        item.nom === nom && (!marche || item.marche === marche)
    ) ||
    resolveMarketInstrument(nom, marche) ||
    {};

  const actionSource = Object.entries(BOURSES_ACTIVE_CONFIG)
    .flatMap(([code, config]) =>
      (config.instruments || []).map((item) => ({
        ...item,
        marche: code,
        devise: config.devise,
      }))
    )
    .find(
      (item) =>
        item.nom === nom && (!marche || item.marche === marche)
    );

  const reco = RECOS.find(
    (item) =>
      item.titre === nom && (!marche || item.marche === marche)
  );
  const bondMeta = BOND_MARKET_META[nom] || {};
  const type =
    instrument.type ||
    (bondMeta.emetteur ? 'Obligation' : actionSource ? 'Action' : '');
  const assetClass = cessionAssetClass({
    ...instrument,
    nom,
    type,
  });

  const cours = Number(
    instrument.cours ??
      actionSource?.cours ??
      instrumentLike?.prix ??
      0
  );
  const coursMin = Number(
    instrument.coursMin ?? actionSource?.coursMin ?? cours
  );
  const coursMax = Number(
    instrument.coursMax ?? actionSource?.coursMax ?? cours
  );

  const amplitudePct =
    cours > 0
      ? (Math.abs(coursMax - coursMin) / cours) * 100
      : 0;

  const secteur =
    instrument.secteur ||
    actionSource?.secteur ||
    reco?.secteur ||
    (assetClass === 'Obl. souveraines'
      ? 'Souverain'
      : assetClass === 'Obl. privées'
      ? 'Corporate'
      : 'Non renseigné');

  const emetteur =
    bondMeta.emetteur ||
    instrument.emetteur ||
    (type === 'Action' ? nom : 'Non renseigné');

  return {
    nom,
    type: type || 'Non renseigné',
    assetClass,
    marche:
      instrument.marche ||
      actionSource?.marche ||
      marche ||
      'Non renseigné',
    devise:
      instrument.devise ||
      actionSource?.devise ||
      instrumentLike?.devise ||
      'Non renseigné',
    secteur,
    emetteur,
    cours,
    variation: Number(
      instrument.variation ?? actionSource?.variation ?? 0
    ),
    volumeJour: Number(
      instrument.volumeJour ??
        actionSource?.volume ??
        instrumentLike?.volumeJour ??
        0
    ),
    amplitudePct,
    coupon:
      bondMeta.coupon == null ? null : Number(bondMeta.coupon),
    rendement:
      bondMeta.rendement == null ? null : Number(bondMeta.rendement),
    duration:
      instrument.duration != null
        ? Number(instrument.duration)
        : bondMeta.duration == null
        ? null
        : Number(bondMeta.duration),
    echeance:
      instrument.echeance != null
        ? Number(instrument.echeance)
        : bondMeta.echeance == null
        ? null
        : Number(bondMeta.echeance),
    cotation: cessionInstrumentListingStatus({
      ...instrument,
      nom,
      type,
    }),
    executionChannel: cessionExecutionChannel({
      ...instrument,
      nom,
      type,
      assetClass,
    }),
  };
};

const CESSION_INTERNE_TITLE_UNIVERSE =
  CESSION_INSTRUMENT_UNIVERSE.filter(
    (instrument) =>
      cessionExecutionChannel(instrument) === 'non-cote'
  )
    .map(cessionInterneInstrumentMeta)
    .filter((item) => item.nom);

const cessionInterneBuyerTitleMetrics = (
  buyer,
  order,
  candidateAmount = 0
) => {
  const encours = Math.max(1, Number(buyer?.encours || 0));
  const orderMeta = cessionInterneInstrumentMeta(order);
  const investedClasses = [
    'Actions',
    'Obl. souveraines',
    'Obl. privées',
  ];

  let currentTitleValue = 0;
  let currentSectorValue = 0;
  let currentIssuerValue = 0;

  investedClasses.forEach((assetClass) => {
    cessionSimulatedHoldings(buyer, assetClass).forEach((holding) => {
      const meta = cessionInterneInstrumentMeta(holding.instrument);
      const value = Number(holding.holdingValue || 0);

      if (meta.nom === orderMeta.nom) {
        currentTitleValue += value;
      }
      if (
        orderMeta.secteur !== 'Non renseigné' &&
        meta.secteur === orderMeta.secteur
      ) {
        currentSectorValue += value;
      }
      if (
        orderMeta.emetteur !== 'Non renseigné' &&
        meta.emetteur === orderMeta.emetteur
      ) {
        currentIssuerValue += value;
      }
    });
  });

  const amount = Math.max(0, Number(candidateAmount || 0));

  return {
    meta: orderMeta,
    alreadyHeld: currentTitleValue > 0,
    titleWeightBeforePct: (currentTitleValue / encours) * 100,
    titleWeightAfterPct:
      ((currentTitleValue + amount) / encours) * 100,
    sectorWeightAfterPct:
      ((currentSectorValue + amount) / encours) * 100,
    issuerWeightAfterPct:
      ((currentIssuerValue + amount) / encours) * 100,
  };
};

const cessionInterneConstraintOptions = {
  client_type: () =>
    cessionInterneUniqueOptions(CLIENTS.map(cessionInterneClientTypeLabel)),
  risk_profile: () =>
    cessionInterneUniqueOptions(CLIENTS.map((client) => client.profilRisque)),
  risk_level: () =>
    cessionInterneUniqueOptions(CLIENTS.map((client) => client.risque)),
  country: () =>
    cessionInterneUniqueOptions(CLIENTS.map((client) => client.pays)),
  market: () =>
    cessionInterneUniqueOptions(CLIENTS.map((client) => client.marche)),
  currency: () =>
    cessionInterneUniqueOptions(CLIENTS.map((client) => client.devise)),
  manager: () =>
    cessionInterneUniqueOptions(
      CLIENTS.map((client) => cessionInterneGestionnaire(client))
    ),
  client: () =>
    [...CLIENTS]
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .map((client) => ({
        value: client.id,
        label: `${client.nom} · ${client.marche} · ${client.devise}`,
      })),
  title_name: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.nom)
    ),
  title_asset_class: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.assetClass)
    ),
  title_instrument_type: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.type)
    ),
  title_sector: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.secteur)
    ),
  title_issuer: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.emetteur)
    ),
  title_market: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.marche)
    ),
  title_currency: () =>
    cessionInterneUniqueOptions(
      CESSION_INTERNE_TITLE_UNIVERSE.map((item) => item.devise)
    ),
  manager_scope: () => [
    { value: 'same', label: 'Même gestionnaire que le vendeur' },
    { value: 'other', label: 'Autre gestionnaire uniquement' },
  ],
};

const CESSION_INTERNE_CONSTRAINT_CATALOG = [
  {
    key: 'client_type',
    category: 'Client',
    label: 'Type de portefeuille',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'risk_profile',
    category: 'Profil',
    label: 'Profil de risque',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'risk_level',
    category: 'Profil',
    label: 'Niveau de risque',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'country',
    category: 'Client',
    label: 'Pays du portefeuille',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'market',
    category: 'Marché',
    label: 'Marché du portefeuille',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'currency',
    category: 'Devise',
    label: 'Devise de référence',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'manager',
    category: 'Gestionnaire',
    label: 'Gestionnaires autorisés',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'manager_scope',
    category: 'Gestionnaire',
    label: 'Périmètre gestionnaire',
    kind: 'enum',
    multiple: false,
    operators: ['='],
    defaultOperator: '=',
  },
  {
    key: 'client',
    category: 'Client',
    label: 'Clients / portefeuilles nommément sélectionnés',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_name',
    category: 'Titres',
    label: 'Titre précis',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_asset_class',
    category: 'Titres',
    label: 'Classe d’actifs du titre',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_instrument_type',
    category: 'Titres',
    label: 'Type d’instrument',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_sector',
    category: 'Titres',
    label: 'Secteur du titre',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_issuer',
    category: 'Titres',
    label: 'Émetteur du titre',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_market',
    category: 'Titres',
    label: 'Marché du titre',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_currency',
    category: 'Titres',
    label: 'Devise du titre',
    kind: 'enum',
    multiple: true,
    operators: ['est dans', "n'est pas dans"],
    defaultOperator: 'est dans',
  },
  {
    key: 'title_already_held',
    category: 'Titres',
    label: 'Titre déjà détenu par la contrepartie',
    kind: 'boolean',
    operators: ['='],
    defaultOperator: '=',
    defaultValue: true,
  },
  {
    key: 'max_title_weight_after_pct',
    category: 'Titres',
    label: 'Poids maximum du titre après achat',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 10,
  },
  {
    key: 'max_sector_weight_after_pct',
    category: 'Titres',
    label: 'Poids maximum du secteur après achat',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 30,
  },
  {
    key: 'max_issuer_weight_after_pct',
    category: 'Titres',
    label: 'Poids maximum de l’émetteur après achat',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 15,
  },
  {
    key: 'min_title_daily_volume',
    category: 'Titres',
    label: 'Volume journalier minimum du titre',
    kind: 'number',
    unit: 'titres',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 1000,
  },
  {
    key: 'min_title_daily_variation',
    category: 'Titres',
    label: 'Variation journalière minimale du titre',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: -5,
  },
  {
    key: 'max_title_daily_variation',
    category: 'Titres',
    label: 'Variation journalière maximale du titre',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 5,
  },
  {
    key: 'max_title_amplitude_pct',
    category: 'Titres',
    label: 'Amplitude intrajournalière maximale du titre',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 5,
  },
  {
    key: 'min_title_price',
    category: 'Titres',
    label: 'Cours minimum du titre',
    kind: 'number',
    unit: 'devise titre',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 0,
  },
  {
    key: 'max_title_price',
    category: 'Titres',
    label: 'Cours maximum du titre',
    kind: 'number',
    unit: 'devise titre',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 1000000,
  },
  {
    key: 'min_bond_coupon',
    category: 'Titres',
    label: 'Coupon minimum — obligations',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 5,
  },
  {
    key: 'min_bond_yield',
    category: 'Titres',
    label: 'Rendement minimum — obligations',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 5,
  },
  {
    key: 'max_bond_duration',
    category: 'Titres',
    label: 'Duration maximale — obligations',
    kind: 'number',
    unit: 'années',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 5,
  },
  {
    key: 'max_bond_maturity_year',
    category: 'Titres',
    label: 'Année d’échéance maximale — obligations',
    kind: 'number',
    unit: 'année',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 2035,
  },
  {
    key: 'min_assets',
    category: 'Encours',
    label: 'Encours minimum du portefeuille',
    kind: 'number',
    unit: 'devise portefeuille',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 100000000,
  },
  {
    key: 'max_assets',
    category: 'Encours',
    label: 'Encours maximum du portefeuille',
    kind: 'number',
    unit: 'devise portefeuille',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 5000000000,
  },
  {
    key: 'min_cash_before_pct',
    category: 'Liquidité',
    label: 'Liquidité avant achat',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 8,
  },
  {
    key: 'min_cash_after_pct',
    category: 'Liquidité',
    label: 'Liquidité après achat',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 5,
  },
  {
    key: 'liquidity_above_target_pct',
    category: 'Liquidité',
    label: 'Excédent de liquidité vs cible avant achat',
    kind: 'number',
    unit: 'pts',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 0,
  },
  {
    key: 'max_asset_after_pct',
    category: 'Allocation',
    label: 'Poids maximum de la classe achetée après opération',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 60,
  },
  {
    key: 'max_deviation_after',
    category: 'Allocation',
    label: 'Écart maximum au profil cible après achat',
    kind: 'number',
    unit: 'pts',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: CESSION_RETRAIT_TOLERANCE,
  },
  {
    key: 'profile_not_degraded',
    category: 'Profil',
    label: 'Ne pas dégrader le profil',
    kind: 'boolean',
    operators: ['='],
    defaultOperator: '=',
    defaultValue: true,
  },
  {
    key: 'asset_underweight_before',
    category: 'Allocation',
    label: 'Classe d’actifs sous-pondérée avant achat',
    kind: 'boolean',
    operators: ['='],
    defaultOperator: '=',
    defaultValue: true,
  },
  {
    key: 'min_profile_improvement',
    category: 'Profil',
    label: 'Amélioration minimale du profil',
    kind: 'number',
    unit: 'pts',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 0,
  },
  {
    key: 'min_capacity',
    category: 'Capacité',
    label: 'Capacité d’achat minimale',
    kind: 'number',
    unit: 'devise de la ligne',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 10000000,
  },
  {
    key: 'min_amount_per_client',
    category: 'Capacité',
    label: 'Montant minimum à affecter à un client',
    kind: 'number',
    unit: 'devise de la ligne',
    operators: ['≥'],
    defaultOperator: '≥',
    defaultValue: 1000000,
  },
  {
    key: 'max_amount_per_client',
    category: 'Capacité',
    label: 'Montant maximum par client',
    kind: 'number',
    unit: 'devise de la ligne',
    operators: ['≤'],
    defaultOperator: '≤',
    defaultValue: 100000000,
    scope: 'capacity',
  },
  {
    key: 'max_order_share_pct',
    category: 'Capacité',
    label: 'Part maximale de la cession absorbée par un client',
    kind: 'number',
    unit: '% de la ligne',
    operators: ['≤'],
    defaultOperator: '≤',
    defaultValue: 50,
    scope: 'capacity',
  },
  {
    key: 'max_buyers_per_line',
    category: 'Capacité',
    label: 'Nombre maximal de clients acheteurs par ligne',
    kind: 'number',
    unit: 'clients',
    operators: ['≤'],
    defaultOperator: '≤',
    defaultValue: 5,
    scope: 'allocation',
  },
  {
    key: 'full_coverage_single_client',
    category: 'Capacité',
    label: 'Exiger qu’un client puisse couvrir toute la ligne',
    kind: 'boolean',
    operators: ['='],
    defaultOperator: '=',
    defaultValue: true,
  },
  {
    key: 'min_portfolio_age_months',
    category: 'Client',
    label: 'Ancienneté minimale du portefeuille',
    kind: 'number',
    unit: 'mois',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 3,
  },
  {
    key: 'max_order_currency_exposure_after_pct',
    category: 'Devise',
    label: 'Exposition maximale à la devise du titre après achat',
    kind: 'number',
    unit: '%',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 70,
  },
  {
    key: 'max_alerts',
    category: 'Risque',
    label: 'Nombre maximal d’alertes actives',
    kind: 'number',
    unit: 'alertes',
    operators: ['≤', '≥'],
    defaultOperator: '≤',
    defaultValue: 2,
  },
  {
    key: 'min_performance',
    category: 'Performance',
    label: 'Performance minimale du portefeuille',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 0,
  },
  {
    key: 'min_profitability',
    category: 'Performance',
    label: 'Rentabilité minimale du portefeuille',
    kind: 'number',
    unit: '%',
    operators: ['≥', '≤'],
    defaultOperator: '≥',
    defaultValue: 0,
  },
];

const cessionInterneConstraintDefinition = (type) =>
  CESSION_INTERNE_CONSTRAINT_CATALOG.find((item) => item.key === type);

const cessionInterneDefaultConstraintValue = (definition) => {
  if (!definition) return '';
  if (definition.kind === 'enum') {
    const options =
      cessionInterneConstraintOptions[definition.key]?.() || [];
    if (definition.multiple) {
      return options[0]?.value ? [options[0].value] : [];
    }
    return options[0]?.value || '';
  }
  if (definition.kind === 'boolean') {
    return definition.defaultValue ?? true;
  }
  return definition.defaultValue ?? 0;
};

const cessionInterneCreateConstraint = (type) => {
  const definition =
    cessionInterneConstraintDefinition(type) ||
    CESSION_INTERNE_CONSTRAINT_CATALOG[0];

  return {
    id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: definition.key,
    mode: 'Obligatoire',
    operator: definition.defaultOperator,
    value: cessionInterneDefaultConstraintValue(definition),
    active: true,
  };
};

const cessionInterneConstraintNumericCompare = (
  actual,
  operator,
  expected
) => {
  const left = Number(actual);
  const right = Number(expected);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  if (operator === '≤') return left <= right;
  if (operator === '≥') return left >= right;
  if (operator === '<') return left < right;
  if (operator === '>') return left > right;
  return left === right;
};

const cessionInternePortfolioAgeMonths = (buyer) => {
  const entry = parseIsoLocalDate(
    buyer?.dateEntree || CESSION_RETRAIT_REFERENCE_DATE
  );
  const reference = parseIsoLocalDate(CESSION_RETRAIT_REFERENCE_DATE);
  return Math.max(
    0,
    (reference - entry) / (86_400_000 * 30.4375)
  );
};

const cessionInterneConstraintActualValue = (
  definition,
  candidate,
  order,
  seller
) => {
  const buyer = candidate.buyer;
  const sellerManager = cessionInterneGestionnaire(seller);
  const buyerManager = candidate.gestionnaire;
  const targetCashPct = Number(buyer.cible?.Liquidité || 0);
  const orderCurrencyExposureBefore = Number(
    buyer.expositionsDevises?.[order.devise] ||
      (buyer.devise === order.devise ? 100 : 0)
  );
  const encours = Math.max(1, Number(buyer.encours || 0));
  const orderCurrencyExposureAfter = Math.min(
    100,
    orderCurrencyExposureBefore +
      (Number(candidate.amount || 0) / encours) * 100
  );
  const titleMetrics = cessionInterneBuyerTitleMetrics(
    buyer,
    order,
    candidate.amount
  );
  const titleMeta = titleMetrics.meta;

  switch (definition?.key) {
    case 'client_type':
      return cessionInterneClientTypeLabel(buyer);
    case 'risk_profile':
      return buyer.profilRisque || 'Non renseigné';
    case 'risk_level':
      return buyer.risque || 'Non renseigné';
    case 'country':
      return buyer.pays || 'Non renseigné';
    case 'market':
      return buyer.marche || 'Non renseigné';
    case 'currency':
      return buyer.devise || 'Non renseigné';
    case 'manager':
      return buyerManager;
    case 'manager_scope':
      return buyerManager === sellerManager ? 'same' : 'other';
    case 'client':
      return buyer.id;
    case 'title_name':
      return titleMeta.nom;
    case 'title_asset_class':
      return titleMeta.assetClass;
    case 'title_instrument_type':
      return titleMeta.type;
    case 'title_sector':
      return titleMeta.secteur;
    case 'title_issuer':
      return titleMeta.emetteur;
    case 'title_market':
      return titleMeta.marche;
    case 'title_currency':
      return titleMeta.devise;
    case 'title_already_held':
      return titleMetrics.alreadyHeld;
    case 'max_title_weight_after_pct':
      return titleMetrics.titleWeightAfterPct;
    case 'max_sector_weight_after_pct':
      return titleMetrics.sectorWeightAfterPct;
    case 'max_issuer_weight_after_pct':
      return titleMetrics.issuerWeightAfterPct;
    case 'min_title_daily_volume':
      return titleMeta.volumeJour;
    case 'min_title_daily_variation':
    case 'max_title_daily_variation':
      return titleMeta.variation;
    case 'max_title_amplitude_pct':
      return titleMeta.amplitudePct;
    case 'min_title_price':
    case 'max_title_price':
      return titleMeta.cours;
    case 'min_bond_coupon':
      return titleMeta.coupon;
    case 'min_bond_yield':
      return titleMeta.rendement;
    case 'max_bond_duration':
      return titleMeta.duration;
    case 'max_bond_maturity_year':
      return titleMeta.echeance;
    case 'min_assets':
    case 'max_assets':
      return Number(buyer.encours || 0);
    case 'min_cash_before_pct':
      return Number(candidate.cashBeforePct || 0);
    case 'min_cash_after_pct':
      return Number(candidate.cashAfterPct || 0);
    case 'liquidity_above_target_pct':
      return Number(candidate.cashBeforePct || 0) - targetCashPct;
    case 'max_asset_after_pct':
      return Number(candidate.allocationAfter?.[order.assetClass] || 0);
    case 'max_deviation_after':
      return Number(candidate.afterDeviation || 0);
    case 'profile_not_degraded':
      return Number(candidate.profileImprovement || 0) >= -0.0001;
    case 'asset_underweight_before':
      return Number(candidate.assetGapBefore || 0) <= 0;
    case 'min_profile_improvement':
      return Number(candidate.profileImprovement || 0);
    case 'min_capacity':
    case 'min_amount_per_client':
      return Number(candidate.capacity || 0);
    case 'full_coverage_single_client':
      return (
        Number(candidate.capacity || 0) + 0.0001 >=
        Number(order.montantBrut || 0)
      );
    case 'min_portfolio_age_months':
      return cessionInternePortfolioAgeMonths(buyer);
    case 'max_order_currency_exposure_after_pct':
      return orderCurrencyExposureAfter;
    case 'max_alerts':
      return Number(buyer.alertes || 0);
    case 'min_performance':
      return Number(buyer.perf || 0);
    case 'min_profitability':
      return Number(buyer.rentabilite || 0);
    default:
      return null;
  }
};

const cessionInterneConstraintPasses = (
  definition,
  constraint,
  actual
) => {
  if (!definition) return true;

  if (definition.kind === 'enum') {
    const selected = Array.isArray(constraint.value)
      ? constraint.value.map(String)
      : [String(constraint.value || '')].filter(Boolean);

    if (!selected.length) return true;

    if (constraint.operator === "n'est pas dans") {
      return !selected.includes(String(actual));
    }
    if (constraint.operator === '=') {
      return String(actual) === selected[0];
    }
    return selected.includes(String(actual));
  }

  if (definition.kind === 'boolean') {
    const expected =
      constraint.value === true || String(constraint.value) === 'true';
    return Boolean(actual) === expected;
  }

  return cessionInterneConstraintNumericCompare(
    actual,
    constraint.operator,
    constraint.value
  );
};

const cessionInterneConstraintCapacityLimit = (
  order,
  constraints = []
) => {
  let limit = Infinity;

  constraints
    .filter(
      (constraint) =>
        constraint?.active !== false &&
        constraint?.mode === 'Obligatoire'
    )
    .forEach((constraint) => {
      const definition = cessionInterneConstraintDefinition(
        constraint.type
      );
      if (definition?.scope !== 'capacity') return;

      const value = Math.max(0, Number(constraint.value || 0));
      if (definition.key === 'max_amount_per_client' && value > 0) {
        limit = Math.min(limit, value);
      }
      if (definition.key === 'max_order_share_pct' && value > 0) {
        limit = Math.min(
          limit,
          (Number(order.montantBrut || 0) * value) / 100
        );
      }
    });

  return limit;
};

const cessionInterneMaxBuyersForLine = (constraints = []) => {
  const limits = constraints
    .filter(
      (constraint) =>
        constraint?.active !== false &&
        constraint?.mode === 'Obligatoire' &&
        constraint?.type === 'max_buyers_per_line'
    )
    .map((constraint) => Math.max(1, Math.floor(Number(constraint.value || 1))))
    .filter(Number.isFinite);

  return limits.length ? Math.min(...limits) : Infinity;
};

const cessionInterneAssessCandidate = (
  candidate,
  order,
  seller,
  constraints = []
) => {
  const results = [];
  let hardEligible = true;
  let preferenceScore = 0;
  let preferenceMatched = 0;
  let preferenceTotal = 0;

  constraints
    .filter((constraint) => constraint?.active !== false)
    .forEach((constraint) => {
      const definition = cessionInterneConstraintDefinition(
        constraint.type
      );

      if (!definition || definition.scope === 'allocation') return;

      // Les contraintes de capacité obligatoires ont déjà plafonné la quantité.
      // Elles restent visibles dans le diagnostic mais ne rendent pas le client
      // inéligible simplement parce que sa capacité brute était supérieure.
      if (
        definition.scope === 'capacity' &&
        constraint.mode === 'Obligatoire'
      ) {
        results.push({
          id: constraint.id,
          label: definition.label,
          mode: constraint.mode,
          passed: true,
          actual: Number(candidate.capacity || 0),
          note: 'Plafond appliqué à la capacité de contrepartie.',
        });
        return;
      }

      const actual = cessionInterneConstraintActualValue(
        definition,
        candidate,
        order,
        seller
      );
      const passed = cessionInterneConstraintPasses(
        definition,
        constraint,
        actual
      );

      results.push({
        id: constraint.id,
        label: definition.label,
        mode: constraint.mode,
        passed,
        actual,
      });

      if (constraint.mode === 'Obligatoire' && !passed) {
        hardEligible = false;
      }

      if (constraint.mode === 'Préférence') {
        preferenceTotal += 1;
        if (passed) {
          preferenceMatched += 1;
          preferenceScore += 1;
        }
      }
    });

  return {
    ...candidate,
    constraintResults: results,
    hardEligible,
    preferenceScore,
    preferenceMatched,
    preferenceTotal,
  };
};

const cessionInterneConstraintLabel = (constraint) => {
  const definition = cessionInterneConstraintDefinition(
    constraint?.type
  );
  if (!definition) return 'Contrainte';

  const value =
    definition.kind === 'enum'
      ? (Array.isArray(constraint.value)
          ? constraint.value
          : [constraint.value]
        )
          .filter(Boolean)
          .map((raw) => {
            const options =
              cessionInterneConstraintOptions[definition.key]?.() || [];
            return (
              options.find((option) => option.value === raw)?.label || raw
            );
          })
          .join(', ')
      : definition.kind === 'boolean'
      ? constraint.value === true || String(constraint.value) === 'true'
        ? 'Oui'
        : 'Non'
      : `${constraint.value ?? ''}${definition.unit ? ` ${definition.unit}` : ''}`;

  return `${definition.label} ${constraint.operator || ''} ${value}`.trim();
};

function CessionRetrait({ go, devise = 'XOF', onCessionStatusChange }) {
  const [requests, setRequests] = useState(() =>
    CLIENTS.reduce((map, client) => {
      const seed = CESSION_RETRAIT_SEED[client.id];
      map[client.id] = {
        selected: Boolean(seed?.selected),
        montant: seed?.montant || 0,
        date: seed?.date || '2026-09-15',
        urgence: seed?.urgence || 'Normale',
      };
      return map;
    }, {})
  );
  const [filtreClient, setFiltreClient] = useState('');
  const [filtreMarche, setFiltreMarche] = useState('Tous');
  const [strategie, setStrategie] = useState('Équilibrée');
  const [participationMax, setParticipationMax] = useState(
    CESSION_RETRAIT_DEFAULT_PARTICIPATION
  );
  const [optimisationVisible, setOptimisationVisible] = useState(true);
  const [clientOuvert, setClientOuvert] = useState('c7');
  const [editionPlans, setEditionPlans] = useState(false);
  const [managerEdits, setManagerEdits] = useState({});
  const [managerTitleEdits, setManagerTitleEdits] = useState({});
  const [contrepartieContraintes, setContrepartieContraintes] = useState([]);
  const [contrepartieBrouillon, setContrepartieBrouillon] = useState(() =>
    cessionInterneCreateConstraint(
      CESSION_INTERNE_CONSTRAINT_CATALOG[0].key
    )
  );
  const [contrepartieModeleMessage, setContrepartieModeleMessage] =
    useState('');

  const updateContrepartieContrainte = (constraintId, patch) => {
    setContrepartieContraintes((current) =>
      current.map((constraint) =>
        constraint.id === constraintId
          ? { ...constraint, ...patch }
          : constraint
      )
    );
  };

  const changerTypeContrepartieBrouillon = (nextType) => {
    const definition = cessionInterneConstraintDefinition(nextType);
    if (!definition) return;

    setContrepartieBrouillon((current) => ({
      ...current,
      type: nextType,
      operator: definition.defaultOperator,
      value: cessionInterneDefaultConstraintValue(definition),
      active: true,
    }));
  };

  const updateContrepartieBrouillon = (patch) => {
    setContrepartieBrouillon((current) => ({
      ...current,
      ...patch,
    }));
  };

  const ajouterContrepartieContrainte = () => {
    const definition = cessionInterneConstraintDefinition(
      contrepartieBrouillon.type
    );
    if (!definition) return;

    const contrainteAjoutee = {
      ...contrepartieBrouillon,
      id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      active: true,
    };

    setContrepartieContraintes((current) => [
      ...current,
      contrainteAjoutee,
    ]);

    setContrepartieBrouillon(
      cessionInterneCreateConstraint(definition.key)
    );
    setContrepartieModeleMessage(
      `Contrainte ajoutée : ${cessionInterneConstraintLabel(
        contrainteAjoutee
      )}`
    );
  };

  const supprimerContrepartieContrainte = (constraintId) => {
    setContrepartieContraintes((current) =>
      current.filter((constraint) => constraint.id !== constraintId)
    );
  };

  const sauvegarderModeleContrepartie = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      'opcvm-gsm-cession-interne-constraints',
      JSON.stringify(contrepartieContraintes)
    );
    setContrepartieModeleMessage(
      'Modèle de contraintes enregistré dans ce navigateur.'
    );
  };

  const chargerModeleContrepartie = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(
        'opcvm-gsm-cession-interne-constraints'
      );
      if (!raw) {
        setContrepartieModeleMessage(
          'Aucun modèle de contraintes enregistré.'
        );
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Format invalide');
      setContrepartieContraintes(parsed);
      setContrepartieModeleMessage('Modèle de contraintes chargé.');
    } catch (error) {
      setContrepartieModeleMessage(
        `Impossible de charger le modèle : ${error.message}`
      );
    }
  };

  const reinitialiserContraintesContrepartie = () => {
    setContrepartieContraintes([]);
    setContrepartieBrouillon(
      cessionInterneCreateConstraint(
        CESSION_INTERNE_CONSTRAINT_CATALOG[0].key
      )
    );
    setContrepartieModeleMessage(
      'Contraintes gérant réinitialisées. Les règles système restent actives.'
    );
  };

  const updateRequest = (clientId, patch) => {
    setRequests((current) => ({
      ...current,
      [clientId]: { ...current[clientId], ...patch },
    }));
  };

  const updatePlanQuantity = (clientId, order, value) => {
    const key = order.editKey || cessionManagerEditKey(order);
    const normalizedValue =
      value === ''
        ? ''
        : String(
            Math.max(
              0,
              Math.min(
                Number(order.maxQuantity ?? order.quantite ?? 0),
                Math.floor(Number(value) || 0)
              )
            )
          );
    setManagerEdits((current) => ({
      ...current,
      [clientId]: {
        ...(current[clientId] || {}),
        [key]: normalizedValue,
      },
    }));
  };

  const updatePlanTitle = (clientId, order, title) => {
    const key = order.editKey || cessionManagerEditKey(order);
    setManagerTitleEdits((current) => ({
      ...current,
      [clientId]: {
        ...(current[clientId] || {}),
        [key]: title,
      },
    }));
    setManagerEdits((current) => {
      const currentClient = { ...(current[clientId] || {}) };
      delete currentClient[key];
      return {
        ...current,
        [clientId]: currentClient,
      };
    });
  };

  const resetPlanEdits = (clientId) => {
    setManagerEdits((current) => {
      const next = { ...current };
      delete next[clientId];
      return next;
    });
    setManagerTitleEdits((current) => {
      const next = { ...current };
      delete next[clientId];
      return next;
    });
  };

  const resetAllPlanEdits = () => {
    setManagerEdits({});
    setManagerTitleEdits({});
  };

  const clientsFiltres = CLIENTS.filter((client) => {
    const matchNom = client.nom
      .toLowerCase()
      .includes(filtreClient.trim().toLowerCase());
    const matchMarche =
      filtreMarche === 'Tous' || client.marche === filtreMarche;
    return matchNom && matchMarche;
  });

  const selectedClients = CLIENTS.filter(
    (client) =>
      requests[client.id]?.selected &&
      Number(requests[client.id]?.montant || 0) > 0
  );
  const basePlans = selectedClients.map((client) =>
    cessionBuildPlan(
      client,
      requests[client.id],
      Math.max(1, Number(participationMax || 1)),
      strategie
    )
  );
  const plans = basePlans.map((plan) =>
    cessionApplyManagerEdits(
      plan,
      managerEdits[plan.client.id] || {},
      managerTitleEdits[plan.client.id] || {},
      Math.max(1, Number(participationMax || 1))
    )
  );

  const totalRetraitsRef = plans.reduce(
    (sum, plan) =>
      sum + convertCurrency(plan.withdrawal, plan.client.devise, devise),
    0
  );
  const totalCessionsRef = plans.reduce(
    (sum, plan) =>
      sum + convertCurrency(plan.grossSale, plan.client.devise, devise),
    0
  );
  const blockedPlans = plans.filter((plan) => plan.invalidWithdrawal);
  const warningPlans = plans.filter(
    (plan) =>
      !plan.invalidWithdrawal &&
      (!plan.amountCovered ||
        Number(plan.uncoveredMarket || 0) > 1 ||
        plan.marketStatus === 'Sous contrainte' ||
        plan.marketStatus === 'Non exécutable')
  );
  const totalOrders = plans.reduce((sum, plan) => sum + plan.orders.length, 0);
  const plansModifies = plans.filter((plan) => plan.managerEdited).length;

  // Un plan partiellement couvert n'empêche plus la recherche de contreparties
  // internes. Seules les règles métier du retrait peuvent bloquer le processus.
  const cessionInterneReady =
    plans.length > 0 && plans.every((plan) => !plan.invalidWithdrawal);

  const contrepartieContraintesActives = contrepartieContraintes.filter(
    (constraint) => constraint.active !== false
  );
  const contraintesObligatoires = contrepartieContraintesActives.filter(
    (constraint) => constraint.mode === 'Obligatoire'
  ).length;
  const contraintesPreferences = contrepartieContraintesActives.filter(
    (constraint) => constraint.mode === 'Préférence'
  ).length;
  const contraintesInformations = contrepartieContraintesActives.filter(
    (constraint) => constraint.mode === 'Information'
  ).length;
  const contraintesTitres = contrepartieContraintesActives.filter(
    (constraint) =>
      cessionInterneConstraintDefinition(constraint.type)?.category ===
      'Titres'
  ).length;

  const contrepartiePreviewMatches = plans.flatMap((plan) =>
    (plan.orders || []).map((order) =>
      cessionInterneMatchOrder(
        order,
        contrepartieContraintesActives
      )
    )
  );
  const contrepartieUniversInitial = contrepartiePreviewMatches.reduce(
    (sum, match) => sum + Number(match.systemUniverseCount || 0),
    0
  );
  const contrepartieCandidaturesEligibles =
    contrepartiePreviewMatches.reduce(
      (sum, match) => sum + Number(match.eligible?.length || 0),
      0
    );
  const contrepartieCandidaturesExclues =
    contrepartiePreviewMatches.reduce(
      (sum, match) => sum + Number(match.excluded?.length || 0),
      0
    );
  const contrepartieCapaciteRef = contrepartiePreviewMatches.reduce(
    (sum, match) =>
      sum +
      convertCurrency(
        Number(match.amountMatched || 0),
        match.order?.devise || devise,
        devise
      ),
    0
  );

  const ouvrirCession = () => {
    if (!cessionInterneReady) return;

    plans.forEach((plan) => {
      onCessionStatusChange?.(plan.client.id, {
        client: plan.client.nom,
        montant: plan.withdrawal,
        devise: plan.client.devise,
        statut: 'Processus lancé',
        dateDemande: CESSION_RETRAIT_REFERENCE_DATE,
        dateSouhaitee: plan.request?.date || CESSION_RETRAIT_REFERENCE_DATE,
      });
    });

    go('cession', {
      plans,
      strategie,
      participationMax,
      counterpartyConstraints: contrepartieContraintesActives,
      source: 'cession-retrait',
    });
  };

  return (
    <div className="gsm-native-cessionworkflow-032c178c8">
      <Breadcrumb items={['Accueil', 'Cession_Retrait']} />

      <div className="gsm-native-cessionworkflow-58efebb31">
        <div>
          <Eyebrow>Gestion sous mandat · besoins de liquidité clients</Eyebrow>
          <h2
            className="gsm-native-cessionworkflow-e4a5bf570"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Cession_Retrait — optimisation des actifs à céder
          </h2>
          <div className="gsm-native-cessionworkflow-49f6d8a31" style={{ color: C.sub }}>
            Sélectionnez les clients qui demandent un retrait. Le moteur estime
            la cession nécessaire après utilisation de la liquidité disponible,
            conserve la poche de liquidité cible du profil, puis privilégie les
            classes surpondérées et les titres suffisamment liquides au regard
            du marché simulé.
          </div>
        </div>
        <div className="gsm-native-cessionworkflow-0dee3c198">
          <Badge tone="gold">Simulation GSM</Badge>
          <Badge tone="slate">
            Tolérance allocation ±{CESSION_RETRAIT_TOLERANCE} pts
          </Badge>
        </div>
      </div>

      <div className="gsm-native-cessionworkflow-a0815ce18">
        {[
          {
            label: 'Clients sélectionnés',
            value: plans.length,
            detail: 'demandes actives',
            tone: 'navy',
          },
          {
            label: 'Retraits demandés',
            value: `${fmt(Math.round(totalRetraitsRef))} ${devise}`,
            detail: 'équivalent devise de référence',
            tone: 'gold',
          },
          {
            label: 'Cessions proposées',
            value: `${fmt(Math.round(totalCessionsRef))} ${devise}`,
            detail: `${totalOrders} ordre(s) simulé(s)`,
            tone: 'teal',
          },
          {
            label: 'Demandes bloquées',
            value: blockedPlans.length,
            detail:
              blockedPlans.length > 0
                ? '> 95% encours / solde minimum'
                : warningPlans.length > 0
                ? `${warningPlans.length} plan(s) à compléter · non bloquant`
                : 'aucun blocage métier',
            tone: blockedPlans.length > 0 ? 'coral' : 'teal',
          },
        ].map((item) => (
          <Card key={item.label} className="gsm-native-cessionworkflow-0bd674477">
            <div className="gsm-native-cessionworkflow-fb283143d">
              <div
                className="gsm-native-cessionworkflow-b9aa861d7"
                style={{ color: C.sub }}
              >
                {item.label}
              </div>
              <Badge tone={item.tone}>
                {item.tone === 'coral' ? '!' : '●'}
              </Badge>
            </div>
            <div
              className="gsm-native-cessionworkflow-724ef2845"
              style={{ ...F_MONO, color: C.ink }}
            >
              {item.value}
            </div>
            <div className="gsm-native-cessionworkflow-8884ed84b" style={{ color: C.sub }}>
              {item.detail}
            </div>
          </Card>
        ))}
      </div>

      <Card className="gsm-native-cessionworkflow-0bd674477" style={{ borderColor: C.navy }}>
        <div className="gsm-native-cessionworkflow-8e05ad84b">
          <div className="gsm-native-cessionworkflow-1a892c3a0">
            <div>
              <label
                className="gsm-native-cessionworkflow-83aac939b"
                style={{ color: C.sub }}
              >
                Rechercher un client
              </label>
              <div
                className="gsm-native-cessionworkflow-fd86948a3"
                style={{ borderColor: C.line, background: C.surfaceCard }}
              >
                <Search size={14} color={C.sub} />
                <input name="gsm-cessionworkflow-2980" aria-label="Nom du client"
                  value={filtreClient}
                  onChange={(e) => setFiltreClient(e.target.value)}
                  placeholder="Nom du client"
                  className="gsm-native-cessionworkflow-d6a8a9d09"
                  style={{ ...F_BODY, color: C.ink }}
                />
              </div>
            </div>
            <div>
              <label
                className="gsm-native-cessionworkflow-83aac939b"
                style={{ color: C.sub }}
              >
                Marché
              </label>
              <select name="gsm-cessionworkflow-2996" aria-label="Sélection cessionworkflow"
                value={filtreMarche}
                onChange={(e) => setFiltreMarche(e.target.value)}
                className="gsm-native-cessionworkflow-3eeeba943"
                style={{ borderColor: C.line, background: C.surfaceCard }}
              >
                {['Tous', 'BRVM', 'NGX', 'GSE'].map((marche) => (
                  <option key={marche}>{marche}</option>
                ))}
              </select>
            </div>
          </div>
          <Btn
            onClick={() => {
              resetAllPlanEdits();
              setEditionPlans(false);
              setOptimisationVisible(true);
            }}
          >
            Optimiser les cessions
          </Btn>
        </div>
      </Card>

      <Card className="gsm-native-cessionworkflow-352ac6b2c">
        <div className="gsm-native-cessionworkflow-738f2b379">
          <div>
            <Eyebrow>1 · Demandes de retrait</Eyebrow>
            <div className="gsm-native-cessionworkflow-c32c0a3da" style={{ color: C.ink }}>
              Clients, montants et échéances
            </div>
          </div>
          <Badge tone="gold">{plans.length} demande(s) active(s)</Badge>
        </div>
        <div
          className="gsm-native-cessionworkflow-8532cad97"
          style={{
            maxHeight: 420,
            overflowY: 'auto',
            overflowX: 'auto',
            overscrollBehavior: 'contain',
            scrollbarGutter: 'stable',
          }}
        >
          <table className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7" style={{ minWidth: 1400 }}>
            <thead
              style={{
                background: C.surfaceElevated,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: `0 1px 0 ${C.line}`,
              }}
            >
              <tr>
                <Th>✓</Th>
                <Th>Client</Th>
                <Th>Marché</Th>
                <Th>Profil</Th>
                <Th>Encours</Th>
                <Th>Liquidité actuelle</Th>
                <Th>Retrait demandé</Th>
                <Th>Date souhaitée</Th>
                <Th>Urgence</Th>
                <Th>Besoin estimé de cession</Th>
                <Th>Situation</Th>
              </tr>
            </thead>
            <tbody>
              {clientsFiltres.map((client, index) => {
                const request = requests[client.id];
                const plan =
                  request?.selected && Number(request?.montant || 0) > 0
                    ? cessionBuildPlan(
                        client,
                        request,
                        Math.max(1, Number(participationMax || 1)),
                        strategie
                      )
                    : null;
                const currentCash =
                  (client.encours * Number(client.alloc?.Liquidité || 0)) / 100;

                return (
                  <tr
                    key={client.id}
                    style={{
                      borderTop: `1px solid ${C.line}`,
                      background: index % 2 ? C.rowAlternate : C.surfaceCard,
                    }}
                  >
                    <Td>
                      <input name="gsm-cessionworkflow-3088" aria-label="Champ cessionworkflow"
                        type="checkbox"
                        checked={Boolean(request?.selected)}
                        onChange={(e) =>
                          updateRequest(client.id, {
                            selected: e.target.checked,
                          })
                        }
                        className="gsm-native-cessionworkflow-12185b882"
                      />
                    </Td>
                    <Td className="gsm-native-cessionworkflow-3265453a5">
                      {client.nom}
                    </Td>
                    <Td>
                      <Badge tone="navy">{client.marche}</Badge>
                    </Td>
                    <Td>
                      <Badge tone="slate">{client.profilRisque}</Badge>
                    </Td>
                    <Td mono className="gsm-native-cessionworkflow-adc6ac060">
                      {fmt(client.encours)} {client.devise}
                    </Td>
                    <Td mono className="gsm-native-cessionworkflow-adc6ac060">
                      {fmt(Math.round(currentCash))} {client.devise}
                    </Td>
                    <Td>
                      <input name="gsm-cessionworkflow-3115" aria-label="Champ cessionworkflow"
                        type="number"
                        min="0"
                        step="1000"
                        value={request?.montant || 0}
                        onChange={(e) =>
                          updateRequest(client.id, {
                            montant: Math.max(0, Number(e.target.value || 0)),
                            selected:
                              Number(e.target.value || 0) > 0 ||
                              request?.selected,
                          })
                        }
                        className="gsm-native-cessionworkflow-a54e686e7"
                        style={{ borderColor: C.line, ...F_MONO }}
                      />
                      <div className="gsm-native-cessionworkflow-e903b7557" style={{ color: C.sub }}>
                        {client.devise}
                      </div>
                    </Td>
                    <Td>
                      <input name="gsm-cessionworkflow-3136" aria-label="Champ cessionworkflow"
                        type="date"
                        value={request?.date || '2026-09-15'}
                        min={CESSION_RETRAIT_REFERENCE_DATE}
                        onChange={(e) =>
                          updateRequest(client.id, { date: e.target.value })
                        }
                        className="gsm-native-cessionworkflow-aab919964"
                        style={{ borderColor: C.line }}
                      />
                    </Td>
                    <Td>
                      <select name="gsm-cessionworkflow-3148" aria-label="Sélection cessionworkflow"
                        value={request?.urgence || 'Normale'}
                        onChange={(e) =>
                          updateRequest(client.id, { urgence: e.target.value })
                        }
                        className="gsm-native-cessionworkflow-aab919964"
                        style={{ borderColor: C.line }}
                      >
                        <option>Haute</option>
                        <option>Normale</option>
                        <option>Faible</option>
                      </select>
                    </Td>
                    <Td mono className="gsm-native-cessionworkflow-adc6ac060">
                      {plan
                        ? `${fmt(Math.round(plan.netSaleNeed))} ${
                            client.devise
                          }`
                        : '—'}
                    </Td>
                    <Td>
                      {plan ? (
                        <Badge
                          tone={
                            plan.invalidWithdrawal
                              ? 'coral'
                              : plan.amountCovered &&
                                plan.marketStatus === 'Compatible'
                              ? 'teal'
                              : 'gold'
                          }
                        >
                          {plan.invalidWithdrawal
                            ? 'Retrait bloqué'
                            : plan.amountCovered
                            ? plan.marketStatus
                            : 'Plan à compléter'}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Non sélectionné</Badge>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {optimisationVisible && plans.length > 0 && (
        <>
          <Card className="gsm-native-cessionworkflow-352ac6b2c">
            <div className="gsm-native-cessionworkflow-0bd674477">
              <Eyebrow>2 · Diagnostic de financement</Eyebrow>
              <div className="gsm-native-cessionworkflow-c32c0a3da" style={{ color: C.ink }}>
                Combien faut-il réellement céder ?
              </div>
              <div className="gsm-native-cessionworkflow-8884ed84b" style={{ color: C.sub }}>
                Besoin de cession = retrait + liquidité cible post-retrait −
                cash disponible avant cession.
              </div>
            </div>
            <div className="gsm-table-scroll">
              <table className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7" style={{ minWidth: 1300 }}>
                <thead style={{ background: C.surfaceElevated }}>
                  <tr>
                    <Th>Client</Th>
                    <Th>Cash actuel</Th>
                    <Th>Flux confirmés avant retrait</Th>
                    <Th>Retrait</Th>
                    <Th>Encours post-retrait</Th>
                    <Th>Cash cible à conserver</Th>
                    <Th>Cession nette nécessaire</Th>
                    <Th>Frais estimés</Th>
                    <Th>Cash final simulé</Th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr
                      key={plan.client.id}
                      style={{
                        borderTop: `1px solid ${C.line}`,
                        background: index % 2 ? C.rowAlternate : C.surfaceCard,
                      }}
                    >
                      <Td className="gsm-native-cessionworkflow-400f7fe55">{plan.client.nom}</Td>
                      <Td mono>
                        {fmt(Math.round(plan.currentCash))} {plan.client.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(plan.upcomingCash))}{' '}
                        {plan.client.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(plan.withdrawal))} {plan.client.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(plan.projectedValue))}{' '}
                        {plan.client.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(plan.targetCash))} {plan.client.devise}
                      </Td>
                      <Td mono className="gsm-native-cessionworkflow-400f7fe55">
                        {fmt(Math.round(plan.netSaleNeed))} {plan.client.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(plan.fees))} {plan.client.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(plan.cashAfterWithdrawal))}{' '}
                        {plan.client.devise}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="gsm-native-cessionworkflow-352ac6b2c" style={{ borderColor: C.gold }}>
            <div
              className="gsm-native-cessionworkflow-da28b39e1"
              style={{ background: C.warningBackground }}
            >
              <div>
                <Eyebrow>3 · Plans optimisés de cession</Eyebrow>
                <div className="gsm-native-cessionworkflow-08b367d0d" style={{ color: C.ink }}>
                  Propositions optimales regroupées par client
                </div>
                <div
                  className="gsm-native-cessionworkflow-0323ff63e"
                  style={{ color: C.sub }}
                >
                  Toutes les propositions sont regroupées dans ce cadrant.
                  Ouvrez un client pour examiner sa proposition. Le gérant peut
                  ajuster les titres et les quantités avant la vérification de
                  la cession interne ; les frais, la couverture du retrait,
                  l'impact marché et l'allocation post-cession sont recalculés
                  immédiatement.
                </div>
              </div>

              <div className="gsm-native-cessionworkflow-fbe161db0">
                <Badge tone="navy">{plans.length} client(s)</Badge>
                {plansModifies > 0 && (
                  <Badge tone="gold">
                    {plansModifies} proposition(s) modifiée(s)
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => setEditionPlans((value) => !value)}
                  className="gsm-native-cessionworkflow-f3cf9fef4"
                  style={{
                    background: editionPlans ? C.gold : C.surfaceCard,
                    color: editionPlans ? C.onAccent : C.textPrimary,
                    border: `1px solid ${editionPlans ? C.gold : C.line}`,
                    ...F_BODY,
                  }}
                >
                  {editionPlans
                    ? "Terminer l'édition"
                    : 'Modifier les propositions'}
                </button>
                {plansModifies > 0 && (
                  <button
                    type="button"
                    onClick={resetAllPlanEdits}
                    className="gsm-native-cessionworkflow-f3cf9fef4"
                    style={{
                      background: C.surfaceCard,
                      color: C.coral,
                      border: `1px solid ${C.line}`,
                      ...F_BODY,
                    }}
                  >
                    Réinitialiser tout
                  </button>
                )}
              </div>
            </div>

            <div>
              {plans.map((plan, planIndex) => {
                const open = clientOuvert === plan.client.id;
                const statusTone = plan.invalidWithdrawal
                  ? 'coral'
                  : plan.amountCovered &&
                    plan.marketStatus === 'Compatible' &&
                    plan.allocationCompliant
                  ? 'teal'
                  : 'gold';
                const proposalLines = plan.proposalLines || plan.orders || [];
                const clientEdits = managerEdits[plan.client.id] || {};

                return (
                  <section
                    key={plan.client.id}
                    style={{
                      borderTop:
                        planIndex === 0 ? 'none' : `1px solid ${C.line}`,
                      background: open ? C.surfaceCard : C.rowAlternate,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setClientOuvert(open ? '' : plan.client.id)
                      }
                      className="gsm-native-cessionworkflow-e6dcf9eeb"
                    >
                      <div className="gsm-native-cessionworkflow-58efebb31">
                        <div>
                          <div className="gsm-native-cessionworkflow-0dee3c198">
                            <div
                              className="gsm-native-cessionworkflow-08b367d0d"
                              style={{ color: C.ink }}
                            >
                              {plan.client.nom}
                            </div>
                            <Badge tone="navy">{plan.client.marche}</Badge>
                            <Badge tone={statusTone}>
                              {plan.invalidWithdrawal
                                ? 'Retrait bloqué'
                                : !plan.amountCovered
                                ? 'Plan à compléter · non bloquant'
                                : plan.allocationCompliant
                                ? 'Allocation conforme'
                                : 'Allocation à surveiller'}
                            </Badge>
                            {plan.managerEdited && (
                              <Badge tone="gold">Modifié par le gérant</Badge>
                            )}
                          </div>
                          <div
                            className="gsm-native-cessionworkflow-098aba719"
                            style={{ color: C.sub }}
                          >
                            Retrait {fmt(Math.round(plan.withdrawal))}{' '}
                            {plan.client.devise} · cession retenue{' '}
                            {fmt(Math.round(plan.grossSale))}{' '}
                            {plan.client.devise} · {plan.orders.length} ligne(s)
                            active(s) · score {plan.score}/100
                          </div>
                        </div>

                        <div className="gsm-native-cessionworkflow-fbe161db0">
                          <Badge tone={plan.amountCovered ? 'teal' : 'coral'}>
                            {plan.amountCovered
                              ? 'Retrait couvert'
                              : `Manque ${fmt(
                                  Math.round(plan.uncoveredMarket || 0)
                                )} ${plan.client.devise}`}
                          </Badge>
                          <Badge
                            tone={
                              plan.marketStatus === 'Compatible'
                                ? 'teal'
                                : plan.marketStatus === 'Non exécutable'
                                ? 'coral'
                                : 'gold'
                            }
                          >
                            Marché : {plan.marketStatus}
                          </Badge>
                          <Badge
                            tone={
                              plan.maxSessions <= 1
                                ? 'teal'
                                : plan.maxSessions <= 5
                                ? 'gold'
                                : 'coral'
                            }
                          >
                            {plan.maxSessions <= 1
                              ? '1 séance'
                              : `${plan.maxSessions} séances estimées`}
                          </Badge>
                          <ChevronRight
                            size={17}
                            color={C.sub}
                            style={{
                              transform: open ? 'rotate(90deg)' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div
                        className="gsm-native-cessionworkflow-63eab7d3c"
                        style={{ background: C.surfaceCard }}
                      >
                        <div className="gsm-native-cessionworkflow-049436d4a">
                          {[
                            {
                              label: 'Besoin brut système',
                              value: `${fmt(Math.round(plan.grossSaleNeed))} ${
                                plan.client.devise
                              }`,
                            },
                            {
                              label: 'Cession retenue',
                              value: `${fmt(Math.round(plan.grossSale))} ${
                                plan.client.devise
                              }`,
                            },
                            {
                              label: 'Produit net',
                              value: `${fmt(Math.round(plan.netSale))} ${
                                plan.client.devise
                              }`,
                            },
                            {
                              label: 'Frais estimés',
                              value: `${fmt(Math.round(plan.fees))} ${
                                plan.client.devise
                              }`,
                            },
                            {
                              label: 'Cash final simulé',
                              value: `${fmt(
                                Math.round(plan.cashAfterWithdrawal)
                              )} ${plan.client.devise}`,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="gsm-native-cessionworkflow-67f8c599d"
                              style={{
                                borderColor: C.line,
                                background: C.surfaceElevated,
                              }}
                            >
                              <div
                                className="gsm-native-cessionworkflow-14445f4f2"
                                style={{ color: C.sub }}
                              >
                                {item.label}
                              </div>
                              <div
                                className="gsm-native-cessionworkflow-acef4a802"
                                style={{ ...F_MONO, color: C.ink }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="gsm-native-cessionworkflow-a0815ce18">
                          {plan.deviations.map((item) => {
                            const compliant =
                              Math.abs(item.gap) <= CESSION_RETRAIT_TOLERANCE;
                            return (
                              <div
                                key={item.assetClass}
                                className="gsm-native-cessionworkflow-67f8c599d"
                                style={{
                                  borderColor: compliant
                                    ? C.positiveBorder
                                    : C.negativeBorder,
                                  background: compliant ? C.positiveBackground : C.negativeBackground,
                                }}
                              >
                                <div
                                  className="gsm-native-cessionworkflow-b9aa861d7"
                                  style={{ color: C.sub }}
                                >
                                  {item.assetClass}
                                </div>
                                <div className="gsm-native-cessionworkflow-321863690">
                                  <div>
                                    <div
                                      className="gsm-native-cessionworkflow-fd27cabb0"
                                      style={{ color: C.sub }}
                                    >
                                      Avant
                                    </div>
                                    <div
                                      className="gsm-native-cessionworkflow-395421f13"
                                      style={F_MONO}
                                    >
                                      {item.current.toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div
                                      className="gsm-native-cessionworkflow-fd27cabb0"
                                      style={{ color: C.sub }}
                                    >
                                      Après
                                    </div>
                                    <div
                                      className="gsm-native-cessionworkflow-395421f13"
                                      style={F_MONO}
                                    >
                                      {item.post.toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div
                                      className="gsm-native-cessionworkflow-fd27cabb0"
                                      style={{ color: C.sub }}
                                    >
                                      Cible
                                    </div>
                                    <div
                                      className="gsm-native-cessionworkflow-395421f13"
                                      style={F_MONO}
                                    >
                                      {item.target.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                                <div className="gsm-native-cessionworkflow-2f7b52d0a">
                                  <Badge tone={compliant ? 'teal' : 'coral'}>
                                    Écart {item.gap > 0 ? '+' : ''}
                                    {item.gap.toFixed(1)} pt
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div
                          className="gsm-native-cessionworkflow-e3e4486ba"
                          style={{
                            background: editionPlans ? C.warningBackground : C.surfaceElevated,
                            border: `1px solid ${
                              editionPlans ? C.warningBorder : C.line
                            }`,
                          }}
                        >
                          <div>
                            <div
                              className="gsm-native-cessionworkflow-8b5131be0"
                              style={{ color: C.ink }}
                            >
                              Proposition optimale de cession ·{' '}
                              {plan.client.nom}
                            </div>
                            <div
                              className="gsm-native-cessionworkflow-8884ed84b"
                              style={{ color: C.sub }}
                            >
                              {editionPlans
                                ? 'Mode édition actif : changez le titre proposé lorsque des alternatives existent, ajustez les quantités, ou saisissez 0 pour exclure une ligne du plan transmis à la Cession.'
                                : 'Activez « Modifier les propositions » pour ajuster le plan avant la Cession.'}
                            </div>
                          </div>
                          {plan.managerEdited && (
                            <button
                              type="button"
                              onClick={() => resetPlanEdits(plan.client.id)}
                              className="gsm-native-cessionworkflow-16369084b"
                              style={{
                                background: C.surfaceCard,
                                color: C.coral,
                                border: `1px solid ${C.line}`,
                              }}
                            >
                              Rétablir la proposition système
                            </button>
                          )}
                        </div>

                        {proposalLines.length > 0 && (
                          <div className="gsm-table-scroll">
                            <table
                              className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7"
                              style={{ minWidth: editionPlans ? 1580 : 1450 }}
                            >
                              <thead style={{ background: C.surfaceElevated }}>
                                <tr>
                                  <Th>Priorité</Th>
                                  <Th>Titre</Th>
                                  <Th>Classe</Th>
                                  <Th>
                                    {editionPlans
                                      ? 'Qté à vendre · modifiable'
                                      : 'Qté à vendre'}
                                  </Th>
                                  {editionPlans && <Th>Qté système / max</Th>}
                                  <Th>Cours</Th>
                                  <Th>Produit brut</Th>
                                  <Th>Produit net</Th>
                                  <Th>Volume jour</Th>
                                  <Th>% volume</Th>
                                  <Th>Séances</Th>
                                  <Th>Impact</Th>
                                  <Th>Motif</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {proposalLines.map((order, index) => {
                                  const rawEdit = clientEdits[order.editKey];
                                  const displayQuantity =
                                    rawEdit !== undefined
                                      ? rawEdit
                                      : order.quantite;
                                  const inactive = order.quantite <= 0;

                                  return (
                                    <tr
                                      key={`${plan.client.id}-${order.titre}-${index}`}
                                      style={{
                                        borderTop: `1px solid ${C.line}`,
                                        background: inactive
                                          ? C.surfaceInset
                                          : order.managerEdited
                                          ? C.warningBackground
                                          : index % 2
                                          ? C.rowAlternate
                                          : C.surfaceCard,
                                        opacity: inactive ? 0.62 : 1,
                                      }}
                                    >
                                      <Td mono>{index + 1}</Td>
                                      <Td className="gsm-native-cessionworkflow-3265453a5">
                                        {editionPlans &&
                                        (order.availableTitles || []).length >
                                          1 ? (
                                          <div className="gsm-native-cessionworkflow-9109fff88">
                                            <select name="gsm-cessionworkflow-3677" aria-label="Sélection cessionworkflow"
                                              value={order.titre}
                                              onChange={(event) =>
                                                updatePlanTitle(
                                                  plan.client.id,
                                                  order,
                                                  event.target.value
                                                )
                                              }
                                              className="gsm-native-cessionworkflow-6af648ca2"
                                              style={{
                                                borderColor:
                                                  order.titre !==
                                                  order.titreSysteme
                                                    ? C.gold
                                                    : C.line,
                                                background: C.surfaceCard,
                                                color: C.ink,
                                              }}
                                            >
                                              {(
                                                order.availableTitles || []
                                              ).map((titre) => (
                                                <option
                                                  key={titre}
                                                  value={titre}
                                                >
                                                  {titre}
                                                </option>
                                              ))}
                                            </select>
                                            <div
                                              className="gsm-native-cessionworkflow-e903b7557"
                                              style={{ color: C.sub }}
                                            >
                                              Système : {order.titreSysteme}
                                            </div>
                                          </div>
                                        ) : (
                                          order.titre
                                        )}
                                        {order.managerEdited && (
                                          <div
                                            className="gsm-native-cessionworkflow-e903b7557"
                                            style={{ color: C.warningText }}
                                          >
                                            Ajusté par le gérant
                                          </div>
                                        )}
                                      </Td>
                                      <Td>
                                        <Badge tone="slate">
                                          {order.assetClass}
                                        </Badge>
                                      </Td>
                                      <Td mono>
                                        {editionPlans ? (
                                          <div className="gsm-native-cessionworkflow-d6dbbb470">
                                            <input name="gsm-cessionworkflow-3735" aria-label="Champ cessionworkflow"
                                              type="number"
                                              min="0"
                                              max={order.maxQuantity}
                                              step="1"
                                              value={displayQuantity}
                                              onChange={(event) =>
                                                updatePlanQuantity(
                                                  plan.client.id,
                                                  order,
                                                  event.target.value
                                                )
                                              }
                                              className="gsm-native-cessionworkflow-75f20695c"
                                              style={{
                                                borderColor: order.managerEdited
                                                  ? C.gold
                                                  : C.line,
                                                background: C.surfaceCard,
                                                color: C.ink,
                                                ...F_MONO,
                                              }}
                                            />
                                            <div
                                              className="gsm-native-cessionworkflow-e903b7557"
                                              style={{ color: C.sub }}
                                            >
                                              0 = exclure la ligne
                                            </div>
                                          </div>
                                        ) : (
                                          fmt(order.quantite)
                                        )}
                                      </Td>
                                      {editionPlans && (
                                        <Td mono className="gsm-native-cessionworkflow-adc6ac060">
                                          {fmt(order.quantiteSysteme)} /{' '}
                                          {fmt(order.maxQuantity)}
                                        </Td>
                                      )}
                                      <Td mono>
                                        {fmtPrice(order.prix)} {order.devise}
                                      </Td>
                                      <Td mono>
                                        {fmt(Math.round(order.montantBrut))}{' '}
                                        {order.devise}
                                      </Td>
                                      <Td mono>
                                        {fmt(Math.round(order.montantNet))}{' '}
                                        {order.devise}
                                      </Td>
                                      <Td mono>{fmt(order.volumeJour)}</Td>
                                      <Td mono>
                                        {order.quantite <= 0
                                          ? '—'
                                          : Number.isFinite(
                                              order.participationPct
                                            )
                                          ? `${order.participationPct.toFixed(
                                              1
                                            )}%`
                                          : 'N/D'}
                                      </Td>
                                      <Td mono>
                                        {order.quantite <= 0
                                          ? '—'
                                          : order.sessions}
                                      </Td>
                                      <Td>
                                        <Badge
                                          tone={
                                            order.impact === 'Faible'
                                              ? 'teal'
                                              : order.impact === 'Moyen'
                                              ? 'gold'
                                              : order.impact === 'Aucun'
                                              ? 'slate'
                                              : 'coral'
                                          }
                                        >
                                          {order.impact}
                                        </Badge>
                                      </Td>
                                      <Td>
                                        <div
                                          className="gsm-native-cessionworkflow-bec339797"
                                          style={{ color: C.sub }}
                                        >
                                          {inactive
                                            ? 'Ligne exclue manuellement de la proposition.'
                                            : order.motif}
                                        </div>
                                      </Td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {plan.invalidWithdrawal && (
                          <div
                            className="gsm-native-cessionworkflow-babea5a92"
                            style={{
                              background: C.negativeBackground,
                              color: C.coral,
                            }}
                          >
                            <b>Retrait non autorisé :</b>{' '}
                            {plan.exceeds95Percent
                              ? `la demande dépasse 95 % de l'encours. Le maximum autorisé est ${fmt(
                                  Math.round(plan.maxWithdrawalAllowed || 0)
                                )} ${plan.client.devise}.`
                              : plan.belowMinimumAccountBalance
                              ? `le retrait laisserait ${fmt(
                                  Math.round(
                                    plan.remainingAfterRequestedWithdrawal || 0
                                  )
                                )} ${
                                  plan.client.devise
                                }, soit moins que le minimum de maintien du compte (${fmt(
                                  Math.round(plan.minimumAccountBalance || 0)
                                )} ${plan.client.devise}).`
                              : 'la demande de retrait est invalide.'}
                          </div>
                        )}

                        {!plan.invalidWithdrawal && !plan.amountCovered && (
                          <div
                            className="gsm-native-cessionworkflow-babea5a92"
                            style={{
                              background: C.warningBackground,
                              color: C.warningText,
                            }}
                          >
                            <b>Plan modifié insuffisant · non bloquant :</b> la
                            proposition actuelle ne couvre pas encore
                            intégralement le retrait tout en maintenant la
                            liquidité cible. Il manque environ{' '}
                            {fmt(Math.round(plan.uncoveredMarket || 0))}{' '}
                            {plan.client.devise}. Le gestionnaire peut néanmoins
                            poursuivre vers la Cession ; ce reliquat
                            restera identifié comme montant à traiter sur le
                            marché ou à compléter dans la suite du processus.
                          </div>
                        )}

                        {plan.amountCovered && !plan.allocationCompliant && (
                          <div
                            className="gsm-native-cessionworkflow-babea5a92"
                            style={{
                              background: C.warningBackground,
                              color: C.warningText,
                            }}
                          >
                            <b>Allocation à surveiller :</b> le besoin de
                            liquidité est couvert, mais le plan modifié place au
                            moins une classe au-delà de la tolérance de ±
                            {CESSION_RETRAIT_TOLERANCE} points par rapport au
                            profil cible. Le gérant peut encore ajuster les
                            quantités avant la vérification interne.
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </Card>

          <Card className="gsm-native-cessionworkflow-a44b9b0f9" style={{ borderColor: C.gold }}>
            <div className="gsm-native-cessionworkflow-ede668ece">
              <div>
                <Eyebrow>4 · Validation gérant</Eyebrow>
                <div className="gsm-native-cessionworkflow-08b367d0d" style={{ color: C.ink }}>
                  Contraintes d’éligibilité des contreparties
                </div>
                <div
                  className="gsm-native-cessionworkflow-49f6d8a31"
                  style={{ color: C.sub }}
                >
                  Le gérant peut définir les clients qui pourront devenir
                  contreparties des obligations non cotées et ajouter des contraintes sur les titres
                  concernés par la cession. Les règles système restent toujours
                  actives ; les contraintes « Obligatoire » éliminent un
                  candidat ou une ligne incompatible, les « Préférence » servent
                  au classement et les « Information » sont documentaires.
                </div>
                {!cessionInterneReady && (
                  <div
                    className="gsm-native-cessionworkflow-da5b9eae9"
                    style={{ color: C.coral }}
                  >
                    Cession indisponible : au moins une demande de
                    retrait dépasse 95 % de l'encours ou laisse un solde
                    inférieur au minimum de maintien/clôture configuré.
                  </div>
                )}
                {cessionInterneReady && warningPlans.length > 0 && (
                  <div
                    className="gsm-native-cessionworkflow-da5b9eae9"
                    style={{ color: C.warningText }}
                  >
                    {warningPlans.length} plan(s) restent partiellement
                    couverts, mais cela n'empêche plus la recherche de
                    contreparties internes.
                  </div>
                )}
              </div>

              <div className="gsm-native-cessionworkflow-0dee3c198">
                {plansModifies > 0 && (
                  <Badge tone="gold">
                    {plansModifies} plan(s) ajusté(s)
                  </Badge>
                )}
                <Badge tone="navy">
                  {contrepartieContraintesActives.length} contrainte(s) gérant
                </Badge>
                <Btn
                  tone="ghost"
                  onClick={() => setOptimisationVisible(false)}
                >
                  Masquer la simulation
                </Btn>
              </div>
            </div>

            <div
              className="gsm-native-cessionworkflow-343a50aa8"
              style={{ borderColor: C.line, background: C.surfaceElevated }}
            >
              <div className="gsm-native-cessionworkflow-dab71a530">
                <div>
                  <div
                    className="gsm-native-cessionworkflow-7ed15857d"
                    style={{ color: C.sub }}
                  >
                    Règles système non modifiables
                  </div>
                  <div className="gsm-native-cessionworkflow-d3dc6f7dc" style={{ color: C.ink }}>
                    Elles protègent le workflow même si aucune contrainte gérant
                    n'est ajoutée.
                  </div>
                </div>
                <Badge tone="teal">Toujours actives</Badge>
              </div>

              <div className="gsm-native-cessionworkflow-f7b565058">
                {[
                  'Acheteur différent du vendeur',
                  'Cession interne : obligations non cotées uniquement',
                  'Actions et obligations cotées : marché coté uniquement',
                  'Même marché de référence que la ligne cédée',
                  'Même devise de référence que le titre',
                  "Capacité d'achat positive",
                  `Profil conforme après achat · tolérance ±${CESSION_RETRAIT_TOLERANCE} pts`,
                ].map((rule) => (
                  <span
                    key={rule}
                    className="gsm-native-cessionworkflow-63b1a3658"
                    style={{
                      background: C.positiveBackground,
                      color: C.teal,
                      border: `1px solid ${C.positiveBorder}`,
                    }}
                  >
                    ✓ {rule}
                  </span>
                ))}
              </div>
            </div>

            <div className="gsm-native-cessionworkflow-e3926c999">
              <div className="gsm-native-cessionworkflow-dab71a530">
                <div>
                  <div
                    className="gsm-native-cessionworkflow-8b5131be0"
                    style={{ color: C.ink }}
                  >
                    Contraintes choisies par le gérant
                  </div>
                  <div className="gsm-native-cessionworkflow-ecde80810" style={{ color: C.sub }}>
                    Configurez une contrainte à la fois dans la ligne de
                    sélection, puis ajoutez-la au tableau. Les listes de titres,
                    secteurs, émetteurs, pays, marchés, profils, gestionnaires
                    et clients sont construites à partir des données disponibles.
                  </div>
                </div>
                <div className="gsm-native-cessionworkflow-0dee3c198">
                  <Btn
                    tone="ghost"
                    onClick={chargerModeleContrepartie}
                  >
                    Charger modèle
                  </Btn>
                  <Btn
                    tone="ghost"
                    onClick={sauvegarderModeleContrepartie}
                  >
                    Enregistrer modèle
                  </Btn>
                  <Btn
                    tone="ghost"
                    onClick={reinitialiserContraintesContrepartie}
                  >
                    Réinitialiser
                  </Btn>
                </div>
              </div>

              {contrepartieModeleMessage && (
                <div
                  className="gsm-native-cessionworkflow-d38d63c46"
                  style={{ color: C.sub }}
                >
                  {contrepartieModeleMessage}
                </div>
              )}

              {(() => {
                const definition =
                  cessionInterneConstraintDefinition(
                    contrepartieBrouillon.type
                  );
                const options =
                  definition?.kind === 'enum'
                    ? cessionInterneConstraintOptions[
                        definition.key
                      ]?.() || []
                    : [];
                const selectedValues = Array.isArray(
                  contrepartieBrouillon.value
                )
                  ? contrepartieBrouillon.value
                  : [contrepartieBrouillon.value].filter(Boolean);

                return (
                  <div
                    className="gsm-native-cessionworkflow-866238205"
                    style={{
                      borderColor: C.line,
                      background: C.surfaceCard,
                    }}
                  >
                    <div
                      className="gsm-native-cessionworkflow-37cf02314"
                      style={{
                        background: C.surfaceElevated,
                        borderBottom: `1px solid ${C.borderSubtle}`,
                      }}
                    >
                      <div>
                        <div
                          className="gsm-native-cessionworkflow-b5856fcca"
                          style={{ color: C.gold }}
                        >
                          Nouvelle contrainte
                        </div>
                        <div
                          className="gsm-native-cessionworkflow-ecde80810"
                          style={{ color: C.sub }}
                        >
                          Définissez la règle, son niveau et sa valeur. L’aperçu
                          se met à jour avant l’ajout au tableau.
                        </div>
                      </div>

                      <Badge
                        tone={
                          definition?.category === 'Titres'
                            ? 'gold'
                            : 'slate'
                        }
                      >
                        {definition?.category || 'Autre'}
                      </Badge>
                    </div>

                    <div className="gsm-native-cessionworkflow-0bd674477">
                      <div className="gsm-native-cessionworkflow-73b656527">
                      <div className="gsm-native-cessionworkflow-0fba26649">
                        <label
                          className="gsm-native-cessionworkflow-b0cd53b2b"
                          style={{ color: C.sub }}
                        >
                          Type de contrainte
                        </label>
                        <select name="gsm-cessionworkflow-4119" aria-label="Sélection cessionworkflow"
                          value={contrepartieBrouillon.type}
                          onChange={(event) =>
                            changerTypeContrepartieBrouillon(
                              event.target.value
                            )
                          }
                          className="gsm-native-cessionworkflow-861d74dba"
                          style={{
                            borderColor: C.line,
                            background: C.surfaceCard,
                          }}
                        >
                          {CESSION_INTERNE_CONSTRAINT_CATALOG.map(
                            (item) => (
                              <option
                                key={item.key}
                                value={item.key}
                              >
                                {item.category} · {item.label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="gsm-native-cessionworkflow-7a882a42f">
                        <label
                          className="gsm-native-cessionworkflow-b0cd53b2b"
                          style={{ color: C.sub }}
                        >
                          Niveau
                        </label>
                        <select name="gsm-cessionworkflow-4152" aria-label="Sélection cessionworkflow"
                          value={contrepartieBrouillon.mode}
                          onChange={(event) =>
                            updateContrepartieBrouillon({
                              mode: event.target.value,
                            })
                          }
                          className="gsm-native-cessionworkflow-861d74dba"
                          style={{
                            borderColor: C.line,
                            background: C.surfaceCard,
                          }}
                        >
                          {CESSION_INTERNE_CONSTRAINT_MODES.map(
                            (mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="gsm-native-cessionworkflow-7a882a42f">
                        <label
                          className="gsm-native-cessionworkflow-b0cd53b2b"
                          style={{ color: C.sub }}
                        >
                          Opérateur
                        </label>
                        <select name="gsm-cessionworkflow-4182" aria-label="Sélection cessionworkflow"
                          value={contrepartieBrouillon.operator}
                          onChange={(event) =>
                            updateContrepartieBrouillon({
                              operator: event.target.value,
                            })
                          }
                          className="gsm-native-cessionworkflow-861d74dba"
                          style={{
                            borderColor: C.line,
                            background: C.surfaceCard,
                          }}
                        >
                          {(definition?.operators || ['=']).map(
                            (operator) => (
                              <option
                                key={operator}
                                value={operator}
                              >
                                {operator}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="gsm-native-cessionworkflow-e0cacc173">
                        <label
                          className="gsm-native-cessionworkflow-b0cd53b2b"
                          style={{ color: C.sub }}
                        >
                          Valeur / sélection
                        </label>

                        {definition?.kind === 'enum' &&
                          definition.multiple && (
                            <div
                              className="gsm-native-cessionworkflow-9016fe7d8"
                              style={{
                                borderColor: C.line,
                                background: C.surfaceInset,
                                minHeight: 40,
                                maxHeight: 88,
                              }}
                              role="group"
                              aria-label="Valeurs sélectionnées"
                            >
                              {options.map((option) => {
                                const selected = selectedValues.includes(
                                  option.value
                                );

                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() =>
                                      updateContrepartieBrouillon({
                                        value: selected
                                          ? selectedValues.filter(
                                              (value) => value !== option.value
                                            )
                                          : [...selectedValues, option.value],
                                      })
                                    }
                                    className="gsm-native-cessionworkflow-0a8dab7b3"
                                    style={{
                                      background: selected
                                        ? C.activeBackground
                                        : C.surfaceCard,
                                      color: selected ? C.textPrimary : C.sub,
                                      border: `1px solid ${
                                        selected ? C.infoBorder : C.borderSubtle
                                      }`,
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                        {definition?.kind === 'enum' &&
                          !definition.multiple && (
                            <select name="gsm-cessionworkflow-4249" aria-label="Sélection cessionworkflow"
                              value={contrepartieBrouillon.value || ''}
                              onChange={(event) =>
                                updateContrepartieBrouillon({
                                  value: event.target.value,
                                })
                              }
                              className="gsm-native-cessionworkflow-861d74dba"
                              style={{
                                borderColor: C.line,
                                background: C.surfaceCard,
                              }}
                            >
                              {options.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}

                        {definition?.kind === 'boolean' && (
                          <select name="gsm-cessionworkflow-4274" aria-label="Sélection cessionworkflow"
                            value={
                              contrepartieBrouillon.value === true ||
                              String(
                                contrepartieBrouillon.value
                              ) === 'true'
                                ? 'true'
                                : 'false'
                            }
                            onChange={(event) =>
                              updateContrepartieBrouillon({
                                value:
                                  event.target.value === 'true',
                              })
                            }
                            className="gsm-native-cessionworkflow-861d74dba"
                            style={{
                              borderColor: C.line,
                              background: C.surfaceCard,
                            }}
                          >
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        )}

                        {definition?.kind === 'number' && (
                          <div className="gsm-native-cessionworkflow-0986fa0a0">
                            <input name="gsm-cessionworkflow-4302" aria-label="Champ cessionworkflow"
                              type="number"
                              value={
                                contrepartieBrouillon.value ?? ''
                              }
                              onChange={(event) =>
                                updateContrepartieBrouillon({
                                  value: event.target.value,
                                })
                              }
                              className="gsm-native-cessionworkflow-861d74dba"
                              style={{
                                borderColor: C.line,
                                background: C.surfaceCard,
                                ...F_MONO,
                              }}
                            />
                            {definition.unit && (
                              <span
                                className="gsm-native-cessionworkflow-09e195394"
                                style={{ color: C.sub }}
                              >
                                {definition.unit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                    <div
                      className="gsm-native-cessionworkflow-b3292820f"
                      style={{
                        borderTop: `1px solid ${C.borderSubtle}`,
                      }}
                    >
                      <div className="gsm-native-cessionworkflow-5827c5ff7">
                        <span
                          className="gsm-native-cessionworkflow-42aab0a65"
                          style={{ color: C.textTertiary }}
                        >
                          Aperçu
                        </span>
                        <span className="gsm-native-cessionworkflow-defa190c8" style={{ color: C.ink }}>
                          {cessionInterneConstraintLabel(
                            contrepartieBrouillon
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={ajouterContrepartieContrainte}
                        className="gsm-native-cessionworkflow-1675268ed"
                        style={{
                          background: C.activeBackground,
                          color: C.textPrimary,
                          border: `1px solid ${C.infoBorder}`,
                          minHeight: 40,
                          minWidth: 132,
                          ...F_BODY,
                        }}
                        title="Ajouter cette contrainte au tableau"
                      >
                        + Ajouter
                      </button>
                    </div>
                    </div>
                  </div>
                );
              })()}

              <div
                className="gsm-native-cessionworkflow-866238205"
                style={{
                  borderColor: C.line,
                  background: C.surfaceCard,
                }}
              >
                <div
                  className="gsm-native-cessionworkflow-905611232"
                  style={{
                    background: C.surfaceElevated,
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <div>
                    <div
                      className="gsm-native-cessionworkflow-7ed15857d"
                      style={{ color: C.sub }}
                    >
                      Contraintes ajoutées
                    </div>
                    <div
                      className="gsm-native-cessionworkflow-19693e371"
                      style={{ color: C.sub }}
                    >
                      Le tableau est en lecture seule. Utilisez la ligne de
                      sélection ci-dessus pour ajouter une nouvelle contrainte.
                    </div>
                  </div>

                  <div className="gsm-native-cessionworkflow-0dee3c198">
                    <Badge tone="navy">
                      {contrepartieContraintes.length} ligne(s)
                    </Badge>
                    <Badge tone="gold">
                      {contraintesTitres} sur titre(s)
                    </Badge>
                    <span
                      className="gsm-native-cessionworkflow-fd27cabb0"
                      style={{ color: C.sub }}
                    >
                      Scroll vertical au-delà de la hauteur maximale.
                    </span>
                  </div>
                </div>

                {contrepartieContraintes.length === 0 ? (
                  <div
                    className="gsm-native-cessionworkflow-6c5e85c3a"
                    style={{ color: C.sub }}
                  >
                    Aucune contrainte ajoutée pour le moment.
                  </div>
                ) : (
                  <div
                    className="gsm-native-cessionworkflow-8532cad97"
                    style={{
                      maxHeight: 360,
                      scrollbarGutter: 'stable',
                    }}
                  >
                    <table
                      className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7"
                      style={{
                        minWidth: 1160,
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                      }}
                    >
                      <thead
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 5,
                          background: C.surfaceElevated,
                        }}
                      >
                        <tr>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, width: 45 }}
                          >
                            #
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, width: 80 }}
                          >
                            Actif
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, width: 115 }}
                          >
                            Famille
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, minWidth: 260 }}
                          >
                            Contrainte
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, width: 140 }}
                          >
                            Niveau
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, width: 120 }}
                          >
                            Opérateur
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-c5ade7625"
                            style={{ color: C.sub, minWidth: 330 }}
                          >
                            Valeur / résumé
                          </th>
                          <th
                            className="gsm-native-cessionworkflow-5d78b29a3"
                            style={{ color: C.sub, width: 80 }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {contrepartieContraintes.map(
                          (constraint, index) => {
                            const definition =
                              cessionInterneConstraintDefinition(
                                constraint.type
                              );

                            return (
                              <tr
                                key={constraint.id}
                                style={{
                                  background:
                                    constraint.active === false
                                      ? C.surfaceElevated
                                      : definition?.category ===
                                        'Titres'
                                      ? C.warningBackground
                                      : index % 2
                                      ? C.rowAlternate
                                      : C.surfaceCard,
                                }}
                              >
                                <td
                                  className="gsm-native-cessionworkflow-092565693"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                    color: C.sub,
                                    ...F_MONO,
                                  }}
                                >
                                  {index + 1}
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-eeda9d7d2"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateContrepartieContrainte(
                                        constraint.id,
                                        {
                                          active:
                                            constraint.active ===
                                            false,
                                        }
                                      )
                                    }
                                    className="gsm-native-cessionworkflow-25cf3cbf0"
                                    style={{
                                      background:
                                        constraint.active === false
                                          ? C.surfaceInset
                                          : C.positiveBackground,
                                      color:
                                        constraint.active === false
                                          ? C.sub
                                          : C.teal,
                                    }}
                                    title={
                                      constraint.active === false
                                        ? 'Réactiver cette contrainte'
                                        : 'Désactiver cette contrainte'
                                    }
                                  >
                                    {constraint.active === false
                                      ? 'Non'
                                      : 'Oui'}
                                  </button>
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-eeda9d7d2"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                  }}
                                >
                                  <Badge
                                    tone={
                                      definition?.category ===
                                      'Titres'
                                        ? 'gold'
                                        : 'slate'
                                    }
                                  >
                                    {definition?.category || 'Autre'}
                                  </Badge>
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-936f00696"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                    color: C.ink,
                                  }}
                                >
                                  {definition?.label ||
                                    constraint.type}
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-eeda9d7d2"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                  }}
                                >
                                  <Badge
                                    tone={
                                      constraint.mode ===
                                      'Obligatoire'
                                        ? 'navy'
                                        : constraint.mode ===
                                          'Préférence'
                                        ? 'gold'
                                        : 'slate'
                                    }
                                  >
                                    {constraint.mode}
                                  </Badge>
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-d4335f95f"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                    color: C.ink,
                                  }}
                                >
                                  {constraint.operator}
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-d4335f95f"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                    color: C.ink,
                                  }}
                                >
                                  {cessionInterneConstraintLabel(
                                    constraint
                                  )}
                                </td>

                                <td
                                  className="gsm-native-cessionworkflow-a260904f1"
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      supprimerContrepartieContrainte(
                                        constraint.id
                                      )
                                    }
                                    className="gsm-native-cessionworkflow-898a83003"
                                    style={{
                                      borderColor: C.negativeBorder,
                                      color: C.coral,
                                      background: C.surfaceCard,
                                    }}
                                    title="Supprimer la contrainte"
                                  >
                                    <X size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div
              className="gsm-native-cessionworkflow-343a50aa8"
              style={{
                borderColor: C.line,
                background: C.surfaceElevated,
              }}
            >
              <div className="gsm-native-cessionworkflow-dab71a530">
                <div>
                  <div
                    className="gsm-native-cessionworkflow-7ed15857d"
                    style={{ color: C.sub }}
                  >
                    Synthèse avant lancement
                  </div>
                  <div className="gsm-native-cessionworkflow-d3dc6f7dc" style={{ color: C.ink }}>
                    Impact des contraintes sur l'univers de contreparties des
                    lignes de cession actuellement retenues.
                  </div>
                </div>
                <div className="gsm-native-cessionworkflow-0dee3c198">
                  <Badge tone="navy">
                    {contraintesObligatoires} obligatoire(s)
                  </Badge>
                  <Badge tone="gold">
                    {contraintesPreferences} préférence(s)
                  </Badge>
                  <Badge tone="slate">
                    {contraintesInformations} information(s)
                  </Badge>
                  <Badge tone="gold">
                    {contraintesTitres} sur titre(s)
                  </Badge>
                </div>
              </div>

              <div className="gsm-native-cessionworkflow-173c8fb01">
                {[
                  {
                    label: 'Univers système',
                    value: contrepartieUniversInitial,
                    detail: 'candidatures ligne/client après règles fixes',
                  },
                  {
                    label: 'Éligibles',
                    value: contrepartieCandidaturesEligibles,
                    detail: 'après contraintes obligatoires',
                  },
                  {
                    label: 'Exclus',
                    value: contrepartieCandidaturesExclues,
                    detail: 'profil, capacité ou contraintes gérant',
                  },
                  {
                    label: 'Couverture interne estimée',
                    value: `${fmt(
                      Math.round(contrepartieCapaciteRef)
                    )} ${devise}`,
                    detail: 'après plafonds et priorités',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="gsm-native-cessionworkflow-b7a564aa8"
                    style={{
                      borderColor: C.line,
                      background: C.surfaceCard,
                    }}
                  >
                    <div
                      className="gsm-native-cessionworkflow-14445f4f2"
                      style={{ color: C.sub }}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="gsm-native-cessionworkflow-acbe28a76"
                      style={{ color: C.ink, ...F_MONO }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="gsm-native-cessionworkflow-e903b7557"
                      style={{ color: C.sub }}
                    >
                      {stat.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gsm-native-cessionworkflow-ca51cab6e">
              <div className="gsm-native-cessionworkflow-08fd92a10" style={{ color: C.sub }}>
                Les contraintes sont transmises avec les plans retenus à la page
                de Cession interne et sont recalculées pour chaque ligne.
              </div>

              <button
                type="button"
                disabled={!cessionInterneReady}
                onClick={ouvrirCession}
                className="gsm-native-cessionworkflow-4fcbb4afe"
                style={{
                  background: cessionInterneReady ? C.activeBackground : C.surfaceInset,
                  color: cessionInterneReady ? C.textPrimary : C.textMuted,
                  border: 'none',
                  cursor: cessionInterneReady ? 'pointer' : 'not-allowed',
                  ...F_BODY,
                }}
                title={
                  cessionInterneReady
                    ? 'Lancer la recherche avec les contraintes sélectionnées'
                    : 'Le retrait dépasse la limite de 95 % ou le solde minimum du compte'
                }
              >
                Cession →
              </button>
            </div>
          </Card>
        </>
      )}

      <div
        className="gsm-native-cessionworkflow-7f250ee3d"
        style={{ background: C.warningBackground, color: C.sub, ...F_BODY }}
      >
        <b style={{ color: C.ink }}>Important :</b> cette première version est
        une simulation intégrée à la maquette. Les positions sont reconstituées
        depuis les allocations et expositions existantes ; les cours et volumes
        sont ceux des données de démonstration du fichier. En production, les
        quantités détenues, quantités disponibles, ordres déjà engagés, frais,
        fiscalité, carnets d'ordres et dates de règlement devront être lus
        depuis le backend/ORM et les flux de marché réels.
      </div>
    </div>
  );
}

const CESSION_INTERNE_GESTIONNAIRES = [
  'Nadia Traoré',
  'Jean-Baptiste Kouamé',
  'Aminata Ndiaye',
  'Chinedu Okeke',
  'Akua Mensah',
];

const cessionInterneGestionnaire = (client) => {
  const index = Math.max(
    0,
    Number(String(client?.id || '').replace(/\D/g, '') || 1) - 1
  );
  return CESSION_INTERNE_GESTIONNAIRES[
    index % CESSION_INTERNE_GESTIONNAIRES.length
  ];
};

const cessionInterneMaxDeviation = (client, allocation) =>
  Math.max(
    ...ASSET_KEYS.map((assetClass) =>
      Math.abs(
        Number(allocation?.[assetClass] || 0) -
          Number(client?.cible?.[assetClass] || 0)
      )
    )
  );

const cessionInterneCandidate = (buyer, order, amountRequested) => {
  const encours = Math.max(1, Number(buyer.encours || 0));
  const assetClass = order.assetClass;
  const price = Math.max(0.000001, Number(order.prix || 0));
  const currentCash = (encours * Number(buyer.alloc?.Liquidité || 0)) / 100;
  const currentAsset = (encours * Number(buyer.alloc?.[assetClass] || 0)) / 100;

  // Bandes de tolérance identiques au moteur de retrait.
  const maxAssetPct = Math.min(
    100,
    Number(buyer.cible?.[assetClass] || 0) + CESSION_RETRAIT_TOLERANCE
  );
  const minCashPct = Math.max(
    0,
    Number(buyer.cible?.Liquidité || 0) - CESSION_RETRAIT_TOLERANCE
  );
  const capacityByAsset = Math.max(
    0,
    (encours * maxAssetPct) / 100 - currentAsset
  );
  const capacityByCash = Math.max(
    0,
    currentCash - (encours * minCashPct) / 100
  );
  const rawCapacity = Math.min(capacityByAsset, capacityByCash);
  const quantityCapacity = Math.max(0, Math.floor(rawCapacity / price));
  const quantityRequested = Math.max(0, Math.floor(amountRequested / price));
  const quantity = Math.min(quantityCapacity, quantityRequested);
  const amount = quantity * price;

  const allocationAfter = ASSET_KEYS.reduce((map, key) => {
    let value = (encours * Number(buyer.alloc?.[key] || 0)) / 100;
    if (key === assetClass) value += amount;
    if (key === 'Liquidité') value -= amount;
    map[key] = (Math.max(0, value) / encours) * 100;
    return map;
  }, {});

  const beforeDeviation = cessionInterneMaxDeviation(buyer, buyer.alloc);
  const afterDeviation = cessionInterneMaxDeviation(buyer, allocationAfter);
  const compliantAfter = afterDeviation <= CESSION_RETRAIT_TOLERANCE;
  const profileImprovement = beforeDeviation - afterDeviation;
  const assetGapBefore =
    Number(buyer.alloc?.[assetClass] || 0) -
    Number(buyer.cible?.[assetClass] || 0);
  const assetGapAfter =
    Number(allocationAfter?.[assetClass] || 0) -
    Number(buyer.cible?.[assetClass] || 0);

  return {
    buyer,
    gestionnaire: cessionInterneGestionnaire(buyer),
    amount,
    quantity,
    capacity: quantityCapacity * price,
    capacityByAsset,
    capacityByCash,
    allocationAfter,
    beforeDeviation,
    afterDeviation,
    compliantAfter,
    profileImprovement,
    assetGapBefore,
    assetGapAfter,
    cashBeforePct: Number(buyer.alloc?.Liquidité || 0),
    cashAfterPct: Number(allocationAfter.Liquidité || 0),
  };
};

const cessionInterneMatchOrder = (
  order,
  constraints = []
) => {
  let remaining = Number(order.montantBrut || 0);
  const seller = CLIENTS.find((client) => client.id === order.clientId);

  // Garde-fou métier : aucune Action ni Obligation cotée ne peut passer
  // par la cession interne. Ce moteur accepte uniquement des obligations
  // explicitement classées "Non coté".
  if (!cessionIsInternalOrder(order)) {
    return {
      order,
      seller,
      sellerGestionnaire: cessionInterneGestionnaire(seller),
      constraints,
      systemUniverseCount: 0,
      eligible: [],
      excluded: [],
      allocations: [],
      amountMatched: 0,
      remaining,
      channelBlocked: true,
      channelBlockReason:
        'Cession interne réservée aux obligations non cotées.',
    };
  }

  // Règles système non désactivables.
  const systemUniverse = CLIENTS.filter(
    (buyer) =>
      buyer.id !== order.clientId &&
      buyer.marche === order.marche &&
      buyer.devise === order.devise
  );

  const capacityLimit = cessionInterneConstraintCapacityLimit(
    order,
    constraints
  );

  const assessed = systemUniverse.map((buyer) => {
    const requestedAmount = Math.min(
      remaining,
      Number.isFinite(capacityLimit) ? capacityLimit : remaining
    );
    const candidate = cessionInterneCandidate(
      buyer,
      order,
      requestedAmount
    );
    const assessedCandidate = cessionInterneAssessCandidate(
      candidate,
      order,
      seller,
      constraints
    );

    const exclusionReasons = [];
    if (candidate.capacity <= 0 || candidate.quantity <= 0) {
      exclusionReasons.push("Capacité d'achat insuffisante");
    }
    if (!candidate.compliantAfter) {
      exclusionReasons.push(
        `Profil hors tolérance ±${CESSION_RETRAIT_TOLERANCE} pts après achat`
      );
    }
    assessedCandidate.constraintResults
      .filter(
        (result) =>
          result.mode === 'Obligatoire' && result.passed === false
      )
      .forEach((result) => {
        exclusionReasons.push(`Contrainte : ${result.label}`);
      });

    return {
      ...assessedCandidate,
      exclusionReasons,
      eligibleForAllocation:
        candidate.capacity > 0 &&
        candidate.quantity > 0 &&
        candidate.compliantAfter &&
        assessedCandidate.hardEligible,
    };
  });

  const eligible = assessed
    .filter((candidate) => candidate.eligibleForAllocation)
    .sort((a, b) => {
      // 1. Préférences gérant satisfaites.
      if (b.preferenceScore !== a.preferenceScore) {
        return b.preferenceScore - a.preferenceScore;
      }
      // 2. Amélioration du profil.
      if (b.profileImprovement !== a.profileImprovement) {
        return b.profileImprovement - a.profileImprovement;
      }
      // 3. Capacité financière.
      return b.capacity - a.capacity;
    });

  const excluded = assessed.filter(
    (candidate) => !candidate.eligibleForAllocation
  );

  const allocations = [];
  const maxBuyers = cessionInterneMaxBuyersForLine(constraints);

  for (const baseCandidate of eligible) {
    if (remaining < Number(order.prix || 0)) break;
    if (allocations.length >= maxBuyers) break;

    const requestedAmount = Math.min(
      remaining,
      Number.isFinite(capacityLimit) ? capacityLimit : remaining
    );

    const candidate = cessionInterneCandidate(
      baseCandidate.buyer,
      order,
      requestedAmount
    );
    const assessedCandidate = cessionInterneAssessCandidate(
      candidate,
      order,
      seller,
      constraints
    );

    if (
      candidate.quantity <= 0 ||
      !candidate.compliantAfter ||
      !assessedCandidate.hardEligible
    ) {
      continue;
    }

    allocations.push(assessedCandidate);
    remaining = Math.max(0, remaining - assessedCandidate.amount);
  }

  return {
    order,
    seller,
    sellerGestionnaire: cessionInterneGestionnaire(seller),
    constraints,
    systemUniverseCount: systemUniverse.length,
    eligible,
    excluded,
    allocations,
    amountMatched: allocations.reduce(
      (sum, item) => sum + item.amount,
      0
    ),
    remaining,
  };
};

const cessionOrderSelectionKey = (order) =>
  [
    order?.clientId || 'client',
    order?.assetClass || 'classe',
    order?.titre || 'titre',
  ].join('::');

const cessionApplyBuyerSelection = (
  match,
  disabledBuyerIds = []
) => {
  const disabled = new Set(disabledBuyerIds || []);
  const order = match.order;
  const constraints = Array.isArray(match.constraints)
    ? match.constraints
    : [];
  const capacityLimit = cessionInterneConstraintCapacityLimit(
    order,
    constraints
  );
  const maxBuyers = cessionInterneMaxBuyersForLine(constraints);

  let remaining = Number(order.montantBrut || 0);
  const allocations = [];

  for (const baseCandidate of match.eligible || []) {
    if (remaining < Number(order.prix || 0)) break;
    if (allocations.length >= maxBuyers) break;
    if (disabled.has(baseCandidate.buyer.id)) continue;

    const requestedAmount = Math.min(
      remaining,
      Number.isFinite(capacityLimit) ? capacityLimit : remaining
    );

    const candidate = cessionInterneCandidate(
      baseCandidate.buyer,
      order,
      requestedAmount
    );
    const assessedCandidate = cessionInterneAssessCandidate(
      candidate,
      order,
      match.seller,
      constraints
    );

    if (
      candidate.quantity <= 0 ||
      !candidate.compliantAfter ||
      !assessedCandidate.hardEligible
    ) {
      continue;
    }

    allocations.push(assessedCandidate);
    remaining = Math.max(
      0,
      remaining - Number(assessedCandidate.amount || 0)
    );
  }

  return {
    ...match,
    allocations,
    amountMatched: allocations.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    ),
    remaining,
    disabledBuyerIds: Array.from(disabled),
  };
};

const cessionBuildListedMarketPlan = (match) => {
  const order = match.order;

  // Garde-fou métier : le carnet coté reçoit uniquement les Actions et
  // Obligations cotées. Une obligation non cotée ne peut jamais y être
  // transférée, même si aucune contrepartie interne n'est trouvée.
  if (!cessionIsListedOrder(order)) {
    const instrument =
      CESSION_INSTRUMENT_UNIVERSE.find(
        (item) =>
          item.nom === order.titre &&
          item.marche === order.marche
      ) || order;

    return {
      instrument,
      bids: [],
      asks: [],
      quantityToMarket: 0,
      amountToMarket: 0,
      launchOrders: [],
      visibleBookQuantity: 0,
      quantityBeyondVisibleBook: 0,
      channelBlocked: true,
      channelBlockReason:
        'Marché coté réservé aux Actions et Obligations cotées.',
    };
  }

  const internalQuantity = (match.allocations || []).reduce(
    (sum, allocation) => sum + Number(allocation.quantity || 0),
    0
  );
  const quantityToMarket = Math.max(
    0,
    Number(order.quantite || 0) - internalQuantity
  );

  const resolvedInstrument =
    resolveMarketInstrument(order.titre, order.marche) || {
      nom: order.titre,
      marche: order.marche,
      devise: order.devise,
      cours: Number(order.prix || 0),
      variation: 0,
      volumeJour: Number(order.volumeJour || 0),
      type:
        order.assetClass === 'Actions'
          ? 'Action'
          : 'Obligation',
    };

  const { bids, asks } = orderBookDemo(resolvedInstrument);

  let remainingQuantity = quantityToMarket;
  const launchOrders = [];

  bids.forEach((level, index) => {
    if (remainingQuantity <= 0) return;

    const quantity = Math.min(
      remainingQuantity,
      Number(level.qte || 0)
    );

    if (quantity <= 0) return;

    launchOrders.push({
      id: `CR-COTE-${order.clientId}-${String(order.titre)
        .replace(/\s+/g, '-')
        .toUpperCase()}-${index + 1}`,
      sens: 'Vente',
      titre: order.titre,
      marche: order.marche,
      qte: quantity,
      prix: Number(level.prix || order.prix || 0),
      devise: order.devise,
      pf: order.client,
      statut: 'À valider',
      source: 'Cession_Retrait',
      niveauCarnet: index + 1,
    });

    remainingQuantity -= quantity;
  });

  return {
    instrument: resolvedInstrument,
    bids,
    asks,
    quantityToMarket,
    amountToMarket: Number(match.remaining || 0),
    launchOrders,
    visibleBookQuantity: launchOrders.reduce(
      (sum, row) => sum + Number(row.qte || 0),
      0
    ),
    quantityBeyondVisibleBook: Math.max(0, remainingQuantity),
  };
};

function CessionA4Modal({
  open,
  onClose,
  payload,
  onOpenOrderBook = null,
}) {
  if (!open || !payload) return null;

  const {
    reference = '—',
    lancementAt = null,
    devise = 'XOF',
    summary = {},
    internalOrders = [],
    marketOrders = [],
    recourseRows = [],
  } = payload;

  const formatTimestamp = (value) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(value))
      : '—';

  return (
    <div
      className="gsm-native-cessionworkflow-7ee543287"
      style={{ background: 'rgba(15, 27, 51, 0.58)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="gsm-native-cessionworkflow-fc86e60cf"
        style={{
          maxWidth: 1180,
          maxHeight: '94vh',
          background: C.surfaceInset,
          boxShadow: '0 24px 80px rgba(15,27,51,0.30)',
        }}
      >
        <div
          className="gsm-native-cessionworkflow-b9488cf05"
          style={{
            background: C.surfaceCard,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div>
            <Eyebrow>Aperçu A4 · cessions lancées</Eyebrow>
            <div
              className="gsm-native-cessionworkflow-395421f13"
              style={{ color: C.ink }}
            >
              Récapitulatif des ordres de cession
            </div>
          </div>

          <div className="gsm-native-cessionworkflow-fbe161db0">
            <Badge tone="navy">Réf. {reference}</Badge>

            {onOpenOrderBook && (
              <Btn
                tone="ghost"
                onClick={onOpenOrderBook}
              >
                Ouvrir dans le carnet d'ordres →
              </Btn>
            )}

            <button
              type="button"
              onClick={() => onClose?.()}
              className="gsm-native-cessionworkflow-83d3bd0bc"
              style={{
                background: C.surfaceInset,
                color: C.ink,
              }}
              title="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div
          className="gsm-native-cessionworkflow-0b55f2e7c"
          style={{ maxHeight: 'calc(94vh - 66px)' }}
        >
          <div
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%',
              margin: '0 auto',
              background: C.surfaceCard,
              padding: '13mm 12mm',
              boxShadow: '0 10px 30px rgba(15,27,51,0.12)',
              color: C.ink,
              ...F_BODY,
            }}
          >
            <div
              style={{
                borderBottom: `2px solid ${C.navy}`,
                paddingBottom: 12,
                marginBottom: 14,
              }}
            >
              <div className="gsm-native-cessionworkflow-7df15b11c">
                <div>
                  <div
                    className="gsm-native-cessionworkflow-eab51f698"
                    style={{ color: C.gold }}
                  >
                    Gestion sous mandat
                  </div>
                  <div
                    className="gsm-native-cessionworkflow-489731063"
                    style={{ ...F_DISPLAY, color: C.navy }}
                  >
                    Récapitulatif des ordres de cession
                  </div>
                  <div
                    className="gsm-native-cessionworkflow-8884ed84b"
                    style={{ color: C.sub }}
                  >
                    Cession_Retrait · exécution interne et marché coté
                  </div>
                </div>

                <div
                  className="gsm-native-cessionworkflow-f47a4fe56"
                  style={{ color: C.sub }}
                >
                  <div>
                    <b style={{ color: C.ink }}>Référence :</b>{' '}
                    {reference}
                  </div>
                  <div className="gsm-native-cessionworkflow-7c862cefa">
                    <b style={{ color: C.ink }}>Lancement :</b>{' '}
                    {formatTimestamp(lancementAt)}
                  </div>
                  <div className="gsm-native-cessionworkflow-7c862cefa">
                    <b style={{ color: C.ink }}>Statut :</b>{' '}
                    Cessions lancées
                  </div>
                  <div className="gsm-native-cessionworkflow-7c862cefa">
                    <b style={{ color: C.ink }}>Devise synthèse :</b>{' '}
                    {devise}
                  </div>
                </div>
              </div>
            </div>

            <div className="gsm-native-cessionworkflow-167ace2af">
              {[
                {
                  label: 'Retraits demandés',
                  value: `${fmt(
                    Math.round(summary.totalWithdrawalRequested || 0)
                  )} ${devise}`,
                },
                {
                  label: 'Besoin après liquidité',
                  value: `${fmt(
                    Math.round(summary.totalNeedAfterCash || 0)
                  )} ${devise}`,
                },
                {
                  label: 'Cession interne',
                  value: `${fmt(
                    Math.round(summary.totalInternalCoverage || 0)
                  )} ${devise}`,
                },
                {
                  label: 'Marché coté',
                  value: `${fmt(
                    Math.round(summary.totalListedCoverage || 0)
                  )} ${devise}`,
                },
                {
                  label: 'Autres recours',
                  value: `${fmt(
                    Math.round(summary.totalAlternativeRecourse || 0)
                  )} ${devise}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="gsm-native-cessionworkflow-148408826"
                  style={{
                    border: `1px solid ${C.line}`,
                    background: C.surfaceElevated,
                  }}
                >
                  <div
                    className="gsm-native-cessionworkflow-c068dc675"
                    style={{ color: C.sub }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="gsm-native-cessionworkflow-cf3f8719f"
                    style={{ ...F_MONO, color: C.ink }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="gsm-native-cessionworkflow-c1ee0afc4">
              <div
                className="gsm-native-cessionworkflow-c21f1c8bf"
                style={{ background: C.positiveBackground }}
              >
                <div
                  className="gsm-native-cessionworkflow-26afca10b"
                  style={{ color: C.teal }}
                >
                  Non coté · interne
                </div>
                <div
                  className="gsm-native-cessionworkflow-acbe28a76"
                  style={{ ...F_MONO, color: C.teal }}
                >
                  {fmt(
                    Math.round(summary.totalInternalCoverage || 0)
                  )}{' '}
                  {devise}
                </div>
                <div
                  className="gsm-native-cessionworkflow-fcaf628b6"
                  style={{ color: C.sub }}
                >
                  {internalOrders.length} ordre(s) interne(s)
                </div>
              </div>

              <div
                className="gsm-native-cessionworkflow-c21f1c8bf"
                style={{ background: C.infoBackground }}
              >
                <div
                  className="gsm-native-cessionworkflow-26afca10b"
                  style={{ color: C.navy }}
                >
                  Marché coté
                </div>
                <div
                  className="gsm-native-cessionworkflow-acbe28a76"
                  style={{ ...F_MONO, color: C.navy }}
                >
                  {fmt(
                    Math.round(summary.totalListedCoverage || 0)
                  )}{' '}
                  {devise}
                </div>
                <div
                  className="gsm-native-cessionworkflow-fcaf628b6"
                  style={{ color: C.sub }}
                >
                  {marketOrders.length} ordre(s) marché
                </div>
              </div>

              <div
                className="gsm-native-cessionworkflow-c21f1c8bf"
                style={{ background: C.negativeBackground }}
              >
                <div
                  className="gsm-native-cessionworkflow-26afca10b"
                  style={{ color: C.coral }}
                >
                  Recours complémentaires
                </div>
                <div
                  className="gsm-native-cessionworkflow-acbe28a76"
                  style={{ ...F_MONO, color: C.coral }}
                >
                  {fmt(
                    Math.round(summary.totalAlternativeRecourse || 0)
                  )}{' '}
                  {devise}
                </div>
                <div
                  className="gsm-native-cessionworkflow-fcaf628b6"
                  style={{ color: C.sub }}
                >
                  {recourseRows.length} client(s) concerné(s)
                </div>
              </div>
            </div>

            <div className="gsm-native-cessionworkflow-e3926c999">
              <div
                className="gsm-native-cessionworkflow-5b94fd10b"
                style={{ color: C.navy }}
              >
                1. Ordres de cession interne lancés
              </div>

              <table
                className="gsm-native-cessionworkflow-cb14d0c0a"
                style={{
                  borderCollapse: 'collapse',
                  fontSize: 8,
                }}
              >
                <thead>
                  <tr style={{ background: C.surfaceElevated }}>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Réf.</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Vendeur</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Titre</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Acheteur</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Qté</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Montant</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Devise</th>
                  </tr>
                </thead>
                <tbody>
                  {internalOrders.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: `1px solid ${C.line}`,
                      }}
                    >
                      <td className="gsm-native-cessionworkflow-531117694" style={F_MONO}>
                        {row.id}
                      </td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.vendeur}</td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.titre}</td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.acheteur}</td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmt(row.quantite)}
                      </td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmt(Math.round(row.montant))}
                      </td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.devise}</td>
                    </tr>
                  ))}

                  {internalOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="gsm-native-cessionworkflow-176aef12c"
                        style={{ color: C.sub }}
                      >
                        Aucun ordre interne lancé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="gsm-native-cessionworkflow-e3926c999">
              <div
                className="gsm-native-cessionworkflow-5b94fd10b"
                style={{ color: C.navy }}
              >
                2. Ordres marché coté lancés
              </div>

              <table
                className="gsm-native-cessionworkflow-cb14d0c0a"
                style={{
                  borderCollapse: 'collapse',
                  fontSize: 8,
                }}
              >
                <thead>
                  <tr style={{ background: C.surfaceElevated }}>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Réf.</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Portefeuille</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Titre</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Type</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Marché</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Qté</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Prix limite</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {marketOrders.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: `1px solid ${C.line}`,
                      }}
                    >
                      <td className="gsm-native-cessionworkflow-531117694" style={F_MONO}>
                        {row.id}
                      </td>
                      <td className="gsm-native-cessionworkflow-531117694">
                        {row.vendeur || row.pf}
                      </td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.titre}</td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.type}</td>
                      <td className="gsm-native-cessionworkflow-531117694">{row.marche}</td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmt(row.qte)}
                      </td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmtPrice(row.prix)}
                      </td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmt(Math.round(row.montant))} {row.devise}
                      </td>
                    </tr>
                  ))}

                  {marketOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="gsm-native-cessionworkflow-176aef12c"
                        style={{ color: C.sub }}
                      >
                        Aucun ordre marché lancé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="gsm-native-cessionworkflow-e3926c999">
              <div
                className="gsm-native-cessionworkflow-5b94fd10b"
                style={{ color: C.coral }}
              >
                3. Besoins restant à traiter par d'autres recours
              </div>

              <table
                className="gsm-native-cessionworkflow-cb14d0c0a"
                style={{
                  borderCollapse: 'collapse',
                  fontSize: 8,
                }}
              >
                <thead>
                  <tr style={{ background: C.negativeBackground }}>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Client</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Retrait demandé</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Couvert</th>
                    <th className="gsm-native-cessionworkflow-c60c1e699">Reste à traiter</th>
                    <th className="gsm-native-cessionworkflow-1755ccc1a">Devise</th>
                  </tr>
                </thead>
                <tbody>
                  {recourseRows.map((coverage) => (
                    <tr
                      key={coverage.clientId || coverage.client}
                      style={{
                        borderBottom: `1px solid ${C.line}`,
                      }}
                    >
                      <td className="gsm-native-cessionworkflow-531117694">
                        {coverage.client}
                      </td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmt(Math.round(coverage.withdrawal))}
                      </td>
                      <td
                        className="gsm-native-cessionworkflow-e571f06f7"
                        style={F_MONO}
                      >
                        {fmt(Math.round(coverage.covered))}
                      </td>
                      <td
                        className="gsm-native-cessionworkflow-1423c123d"
                        style={{ ...F_MONO, color: C.coral }}
                      >
                        {fmt(Math.round(coverage.remaining))}
                      </td>
                      <td className="gsm-native-cessionworkflow-531117694">
                        {coverage.devise}
                      </td>
                    </tr>
                  ))}

                  {recourseRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="gsm-native-cessionworkflow-176aef12c"
                        style={{ color: C.teal }}
                      >
                        Aucun besoin complémentaire.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="gsm-native-cessionworkflow-e5b285941"
              style={{
                borderTop: `1px solid ${C.line}`,
              }}
            >
              <div
                className="gsm-native-cessionworkflow-a5d9ae462"
                style={{ color: C.sub }}
              >
                Document de synthèse généré par la maquette GSM. Les
                ordres restent soumis aux contrôles opérationnels,
                au règlement-livraison et à la confirmation effective
                des contreparties.
              </div>
              <div
                className="gsm-native-cessionworkflow-6b6a5c6ab"
                style={{ color: C.sub }}
              >
                <div>Gestion sous mandat</div>
                <div style={F_MONO}>{reference}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cession({
  ctx,
  go,
  devise = 'XOF',
  onCessionStatusChange,
  cessionRetraitEtats = [],
}) {
  const plans = Array.isArray(ctx?.plans) ? ctx.plans : [];
  const counterpartyConstraints = Array.isArray(
    ctx?.counterpartyConstraints
  )
    ? ctx.counterpartyConstraints
    : [];
  const orders = plans.flatMap((plan) => plan.orders || []);

  /*
   * Partition stricte des canaux :
   * - non-cote : obligations non cotées seulement ;
   * - cote     : actions + obligations cotées seulement.
   * Aucun reliquat non coté n'est basculé vers le marché coté.
   */
  const internalOrders = orders.filter(cessionIsInternalOrder);
  const listedOrders = orders.filter(cessionIsListedOrder);
  const unroutableOrders = orders.filter(
    (order) =>
      !cessionIsInternalOrder(order) &&
      !cessionIsListedOrder(order)
  );

  const baseInternalMatches = internalOrders.map((order) =>
    cessionInterneMatchOrder(order, counterpartyConstraints)
  );

  const [internalOrderIndex, setInternalOrderIndex] = useState(0);
  const [listedOrderIndex, setListedOrderIndex] = useState(0);
  const [cessionMode, setCessionMode] = useState(
    internalOrders.length > 0 ? 'non-cote' : 'cote'
  );
  const [buyersDisabledByOrder, setBuyersDisabledByOrder] =
    useState({});
  const [cessionValidee, setCessionValidee] = useState(false);
  const [cessionsLancees, setCessionsLancees] = useState(false);
  const [validationAt, setValidationAt] = useState(null);
  const [lancementAt, setLancementAt] = useState(null);
  const [apercuA4Visible, setApercuA4Visible] = useState(false);
  const [detailsAvancesVisible, setDetailsAvancesVisible] = useState(false);
  const [modePaiement, setModePaiement] = useState('Chèque');

  const effectiveInternalMatches = baseInternalMatches.map((match) =>
    cessionApplyBuyerSelection(
      match,
      buyersDisabledByOrder[
        cessionOrderSelectionKey(match.order)
      ] || []
    )
  );

  const listedPlans = listedOrders.map((order) =>
    cessionBuildListedMarketPlan({
      order,
      allocations: [],
      remaining: Number(order.montantBrut || 0),
      constraints: [],
    })
  );

  const selectedInternalMatch =
    effectiveInternalMatches[
      Math.min(
        internalOrderIndex,
        Math.max(0, effectiveInternalMatches.length - 1)
      )
    ];

  const selectedBaseInternalMatch =
    baseInternalMatches[
      Math.min(
        internalOrderIndex,
        Math.max(0, baseInternalMatches.length - 1)
      )
    ];

  const selectedListedOrder =
    listedOrders[
      Math.min(
        listedOrderIndex,
        Math.max(0, listedOrders.length - 1)
      )
    ];

  const selectedListedPlan =
    listedPlans[
      Math.min(
        listedOrderIndex,
        Math.max(0, listedPlans.length - 1)
      )
    ];

  const totalSaleRef = orders.reduce(
    (sum, order) =>
      sum +
      convertCurrency(
        Number(order.montantBrut || 0),
        order.devise || devise,
        devise
      ),
    0
  );

  const totalInternalNeedRef = internalOrders.reduce(
    (sum, order) =>
      sum +
      convertCurrency(
        Number(order.montantBrut || 0),
        order.devise || devise,
        devise
      ),
    0
  );

  const totalInternalMatchedRef = effectiveInternalMatches.reduce(
    (sum, match) =>
      sum +
      convertCurrency(
        Number(match.amountMatched || 0),
        match.order?.devise || devise,
        devise
      ),
    0
  );

  const totalInternalUnmatchedRef = effectiveInternalMatches.reduce(
    (sum, match) =>
      sum +
      convertCurrency(
        Number(match.remaining || 0),
        match.order?.devise || devise,
        devise
      ),
    0
  );

  const totalListedNeedRef = listedOrders.reduce(
    (sum, order) =>
      sum +
      convertCurrency(
        Number(order.montantBrut || 0),
        order.devise || devise,
        devise
      ),
    0
  );

  const totalFundingGapRef = plans.reduce(
    (sum, plan) =>
      sum +
      convertCurrency(
        Number(plan.uncoveredMarket || 0),
        plan.client?.devise || devise,
        devise
      ),
    0
  );

  const allListedOrders = listedPlans.flatMap(
    (plan) => plan.launchOrders
  );

  const totalListedQuantity = listedOrders.reduce(
    (sum, order) => sum + Number(order.quantite || 0),
    0
  );

  const uniqueBuyers = new Set(
    effectiveInternalMatches.flatMap((match) =>
      match.allocations.map((item) => item.buyer.id)
    )
  ).size;

  const managersTouched = new Set(
    effectiveInternalMatches.flatMap((match) =>
      match.allocations.map((item) => item.gestionnaire)
    )
  ).size;

  const titleRows = orders.map((order, index) => {
    const meta = cessionInterneInstrumentMeta(order);
    const channel = cessionExecutionChannel(order);
    const internalMatch =
      channel === 'non-cote'
        ? effectiveInternalMatches.find(
            (match) =>
              cessionOrderSelectionKey(match.order) ===
              cessionOrderSelectionKey(order)
          )
        : null;
    const listedPlan =
      channel === 'cote'
        ? listedPlans[listedOrders.indexOf(order)]
        : null;

    return {
      order,
      meta,
      channel,
      internalMatch,
      listedPlan,
      index,
    };
  });

  const selectedInternalOrderKey = selectedInternalMatch
    ? cessionOrderSelectionKey(selectedInternalMatch.order)
    : null;

  const selectedDisabledBuyerIds =
    selectedInternalOrderKey
      ? buyersDisabledByOrder[selectedInternalOrderKey] || []
      : [];

  /*
   * COUVERTURE DU BESOIN DE RETRAIT
   *
   * Le dénominateur est toujours le retrait demandé par le client.
   *
   * Les sources de couverture distinguées sont :
   * 1. liquidité déjà disponible avant cession ;
   * 2. obligations non cotées effectivement rapprochées en interne ;
   * 3. obligations cotées présentes dans le carnet de vente ;
   * 4. actions cotées présentes dans le carnet de vente.
   *
   * Les ventes sont ramenées au besoin restant après liquidité, au prorata
   * de leurs montants mobilisables, afin que les parts de couverture ne
   * dépassent jamais artificiellement 100 % du retrait demandé.
   */
  const buildWithdrawalCoverage = (clientId) => {
    if (!clientId) return null;

    const plan = plans.find(
      (item) => item?.client?.id === clientId
    );

    if (!plan) return null;

    const withdrawal = Math.max(
      0,
      Number(plan.withdrawal || 0)
    );

    const cashAvailable = Math.max(
      0,
      Number(plan.cashBeforeSale || 0)
    );

    const cashContribution = Math.min(
      withdrawal,
      cashAvailable
    );

    const internalMatchedGross =
      effectiveInternalMatches
        .filter(
          (match) =>
            match?.order?.clientId === clientId
        )
        .reduce(
          (sum, match) =>
            sum + Number(match.amountMatched || 0),
          0
        );

    const nonListedAvailableNet =
      internalMatchedGross *
      (1 - CESSION_RETRAIT_FEE_RATE);

    const listedRowsForClient = listedOrders
      .map((order, index) => ({
        order,
        listedPlan: listedPlans[index],
      }))
      .filter(
        ({ order }) => order?.clientId === clientId
      );

    const actionListedAvailableNet =
      listedRowsForClient
        .filter(
          ({ order }) =>
            order.assetClass === 'Actions'
        )
        .reduce((sum, { listedPlan }) => {
          const grossVisible = (
            listedPlan?.launchOrders || []
          ).reduce(
            (amount, row) =>
              amount +
              Number(row.qte || 0) *
                Number(row.prix || 0),
            0
          );

          return (
            sum +
            grossVisible *
              (1 - CESSION_RETRAIT_FEE_RATE)
          );
        }, 0);

    const listedBondAvailableNet =
      listedRowsForClient
        .filter(
          ({ order }) =>
            order.assetClass !== 'Actions'
        )
        .reduce((sum, { listedPlan }) => {
          const grossVisible = (
            listedPlan?.launchOrders || []
          ).reduce(
            (amount, row) =>
              amount +
              Number(row.qte || 0) *
                Number(row.prix || 0),
            0
          );

          return (
            sum +
            grossVisible *
              (1 - CESSION_RETRAIT_FEE_RATE)
          );
        }, 0);

    const securitiesAvailable =
      nonListedAvailableNet +
      listedBondAvailableNet +
      actionListedAvailableNet;

    const needAfterCash = Math.max(
      0,
      withdrawal - cashContribution
    );

    /*
     * Si les titres mobilisables dépassent le besoin restant, on répartit
     * la part effectivement nécessaire au retrait au prorata des trois
     * poches. Cela donne une lecture de couverture cohérente et plafonnée.
     */
    const securitiesScale =
      securitiesAvailable > 0
        ? Math.min(
            1,
            needAfterCash / securitiesAvailable
          )
        : 0;

    const nonListedContribution =
      nonListedAvailableNet * securitiesScale;

    const listedBondContribution =
      listedBondAvailableNet * securitiesScale;

    const actionListedContribution =
      actionListedAvailableNet * securitiesScale;

    const totalCovered = Math.min(
      withdrawal,
      cashContribution +
        nonListedContribution +
        listedBondContribution +
        actionListedContribution
    );

    const remaining = Math.max(
      0,
      withdrawal - totalCovered
    );

    const pct = (amount) =>
      withdrawal > 0
        ? Math.max(
            0,
            Math.min(
              100,
              (Number(amount || 0) / withdrawal) * 100
            )
          )
        : 0;

    return {
      plan,
      client: plan.client,
      devise: plan.client?.devise || devise,
      withdrawal,
      cashAvailable,
      cashContribution,
      cashPct: pct(cashContribution),
      nonListedAvailableNet,
      nonListedContribution,
      nonListedPct: pct(nonListedContribution),
      listedBondAvailableNet,
      listedBondContribution,
      listedBondPct: pct(listedBondContribution),
      actionListedAvailableNet,
      actionListedContribution,
      actionListedPct: pct(actionListedContribution),
      totalCovered,
      totalPct: pct(totalCovered),
      remaining,
      remainingPct: pct(remaining),
    };
  };

  const selectedInternalCoverage =
    buildWithdrawalCoverage(
      selectedInternalMatch?.order?.clientId
    );

  const selectedListedCoverage =
    buildWithdrawalCoverage(
      selectedListedOrder?.clientId
    );

  /*
   * SYNTHÈSE GLOBALE DES CESSIONS
   * Le graphique porte sur le besoin restant après liquidité disponible.
   */
  const withdrawalCoverages = plans
    .map((plan) => buildWithdrawalCoverage(plan?.client?.id))
    .filter(Boolean);

  const coverageToRef = (amount, currency) =>
    convertCurrency(
      Number(amount || 0),
      currency || devise,
      devise
    );

  const totalWithdrawalRequestedRef = withdrawalCoverages.reduce(
    (sum, coverage) =>
      sum + coverageToRef(coverage.withdrawal, coverage.devise),
    0
  );

  const totalCashContributionRef = withdrawalCoverages.reduce(
    (sum, coverage) =>
      sum + coverageToRef(coverage.cashContribution, coverage.devise),
    0
  );

  const totalNeedAfterCashRef = Math.max(
    0,
    totalWithdrawalRequestedRef - totalCashContributionRef
  );

  const totalInternalCoverageGlobalRef = withdrawalCoverages.reduce(
    (sum, coverage) =>
      sum + coverageToRef(coverage.nonListedContribution, coverage.devise),
    0
  );

  const totalListedBondCoverageGlobalRef = withdrawalCoverages.reduce(
    (sum, coverage) =>
      sum + coverageToRef(coverage.listedBondContribution, coverage.devise),
    0
  );

  const totalListedActionCoverageGlobalRef = withdrawalCoverages.reduce(
    (sum, coverage) =>
      sum + coverageToRef(coverage.actionListedContribution, coverage.devise),
    0
  );

  const totalListedCoverageGlobalRef =
    totalListedBondCoverageGlobalRef + totalListedActionCoverageGlobalRef;

  const totalAlternativeRecourseRef = withdrawalCoverages.reduce(
    (sum, coverage) =>
      sum + coverageToRef(coverage.remaining, coverage.devise),
    0
  );

  const totalCessionCoverageRef =
    totalInternalCoverageGlobalRef + totalListedCoverageGlobalRef;

  const globalCessionCoveragePct = (amount) =>
    totalNeedAfterCashRef > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (Number(amount || 0) / totalNeedAfterCashRef) * 100
          )
        )
      : 0;

  const globalCessionCoverageData = [
    {
      name: 'Cession interne · non coté',
      value: Number(
        globalCessionCoveragePct(totalInternalCoverageGlobalRef).toFixed(1)
      ),
      montant: totalInternalCoverageGlobalRef,
      devise,
      color: C.teal,
    },
    {
      name: 'Marché coté',
      value: Number(
        globalCessionCoveragePct(totalListedCoverageGlobalRef).toFixed(1)
      ),
      montant: totalListedCoverageGlobalRef,
      devise,
      color: C.navy,
    },
    {
      name: 'Autres recours nécessaires',
      value: Number(
        globalCessionCoveragePct(totalAlternativeRecourseRef).toFixed(1)
      ),
      montant: totalAlternativeRecourseRef,
      devise,
      color: C.coral,
    },
  ];

  const totalCessionCoveragePct = globalCessionCoveragePct(
    totalCessionCoverageRef
  );

  /*
   * PILOTAGE DE LA CESSION EN COURS
   *
   * Ces lignes sont les ordres réellement préparés par les deux canaux :
   * - allocations internes des obligations non cotées ;
   * - ordres de vente construits sur le carnet coté.
   */
  const internalPreparedOrders = effectiveInternalMatches.flatMap(
    (match) =>
      (match.allocations || []).map((allocation, index) => ({
        id: `CR-INT-${match.order.clientId}-${String(match.order.titre)
          .replace(/\s+/g, '-')
          .toUpperCase()}-${index + 1}`,
        canal: 'Cession interne',
        vendeur: match.order.client,
        vendeurId: match.order.clientId,
        acheteur: allocation.buyer?.nom || '—',
        gestionnaire: allocation.gestionnaire || '—',
        titre: match.order.titre,
        type: 'Obligation non cotée',
        marche: match.order.marche,
        quantite: Number(allocation.quantity || 0),
        prix: Number(match.order.prix || 0),
        montant: Number(allocation.amount || 0),
        devise: match.order.devise,
      }))
  );

  const marketPreparedOrders = allListedOrders.map((row) => ({
    ...row,
    canal: 'Marché coté',
    vendeur: row.pf,
    type:
      listedOrders.find(
        (order) =>
          order.titre === row.titre &&
          order.marche === row.marche
      )?.assetClass === 'Actions'
        ? 'Action cotée'
        : 'Obligation cotée',
    montant:
      Number(row.qte || 0) * Number(row.prix || 0),
  }));

  const totalPreparedOrders =
    internalPreparedOrders.length + marketPreparedOrders.length;

  const clientsConcernedCount = new Set(
    orders.map((order) => order.clientId)
  ).size;

  const clientsFullyCoveredCount = withdrawalCoverages.filter(
    (coverage) => Number(coverage.remaining || 0) <= 1
  ).length;

  const clientsWithRecourse = withdrawalCoverages.filter(
    (coverage) => Number(coverage.remaining || 0) > 1
  );

  const marketDepthShortfallCount = listedPlans.filter(
    (plan) => Number(plan.quantityBeyondVisibleBook || 0) > 0
  ).length;

  /*
   * ÉTAPE 4 — RETRAITS DISPONIBLES
   *
   * On ne traite plus le retrait disponible comme un simple booléen global.
   * La page compte les demandes de retrait présentes dans la cession courante
   * et vérifie, client par client, lesquelles sont déjà passées au statut
   * « Retrait disponible » dans l'état Cession_Retrait partagé par l'app.
   *
   * Exemple de lecture : 2 / 5 = deux retraits disponibles sur cinq demandes.
   */
  const requestedWithdrawalCount = plans.length;
  const requestedWithdrawalClientIds = new Set(
    plans.map((plan) => plan?.client?.id).filter(Boolean)
  );

  const availableWithdrawalCount = cessionRetraitEtats.filter(
    (item) =>
      requestedWithdrawalClientIds.has(item?.clientId) &&
      item?.statut === 'Retrait disponible'
  ).length;

  const allWithdrawalsAvailable =
    requestedWithdrawalCount > 0 &&
    availableWithdrawalCount >= requestedWithdrawalCount;

  const someWithdrawalsAvailable =
    availableWithdrawalCount > 0 && !allWithdrawalsAvailable;

  const withdrawalAvailabilityRatio = `${availableWithdrawalCount}/${requestedWithdrawalCount}`;

  const cessionStatusLabel = allWithdrawalsAvailable
    ? 'Retraits disponibles'
    : someWithdrawalsAvailable
    ? `Retraits disponibles ${withdrawalAvailabilityRatio}`
    : cessionsLancees
    ? 'Cessions lancées'
    : cessionValidee
    ? 'Cessions validées'
    : 'Préparation';

  const cessionStatusTone = allWithdrawalsAvailable
    ? 'teal'
    : someWithdrawalsAvailable
    ? 'gold'
    : cessionsLancees
    ? 'navy'
    : cessionValidee
    ? 'gold'
    : 'slate';

  const formatCycleTimestamp = (value) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(value))
      : '—';

  const a4Reference = `CR-${CESSION_RETRAIT_REFERENCE_DATE.replace(
    /-/g,
    ''
  )}-${String(plans.length).padStart(2, '0')}`;

  const cessionA4Payload = {
    reference: a4Reference,
    lancementAt,
    devise,
    summary: {
      totalWithdrawalRequested: totalWithdrawalRequestedRef,
      totalNeedAfterCash: totalNeedAfterCashRef,
      totalInternalCoverage: totalInternalCoverageGlobalRef,
      totalListedCoverage: totalListedCoverageGlobalRef,
      totalAlternativeRecourse: totalAlternativeRecourseRef,
    },
    internalOrders: internalPreparedOrders,
    marketOrders: marketPreparedOrders,
    recourseRows: clientsWithRecourse.map((coverage) => ({
      clientId: coverage.client?.id,
      client: coverage.client?.nom || '—',
      withdrawal: coverage.withdrawal,
      covered: coverage.totalCovered,
      remaining: coverage.remaining,
      devise: coverage.devise,
    })),
  };

  const renderWithdrawalCoverageCard = (
    coverage,
    {
      showSelectedNonListedResidual = false,
    } = {}
  ) => {
    if (!coverage) return null;

    const rows = [
      {
        label: 'Obligation non cotée',
        detail: 'Cession interne effectivement rapprochée',
        amount: coverage.nonListedContribution,
        available: coverage.nonListedAvailableNet,
        pct: coverage.nonListedPct,
        tone: 'teal',
        background: C.positiveBackground,
        color: C.teal,
      },
      {
        label: 'Obligations cotées',
        detail: 'Ordres de vente visibles sur le carnet coté',
        amount: coverage.listedBondContribution,
        available: coverage.listedBondAvailableNet,
        pct: coverage.listedBondPct,
        tone: 'gold',
        background: C.warningBackground,
        color: C.warningText,
      },
      {
        label: 'Actions cotées',
        detail: 'Ordres de vente visibles sur le carnet coté',
        amount: coverage.actionListedContribution,
        available: coverage.actionListedAvailableNet,
        pct: coverage.actionListedPct,
        tone: 'navy',
        background: C.infoBackground,
        color: C.navy,
      },
      {
        label: 'Liquidité déjà disponible',
        detail: 'Liquidité mobilisable avant les cessions',
        amount: coverage.cashContribution,
        available: coverage.cashAvailable,
        pct: coverage.cashPct,
        tone: 'slate',
        background: C.surfaceElevated,
        color: C.sub,
      },
    ];

    return (
      <Card
        className="gsm-native-cessionworkflow-a44b9b0f9"
        style={{
          borderColor:
            coverage.remaining > 1
              ? C.gold
              : C.teal,
        }}
      >
        
      </Card>
    );
  };

  const toggleBuyer = (buyerId) => {
    if (!selectedInternalOrderKey) return;

    setBuyersDisabledByOrder((current) => {
      const disabled = new Set(
        current[selectedInternalOrderKey] || []
      );

      if (disabled.has(buyerId)) {
        disabled.delete(buyerId);
      } else {
        disabled.add(buyerId);
      }

      return {
        ...current,
        [selectedInternalOrderKey]: Array.from(disabled),
      };
    });
  };

  const selectAllBuyers = () => {
    if (!selectedInternalOrderKey) return;
    setBuyersDisabledByOrder((current) => ({
      ...current,
      [selectedInternalOrderKey]: [],
    }));
  };

  const deselectAllBuyers = () => {
    if (!selectedInternalOrderKey || !selectedBaseInternalMatch) return;
    setBuyersDisabledByOrder((current) => ({
      ...current,
      [selectedInternalOrderKey]: (
        selectedBaseInternalMatch.eligible || []
      ).map((candidate) => candidate.buyer.id),
    }));
  };

  const validerCession = () => {
    const now = new Date().toISOString();
    setCessionValidee(true);
    setValidationAt(now);

    plans.forEach((plan) => {
      onCessionStatusChange?.(plan.client.id, {
        client: plan.client.nom,
        montant: plan.withdrawal,
        devise: plan.client.devise,
        statut: 'Processus lancé',
        dateSouhaitee: plan.request?.date,
      });
    });
  };

  const lancerCessions = () => {
    if (!cessionValidee) return;

    const now = new Date().toISOString();
    setCessionsLancees(true);
    setLancementAt(now);
    setApercuA4Visible(true);

    plans.forEach((plan) => {
      onCessionStatusChange?.(plan.client.id, {
        client: plan.client.nom,
        montant: plan.withdrawal,
        devise: plan.client.devise,
        statut: 'Cession en cours',
        dateSouhaitee: plan.request?.date,
      });
    });
  };

  const rendreRetraitDisponible = () => {
    plans.forEach((plan) => {
      onCessionStatusChange?.(plan.client.id, {
        client: plan.client.nom,
        montant: plan.withdrawal,
        devise: plan.client.devise,
        statut: 'Retrait disponible',
        dateSouhaitee: plan.request?.date,
        modePaiement,
      });
    });
  };

  const envoyerCarnetCote = () => {
    if (!allListedOrders.length) return;

    go('carnet', {
      marche: 'Tous',
      cessionOrders: allListedOrders,
      cessionA4: cessionsLancees ? cessionA4Payload : null,
      source: 'cession',
    });
  };

  const ouvrirCarnetAvecA4 = () => {
    go('carnet', {
      marche: 'Tous',
      cessionOrders: allListedOrders,
      cessionA4: cessionA4Payload,
      source: 'cession',
    });
  };

  const hasPendingInternal = totalInternalUnmatchedRef > 1;
  const hasUnroutable = unroutableOrders.length > 0;
  const canCloseCession =
    !hasPendingInternal &&
    !hasUnroutable &&
    totalFundingGapRef <= 1;

  if (!plans.length) {
    return (
      <div className="gsm-native-cessionworkflow-032c178c8">
        <Breadcrumb
          items={['Accueil', 'Cession_Retrait', 'Cession']}
        />
        <Card className="gsm-native-cessionworkflow-922f50b09">
          <div
            className="gsm-native-cessionworkflow-08b367d0d"
            style={{ color: C.ink }}
          >
            Aucun plan de cession transmis
          </div>
          <div
            className="gsm-native-cessionworkflow-098aba719"
            style={{ color: C.sub }}
          >
            Lancez d'abord une optimisation dans Cession_Retrait puis
            ouvrez la page Cession.
          </div>
          <div className="gsm-native-cessionworkflow-d96d3fcc4">
            <Btn onClick={() => go('cession-retrait')}>
              Retour Cession_Retrait
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="gsm-native-cessionworkflow-8ffbcc36d">
      <Breadcrumb
        items={['Accueil', 'Cession_Retrait', 'Cession']}
      />

      <div className="gsm-native-cessionworkflow-58efebb31">
        <div>
          <Eyebrow>Gestion sous mandat · exécution des cessions</Eyebrow>
          <h2
            className="gsm-native-cessionworkflow-e4a5bf570"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            Cession — pilotage des ordres
          </h2>
        </div>

        <div className="gsm-native-cessionworkflow-955277834">
          <Badge tone="navy">
            {orders.length} ligne(s)
          </Badge>
          <Badge tone="gold">
            {listedOrders.length} coté(s)
          </Badge>
          <Badge tone="teal">
            {internalOrders.length} non coté(s)
          </Badge>
          {unroutableOrders.length > 0 && (
            <Badge tone="coral">
              {unroutableOrders.length} non routable(s)
            </Badge>
          )}
        </div>
      </div>

      <div className="gsm-native-cessionworkflow-167ace2af">
        {[
          {
            label: 'Montant total à céder',
            value: `${fmt(Math.round(totalSaleRef))} ${devise}`,
            detail: `${orders.length} ligne(s)`,
          },
          {
            label: 'Marché coté',
            value: `${fmt(Math.round(totalListedNeedRef))} ${devise}`,
            detail: `${listedOrders.length} action(s) / obligation(s) cotée(s)`,
          },
          {
            label: 'Non coté à céder',
            value: `${fmt(Math.round(totalInternalNeedRef))} ${devise}`,
            detail: `${internalOrders.length} obligation(s) non cotée(s)`,
          },
          {
            label: 'Non coté rapproché',
            value: `${fmt(Math.round(totalInternalMatchedRef))} ${devise}`,
            detail: `${uniqueBuyers} acheteur(s) · ${managersTouched} gestionnaire(s)`,
          },
          {
            label: 'Non coté restant',
            value: `${fmt(Math.round(totalInternalUnmatchedRef))} ${devise}`,
            detail: hasPendingInternal
              ? 'reste à couvrir en interne'
              : 'entièrement couvert',
          },
        ].map((stat) => (
          <Card key={stat.label} className="gsm-native-cessionworkflow-17deebbc4">
            <div
              className="gsm-native-cessionworkflow-b9aa861d7"
              style={{ color: C.sub }}
            >
              {stat.label}
            </div>
            <div
              className="gsm-native-cessionworkflow-94adb7731"
              style={{ ...F_MONO, color: C.ink }}
            >
              {stat.value}
            </div>
            <div
              className="gsm-native-cessionworkflow-e903b7557"
              style={{ color: C.sub }}
            >
              {stat.detail}
            </div>
          </Card>
        ))}
      </div>

      <Card className="gsm-native-cessionworkflow-0bd674477" style={{ borderColor: C.gold }}>
        <div className="gsm-native-cessionworkflow-dace80282">
          <div className="gsm-native-cessionworkflow-ec37447e3">
            <Eyebrow>Couverture globale des retraits par les cessions</Eyebrow>
            <div className="gsm-native-cessionworkflow-395421f13" style={{ color: C.ink }}>
              Ce que les échanges peuvent réellement financer
            </div>
            <div
              className="gsm-native-cessionworkflow-6da7118fc"
              style={{ color: C.sub }}
            >
              Le graphique porte sur le besoin restant après utilisation de la
              liquidité déjà disponible. Il sépare la couverture obtenue par
              cession interne, celle réalisable sur le marché coté et le besoin
              qui nécessitera un autre recours.
            </div>
          </div>

          <Badge tone={totalAlternativeRecourseRef > 1 ? 'gold' : 'teal'}>
            {totalCessionCoveragePct.toFixed(1)} % couvert par les cessions
          </Badge>
        </div>

        {/*
         * Version compacte : le contenu métier reste intégralement présent,
         * mais les informations sont regroupées horizontalement afin de
         * limiter la hauteur occupée sur la page Cession.
         */}
        <div className="gsm-native-cessionworkflow-59dd0d8bf">
          <div
            className="gsm-native-cessionworkflow-a41e67dfd"
            style={{ background: C.surfaceElevated }}
          >
            <div className="gsm-native-cessionworkflow-8d58f1c4e">
              <div>
                <div
                  className="gsm-native-cessionworkflow-d7048bf75"
                  style={{ color: C.sub }}
                >
                  Retraits demandés
                </div>
                <div
                  className="gsm-native-cessionworkflow-ed84fb023"
                  style={{ ...F_MONO, color: C.ink }}
                >
                  {fmt(Math.round(totalWithdrawalRequestedRef))} {devise}
                </div>
              </div>

              <div>
                <div
                  className="gsm-native-cessionworkflow-d7048bf75"
                  style={{ color: C.sub }}
                >
                  Liquidité déjà disponible
                </div>
                <div
                  className="gsm-native-cessionworkflow-ed84fb023"
                  style={{ ...F_MONO, color: C.sub }}
                >
                  {fmt(Math.round(totalCashContributionRef))} {devise}
                </div>
              </div>

              <div
                className="gsm-native-cessionworkflow-dd0fab3e4"
                style={{ background: C.surfaceCard, border: `1px solid ${C.line}` }}
              >
                <div
                  className="gsm-native-cessionworkflow-d7048bf75"
                  style={{ color: C.sub }}
                >
                  Besoin à financer par cessions
                </div>
                <div
                  className="gsm-native-cessionworkflow-ed84fb023"
                  style={{ ...F_MONO, color: C.ink }}
                >
                  {fmt(Math.round(totalNeedAfterCashRef))} {devise}
                </div>
              </div>
            </div>

            {totalNeedAfterCashRef > 0 ? (
              <div className="gsm-native-cessionworkflow-ec4a03733">
                <div className="gsm-native-cessionworkflow-ec37447e3">
                  <Donut data={globalCessionCoverageData} size={165} />
                </div>
                <div className="gsm-native-cessionworkflow-ec37447e3">
                  <Legende data={globalCessionCoverageData} />
                </div>
              </div>
            ) : (
              <div
                className="gsm-native-cessionworkflow-effa84094"
                style={{ color: C.sub, background: C.surfaceCard }}
              >
                La liquidité disponible couvre déjà les retraits : aucune
                cession supplémentaire n'est nécessaire.
              </div>
            )}
          </div>

          <div className="gsm-native-cessionworkflow-e799804e5">
            <div
              className="gsm-native-cessionworkflow-b7a564aa8"
              style={{ borderColor: C.positiveBorder, background: C.positiveBackground }}
            >
              <div className="gsm-native-cessionworkflow-14975f1f4">
                <Badge tone="teal">Marché non coté</Badge>
                <div
                  className="gsm-native-cessionworkflow-395421f13"
                  style={{ color: C.teal, ...F_MONO }}
                >
                  {globalCessionCoveragePct(
                    totalInternalCoverageGlobalRef
                  ).toFixed(1)} %
                </div>
              </div>

              <div
                className="gsm-native-cessionworkflow-808f6db40"
                style={{ color: C.sub }}
              >
                Couverture par cessions internes
              </div>
              <div
                className="gsm-native-cessionworkflow-26ae43b05"
                style={{ ...F_MONO, color: C.teal }}
              >
                {fmt(Math.round(totalInternalCoverageGlobalRef))} {devise}
              </div>
              <div
                className="gsm-native-cessionworkflow-45c97b4a3"
                style={{ color: C.sub }}
              >
                Obligations non cotées effectivement rapprochées avec des
                contreparties internes sélectionnées.
              </div>
            </div>

            <div
              className="gsm-native-cessionworkflow-b7a564aa8"
              style={{ borderColor: C.infoBorder, background: C.infoBackground }}
            >
              <div className="gsm-native-cessionworkflow-14975f1f4">
                <Badge tone="navy">Marché coté</Badge>
                <div
                  className="gsm-native-cessionworkflow-395421f13"
                  style={{ color: C.navy, ...F_MONO }}
                >
                  {globalCessionCoveragePct(
                    totalListedCoverageGlobalRef
                  ).toFixed(1)} %
                </div>
              </div>

              <div
                className="gsm-native-cessionworkflow-808f6db40"
                style={{ color: C.sub }}
              >
                Couverture par ordres de marché
              </div>
              <div
                className="gsm-native-cessionworkflow-26ae43b05"
                style={{ ...F_MONO, color: C.navy }}
              >
                {fmt(Math.round(totalListedCoverageGlobalRef))} {devise}
              </div>

              <div
                className="gsm-native-cessionworkflow-a3524650b"
                style={{ color: C.sub }}
              >
                <div className="gsm-native-cessionworkflow-afc373e8a">
                  <span>Actions cotées</span>
                  <b style={F_MONO}>
                    {fmt(Math.round(totalListedActionCoverageGlobalRef))}{' '}
                    {devise}
                  </b>
                </div>
                <div className="gsm-native-cessionworkflow-afc373e8a">
                  <span>Obligations cotées</span>
                  <b style={F_MONO}>
                    {fmt(Math.round(totalListedBondCoverageGlobalRef))}{' '}
                    {devise}
                  </b>
                </div>
              </div>
            </div>

            <div
              className="gsm-native-cessionworkflow-b7a564aa8"
              style={{ borderColor: C.negativeBorder, background: C.negativeBackground }}
            >
              <div className="gsm-native-cessionworkflow-14975f1f4">
                <Badge tone="coral">Autres recours</Badge>
                <div
                  className="gsm-native-cessionworkflow-395421f13"
                  style={{ color: C.coral, ...F_MONO }}
                >
                  {globalCessionCoveragePct(
                    totalAlternativeRecourseRef
                  ).toFixed(1)} %
                </div>
              </div>

              <div
                className="gsm-native-cessionworkflow-808f6db40"
                style={{ color: C.sub }}
              >
                Montant non échangeable / non couvert
              </div>
              <div
                className="gsm-native-cessionworkflow-26ae43b05"
                style={{ ...F_MONO, color: C.coral }}
              >
                {fmt(Math.round(totalAlternativeRecourseRef))} {devise}
              </div>
              <div
                className="gsm-native-cessionworkflow-45c97b4a3"
                style={{ color: C.sub }}
              >
                Besoin qui reste sans contrepartie interne ou sans profondeur
                suffisante sur le marché coté et qui devra faire l'objet d'un
                autre traitement opérationnel.
              </div>
            </div>

            <div
              className="gsm-native-cessionworkflow-afae6cfc7"
              style={{
                background:
                  totalAlternativeRecourseRef > 1 ? C.warningBackground : C.positiveBackground,
              }}
            >
              <div className="gsm-native-cessionworkflow-dbaa0de01">
                <div
                  className="gsm-native-cessionworkflow-8ce80a694"
                  style={{ color: C.ink }}
                >
                  Lecture opérationnelle
                </div>
                <div
                  className="gsm-native-cessionworkflow-5ecc9ee31"
                  style={{ color: C.sub }}
                >
                  {totalAlternativeRecourseRef > 1
                    ? "Les cessions disponibles ne couvrent pas intégralement le besoin : le reliquat doit être traité par un autre recours avant de rendre le retrait disponible."
                    : "Le besoin à financer par cessions est intégralement couvert par les canaux interne et coté."}
                </div>
              </div>

              <Badge tone={totalAlternativeRecourseRef > 1 ? 'gold' : 'teal'}>
                {totalAlternativeRecourseRef > 1
                  ? `${fmt(Math.round(totalAlternativeRecourseRef))} ${devise} à traiter`
                  : 'Couverture complète'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- PILOTAGE DE LA CESSION EN COURS ---------------- */}
      <Card className="gsm-native-cessionworkflow-a44b9b0f9" style={{ borderColor: C.navy }}>
        <div className="gsm-native-cessionworkflow-58efebb31">
          <div>
            <Eyebrow>Pilotage de la cession en cours</Eyebrow>
            <div
              className="gsm-native-cessionworkflow-08b367d0d"
              style={{ color: C.ink }}
            >
              Vue de synthèse avant et après lancement des ordres
            </div>
            <div
              className="gsm-native-cessionworkflow-00ac40015"
              style={{ color: C.sub }}
            >
              Cette zone concentre les informations utiles au gérant :
              portefeuilles concernés, nombre d'ordres préparés, niveau de
              couverture, besoins de recours complémentaires et état du cycle
              de traitement.
            </div>
          </div>

          <Badge tone={cessionStatusTone}>
            {cessionStatusLabel}
          </Badge>
        </div>

        <div className="gsm-native-cessionworkflow-f88676f9d">
          {[
            {
              label: 'Portefeuilles concernés',
              value: clientsConcernedCount,
              detail: `${plans.length} demande(s) de retrait`,
            },
            {
              label: 'Ordres internes',
              value: internalPreparedOrders.length,
              detail: `${uniqueBuyers} contrepartie(s) distincte(s)`,
            },
            {
              label: 'Ordres marché',
              value: marketPreparedOrders.length,
              detail: `${listedOrders.length} ligne(s) cotée(s)`,
            },
            {
              label: 'Couverture par cessions',
              value: `${totalCessionCoveragePct.toFixed(1)} %`,
              detail: `${fmt(Math.round(totalCessionCoverageRef))} ${devise}`,
            },
            {
              label: 'Clients totalement couverts',
              value: `${clientsFullyCoveredCount}/${withdrawalCoverages.length}`,
              detail: clientsWithRecourse.length
                ? `${clientsWithRecourse.length} avec recours complémentaire`
                : 'aucun recours complémentaire',
            },
            {
              label: 'Autres recours',
              value: `${fmt(Math.round(totalAlternativeRecourseRef))} ${devise}`,
              detail:
                totalAlternativeRecourseRef > 1
                  ? 'à traiter hors cessions préparées'
                  : 'aucun reliquat',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="gsm-native-cessionworkflow-b7a564aa8"
              style={{
                borderColor: C.line,
                background: C.surfaceElevated,
              }}
            >
              <div
                className="gsm-native-cessionworkflow-14445f4f2"
                style={{ color: C.sub }}
              >
                {stat.label}
              </div>
              <div
                className="gsm-native-cessionworkflow-acbe28a76"
                style={{ ...F_MONO, color: C.ink }}
              >
                {stat.value}
              </div>
              <div
                className="gsm-native-cessionworkflow-fcaf628b6"
                style={{ color: C.sub }}
              >
                {stat.detail}
              </div>
            </div>
          ))}
        </div>

        <div className="gsm-native-cessionworkflow-c1ee0afc4">
          <div
            className="gsm-native-cessionworkflow-c21f1c8bf"
            style={{
              background:
                totalInternalUnmatchedRef > 1
                  ? C.warningBackground
                  : C.positiveBackground,
            }}
          >
            <div
              className="gsm-native-cessionworkflow-14445f4f2"
              style={{ color: C.sub }}
            >
              Non coté restant sans contrepartie
            </div>
            <div
              className="gsm-native-cessionworkflow-acef4a802"
              style={{
                ...F_MONO,
                color:
                  totalInternalUnmatchedRef > 1
                    ? C.warningText
                    : C.teal,
              }}
            >
              {fmt(Math.round(totalInternalUnmatchedRef))} {devise}
            </div>
          </div>

          <div
            className="gsm-native-cessionworkflow-c21f1c8bf"
            style={{
              background:
                marketDepthShortfallCount > 0
                  ? C.warningBackground
                  : C.positiveBackground,
            }}
          >
            <div
              className="gsm-native-cessionworkflow-14445f4f2"
              style={{ color: C.sub }}
            >
              Profondeur marché insuffisante
            </div>
            <div
              className="gsm-native-cessionworkflow-acef4a802"
              style={{
                ...F_MONO,
                color:
                  marketDepthShortfallCount > 0
                    ? C.warningText
                    : C.teal,
              }}
            >
              {marketDepthShortfallCount} ligne(s)
            </div>
          </div>

          <div
            className="gsm-native-cessionworkflow-c21f1c8bf"
            style={{
              background:
                unroutableOrders.length > 0
                  ? C.negativeBackground
                  : C.positiveBackground,
            }}
          >
            <div
              className="gsm-native-cessionworkflow-14445f4f2"
              style={{ color: C.sub }}
            >
              Titres non routables
            </div>
            <div
              className="gsm-native-cessionworkflow-acef4a802"
              style={{
                ...F_MONO,
                color:
                  unroutableOrders.length > 0
                    ? C.coral
                    : C.teal,
              }}
            >
              {unroutableOrders.length} ligne(s)
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- CYCLE OPÉRATIONNEL ---------------- */}
      <Card className="gsm-native-cessionworkflow-a44b9b0f9" style={{ borderColor: C.gold }}>
        <div className="gsm-native-cessionworkflow-ede668ece">
          <div>
            <Eyebrow>Cycle opérationnel</Eyebrow>
            <div
              className="gsm-native-cessionworkflow-08b367d0d"
              style={{ color: C.ink }}
            >
              Valider, lancer puis suivre les cessions
            </div>
            <div
              className="gsm-native-cessionworkflow-49f6d8a31"
              style={{ color: C.sub }}
            >
              La validation fige les choix du gérant. Le lancement marque les
              ordres comme transmis aux canaux d'exécution et déclenche
              automatiquement l'aperçu A4 récapitulatif.
            </div>
          </div>

          <Badge tone={cessionStatusTone}>
            {cessionStatusLabel}
          </Badge>
        </div>

        <div className="gsm-native-cessionworkflow-173c8fb01">
          {[
            {
              numero: 1,
              label: 'Ordres préparés',
              actif: true,
              detail: `${totalPreparedOrders} ordre(s)`,
            },
            {
              numero: 2,
              label: 'Cessions validées',
              actif: cessionValidee,
              detail: validationAt
                ? formatCycleTimestamp(validationAt)
                : 'En attente du gérant',
            },
            {
              numero: 3,
              label: 'Cessions lancées',
              actif: cessionsLancees,
              detail: lancementAt
                ? formatCycleTimestamp(lancementAt)
                : 'Non lancé',
            },
            {
              numero: 4,
              label: 'Retraits disponibles',
              actif: availableWithdrawalCount > 0,
              complete: allWithdrawalsAvailable,
              partial: someWithdrawalsAvailable,
              value: withdrawalAvailabilityRatio,
              detail:
                requestedWithdrawalCount > 0
                  ? `${availableWithdrawalCount} retrait(s) disponible(s) sur ${requestedWithdrawalCount} demande(s)`
                  : 'Aucune demande de retrait dans cette cession',
            },
          ].map((step) => (
            <div
              key={step.numero}
              className="gsm-native-cessionworkflow-b7a564aa8"
              style={{
                borderColor: step.partial
                  ? C.warningBorder
                  : step.actif
                  ? C.positiveBorder
                  : C.line,
                background: step.partial
                  ? C.warningBackground
                  : step.actif
                  ? C.positiveBackground
                  : C.surfaceElevated,
              }}
            >
              <div className="gsm-native-cessionworkflow-fb283143d">
                <div className="gsm-native-cessionworkflow-42017ac71">
                  <div
                    className="gsm-native-cessionworkflow-9ec6f21ca"
                    style={{
                      background: step.partial
                        ? C.gold
                        : step.actif
                        ? C.teal
                        : C.surfaceInset,
                      color: step.actif ? C.textPrimary : C.sub,
                    }}
                  >
                    {step.numero}
                  </div>
                  <div
                    className="gsm-native-cessionworkflow-8b5131be0"
                    style={{ color: C.ink }}
                  >
                    {step.label}
                  </div>
                </div>

                {step.value && (
                  <div
                    className="gsm-native-cessionworkflow-3939bccca"
                    style={{
                      ...F_MONO,
                      background: step.complete
                        ? C.positiveBackground
                        : step.partial
                        ? C.warningBackground
                        : C.surfaceInset,
                      color: step.complete
                        ? C.teal
                        : step.partial
                        ? C.warningText
                        : C.sub,
                    }}
                    title="Retraits disponibles / retraits demandés"
                  >
                    {step.value}
                  </div>
                )}
              </div>
              <div
                className="gsm-native-cessionworkflow-eeec81693"
                style={{ color: C.sub }}
              >
                {step.detail}
              </div>
            </div>
          ))}
        </div>

        <div
          className="gsm-native-cessionworkflow-b5814c64c"
          style={{ background: C.surfaceElevated }}
        >
          <div>
            <div
              className="gsm-native-cessionworkflow-f5a77cf56"
              style={{ color: C.ink }}
            >
              Action du gérant
            </div>
            <div
              className="gsm-native-cessionworkflow-0974b9dad"
              style={{ color: C.sub }}
            >
              {totalAlternativeRecourseRef > 1
                ? `Attention : ${fmt(
                    Math.round(totalAlternativeRecourseRef)
                  )} ${devise} restent à traiter par d'autres recours. Les ordres disponibles peuvent néanmoins être validés et lancés.`
                : 'Les canaux de cession préparés couvrent le besoin restant après liquidité disponible.'}
            </div>
          </div>

          <div className="gsm-native-cessionworkflow-0dee3c198">
            {!cessionValidee && (
              <Btn onClick={validerCession}>
                Valider les cessions
              </Btn>
            )}

            {cessionValidee && !cessionsLancees && (
              <>
                <Badge tone="teal">Validation effectuée</Badge>
                <Btn onClick={lancerCessions}>
                  Lancer les cessions
                </Btn>
              </>
            )}

            {cessionsLancees && (
              <>
                <Badge tone="navy">
                  Cessions lancées
                </Badge>

                <Btn
                  tone="ghost"
                  onClick={() => setApercuA4Visible(true)}
                >
                  Revoir l'aperçu A4
                </Btn>

                <select name="gsm-cessionworkflow-7416" aria-label="Sélection cessionworkflow"
                  value={modePaiement}
                  onChange={(event) =>
                    setModePaiement(event.target.value)
                  }
                  className="gsm-native-cessionworkflow-ae610d554"
                  style={{ borderColor: C.line }}
                >
                  <option>Chèque</option>
                  <option>Virement bancaire</option>
                  <option>Espèces / caisse</option>
                </select>

                <Btn
                  onClick={rendreRetraitDisponible}
                  disabled={
                    allWithdrawalsAvailable || !canCloseCession
                  }
                >
                  {allWithdrawalsAvailable
                    ? `Retraits disponibles ${withdrawalAvailabilityRatio} ✓`
                    : !canCloseCession
                    ? 'Cessions à finaliser'
                    : someWithdrawalsAvailable
                    ? `Confirmer les retraits restants (${withdrawalAvailabilityRatio})`
                    : 'Confirmer fonds disponibles'}
                </Btn>
              </>
            )}
          </div>
        </div>
      </Card>


      <Card className="gsm-native-cessionworkflow-0bd674477" style={{ borderColor: C.navy }}>
        <div className="gsm-native-cessionworkflow-fb2befc05">
          <div>
            <Eyebrow>Ordres de cession</Eyebrow>
            <div className="gsm-native-cessionworkflow-395421f13" style={{ color: C.ink }}>
              Consulter les ordres par canal d'exécution
            </div>
          </div>

          <div className="gsm-native-cessionworkflow-9b5b52cc7" style={{ background: C.surfaceInset }}>
            {[
              {
                id: 'non-cote',
                label: `Non coté · Ordres internes (${internalOrders.length})`,
                disabled: internalOrders.length === 0,
              },
              {
                id: 'cote',
                label: `Marché coté · Ordres à lancer (${listedOrders.length})`,
                disabled: listedOrders.length === 0,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                onClick={() => setCessionMode(tab.id)}
                className="gsm-native-cessionworkflow-5ac3c95a9"
                style={{
                  background: cessionMode === tab.id ? C.surfaceCard : 'transparent',
                  color: tab.disabled
                    ? C.textMuted
                    : cessionMode === tab.id
                    ? C.navy
                    : C.sub,
                  cursor: tab.disabled ? 'not-allowed' : 'pointer',
                  boxShadow:
                    cessionMode === tab.id
                      ? '0 1px 4px rgba(15,27,51,0.10)'
                      : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <CessionA4Modal
        open={cessionsLancees && apercuA4Visible}
        onClose={() => setApercuA4Visible(false)}
        payload={cessionA4Payload}
        onOpenOrderBook={ouvrirCarnetAvecA4}
      />

      <Card className="gsm-native-cessionworkflow-17deebbc4">
        <div className="gsm-native-cessionworkflow-fb2befc05">
          <div>
            <Eyebrow>Détails avancés</Eyebrow>
            <div
              className="gsm-native-cessionworkflow-6c67e01f7"
              style={{ color: C.ink }}
            >
              Titres à échanger, contrôles de routage et contraintes gérant
            </div>
          </div>
          <Btn
            tone="ghost"
            onClick={() =>
              setDetailsAvancesVisible((current) => !current)
            }
          >
            {detailsAvancesVisible
              ? 'Masquer les détails'
              : `Afficher les détails (${titleRows.length} lignes)`}
          </Btn>
        </div>
      </Card>

      {detailsAvancesVisible && (
        <>
      <Card className="gsm-native-cessionworkflow-352ac6b2c">
        <div className="gsm-native-cessionworkflow-ab4b2642d">
          <div>
            <Eyebrow>Détail des titres à échanger</Eyebrow>
            <div
              className="gsm-native-cessionworkflow-395421f13"
              style={{ color: C.ink }}
            >
              Lignes qui composent les montants de couverture ci-dessus
            </div>
            <div
              className="gsm-native-cessionworkflow-8884ed84b"
              style={{ color: C.sub }}
            >
              Le canal est déterminé par la nature du titre et son statut
              de cotation. Il n'est pas choisi manuellement par le gérant.
            </div>
          </div>
          <Badge tone="navy">{titleRows.length} ligne(s)</Badge>
        </div>

        <div className="gsm-table-scroll">
          <table
            className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7"
            style={{ minWidth: 1850 }}
          >
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>Client vendeur</Th>
                <Th>Titre</Th>
                <Th>Type</Th>
                <Th>Cotation</Th>
                <Th>Canal obligatoire</Th>
                <Th>Classe</Th>
                <Th>Secteur</Th>
                <Th>Émetteur</Th>
                <Th>Marché réf.</Th>
                <Th>Devise</Th>
                <Th>Qté à céder</Th>
                <Th>Prix réf.</Th>
                <Th>Montant brut</Th>
                <Th>Qté interne retenue</Th>
                <Th>Qté carnet coté</Th>
              </tr>
            </thead>
            <tbody>
              {titleRows.map(
                ({
                  order,
                  meta,
                  channel,
                  internalMatch,
                  listedPlan,
                  index,
                }) => {
                  const internalQuantity = internalMatch
                    ? internalMatch.allocations.reduce(
                        (sum, allocation) =>
                          sum +
                          Number(allocation.quantity || 0),
                        0
                      )
                    : 0;

                  return (
                    <tr
                      key={`${order.clientId}-${order.titre}-${index}`}
                      style={{
                        borderTop: `1px solid ${C.line}`,
                        background:
                          channel === 'non-cote'
                            ? C.positiveBackground
                            : channel === 'cote'
                            ? C.rowAlternate
                            : C.negativeBackground,
                      }}
                    >
                      <Td className="gsm-native-cessionworkflow-400f7fe55">
                        {order.client}
                      </Td>
                      <Td className="gsm-native-cessionworkflow-400f7fe55">
                        {order.titre}
                      </Td>
                      <Td>{meta.type}</Td>
                      <Td>
                        <Badge
                          tone={
                            meta.cotation === 'Non coté'
                              ? 'teal'
                              : 'gold'
                          }
                        >
                          {meta.cotation}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            channel === 'non-cote'
                              ? 'teal'
                              : channel === 'cote'
                              ? 'navy'
                              : 'coral'
                          }
                        >
                          {channel === 'non-cote'
                            ? 'Cession interne'
                            : channel === 'cote'
                            ? 'Marché coté'
                            : 'Non routable'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone="slate">
                          {order.assetClass}
                        </Badge>
                      </Td>
                      <Td>{meta.secteur}</Td>
                      <Td>{meta.emetteur}</Td>
                      <Td>{order.marche}</Td>
                      <Td mono>{order.devise}</Td>
                      <Td mono>{fmt(order.quantite)}</Td>
                      <Td mono>
                        {fmtPrice(order.prix)} {order.devise}
                      </Td>
                      <Td mono>
                        {fmt(Math.round(order.montantBrut))}{' '}
                        {order.devise}
                      </Td>
                      <Td mono>
                        {channel === 'non-cote'
                          ? fmt(internalQuantity)
                          : '—'}
                      </Td>
                      <Td mono>
                        {channel === 'cote'
                          ? fmt(
                              listedPlan?.quantityToMarket || 0
                            )
                          : '—'}
                      </Td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </Card>


      {unroutableOrders.length > 0 && (
        <Card className="gsm-native-cessionworkflow-0bd674477" style={{ borderColor: C.coral }}>
          <Eyebrow>Contrôle de routage</Eyebrow>
          <div
            className="gsm-native-cessionworkflow-395421f13"
            style={{ color: C.ink }}
          >
            Titres sans statut de cotation exploitable
          </div>
          <div
            className="gsm-native-cessionworkflow-d3dc6f7dc"
            style={{ color: C.sub }}
          >
            Ces lignes sont bloquées jusqu'à ce que le référentiel titre
            fournisse explicitement leur type et leur statut de cotation.
          </div>
          <div className="gsm-native-cessionworkflow-f7b565058">
            {unroutableOrders.map((order) => (
              <Badge
                key={`${order.clientId}-${order.titre}`}
                tone="coral"
              >
                {order.titre}
              </Badge>
            ))}
          </div>
        </Card>
      )}


        </>
      )}

      {/* Zone des ordres : défilement interne pour limiter le scroll de la page */}
      <div
        className="gsm-native-cessionworkflow-a2c231fc9"
        style={{
          borderColor: C.line,
          background: C.surfaceElevated,
        }}
      >
        <div className="gsm-native-cessionworkflow-ed36d7280">
          <div>
            <Eyebrow>
              {cessionMode === 'non-cote'
                ? 'Ordres internes · non coté'
                : 'Ordres marché · coté'}
            </Eyebrow>
            <div
              className="gsm-native-cessionworkflow-08fd92a10"
              style={{ color: C.sub }}
            >
              Les détails défilent dans cette zone sans allonger toute la page.
            </div>
          </div>
          <Badge tone={cessionMode === 'non-cote' ? 'teal' : 'navy'}>
            {cessionMode === 'non-cote'
              ? `${internalOrders.length} ligne(s)`
              : `${listedOrders.length} ligne(s)`}
          </Badge>
        </div>

        <div
          style={{
            maxHeight: '62vh',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
      {cessionMode === 'non-cote' && (
        <>
          {internalOrders.length === 0 ? (
            <Card className="gsm-native-cessionworkflow-922f50b09">
              <Eyebrow>Marché non coté</Eyebrow>
              <div
                className="gsm-native-cessionworkflow-395421f13"
                style={{ color: C.ink }}
              >
                Aucune obligation non cotée dans ce plan
              </div>
              <div
                className="gsm-native-cessionworkflow-d3dc6f7dc"
                style={{ color: C.sub }}
              >
                Les Actions et Obligations cotées ne sont jamais proposées
                comme cessions internes.
              </div>
            </Card>
          ) : (
            <>
              <Card className="gsm-native-cessionworkflow-a44b9b0f9">
                <div className="gsm-native-cessionworkflow-fb2befc05">
                  <div>
                    <Eyebrow>Obligation non cotée sélectionnée</Eyebrow>
                    <div
                      className="gsm-native-cessionworkflow-395421f13"
                      style={{ color: C.ink }}
                    >
                      {selectedInternalMatch?.order?.titre}
                    </div>
                  </div>

                  <select name="gsm-cessionworkflow-7785" aria-label="Sélection cessionworkflow"
                    value={internalOrderIndex}
                    onChange={(event) =>
                      setInternalOrderIndex(
                        Number(event.target.value)
                      )
                    }
                    className="gsm-native-cessionworkflow-5f3136745"
                    style={{ borderColor: C.line }}
                  >
                    {effectiveInternalMatches.map(
                      (match, index) => (
                        <option
                          key={`${match.order.clientId}-${match.order.titre}-${index}`}
                          value={index}
                        >
                          {match.order.client} · {match.order.titre} ·{' '}
                          {fmt(
                            Math.round(match.order.montantBrut)
                          )}{' '}
                          {match.order.devise}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {selectedInternalMatch && (
                  <div className="gsm-native-cessionworkflow-f88676f9d">
                    {[
                      [
                        'Client vendeur',
                        selectedInternalMatch.order.client,
                      ],
                      [
                        'Titre',
                        selectedInternalMatch.order.titre,
                      ],
                      [
                        'Cotation',
                        cessionInstrumentListingStatus(
                          selectedInternalMatch.order
                        ),
                      ],
                      [
                        'Classe',
                        selectedInternalMatch.order.assetClass,
                      ],
                      [
                        'Quantité',
                        fmt(selectedInternalMatch.order.quantite),
                      ],
                      [
                        'À couvrir en interne',
                        `${fmt(
                          Math.round(
                            selectedInternalMatch.remaining
                          )
                        )} ${
                          selectedInternalMatch.order.devise
                        }`,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="gsm-native-cessionworkflow-c21f1c8bf"
                        style={{ background: C.surfaceElevated }}
                      >
                        <div
                          className="gsm-native-cessionworkflow-14445f4f2"
                          style={{ color: C.sub }}
                        >
                          {label}
                        </div>
                        <div
                          className="gsm-native-cessionworkflow-82ac69fce"
                          style={{ color: C.ink }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {selectedInternalMatch && (
                <>
                  <Card className="gsm-native-cessionworkflow-a44b9b0f9">
                    <div className="gsm-native-cessionworkflow-fb2befc05">
                      <div>
                        <Eyebrow>
                          Cessions internes · obligations non cotées
                        </Eyebrow>
                        <div
                          className="gsm-native-cessionworkflow-395421f13"
                          style={{ color: C.ink }}
                        >
                          Sélection des acheteurs potentiels
                        </div>
                        <div
                          className="gsm-native-cessionworkflow-8884ed84b"
                          style={{ color: C.sub }}
                        >
                          Le gestionnaire peut décocher des acheteurs.
                          Le reliquat reste sur le canal non coté et
                          n'est jamais envoyé au carnet de bourse.
                        </div>
                      </div>

                      <div className="gsm-native-cessionworkflow-0986fa0a0">
                        <Btn tone="ghost" onClick={selectAllBuyers}>
                          Tout sélectionner
                        </Btn>
                        <Btn tone="ghost" onClick={deselectAllBuyers}>
                          Tout décocher
                        </Btn>
                      </div>
                    </div>

                    <div className="gsm-table-scroll gsm-native-cessionworkflow-dc82aef23">
                      <table
                        className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7"
                        style={{ minWidth: 1120 }}
                      >
                        <thead style={{ background: C.surfaceElevated }}>
                          <tr>
                            <Th>Retenir</Th>
                            <Th>Client acheteur</Th>
                            <Th>Profil</Th>
                            <Th>Encours</Th>
                            <Th>Liquidité avant</Th>
                            <Th>Capacité max</Th>
                            <Th>Impact profil</Th>
                            <Th>Préférences</Th>
                            <Th>Affectation</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedBaseInternalMatch?.eligible || []).map(
                            (candidate, index) => {
                              const disabled =
                                selectedDisabledBuyerIds.includes(
                                  candidate.buyer.id
                                );
                              const proposed =
                                selectedInternalMatch.allocations.find(
                                  (item) =>
                                    item.buyer.id ===
                                    candidate.buyer.id
                                );

                              return (
                                <tr
                                  key={candidate.buyer.id}
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                    background: disabled
                                      ? C.negativeBackground
                                      : proposed
                                      ? C.positiveBackground
                                      : index % 2
                                      ? C.rowAlternate
                                      : C.surfaceCard,
                                  }}
                                >
                                  <Td>
                                    <input name="gsm-cessionworkflow-7952" aria-label="Champ cessionworkflow"
                                      type="checkbox"
                                      checked={!disabled}
                                      onChange={() =>
                                        toggleBuyer(
                                          candidate.buyer.id
                                        )
                                      }
                                    />
                                  </Td>
                                  <Td>{candidate.buyer.nom}</Td>
                                  <Td>
                                    <Badge tone="navy">
                                      {
                                        candidate.buyer
                                          .profilRisque
                                      }
                                    </Badge>
                                  </Td>
                                  <Td mono>
                                    {fmt(
                                      Math.round(
                                        candidate.buyer.encours
                                      )
                                    )}{' '}
                                    {candidate.buyer.devise}
                                  </Td>
                                  <Td mono>
                                    {candidate.cashBeforePct.toFixed(
                                      1
                                    )}
                                    %
                                  </Td>
                                  <Td mono>
                                    {fmt(
                                      Math.round(
                                        candidate.capacity
                                      )
                                    )}{' '}
                                    {candidate.buyer.devise}
                                  </Td>
                                  <Td>
                                    <Badge
                                      tone={
                                        candidate.profileImprovement >
                                        0.05
                                          ? 'teal'
                                          : candidate.profileImprovement <
                                            -0.05
                                          ? 'coral'
                                          : 'slate'
                                      }
                                    >
                                      {candidate.profileImprovement >
                                      0.05
                                        ? `Améliore +${candidate.profileImprovement.toFixed(
                                            1
                                          )} pt`
                                        : candidate.profileImprovement <
                                          -0.05
                                        ? `Dégrade ${candidate.profileImprovement.toFixed(
                                            1
                                          )} pt`
                                        : 'Neutre'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Badge
                                      tone={
                                        candidate.preferenceTotal >
                                          0 &&
                                        candidate.preferenceMatched ===
                                          candidate.preferenceTotal
                                          ? 'teal'
                                          : candidate.preferenceMatched >
                                            0
                                          ? 'gold'
                                          : 'slate'
                                      }
                                    >
                                      {candidate.preferenceTotal > 0
                                        ? `${candidate.preferenceMatched}/${candidate.preferenceTotal}`
                                        : '—'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    {disabled ? (
                                      <Badge tone="coral">
                                        Décoché
                                      </Badge>
                                    ) : proposed ? (
                                      <>
                                        <Badge tone="teal">
                                          Retenu
                                        </Badge>
                                        <div
                                          className="gsm-native-cessionworkflow-e903b7557"
                                          style={{
                                            color: C.teal,
                                          }}
                                        >
                                          {fmt(
                                            Math.round(
                                              proposed.amount
                                            )
                                          )}{' '}
                                          {
                                            proposed.buyer
                                              .devise
                                          }
                                        </div>
                                      </>
                                    ) : (
                                      <Badge tone="slate">
                                        Éligible
                                      </Badge>
                                    )}
                                  </Td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>


                </>
              )}
            </>
          )}
        </>
      )}

      {cessionMode === 'cote' && (
        <>
          {listedOrders.length === 0 ? (
            <Card className="gsm-native-cessionworkflow-922f50b09">
              <Eyebrow>Marché coté</Eyebrow>
              <div
                className="gsm-native-cessionworkflow-395421f13"
                style={{ color: C.ink }}
              >
                Aucune Action ou Obligation cotée dans ce plan
              </div>
              <div
                className="gsm-native-cessionworkflow-d3dc6f7dc"
                style={{ color: C.sub }}
              >
                Les Obligations non cotées restent exclusivement
                dans le canal de cession interne.
              </div>
            </Card>
          ) : (
            <>
              <Card className="gsm-native-cessionworkflow-a44b9b0f9">
                <div className="gsm-native-cessionworkflow-fb2befc05">
                  <div>
                    <Eyebrow>
                      Action / obligation cotée sélectionnée
                    </Eyebrow>
                    <div
                      className="gsm-native-cessionworkflow-395421f13"
                      style={{ color: C.ink }}
                    >
                      {selectedListedOrder?.titre}
                    </div>
                  </div>

                  <select name="gsm-cessionworkflow-8122" aria-label="Sélection cessionworkflow"
                    value={listedOrderIndex}
                    onChange={(event) =>
                      setListedOrderIndex(
                        Number(event.target.value)
                      )
                    }
                    className="gsm-native-cessionworkflow-5f3136745"
                    style={{ borderColor: C.line }}
                  >
                    {listedOrders.map((order, index) => (
                      <option
                        key={`${order.clientId}-${order.titre}-${index}`}
                        value={index}
                      >
                        {order.client} · {order.titre} ·{' '}
                        {fmt(Math.round(order.montantBrut))}{' '}
                        {order.devise}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedListedOrder && (
                  <div className="gsm-native-cessionworkflow-f88676f9d">
                    {[
                      [
                        'Client vendeur',
                        selectedListedOrder.client,
                      ],
                      ['Titre', selectedListedOrder.titre],
                      [
                        'Type',
                        selectedListedOrder.assetClass ===
                        'Actions'
                          ? 'Action'
                          : 'Obligation',
                      ],
                      [
                        'Cotation',
                        cessionInstrumentListingStatus(
                          selectedListedOrder
                        ),
                      ],
                      [
                        'Quantité',
                        fmt(selectedListedOrder.quantite),
                      ],
                      [
                        'Canal',
                        'Marché coté uniquement',
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="gsm-native-cessionworkflow-c21f1c8bf"
                        style={{ background: C.surfaceElevated }}
                      >
                        <div
                          className="gsm-native-cessionworkflow-14445f4f2"
                          style={{ color: C.sub }}
                        >
                          {label}
                        </div>
                        <div
                          className="gsm-native-cessionworkflow-82ac69fce"
                          style={{ color: C.ink }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {selectedListedOrder &&
                selectedListedPlan && (
                  <>
                    {renderWithdrawalCoverageCard(
                      selectedListedCoverage
                    )}

                    <Card className="gsm-native-cessionworkflow-a44b9b0f9">
                      <div className="gsm-native-cessionworkflow-fb2befc05">
                        <div>
                          <Eyebrow>
                            Marché coté · profondeur disponible
                          </Eyebrow>
                          <div
                            className="gsm-native-cessionworkflow-395421f13"
                            style={{ color: C.ink }}
                          >
                            {selectedListedPlan.instrument.nom}
                          </div>
                          <div className="gsm-native-cessionworkflow-0663806ec">
                            <Badge tone="navy">
                              {
                                selectedListedPlan.instrument
                                  .marche
                              }
                            </Badge>
                            <Badge tone="gold">
                              {
                                selectedListedOrder.assetClass ===
                                'Actions'
                                  ? 'Action cotée'
                                  : 'Obligation cotée'
                              }
                            </Badge>
                            <span
                              className="gsm-native-cessionworkflow-6c67e01f7"
                              style={F_MONO}
                            >
                              {fmtPrice(
                                selectedListedPlan.instrument
                                  .cours
                              )}{' '}
                              {
                                selectedListedPlan.instrument
                                  .devise
                              }
                            </span>
                            <Pct
                              v={Number(
                                selectedListedPlan.instrument
                                  .variation || 0
                              )}
                            />
                          </div>
                        </div>

                        <Btn
                          tone="ghost"
                          onClick={() =>
                            go('profondeur', {
                              instrument:
                                selectedListedPlan.instrument
                                  .nom,
                              marche:
                                selectedListedPlan.instrument
                                  .marche,
                              source:
                                selectedListedPlan.instrument
                                  .type === 'Obligation'
                                  ? 'marches'
                                  : 'vue-boursiere',
                            })
                          }
                        >
                          Voir profondeur complète
                        </Btn>
                      </div>

                      <div className="gsm-native-cessionworkflow-507747ffa">
                        <div>
                          <div
                            className="gsm-native-cessionworkflow-799911af8"
                            style={{ color: C.teal }}
                          >
                            Achats disponibles (bid)
                          </div>
                          <table className="gsm-native-cessionworkflow-2fa65d019">
                            <thead>
                              <tr>
                                <Th>Niveau</Th>
                                <Th>Prix</Th>
                                <Th>Quantité</Th>
                                <Th>Montant</Th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedListedPlan.bids.map(
                                (bid, index) => (
                                  <tr
                                    key={`bid-${index}`}
                                    style={{
                                      borderTop: `1px solid ${C.line}`,
                                    }}
                                  >
                                    <Td mono>{index + 1}</Td>
                                    <Td mono>
                                      <span
                                        style={{
                                          color: C.teal,
                                        }}
                                      >
                                        {fmtPrice(
                                          bid.prix
                                        )}
                                      </span>
                                    </Td>
                                    <Td mono>
                                      {fmt(bid.qte)}
                                    </Td>
                                    <Td mono>
                                      {fmt(
                                        Math.round(
                                          bid.prix *
                                            bid.qte
                                        )
                                      )}{' '}
                                      {
                                        selectedListedOrder.devise
                                      }
                                    </Td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div>
                          <div
                            className="gsm-native-cessionworkflow-799911af8"
                            style={{ color: C.coral }}
                          >
                            Ventes présentes (ask)
                          </div>
                          <table className="gsm-native-cessionworkflow-2fa65d019">
                            <thead>
                              <tr>
                                <Th>Niveau</Th>
                                <Th>Prix</Th>
                                <Th>Quantité</Th>
                                <Th>Montant</Th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedListedPlan.asks.map(
                                (ask, index) => (
                                  <tr
                                    key={`ask-${index}`}
                                    style={{
                                      borderTop: `1px solid ${C.line}`,
                                    }}
                                  >
                                    <Td mono>{index + 1}</Td>
                                    <Td mono>
                                      <span
                                        style={{
                                          color: C.coral,
                                        }}
                                      >
                                        {fmtPrice(
                                          ask.prix
                                        )}
                                      </span>
                                    </Td>
                                    <Td mono>
                                      {fmt(ask.qte)}
                                    </Td>
                                    <Td mono>
                                      {fmt(
                                        Math.round(
                                          ask.prix *
                                            ask.qte
                                        )
                                      )}{' '}
                                      {
                                        selectedListedOrder.devise
                                      }
                                    </Td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </Card>

                    <Card className="gsm-native-cessionworkflow-352ac6b2c">
                      <div className="gsm-native-cessionworkflow-8bb47cd27">
                        <div>
                          <Eyebrow>
                            Carnet des ordres à lancer
                          </Eyebrow>
                          <div
                            className="gsm-native-cessionworkflow-395421f13"
                            style={{ color: C.ink }}
                          >
                            Ordres de vente proposés sur les
                            meilleurs niveaux acheteurs
                          </div>
                          <div
                            className="gsm-native-cessionworkflow-8884ed84b"
                            style={{ color: C.sub }}
                          >
                            Ce carnet contient uniquement des Actions
                            et Obligations cotées.
                          </div>
                        </div>
                        <Badge tone="gold">
                          {
                            selectedListedPlan.launchOrders
                              .length
                          }{' '}
                          ordre(s)
                        </Badge>
                      </div>

                      <div className="gsm-table-scroll">
                        <table
                          className="gsm-table--banking gsm-native-cessionworkflow-716d53ae7"
                          style={{ minWidth: 1100 }}
                        >
                          <thead
                            style={{ background: C.surfaceElevated }}
                          >
                            <tr>
                              <Th>Réf.</Th>
                              <Th>Sens</Th>
                              <Th>Titre</Th>
                              <Th>Type</Th>
                              <Th>Marché</Th>
                              <Th>Niveau</Th>
                              <Th>Quantité</Th>
                              <Th>Prix limite</Th>
                              <Th>
                                Montant indicatif
                              </Th>
                              <Th>
                                Portefeuille vendeur
                              </Th>
                              <Th>Statut</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedListedPlan.launchOrders.map(
                              (row) => (
                                <tr
                                  key={row.id}
                                  style={{
                                    borderTop: `1px solid ${C.line}`,
                                  }}
                                >
                                  <Td mono>{row.id}</Td>
                                  <Td>
                                    <Badge tone="coral">
                                      {row.sens}
                                    </Badge>
                                  </Td>
                                  <Td className="gsm-native-cessionworkflow-400f7fe55">
                                    {row.titre}
                                  </Td>
                                  <Td>
                                    {
                                      selectedListedOrder.assetClass ===
                                      'Actions'
                                        ? 'Action'
                                        : 'Obligation cotée'
                                    }
                                  </Td>
                                  <Td>
                                    <Badge tone="navy">
                                      {row.marche}
                                    </Badge>
                                  </Td>
                                  <Td mono>
                                    {row.niveauCarnet}
                                  </Td>
                                  <Td mono>
                                    {fmt(row.qte)}
                                  </Td>
                                  <Td mono>
                                    {fmtPrice(row.prix)}{' '}
                                    {row.devise}
                                  </Td>
                                  <Td mono>
                                    {fmt(
                                      Math.round(
                                        row.qte *
                                          row.prix
                                      )
                                    )}{' '}
                                    {row.devise}
                                  </Td>
                                  <Td>{row.pf}</Td>
                                  <Td>
                                    <Badge tone="gold">
                                      {row.statut}
                                    </Badge>
                                  </Td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {selectedListedPlan.quantityBeyondVisibleBook >
                        0 && (
                        <div
                          className="gsm-native-cessionworkflow-f76734ece"
                          style={{
                            background: C.warningBackground,
                            color: C.warningText,
                          }}
                        >
                          <b>Profondeur insuffisante :</b>{' '}
                          {fmt(
                            selectedListedPlan.quantityBeyondVisibleBook
                          )}{' '}
                          titre(s) dépassent les niveaux visibles
                          du carnet.
                        </div>
                      )}
                    </Card>
                  </>
                )}
            </>
          )}
        </>
      )}

        </div>
      </div>

      {detailsAvancesVisible && (
        <>
      <Card className="gsm-native-cessionworkflow-a44b9b0f9">
        <div className="gsm-native-cessionworkflow-dab71a530">
          <div>
            <Eyebrow>
              Contraintes transmises par le gérant
            </Eyebrow>
            <div
              className="gsm-native-cessionworkflow-395421f13"
              style={{ color: C.ink }}
            >
              Appliquées exclusivement aux obligations non cotées
            </div>
          </div>
          <Badge tone="navy">
            {
              counterpartyConstraints.filter(
                (constraint) =>
                  constraint.mode === 'Obligatoire'
              ).length
            }{' '}
            obligatoire(s)
          </Badge>
        </div>

        <div className="gsm-native-cessionworkflow-f7b565058">
          {counterpartyConstraints.length === 0 ? (
            <span
              className="gsm-native-cessionworkflow-cc70e9326"
              style={{ color: C.sub }}
            >
              Aucune contrainte gérant supplémentaire.
            </span>
          ) : (
            counterpartyConstraints.map((constraint) => (
              <span
                key={constraint.id}
                className="gsm-native-cessionworkflow-4099a953c"
                style={{
                  background:
                    constraint.mode === 'Obligatoire'
                      ? C.surfaceElevated
                      : constraint.mode === 'Préférence'
                      ? C.warningBackground
                      : C.surfaceInset,
                  color:
                    constraint.mode === 'Obligatoire'
                      ? C.navy
                      : constraint.mode === 'Préférence'
                      ? C.warningText
                      : C.sub,
                }}
              >
                {constraint.mode} ·{' '}
                {cessionInterneConstraintLabel(constraint)}
              </span>
            ))
          )}
        </div>
      </Card>
        </>
      )}


    </div>
  );
}

export {
  CessionRetrait,
  Cession,
  Cession as CessionInterne,
  CessionA4Modal,
  CESSION_RETRAIT_ETATS_DEMO,
  CESSION_RETRAIT_REFERENCE_DATE,
  CESSION_RETRAIT_STATUTS,
  cessionRetraitStatusTone,
  CESSION_NON_LISTED_BONDS,
  CESSION_INSTRUMENT_UNIVERSE,
  cessionNonListedPositionsForClient,
  cessionAttachNonListedPositions,
};
