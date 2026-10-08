import { convertCurrency, fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C } from '../../shared/theme/theme';

type BadgeTone = 'slate' | 'gold' | 'teal' | 'coral' | 'navy';

export interface LiquidityActionClient {
  id: string;
  nom: string;
  devise: string;
  alloc: Record<string, number>;
  cible: Record<string, number>;
}

export interface LiquidityActionRow {
  client: LiquidityActionClient;
  statut: string;
  ratioPrevisionnel: number;
  ratioCible: number;
  montantVersCible: number;
  action: string;
}

export function MoneyManagementLiquidityActions({
  currency,
  rows,
  rebalanceThreshold,
  statusTone,
  onOpenClient,
  onRebalance,
}: {
  currency: string;
  rows: LiquidityActionRow[];
  rebalanceThreshold: number;
  statusTone: (status: string) => BadgeTone;
  onOpenClient: (clientId: string) => void;
  onRebalance: (clientId: string) => void;
}) {
  const hasCritical = rows.some((row) => row.statut === 'Critique');

  return (
    <section className="gsm-native-moneymanagementliquidityactions-0ade97997">
      <div className="gsm-native-moneymanagementliquidityactions-24f545f0f">
        <div>
          <Eyebrow>6. Actions de gestion de liquidité</Eyebrow>
          <div className="gsm-native-moneymanagementliquidityactions-a2d3eb5ea" style={{ color: C.sub }}>
            Liste priorisée des portefeuilles nécessitant une reconstitution de
            cash ou un réinvestissement de l'excédent.
          </div>
        </div>
        <Badge tone={hasCritical ? 'coral' : 'gold'}>
          {rows.length} action(s)
        </Badge>
      </div>

      <Card className="gsm-native-moneymanagementliquidityactions-65d21870e">
        <table className="gsm-native-moneymanagementliquidityactions-4c10eb489">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Client</Th>
              <Th>Statut</Th>
              <Th>Liquidité prév.</Th>
              <Th>Cible</Th>
              <Th>Montant à ajuster ({currency})</Th>
              <Th>Action suggérée</Th>
              <Th><span className="gsm-native-moneymanagementliquidityactions-6a1407c89">Actions</span></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="gsm-native-moneymanagementliquidityactions-cd6d5f1e0" style={{ color: C.sub }}>
                  Aucune action de liquidité n'est requise pour les portefeuilles filtrés.
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              const client = row.client;
              const allocationGap = Math.abs(
                Number(client.alloc.Liquidité || 0) -
                  Number(client.cible.Liquidité || 0)
              );
              return (
                <tr
                  key={client.id}
                  style={{
                    borderTop: `1px solid ${C.line}`,
                    background: index % 2 ? C.rowAlternate : C.surfaceCard,
                  }}
                >
                  <Td className="gsm-native-moneymanagementliquidityactions-4107e881a">{client.nom}</Td>
                  <Td><Badge tone={statusTone(row.statut)}>{row.statut}</Badge></Td>
                  <Td mono>{row.ratioPrevisionnel.toFixed(1)}%</Td>
                  <Td mono>{row.ratioCible.toFixed(1)}%</Td>
                  <Td mono className="gsm-native-moneymanagementliquidityactions-26bb858fb">
                    {fmt(Math.round(convertCurrency(row.montantVersCible, client.devise, currency)))} {currency}
                  </Td>
                  <Td><span className="gsm-native-moneymanagementliquidityactions-a2d3eb5ea" style={{ color: C.sub }}>{row.action}</span></Td>
                  <Td>
                    <div className="gsm-native-moneymanagementliquidityactions-919b59364">
                      {allocationGap > rebalanceThreshold && (
                        <button
                          type="button"
                          onClick={() => onRebalance(client.id)}
                          className="gsm-native-moneymanagementliquidityactions-be2d8780b"
                          style={{ color: C.coral }}
                        >
                          Rééquilibrer →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenClient(client.id)}
                        className="gsm-native-moneymanagementliquidityactions-be2d8780b"
                        style={{ color: C.navy }}
                      >
                        Portefeuille →
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
