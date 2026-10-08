import {
  Activity,
  BookOpen,
  Briefcase,
  Building2,
  Droplets,
  FileCheck2,
  Home,
  ListOrdered,
  Star,
} from 'lucide-react';
import { convertCurrency } from '../../shared/lib/finance';
import { resolveMarketInstrument } from '../markets/MarketDomainData';

const CLIENT_GESTION_LIBRE = {
  id: 'investisseur-demo-01',
  nom: 'Koffi Mensah',
  deviseReference: 'XOF',
  portefeuilles: [
    {
      id: 'cl-pf-brvm',
      nom: 'Portefeuille BRVM Côte d’Ivoire',
      sgi: 'Atlantic Bourse',
      pays: "Côte d'Ivoire",
      marche: 'BRVM',
      devise: 'XOF',
      compteEspeces: 15_000_000,
      perfYtd: 6.4,
      lignes: [
        { instrument: 'SONATEL', qte: 4_200, pru: 13_250 },
        { instrument: 'ECOBANK CI', qte: 3_000, pru: 6_920 },
        {
          instrument: 'Obligation Trésor CI 6.5% 2029',
          qte: 3_500,
          pru: 10_010,
        },
      ],
    },
    {
      id: 'cl-pf-brvm-2',
      nom: 'Portefeuille BRVM Sénégal',
      sgi: 'Sahel Capital Markets',
      pays: 'Sénégal',
      marche: 'BRVM',
      devise: 'XOF',
      compteEspeces: 8_500_000,
      perfYtd: 5.2,
      lignes: [
        { instrument: 'SONATEL', qte: 1_600, pru: 13_480 },
        { instrument: 'PALMCI', qte: 900, pru: 7_950 },
        {
          instrument: 'Obligation Trésor CI 6.5% 2029',
          qte: 1_200,
          pru: 10_020,
        },
      ],
    },
    {
      id: 'cl-pf-ngx',
      nom: 'Portefeuille Nigeria Lagos',
      sgi: 'Lagos Securities',
      pays: 'Nigeria',
      marche: 'NGX',
      devise: 'NGN',
      compteEspeces: 9_000_000,
      perfYtd: 4.1,
      lignes: [
        { instrument: 'MTN NIGERIA', qte: 120_000, pru: 205.4 },
        { instrument: 'ZENITH BANK', qte: 500_000, pru: 38.6 },
        { instrument: 'Obligation Trésor NGN 2028', qte: 180_000, pru: 99.2 },
      ],
    },
    {
      id: 'cl-pf-ngx-2',
      nom: 'Portefeuille Nigeria Abuja',
      sgi: 'Abuja Capital Securities',
      pays: 'Nigeria',
      marche: 'NGX',
      devise: 'NGN',
      compteEspeces: 5_000_000,
      perfYtd: 6.0,
      lignes: [
        { instrument: 'MTN NIGERIA', qte: 55_000, pru: 209.8 },
        { instrument: 'ZENITH BANK', qte: 180_000, pru: 39.1 },
        { instrument: 'Obligation Trésor NGN 2028', qte: 90_000, pru: 98.9 },
      ],
    },
    {
      id: 'cl-pf-gse',
      nom: 'Portefeuille Ghana Accra',
      sgi: 'Accra Capital',
      pays: 'Ghana',
      marche: 'GSE',
      devise: 'GHS',
      compteEspeces: 450_000,
      perfYtd: 8.2,
      lignes: [
        { instrument: 'GCB BANK', qte: 220_000, pru: 4.85 },
        {
          instrument: 'Obligation Corporate GSE 2027',
          qte: 13_000,
          pru: 100.2,
        },
      ],
    },
    {
      id: 'cl-pf-gse-2',
      nom: 'Portefeuille Ghana secondaire',
      sgi: 'Gold Coast Securities',
      pays: 'Ghana',
      marche: 'GSE',
      devise: 'GHS',
      compteEspeces: 280_000,
      perfYtd: 5.7,
      lignes: [
        { instrument: 'GCB BANK', qte: 95_000, pru: 5.02 },
        {
          instrument: 'Obligation Corporate GSE 2027',
          qte: 7_000,
          pru: 100.7,
        },
      ],
    },
  ],
};

const CLIENT_CASHFLOWS = [
  {
    id: 'CF-CL-01',
    portefeuilleId: 'cl-pf-brvm',
    date: '15/08/2026',
    type: 'Dividende',
    instrument: 'SONATEL',
    montant: 1_680_000,
    devise: 'XOF',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-02',
    portefeuilleId: 'cl-pf-brvm',
    date: '12/08/2026',
    type: 'Coupon',
    instrument: 'Obligation Trésor CI 6.5% 2029',
    montant: 2_275_000,
    devise: 'XOF',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-03',
    portefeuilleId: 'cl-pf-ngx',
    date: '20/08/2026',
    type: 'Dividende',
    instrument: 'MTN NIGERIA',
    montant: 1_260_000,
    devise: 'NGN',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-04',
    portefeuilleId: 'cl-pf-ngx',
    date: '28/08/2026',
    type: 'Dividende',
    instrument: 'ZENITH BANK',
    montant: 925_000,
    devise: 'NGN',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-05',
    portefeuilleId: 'cl-pf-gse',
    date: '05/09/2026',
    type: 'Dividende',
    instrument: 'GCB BANK',
    montant: 88_000,
    devise: 'GHS',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-06',
    portefeuilleId: 'cl-pf-brvm-2',
    date: '18/08/2026',
    type: 'Dividende',
    instrument: 'SONATEL',
    montant: 640_000,
    devise: 'XOF',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-07',
    portefeuilleId: 'cl-pf-ngx-2',
    date: '26/08/2026',
    type: 'Coupon',
    instrument: 'Obligation Trésor NGN 2028',
    montant: 410_000,    devise: 'NGN',
    statut: 'À recevoir',
  },
  {
    id: 'CF-CL-08',
    portefeuilleId: 'cl-pf-gse-2',
    date: '07/09/2026',
    type: 'Coupon',
    instrument: 'Obligation Corporate GSE 2027',
    montant: 46_000,
    devise: 'GHS',
    statut: 'À recevoir',
  },
];

const INITIAL_CLIENT_ORDERS = [
  {
    id: 'CL-ORD-001',
    date: '08/08/2026',
    portefeuilleId: 'cl-pf-brvm',
    instrument: 'SONATEL',
    marche: 'BRVM',
    devise: 'XOF',
    sens: 'Achat',
    qte: 200,
    typeOrdre: 'Ordre limite',
    prix: 14_050,
    statut: 'Exécuté',
  },
  {
    id: 'CL-ORD-002',
    date: '09/08/2026',
    portefeuilleId: 'cl-pf-ngx',
    instrument: 'ZENITH BANK',
    marche: 'NGX',
    devise: 'NGN',
    sens: 'Vente',
    qte: 25_000,
    typeOrdre: 'Ordre limite',
    prix: 41.5,
    statut: 'En attente',
  },
  {
    id: 'CL-ORD-003',
    date: '10/08/2026',
    portefeuilleId: 'cl-pf-brvm',
    instrument: 'SONATEL',
    marche: 'BRVM',
    devise: 'XOF',
    sens: 'Achat',
    qte: 150,
    typeOrdre: 'Ordre limite',
    prix: 14_100,
    statut: 'En attente',
  },
  {
    id: 'CL-ORD-004',
    date: '10/08/2026',
    portefeuilleId: 'cl-pf-ngx',
    instrument: 'MTN NIGERIA',
    marche: 'NGX',
    devise: 'NGN',
    sens: 'Achat',
    qte: 10_000,
    typeOrdre: 'Ordre limite',
    prix: 216,
    statut: 'En cours',
  },
  {
    id: 'CL-ORD-005',
    date: '10/08/2026',
    portefeuilleId: 'cl-pf-gse',
    instrument: 'GCB BANK',
    marche: 'GSE',
    devise: 'GHS',
    sens: 'Achat',
    qte: 10_000,
    typeOrdre: 'Ordre limite',
    prix: 5.35,
    statut: 'En attente',
  },
  {
    id: 'CL-ORD-006',
    date: '11/08/2026',
    portefeuilleId: 'cl-pf-brvm-2',
    instrument: 'PALMCI',
    marche: 'BRVM',
    devise: 'XOF',
    sens: 'Achat',
    qte: 200,
    typeOrdre: 'Ordre limite',
    prix: 8_050,
    statut: 'En attente',
  },
  {
    id: 'CL-ORD-007',
    date: '11/08/2026',
    portefeuilleId: 'cl-pf-ngx-2',
    instrument: 'ZENITH BANK',
    marche: 'NGX',
    devise: 'NGN',
    sens: 'Achat',
    qte: 50_000,
    typeOrdre: 'Ordre limite',
    prix: 40.9,
    statut: 'En cours',
  },
  {
    id: 'CL-ORD-008',
    date: '11/08/2026',
    portefeuilleId: 'cl-pf-gse-2',
    instrument: 'GCB BANK',
    marche: 'GSE',
    devise: 'GHS',
    sens: 'Achat',
    qte: 5_000,
    typeOrdre: 'Ordre limite',
    prix: 5.3,
    statut: 'En attente',
  },
];

const CLIENT_NAV = [
  { id: 'client-dashboard', label: 'Vue consolidée', icon: Home },
  {
    id: 'client-portfolios',
    label: 'Mes portefeuilles & SGI',
    icon: Briefcase,
  },
  {
    id: 'client-exchanges',
    label: 'Marchés Actions',
    icon: Activity,
  },
  {
    id: 'client-markets',
    label: 'Marchés Obligataire',
    icon: Building2,
  },
  { id: 'client-watchlist', label: 'Watchlist', icon: Star },
  { id: 'client-orders', label: 'Mes ordres', icon: ListOrdered },
  { id: 'client-avis', label: "Avis d'opéré", icon: FileCheck2 },
  { id: 'client-cashflows', label: 'Liquidité & revenus', icon: Droplets },
  { id: 'client-analysis', label: 'Performance & risque', icon: Activity },
  { id: 'client-documentation', label: 'Documentation', icon: BookOpen },
];

const clientMarket = (instrument, marcheHint) =>
  resolveMarketInstrument(instrument, marcheHint);

const clientPortfolioValue = (portefeuille) =>
  portefeuille.compteEspeces +
  portefeuille.lignes.reduce((somme, ligne) => {
    const marche = clientMarket(ligne.instrument);
    return somme + ligne.qte * Number(marche?.cours || ligne.pru || 0);
  }, 0);

const clientLineValue = (ligne) => {
  const marche = clientMarket(ligne.instrument);
  return ligne.qte * Number(marche?.cours || ligne.pru || 0);
};

/*
 * Gestion libre — coût moyen pondéré et plus/moins-value latente.
 *
 * En production, `cmp` doit provenir des transactions/lots réels.
 * La maquette actuelle dispose surtout du `pru`; celui-ci est donc utilisé
 * comme fallback uniquement lorsqu'aucun CMP explicite n'est encore fourni.
 */
const clientLineCmp = (ligne) => {
  const cmp = Number(
    ligne?.cmp ??
      ligne?.coutMoyenPondere ??
      ligne?.averageCost ??
      ligne?.pru ??
      0
  );

  return Number.isFinite(cmp) && cmp >= 0 ? cmp : 0;
};
const clientLinePlusMoinsValue = (ligne) => {
  const marche = clientMarket(ligne.instrument);
  const cours = Number(marche?.cours || ligne?.pru || 0);
  const cmp = clientLineCmp(ligne);
  const quantite = Number(ligne?.qte || 0);

  return quantite * (cours - cmp);
};

const clientPortfolioValueIn = (portefeuille, devise) =>
  convertCurrency(
    clientPortfolioValue(portefeuille),
    portefeuille.devise,
    devise
  );

const clientCashIn = (portefeuille, devise) =>
  convertCurrency(portefeuille.compteEspeces, portefeuille.devise, devise);

const CLIENT_OPEN_ORDER_STATUSES = ['En attente', 'En cours'];

const clientReservedCash = (portefeuille, orders = []) => {
  const montantReserve = orders
    .filter(
      (ordre) =>
        ordre.portefeuilleId === portefeuille.id &&
        ordre.sens === 'Achat' &&
        CLIENT_OPEN_ORDER_STATUSES.includes(ordre.statut)
    )
    .reduce(
      (somme, ordre) =>
        somme + Number(ordre.qte || 0) * Number(ordre.prix || 0),
      0
    );

  return Math.min(
    Number(portefeuille.compteEspeces || 0),
    Math.max(0, montantReserve)
  );
};

const clientAvailableCash = (portefeuille, orders = []) =>
  Math.max(
    0,
    Number(portefeuille.compteEspeces || 0) -
      clientReservedCash(portefeuille, orders)
  );

const clientAvailableCashIn = (portefeuille, orders, devise) =>
  convertCurrency(
    clientAvailableCash(portefeuille, orders),
    portefeuille.devise,
    devise
  );

const clientReservedCashIn = (portefeuille, orders, devise) =>
  convertCurrency(
    clientReservedCash(portefeuille, orders),
    portefeuille.devise,
    devise
  );

const clientAssetClass = (instrument) =>
  clientMarket(instrument)?.type === 'Obligation' ? 'Obligations' : 'Actions';

const CLIENT_SECTEUR_INSTRUMENT = {
  SONATEL: 'Télécoms',
  'ECOBANK CI': 'Banques',
  PALMCI: 'Agro-industrie',
  'MTN NIGERIA': 'Télécoms',
  'ZENITH BANK': 'Banques',
  'GCB BANK': 'Banques',
  'Obligation Trésor CI 6.5% 2029': 'Souverain',
  'Obligation Trésor NGN 2028': 'Souverain',
  'Obligation Corporate GSE 2027': 'Corporate',
};

const clientSector = (instrument) =>
  CLIENT_SECTEUR_INSTRUMENT[instrument] || 'Autres';

const CLIENT_HISTORY = [
  { date: '2025-09-01', mois: 'Sept 25', valeur: 100 },
  { date: '2025-10-01', mois: 'Oct', valeur: 101.8 },
  { date: '2025-11-01', mois: 'Nov', valeur: 103.1 },
  { date: '2025-12-01', mois: 'Déc', valeur: 102.4 },
  { date: '2026-01-01', mois: 'Jan 26', valeur: 104.6 },
  { date: '2026-02-01', mois: 'Fév', valeur: 105.2 },
  { date: '2026-03-01', mois: 'Mar', valeur: 106.9 },
  { date: '2026-04-01', mois: 'Avr', valeur: 108.1 },
  { date: '2026-05-01', mois: 'Mai', valeur: 109.4 },
  { date: '2026-06-01', mois: 'Juin', valeur: 108.8 },
  { date: '2026-07-01', mois: 'Juil', valeur: 111.7 },
  { date: '2026-08-01', mois: 'Août', valeur: 113.2 },
];

const orderBookDemo = (m) => {
  const step = Math.max(m.cours * 0.002, 0.01);
  const asks = [4, 3, 2, 1].map((i) => ({
    prix: +(m.cours + step * i).toFixed(2),
    qte: Math.round(180 + i * 140),
  }));
  const bids = [1, 2, 3, 4].map((i) => ({
    prix: +(m.cours - step * i).toFixed(2),
    qte: Math.round(200 + i * 120),
  }));
  return { asks, bids };
};
const executionsDemo = (m) => {
  const execs = [
    { heure: '09:58', sens: 'Achat', qte: 150, prix: m.cours },
    {
      heure: '10:15',
      sens: 'Vente',
      qte: 220,
      prix: +(m.cours * 0.999).toFixed(2),
    },
    {
      heure: '10:41',
      sens: 'Achat',
      qte: 90,
      prix: +(m.cours * 1.001).toFixed(2),
    },
    { heure: '11:05', sens: 'Achat', qte: 310, prix: m.cours },
    {
      heure: '11:32',
      sens: 'Vente',
      qte: 140,
      prix: +(m.cours * 0.998).toFixed(2),
    },
  ];
  let cumule = 0;
  return execs.map((e) => {
    cumule += e.qte;
    return { ...e, cumule };
  });
};


export {
  CLIENT_GESTION_LIBRE,
  CLIENT_CASHFLOWS,
  INITIAL_CLIENT_ORDERS,
  CLIENT_NAV,
  clientMarket,
  clientPortfolioValue,
  clientLineValue,
  clientLineCmp,
  clientLinePlusMoinsValue,
  clientPortfolioValueIn,
  clientCashIn,
  CLIENT_OPEN_ORDER_STATUSES,
  clientReservedCash,
  clientAvailableCash,
  clientAvailableCashIn,
  clientReservedCashIn,
  clientAssetClass,
  CLIENT_SECTEUR_INSTRUMENT,
  clientSector,
  CLIENT_HISTORY,
  orderBookDemo,
  executionsDemo,
};
