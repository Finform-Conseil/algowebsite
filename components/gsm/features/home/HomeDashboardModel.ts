import type {
  AllocationSlice,
  CurrencyCode,
  PortfolioClient,
  PortfolioHistoryPoint,
  ProfileStatistic,
  QuarterlyPortfolioHistoryPoint,
} from '../../shared/types/domain.types.ts';

const DEFAULT_RISK_PROFILES = [
  'Équilibré',
  'Prudence',
  'Performance',
  'Croissance',
  'Sérénité',
] as const;

type AggregateEncoursBy = (
  selector: (client: PortfolioClient) => string,
  clients: PortfolioClient[]
) => AllocationSlice[];

type BuildAssetMix = (clients: PortfolioClient[]) => AllocationSlice[];

type ConvertCurrency = (
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
) => number;

interface BuildHomePortfolioOverviewInput {
  clients: PortfolioClient[];
  devise: CurrencyCode;
  dimension: string;
  selectedHistoryProfile: string;
  profileTypeLabel: Record<string, string>;
  sectorMix: AllocationSlice[];
  quarterlyPortfolioHistory: QuarterlyPortfolioHistoryPoint[];
  aggregateEncoursBy: AggregateEncoursBy;
  buildAssetMix: BuildAssetMix;
  convertCurrency: ConvertCurrency;
}

interface HomePortfolioOverview {
  dims: Record<string, AllocationSlice[]>;
  totalRef: number;
  repartitionCourante: Array<AllocationSlice & {
    montant: number;
    devise: CurrencyCode;
  }>;
  profilsRisqueAccueil: readonly string[];
  statistiquesProfilsAccueil: ProfileStatistic[];
  historiqueNombrePortefeuilles: Array<Record<string, string | number>>;
  serieHistoriquePortefeuilles: PortfolioHistoryPoint[];
  premierPointHistoriquePortefeuilles: number;
  dernierPointHistoriquePortefeuilles: number;
  croissanceHistoriquePortefeuilles: number;
  variationEncoursPondereeGlobale: number;
  rendementMoyenPondereGlobal: number;
}

export function buildHomePortfolioOverview({
  clients,
  devise,
  dimension,
  selectedHistoryProfile,
  profileTypeLabel,
  sectorMix,
  quarterlyPortfolioHistory,
  aggregateEncoursBy,
  buildAssetMix,
  convertCurrency,
}: BuildHomePortfolioOverviewInput): HomePortfolioOverview {
  const profileTypeMix = aggregateEncoursBy(
    (client) => profileTypeLabel[client.type] || client.type,
    clients
  );
  const riskProfileMix = aggregateEncoursBy(
    (client) => client.profilRisque,
    clients
  );
  const assetMix = buildAssetMix(clients);
  const marketMix = aggregateEncoursBy(
    (client) => `${client.marche} (${client.devise})`,
    clients
  );
  const countryMix = aggregateEncoursBy((client) => client.pays, clients);

  const dimensions: Record<string, AllocationSlice[]> = {
    'Profil de risque': riskProfileMix,
    "Type d'actif": assetMix,
    'Marché boursier': marketMix,
    Pays: countryMix,
    Secteur: sectorMix,
    'Type de portefeuille': profileTypeMix,
  };

  const totalRef = clients.reduce(
    (sum, client) =>
      sum + convertCurrency(client.encours, client.devise, devise),
    0
  );

  const repartitionCourante = (dimensions[dimension] || []).map((item) => ({
    ...item,
    montant: (totalRef * item.value) / 100,
    devise,
  }));

  const riskProfiles = DEFAULT_RISK_PROFILES;
  const statistiquesProfilsAccueil = riskProfiles.map((profil) => {
    const portfolios = clients.filter(
      (client) => client.profilRisque === profil
    );
    const encoursProfil = portfolios.reduce(
      (sum, client) =>
        sum + convertCurrency(client.encours, client.devise, devise),
      0
    );

    const weightedAverage = (field: 'perf' | 'rentabilite') =>
      encoursProfil > 0
        ? portfolios.reduce(
            (sum, client) =>
              sum +
              convertCurrency(client.encours, client.devise, devise) *
                Number(client[field] || 0),
            0
          ) / encoursProfil
        : 0;

    return {
      profil,
      nombre: portfolios.length,
      encoursProfil,
      variationEncoursPonderee: weightedAverage('perf'),
      rendementPondere: weightedAverage('rentabilite'),
    };
  });

  const historiqueNombrePortefeuilles = quarterlyPortfolioHistory.map(
    ({ trimestre, fin }) => {
      const activePortfolios = clients.filter(
        (client) => !client.dateEntree || client.dateEntree <= fin
      );
      const row: Record<string, string | number> = {
        trimestre,
        Global: activePortfolios.length,
      };

      riskProfiles.forEach((profil) => {
        row[profil] = activePortfolios.filter(
          (client) => client.profilRisque === profil
        ).length;
      });

      return row;
    }
  );

  const serieHistoriquePortefeuilles = historiqueNombrePortefeuilles.map(
    (row) => ({
      trimestre: String(row.trimestre),
      nombre: Number(row[selectedHistoryProfile] || 0),
    })
  );

  const firstPortfolioCount =
    serieHistoriquePortefeuilles[0]?.nombre || 0;
  const lastPortfolioCount =
    serieHistoriquePortefeuilles.at(-1)?.nombre || 0;

  const weightedGlobalAverage = (field: 'perf' | 'rentabilite') =>
    totalRef > 0
      ? clients.reduce(
          (sum, client) =>
            sum +
            convertCurrency(client.encours, client.devise, devise) *
              Number(client[field] || 0),
          0
        ) / totalRef
      : 0;

  return {
    dims: dimensions,
    totalRef,
    repartitionCourante,
    profilsRisqueAccueil: riskProfiles,
    statistiquesProfilsAccueil,
    historiqueNombrePortefeuilles,
    serieHistoriquePortefeuilles,
    premierPointHistoriquePortefeuilles: firstPortfolioCount,
    dernierPointHistoriquePortefeuilles: lastPortfolioCount,
    croissanceHistoriquePortefeuilles:
      lastPortfolioCount - firstPortfolioCount,
    variationEncoursPondereeGlobale: weightedGlobalAverage('perf'),
    rendementMoyenPondereGlobal: weightedGlobalAverage('rentabilite'),
  };
}
