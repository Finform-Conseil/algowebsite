import { convertCurrency, fmt, toRef } from '../../shared/lib/finance';
import { parseIsoLocalDate, formatIsoLocalDate } from '../../shared/lib/dateUtils';
import { liquidityHistorySeed, liquidityHistoricalAmount } from '../money-management/LiquidityInfrastructure';
import { C, F_MONO } from '../../shared/theme/theme';
import { CLIENTS, aggregateEncoursBy } from './PortfolioUniverse';
import { buildSituationDepuisOuverture } from './PortfolioDetailWorkflow';

const ASSET_KEYS = ['Actions', 'Obl. souveraines', 'Obl. privées', 'Liquidité'];

const buildAssetMix = (clients = CLIENTS) => {
  const totalEncoursReference = clients.reduce(
    (somme, client) => somme + toRef(client.encours, client.devise),
    0
  );

  return ASSET_KEYS.map((name) => {
    const valeur = clients.reduce(
      (somme, client) =>
        somme +
        toRef(
          (client.encours * Number(client.alloc?.[name] || 0)) / 100,
          client.devise
        ),
      0
    );
    return {
      name,
      value:
        totalEncoursReference > 0
          ? Math.round((valeur / totalEncoursReference) * 100)
          : 0,
    };
  });
};

const ASSET_MIX = buildAssetMix();
const MARKET_MIX = aggregateEncoursBy(
  (client) => `${client.marche} (${client.devise})`
);
const COUNTRY_MIX = aggregateEncoursBy((client) => client.pays);
const SECTOR_MIX = [
  { name: 'Banques', value: 34 },
  { name: 'Télécoms', value: 20 },
  { name: 'Agro-industrie', value: 16 },
  { name: 'Énergie', value: 14 },
  { name: 'Assurance', value: 10 },
  { name: 'Distribution', value: 6 },
];
const SECTOR_CONTRIB = [
  { name: 'Banques', valeur: 1720, pct: 34 },
  { name: 'Télécoms', valeur: 1010, pct: 20 },
  { name: 'Agro-industrie', valeur: 810, pct: 16 },
  { name: 'Énergie', valeur: 705, pct: 14 },
  { name: 'Assurance', valeur: 505, pct: 10 },
  { name: 'Distribution', valeur: 300, pct: 6 },
];
/*
 * HISTORIQUE COMPARATIF — PERFORMANCE HORS FLUX CLIENTS
 *
 * La courbe de la gestion n'est plus une variation brute d'encours : elle est
 * calculée en Time-Weighted Return (TWR), base 100. Les dépôts et retraits sont
 * neutralisés avant de calculer chaque rendement de sous-période :
 *
 *   r(t) = (Encours fin(t) - Flux net client(t)) / Encours début(t) - 1
 *   Indice TWR(t) = Indice TWR(t-1) × (1 + r(t))
 *
 * Dans cette maquette, les valorisations mensuelles suivent la trajectoire
 * historique déjà présente dans le prototype, tandis que les flux proviennent
 * des historiques déterministes de dépôts/retraits des clients. En production,
 * il faudra découper exactement la période à chaque flux réel enregistré.
 */
const HISTORY_PERIODS = [
  { date: '2025-09-30', mois: 'Sept 25' },
  { date: '2025-10-31', mois: 'Oct' },
  { date: '2025-11-30', mois: 'Nov' },
  { date: '2025-12-31', mois: 'Déc' },
  { date: '2026-01-31', mois: 'Jan 26' },
  { date: '2026-02-28', mois: 'Fév' },
  { date: '2026-03-31', mois: 'Mar' },
  { date: '2026-04-30', mois: 'Avr' },
  { date: '2026-05-31', mois: 'Mai' },
  { date: '2026-06-30', mois: 'Juin' },
  { date: '2026-07-31', mois: 'Juil' },
  { date: '2026-08-31', mois: 'Août' },
];

/*
 * EXPOSITION DEVISES — ACCUEIL GESTION SOUS MANDAT
 *
 * Le graphique n'affiche qu'une seule courbe à la fois. Chaque point représente
 * l'encours historique, en valeur monétaire, des portefeuilles correspondant
 * à la devise sélectionnée.
 *
 * Les filtres permettent de restreindre l'univers par type de portefeuille,
 * profil de risque ou portefeuille client précis. La date initiale d'affichage
 * est également modifiable.
 *
 * La maquette ne possède pas encore les valorisations historiques réelles de
 * chaque portefeuille. Pour l'affichage de démonstration, on utilise donc la
 * fonction historique déterministe déjà présente dans le prototype. En
 * production, cette fonction devra être remplacée par les valorisations réelles
 * historisées à chaque date de situation.
 */
const buildCurrencyAumHistory = (
  clients,
  periods = HISTORY_PERIODS
) => {
  const devises = Array.from(
    new Set(
      (clients || []).flatMap((client) =>
        Object.keys(
          client.expositionsDevises || { [client.devise]: 100 }
        )
      )
    )
  );
  const dateReference = parseIsoLocalDate(
    periods[periods.length - 1]?.date || formatIsoLocalDate(new Date())
  );

  const data = periods.map((period) => {
    const dateSituation = parseIsoLocalDate(period.date);
    const lignes = (clients || []).map((client) => {
      const dateEntree = parseIsoLocalDate(
        client.dateEntree || periods[0]?.date || period.date
      );

      if (dateEntree > dateSituation) {
        return {
          client,
          encoursReference: 0,
        };
      }

      const encoursHistorique = liquidityHistoricalAmount(
        Number(client.encours || 0),
        `encours-devise-${client.id}`,
        dateSituation,
        dateReference,
        0.9
      );

      return {
        client,
        encoursReference: toRef(encoursHistorique, client.devise),
      };
    });

    const row = {
      date: period.date,
      mois: period.mois,
    };

    devises.forEach((deviseCode) => {
      const montantDevise = lignes.reduce((somme, ligne) => {
        const encoursReference = Number(ligne.encoursReference || 0);
        const expositions =
          ligne.client.expositionsDevises || {
            [ligne.client.devise]: 100,
          };
        const poidsDevise = Number(expositions[deviseCode] || 0) / 100;

        if (poidsDevise <= 0) return somme;

        const expositionReference = encoursReference * poidsDevise;

        return (
          somme +
          convertCurrency(expositionReference, 'XOF', deviseCode)
        );
      }, 0);

      row[deviseCode] = montantDevise;
    });

    return row;
  });

  return {
    devises,
    data,
  };
};

/*
 * ÉVÉNEMENTS SUR LES COURBES D'ENCOURS
 * * Les marqueurs sont purement informatifs :
 * - Dépôt / Retrait : mouvements de capital client ;
 * - Coupon / Dividende : revenus financiers reçus par le portefeuille.
 *
 * Les dépôts/retraits proviennent de l'historique déterministe déjà utilisé
 * dans la maquette. Les coupons/dividendes reçus sont générés de manière
 * déterministe à partir de l'encours et de l'allocation du portefeuille.
 * En production, remplacer ces événements par les écritures réelles de cash,
 * corporate actions et revenus financiers enregistrées en base.
 */
const HISTORICAL_EVENT_TYPES = ['Dépôt', 'Retrait', 'Coupon', 'Dividende'];

const historicalEventColor = (type) => {
  if (type === 'Retrait') return C.coral;
  if (type === 'Dépôt') return C.teal;
  if (type === 'Coupon') return C.gold;
  return C.indigo;
};

const historicalEventDate = (date) =>
  date instanceof Date ? date : parseIsoLocalDate(String(date).slice(0, 10));

const dateFluxClientEntre = (debut, fin, ratio = 0.5) => {
  const debutMs = historicalEventDate(debut).getTime();
  const finMs = historicalEventDate(fin).getTime();
  const ratioBorne = Math.min(1, Math.max(0, Number(ratio) || 0));
  const timestamp = debutMs + (finMs - debutMs) * ratioBorne;
  return formatIsoLocalDate(new Date(timestamp));
};

const historicalEventPeriodIndex = (periods, date) => {
  const eventDate = historicalEventDate(date);

  return periods.findIndex((period, index) => {
    const fin = parseIsoLocalDate(period.date);
    if (index === 0) {
      const debut = new Date(fin);
      debut.setMonth(debut.getMonth() - 1);
      return eventDate > debut && eventDate <= fin;
    }

    const debut = parseIsoLocalDate(periods[index - 1].date);
    return eventDate > debut && eventDate <= fin;
  });
};

const buildHistoricalPortfolioEvents = (client) => {
  const persistedEvents = Array.isArray(client?.cashEvents)
    ? client.cashEvents
    : [];

  if (persistedEvents.length > 0) {
    return persistedEvents
      .map((event) => ({
        id: event.id,
        type: event.type,
        libelle: event.libelle || event.type,
        date: event.date,
        montant: Number(event.montant || 0),
        devise: event.devise || client.devise,
        clientId: client.id,
        client: client.nom,
        marche: client.marche,
        profilRisque: client.profilRisque,
        statut: event.statut || 'Réalisé',
        source: event.source || 'DATABASE',
      }))
      .filter((event) => HISTORICAL_EVENT_TYPES.includes(event.type))
      .sort(
        (a, b) => historicalEventDate(a.date) - historicalEventDate(b.date)
      );
  }

  const situation = buildSituationDepuisOuverture(client);
  const expositions =
    client.expositionsDevises || { [client.devise]: 100 };
  const evenements = [];

  // Dépôts et retraits ventilés sur les devises d'investissement du portefeuille.
  situation.flux.forEach((flux) => {
    const montantReference = toRef(
      Number(flux.montant || 0),
      flux.devise || client.devise
    );

    Object.entries(expositions).forEach(([deviseExposition, poids]) => {
      const poidsNumerique = Number(poids || 0) / 100;
      if (poidsNumerique <= 0) return;

      const montant = convertCurrency(
        montantReference * poidsNumerique,
        'XOF',
        deviseExposition
      );

      evenements.push({
        id: `${flux.id}-${deviseExposition}`,
        type: flux.type,
        libelle: flux.libelle,
        date: flux.date,
        montant,
        devise: deviseExposition,
        clientId: client.id,
        client: client.nom,
        marche: client.marche,
        profilRisque: client.profilRisque,
        statut: 'Réalisé',
      });
    });
  });

  const debutHistorique = parseIsoLocalDate(HISTORY_PERIODS[0]?.date);
  debutHistorique.setMonth(debutHistorique.getMonth() - 1);
  const dateEntree = parseIsoLocalDate(
    client.dateEntree || HISTORY_PERIODS[0]?.date
  );
  const debutActif =
    dateEntree > debutHistorique ? dateEntree : debutHistorique;
  const finHistorique = parseIsoLocalDate(
    HISTORY_PERIODS[HISTORY_PERIODS.length - 1]?.date
  );

  if (debutActif <= finHistorique) {
    const seed = liquidityHistorySeed(
      `${client.id}-${client.nom}-revenus-historiques`
    );
    const allocationActions = Math.max(
      0,
      Number(client.alloc?.Actions || 0) / 100
    );
    const allocationObligations = Math.max(
      0,
      (Number(client.alloc?.['Obl. souveraines'] || 0) +
        Number(client.alloc?.['Obl. privées'] || 0)) /
        100
    );
    const encoursReference = toRef(
      Number(client.encours || 0),
      client.devise
    );

    Object.entries(expositions).forEach(
      ([deviseExposition, poids], deviseIndex) => {
        const poidsNumerique = Number(poids || 0) / 100;
        if (poidsNumerique <= 0) return;

        const expositionMonetaire = convertCurrency(
          encoursReference * poidsNumerique,
          'XOF',
          deviseExposition
        );

        if (allocationObligations > 0.05) {
          const ratioDateCoupon =
            0.24 + ((seed + deviseIndex * 7) % 22) / 100;
          const tauxCouponDemo =
            0.0045 + ((seed + deviseIndex * 11) % 6) * 0.0007;

          evenements.push({
            id: `${client.id}-COUPON-${deviseExposition}`,
            type: 'Coupon',
            libelle: 'Coupon encaissé sur titres obligataires',
            date: dateFluxClientEntre(
              debutActif,
              finHistorique,
              ratioDateCoupon
            ),
            montant: Math.max(
              1,
              Math.round(
                expositionMonetaire *
                  allocationObligations *
                  tauxCouponDemo
              )
            ),
            devise: deviseExposition,
            clientId: client.id,
            client: client.nom,
            marche: client.marche,
            profilRisque: client.profilRisque,
            statut: 'Reçu',
          });
        }

        if (allocationActions > 0.05) {
          const ratioDateDividende =
            0.64 + ((seed + deviseIndex * 13) % 24) / 100;
          const tauxDividendeDemo =            0.0035 + ((seed + deviseIndex * 17) % 7) * 0.0006;

          evenements.push({
            id: `${client.id}-DIV-${deviseExposition}`,
            type: 'Dividende',
            libelle: 'Dividende reçu sur portefeuille actions',
            date: dateFluxClientEntre(
              debutActif,
              finHistorique,
              Math.min(0.94, ratioDateDividende)
            ),
            montant: Math.max(
              1,
              Math.round(
                expositionMonetaire * allocationActions * tauxDividendeDemo
              )
            ),
            devise: deviseExposition,
            clientId: client.id,
            client: client.nom,
            marche: client.marche,
            profilRisque: client.profilRisque,
            statut: 'Reçu',
          });
        }
      }
    );
  }

  return evenements.sort(
    (a, b) => historicalEventDate(a.date) - historicalEventDate(b.date)
  );
};

const attachHistoricalEventsToSeries = (
  data,
  clients,
  deviseAffichage,
  deviseExposition = null
) => {
  const rows = data.map((row) => ({ ...row, evenements: [] }));

  (clients || []).forEach((client) => {
    buildHistoricalPortfolioEvents(client).forEach((event) => {
      if (deviseExposition && event.devise !== deviseExposition) return;

      const index = historicalEventPeriodIndex(rows, event.date);
      if (index < 0) return;

      const montantAffichage = convertCurrency(
        Number(event.montant || 0),
        event.devise,
        deviseAffichage
      );

      rows[index].evenements.push({
        ...event,
        montantAffichage,
        deviseAffichage,
      });
    });
  });

  return rows;
};

function renderHistoricalEventDot(props) {
  const { key, ...dotProps } = props;
  return <HistoricalEventDot key={key} {...dotProps} />;
}

function HistoricalEventDot({ cx, cy, payload }) {
  const evenements = payload?.evenements || [];
  if (!evenements.length || cx == null || cy == null) return null;

  const types = Array.from(new Set(evenements.map((event) => event.type)));
  const couleur =
    types.length === 1 ? historicalEventColor(types[0]) : C.navy;

  return (
    <g style={{ cursor: 'pointer' }}>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={C.surfaceCard}
        stroke={couleur}
        strokeWidth={2.5}
      />
      <circle cx={cx} cy={cy} r={3.2} fill={couleur} />
    </g>
  );
}

function HistoricalEventsTooltipBlock({ evenements = [], devise }) {
  if (!evenements.length) return null;

  const synthese = HISTORICAL_EVENT_TYPES.map((type) => {
    const lignes = evenements.filter((event) => event.type === type);
    const total = lignes.reduce(
      (somme, event) => somme + Number(event.montantAffichage || 0),
      0
    );
    return { type, lignes, total };
  }).filter((item) => item.lignes.length > 0);

  return (
    <div
      className="gsm-native-portfolioanalyticsdata-fce5c4369"
      style={{ borderTop: `1px solid ${C.line}` }}
    >
      <div
        className="gsm-native-portfolioanalyticsdata-a969ab33f"
        style={{ color: C.ink }}
      >
        Événements de la période
      </div>

      <div className="gsm-native-portfolioanalyticsdata-0c89aa7d0">
        {synthese.map((item) => (
          <div
            key={item.type}
            className="gsm-native-portfolioanalyticsdata-61c27587a"
          >
            <span className="gsm-native-portfolioanalyticsdata-4eb2724bb">
              <span
                className="gsm-native-portfolioanalyticsdata-2f09bc4b9"
                style={{ background: historicalEventColor(item.type) }}
              />
              {item.type}
              {item.lignes.length > 1 ? ` (${item.lignes.length})` : ''}
            </span>
            <b style={{ color: historicalEventColor(item.type), ...F_MONO }}>
              {item.type === 'Retrait' ? '-' : '+'}
              {fmt(Math.round(item.total))} {devise}
            </b>
          </div>
        ))}
      </div>

      <div className="gsm-native-portfolioanalyticsdata-788548743">
        {evenements.slice(0, 4).map((event) => (
          <div
            key={event.id}
            className="gsm-native-portfolioanalyticsdata-334778529"
            style={{ color: C.sub }}
          >
            <b style={{ color: C.ink }}>
              {historicalEventDate(event.date).toLocaleDateString('fr-FR')}
            </b>
            {' · '}
            {event.client}
            {' · '}
            {event.libelle}
          </div>
        ))}
        {evenements.length > 4 && (
          <div className="gsm-native-portfolioanalyticsdata-a33bc32c3" style={{ color: C.sub }}>
            + {evenements.length - 4} autre(s) événement(s)
          </div>
        )}
      </div>
    </div>
  );
}

const HISTORY_GESTION_REFERENCE = HISTORY_PERIODS.map(
  (_, index) => 100 + index * 1.6 + Math.sin(index) * 2.2
);
const HISTORY_BRVM_REFERENCE = HISTORY_PERIODS.map(
  (_, index) => 100 + index * 1.1 + Math.cos(index) * 2.5
);
const HISTORY_NGX_REFERENCE = HISTORY_PERIODS.map(
  (_, index) => 100 + index * 0.6 + Math.sin(index * 1.3) * 3
);

const buildHistoryTwr = (encoursActuel, deviseAffichage) => {
  const periods = HISTORY_PERIODS.map((period, index) => ({
    ...period,
    rendementGestion:      index === 0
        ? 0
        : HISTORY_GESTION_REFERENCE[index] /
            HISTORY_GESTION_REFERENCE[index - 1] -
          1,
    brvm: (HISTORY_BRVM_REFERENCE[index] / HISTORY_BRVM_REFERENCE[0]) * 100,
    ngxAsi: (HISTORY_NGX_REFERENCE[index] / HISTORY_NGX_REFERENCE[0]) * 100,
    depots: 0,
    retraits: 0,
    fluxNet: 0,
    evenements: [],
  }));

  // Agrégation mensuelle des événements. Seuls les dépôts/retraits sont des
  // flux externes neutralisés dans le TWR. Coupons et dividendes restent des
  // revenus de portefeuille et sont affichés uniquement comme marqueurs.
  CLIENTS.forEach((client) => {
    buildHistoricalPortfolioEvents(client).forEach((event) => {
      const index = historicalEventPeriodIndex(periods, event.date);
      if (index < 0) return;

      const montant = convertCurrency(
        Number(event.montant || 0),
        event.devise,
        deviseAffichage
      );

      periods[index].evenements.push({
        ...event,
        montantAffichage: montant,
        deviseAffichage,
      });

      if (event.type === 'Retrait') {
        periods[index].retraits += montant;
        periods[index].fluxNet -= montant;
      } else if (event.type === 'Dépôt') {
        periods[index].depots += montant;
        periods[index].fluxNet += montant;
      }
    });
  });

  // Reconstruction à rebours de l'encours brut pour que le dernier point soit
  // égal à l'encours consolidé actuel. Cette série sert uniquement au contrôle
  // et au tooltip ; la courbe comparée aux indices utilise exclusivement le TWR.
  const encoursBrut = new Array(periods.length).fill(0);
  encoursBrut[encoursBrut.length - 1] = Math.max(1, Number(encoursActuel || 0));

  for (let index = periods.length - 1; index > 0; index -= 1) {
    const rendement = periods[index].rendementGestion;
    const valeurHorsFlux = encoursBrut[index] - periods[index].fluxNet;
    encoursBrut[index - 1] = Math.max(
      1,
      valeurHorsFlux / Math.max(0.01, 1 + rendement)
    );
  }

  let indiceTwr = 100;
  return periods.map((period, index) => {
    if (index > 0) {
      const encoursDebut = encoursBrut[index - 1];
      const rendementHorsFlux =
        encoursDebut > 0
          ? (encoursBrut[index] - period.fluxNet) / encoursDebut - 1
          : 0;
      indiceTwr *= 1 + rendementHorsFlux;
    }

    return {
      ...period,
      gestionTwr: Number(indiceTwr.toFixed(3)),
      brvm: Number(period.brvm.toFixed(3)),
      ngxAsi: Number(period.ngxAsi.toFixed(3)),
      encoursBrut: encoursBrut[index],
    };
  });
};
const HISTORIQUE_TRIMESTRIEL_PORTEFEUILLES = [
  { trimestre: 'T4 2024', fin: '2024-12-31' },
  { trimestre: 'T1 2025', fin: '2025-03-31' },
  { trimestre: 'T2 2025', fin: '2025-06-30' },
  { trimestre: 'T3 2025', fin: '2025-09-30' },
  { trimestre: 'T4 2025', fin: '2025-12-31' },
  { trimestre: 'T1 2026', fin: '2026-03-31' },
  { trimestre: 'T2 2026', fin: '2026-06-30' },
  { trimestre: 'T3 2026', fin: '2026-09-30' },
];


export {
  ASSET_KEYS,
  buildAssetMix,
  ASSET_MIX,
  MARKET_MIX,
  COUNTRY_MIX,
  SECTOR_MIX,
  SECTOR_CONTRIB,
  HISTORY_PERIODS,
  buildCurrencyAumHistory,
  HISTORICAL_EVENT_TYPES,
  historicalEventColor,
  historicalEventDate,
  historicalEventPeriodIndex,
  buildHistoricalPortfolioEvents,
  attachHistoricalEventsToSeries,
  renderHistoricalEventDot,
  HistoricalEventDot,
  HistoricalEventsTooltipBlock,
  HISTORY_GESTION_REFERENCE,
  HISTORY_BRVM_REFERENCE,
  HISTORY_NGX_REFERENCE,
  buildHistoryTwr,
  HISTORIQUE_TRIMESTRIEL_PORTEFEUILLES,
};
