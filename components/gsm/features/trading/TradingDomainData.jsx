import {
  Home,
  Briefcase,
  ListOrdered,
  FileCheck2,
  TrendingUp,
  Star,
  SlidersHorizontal,
  Filter,
  AlertTriangle,
  Scale,
  FileBarChart2,
  ArrowDownRight,
  Activity,
  Building2,
  Droplets,
  BookOpen,
} from 'lucide-react';
import { createWatchlistModel } from '../watchlist/WatchlistModel';
import { CLIENTS, PROFILE_TYPE_LABEL, PAYS_MARCHE, TITRE_SECTEUR } from '../portfolio/PortfolioUniverse';
import { MARKETS_DATA, marketActiveSeed, resolveMarketInstrument } from '../markets/MarketDomainData';
import { clientMarket } from '../clients/ClientDomainData';

const ORDERS = [
  {
    id: 'OR-2201',
    sens: 'Achat',
    titre: 'SONATEL',
    marche: 'BRVM',
    devise: 'XOF',
    qte: 500,
    prix: 14200,
    statut: 'Exécuté',
    pf: 'Fonds Prévoyance CI',
  },
  {
    id: 'OR-2202',
    sens: 'Vente',
    titre: 'ECOBANK CI',
    marche: 'BRVM',
    devise: 'XOF',
    qte: 1200,
    prix: 6650,
    statut: 'Exécuté',
    pf: 'Aïcha Koné',
  },
  {
    id: 'OR-2203',
    sens: 'Achat',
    titre: 'MTN NIGERIA',
    marche: 'NGX',
    devise: 'NGN',
    qte: 300,
    prix: 218.5,
    statut: 'En cours',
    pf: 'Emeka Okafor',
  },
  {
    id: 'OR-2204',
    sens: 'Achat',
    titre: 'Obligation Trésor CI 6.5% 2029',
    marche: 'BRVM',
    devise: 'XOF',
    qte: 200,
    prix: 10050,
    statut: 'En attente',
    pf: 'Groupe Assurance Sahel',
  },
  {
    id: 'OR-2205',
    sens: 'Vente',
    titre: 'GCB BANK',
    marche: 'GSE',
    devise: 'GHS',
    qte: 800,
    prix: 5.4,
    statut: 'Exécuté',
    pf: 'Ama Boateng',
  },
  {
    id: 'OR-2206',
    sens: 'Achat',
    titre: 'ZENITH BANK',
    marche: 'NGX',
    devise: 'NGN',
    qte: 1500,
    prix: 41.2,
    statut: 'Annulé',
    pf: 'Caisse Retraite Littoral',
  },
];
const RECOS = [
  {
    titre: 'SONATEL',
    marche: 'BRVM',
    devise: 'XOF',
    sens: 'Achat',
    secteur: 'Télécoms',
    cours: 14200,
    objectif: 16000,
    conviction: 'Forte',
    technique: {
      mm: 'MM20 > MM50',
      macd: 'Positif',
      rsi: 62,
      bol: 'Proche bande sup.',
      signal: 'Acheter',
    },
    fondamentale: {
      per: 12.8,
      rentabilite: '18.4%',
      evol: '+9.2%',
      valo: 'Sous-évaluée',
      signal: 'Acheter',
    },
  },
  {
    titre: 'MTN NIGERIA',
    marche: 'NGX',
    devise: 'NGN',
    sens: 'Conserver',
    secteur: 'Télécoms',
    cours: 218.5,
    objectif: 225,
    conviction: 'Moyenne',
    technique: {
      mm: 'MM20 ≈ MM50',
      macd: 'Neutre',
      rsi: 54,
      bol: 'Milieu des bandes',
      signal: 'Conserver',
    },
    fondamentale: {
      per: 10.6,
      rentabilite: '24.1%',
      evol: '+6.8%',
      valo: 'Équitable',
      signal: 'Acheter',
    },
  },
  {
    titre: 'ECOBANK CI',
    marche: 'BRVM',
    devise: 'XOF',
    sens: 'Vente',
    secteur: 'Banques',
    cours: 6650,
    objectif: 5900,
    conviction: 'Forte',
    technique: {
      mm: 'MM20 < MM50',
      macd: 'Négatif',
      rsi: 38,
      bol: 'Proche bande inf.',
      signal: 'Vendre',
    },
    fondamentale: {
      per: 15.3,
      rentabilite: '9.7%',
      evol: '-4.5%',
      valo: 'Surévaluée',
      signal: 'Vendre',
    },
  },
  {
    titre: 'GCB BANK',
    marche: 'GSE',
    devise: 'GHS',
    sens: 'Achat',
    secteur: 'Banques',
    cours: 5.4,
    objectif: 6.3,
    conviction: 'Moyenne',
    technique: {
      mm: 'MM20 > MM50',
      macd: 'Positif',
      rsi: 66,
      bol: 'Proche bande sup.',
      signal: 'Acheter',
    },
    fondamentale: {
      per: 7.9,
      rentabilite: '21.5%',
      evol: '+12.4%',
      valo: 'Sous-évaluée',
      signal: 'Acheter',
    },
  },
  {
    titre: 'ZENITH BANK',
    marche: 'NGX',
    devise: 'NGN',
    sens: 'Achat',
    secteur: 'Banques',
    cours: 41.2,
    objectif: 47,
    conviction: 'Forte',
    technique: {
      mm: 'MM20 > MM50',
      macd: 'Positif',
      rsi: 71,
      bol: 'Au-dessus bande sup.',
      signal: 'Alléger',    },
    fondamentale: {
      per: 5.8,
      rentabilite: '31.2%',
      evol: '+15.1%',
      valo: 'Sous-évaluée',
      signal: 'Acheter',
    },
  },
  {
    titre: 'PALMCI',
    marche: 'BRVM',
    devise: 'XOF',
    sens: 'Conserver',
    secteur: 'Agro-industrie',
    cours: 8100,
    objectif: 8300,
    conviction: 'Faible',
    technique: {
      mm: 'MM20 ≈ MM50',
      macd: 'Faible +',
      rsi: 57,
      bol: 'Milieu des bandes',
      signal: 'Conserver',
    },
    fondamentale: {
      per: 17.4,
      rentabilite: '8.2%',
      evol: '+1.6%',
      valo: 'Surévaluée',
      signal: 'Vendre',
    },
  },
];

const {
  DEFAULT_STATIC_WATCHLIST_TITLES,
  buildWatchlistJournaliere,
  buildStaticWatchlistRow,
} = createWatchlistModel({
  recos: RECOS,
  markets: MARKETS_DATA,
  resolveMarket: clientMarket,
});

const INSTRUMENTS = [
  'SONATEL',
  'ECOBANK CI',
  'MTN NIGERIA',
  'ZENITH BANK',
  'GCB BANK',
  'PALMCI',
  'Obligation Trésor CI 6.5% 2029',
];
const EXPOSURE = {
  c1: { SONATEL: 4, 'ECOBANK CI': 9, PALMCI: 3 },
  c2: {
    SONATEL: 6,
    'ECOBANK CI': 5,
    'Obligation Trésor CI 6.5% 2029': 12,
    PALMCI: 2,
  },
  c3: { 'MTN NIGERIA': 14, 'ZENITH BANK': 8 },
  c4: { 'ECOBANK CI': 7, 'Obligation Trésor CI 6.5% 2029': 15, SONATEL: 3 },
  c5: { 'GCB BANK': 11 },
  c6: { 'ZENITH BANK': 6, 'MTN NIGERIA': 9 },
};
const exposureOf = (clientId, instrument) => {
  const expositionExplicite = EXPOSURE[clientId]?.[instrument];
  if (expositionExplicite != null) return expositionExplicite;

  const client = CLIENTS.find((c) => c.id === clientId);
  const instrumentMarche = MARKETS_DATA.find((m) => m.nom === instrument);
  if (
    !client ||
    !instrumentMarche ||
    client.marche !== instrumentMarche.marche
  ) {
    return 0;
  }

  if (instrumentMarche.type === 'Action') {
    const actionsMarche = MARKETS_DATA.filter(
      (m) => m.type === 'Action' && m.marche === client.marche
    );
    const rang = actionsMarche.findIndex((m) => m.nom === instrument);
    const poids =
      actionsMarche.length === 1
        ? [1]
        : actionsMarche.length === 2
        ? [0.58, 0.42]
        : [0.45, 0.33, 0.22];
    return rang >= 0
      ? Number((Number(client.alloc.Actions || 0) * poids[rang]).toFixed(1))
      : 0;
  }

  const expositionObligataire =
    Number(client.alloc['Obl. souveraines'] || 0) +
    Number(client.alloc['Obl. privées'] || 0);
  return Number((expositionObligataire * 0.65).toFixed(1));
};
const ACTIONS_LIST = [
  'SONATEL',
  'ECOBANK CI',
  'MTN NIGERIA',
  'ZENITH BANK',
  'GCB BANK',
  'PALMCI',
];
const OBLIGATIONS_LIST = ['Obligation Trésor CI 6.5% 2029'];

/*
 * Présentation des actifs cotés — métriques de coût et de plus/moins-value.
 *
 * En production, le CMP doit provenir des positions/lots ou de l'historique
 * réel des acquisitions. La maquette accepte déjà plusieurs formes possibles :
 * - client.cmp[instrument]
 * - client.coutMoyenPondere[instrument]
 * - client.positions[].cmp / coutMoyenPondere
 *
 * Si aucune donnée de coût n'est encore disponible, un CMP déterministe de
 * démonstration est utilisé afin de garder la maquette fonctionnelle.
 */
const gsmPositionCmp = (client, instrument) => {
  const position = Array.isArray(client?.positions)
    ? client.positions.find(
        (item) =>
          item?.instrument === instrument ||
          item?.titre === instrument ||
          item?.nom === instrument
      )
    : null;

  const cmpExplicite =
    position?.cmp ??
    position?.coutMoyenPondere ??
    client?.cmp?.[instrument] ??
    client?.coutMoyenPondere?.[instrument];

  const cmpNumerique = Number(cmpExplicite);
  if (Number.isFinite(cmpNumerique) && cmpNumerique > 0) {
    return cmpNumerique;
  }

  const marche = resolveMarketInstrument(instrument, client?.marche);
  const cours = Number(marche?.cours || 0);
  if (!Number.isFinite(cours) || cours <= 0) return 0;

  // Fallback uniquement pour la maquette : écart stable compris entre -8% et +8%.
  const seed = marketActiveSeed(`${client?.id || 'client'}-${instrument}-cmp`);
  const ecart = ((seed % 17) - 8) / 100;
  return Number(
    (cours * (1 + ecart)).toFixed(client?.marche === 'BRVM' ? 0 : 2)
  );
};

const gsmListedAssetMetrics = (client, instrument) => {
  const exposition = Number(exposureOf(client.id, instrument) || 0);
  const valeurMarche = Math.round(
    (Number(client.encours || 0) * exposition) / 100
  );
  const marche = resolveMarketInstrument(instrument, client.marche);
  const cours = Number(marche?.cours || 0);
  const cmp = gsmPositionCmp(client, instrument);

  const quantiteEstimee = cours > 0 ? valeurMarche / cours : 0;
  const coutHistorique = cmp > 0 ? quantiteEstimee * cmp : valeurMarche;
  const plusMoinsValue = valeurMarche - coutHistorique;
  const plusMoinsValuePct =
    coutHistorique > 0 ? (plusMoinsValue / coutHistorique) * 100 : 0;

  return {
    exposition,
    valeurMarche,
    cours,
    cmp,
    quantiteEstimee,
    coutHistorique,
    plusMoinsValue,    plusMoinsValuePct,
  };
};
const expositionClient = (client, dimension, value) => {
  if (dimension === 'Profil de risque') {
    const pct = client.profilRisque === value ? 100 : 0;
    return { pct, valeur: pct ? client.encours : 0 };
  }
  if (dimension === "Type d'actif") {
    const pct = client.alloc[value] ?? 0;
    return { pct, valeur: Math.round((client.encours * pct) / 100) };
  }
  if (dimension === 'Marché boursier') {
    const code = value.split(' ')[0];
    const pct = client.marche === code ? 100 : 0;
    return { pct, valeur: pct ? client.encours : 0 };
  }
  if (dimension === 'Pays') {
    const code = PAYS_MARCHE[value];
    const pct = code && client.marche === code ? 100 : 0;
    return { pct, valeur: pct ? client.encours : 0 };
  }
  if (dimension === 'Secteur') {
    const pct = ACTIONS_LIST.filter((t) => TITRE_SECTEUR[t] === value).reduce(
      (s, t) => s + exposureOf(client.id, t),
      0
    );
    return { pct, valeur: Math.round((client.encours * pct) / 100) };
  }
  if (dimension === 'Type de portefeuille') {
    const label = PROFILE_TYPE_LABEL[client.type] || client.type;
    const pct = label === value ? 100 : 0;
    return { pct, valeur: pct ? client.encours : 0 };
  }
  return { pct: 0, valeur: 0 };
};
const ENCAISSEMENTS = [
  {
    titre: 'SONATEL',
    type: 'Dividende',
    montant: 145000,
    devise: 'XOF',
    date: '15/07/2026',
  },
  {
    titre: 'ECOBANK CI',
    type: 'Dividende',
    montant: 98000,
    devise: 'XOF',
    date: '10/07/2026',
  },
  {
    titre: 'Obligation Trésor CI 6.5% 2029',
    type: 'Coupon',
    montant: 410000,
    devise: 'XOF',
    date: '12/07/2026',
  },
  {
    titre: 'MTN NIGERIA',
    type: 'Dividende',
    montant: 260000,
    devise: 'NGN',
    date: '08/07/2026',
  },
  {
    titre: 'ZENITH BANK',
    type: 'Dividende',
    montant: 175000,
    devise: 'NGN',
    date: '05/07/2026',
  },
  {
    titre: 'GCB BANK',
    type: 'Dividende',
    montant: 32000,
    devise: 'GHS',
    date: '02/07/2026',
  },
];
const versementsDemo = (client) => [
  {
    type: 'Virement',
    montant: Math.round(client.encours * 0.02),
    devise: client.devise,
    date: '14/07/2026',
  },
  {
    type: 'Chèque',
    montant: Math.round(client.encours * 0.008),
    devise: client.devise,
    date: '05/07/2026',
  },
  {
    type: 'Espèces',
    montant: Math.round(client.encours * 0.003),
    devise: client.devise,
    date: '01/07/2026',
  },
];
const rentabiliteComment = (client) => {
  const r = client.rentabilite;
  if (r < 0)
    return `La rentabilité nette de la période est négative (${r.toFixed(
      1
    )}%) ; un point avec le client sur son horizon d'investissement est recommandé avant tout arbitrage supplémentaire. Une plus ou moins value de (...${
      client.devise
    }) est noté sur la période`;
  if (r >= 3)
    return `La rentabilité nette de la période est solide (+${r.toFixed(
      1
    )}%) ; une prise partielle de plus-value vers des actifs moins volatils (obligations, liquidité) peut être envisagée pour sécuriser le gain.`;
  return `La rentabilité nette de la période est modérée (+${r.toFixed(
    1
  )}%), en ligne avec le profil du portefeuille ; aucun arbitrage urgent lié au rendement n'est nécessaire à ce stade. Une plus ou moins value de (...${
    client.devise
  }) est noté sur la période`;
};
const compareOp = (value, op, seuil) => {
  if (op === '<') return value < seuil;
  if (op === '>') return value > seuil;
  return value === seuil;
};

const SEUIL_REEQUILIBRAGE = 3;

const besoinsReequilibrageClient = (client) =>
  Object.keys(client.alloc)
    .map((actif) => {
      const actuel = Number(client.alloc[actif] || 0);
      const cible = Number(client.cible[actif] ?? actuel);
      const ecart = actuel - cible;
      const ecartAbsolu = Math.abs(ecart);

      return {
        actif,
        actuel,
        cible,
        ecart,
        ecartAbsolu,
        sens: ecart > 0 ? 'Réduire' : 'Renforcer',
        montant: Math.round((client.encours * ecartAbsolu) / 100),
        priorite:
          ecartAbsolu >= 10
            ? 'Haute'
            : ecartAbsolu >= 6
            ? 'Moyenne'
            : 'Normale',
      };
    })
    .filter((besoin) => besoin.ecartAbsolu > SEUIL_REEQUILIBRAGE)
    .sort((a, b) => b.ecartAbsolu - a.ecartAbsolu);

const propositionReequilibrage = (besoin) => {
  const renforcer = besoin.sens === 'Renforcer';

  if (besoin.actif === 'Actions') {
    return renforcer
      ? "Renforcer progressivement les actions jusqu'à la cible, en privilégiant les valeurs disposant des meilleurs signaux techniques et fondamentaux."
      : "Alléger progressivement les actions jusqu'à la cible, en donnant la priorité aux lignes les moins bien orientées ou les plus surpondérées.";
  }

  if (besoin.actif === 'Obl. souveraines') {
    return renforcer
      ? 'Renforcer les obligations souveraines pour réduire la volatilité et rapprocher le portefeuille de son allocation stratégique.'
      : "Réduire l'exposition aux obligations souveraines et réallouer l'excédent vers les classes d'actifs sous-pondérées.";
  }

  if (besoin.actif === 'Obl. privées') {
    return renforcer
      ? 'Renforcer sélectivement les obligations privées présentant un couple rendement-risque compatible avec le profil du client.'
      : 'Alléger les obligations privées les moins liquides ou les moins attractives afin de revenir vers la cible.';
  }

  return renforcer
    ? 'Reconstituer la poche de liquidité afin de couvrir les besoins opérationnels et les prochaines échéances du portefeuille.'
    : "Réinvestir l'excédent de liquidité dans les classes d'actifs sous-pondérées, selon les opportunités de marché disponibles.";
};

const ALERTES = [  {
    client: 'Emeka Okafor',
    type: 'Rendement',
    actif: 'Actions',
    ecart: '-16 pts vs cible',
    marche: 'NGX',
    severite: 'Haute',
    depuis: '5 j',
  },
  {
    client: 'Emeka Okafor',
    type: 'Risque',
    actif: 'Portefeuille',
    ecart: 'VaR 30j au-dessus du seuil',
    marche: 'NGX',
    severite: 'Haute',
    depuis: '2 j',
  },
  {
    client: 'Aïcha Koné',
    type: 'Allocation',
    actif: 'Actions',
    ecart: '+8 pts vs cible',
    marche: 'BRVM',
    severite: 'Moyenne',
    depuis: '9 j',
  },
  {
    client: 'Groupe Assurance Sahel',
    type: 'Allocation',
    actif: 'Obl. privées',
    ecart: '-3 pts vs cible',
    marche: 'BRVM',
    severite: 'Basse',
    depuis: '3 j',
  },
  {
    client: 'Caisse Retraite Littoral',
    type: 'Rendement',
    actif: 'Actions',
    ecart: '-2 pts vs cible',
    marche: 'NGX',
    severite: 'Basse',
    depuis: '12 j',
  },
];
const IMPACT_COMITE = [
  {
    theme: 'Réduction poids Banques BRVM',
    pf: '12 portefeuilles',
    impact: '+1.4 pt de perf.',
    statut: 'Appliqué',
  },
  {
    theme: 'Renforcement Télécoms NGX',
    pf: '6 portefeuilles',
    impact: '+0.9 pt de perf.',
    statut: 'Appliqué',
  },
  {
    theme: 'Sortie Distribution GSE',
    pf: '3 portefeuilles',
    impact: '-0.2 pt de perf.',
    statut: 'Partiel',
  },
];

const NAV = [
  { id: 'accueil', label: 'Accueil', icon: Home },
  { id: 'portefeuilles', label: 'Vue Portefeuilles', icon: Briefcase },
  { id: 'money-management', label: 'Money Management', icon: Droplets },
  { id: 'cession-retrait', label: 'Cession_Retrait', icon: ArrowDownRight },
  { id: 'carnet', label: "Carnet d'ordres", icon: ListOrdered },
  { id: 'avis', label: "Avis d'opéré", icon: FileCheck2 },
  { id: 'vue-boursiere', label: 'Marchés Actions', icon: Activity },
  { id: 'marches', label: 'Marchés Obligataire', icon: Building2 },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'recos-actions', label: 'Recommandations actions', icon: TrendingUp },
  { id: 'reco-alloc', label: "Reco. d'allocation", icon: SlidersHorizontal },
  { id: 'alloc-criteres', label: 'Allocation par critères', icon: Filter },
  { id: 'alertes', label: 'Alertes', icon: AlertTriangle },
  { id: 'reequilibrage', label: 'Rééquilibrage', icon: Scale },
  { id: 'analyse', label: 'Analyse portefeuille', icon: Activity },
  { id: 'comite', label: 'Rapport de comité', icon: FileBarChart2 },
  { id: 'documentation', label: 'Documentation', icon: BookOpen },
];
/* ------------------------------- UI ATOMS ------------------------------- */
/* -------------------------------- SCREENS -------------------------------- */


export {
  ORDERS,
  RECOS,
  DEFAULT_STATIC_WATCHLIST_TITLES,
  buildWatchlistJournaliere,
  buildStaticWatchlistRow,
  INSTRUMENTS,
  EXPOSURE,
  exposureOf,
  ACTIONS_LIST,
  OBLIGATIONS_LIST,
  gsmPositionCmp,
  gsmListedAssetMetrics,
  expositionClient,
  ENCAISSEMENTS,
  versementsDemo,
  rentabiliteComment,
  compareOp,
  SEUIL_REEQUILIBRAGE,
  besoinsReequilibrageClient,
  propositionReequilibrage,
  ALERTES,
  IMPACT_COMITE,
  NAV,
};
