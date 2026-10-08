import { useState } from 'react';
import { convertCurrency } from '../../shared/lib/finance';
import type { Navigate } from '../../shared/ui/Navigation';
import {
  MoneyManagementCashflowSection,
  type MoneyRevenuePoint,
} from './MoneyManagementCashflowSection';
import {
  MoneyManagementLiquidityBreakdown,
  type LiquidityDimension,
} from './MoneyManagementLiquidityBreakdown';
import { MoneyManagementLiquidityActions } from './MoneyManagementLiquidityActions';
import { MoneyManagementFiltersHeader } from './MoneyManagementFiltersHeader';
import { MoneyManagementSummary } from './MoneyManagementSummary';
import { MoneyManagementPortfolioPositions } from './MoneyManagementPortfolioPositions';
import {
  MoneyManagementLiquidityAnatomy,
  type LiquidityDetailView,
  type LiquidityAccountDetail,
} from './MoneyManagementLiquidityAnatomy';

interface MoneyManagementClient {
  id: string;
  nom: string;
  marche: string;
  devise: string;
  type: string;
  profilRisque: string;
  encours: number;
  alloc: Record<string, number>;
  cible: Record<string, number>;
  rentabilite?: number;
}

interface MoneyManagementOrder {
  id: string;
  pf: string;
  statut: string;
  sens: string;
  titre: string;
  qte: number;
  prix: number;
  devise: string;
}

interface MoneyManagementUpcomingCashflow {
  echeance: string;
  portefeuilles: string;
  montant: number;
  titre: string;
  type: string;
  devise: string;
}

interface MoneyManagementExportPayload {
  rows?: unknown[];
  [key: string]: unknown;
}

type BadgeTone = 'slate' | 'gold' | 'teal' | 'coral' | 'navy';
type WeightedDefinition = {
  poids: number;
  [key: string]: string | number;
};

export interface MoneyManagementDependencies {
  clients: MoneyManagementClient[];
  orders: MoneyManagementOrder[];
  upcomingCashflows: MoneyManagementUpcomingCashflow[];
  profileTypeLabel: Record<string, string>;
  liquidityHistoryMinDate: string;
  rebalanceThreshold: number;
  parseIsoLocalDate: (value: string) => Date;
  parseFR: (value: string) => Date;
  liquidityHistoricalAmount: (
    amount: number,
    seed: string,
    situationDate: Date,
    referenceDate: Date,
    sensitivity: number
  ) => number;
  buildMoneyManagementConsolidatedExportPayload: (
    details: LiquidityAccountDetail[]
  ) => MoneyManagementExportPayload;
  exportMoneyManagementPdf: (payload: MoneyManagementExportPayload) => void;
  exportMoneyManagementExcel: (payload: MoneyManagementExportPayload) => void;
}

export interface MoneyManagementProps {
  go: Navigate;
  devise?: string;
  dependencies: MoneyManagementDependencies;
}

export function MoneyManagement({ go, devise = 'XOF', dependencies }: MoneyManagementProps) {
  const {
    clients: CLIENTS,
    orders: ORDERS,
    upcomingCashflows: UPCOMING_CASHFLOWS,
    profileTypeLabel: PROFILE_TYPE_LABEL,
    liquidityHistoryMinDate: LIQUIDITY_HISTORY_MIN_DATE,
    rebalanceThreshold: SEUIL_REEQUILIBRAGE,
    parseIsoLocalDate,
    parseFR,
    liquidityHistoricalAmount,
    buildMoneyManagementConsolidatedExportPayload,
    exportMoneyManagementPdf,
    exportMoneyManagementExcel,
  } = dependencies;
  const [filtreClient, setFiltreClient] = useState('');
  const [filtreMarche, setFiltreMarche] = useState('Tous');
  const [filtreType, setFiltreType] = useState('Tous');
  const [filtreProfil, setFiltreProfil] = useState('Tous');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [filtreEncoursMin, setFiltreEncoursMin] = useState('');
  const [filtreLiquiditeActuelleMin, setFiltreLiquiditeActuelleMin] =
    useState('');
  const [filtreEntrees30JMin, setFiltreEntrees30JMin] = useState('');
  const [filtreSorties30JMin, setFiltreSorties30JMin] = useState('');
  const [filtrePrevisionnelMin, setFiltrePrevisionnelMin] = useState('');
  const [dimensionLiquidite, setDimensionLiquidite] = useState<LiquidityDimension>('Devise');
  const [triFluxRevenus, setTriFluxRevenus] = useState<'asc' | 'desc'>('desc');
  const [clientLiquiditeSelectionneId, setClientLiquiditeSelectionneId] =
    useState(CLIENTS[0]?.id || '');
  const [vueLiquiditeDetail, setVueLiquiditeDetail] = useState<LiquidityDetailView>('origines');
  const [dateSituationLiquidite, setDateSituationLiquidite] =
    useState('2026-08-07');

  const SEUIL_ECART_LIQUIDITE = 3;
  const dateReferenceIso = '2026-08-07';
  const dateReference = parseIsoLocalDate(dateReferenceIso);
  const dateSituationObj = parseIsoLocalDate(dateSituationLiquidite);
  const finHorizon = new Date(dateReference);
  finHorizon.setDate(finHorizon.getDate() + 30);

  const formatDateFR = (date: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);

  const fluxDividendesCoupons = UPCOMING_CASHFLOWS.flatMap((flux) => {
    const dateFlux = parseFR(flux.echeance);
    if (dateFlux < dateReference || dateFlux > finHorizon) return [];

    const noms = flux.portefeuilles
      .split(',')
      .map((nom) => nom.trim())
      .filter(Boolean);
    const montantParPortefeuille =
      noms.length > 0 ? flux.montant / noms.length : 0;

    return noms
      .map((nom) => CLIENTS.find((client) => client.nom === nom))
      .filter((client): client is MoneyManagementClient => Boolean(client))
      .map((client) => ({
        id: `cashflow-${flux.titre}-${client.id}-${flux.echeance}`,
        clientId: client.id,
        client: client.nom,
        date: flux.echeance,
        dateObj: dateFlux,
        nature: flux.type,
        libelle: flux.titre,
        sens: 'Entrée',
        montant: montantParPortefeuille,
        devise: flux.devise,
        statut: 'Prévu',
      }));
  });

  const fluxOrdresOuverts = ORDERS.filter((ordre) =>
    ['En cours', 'En attente'].includes(ordre.statut)
  ).map((ordre, index) => {
    const client = CLIENTS.find((item) => item.nom === ordre.pf);
    const dateFlux = new Date(dateReference);
    dateFlux.setDate(dateFlux.getDate() + 2 + index);

    return {
      id: `ordre-${ordre.id}`,
      clientId: client?.id || null,
      client: ordre.pf,
      date: formatDateFR(dateFlux),
      dateObj: dateFlux,
      nature: "Règlement d'ordre",
      libelle: `${ordre.sens} ${ordre.titre}`,
      sens: ordre.sens === 'Achat' ? 'Sortie' : 'Entrée',
      montant: ordre.qte * ordre.prix,
      devise: ordre.devise,
      statut: ordre.statut,
    };
  });

  const flux30J = [...fluxDividendesCoupons, ...fluxOrdresOuverts].sort(
    (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
  );

  const synthesePortefeuilles = CLIENTS.map((client) => {
    const liquiditeActuelle =
      (client.encours * Number(client.alloc.Liquidité || 0)) / 100;
    const liquiditeCible =
      (client.encours * Number(client.cible.Liquidité || 0)) / 100;
    const fluxClient = flux30J.filter((flux) => flux.clientId === client.id);
    const encaissements30J = fluxClient
      .filter((flux) => flux.sens === 'Entrée')
      .reduce(
        (somme, flux) =>
          somme + convertCurrency(flux.montant, flux.devise, client.devise),
        0
      );
    const decaissements30J = fluxClient
      .filter((flux) => flux.sens === 'Sortie')
      .reduce(
        (somme, flux) =>
          somme + convertCurrency(flux.montant, flux.devise, client.devise),
        0
      );
    const liquiditePrevisionnelle =
      liquiditeActuelle + encaissements30J - decaissements30J;
    const ratioActuel = (liquiditeActuelle / client.encours) * 100;
    const ratioCible = Number(client.cible.Liquidité || 0);
    const ratioPrevisionnel = (liquiditePrevisionnelle / client.encours) * 100;
    const ecartPts = ratioPrevisionnel - ratioCible;

    let statut = 'Conforme';
    if (ecartPts < -SEUIL_ECART_LIQUIDITE) statut = 'Critique';
    else if (ecartPts < 0) statut = 'Sous cible';
    else if (ecartPts > SEUIL_ECART_LIQUIDITE) statut = 'Surplus';

    const montantVersCible = Math.abs(liquiditePrevisionnelle - liquiditeCible);
    const action =
      statut === 'Critique'
        ? 'Reconstituer rapidement la poche de liquidité'
        : statut === 'Sous cible'
        ? 'Sécuriser les prochains flux et réduire les décaissements non prioritaires'
        : statut === 'Surplus'
        ? "Réinvestir l'excédent selon l'allocation cible et les opportunités validées"
        : 'Maintenir la position et surveiller les échéances à 30 jours';

    return {
      client,
      liquiditeActuelle,
      liquiditeCible,
      liquiditePrevisionnelle,
      encaissements30J,
      decaissements30J,
      ratioActuel,
      ratioCible,
      ratioPrevisionnel,
      ecartPts,
      montantVersCible,
      statut,
      action,
    };
  });

  const marches = ['Tous', ...new Set(CLIENTS.map((client) => client.marche))];
  const types = [
    'Tous',
    ...new Set(
      CLIENTS.map((client) => PROFILE_TYPE_LABEL[client.type] || client.type)
    ),
  ];
  const profils = [
    'Tous',
    ...new Set(CLIENTS.map((client) => client.profilRisque)),
  ];
  const statuts = ['Tous', 'Critique', 'Sous cible', 'Conforme', 'Surplus'];

  const lignesFiltrees = synthesePortefeuilles.filter(
    ({
      client,
      statut,
      liquiditeActuelle,
      encaissements30J,
      decaissements30J,
      liquiditePrevisionnelle,
    }) => {
      const typeClient = PROFILE_TYPE_LABEL[client.type] || client.type;
      const encoursVue = convertCurrency(client.encours, client.devise, devise);
      const liquiditeActuelleVue = convertCurrency(
        liquiditeActuelle,
        client.devise,
        devise
      );

      const entrees30JVue = convertCurrency(
        encaissements30J,
        client.devise,
        devise
      );
      const sorties30JVue = convertCurrency(
        decaissements30J,
        client.devise,
        devise
      );
      const previsionnelVue = convertCurrency(
        liquiditePrevisionnelle,
        client.devise,
        devise
      );

      const seuilEncours =
        filtreEncoursMin === '' ? null : Number(filtreEncoursMin);
      const seuilLiquiditeActuelle =
        filtreLiquiditeActuelleMin === ''
          ? null
          : Number(filtreLiquiditeActuelleMin);
      const seuilEntrees30J =
        filtreEntrees30JMin === '' ? null : Number(filtreEntrees30JMin);
      const seuilSorties30J =
        filtreSorties30JMin === '' ? null : Number(filtreSorties30JMin);
      const seuilPrevisionnel =
        filtrePrevisionnelMin === '' ? null : Number(filtrePrevisionnelMin);

      return (
        client.nom.toLowerCase().includes(filtreClient.trim().toLowerCase()) &&
        (filtreMarche === 'Tous' || client.marche === filtreMarche) &&
        (filtreType === 'Tous' || typeClient === filtreType) &&
        (filtreProfil === 'Tous' || client.profilRisque === filtreProfil) &&
        (filtreStatut === 'Tous' || statut === filtreStatut) &&
        (seuilEncours === null || encoursVue > seuilEncours) &&
        (seuilLiquiditeActuelle === null ||
          liquiditeActuelleVue > seuilLiquiditeActuelle) &&
        (seuilEntrees30J === null || entrees30JVue > seuilEntrees30J) &&
        (seuilSorties30J === null || sorties30JVue > seuilSorties30J) &&
        (seuilPrevisionnel === null || previsionnelVue > seuilPrevisionnel)
      );
    }
  );

  const clientsFiltresIds = new Set(
    lignesFiltrees.map(({ client }) => client.id)
  );
  const fluxFiltres = flux30J.filter(
    (flux) => flux.clientId !== null && clientsFiltresIds.has(flux.clientId)
  );

  const fluxRevenusFiltres = fluxFiltres.filter((flux) =>
    ['Dividende', 'Coupon'].includes(flux.nature)
  );

  const pointsRevenusPortefeuilles: MoneyRevenuePoint[] = fluxRevenusFiltres.map((flux) => ({
    x: Math.max(0, Math.round((flux.dateObj.getTime() - dateReference.getTime()) / 86_400_000)),
    y: flux.client,
    titre: flux.libelle,
    type: flux.nature,
    montant: flux.montant,
    devise: flux.devise,
    echeance: flux.date,
  }));

  const revenusGenerauxParEvenement: Record<string, MoneyRevenuePoint> = {};
  fluxRevenusFiltres.forEach((flux) => {
    const cle = `${flux.nature}-${flux.libelle}-${flux.date}`;
    if (!revenusGenerauxParEvenement[cle]) {
      revenusGenerauxParEvenement[cle] = {
        x: Math.max(0, Math.round((flux.dateObj.getTime() - dateReference.getTime()) / 86_400_000)),
        y: 'Général',
        titre: flux.libelle,
        type: flux.nature,
        montant: 0,
        devise,
        echeance: flux.date,
      };
    }
    revenusGenerauxParEvenement[cle].montant += convertCurrency(
      flux.montant,
      flux.devise,
      devise
    );
  });

  const pointsRevenus = [
    ...pointsRevenusPortefeuilles,
    ...Object.values(revenusGenerauxParEvenement),
  ];
  const dividendePointsMoney = pointsRevenus.filter(
    (point) => point.type === 'Dividende'
  );
  const couponPointsMoney = pointsRevenus.filter(
    (point) => point.type === 'Coupon'
  );

  const totalRevenus30J = fluxRevenusFiltres.reduce(
    (somme, flux) => somme + convertCurrency(flux.montant, flux.devise, devise),
    0
  );
  const revenusParPortefeuille = fluxRevenusFiltres.reduce<Record<string, number>>((acc, flux) => {
    acc[flux.client] =
      (acc[flux.client] || 0) +
      convertCurrency(flux.montant, flux.devise, devise);
    return acc;
  }, {});
  const lignesRevenusTriees = Object.entries(revenusParPortefeuille).sort(
    (a, b) => (triFluxRevenus === 'desc' ? b[1] - a[1] : a[1] - b[1])
  );

  const totalEncours = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(ligne.client.encours, ligne.client.devise, devise),
    0
  );
  const totalLiquiditeActuelle = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(ligne.liquiditeActuelle, ligne.client.devise, devise),
    0
  );
  const totalLiquiditePrevisionnelle = lignesFiltrees.reduce(
    (somme, ligne) =>
      somme +
      convertCurrency(
        ligne.liquiditePrevisionnelle,
        ligne.client.devise,
        devise
      ),
    0
  );
  const totalEntrees30J = fluxFiltres
    .filter((flux) => flux.sens === 'Entrée')
    .reduce(
      (somme, flux) =>
        somme + convertCurrency(flux.montant, flux.devise, devise),
      0
    );
  const totalSorties30J = fluxFiltres
    .filter((flux) => flux.sens === 'Sortie')
    .reduce(
      (somme, flux) =>
        somme + convertCurrency(flux.montant, flux.devise, devise),
      0
    );
  const ratioLiquiditeGlobal =
    totalEncours > 0 ? (totalLiquiditeActuelle / totalEncours) * 100 : 0;
  const ratioLiquiditePrevisionnel =
    totalEncours > 0 ? (totalLiquiditePrevisionnelle / totalEncours) * 100 : 0;
  const portefeuillesSousCible = lignesFiltrees.filter((ligne) =>
    ['Critique', 'Sous cible'].includes(ligne.statut)
  ).length;

  const filtresActifs =
    Number(Boolean(filtreClient.trim())) +
    Number(filtreMarche !== 'Tous') +
    Number(filtreType !== 'Tous') +
    Number(filtreProfil !== 'Tous') +
    Number(filtreStatut !== 'Tous') +
    Number(filtreEncoursMin !== '') +
    Number(filtreLiquiditeActuelleMin !== '') +
    Number(filtreEntrees30JMin !== '') +
    Number(filtreSorties30JMin !== '') +
    Number(filtrePrevisionnelMin !== '');

  const reinitialiserFiltres = () => {
    setFiltreClient('');
    setFiltreMarche('Tous');
    setFiltreType('Tous');
    setFiltreProfil('Tous');
    setFiltreStatut('Tous');
    setFiltreEncoursMin('');
    setFiltreLiquiditeActuelleMin('');
    setFiltreEntrees30JMin('');
    setFiltreSorties30JMin('');
    setFiltrePrevisionnelMin('');
  };


  const toneStatut = (statut: string): BadgeTone => {
    if (statut === 'Critique') return 'coral';
    if (statut === 'Sous cible') return 'gold';
    if (statut === 'Surplus') return 'navy';
    return 'teal';
  };

  const regroupementLiquidite = (() => {
    const map: Record<string, number> = {};
    lignesFiltrees.forEach((ligne) => {
      const client = ligne.client;
      const cle =
        dimensionLiquidite === 'Devise'
          ? client.devise
          : dimensionLiquidite === 'Marché'
          ? client.marche
          : dimensionLiquidite === 'Profil de risque'
          ? client.profilRisque
          : PROFILE_TYPE_LABEL[client.type] || client.type;
      const montant = convertCurrency(
        ligne.liquiditeActuelle,
        client.devise,
        devise
      );
      map[cle] = (map[cle] || 0) + montant;
    });
    const total = Object.values(map).reduce(
      (somme, montant) => somme + montant,
      0
    );
    return Object.entries(map)
      .map(([name, montant]) => ({
        name,
        montant,
        devise,
        value: total > 0 ? Math.round((montant / total) * 100) : 0,
      }))
      .sort((a, b) => b.montant - a.montant);
  })();

  const repartitionMontants = <T extends WeightedDefinition>(
    total: number,
    definitions: T[]
  ): Array<T & { montant: number }> => {
    let cumule = 0;
    return definitions.map((definition, index) => {
      const dernier = index === definitions.length - 1;
      const montant = dernier
        ? Math.max(0, total - cumule)
        : Math.round((total * definition.poids) / 100);
      cumule += montant;
      return { ...definition, montant };
    });
  };

  const detailLiquiditeParClient = synthesePortefeuilles.map((ligne, index) => {
    const client = ligne.client;
    const total = liquidityHistoricalAmount(
      ligne.liquiditeActuelle,
      `${client.id}-liquidite`,
      dateSituationObj,
      dateReference,
      1
    );
    const encaissementsSituation = liquidityHistoricalAmount(
      ligne.encaissements30J,
      `${client.id}-entrees`,
      dateSituationObj,
      dateReference,
      0.55
    );
    const decaissementsSituation = liquidityHistoricalAmount(
      ligne.decaissements30J,
      `${client.id}-sorties`,
      dateSituationObj,
      dateReference,
      0.7
    );
    const liquiditePrevisionnelleSituation =
      total + encaissementsSituation - decaissementsSituation;
    const ratioActuelSituation =
      client.encours > 0 ? (total / client.encours) * 100 : 0;
    const ratioPrevisionnelSituation =
      client.encours > 0
        ? (liquiditePrevisionnelleSituation / client.encours) * 100
        : 0;
    const ecartPtsSituation = ratioPrevisionnelSituation - ligne.ratioCible;
    let statutSituation = 'Conforme';
    if (ecartPtsSituation < -SEUIL_ECART_LIQUIDITE)
      statutSituation = 'Critique';
    else if (ecartPtsSituation < 0) statutSituation = 'Sous cible';
    else if (ecartPtsSituation > SEUIL_ECART_LIQUIDITE)
      statutSituation = 'Surplus';

    const decalageDepot = 6 + (index % 17);
    const dateDernierDepot = new Date(dateSituationObj);
    dateDernierDepot.setDate(dateDernierDepot.getDate() - decalageDepot);

    const origines = repartitionMontants(total, [
      {
        numero: '1',
        libelle: 'Dépôt d’ouverture',
        description:
          'Liquidité issue de l’ouverture récente du compte / premier investissement.',
        responsable: 'Chargé de clientèle',
        poids: 8,
      },
      {
        numero: '2',
        libelle: 'Dernier dépôt',
        description:
          'Dernier versement enregistré hors opportunité spécifique.',
        responsable: 'Système',
        poids: 18,
      },
      {
        numero: '3',
        libelle: 'Amortissements ESV',
        description:
          'Capital remboursé sur les titres détenus arrivant à échéance partielle ou totale.',
        responsable: 'Système',
        poids: 16,
      },
      {
        numero: '4',
        libelle: 'Intérêts / coupons ESV',
        description: 'Intérêts encaissés sur les titres détenus.',
        responsable: 'Système',
        poids: 8,
      },
      {
        numero: '5',
        libelle: 'Dividendes',
        description:
          'Liquidité provenant des dividendes crédités sur le compte.',
        responsable: 'Système',
        poids: 12,
      },
      {
        numero: '6',
        libelle: 'Cession de titre — retrait',
        description:
          'Produit de cession destiné à un retrait demandé par le client.',
        responsable: 'Gestionnaire de portefeuille',
        poids: 8,
      },
      {
        numero: '7',
        libelle: 'Cession de titre — réinvestissement',
        description: 'Produit de cession destiné à être réinvesti.',
        responsable: 'Gestionnaire de portefeuille',
        poids: 18,
      },
      {
        numero: '8',
        libelle: 'Part à ne pas réinvestir',
        description:
          'Montant que le client demande de conserver durablement en espèces.',
        responsable: 'Chargé de clientèle',
        poids: 4,
      },
      {
        numero: '9',
        libelle: 'Dépôt pour opération primaire',
        description:
          'Dépôt réalisé pour une opportunité spécifique sur le marché primaire.',
        responsable: 'Chargé de clientèle',
        poids: 8,
      },
    ]);

    const affectations = repartitionMontants(total, [
      {
        numero: '11',
        libelle: 'Retrait en cours',
        groupe: 'Bloquée / réservée',
        responsable: 'Chargé de clientèle / Trésorerie',
        poids: 7,
      },
      {
        numero: '12',
        libelle: 'Autre liquidité à investir',

        groupe: 'À investir',
        responsable: 'Système',
        poids: 18,
      },
      {
        numero: '13',
        libelle: 'Achat marché monétaire — OAT',
        groupe: 'Bloquée / réservée',
        responsable: 'Gestionnaire de portefeuille',
        poids: 8,
      },
      {
        numero: '14',
        libelle: 'Achat marché monétaire — BAT',
        groupe: 'Bloquée / réservée',
        responsable: 'Gestionnaire de portefeuille',
        poids: 7,
      },
      {
        numero: '15',
        libelle: 'Achat marché financier — OPV / APE',
        groupe: 'Bloquée / réservée',
        responsable: 'Gestionnaire de portefeuille',
        poids: 10,
      },
      {
        numero: '16',
        libelle: 'Achat marché financier — Actions',
        groupe: 'Bloquée / réservée',
        responsable: 'Gestionnaire de portefeuille',
        poids: 12,
      },
      {
        numero: '17',
        libelle: 'ESV — Amortissements bloqués',
        groupe: 'Bloquée / réservée',
        responsable: 'Chargé de clientèle',
        poids: 6,
      },
      {
        numero: '18',
        libelle: 'ESV — Intérêts bloqués',
        groupe: 'Bloquée / réservée',
        responsable: 'Chargé de clientèle',
        poids: 5,
      },
      {
        numero: '19',
        libelle: 'ESV — Dividendes bloqués',
        groupe: 'Bloquée / réservée',
        responsable: 'Chargé de clientèle',
        poids: 4,
      },
      {
        numero: '20',
        libelle: 'Ne pas réinvestir',
        groupe: 'Bloquée / réservée',
        responsable: 'Chargé de clientèle',
        poids: 5,
      },
      {
        numero: '21',
        libelle: 'Liquidité disponible',
        groupe: 'Disponible',
        responsable: 'Système',
        poids: 18,
      },
    ]);

    const sommeGroupe = (groupe: string) =>
      affectations
        .filter((item) => item.groupe === groupe)
        .reduce((somme: number, item) => somme + item.montant, 0);

    const actionsActuelles = Number(client.alloc.Actions || 0);
    const actionsCibles = Number(client.cible.Actions || 0);
    const obligationsActuelles =
      Number(client.alloc['Obl. souveraines'] || 0) +
      Number(client.alloc['Obl. privées'] || 0);
    const obligationsCibles =
      Number(client.cible['Obl. souveraines'] || 0) +
      Number(client.cible['Obl. privées'] || 0);
    const ecartActions = actionsCibles - actionsActuelles;
    const ecartObligations = obligationsCibles - obligationsActuelles;

    return {
      ...ligne,
      dateSituation: formatDateFR(dateSituationObj),
      liquiditeActuelle: total,
      encaissements30J: encaissementsSituation,
      decaissements30J: decaissementsSituation,
      liquiditePrevisionnelle: liquiditePrevisionnelleSituation,
      ratioActuel: ratioActuelSituation,
      ratioPrevisionnel: ratioPrevisionnelSituation,
      ecartPts: ecartPtsSituation,
      statut: statutSituation,
      dateDernierDepot: formatDateFR(dateDernierDepot),
      montantDernierDepot:
        origines.find((item) => item.numero === '2')?.montant || 0,
      origines,
      affectations,
      totalOrigines: origines.reduce((somme, item) => somme + item.montant, 0),
      liquiditeBloquee: sommeGroupe('Bloquée / réservée'),
      autreLiquiditeAInvestir: sommeGroupe('À investir'),
      liquiditeDisponibleNette: sommeGroupe('Disponible'),
      ecartActions,
      ecartObligations,
      montantCorrectionActions: Math.round(
        (client.encours * Math.abs(ecartActions)) / 100
      ),
      montantCorrectionObligations: Math.round(
        (client.encours * Math.abs(ecartObligations)) / 100
      ),
      rendement: Number(client.rentabilite || 0),
    };
  });

  const detailsFiltres = detailLiquiditeParClient.filter((detail) =>
    clientsFiltresIds.has(detail.client.id)
  );
  const detailLiquiditeSelectionne =
    detailsFiltres.find(
      (detail) => detail.client.id === clientLiquiditeSelectionneId
    ) ||
    detailsFiltres[0] ||
    null;

  const payloadExportLiquiditeComptesGeres =
    buildMoneyManagementConsolidatedExportPayload(detailLiquiditeParClient);

  const roleTone = (responsable: string): BadgeTone => {
    if (responsable.includes('Gestionnaire')) return 'navy';
    if (responsable.includes('Chargé')) return 'gold';
    if (responsable.includes('Trésorerie')) return 'coral';
    return 'teal';
  };

  const actionsLiquidite = lignesFiltrees
    .filter((ligne) => ligne.statut !== 'Conforme')
    .sort((a, b) => {
      const ordre: Record<string, number> = { Critique: 0, 'Sous cible': 1, Surplus: 2 };
      return (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9);
    });

  const filtresMontantsMoneyManagement = [
    {
      key: 'encours',
      label: 'Encours (supérieur à)',
      value: filtreEncoursMin,
      setter: setFiltreEncoursMin,
    },
    {
      key: 'liquidite-actuelle',
      label: 'Liquidité actuelle (supérieur à)',
      value: filtreLiquiditeActuelleMin,
      setter: setFiltreLiquiditeActuelleMin,
    },
    {
      key: 'entrees-30j',
      label: 'Entrées 30 j (supérieur à)',
      value: filtreEntrees30JMin,
      setter: setFiltreEntrees30JMin,
    },
    {
      key: 'sorties-30j',
      label: 'Sorties 30 j (supérieur à)',
      value: filtreSorties30JMin,
      setter: setFiltreSorties30JMin,
    },
    {
      key: 'previsionnel',
      label: 'Liquidité prévisionnelle (supérieur à)',
      value: filtrePrevisionnelMin,
      setter: setFiltrePrevisionnelMin,
    },
  ];

  return (
    <div className="gsm-native-moneymanagement-831dff55e">
      <MoneyManagementFiltersHeader

        currency={devise}
        clientQuery={filtreClient}
        market={filtreMarche}
        type={filtreType}
        riskProfile={filtreProfil}
        status={filtreStatut}
        markets={marches}
        types={types}
        riskProfiles={profils}
        statuses={statuts}
        amountFilters={filtresMontantsMoneyManagement}
        activeFilterCount={filtresActifs}
        filteredPortfolioCount={lignesFiltrees.length}
        onClientQueryChange={setFiltreClient}
        onMarketChange={setFiltreMarche}
        onTypeChange={setFiltreType}
        onRiskProfileChange={setFiltreProfil}
        onStatusChange={setFiltreStatut}
        onReset={reinitialiserFiltres}
      />
      <MoneyManagementSummary
        currency={devise}
        totalLiquidity={totalLiquiditeActuelle}
        liquidityRatio={ratioLiquiditeGlobal}
        totalEntries30d={totalEntrees30J}
        totalExits30d={totalSorties30J}
        forecastLiquidity={totalLiquiditePrevisionnelle}
        forecastLiquidityRatio={ratioLiquiditePrevisionnel}
        portfoliosBelowTarget={portefeuillesSousCible}
      />
      <MoneyManagementLiquidityAnatomy
        currency={devise}
        minDate={LIQUIDITY_HISTORY_MIN_DATE}
        maxDate={dateReferenceIso}
        situationDate={dateSituationLiquidite}
        situationLabel={formatDateFR(dateSituationObj)}
        accountCount={detailLiquiditeParClient.length}
        filteredDetails={detailsFiltres}
        selectedDetail={detailLiquiditeSelectionne}
        view={vueLiquiditeDetail}
        canExport={Boolean(payloadExportLiquiditeComptesGeres?.rows?.length)}
        statusTone={toneStatut}
        roleTone={roleTone}
        onSituationDateChange={setDateSituationLiquidite}
        onUseCurrentSituation={() => setDateSituationLiquidite(dateReferenceIso)}
        onSelectClient={setClientLiquiditeSelectionneId}
        onViewChange={setVueLiquiditeDetail}
        onExportPdf={() => exportMoneyManagementPdf(payloadExportLiquiditeComptesGeres)}
        onExportExcel={() => exportMoneyManagementExcel(payloadExportLiquiditeComptesGeres)}
      />

      <MoneyManagementPortfolioPositions
        rows={lignesFiltrees}
        profileTypeLabel={PROFILE_TYPE_LABEL}
        statusTone={toneStatut}
        onOpenClient={(clientId) => go('client', { clientId })}
      />
      <MoneyManagementCashflowSection
        currency={devise}
        cashflows={fluxFiltres}
        totalEntries={totalEntrees30J}
        totalExits={totalSorties30J}
        revenuePoints={pointsRevenus}
        dividendPoints={dividendePointsMoney}
        couponPoints={couponPointsMoney}
        totalRevenue={totalRevenus30J}
        sortedRevenueRows={lignesRevenusTriees}
        sortDirection={triFluxRevenus}
        onSortDirectionChange={setTriFluxRevenus}
      />
      <MoneyManagementLiquidityBreakdown
        dimension={dimensionLiquidite}
        data={regroupementLiquidite}
        onDimensionChange={setDimensionLiquidite}
      />
      <MoneyManagementLiquidityActions
        currency={devise}
        rows={actionsLiquidite}
        rebalanceThreshold={SEUIL_REEQUILIBRAGE}
        statusTone={toneStatut}
        onOpenClient={(clientId) => go('client', { clientId })}
        onRebalance={(clientId) =>
          go('reequilibrage', {
            client: clientId,
            actif: 'Liquidité',
          })
        }
      />
    </div>
  );
}

