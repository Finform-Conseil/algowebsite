export type WatchTone = 'teal' | 'gold' | 'coral' | 'slate';

export interface WatchlistTechnique {
  mm: string;
  macd: string;
  rsi: number;
  bol: string;
  signal: string;
}

export interface WatchlistFondamentale {
  per: number | null;
  rentabilite: string;
  evol: string;
  valo: string;
  signal: string;
}

export interface WatchlistReco {
  titre: string;
  marche: string;
  devise: string;
  secteur: string;
  cours: number;
  technique: WatchlistTechnique;
  fondamentale: WatchlistFondamentale;
  sens?: string;
  objectif?: number;
  conviction?: string;
}

export interface WatchlistMarket {
  nom: string;
  marche: string;
  devise: string;
  cours: number;
  variation?: number;
  type?: string;
  secteur?: string;
}

export interface WatchlistDailyRow extends WatchlistReco {
  variationJour: number;
  scoreTechnique: number;
  scoreFondamental: number;
  scoreCombine: number;
  signalJour: string;
}

export interface WatchlistStaticRow {
  titre: string;
  marche: string;
  devise: string;
  cours: number;
  secteur: string;
  fondamentale: WatchlistFondamentale;
  horizon: string;
  these: string;
}

export interface WatchlistDailyFilters {
  marche: string;
  secteur: string;
  mm: string;
  macd: string;
  rsiMin: string;
  rsiMax: string;
  bol: string;
  signalTechnique: string;
  perMax: string;
  rentabiliteMin: string;
  evolMin: string;
  valorisation: string;
  signalFondamental: string;
}

export const DEFAULT_WATCHLIST_DAILY_FILTERS: WatchlistDailyFilters = {
  marche: 'Tous',
  secteur: 'Tous',
  mm: 'Tous',
  macd: 'Tous',
  rsiMin: '0',
  rsiMax: '100',
  bol: 'Tous',
  signalTechnique: 'Tous',
  perMax: '',
  rentabiliteMin: '',
  evolMin: '',
  valorisation: 'Tous',
  signalFondamental: 'Tous',
};

const THESES: Record<string, { horizon: string; these: string }> = {
  SONATEL: {
    horizon: '12–24 mois',
    these: 'Croissance régulière, forte génération de trésorerie et valorisation encore attractive.',
  },
  'MTN NIGERIA': {
    horizon: '9–18 mois',
    these: 'Rentabilité élevée et potentiel de revalorisation, sous réserve du risque de change.',
  },
  'GCB BANK': {
    horizon: '12–18 mois',
    these: 'PER faible, rentabilité solide et progression bénéficiaire favorable.',
  },
  'ZENITH BANK': {
    horizon: '6–12 mois',
    these: 'Valorisation décotée, rentabilité élevée et dynamique bénéficiaire robuste.',
  },
};

export const parsePctNumber = (value: unknown): number =>
  Number(String(value).replace('%', '').replace('+', '').replace(',', '.')) || 0;

export const watchlistMmDirection = (mm: string): string =>
  mm.includes('>') ? 'Haussière' : mm.includes('<') ? 'Baissière' : 'Neutre';

export const countWatchlistActiveFilters = (filters: WatchlistDailyFilters): number =>
  Object.entries(filters).filter(([key, value]) => {
    if (['marche', 'secteur', 'mm', 'macd', 'bol', 'signalTechnique', 'valorisation', 'signalFondamental'].includes(key)) {
      return value !== 'Tous';
    }
    if (key === 'rsiMin') return value !== '0';
    if (key === 'rsiMax') return value !== '100';
    return value !== '';
  }).length;

export const toneWatchlistSignalJour = (signal: string): WatchTone =>
  signal === 'Surveiller achat'
    ? 'teal'
    : signal === 'Attendre confirmation'
      ? 'gold'
      : signal === 'Écarter / alléger'
        ? 'coral'
        : 'slate';

export const toneWatchlistSignalFondamental = (signal: string): WatchTone =>
  signal === 'Acheter' ? 'teal' : signal === 'Vendre' ? 'coral' : 'gold';

const dailyDrift = (dateKey: string, titre: string): number => {
  const seed = `${dateKey}-${titre}`
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  return (seed % 11) - 5;
};

export const scoreTechniqueWatchlist = (reco: WatchlistReco): number => {
  const base: Record<string, number> = {
    Acheter: 78,
    Conserver: 58,
    Alléger: 42,
    Vendre: 24,
  };
  const signal = base[reco.technique.signal] ?? 50;
  const mm = reco.technique.mm.includes('>') ? 8 : reco.technique.mm.includes('<') ? -8 : 2;
  const macd = reco.technique.macd.includes('Positif') ? 8 : reco.technique.macd.includes('Négatif') ? -8 : 1;
  const rsi = reco.technique.rsi >= 45 && reco.technique.rsi <= 68
    ? 7
    : reco.technique.rsi >= 35 && reco.technique.rsi <= 75
      ? 3
      : -4;
  return Math.max(0, Math.min(100, signal + mm + macd + rsi));
};

const scoreFondamental = (reco: WatchlistReco): number => {
  const signal = reco.fondamentale.signal === 'Acheter' ? 55 : 25;
  const valo = reco.fondamentale.valo === 'Sous-évaluée'
    ? 16
    : reco.fondamentale.valo === 'Équitable'
      ? 9
      : -8;
  const rentabilite = Math.min(14, parsePctNumber(reco.fondamentale.rentabilite) * 0.45);
  const croissance = Math.max(-10, Math.min(15, parsePctNumber(reco.fondamentale.evol) * 0.7));
  return Math.max(0, Math.min(100, Math.round(signal + valo + rentabilite + croissance)));
};

export function createWatchlistModel({
  recos,
  markets,
  resolveMarket,
}: {
  recos: WatchlistReco[];
  markets: WatchlistMarket[];
  resolveMarket: (title: string) => WatchlistMarket | null | undefined;
}) {
  const DEFAULT_STATIC_WATCHLIST_TITLES = recos
    .filter((reco) => reco.fondamentale.signal === 'Acheter')
    .map((reco) => reco.titre);

  const buildWatchlistJournaliere = (dateKey: string): WatchlistDailyRow[] =>
    recos
      .map((reco) => {
        const scoreT = scoreTechniqueWatchlist(reco);
        const scoreF = scoreFondamental(reco);
        const scoreCombine = Math.max(
          0,
          Math.min(100, Math.round(scoreT * 0.7 + scoreF * 0.3 + dailyDrift(dateKey, reco.titre)))
        );
        const market = markets.find((item) => item.nom === reco.titre);
        const signalJour = scoreCombine >= 78
          ? 'Surveiller achat'
          : scoreCombine >= 63
            ? 'Attendre confirmation'
            : scoreCombine >= 48
              ? 'Conserver sous surveillance'
              : 'Écarter / alléger';
        return {
          ...reco,
          variationJour: market?.variation ?? 0,
          scoreTechnique: scoreT,
          scoreFondamental: scoreF,
          scoreCombine,
          signalJour,
        };
      })
      .sort((a, b) => b.scoreCombine - a.scoreCombine);

  const buildStaticWatchlistRow = (titre: string): WatchlistStaticRow | null => {
    const reco = recos.find((item) => item.titre === titre);
    const market = resolveMarket(titre);

    if (reco) {
      return {
        ...reco,
        horizon: THESES[titre]?.horizon || 'À définir',
        these:
          THESES[titre]?.these ||
          'Actif ajouté depuis la page Marchés — thèse fondamentale à documenter.',
      };
    }

    if (!market) return null;

    return {
      titre: market.nom,
      marche: market.marche,
      devise: market.devise,
      cours: market.cours,
      secteur:
        market.secteur ||
        (market.type === 'Obligation' ? 'Obligations' : 'Non renseigné'),
      fondamentale: {
        per: null,
        rentabilite: 'N/D',
        evol: 'N/D',
        valo: 'À analyser',
        signal: 'À analyser',
      },
      horizon: 'À définir',
      these: 'Actif ajouté depuis la page Marchés — analyse fondamentale à compléter.',
    };
  };

  return {
    DEFAULT_STATIC_WATCHLIST_TITLES,
    buildWatchlistJournaliere,
    buildStaticWatchlistRow,
  };
}

export const filterWatchlistDailyRows = (
  rows: WatchlistDailyRow[],
  filters: WatchlistDailyFilters
): WatchlistDailyRow[] => {
  const perMax = filters.perMax === '' ? null : Number(filters.perMax);
  const rentabiliteMin = filters.rentabiliteMin === '' ? null : Number(filters.rentabiliteMin);
  const evolMin = filters.evolMin === '' ? null : Number(filters.evolMin);
  const rsiMin = Number(filters.rsiMin || 0);
  const rsiMax = Number(filters.rsiMax || 100);

  return rows.filter((row) =>
    (filters.marche === 'Tous' || row.marche === filters.marche) &&
    (filters.secteur === 'Tous' || row.secteur === filters.secteur) &&
    (filters.mm === 'Tous' || watchlistMmDirection(row.technique.mm) === filters.mm) &&
    (filters.macd === 'Tous' || row.technique.macd === filters.macd) &&
    row.technique.rsi >= rsiMin &&
    row.technique.rsi <= rsiMax &&
    (filters.bol === 'Tous' || row.technique.bol === filters.bol) &&
    (filters.signalTechnique === 'Tous' || row.technique.signal === filters.signalTechnique) &&
    (perMax === null || row.fondamentale.per === null || row.fondamentale.per <= perMax) &&
    (rentabiliteMin === null || parsePctNumber(row.fondamentale.rentabilite) >= rentabiliteMin) &&
    (evolMin === null || parsePctNumber(row.fondamentale.evol) >= evolMin) &&
    (filters.valorisation === 'Tous' || row.fondamentale.valo === filters.valorisation) &&
    (filters.signalFondamental === 'Tous' || row.fondamentale.signal === filters.signalFondamental)
  );
};
