import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { convertCurrency, fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_DISPLAY } from '../../shared/theme/theme';

export interface MoneyCashflow {
  id: string;
  date: string;
  client: string;
  nature: string;
  libelle: string;
  sens: 'Entrée' | 'Sortie' | string;
  montant: number;
  devise: string;
  statut: string;
}

export interface MoneyRevenuePoint {
  x: number;
  y: string;
  titre: string;
  type: string;
  montant: number;
  devise: string;
  echeance: string;
}

export function MoneyManagementCashflowSection({
  currency,
  cashflows,
  totalEntries,
  totalExits,
  revenuePoints,
  dividendPoints,
  couponPoints,
  totalRevenue,
  sortedRevenueRows,
  sortDirection,
  onSortDirectionChange,
}: {
  currency: string;
  cashflows: MoneyCashflow[];
  totalEntries: number;
  totalExits: number;
  revenuePoints: MoneyRevenuePoint[];
  dividendPoints: MoneyRevenuePoint[];
  couponPoints: MoneyRevenuePoint[];
  totalRevenue: number;
  sortedRevenueRows: Array<[string, number]>;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}) {
  return (
    <section className="gsm-native-moneymanagementcashflowsection-cd6c27a9e">
      <div className="gsm-native-moneymanagementcashflowsection-559c0a6eb">
        <div>
          <Eyebrow>4. Échéancier des flux de trésorerie — 30 jours</Eyebrow>
          <div className="gsm-native-moneymanagementcashflowsection-c5ffff445" style={{ color: C.sub }}>
            Anticipation des dividendes, coupons et règlements d'ordres susceptibles
            de modifier la liquidité disponible.
          </div>
        </div>
        <div className="gsm-native-moneymanagementcashflowsection-b57ecfa4a">
          <Badge tone="teal">
            Entrées : {fmt(Math.round(totalEntries))} {currency}
          </Badge>
          <Badge tone="coral">
            Sorties : {fmt(Math.round(totalExits))} {currency}
          </Badge>
        </div>
      </div>

      <Card className="gsm-native-moneymanagementcashflowsection-6d8c1fd4e">
        <table className="gsm-native-moneymanagementcashflowsection-7a43eeb55">
          <thead style={{ background: C.surfaceElevated }}>
            <tr>
              <Th>Date</Th>
              <Th>Client</Th>
              <Th>Nature</Th>
              <Th>Détail</Th>
              <Th>Sens</Th>
              <Th>Montant d'origine</Th>
              <Th>Éq. {currency}</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {cashflows.length === 0 && (
              <tr>
                <td colSpan={8} className="gsm-native-moneymanagementcashflowsection-d8320d492" style={{ color: C.sub }}>
                  Aucun flux connu sur les 30 prochains jours pour cette sélection.
                </td>
              </tr>
            )}
            {cashflows.map((cashflow, index) => (
              <tr
                key={cashflow.id}
                style={{
                  borderTop: `1px solid ${C.line}`,
                  background: index % 2 ? C.rowAlternate : C.surfaceCard,
                }}
              >
                <Td mono>{cashflow.date}</Td>
                <Td className="gsm-native-moneymanagementcashflowsection-48cc434f0">{cashflow.client}</Td>
                <Td>{cashflow.nature}</Td>
                <Td className="gsm-native-moneymanagementcashflowsection-2f6279556">{cashflow.libelle}</Td>
                <Td>
                  <Badge tone={cashflow.sens === 'Entrée' ? 'teal' : 'coral'}>
                    {cashflow.sens}
                  </Badge>
                </Td>
                <Td mono className="gsm-native-moneymanagementcashflowsection-2f6279556">
                  {fmt(Math.round(cashflow.montant))} {cashflow.devise}
                </Td>
                <Td mono className="gsm-native-moneymanagementcashflowsection-2f6279556">
                  {fmt(Math.round(convertCurrency(cashflow.montant, cashflow.devise, currency)))} {currency}
                </Td>
                <Td>
                  <Badge tone={cashflow.statut === 'Prévu' ? 'slate' : 'gold'}>
                    {cashflow.statut}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="gsm-native-moneymanagementcashflowsection-049e5efc8">
        <Card className="gsm-native-moneymanagementcashflowsection-3fd57d0e3">
          <Eyebrow>Tombées de revenus financiers — coupons &amp; dividendes</Eyebrow>
          <div className="gsm-native-moneymanagementcashflowsection-0a96a0627" style={{ color: C.sub }}>
            <span className="gsm-native-moneymanagementcashflowsection-a61d428d2">
              <span className="gsm-native-moneymanagementcashflowsection-55e1f9167" style={{ background: C.teal }} />
              Dividende
            </span>
            <span className="gsm-native-moneymanagementcashflowsection-a61d428d2">
              <span className="gsm-native-moneymanagementcashflowsection-55e1f9167" style={{ background: C.gold }} />
              Coupon
            </span>
            <span>Jours à venir dans l'horizon de 30 jours</span>
          </div>

          {revenuePoints.length === 0 ? (
            <div className="gsm-native-moneymanagementcashflowsection-a6c2ad306" style={{ color: C.sub }}>
              Aucune tombée de coupon ou dividende pour cette sélection.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke={C.line} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Échéance"
                  unit=" j"
                  domain={[0, 30]}
                  tick={{ fontSize: 11, fill: C.sub }}
                />
                <YAxis
                  type="category"
                  dataKey="y"
                  name="Portefeuille"
                  tick={{ fontSize: 11, fill: C.sub }}
                  width={140}
                />
                <ZAxis range={[90, 90]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload as MoneyRevenuePoint;
                    return (
                      <div
                        style={{
                          background: C.surfaceCard,
                          border: `1px solid ${C.line}`,
                          borderRadius: 10,
                          padding: 8,
                          fontSize: 12,
                        }}
                      >
                        <div className="gsm-native-moneymanagementcashflowsection-aebe3e9b2">{point.titre}</div>
                        <div>
                          {point.type} · {fmt(Math.round(point.montant))} {point.devise}
                        </div>
                        <div style={{ color: C.sub }}>{point.echeance}</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={dividendPoints} fill={C.teal} />
                <Scatter data={couponPoints} fill={C.gold} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="gsm-native-moneymanagementcashflowsection-3fd57d0e3">
          <div className="gsm-native-moneymanagementcashflowsection-fe2db02d0">
            <div>
              <Eyebrow>Revenus financiers attendus — synthèse 30 jours</Eyebrow>
              <div className="gsm-native-moneymanagementcashflowsection-c5ffff445" style={{ color: C.sub }}>
                Agrégation des coupons et dividendes déjà présents dans l'échéancier
                ci-dessus, sans double comptabilisation.
              </div>
            </div>
            <div className="gsm-native-moneymanagementcashflowsection-db5353fb3" style={{ borderColor: C.gold }}>
              <div className="gsm-native-moneymanagementcashflowsection-c5ffff445" style={{ color: C.sub }}>Total coupons + dividendes</div>
              <div className="gsm-native-moneymanagementcashflowsection-06c8bf815" style={F_DISPLAY}>
                {fmt(Math.round(totalRevenue))} {currency}
              </div>
            </div>
          </div>

          <div className="gsm-native-moneymanagementcashflowsection-9fa31038a">
            <span className="gsm-native-moneymanagementcashflowsection-9f93e8429" style={{ color: C.sub }}>Trier :</span>
            {(['desc', 'asc'] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => onSortDirectionChange(direction)}
                className="gsm-native-moneymanagementcashflowsection-0d9e8d1b8"
                style={{
                  background: sortDirection === direction ? C.activeBackground : C.surfaceCard,
                  color: sortDirection === direction ? C.textPrimary : C.ink,
                  borderColor: C.line,
                }}
              >
                {direction === 'desc' ? 'Décroissant' : 'Croissant'}
              </button>
            ))}
          </div>

          <div className="gsm-native-moneymanagementcashflowsection-b9115a8a4">
            <table className="gsm-native-moneymanagementcashflowsection-7a43eeb55">
              <thead style={{ background: C.surfaceElevated }}>
                <tr>
                  <Th>Portefeuille</Th>
                  <Th>Coupons + dividendes à 30 j</Th>
                </tr>
              </thead>
              <tbody>
                {sortedRevenueRows.length === 0 && (
                  <tr>
                    <td colSpan={2} className="gsm-native-moneymanagementcashflowsection-188c66fb7" style={{ color: C.sub }}>
                      Aucun revenu financier attendu sur les 30 prochains jours.
                    </td>
                  </tr>
                )}
                {sortedRevenueRows.map(([name, amount]) => (
                  <tr key={name} style={{ borderTop: `1px solid ${C.line}` }}>
                    <Td className="gsm-native-moneymanagementcashflowsection-aebe3e9b2">{name}</Td>
                    <Td mono>{fmt(Math.round(amount))} {currency}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}
