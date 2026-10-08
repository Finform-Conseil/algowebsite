export interface AllocationExposureClient {
  id: string;
  nom: string;
  devise: string;
  profilRisque: string;
  encours: number;
  alloc: Record<string, number>;
  [key: string]: unknown;
}

export interface ExposureValue {
  pct: number;
  valeur: number;
}

export interface AllocationSelection {
  dimension: string;
  value: string;
}

export interface AllocationExposureRow {
  client: AllocationExposureClient;
  exposure: ExposureValue;
  allocationPct: number;
  equityExposure: number;
  bondExposure: number;
}

export function buildAllocationExposureRows({
  clients,
  selection,
  minimumAllocation,
  clientQuery,
  resolveExposure,
  toReference,
}: {
  clients: AllocationExposureClient[];
  selection: AllocationSelection;
  minimumAllocation: number;
  clientQuery: string;
  resolveExposure: (
    client: AllocationExposureClient,
    dimension: string,
    value: string
  ) => ExposureValue;
  toReference: (amount: number, currency: string) => number;
}): {
  totalReferenceValue: number;
  rows: AllocationExposureRow[];
} {
  const exposures = clients.map((client) => ({
    client,
    exposure: resolveExposure(
      client,
      selection.dimension,
      selection.value
    ),
  }));

  const totalReferenceValue = exposures.reduce(
    (sum, row) =>
      sum +
      toReference(row.exposure.valeur, row.client.devise),
    0
  );

  const normalizedQuery = clientQuery.trim().toLocaleLowerCase('fr');

  const rows = exposures
    .filter(
      (row) =>
        row.exposure.pct > 0 &&
        row.exposure.pct >= minimumAllocation
    )
    .filter((row) =>
      row.client.nom
        .toLocaleLowerCase('fr')
        .includes(normalizedQuery)
    )
    .sort((a, b) => b.exposure.pct - a.exposure.pct)
    .map(({ client, exposure }) => {
      const equityExposure = Number(
        client.alloc.Actions || 0
      );
      const bondExposure =
        Number(client.alloc['Obl. souveraines'] || 0) +
        Number(client.alloc['Obl. privées'] || 0);

      const allocationPct =
        totalReferenceValue > 0
          ? (toReference(exposure.valeur, client.devise) /
              totalReferenceValue) *
            100
          : 0;

      return {
        client,
        exposure,
        allocationPct,
        equityExposure,
        bondExposure,
      };
    });

  return {
    totalReferenceValue,
    rows,
  };
}
