import { fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C } from '../../shared/theme/theme';

type BadgeTone = 'slate' | 'gold' | 'teal' | 'coral' | 'navy';

export interface LiquidityPositionClient {
  id: string;
  nom: string;
  marche: string;
  devise: string;
  type: string;
  profilRisque: string;
  encours: number;
}

export interface LiquidityPositionRow {
  client: LiquidityPositionClient;
  liquiditeActuelle: number;
  ratioActuel: number;
  ratioCible: number;
  encaissements30J: number;
  decaissements30J: number;
  liquiditePrevisionnelle: number;
  ratioPrevisionnel: number;
  ecartPts: number;
  statut: string;
}

export function MoneyManagementPortfolioPositions({
  rows,
  profileTypeLabel,
  statusTone,
  onOpenClient,
}: {
  rows: LiquidityPositionRow[];
  profileTypeLabel: Record<string, string>;
  statusTone: (status: string) => BadgeTone;
  onOpenClient: (clientId: string) => void;
}) {
  return (
    <section className="gsm-native-moneymanagementportfoliopositions-8946d8936">
      <div>
        <Eyebrow>3. Position de liquidité par portefeuille</Eyebrow>
        <div className="gsm-native-moneymanagementportfoliopositions-0f523c3d0" style={{ color: C.sub }}>
          Contrôle de la poche espèces actuelle, de la cible et de la position
          prévisionnelle après les flux connus.
        </div>
      </div>

      <Card className="gsm-native-moneymanagementportfoliopositions-540222a63">
        <div
          className="gsm-native-moneymanagementportfoliopositions-e8f815b47"
          style={{
            maxHeight: 430,
            overscrollBehavior: 'contain',
            scrollbarGutter: 'stable',
          }}
        >
          <table className="gsm-table--banking gsm-native-moneymanagementportfoliopositions-1701243fe" style={{ minWidth: 1580 }}>
            <thead
              style={{
                background: C.surfaceElevated,
                position: 'sticky',
                top: 0,
                zIndex: 4,
                boxShadow: `0 1px 0 ${C.line}`,
              }}
            >
              <tr>
                <Th>Client</Th>
                <Th>Marché</Th>
                <Th>Type / Profil</Th>
                <Th>Encours</Th>
                <Th>Liquidité actuelle</Th>
                <Th>Cible</Th>
                <Th>Entrées 30 j</Th>
                <Th>Sorties 30 j</Th>
                <Th>Prévisionnel</Th>
                <Th>Écart vs cible</Th>
                <Th>Statut</Th>
                <Th><span className="gsm-native-moneymanagementportfoliopositions-88bf1699b">Action</span></Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="gsm-native-moneymanagementportfoliopositions-c3b3cdfc8" style={{ color: C.sub }}>
                    Aucun portefeuille ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              )}

              {rows.map((row, index) => {
                const client = row.client;

                return (
                  <tr
                    key={client.id}
                    style={{
                      borderTop: `1px solid ${C.line}`,
                      background: index % 2 ? C.rowAlternate : C.surfaceCard,
                    }}
                  >
                    <Td className="gsm-native-moneymanagementportfoliopositions-e6e0fd867">{client.nom}</Td>
                    <Td>
                      <Badge tone="navy">{client.marche} · {client.devise}</Badge>
                    </Td>
                    <Td>
                      <div className="gsm-native-moneymanagementportfoliopositions-14cd5e85b">
                        {profileTypeLabel[client.type] || client.type}
                      </div>
                      <div className="gsm-native-moneymanagementportfoliopositions-9cd8c0630" style={{ color: C.sub }}>
                        {client.profilRisque}
                      </div>
                    </Td>
                    <Td mono className="gsm-native-moneymanagementportfoliopositions-07809e24f">
                      {fmt(client.encours)} {client.devise}
                    </Td>
                    <Td mono className="gsm-native-moneymanagementportfoliopositions-07809e24f">
                      <div>{fmt(Math.round(row.liquiditeActuelle))} {client.devise}</div>
                      <div className="gsm-native-moneymanagementportfoliopositions-6294ef9e4" style={{ color: C.sub }}>
                        {row.ratioActuel.toFixed(1)}%
                      </div>
                    </Td>
                    <Td mono>{row.ratioCible.toFixed(1)}%</Td>
                    <Td mono className="gsm-native-moneymanagementportfoliopositions-07809e24f">
                      <span style={{ color: C.teal }}>
                        +{fmt(Math.round(row.encaissements30J))} {client.devise}
                      </span>
                    </Td>
                    <Td mono className="gsm-native-moneymanagementportfoliopositions-07809e24f">
                      <span style={{ color: C.coral }}>
                        -{fmt(Math.round(row.decaissements30J))} {client.devise}
                      </span>
                    </Td>
                    <Td mono className="gsm-native-moneymanagementportfoliopositions-07809e24f">
                      <div className="gsm-native-moneymanagementportfoliopositions-4b3a87e44">
                        {fmt(Math.round(row.liquiditePrevisionnelle))} {client.devise}
                      </div>
                      <div className="gsm-native-moneymanagementportfoliopositions-6294ef9e4" style={{ color: C.sub }}>
                        {row.ratioPrevisionnel.toFixed(1)}%
                      </div>
                    </Td>
                    <Td mono>
                      <span
                        style={{
                          color: row.ecartPts < 0 ? C.coral : C.teal,
                          fontWeight: 700,
                        }}
                      >
                        {row.ecartPts > 0 ? '+' : ''}
                        {row.ecartPts.toFixed(1)} pts
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(row.statut)}>{row.statut}</Badge>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => onOpenClient(client.id)}
                        className="gsm-native-moneymanagementportfoliopositions-bed16a09e"
                        style={{ color: C.navy }}
                      >
                        Ouvrir →
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
