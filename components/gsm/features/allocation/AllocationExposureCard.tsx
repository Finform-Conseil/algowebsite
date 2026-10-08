import { X } from 'lucide-react';
import type {
  AllocationExposureRow,
  AllocationSelection,
} from './AllocationExposureModel';
import { fmt } from '../../shared/lib/finance';
import { Donut, Legende, type DonutDatum } from '../home/HomeWidgets';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_MONO, PALETTE } from '../../shared/theme/theme';

export interface AllocationDatum extends DonutDatum {
  name: string;
  value: number;
  montant: number;
  devise: string;
}

export function AllocationExposureCard({
  dimensions,
  activeDimension,
  data,
  selection,
  rows,
  minimumAllocation,
  clientQuery,
  onDimensionChange,
  onSelectionChange,
  onMinimumAllocationChange,
  onClientQueryChange,
}: {
  dimensions: string[];
  activeDimension: string;
  data: AllocationDatum[];
  selection: AllocationSelection | null;
  rows: AllocationExposureRow[];
  minimumAllocation: number;
  clientQuery: string;
  onDimensionChange: (dimension: string) => void;
  onSelectionChange: (
    selection: AllocationSelection | null
  ) => void;
  onMinimumAllocationChange: (value: number) => void;
  onClientQueryChange: (value: string) => void;
}) {
  const selectedDatum = selection
    ? data.find((item) => item.name === selection.value)
    : null;

  return (
    <Card className="gsm-native-allocationexposurecard-5a99aa181">
      <div className="gsm-responsive-header gsm-native-allocationexposurecard-84050d6f3">
        <Eyebrow>Répartition de l'encours</Eyebrow>
        <div className="gsm-native-allocationexposurecard-d7a8d571d">
          {dimensions.map((dimension) => (
            <button
              key={dimension}
              type="button"
              onClick={() => onDimensionChange(dimension)}
              className="gsm-native-allocationexposurecard-f9e27722c"
              style={{
                background:
                  activeDimension === dimension
                    ? C.activeBackground
                    : C.surfaceInset,
                color:
                  activeDimension === dimension
                    ? C.textPrimary
                    : C.sub,
                ...F_BODY,
              }}
            >
              {dimension}
            </button>
          ))}
        </div>
      </div>

      <div className="gsm-native-allocationexposurecard-617a5f513">
        <div className="gsm-native-allocationexposurecard-c0fc1c598">
          <Donut data={data} size={170} />
        </div>

        <div className="gsm-native-allocationexposurecard-91c91d698">
          <Legende data={data} />
        </div>

        <div
          className="gsm-native-allocationexposurecard-2069cc01e"
          style={{ borderColor: C.line }}
        >
          {!selection ? (
            <>
              <div
                className="gsm-native-allocationexposurecard-b6f2221c5"
                style={{ color: C.sub, ...F_BODY }}
              >
                Cliquez une part pour voir le détail par portefeuille.
              </div>

              <div className="gsm-native-allocationexposurecard-554095eee">
                {data.map((datum, index) => (
                  <button
                    key={datum.name}
                    type="button"
                    onClick={() =>
                      onSelectionChange({
                        dimension: activeDimension,
                        value: datum.name,
                      })
                    }
                    className="gsm-native-allocationexposurecard-eb2b242f7"
                    style={{
                      borderColor: C.line,
                      background: C.surfaceCard,
                      cursor: 'pointer',
                      ...F_BODY,
                    }}
                    title={`Voir le détail ${datum.name}`}
                  >
                    <span
                      className="gsm-native-allocationexposurecard-8231159be"
                      style={{
                        background:
                          PALETTE[index % PALETTE.length],
                      }}
                    />
                    <span>
                      <span className="gsm-native-allocationexposurecard-d8b67d650">
                        {datum.name} · {datum.value}%
                      </span>
                      <span
                        className="gsm-native-allocationexposurecard-fe6b1f653"
                        style={{
                          color: C.sub,
                          ...F_MONO,
                        }}
                      >
                        {fmt(Math.round(datum.montant))}{' '}
                        {datum.devise}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="gsm-responsive-header gsm-native-allocationexposurecard-345398d73">
                <div className="gsm-native-allocationexposurecard-09b3d4805">
                  <Badge tone="gold">
                    {selection.dimension} : {selection.value}
                  </Badge>
                  {selectedDatum && (
                    <Badge tone="navy">
                      {selectedDatum.value}% ·{' '}
                      {fmt(Math.round(selectedDatum.montant))}{' '}
                      {selectedDatum.devise}
                    </Badge>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectionChange(null)}
                  className="gsm-native-allocationexposurecard-a849ab6b8"
                  style={{ color: C.sub }}
                >
                  Retour aux parts{' '}
                  <X
                    size={12}
                    style={{ display: 'inline' }}
                  />
                </button>
              </div>

              <div className="gsm-native-allocationexposurecard-abeec7100">
                <div>
                  <label
                    className="gsm-native-allocationexposurecard-c24703de9"
                    style={{ color: C.sub }}
                  >
                    Seuil d'allocation min. (%)
                  </label>
                  <input name="gsm-allocationexposurecard-184" aria-label="Champ allocationexposurecard"
                    type="number"
                    min="0"
                    max="100"
                    value={minimumAllocation}
                    onChange={(event) =>
                      onMinimumAllocationChange(
                        Number(event.target.value)
                      )
                    }
                    className="gsm-native-allocationexposurecard-fb7439c93"
                    style={{
                      borderColor: C.line,
                      ...F_MONO,
                    }}
                  />
                </div>

                <div className="gsm-native-allocationexposurecard-210c22f9d">
                  <label
                    className="gsm-native-allocationexposurecard-c24703de9"
                    style={{ color: C.sub }}
                  >
                    Nom du client
                  </label>
                  <input name="gsm-allocationexposurecard-209" aria-label="Rechercher…"
                    type="text"
                    value={clientQuery}
                    onChange={(event) =>
                      onClientQueryChange(event.target.value)
                    }
                    placeholder="Rechercher…"
                    className="gsm-native-allocationexposurecard-9c47a54d5"
                    style={{
                      borderColor: C.line,
                      ...F_BODY,
                    }}
                  />
                </div>
              </div>

              <div className="gsm-native-allocationexposurecard-7dff62597">
                {selection.dimension === 'Profil de risque' ? (
                  <table className="gsm-native-allocationexposurecard-a6662aa8e">
                    <thead style={{ background: C.surfaceElevated }}>
                      <tr>
                        <Th>Client</Th>
                        <Th>Exposition Actions</Th>
                        <Th>Exposition Obligation</Th>
                        <Th>Allocation</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="gsm-native-allocationexposurecard-071aa182c"
                            style={{ color: C.sub }}
                          >
                            Aucun portefeuille ne correspond à ce profil.
                          </td>
                        </tr>
                      )}

                      {rows.map((row) => (
                        <tr
                          key={row.client.id}
                          style={{
                            borderTop: `1px solid ${C.line}`,
                          }}
                        >
                          <Td className="gsm-native-allocationexposurecard-1332aea17">
                            {row.client.nom}
                          </Td>
                          <Td mono>
                            {row.equityExposure.toFixed(1)}%
                          </Td>
                          <Td mono>
                            {row.bondExposure.toFixed(1)}%
                          </Td>
                          <Td mono>
                            {row.allocationPct.toFixed(1)}%
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="gsm-native-allocationexposurecard-a6662aa8e">
                    <thead style={{ background: C.surfaceElevated }}>
                      <tr>
                        <Th>Client</Th>
                        <Th>Exposition</Th>
                        <Th>Valeur</Th>
                        <Th>Allocation</Th>
                        <Th>Profil risque</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="gsm-native-allocationexposurecard-071aa182c"
                            style={{ color: C.sub }}
                          >
                            Aucun portefeuille ne correspond à ces critères.
                          </td>
                        </tr>
                      )}

                      {rows.map((row) => (
                        <tr
                          key={row.client.id}
                          style={{
                            borderTop: `1px solid ${C.line}`,
                          }}
                        >
                          <Td className="gsm-native-allocationexposurecard-1332aea17">
                            {row.client.nom}
                          </Td>
                          <Td mono>
                            {row.exposure.pct.toFixed(1)}%
                          </Td>
                          <Td mono>
                            {fmt(row.exposure.valeur)}{' '}
                            {row.client.devise}
                          </Td>
                          <Td mono>
                            {row.allocationPct.toFixed(1)}%
                          </Td>
                          <Td>
                            <Badge tone="slate">
                              {row.client.profilRisque}
                            </Badge>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
