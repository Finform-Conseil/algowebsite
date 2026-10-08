import { FX, toRef } from '../../shared/lib/finance';
import { liquidityHistorySeed } from '../money-management/LiquidityInfrastructure';

const VOLUME_JOUR = [
  { marche: 'BRVM', type: 'Action', volume: 1_250_000_000, devise: 'XOF' },
  { marche: 'BRVM', type: 'Obligation', volume: 430_000_000, devise: 'XOF' },
  { marche: 'NGX', type: 'Action', volume: 680_000_000, devise: 'NGN' },
  { marche: 'NGX', type: 'Obligation', volume: 150_000_000, devise: 'NGN' },
  { marche: 'GSE', type: 'Action', volume: 9_500_000, devise: 'GHS' },
  { marche: 'GSE', type: 'Obligation', volume: 2_100_000, devise: 'GHS' },
];

const CLIENTS_ORIGINAUX = [
  {
    id: 'c1',
    pays: "Côte d'Ivoire",
    dateEntree: '2024-06-15',
    nom: 'Aïcha Koné',
    type: 'Privé',
    marche: 'BRVM',
    devise: 'XOF',
    encours: 245_000_000,
    perf: 3.2,
    risque: 'Modéré',
    alertes: 1,
    profilRisque: 'Équilibré',
    rentabilite: 2.8,
    alloc: {
      Actions: 48,
      'Obl. souveraines': 22,
      'Obl. privées': 18,
      Liquidité: 12,
    },
    cible: {
      Actions: 40,
      'Obl. souveraines': 28,
      'Obl. privées': 20,
      Liquidité: 12,
    },
  },
  {
    id: 'c2',
    pays: "Côte d'Ivoire",
    dateEntree: '2024-03-01',
    nom: 'Fonds Prévoyance CI',
    type: 'Institutionnel',
    marche: 'BRVM',
    devise: 'XOF',
    encours: 1_850_000_000,
    perf: 1.8,
    risque: 'Faible',
    alertes: 0,
    profilRisque: 'Prudence',
    rentabilite: 1.6,
    alloc: {
      Actions: 25,
      'Obl. souveraines': 45,
      'Obl. privées': 20,
      Liquidité: 10,
    },
    cible: {
      Actions: 25,
      'Obl. souveraines': 45,
      'Obl. privées': 20,
      Liquidité: 10,
    },
  },
  {
    id: 'c3',
    pays: 'Nigeria',
    dateEntree: '2024-07-10',
    nom: 'Emeka Okafor',
    type: 'Privé',
    marche: 'NGX',
    devise: 'NGN',
    encours: 380_000_000,
    perf: -1.4,
    risque: 'Élevé',
    alertes: 2,
    profilRisque: 'Performance',
    rentabilite: -1.9,
    alloc: {
      Actions: 61,
      'Obl. souveraines': 12,
      'Obl. privées': 15,
      Liquidité: 12,
    },
    cible: {
      Actions: 45,
      'Obl. souveraines': 20,
      'Obl. privées': 25,
      Liquidité: 10,
    },
  },
  {
    id: 'c4',
    pays: 'Sénégal',
    dateEntree: '2024-05-20',
    nom: 'Groupe Assurance Sahel',
    type: 'Institutionnel',
    marche: 'BRVM',
    devise: 'XOF',
    encours: 920_000_000,
    perf: 2.1,
    risque: 'Modéré',
    alertes: 1,
    profilRisque: 'Prudence',
    rentabilite: 1.9,
    alloc: {
      Actions: 30,
      'Obl. souveraines': 38,
      'Obl. privées': 22,
      Liquidité: 10,
    },
    cible: {
      Actions: 30,
      'Obl. souveraines': 30,
      'Obl. privées': 25,
      Liquidité: 15,
    },
  },
  {
    id: 'c5',
    pays: 'Ghana',
    dateEntree: '2024-08-05',
    nom: 'Ama Boateng',
    type: 'Privé',
    marche: 'GSE',
    devise: 'GHS',
    encours: 1_250_000,
    perf: 4.6,
    risque: 'Modéré',
    alertes: 0,
    profilRisque: 'Croissance',
    rentabilite: 4.1,
    alloc: {
      Actions: 44,
      'Obl. souveraines': 26,
      'Obl. privées': 18,
      Liquidité: 12,
    },
    cible: {
      Actions: 40,
      'Obl. souveraines': 30,
      'Obl. privées': 20,
      Liquidité: 10,
    },
  },
  {
    id: 'c6',
    pays: 'Nigeria',
    dateEntree: '2024-02-12',
    nom: 'Caisse Retraite Littoral',
    type: 'Institutionnel',
    marche: 'NGX',
    devise: 'NGN',
    encours: 2_400_000_000,
    perf: 0.6,
    risque: 'Faible',
    alertes: 1,
    profilRisque: 'Sérénité',
    rentabilite: 0.5,
    alloc: {
      Actions: 18,
      'Obl. souveraines': 52,
      'Obl. privées': 20,
      Liquidité: 10,
    },
    cible: {
      Actions: 20,
      'Obl. souveraines': 50,
      'Obl. privées': 22,
      Liquidité: 8,
    },
  },
];

const PROFILS_PORTEFEUILLES_MODELES = {
  Équilibré: {
    risque: 'Modéré',
    perf: 2.7,
    rentabilite: 2.5,
    cible: {
      Actions: 40,
      'Obl. souveraines': 28,
      'Obl. privées': 20,
      Liquidité: 12,
    },
  },
  Prudence: {
    risque: 'Faible',
    perf: 1.5,
    rentabilite: 1.6,
    cible: {
      Actions: 25,
      'Obl. souveraines': 45,
      'Obl. privées': 20,
      Liquidité: 10,
    },
  },
  Performance: {
    risque: 'Élevé',
    perf: 4.4,    rentabilite: 4.0,
    cible: {
      Actions: 55,
      'Obl. souveraines': 15,
      'Obl. privées': 20,
      Liquidité: 10,
    },
  },
  Croissance: {
    risque: 'Modéré',
    perf: 3.7,
    rentabilite: 3.5,
    cible: {
      Actions: 50,
      'Obl. souveraines': 20,
      'Obl. privées': 20,
      Liquidité: 10,
    },
  },
  Sérénité: {
    risque: 'Faible',
    perf: 1.0,
    rentabilite: 1.1,
    cible: {
      Actions: 20,
      'Obl. souveraines': 50,
      'Obl. privées': 22,
      Liquidité: 8,
    },
  },
};

const DEVISE_PAR_MARCHE = { BRVM: 'XOF', NGX: 'NGN', GSE: 'GHS' };

const PORTEFEUILLES_GENERES_SPECS = [
  // T4 2024
  {
    id: 'c7',
    nom: 'Mariam Traoré',
    profilRisque: 'Équilibré',
    type: 'Privé',
    marche: 'BRVM',
    pays: 'Sénégal',
    encours: 310_000_000,
    dateEntree: '2024-10-15',
  },
  {
    id: 'c8',
    nom: 'Tunde Adebayo',
    profilRisque: 'Performance',
    type: 'Privé',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 620_000_000,
    dateEntree: '2024-11-12',
  },
  {
    id: 'c9',
    nom: 'Adwoa Kwarteng',
    profilRisque: 'Croissance',
    type: 'Privé',
    marche: 'GSE',
    pays: 'Ghana',
    encours: 2_200_000,
    dateEntree: '2024-12-05',
  },
  // T1 2025
  {
    id: 'c10',
    nom: 'Fonds Retraite UEMOA',
    profilRisque: 'Sérénité',
    type: 'Institutionnel',
    marche: 'BRVM',
    pays: 'Sénégal',
    encours: 2_100_000_000,
    dateEntree: '2025-01-20',
  },
  {
    id: 'c11',
    nom: 'Mutuelle Horizon CI',
    profilRisque: 'Prudence',
    type: 'Institutionnel',
    marche: 'BRVM',
    pays: "Côte d'Ivoire",
    encours: 1_350_000_000,
    dateEntree: '2025-02-14',
  },
  {
    id: 'c12',
    nom: "Koffi N'Dri",
    profilRisque: 'Équilibré',
    type: 'Privé',
    marche: 'BRVM',
    pays: "Côte d'Ivoire",
    encours: 420_000_000,
    dateEntree: '2025-03-07',
  },
  // T2 2025
  {
    id: 'c13',
    nom: 'Nneka Obi',
    profilRisque: 'Performance',
    type: 'Privé',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 540_000_000,
    dateEntree: '2025-04-18',
  },
  {
    id: 'c14',
    nom: 'Kwame Asare',
    profilRisque: 'Croissance',
    type: 'Privé',
    marche: 'GSE',
    pays: 'Ghana',
    encours: 1_800_000,
    dateEntree: '2025-05-10',
  },
  {
    id: 'c15',
    nom: 'Pension Fund Lagos',
    profilRisque: 'Sérénité',
    type: 'Institutionnel',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 3_100_000_000,
    dateEntree: '2025-06-21',
  },
  // T3 2025
  {
    id: 'c16',
    nom: 'Pension Trust Accra',
    profilRisque: 'Prudence',
    type: 'Institutionnel',
    marche: 'GSE',
    pays: 'Ghana',
    encours: 18_000_000,
    dateEntree: '2025-07-11',
  },
  {
    id: 'c17',
    nom: 'Adjoa Mensah',
    profilRisque: 'Équilibré',
    type: 'Privé',
    marche: 'GSE',
    pays: 'Ghana',
    encours: 2_600_000,
    dateEntree: '2025-08-08',
  },
  {
    id: 'c18',
    nom: 'Ibrahim Diallo',
    profilRisque: 'Performance',
    type: 'Privé',
    marche: 'BRVM',
    pays: "Côte d'Ivoire",
    encours: 360_000_000,
    dateEntree: '2025-09-16',
  },
  // T4 2025
  {
    id: 'c19',
    nom: 'Binta Sow',
    profilRisque: 'Croissance',
    type: 'Privé',
    marche: 'BRVM',
    pays: 'Sénégal',
    encours: 275_000_000,
    dateEntree: '2025-10-06',
  },
  {
    id: 'c20',
    nom: 'Assurance Vie Atlantique',
    profilRisque: 'Sérénité',
    type: 'Institutionnel',
    marche: 'BRVM',
    pays: "Côte d'Ivoire",
    encours: 1_700_000_000,
    dateEntree: '2025-11-13',
  },
  {
    id: 'c21',
    nom: 'Caisse Sociale Atlantique',
    profilRisque: 'Prudence',
    type: 'Institutionnel',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 2_800_000_000,
    dateEntree: '2025-12-09',
  },
  // T1 2026
  {
    id: 'c22',
    nom: 'Chinedu Eze',
    profilRisque: 'Équilibré',
    type: 'Privé',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 710_000_000,
    dateEntree: '2026-01-17',  },
  {
    id: 'c23',
    nom: 'Yao Kouassi',
    profilRisque: 'Performance',
    type: 'Privé',
    marche: 'BRVM',
    pays: "Côte d'Ivoire",
    encours: 295_000_000,
    dateEntree: '2026-02-06',
  },
  {
    id: 'c24',
    nom: 'Segun Balogun',
    profilRisque: 'Croissance',
    type: 'Privé',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 810_000_000,
    dateEntree: '2026-03-22',
  },
  // T2 2026
  {
    id: 'c25',
    nom: 'Caisse Patrimoine Ghana',
    profilRisque: 'Sérénité',
    type: 'Institutionnel',
    marche: 'GSE',
    pays: 'Ghana',
    encours: 22_000_000,
    dateEntree: '2026-04-09',
  },
  {
    id: 'c26',
    nom: 'Fondation Patrimoine Afrique',
    profilRisque: 'Prudence',
    type: 'Institutionnel',
    marche: 'BRVM',
    pays: 'Sénégal',
    encours: 1_150_000_000,
    dateEntree: '2026-05-18',
  },
  {
    id: 'c27',
    nom: 'Fatou Ndiaye',
    profilRisque: 'Équilibré',
    type: 'Privé',
    marche: 'BRVM',
    pays: 'Sénégal',
    encours: 260_000_000,
    dateEntree: '2026-06-25',
  },
  // T3 2026
  {
    id: 'c28',
    nom: 'Akosua Owusu',
    profilRisque: 'Performance',
    type: 'Privé',
    marche: 'GSE',
    pays: 'Ghana',
    encours: 3_000_000,
    dateEntree: '2026-07-08',
  },
  {
    id: 'c29',
    nom: 'Chiamaka Nwosu',
    profilRisque: 'Croissance',
    type: 'Privé',
    marche: 'NGX',
    pays: 'Nigeria',
    encours: 690_000_000,
    dateEntree: '2026-07-23',
  },
  {
    id: 'c30',
    nom: 'Fondation Épargne Sahel',
    profilRisque: 'Sérénité',
    type: 'Institutionnel',
    marche: 'BRVM',
    pays: 'Sénégal',
    encours: 980_000_000,
    dateEntree: '2026-08-03',
  },
];

const construirePortefeuilleGenere = (spec, index) => {
  const modele = PROFILS_PORTEFEUILLES_MODELES[spec.profilRisque];
  const deltaActions = [-4, -2, 0, 2, 4][index % 5];
  const deltaLiquidite = [-2, 0, 2, 0, -1][index % 5];
  const actions = modele.cible.Actions + deltaActions;
  const souveraines =
    modele.cible['Obl. souveraines'] - Math.round(deltaActions / 2);
  const liquidite = modele.cible.Liquidité + deltaLiquidite;
  const privees = 100 - actions - souveraines - liquidite;
  const decalagePerformance = [-0.8, -0.4, 0, 0.4, 0.8][index % 5];
  const decalageRendement = [-0.6, -0.3, 0, 0.3, 0.6][index % 5];

  return {
    ...spec,
    devise: DEVISE_PAR_MARCHE[spec.marche],
    perf: Number((modele.perf + decalagePerformance).toFixed(1)),
    risque: modele.risque,
    alertes: 0,
    rentabilite: Number((modele.rentabilite + decalageRendement).toFixed(1)),
    alloc: {
      Actions: actions,
      'Obl. souveraines': souveraines,
      'Obl. privées': privees,
      Liquidité: liquidite,
    },
    cible: { ...modele.cible },
  };
};

const CLIENTS_GENERES = PORTEFEUILLES_GENERES_SPECS.map(
  construirePortefeuilleGenere
);

/*
 * PORTEFEUILLES MULTI-DEVISES
 *
 * `devise` reste la devise de référence / de tenue du portefeuille.
 * `expositionsDevises` représente la répartition des investissements par
 * devise. Chaque portefeuille détient volontairement plusieurs devises afin
 * que l'analyse d'exposition puisse être faite portefeuille par portefeuille.
 *
 * La génération est déterministe : un même portefeuille conserve toujours la
 * même ventilation à chaque rendu de la maquette.
 */
const DEVISES_INVESTISSEMENT = Object.keys(FX);

const construireExpositionsDevises = (client, index) => {
  const deviseReference = client.devise;
  const autresDevises = DEVISES_INVESTISSEMENT.filter(
    (devise) => devise !== deviseReference
  );

  if (autresDevises.length === 0) {
    return { [deviseReference]: 100 };
  }

  const seed = liquidityHistorySeed(
    `${client.id}-${client.nom}-${client.marche}-${index}`
  );

  // Entre 48 % et 60 % de l'encours reste dans la devise de référence.
  const poidsReference = 48 + (seed % 4) * 4;
  const reste = 100 - poidsReference;

  // Deux ou trois devises étrangères sont retenues de manière déterministe.
  const nombreDevisesEtrangeres = Math.min(
    autresDevises.length,
    2 + (seed % 2)
  );
  const devisesEtrangeres = [];

  for (
    let offset = 0;
    devisesEtrangeres.length < nombreDevisesEtrangeres &&
    offset < autresDevises.length * 3;
    offset += 1
  ) {
    const candidate =
      autresDevises[(seed + offset * 2 + index) % autresDevises.length];

    if (!devisesEtrangeres.includes(candidate)) {
      devisesEtrangeres.push(candidate);
    }
  }

  const repartition = {
    [deviseReference]: poidsReference,
  };

  if (devisesEtrangeres.length === 1) {
    repartition[devisesEtrangeres[0]] = reste;
  } else if (devisesEtrangeres.length === 2) {
    const premier = Math.round(reste * 0.62);
    repartition[devisesEtrangeres[0]] = premier;
    repartition[devisesEtrangeres[1]] = reste - premier;
  } else {
    const premier = Math.round(reste * 0.5);
    const deuxieme = Math.round(reste * 0.3);
    repartition[devisesEtrangeres[0]] = premier;
    repartition[devisesEtrangeres[1]] = deuxieme;
    repartition[devisesEtrangeres[2]] = reste - premier - deuxieme;
  }

  return repartition;
};

const CLIENTS_BRUTS = [...CLIENTS_ORIGINAUX, ...CLIENTS_GENERES];

let CLIENTS = CLIENTS_BRUTS.map((client, index) => ({
  ...client,
  expositionsDevises: construireExpositionsDevises(client, index),
}));

const PROFILE_TYPE_LABEL = {
  Privé: 'Particulier',  Institutionnel: 'Institutionnel',
};
const PAYS_MARCHE = {
  "Côte d'Ivoire": 'BRVM',
  Sénégal: 'BRVM',
  Nigeria: 'NGX',
  Ghana: 'GSE',
};
const TITRE_SECTEUR = {
  SONATEL: 'Télécoms',
  'ECOBANK CI': 'Banques',
  'MTN NIGERIA': 'Télécoms',
  'ZENITH BANK': 'Banques',
  'GCB BANK': 'Banques',
  PALMCI: 'Agro-industrie',
};
function aggregateEncoursBy(keyFn, clients = CLIENTS) {
  const map = {};
  let total = 0;
  clients.forEach((c) => {
    const key = keyFn(c);
    const v = toRef(c.encours, c.devise);
    map[key] = (map[key] || 0) + v;
    total += v;
  });
  return Object.entries(map).map(([name, v]) => ({
    name,
    value: Math.round((v / total) * 100),
  }));
}
const PROFILE_TYPE_MIX = aggregateEncoursBy(
  (c) => PROFILE_TYPE_LABEL[c.type] || c.type
);
const RISK_PROFILE_MIX = aggregateEncoursBy((c) => c.profilRisque);

const aggregateCurrencyExposure = (clients = CLIENTS) => {
  const montantsReference = {};
  let totalReference = 0;

  clients.forEach((client) => {
    const encoursReference = toRef(client.encours, client.devise);
    const expositions =
      client.expositionsDevises || { [client.devise]: 100 };

    totalReference += encoursReference;

    Object.entries(expositions).forEach(([devise, pourcentage]) => {
      montantsReference[devise] =
        (montantsReference[devise] || 0) +
        (encoursReference * Number(pourcentage || 0)) / 100;
    });
  });

  return Object.entries(montantsReference)
    .map(([name, montant]) => ({
      name,
      value:
        totalReference > 0
          ? Number(((montant / totalReference) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

const CURRENCY_MIX = aggregateCurrencyExposure();

const CORR_SECTEURS_LABELS = [
  'Banques',
  'Télécoms',
  'Agro-industrie',
  'Énergie',
  'Assurance',
  'Distribution',
];
const CORR_SECTEURS_HIST = [
  [1, 0.35, 0.2, 0.3, 0.55, 0.25],
  [0.35, 1, 0.15, 0.25, 0.3, 0.2],
  [0.2, 0.15, 1, 0.3, 0.2, 0.35],
  [0.3, 0.25, 0.3, 1, 0.25, 0.2],
  [0.55, 0.3, 0.2, 0.25, 1, 0.3],
  [0.25, 0.2, 0.35, 0.2, 0.3, 1],
];
const CORR_SECTEURS_CRISE = [
  [1, 0.68, 0.55, 0.6, 0.8, 0.58],
  [0.68, 1, 0.5, 0.55, 0.62, 0.52],
  [0.55, 0.5, 1, 0.58, 0.5, 0.6],
  [0.6, 0.55, 0.58, 1, 0.55, 0.5],
  [0.8, 0.62, 0.5, 0.55, 1, 0.6],
  [0.58, 0.52, 0.6, 0.5, 0.6, 1],
];
const CORR_PAYS_LABELS = ["Côte d'Ivoire", 'Nigeria', 'Ghana', 'Sénégal'];
const CORR_PAYS_HIST = [
  [1, 0.3, 0.25, 0.5],
  [0.3, 1, 0.35, 0.2],
  [0.25, 0.35, 1, 0.2],
  [0.5, 0.2, 0.2, 1],
];
const CORR_PAYS_CRISE = [
  [1, 0.65, 0.6, 0.78],
  [0.65, 1, 0.68, 0.55],
  [0.6, 0.68, 1, 0.5],
  [0.78, 0.55, 0.5, 1],
];

const STRESS_SCENARIOS = [
  {
    nom: 'Choc marché Actions',
    zone: 'Actions',
    unite: '%',
    chocDefaut: -15,
    sensibilite: 0.42,
    min: -40,
    max: 0,
  },
  {
    nom: 'Choc marché Obligations',
    zone: 'Obligations',
    unite: 'bps',
    chocDefaut: 100,
    sensibilite: -0.021,
    min: -200,
    max: 200,
  },
  {
    nom: 'Choc niveau de liquidité',
    zone: 'Liquidité',
    unite: 'bps',
    chocDefaut: -50,
    sensibilite: 0.006,
    min: -200,
    max: 200,
  },
];
const UPCOMING_CASHFLOWS = [
  {
    titre: 'SONATEL',
    type: 'Dividende',
    echeance: '15/08/2026',
    montant: 150000,
    devise: 'XOF',
    portefeuilles: 'Aïcha Koné, Fonds Prévoyance CI',
  },
  {
    titre: 'Obligation Trésor CI 6.5% 2029',
    type: 'Coupon',
    echeance: '12/08/2026',
    montant: 410000,
    devise: 'XOF',
    portefeuilles: 'Fonds Prévoyance CI, Groupe Assurance Sahel',
  },
  {
    titre: 'MTN NIGERIA',
    type: 'Dividende',
    echeance: '20/08/2026',
    montant: 260000,
    devise: 'NGN',
    portefeuilles: 'Emeka Okafor',
  },
  {
    titre: 'ZENITH BANK',
    type: 'Dividende',
    echeance: '28/08/2026',
    montant: 175000,
    devise: 'NGN',
    portefeuilles: 'Caisse Retraite Littoral',
  },
  {
    titre: 'GCB BANK',
    type: 'Dividende',
    echeance: '05/09/2026',
    montant: 32000,
    devise: 'GHS',
    portefeuilles: 'Ama Boateng',
  },
];
const parseFR = (d) => {
  const [j, m, a] = d.split('/').map(Number);
  return new Date(a, m - 1, j);
};
const AUJOURDHUI = new Date(2026, 6, 29);
const joursDepuisAujourdhui = (d) =>
  Math.round((parseFR(d) - AUJOURDHUI) / 86_400_000);

const replaceClients = (nextClients) => {
  if (!Array.isArray(nextClients)) return CLIENTS;
  CLIENTS.splice(0, CLIENTS.length, ...nextClients);
  return CLIENTS;
};

export {
  VOLUME_JOUR,
  CLIENTS_ORIGINAUX,
  PROFILS_PORTEFEUILLES_MODELES,
  DEVISE_PAR_MARCHE,
  PORTEFEUILLES_GENERES_SPECS,
  construirePortefeuilleGenere,
  CLIENTS_GENERES,
  DEVISES_INVESTISSEMENT,
  construireExpositionsDevises,
  CLIENTS_BRUTS,
  CLIENTS,
  PROFILE_TYPE_LABEL,
  PAYS_MARCHE,
  TITRE_SECTEUR,
  aggregateEncoursBy,
  PROFILE_TYPE_MIX,
  RISK_PROFILE_MIX,
  aggregateCurrencyExposure,
  CURRENCY_MIX,
  CORR_SECTEURS_LABELS,
  CORR_SECTEURS_HIST,
  CORR_SECTEURS_CRISE,
  CORR_PAYS_LABELS,
  CORR_PAYS_HIST,
  CORR_PAYS_CRISE,
  STRESS_SCENARIOS,
  UPCOMING_CASHFLOWS,
  parseFR,
  AUJOURDHUI,
  joursDepuisAujourdhui,
  replaceClients,
};
