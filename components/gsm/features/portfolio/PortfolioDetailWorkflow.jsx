import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatIsoLocalDate, parseIsoLocalDate } from '../../shared/lib/dateUtils';
import { fmt, fmtPrice } from '../../shared/lib/finance';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from '../../shared/ui/UiAtoms';
import { Breadcrumb } from '../../shared/ui/Navigation';
import { ClientBreadcrumb } from '../clients/ClientCommon';
import { Donut, Legende } from '../home/HomeWidgets';
import { PortfolioOpeningPerformanceCard } from './PortfolioOpeningPerformanceCard';
import { PortfolioReportNoticeCard } from './PortfolioReportNoticeCard';
import { PortfolioAllocationAnalysis } from './PortfolioAllocationAnalysis';
import { PortfolioListedAssetsCard } from './PortfolioListedAssetsCard';
import { PortfolioActivityCards } from './PortfolioActivityCards';
import { PortfolioDetailHeader } from './PortfolioDetailHeader';
import { CLIENT_GESTION_LIBRE, orderBookDemo, executionsDemo } from '../clients/ClientDomainData';
import { MARKETS_DATA, resolveMarketInstrument } from '../markets/MarketDomainData';
import {
  ACTIONS_LIST,
  OBLIGATIONS_LIST,
  ENCAISSEMENTS,
  versementsDemo,
  rentabiliteComment,
  besoinsReequilibrageClient,
  exposureOf,
  gsmListedAssetMetrics,
} from '../trading/TradingDomainData';
import { cessionNonListedPositionsForClient } from '../trading/CessionWorkflow';

const MOIS_HISTORIQUE_CLASSES_ACTIFS = [
  { key: '2025-09', label: 'Sept 25' },
  { key: '2025-10', label: 'Oct' },
  { key: '2025-11', label: 'Nov' },
  { key: '2025-12', label: 'Déc' },
  { key: '2026-01', label: 'Jan 26' },
  { key: '2026-02', label: 'Fév' },
  { key: '2026-03', label: 'Mar' },
  { key: '2026-04', label: 'Avr' },
  { key: '2026-05', label: 'Mai' },
  { key: '2026-06', label: 'Juin' },
  { key: '2026-07', label: 'Juil' },
  { key: '2026-08', label: 'Août' },
];

const CLASSES_ACTIFS_HISTORIQUES = [
  { key: 'Actions', label: 'Actions', color: C.navy },
  { key: 'OblSouveraines', label: 'Obligations souveraines', color: C.gold },
  { key: 'OblPrivees', label: 'Obligations privées', color: C.teal },
  { key: 'Liquidite', label: 'Liquidité', color: C.indigo },
];

const INSTRUMENT_ETAT = {
  SONATEL: 'Sénégal',
  'ECOBANK CI': "Côte d'Ivoire",
  PALMCI: "Côte d'Ivoire",
  'MTN NIGERIA': 'Nigeria',
  'ZENITH BANK': 'Nigeria',
  'GCB BANK': 'Ghana',
  'Obligation Trésor CI 6.5% 2029': "Côte d'Ivoire",
  'Obligation Trésor NGN 2028': 'Nigeria',
  'Obligation Corporate GSE 2027': 'Ghana',
};

const ORDRE_ETATS_INVESTISSEMENT = [
  "Côte d'Ivoire",
  'Sénégal',
  'Nigeria',
  'Ghana',
  'Autres',
];

const fmtCompactMontant = (value) =>
  new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const seedPortefeuille = (client) =>
  String(client?.id || client?.nom || '')
    .split('')
    .reduce((somme, caractere, index) => {
      return somme + caractere.charCodeAt(0) * (index + 1);
    }, 0);

const buildHistoriqueClassesActifs = (client) => {
  const montantsActuels = {
    Actions:
      (Number(client.encours || 0) * Number(client.alloc.Actions || 0)) / 100,
    OblSouveraines:
      (Number(client.encours || 0) *
        Number(client.alloc['Obl. souveraines'] || 0)) /
      100,
    OblPrivees:
      (Number(client.encours || 0) *
        Number(client.alloc['Obl. privées'] || 0)) /
      100,
    Liquidite:
      (Number(client.encours || 0) * Number(client.alloc.Liquidité || 0)) / 100,
  };

  const rendementClient = Number(client.perf || 0);
  const rendementsClasses = {
    Actions: Math.max(-18, Math.min(24, rendementClient * 1.25 + 2.2)),
    OblSouveraines: Math.max(-6, Math.min(12, rendementClient * 0.3 + 2.0)),
    OblPrivees: Math.max(-8, Math.min(14, rendementClient * 0.45 + 2.6)),
    Liquidite: Math.max(0.2, Math.min(3.5, rendementClient * 0.08 + 0.8)),
  };

  // Profils mensuels déterministes inspirés d'un comportement de marché réaliste :
  // les actions sont plus volatiles, les obligations souveraines plus stables,
  // les obligations privées intermédiaires et la liquidité quasi stable.
  // Les chocs sont exprimés en décimal et sont combinés avec une dérive mensuelle
  // calibrée pour que le rendement cumulé sur 11 intervalles corresponde au
  // rendement annuel cible de chaque classe.
  const chocsMensuelsBase = {
    Actions: [
      -0.021, 0.026, -0.013, 0.031, 0.009, -0.027, 0.019, -0.008, 0.024, -0.016,
      0.012,
    ],
    OblSouveraines: [
      -0.003, 0.0022, -0.0012, 0.0034, 0.0016, -0.0025, 0.002, -0.001, 0.0027,
      -0.0015, 0.0013,
    ],
    OblPrivees: [
      -0.005, 0.004, -0.0025, 0.006, 0.0028, -0.0045, 0.0036, -0.002, 0.0048,
      -0.0032, 0.0025,
    ],
    Liquidite: [
      0.0015, -0.001, 0.0008, 0.0012, -0.0006, 0.001, -0.0005, 0.0009, -0.0004,
      0.0006, -0.0003,
    ],
  };

  const seed = seedPortefeuille(client);
  const historique = MOIS_HISTORIQUE_CLASSES_ACTIFS.map((mois) => ({
    mois: mois.label,
    date: mois.key,
  }));

  Object.keys(montantsActuels).forEach((classe, classeIndex) => {
    const rendementAnnuel = rendementsClasses[classe] / 100;
    const montantActuel = Number(montantsActuels[classe] || 0);
    const chocsBase = chocsMensuelsBase[classe];
    const decalage = (seed + classeIndex * 2) % chocsBase.length;
    const multiplicateurVolatilite =
      0.88 + ((seed + classeIndex * 17) % 25) / 100;

    const chocsPersonnalises = chocsBase.map((_, index) => {
      const choc = chocsBase[(index + decalage) % chocsBase.length];
      const microVariation =
        ((((seed + index * 11 + classeIndex * 7) % 9) - 4) / 10000) *
        (classe === 'Actions' ? 4 : classe === 'OblPrivees' ? 2 : 1);
      return choc * multiplicateurVolatilite + microVariation;
    });

    const produitChocs = chocsPersonnalises.reduce(
      (produit, choc) => produit * (1 + choc),
      1
    );
    const nombreIntervalles = chocsPersonnalises.length;
    const deriveMensuelle =
      Math.pow(
        Math.max(0.65, 1 + rendementAnnuel) / produitChocs,
        1 / nombreIntervalles
      ) - 1;

    const montantDepart = montantActuel / Math.max(0.65, 1 + rendementAnnuel);
    let montant = montantDepart;
    historique[0][classe] = Math.round(montant);

    chocsPersonnalises.forEach((choc, index) => {
      const rendementMensuel = (1 + deriveMensuelle) * (1 + choc) - 1;
      montant *= 1 + rendementMensuel;
      historique[index + 1][classe] = Math.round(montant);
      historique[index + 1][`${classe}Variation`] = Number(
        (rendementMensuel * 100).toFixed(2)
      );
    });

    // Sécurise l'égalité exacte entre le dernier point du graphique et la
    // valorisation courante affichée ailleurs dans la fiche portefeuille.
    historique[historique.length - 1][classe] = Math.round(montantActuel);
  });

  historique.forEach((ligne) => {
    ligne.TotalInvesti =
      Number(ligne.Actions || 0) +
      Number(ligne.OblSouveraines || 0) +
      Number(ligne.OblPrivees || 0);  });

  return historique;
};

const buildRepartitionEtatsInvestissement = (client, categorie) => {
  const estAction = categorie === 'Actions';
  const estObligataire = categorie === 'Obligations';

  const montantActions =
    (Number(client.encours || 0) * Number(client.alloc.Actions || 0)) / 100;
  const montantObligations =
    (Number(client.encours || 0) *
      (Number(client.alloc['Obl. souveraines'] || 0) +
        Number(client.alloc['Obl. privées'] || 0))) /
    100;

  const repartirClasse = (type, montantClasse) => {
    if (montantClasse <= 0) return {};

    const instruments = MARKETS_DATA.filter(
      (instrument) =>
        instrument.marche === client.marche && instrument.type === type
    );

    if (instruments.length === 0) {
      return { [client.pays || 'Autres']: montantClasse };
    }

    const poidsBruts = instruments.map((instrument) => ({
      etat: INSTRUMENT_ETAT[instrument.nom] || client.pays || 'Autres',
      poids: Math.max(0, Number(exposureOf(client.id, instrument.nom) || 0)),
    }));
    const totalPoids = poidsBruts.reduce(
      (somme, item) => somme + item.poids,
      0
    );

    return poidsBruts.reduce((acc, item) => {
      const poidsNormalise =
        totalPoids > 0 ? item.poids / totalPoids : 1 / poidsBruts.length;
      acc[item.etat] = (acc[item.etat] || 0) + montantClasse * poidsNormalise;
      return acc;
    }, {});
  };

  const actionsParEtat = repartirClasse('Action', montantActions);
  const obligationsParEtat = repartirClasse('Obligation', montantObligations);

  let source = {};
  if (estAction) {
    source = actionsParEtat;
  } else if (estObligataire) {
    source = obligationsParEtat;
  } else {
    [
      ...Object.entries(actionsParEtat),
      ...Object.entries(obligationsParEtat),
    ].forEach(([etat, montant]) => {
      source[etat] = (source[etat] || 0) + montant;
    });
  }

  const total = Object.values(source).reduce(
    (somme, montant) => somme + Number(montant || 0),
    0
  );

  return Object.entries(source)
    .filter(([, montant]) => Number(montant) > 0)
    .sort(([etatA], [etatB]) => {
      const indexA = ORDRE_ETATS_INVESTISSEMENT.indexOf(etatA);
      const indexB = ORDRE_ETATS_INVESTISSEMENT.indexOf(etatB);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    })
    .map(([name, montant]) => ({
      name,
      montant,
      devise: client.devise,
      value: total > 0 ? Number(((montant / total) * 100).toFixed(1)) : 0,
    }));
};

const formatDateFluxClient = (date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

const dateFluxClientEntre = (dateDebut, dateFin, ratio) => {
  const debut = dateDebut.getTime();
  const fin = dateFin.getTime();
  return new Date(debut + Math.max(0, Math.min(1, ratio)) * (fin - debut));
};

const repartirMontantFluxClient = (montantTotal, poids) => {
  const total = Math.max(0, Math.round(Number(montantTotal || 0)));
  if (poids.length === 0) return [];

  let reste = total;
  return poids.map((poidsCourant, index) => {
    if (index === poids.length - 1) return reste;
    const montant = Math.min(
      reste,
      Math.round(total * Number(poidsCourant || 0))
    );
    reste -= montant;
    return montant;
  });
};

/*
 * Maquette : historique de flux construit de manière déterministe à partir du
 * portefeuille. En production, remplacer cette fonction par les dépôts et
 * retraits réellement enregistrés en base.
 *
 * Plus / moins-value cumulée = encours actuel + retraits cumulés - dépôts cumulés
 * % représentatif = plus / moins-value cumulée / dépôts cumulés
 */
const buildSituationDepuisOuverture = (client) => {
  const encoursActuel = Math.max(0, Number(client.encours || 0));
  const dateOuverture = parseIsoLocalDate(
    client.dateEntree || formatIsoLocalDate(new Date())
  );
  const dateReference = new Date();
  const joursOuverts = Math.max(
    1,
    Math.round((dateReference - dateOuverture) / 86_400_000)
  );
  const anneesOuvertes = Math.max(14 / 365.25, joursOuverts / 365.25);
  const seed = seedPortefeuille(client);

  // Le taux existant du portefeuille sert uniquement à produire une
  // démonstration cohérente depuis l'ouverture.
  const rendementAnnuelDemo =
    Number(client.rentabilite ?? client.perf ?? 0) / 100;
  const rendementCumuleDemo = Math.max(
    -0.35,
    Math.min(
      0.75,
      Math.pow(Math.max(0.2, 1 + rendementAnnuelDemo), anneesOuvertes) - 1
    )
  );

  let ratioRetraits = 0;
  if (joursOuverts >= 365) {
    ratioRetraits = 0.035 + (seed % 5) * 0.009;
  } else if (joursOuverts >= 120 && seed % 2 === 0) {
    ratioRetraits = 0.02 + (seed % 3) * 0.006;
  }

  const totalRetraits = Math.round(encoursActuel * ratioRetraits);
  const totalDepots = Math.max(
    1,
    Math.round(
      (encoursActuel + totalRetraits) / Math.max(0.2, 1 + rendementCumuleDemo)
    )
  );
  const poidsDepots =
    joursOuverts >= 365
      ? [0.72, 0.18, 0.1]
      : joursOuverts >= 90
      ? [0.82, 0.18]
      : [1];
  const ratiosDatesDepots =
    poidsDepots.length === 3
      ? [0, 0.34, 0.69]
      : poidsDepots.length === 2
      ? [0, 0.58]
      : [0];
  const montantsDepots = repartirMontantFluxClient(totalDepots, poidsDepots);

  const flux = montantsDepots.map((montant, index) => ({
    id: `${client.id}-DEP-${index + 1}`,
    type: 'Dépôt',
    libelle:
      index === 0
        ? "Versement initial à l'ouverture"
        : index === 1
        ? 'Versement complémentaire'
        : 'Renforcement du capital',
    date: dateFluxClientEntre(
      dateOuverture,
      dateReference,
      ratiosDatesDepots[index] || 0
    ),
    montant,
    devise: client.devise,
  }));

  if (totalRetraits > 0) {
    const poidsRetraits = joursOuverts >= 540 ? [0.62, 0.38] : [1];
    const ratiosDatesRetraits =
      poidsRetraits.length === 2 ? [0.55, 0.83] : [0.74];
    const montantsRetraits = repartirMontantFluxClient(
      totalRetraits,
      poidsRetraits
    );

    montantsRetraits.forEach((montant, index) => {
      flux.push({
        id: `${client.id}-RET-${index + 1}`,
        type: 'Retrait',
        libelle:
          index === 0 ? 'Retrait partiel du client' : 'Retrait complémentaire',
        date: dateFluxClientEntre(
          dateOuverture,
          dateReference,
          ratiosDatesRetraits[index] || 0.74
        ),
        montant,
        devise: client.devise,
      });
    });
  }

  flux.sort((a, b) => a.date - b.date);

  const capitalNetVerse = totalDepots - totalRetraits;
  const plusMoinsValue = encoursActuel + totalRetraits - totalDepots;
  const pourcentagePlusMoinsValue =
    totalDepots > 0 ? (plusMoinsValue / totalDepots) * 100 : 0;

  return {
    dateOuverture,
    encoursActuel,
    totalDepots,
    totalRetraits,
    capitalNetVerse,
    plusMoinsValue,
    pourcentagePlusMoinsValue,
    flux,
  };
};

function PortefeuilleDetail({ client, go, reportOpen, onGenerateReport }) {
  const [detailFluxOuvert, setDetailFluxOuvert] = useState(false);
  const [reportPeriod, setReportPeriod] = useState(
    reportOpen?.period || 'Trimestre en cours'
  );

  useEffect(() => {
    setReportPeriod(reportOpen?.period || 'Trimestre en cours');
  }, [client.id, reportOpen?.period]);
  const situationDepuisOuverture = buildSituationDepuisOuverture(client);
  const plusValuePositive = situationDepuisOuverture.plusMoinsValue >= 0;
  const obligationsNonCotees =
    cessionNonListedPositionsForClient(client);

  const data = Object.entries(client.alloc).map(([name, value]) => ({
    name,
    value,
    montant: Math.round(
      (Number(client.encours || 0) * Number(value || 0)) / 100
    ),
    devise: client.devise,
  }));
  const besoinsReequilibrage = besoinsReequilibrageClient(client);
  const historiqueClassesActifs = buildHistoriqueClassesActifs(client);
  const repartitionEtatsActions = buildRepartitionEtatsInvestissement(
    client,
    'Actions'
  );
  const repartitionEtatsObligations = buildRepartitionEtatsInvestissement(
    client,
    'Obligations'
  );
  const repartitionEtatsGenerale = buildRepartitionEtatsInvestissement(
    client,
    'General'
  );

  return (
    <div className="gsm-native-portfoliodetailworkflow-ce3b8648c">
      <Breadcrumb items={['Accueil', 'Portefeuilles', client.nom]} />
      <div className="gsm-responsive-header gsm-native-portfoliodetailworkflow-ad271d23b">
        <div>
          <h2
            className="gsm-native-portfoliodetailworkflow-60762e907"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            {client.nom}
          </h2>
          <div className="gsm-native-portfoliodetailworkflow-d118725f9">
            <Badge tone="navy">{client.type}</Badge>
            <Badge tone="navy">
              {client.marche} · {client.devise}
            </Badge>
            <Badge tone="slate">Risque {client.risque}</Badge>
          </div>
        </div>
        <div className="gsm-responsive-actions gsm-native-portfoliodetailworkflow-7b4b5152f">
          {besoinsReequilibrage.length > 0 ? (
            <Btn
              tone="ghost"
              onClick={() =>
                go('reequilibrage', {
                  client: client.id,
                  actif: besoinsReequilibrage[0].actif,
                })
              }
            >
              Voir {besoinsReequilibrage.length} écart(s) → Rééquilibrage
            </Btn>
          ) : (
            <Badge tone="teal">Allocation conforme — aucun rééquilibrage</Badge>
          )}
          <div className="gsm-responsive-actions gsm-native-portfoliodetailworkflow-7b4b5152f">
            <select name="gsm-portfoliodetailworkflow-499"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="gsm-native-portfoliodetailworkflow-1077aba3c"
              style={{ borderColor: C.line, ...F_BODY }}
              aria-label="Période du rapport du portefeuille"
              title="Définir la période du rapport"
            >
              <option>Trimestre en cours</option>
              <option>Année en cours</option>
              <option>Personnalisée</option>
            </select>
            <Btn onClick={() => onGenerateReport(client.id, reportPeriod)}>
              Générer rapport
            </Btn>
          </div>
        </div>
      </div>

      <Card
        className="gsm-native-portfoliodetailworkflow-6fcda2c11"
        style={{
          borderColor: C.borderSubtle,
          background: C.surfaceCard,
        }}
      >
        <div className="gsm-native-portfoliodetailworkflow-fef35d53f">
          <div>
            <Eyebrow>Performance depuis l'ouverture du compte</Eyebrow>
            <div
              className="gsm-native-portfoliodetailworkflow-b10faa046"
              style={{ ...F_DISPLAY, color: C.ink }}
            >
              Plus / moins-value cumulée, nette des dépôts et retraits
            </div>
            <div className="gsm-native-portfoliodetailworkflow-ba2cbb285" style={{ color: C.sub, ...F_BODY }}>
              Compte ouvert le{' '}
              {formatDateFluxClient(situationDepuisOuverture.dateOuverture)}. Le
              calcul neutralise les flux externes du client afin de ne pas
              confondre un dépôt avec une performance ni un retrait avec une
              perte.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailFluxOuvert((ouvert) => !ouvert)}
            className="gsm-native-portfoliodetailworkflow-c71f3ef67"
            style={{
              background: detailFluxOuvert ? C.surfaceInset : C.activeBackground,
              color: C.textPrimary,
              ...F_BODY,
            }}
          >
            {detailFluxOuvert
              ? 'Masquer les dépôts & retraits'
              : 'Voir les dépôts & retraits'}
          </button>
        </div>

        <div className="gsm-native-portfoliodetailworkflow-3ec7ee8ca">
          <div
            className="gsm-native-portfoliodetailworkflow-3c34c572d"
            style={{ borderColor: C.line, background: C.surfaceCard }}
          >
            <div
              className="gsm-native-portfoliodetailworkflow-d64030ce5"
              style={{ color: C.sub }}
            >
              Encours actuel
            </div>
            <div
              className="gsm-native-portfoliodetailworkflow-7de7650d4"
              style={{ color: C.ink, ...F_MONO }}
            >
              {fmt(situationDepuisOuverture.encoursActuel)} {client.devise}
            </div>
          </div>

          <div
            className="gsm-native-portfoliodetailworkflow-3c34c572d"
            style={{ borderColor: C.line, background: C.surfaceCard }}
          >
            <div
              className="gsm-native-portfoliodetailworkflow-d64030ce5"
              style={{ color: C.sub }}
            >
              Total investi
            </div>
            <div
              className="gsm-native-portfoliodetailworkflow-7de7650d4"
              style={{ color: C.ink, ...F_MONO }}
            >
              {fmt(situationDepuisOuverture.totalDepots)} {client.devise}
            </div>
            <div className="gsm-native-portfoliodetailworkflow-b007904a4" style={{ color: C.sub }}>
              Somme de tous les dépôts
            </div>
          </div>

          <div
            className="gsm-native-portfoliodetailworkflow-3c34c572d"
            style={{ borderColor: C.line, background: C.surfaceCard }}
          >
            <div
              className="gsm-native-portfoliodetailworkflow-d64030ce5"
              style={{ color: C.sub }}
            >
              Retraits cumulés
            </div>
            <div
              className="gsm-native-portfoliodetailworkflow-7de7650d4"
              style={{ color: C.ink, ...F_MONO }}
            >
              {fmt(situationDepuisOuverture.totalRetraits)} {client.devise}
            </div>
            <div className="gsm-native-portfoliodetailworkflow-b007904a4" style={{ color: C.sub }}>
              Flux sortis du compte
            </div>
          </div>

          <div
            className="gsm-native-portfoliodetailworkflow-3c34c572d"
            style={{ borderColor: C.line, background: C.surfaceCard }}
          >
            <div
              className="gsm-native-portfoliodetailworkflow-d64030ce5"
              style={{ color: C.sub }}
            >
              Apport net cumulé
            </div>
            <div
              className="gsm-native-portfoliodetailworkflow-7de7650d4"
              style={{ color: C.ink, ...F_MONO }}
            >
              {fmt(situationDepuisOuverture.capitalNetVerse)} {client.devise}
            </div>
            <div className="gsm-native-portfoliodetailworkflow-b007904a4" style={{ color: C.sub }}>
              Dépôts − retraits
            </div>
          </div>

          <div
            className="gsm-native-portfoliodetailworkflow-3c34c572d"
            style={{
              borderColor: C.borderSubtle,
              background: C.surfaceCard,
            }}
          >
            <div
              className="gsm-native-portfoliodetailworkflow-d64030ce5"
              style={{ color: plusValuePositive ? C.teal : C.coral }}
            >
              {plusValuePositive ? 'Plus-value' : 'Moins-value'} cumulée
            </div>
            <div
              className="gsm-native-portfoliodetailworkflow-9736af066"
              style={{
                color: plusValuePositive ? C.teal : C.coral,
                ...F_MONO,
              }}
            >
              {plusValuePositive ? '+' : '-'}
              {fmt(Math.abs(situationDepuisOuverture.plusMoinsValue))}{' '}
              {client.devise}
            </div>
            <div className="gsm-native-portfoliodetailworkflow-6946130c0">
              <span
                className="gsm-native-portfoliodetailworkflow-0850330a7"
                style={{
                  color: plusValuePositive ? C.teal : C.coral,
                  ...F_MONO,
                }}
              >
                {plusValuePositive ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {Math.abs(
                  situationDepuisOuverture.pourcentagePlusMoinsValue
                ).toFixed(2)}
                % du total investi
              </span>
            </div>
          </div>
        </div>

        <div
          className="gsm-native-portfoliodetailworkflow-0917c5848"
          style={{
            borderTop: `1px solid ${C.borderSubtle}`,
            color: C.sub,
            ...F_BODY,
          }}
        >
          <b style={{ color: C.ink }}>Méthode :</b> plus / moins-value = encours
          actuel + retraits cumulés − dépôts cumulés. Le pourcentage affiché
          rapporte cette plus / moins-value à la somme de tous les dépôts
          effectués depuis l'ouverture. Il s'agit donc d'un indicateur cumulé
          simple, non annualisé.
        </div>

        {detailFluxOuvert && (
          <div className="gsm-native-portfoliodetailworkflow-0fe5c91fc">
            <div className="gsm-native-portfoliodetailworkflow-b6a01b442">
              <div>
                <div className="gsm-native-portfoliodetailworkflow-aaaece7d1" style={{ color: C.ink }}>
                  Historique des apports et retraits
                </div>
                <div className="gsm-native-portfoliodetailworkflow-243755aad" style={{ color: C.sub }}>
                  Flux externes pris en compte depuis l'ouverture du compte.
                </div>
              </div>
              <Badge tone="navy">
                {situationDepuisOuverture.flux.length} mouvement(s)
              </Badge>
            </div>

            <div
              className="gsm-table-scroll gsm-native-portfoliodetailworkflow-76a54a196"
              style={{ borderColor: C.line }}
            >
              <table className="gsm-table--banking gsm-native-portfoliodetailworkflow-1794bd61f">
                <thead style={{ background: C.surfaceElevated }}>
                  <tr>
                    <Th>Date</Th>
                    <Th>Nature</Th>
                    <Th>Libellé</Th>
                    <Th>Montant</Th>
                    <Th>Impact capital</Th>
                  </tr>
                </thead>
                <tbody>
                  {situationDepuisOuverture.flux.map((flux, index) => {
                    const depot = flux.type === 'Dépôt';
                    return (
                      <tr
                        key={flux.id}
                        style={{
                          borderTop:
                            index === 0 ? 'none' : `1px solid ${C.line}`,
                        }}
                      >
                        <Td mono>{formatDateFluxClient(flux.date)}</Td>
                        <Td>
                          <Badge tone={depot ? 'teal' : 'gold'}>
                            {flux.type}
                          </Badge>
                        </Td>
                        <Td>{flux.libelle}</Td>
                        <Td mono>
                          {fmt(flux.montant)} {flux.devise}
                        </Td>
                        <Td>
                          <span
                            className="gsm-native-portfoliodetailworkflow-aaaece7d1"
                            style={{
                              color: depot ? C.teal : C.coral,
                              ...F_MONO,
                            }}
                          >
                            {depot ? '+' : '-'}
                            {fmt(flux.montant)} {flux.devise}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              className="gsm-native-portfoliodetailworkflow-61ad875de"
              style={{ color: C.sub, ...F_BODY }}
            >
              Données de démonstration dans cette maquette. En production, cet
              historique devra provenir des mouvements espèces réellement
              enregistrés pour le compte du client.
            </div>
          </div>
        )}
      </Card>

      {reportOpen.notice && (
        <Card className="gsm-native-portfoliodetailworkflow-3b919ef44" style={{ borderColor: C.borderSubtle }}>
          <Eyebrow>
            Rapport d'analyse — {client.nom} ·{' '}
            {reportOpen.period || 'Trimestre en cours'}
          </Eyebrow>
          <div className="gsm-native-portfoliodetailworkflow-af09dfb5f" style={F_BODY}>
            <div>
              <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
                Situation globale
              </div>
              <div className="gsm-native-portfoliodetailworkflow-88a588833">
                {fmt(client.encours)} {client.devise}
              </div>
            </div>
            <div>
              <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
                Variation période
              </div>
              <div className="gsm-native-portfoliodetailworkflow-88a588833">
                {fmt(
                  Math.round(
                    client.encours - client.encours / (1 + client.perf / 100)
                  )
                )}{' '}
                {client.devise} <Pct v={client.perf} />
              </div>
            </div>
            <div>
              <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
                Rentabilité période
              </div>
              <div className="gsm-native-portfoliodetailworkflow-88a588833">
                <Pct v={client.rentabilite} />
              </div>
            </div>
          </div>
          <div className="gsm-native-portfoliodetailworkflow-989078498" style={F_BODY}>
            <div>
              <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
                Acquisitions
              </div>
              <div className="gsm-native-portfoliodetailworkflow-88a588833">3 opérations</div>
            </div>
            <div>
              <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
                Cessions / Encaiss.
              </div>
              <div className="gsm-native-portfoliodetailworkflow-88a588833">2 opérations</div>
            </div>
            <div>
              <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
                Retenues
              </div>
              <div className="gsm-native-portfoliodetailworkflow-88a588833">Fiscalité sur coupons</div>
            </div>
          </div>
          <div
            className="gsm-native-portfoliodetailworkflow-fc74b5d24"
            style={{
              borderTop: `1px solid ${C.borderSubtle}`,
              color: C.sub,
            }}
          >
            <b style={{ color: C.ink }}>Commentaire de Gestion :</b> la performance de la période reflète
            principalement le renforcement de la ligne Télécoms et
            l'encaissement d'un coupon obligataire ; l'écart d'allocation
            Actions reste au-dessus de la cible et justifie un arbitrage.
          </div>
          <div
            className="gsm-native-portfoliodetailworkflow-6125b4108"
            style={{ color: C.sub }}
          >
            <b style={{ color: C.ink }}>Commentaire (rentabilité) :</b>{' '}
            {rentabiliteComment(client)}
          </div>
        </Card>
      )}

      <div className="gsm-native-portfoliodetailworkflow-bb33c5822">
        <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
          <Eyebrow>Répartition par classe d'actifs</Eyebrow>
          <Donut data={data} size={150} />
          <Legende data={data} />
        </Card>
        <Card className="gsm-native-portfoliodetailworkflow-e9bca0ba2">
          <Eyebrow>Actuel vs cible</Eyebrow>
          <div className="gsm-native-portfoliodetailworkflow-1833b29f4">
            {Object.keys(client.alloc).map((k) => (
              <div key={k}>
                <div
                  className="gsm-native-portfoliodetailworkflow-0378de098"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  <span>{k}</span>
                  <span>
                    {client.alloc[k]}% (cible {client.cible[k]}%)
                  </span>
                </div>
                <div
                  className="gsm-native-portfoliodetailworkflow-768e1206f"
                  style={{ background: C.surfaceInset }}
                >
                  <div
                    className="gsm-native-portfoliodetailworkflow-768e1206f"
                    style={{
                      width: `${client.alloc[k]}%`,
                      background:
                        Math.abs(client.alloc[k] - client.cible[k]) > 5
                          ? C.coral
                          : C.teal,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11" style={{ borderColor: C.borderSubtle }}>
        <div className="gsm-native-portfoliodetailworkflow-83f5de769">
          <div>
            <Eyebrow>Évolution de la valorisation par classe d'actifs</Eyebrow>
            <div className="gsm-native-portfoliodetailworkflow-f3d43a9e6" style={{ color: C.ink }}>
              Historique sur 1 an · time frame mensuel
            </div>
            <div className="gsm-native-portfoliodetailworkflow-ba2cbb285" style={{ color: C.sub, ...F_BODY }}>
              Montants exprimés en {client.devise}. Les variations mensuelles
              sont différenciées selon le risque de chaque classe ; le dernier
              point correspond à la valorisation actuelle du portefeuille.
            </div>
          </div>
          <div className="gsm-native-portfoliodetailworkflow-96bd67636">
            <Badge tone="navy">12 mois</Badge>
            <Badge tone="gold">Mensuel</Badge>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={historiqueClassesActifs}
            margin={{ top: 10, right: 20, left: 8, bottom: 4 }}
          >
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 10, fill: C.sub }}
              axisLine={{ stroke: C.line }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: C.sub }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(value) => fmtCompactMontant(value)}
            />
            <Tooltip
              formatter={(value, name) => [
                `${fmt(Math.round(Number(value)))} ${client.devise}`,
                name,
              ]}
              labelFormatter={(label) => `Mois : ${label}`}
              contentStyle={{
                borderRadius: 10,
                fontSize: 12,
                border: `1px solid ${C.line}`,
              }}
            />
            {CLASSES_ACTIFS_HISTORIQUES.map((serie) => (
              <Line
                key={serie.key}
                type="monotone"
                dataKey={serie.key}
                name={serie.label}
                stroke={serie.color}
                strokeWidth={2.3}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <div
          className="gsm-native-portfoliodetailworkflow-54335119a"
          style={F_BODY}
        >
          {CLASSES_ACTIFS_HISTORIQUES.map((serie) => (
            <div
              key={serie.key}
              className="gsm-native-portfoliodetailworkflow-f88f06661"
              style={{ color: C.ink }}
            >
              <span
                className="gsm-native-portfoliodetailworkflow-78db909f9"
                style={{ height: 3, background: serie.color }}
              />
              {serie.label}
            </div>
          ))}
        </div>

        <div
          className="gsm-native-portfoliodetailworkflow-ae055bd54"
          style={{
            borderTop: `1px solid ${C.borderSubtle}`,
            color: C.sub,
            ...F_BODY,
          }}
        >
          Dans cette maquette, le détail historique mensuel par classe d'actifs
          est une série de démonstration reconstruite à partir de la
          valorisation et de l'allocation actuelles. Il pourra être remplacé
          directement par les valorisations historiques du backend.
        </div>
      </Card>

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
        <div className="gsm-native-portfoliodetailworkflow-04bd0e498">
          <div>
            <Eyebrow>Répartition géographique des investissements</Eyebrow>
            <div className="gsm-native-portfoliodetailworkflow-f3d43a9e6" style={{ color: C.ink }}>
              Répartition par État / pays de rattachement des instruments
            </div>
            <div className="gsm-native-portfoliodetailworkflow-ba2cbb285" style={{ color: C.sub, ...F_BODY }}>
              Lecture séparée des Actions, des Obligations, puis de l'ensemble
              des actifs investis hors liquidité.
            </div>
          </div>
          <Badge tone="navy">{client.marche}</Badge>
        </div>

        <div className="gsm-native-portfoliodetailworkflow-44a4200ff">
          {[
            {
              titre: 'Actions',
              sousTitre: `${fmt(
                Math.round(
                  (client.encours * Number(client.alloc.Actions || 0)) / 100
                )
              )} ${client.devise}`,
              data: repartitionEtatsActions,
            },
            {
              titre: 'Obligations',
              sousTitre: `${fmt(
                Math.round(
                  (client.encours *
                    (Number(client.alloc['Obl. souveraines'] || 0) +
                      Number(client.alloc['Obl. privées'] || 0))) /
                    100
                )
              )} ${client.devise}`,
              data: repartitionEtatsObligations,
            },
            {
              titre: 'Général',
              sousTitre: `${fmt(
                Math.round(
                  (client.encours *
                    (Number(client.alloc.Actions || 0) +
                      Number(client.alloc['Obl. souveraines'] || 0) +
                      Number(client.alloc['Obl. privées'] || 0))) /
                    100
                )
              )} ${client.devise}`,
              data: repartitionEtatsGenerale,
            },
          ].map((bloc, blocIndex) => (
            <div
              key={bloc.titre}
              className="gsm-native-portfoliodetailworkflow-3b919ef44"
              style={{
                borderLeft:
                  blocIndex === 0 ? 'none' : `1px solid ${C.borderSubtle}`,
              }}
            >
              <div className="gsm-native-portfoliodetailworkflow-fd377b2e5">
                <div>
                  <div
                    className="gsm-native-portfoliodetailworkflow-a4355fbee"
                    style={{ color: C.sub, ...F_BODY }}
                  >
                    {bloc.titre}
                  </div>
                  <div
                    className="gsm-native-portfoliodetailworkflow-c2e06ca03"
                    style={{ color: C.ink, ...F_MONO }}
                  >
                    {bloc.sousTitre}
                  </div>
                </div>
                <Badge tone={bloc.titre === 'Général' ? 'gold' : 'slate'}>
                  Par État
                </Badge>
              </div>

              {bloc.data.length > 0 ? (
                <>
                  <Donut data={bloc.data} size={165} />
                  <Legende data={bloc.data} />
                </>
              ) : (
                <div
                  className="gsm-native-portfoliodetailworkflow-2b9a7d69b"
                  style={{ color: C.sub, ...F_BODY }}
                >
                  Aucun investissement dans cette catégorie.
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="gsm-native-portfoliodetailworkflow-096377834" style={{ color: C.sub, ...F_BODY }}>
          Le rattachement géographique est déterminé à partir de l'émetteur ou
          de l'État associé à l'instrument disponible dans la maquette. La vue
          générale agrège Actions et Obligations et exclut la liquidité.
        </div>
      </Card>

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
        <Eyebrow>Situation globale</Eyebrow>
        <div className="gsm-native-portfoliodetailworkflow-3367f8897">
          <div>
            <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
              Valorisation des actifs
            </div>
            <div className="gsm-native-portfoliodetailworkflow-60762e907" style={F_DISPLAY}>
              {fmt(
                Math.round(
                  (client.encours * (100 - client.alloc['Liquidité'])) / 100
                )
              )}{' '}
              {client.devise}
            </div>
          </div>
          <div>
            <div className="gsm-native-portfoliodetailworkflow-9933d0108" style={{ color: C.sub }}>
              Liquidité
            </div>
            <div className="gsm-native-portfoliodetailworkflow-60762e907" style={F_DISPLAY}>
              {fmt(
                Math.round((client.encours * client.alloc['Liquidité']) / 100)
              )}{' '}
              {client.devise}
            </div>
          </div>
        </div>
      </Card>

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
        <div className="gsm-native-portfoliodetailworkflow-fef35d53f">
          <div>
            <Eyebrow>Présentation des actifs cotés</Eyebrow>
            <div className="gsm-native-portfoliodetailworkflow-243755aad" style={{ color: C.sub, ...F_BODY }}>
              CMP = Coût Moyen Pondéré · +/- Value = gain ou perte latent(e) de
              la ligne par rapport à sa valorisation actuelle.
            </div>
          </div>
          <Badge tone="slate">Valorisation par ligne</Badge>
        </div>

        <div className="gsm-native-portfoliodetailworkflow-d0109df6b">
          <div>
            <div
              className="gsm-native-portfoliodetailworkflow-30340992c"
              style={{ color: C.sub }}
            >
              Actions
            </div>

            <div className="gsm-table-scroll">
              <table className="gsm-table--banking gsm-native-portfoliodetailworkflow-1794bd61f" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <Th>Titre</Th>
                    <Th>Exposition</Th>
                    <Th>CMP</Th>
                    <Th>Valeur estimée</Th>
                    <Th>+/- Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIONS_LIST.filter((t) => exposureOf(client.id, t) > 0).map(
                    (t) => {
                      const ligne = gsmListedAssetMetrics(client, t);
                      const gain = ligne.plusMoinsValue >= 0;

                      return (
                        <tr
                          key={t}
                          style={{ borderTop: `1px solid ${C.line}` }}
                        >
                          <Td>{t}</Td>
                          <Td mono>{ligne.exposition}%</Td>
                          <Td mono className="gsm-native-portfoliodetailworkflow-5cfdd0277">
                            {fmtPrice(ligne.cmp)} {client.devise}
                          </Td>
                          <Td mono className="gsm-native-portfoliodetailworkflow-5cfdd0277">
                            {fmt(Math.round(ligne.valeurMarche))}{' '}
                            {client.devise}
                          </Td>
                          <Td>
                            <div
                              className="gsm-native-portfoliodetailworkflow-3108f50a9"
                              style={{
                                color: gain ? C.teal : C.coral,
                                ...F_MONO,
                              }}
                            >
                              <span className="gsm-native-portfoliodetailworkflow-1fbf31f74">
                                {gain ? (
                                  <ArrowUpRight size={13} />
                                ) : (
                                  <ArrowDownRight size={13} />
                                )}
                                {gain ? '+' : '-'}
                                {fmt(
                                  Math.round(Math.abs(ligne.plusMoinsValue))
                                )}{' '}
                                {client.devise}
                              </span>
                              <span className="gsm-native-portfoliodetailworkflow-e6becb5f1">
                                {gain ? '+' : '-'}
                                {Math.abs(ligne.plusMoinsValuePct).toFixed(2)}%
                              </span>
                            </div>
                          </Td>
                        </tr>
                      );
                    }
                  )}
                  {ACTIONS_LIST.every(
                    (t) => exposureOf(client.id, t) === 0
                  ) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="gsm-native-portfoliodetailworkflow-c30f58347"
                        style={{ color: C.sub }}
                      >
                        Aucune action détenue
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div
              className="gsm-native-portfoliodetailworkflow-30340992c"
              style={{ color: C.sub }}
            >
              Obligations
            </div>

            <div className="gsm-table-scroll">
              <table className="gsm-table--banking gsm-native-portfoliodetailworkflow-1794bd61f" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <Th>Titre</Th>
                    <Th>Exposition</Th>
                    <Th>CMP</Th>
                    <Th>Valeur estimée</Th>
                    <Th>+/- Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {OBLIGATIONS_LIST.filter(
                    (t) => exposureOf(client.id, t) > 0
                  ).map((t) => {
                    const ligne = gsmListedAssetMetrics(client, t);
                    const gain = ligne.plusMoinsValue >= 0;

                    return (
                      <tr key={t} style={{ borderTop: `1px solid ${C.line}` }}>
                        <Td>{t}</Td>
                        <Td mono>{ligne.exposition}%</Td>
                        <Td mono className="gsm-native-portfoliodetailworkflow-5cfdd0277">
                          {fmtPrice(ligne.cmp)} {client.devise}
                        </Td>
                        <Td mono className="gsm-native-portfoliodetailworkflow-5cfdd0277">
                          {fmt(Math.round(ligne.valeurMarche))} {client.devise}
                        </Td>
                        <Td>
                          <div
                            className="gsm-native-portfoliodetailworkflow-3108f50a9"
                            style={{
                              color: gain ? C.teal : C.coral,
                              ...F_MONO,
                            }}
                          >
                            <span className="gsm-native-portfoliodetailworkflow-1fbf31f74">
                              {gain ? (
                                <ArrowUpRight size={13} />
                              ) : (
                                <ArrowDownRight size={13} />
                              )}
                              {gain ? '+' : '-'}
                              {fmt(
                                Math.round(Math.abs(ligne.plusMoinsValue))
                              )}{' '}
                              {client.devise}
                            </span>
                            <span className="gsm-native-portfoliodetailworkflow-e6becb5f1">
                              {gain ? '+' : '-'}
                              {Math.abs(ligne.plusMoinsValuePct).toFixed(2)}%
                            </span>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                  {OBLIGATIONS_LIST.every(
                    (t) => exposureOf(client.id, t) === 0
                  ) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="gsm-native-portfoliodetailworkflow-c30f58347"
                        style={{ color: C.sub }}
                      >
                        Aucune obligation détenue en direct
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          className="gsm-native-portfoliodetailworkflow-9e6ace51e"
          style={{
            borderTop: `1px solid ${C.borderSubtle}`,
            color: C.sub,
            ...F_BODY,
          }}
        >
          <b style={{ color: C.ink }}>Calcul :</b> +/- Value = valeur de marché
          de la ligne − coût historique de la position. Le coût historique est
          obtenu à partir du CMP multiplié par la quantité correspondante.
          Lorsque le backend fournira les CMP issus des lots réels, ils seront
          utilisés automatiquement à la place du fallback de démonstration.
        </div>
      </Card>

      <Card
        className="gsm-native-portfoliodetailworkflow-6fcda2c11"
        style={{ borderColor: C.borderSubtle }}
      >
        <div className="gsm-native-portfoliodetailworkflow-fef35d53f">
          <div>
            <Eyebrow>
              Obligations non cotées détenues
            </Eyebrow>
            <div
              className="gsm-native-portfoliodetailworkflow-fe4cf1a27"
              style={{ color: C.ink }}
            >
              Positions de gré à gré intégrées au portefeuille
            </div>
            <div
              className="gsm-native-portfoliodetailworkflow-f18edb361"
              style={{ color: C.sub, ...F_BODY }}
            >
              Ces lignes font partie de la poche « Obl. privées » déjà
              comptabilisée dans l'allocation. Elles ne gonflent pas
              l'encours du portefeuille et ne sont jamais envoyées au
              carnet de bourse. En cas de retrait, elles passent
              exclusivement par les cessions internes.
            </div>
          </div>

          <div className="gsm-native-portfoliodetailworkflow-e90b49a6c">
            <Badge
              tone={
                obligationsNonCotees.length > 0
                  ? 'teal'
                  : 'slate'
              }
            >
              {obligationsNonCotees.length} ligne(s)
            </Badge>
            <Badge tone="navy">
              Marché non coté
            </Badge>
          </div>
        </div>

        <div className="gsm-table-scroll gsm-native-portfoliodetailworkflow-a181659a8">
          <table
            className="gsm-table--banking"
            style={{ minWidth: 1580 }}
          >
            <colgroup>
              <col style={{ width: 190 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 145 }} />
              <col style={{ width: 175 }} />
              <col style={{ width: 115 }} />
              <col style={{ width: 145 }} />
            </colgroup>
            <thead style={{ background: C.surfaceElevated }}>
              <tr>
                <Th>Titre</Th>
                <Th>Émetteur</Th>
                <Th>Marché réf.</Th>
                <Th>Coupon</Th>
                <Th>Rendement</Th>
                <Th>Échéance</Th>
                <Th>Exposition</Th>
                <Th>Quantité</Th>
                <Th>CMP</Th>
                <Th>Prix valorisation</Th>
                <Th>Valeur</Th>
                <Th>Cotation</Th>
                <Th>Canal de cession</Th>
              </tr>
            </thead>

            <tbody>
              {obligationsNonCotees.map(
                (position, index) => {
                  const plusMoinsValue =
                    (Number(
                      position.prixValorisation || 0
                    ) -
                      Number(position.cmp || 0)) *
                    Number(position.quantite || 0);

                  return (
                    <tr
                      key={`${position.titre}-${index}`}
                      style={{
                        borderTop: `1px solid ${C.line}`,
                        background:
                          index % 2 ? C.rowAlternate : C.surfaceCard,
                      }}
                    >
                      <Td>
                        <div className="gsm-table__primary">
                          {position.titre}
                        </div>
                      </Td>
                      <Td>
                        <div className="gsm-table__primary" style={{ fontWeight: 400 }}>
                          {position.emetteur}
                        </div>
                      </Td>
                      <Td>
                        <Badge tone="slate">
                          {position.marche}
                        </Badge>
                      </Td>
                      <Td mono>
                        {Number(position.coupon || 0).toFixed(2)}%
                      </Td>
                      <Td mono>
                        {Number(position.rendement || 0).toFixed(2)}%
                      </Td>
                      <Td mono>
                        {position.echeance}
                      </Td>
                      <Td mono>
                        {Number(position.expositionPct || 0).toFixed(2)}%
                      </Td>
                      <Td mono>
                        {fmt(position.quantite)}
                      </Td>
                      <Td mono className="gsm-native-portfoliodetailworkflow-5cfdd0277">
                        {fmtPrice(position.cmp)}{' '}
                        {position.devise}
                      </Td>
                      <Td mono className="gsm-native-portfoliodetailworkflow-5cfdd0277">
                        {fmtPrice(
                          position.prixValorisation
                        )}{' '}
                        {position.devise}
                      </Td>
                      <Td mono>
                        <div className="gsm-table__metric-stack">
                          <span>
                            {fmt(Math.round(position.valeur))} {position.devise}
                          </span>
                          <span
                            className="gsm-table__secondary"
                            style={{
                              color:
                                plusMoinsValue >= 0
                                  ? C.teal
                                  : C.coral,
                            }}
                          >
                            {plusMoinsValue >= 0 ? '+' : ''}
                            {fmt(Math.round(plusMoinsValue))} latent
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone="teal">
                          Non coté
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone="navy">
                          Cession interne
                        </Badge>
                      </Td>
                    </tr>
                  );
                }
              )}

              {obligationsNonCotees.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="gsm-native-portfoliodetailworkflow-2ec232c90"
                    style={{ color: C.sub }}
                  >
                    Aucune obligation non cotée dans ce
                    portefeuille.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="gsm-native-portfoliodetailworkflow-9e6ace51e"
          style={{
            borderTop: `1px solid ${C.borderSubtle}`,
            color: C.sub,
            ...F_BODY,
          }}
        >
          <b style={{ color: C.ink }}>
            Données de démonstration :
          </b>{' '}
          les positions non cotées sont générées de façon
          déterministe à l'intérieur de la poche « Obl. privées ».
          En production, elles devront être remplacées par les
          positions réelles du backend.
        </div>
      </Card>

      <div className="gsm-native-portfoliodetailworkflow-6e4e732c4">
        <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
          <Eyebrow>
            Présentation des encaissements (dividendes, coupons)
          </Eyebrow>
          <table className="gsm-native-portfoliodetailworkflow-66835e90e">
            <thead>
              <tr>
                <Th>Titre</Th>
                <Th>Type</Th>
                <Th>Montant</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {ENCAISSEMENTS.filter(
                (e) => exposureOf(client.id, e.titre) > 0
              ).map((e, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                  <Td>{e.titre}</Td>
                  <Td>
                    <Badge tone="teal">{e.type}</Badge>
                  </Td>
                  <Td mono>
                    {fmt(e.montant)} {e.devise}
                  </Td>
                  <Td>{e.date}</Td>
                </tr>
              ))}
              {ENCAISSEMENTS.filter((e) => exposureOf(client.id, e.titre) > 0)
                .length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="gsm-native-portfoliodetailworkflow-c30f58347"
                    style={{ color: C.sub }}
                  >
                    Aucun encaissement sur la période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
          <Eyebrow>
            Présentation des versements (espèces, chèques, virement)
          </Eyebrow>
          <table className="gsm-native-portfoliodetailworkflow-66835e90e">
            <thead>
              <tr>
                <Th>Type</Th>
                <Th>Montant</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {versementsDemo(client).map((v, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                  <Td>
                    <Badge tone="navy">{v.type}</Badge>
                  </Td>
                  <Td mono>
                    {fmt(v.montant)} {v.devise}
                  </Td>
                  <Td>{v.date}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
        <Eyebrow>Mouvements récents</Eyebrow>
        <table className="gsm-native-portfoliodetailworkflow-66835e90e">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Titre</Th>
              <Th>Montant</Th>
            </tr>
          </thead>
          <tbody>
            {[
              ['18/07/2026', 'Acquisition', 'SONATEL', '7 100 000 XOF'],
              [
                '12/07/2026',
                'Encaissement',
                'Coupon Trésor 6.5%',
                '410 000 XOF',
              ],
              ['03/07/2026', 'Cession', 'ECOBANK CI', '7 980 000 XOF'],
            ].map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                {r.map((c, j) => (
                  <Td key={j} mono={j === 3}>
                    {c}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}



function ProfondeurMarche({ ctx, go, mode = 'gestionnaire', goClient }) {
  const m =
    resolveMarketInstrument(ctx?.instrument, ctx?.marche) || MARKETS_DATA[0];
  const { asks, bids } = orderBookDemo(m);
  const execs = executionsDemo(m);
  const espaceClient = mode === 'client';
  const portefeuillesCompatibles = espaceClient
    ? CLIENT_GESTION_LIBRE.portefeuilles.filter(
        (portefeuille) => portefeuille.marche === m.marche
      )
    : [];

  return (
    <div className="gsm-native-portfoliodetailworkflow-ce3b8648c">
      {espaceClient ? (
        <ClientBreadcrumb
          items={[
            'Espace Client',
            ctx?.source === 'vue-boursiere'
              ? 'Marchés Actions'
              : 'Marchés Obligataire',
            'Profondeur',
            m.nom,
          ]}
        />
      ) : (
        <Breadcrumb
          items={[
            'Accueil',
            ctx?.source === 'vue-boursiere'
              ? 'Marchés Actions'
              : 'Marchés Obligataire',
            m.nom,
          ]}
        />
      )}

      <div className="gsm-native-portfoliodetailworkflow-2b71d847e">
        <div>
          <h2
            className="gsm-native-portfoliodetailworkflow-60762e907"
            style={{ ...F_DISPLAY, color: C.ink }}
          >
            {m.nom}
          </h2>
          <div className="gsm-native-portfoliodetailworkflow-cd8ea5b35">
            <Badge tone="navy">{m.marche}</Badge>
            <span className="gsm-native-portfoliodetailworkflow-e77da2318" style={F_MONO}>
              {fmtPrice(m.cours)} {m.devise}
            </span>
            <Pct v={m.variation} />
            {espaceClient && portefeuillesCompatibles.length > 0 && (
              <Badge tone="gold">
                {portefeuillesCompatibles.length} SGI compatibles
              </Badge>
            )}
          </div>
        </div>

        {espaceClient ? (
          <div className="gsm-native-portfoliodetailworkflow-96bd67636">
            <Btn
              tone="ghost"
              onClick={() =>
                goClient?.(
                  ctx?.source === 'vue-boursiere'
                    ? 'client-exchanges'
                    : 'client-markets'
                )
              }
            >
              Retour au marché
            </Btn>
            <Btn
              onClick={() =>
                goClient?.('client-ticket', {
                  instrument: m.nom,
                  marche: m.marche,
                  source:
                    ctx?.source ||
                    (m.type === 'Obligation' ? 'obligations' : 'vue-boursiere'),
                })
              }
            >
              Ticket d'ordre
            </Btn>
          </div>
        ) : (
          <Btn
            tone="ghost"
            onClick={() =>
              go('carnet', { marche: m.marche, instrument: m.nom })
            }
          >
            Voir le carnet d'ordres interne
          </Btn>
        )}
      </div>

      {espaceClient && (
        <Card className="gsm-native-portfoliodetailworkflow-3b919ef44" style={{ borderColor: C.borderSubtle }}>
          <div className="gsm-native-portfoliodetailworkflow-30fe6ba91">
            <div>
              <div
                className="gsm-native-portfoliodetailworkflow-d64030ce5"
                style={{ color: C.sub }}
              >
                Marché
              </div>
              <div className="gsm-native-portfoliodetailworkflow-fe4cf1a27">{m.marche}</div>
            </div>
            <div>
              <div
                className="gsm-native-portfoliodetailworkflow-d64030ce5"
                style={{ color: C.sub }}
              >
                SGI compatible
              </div>
              <div className="gsm-native-portfoliodetailworkflow-fe4cf1a27">
                {portefeuillesCompatibles.length > 0
                  ? portefeuillesCompatibles.map((pf) => pf.sgi).join(' · ')
                  : 'Aucune SGI compatible'}
              </div>
            </div>
            <div>
              <div
                className="gsm-native-portfoliodetailworkflow-d64030ce5"
                style={{ color: C.sub }}
              >
                Portefeuille
              </div>
              <div className="gsm-native-portfoliodetailworkflow-fe4cf1a27">
                {portefeuillesCompatibles.length > 0
                  ? portefeuillesCompatibles.map((pf) => pf.nom).join(' · ')
                  : '—'}
              </div>
            </div>
            <div>
              <div
                className="gsm-native-portfoliodetailworkflow-d64030ce5"
                style={{ color: C.sub }}
              >
                Devise de négociation
              </div>
              <div className="gsm-native-portfoliodetailworkflow-fe4cf1a27" style={F_MONO}>
                {m.devise}
              </div>            </div>
          </div>
          <div className="gsm-native-portfoliodetailworkflow-096377834" style={{ color: C.sub }}>
            La profondeur ci-dessous est informative. Le passage d'ordre reste
            soumis à la liquidité disponible, aux titres disponibles à la vente
            et aux contrôles de la SGI sélectionnée.
          </div>
        </Card>
      )}

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
        <Eyebrow>Profondeur du marché — ordres d'achat et de vente</Eyebrow>
        <div className="gsm-native-portfoliodetailworkflow-3367f8897">
          <div>
            <div
              className="gsm-native-portfoliodetailworkflow-30340992c"
              style={{ color: C.teal }}
            >
              Achats (bid)
            </div>
            <table className="gsm-native-portfoliodetailworkflow-02e49a137">
              <thead>
                <tr>
                  <Th>Prix</Th>
                  <Th>Quantité</Th>
                </tr>
              </thead>
              <tbody>
                {bids.map((b, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <Td mono>
                      <span style={{ color: C.teal }}>{b.prix}</span>
                    </Td>
                    <Td mono>{b.qte}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div
              className="gsm-native-portfoliodetailworkflow-30340992c"
              style={{ color: C.coral }}
            >
              Ventes (ask)
            </div>
            <table className="gsm-native-portfoliodetailworkflow-02e49a137">
              <thead>
                <tr>
                  <Th>Prix</Th>
                  <Th>Quantité</Th>
                </tr>
              </thead>
              <tbody>
                {asks.map((a, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <Td mono>
                      <span style={{ color: C.coral }}>{a.prix}</span>
                    </Td>
                    <Td mono>{a.qte}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card className="gsm-native-portfoliodetailworkflow-6fcda2c11">
        <Eyebrow>Exécutions du jour — volume cumulé</Eyebrow>
        <table className="gsm-native-portfoliodetailworkflow-66835e90e">
          <thead>
            <tr>
              <Th>Heure</Th>
              <Th>Sens</Th>
              <Th>Quantité</Th>
              <Th>Prix</Th>
              <Th>Volume cumulé</Th>
            </tr>
          </thead>
          <tbody>
            {execs.map((e, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                <Td mono>{e.heure}</Td>
                <Td>
                  <Badge tone={e.sens === 'Achat' ? 'teal' : 'coral'}>
                    {e.sens}
                  </Badge>
                </Td>
                <Td mono>{e.qte}</Td>
                <Td mono>
                  {e.prix} {m.devise}
                </Td>
                <Td mono>{e.cumule}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}









export { PortefeuilleDetail, ProfondeurMarche, buildSituationDepuisOuverture };
