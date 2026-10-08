import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { fmt, fmtPrice } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_MONO } from '../../shared/theme/theme';

export interface ListedAssetRow {
  title: string;
  exposition: number;
  cmp: number;
  valeurMarche: number;
  plusMoinsValue: number;
  plusMoinsValuePct: number;
}

export function PortfolioListedAssetsCard({
  currency,
  actions,
  bonds,
}: {
  currency: string;
  actions: ListedAssetRow[];
  bonds: ListedAssetRow[];
}) {
  return (
    <Card className="gsm-native-portfoliolistedassetscard-ecc082c6d">
      <div className="gsm-native-portfoliolistedassetscard-87a659347">
        <div>
          <Eyebrow>Présentation des actifs cotés</Eyebrow>
          <div className="gsm-native-portfoliolistedassetscard-be3300d23" style={{ color: C.sub, ...F_BODY }}>
            CMP = Coût Moyen Pondéré · +/- Value = gain ou perte latent(e)
            de la ligne par rapport à sa valorisation actuelle.
          </div>
        </div>
        <Badge tone="slate">Valorisation par ligne</Badge>
      </div>

      <div className="gsm-native-portfoliolistedassetscard-a6587d605">
        <ListedAssetTable
          label="Actions"
          emptyLabel="Aucune action détenue"
          currency={currency}
          rows={actions}
        />
        <ListedAssetTable
          label="Obligations"
          emptyLabel="Aucune obligation détenue en direct"
          currency={currency}
          rows={bonds}
        />
      </div>

      <div
        className="gsm-native-portfoliolistedassetscard-cff1dc24b"
        style={{ background: C.surfaceElevated, color: C.sub, ...F_BODY }}
      >
        <b style={{ color: C.ink }}>Calcul :</b> +/- Value = valeur de
        marché de la ligne − coût historique de la position. Le coût
        historique est obtenu à partir du CMP multiplié par la quantité
        correspondante.
      </div>
    </Card>
  );
}

function ListedAssetTable({
  label,
  emptyLabel,
  currency,
  rows,
}: {
  label: string;
  emptyLabel: string;
  currency: string;
  rows: ListedAssetRow[];
}) {
  return (
    <div>
      <div className="gsm-native-portfoliolistedassetscard-c9f615d03" style={{ color: C.sub }}>
        {label}
      </div>
      <div className="gsm-table-scroll">
        <table className="gsm-table--banking gsm-native-portfoliolistedassetscard-02d0f8ab4" style={{ minWidth: 700 }}>
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
            {rows.map((row) => {
              const gain = row.plusMoinsValue >= 0;
              return (
                <tr key={row.title} style={{ borderTop: `1px solid ${C.line}` }}>
                  <Td>{row.title}</Td>
                  <Td mono>{row.exposition}%</Td>
                  <Td mono className="gsm-native-portfoliolistedassetscard-84d2c99cf">
                    {fmtPrice(row.cmp)} {currency}
                  </Td>
                  <Td mono className="gsm-native-portfoliolistedassetscard-84d2c99cf">
                    {fmt(Math.round(row.valeurMarche))} {currency}
                  </Td>
                  <Td>
                    <div
                      className="gsm-native-portfoliolistedassetscard-dbdb8c58a"
                      style={{ color: gain ? C.teal : C.coral, ...F_MONO }}
                    >
                      <span className="gsm-native-portfoliolistedassetscard-57b4a74d1">
                        {gain ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
                        {gain ? '+' : '-'}
                        {fmt(Math.round(Math.abs(row.plusMoinsValue)))} {currency}
                      </span>
                      <span className="gsm-native-portfoliolistedassetscard-8794f642a">
                        {gain ? '+' : '-'}
                        {Math.abs(row.plusMoinsValuePct).toFixed(2)}%
                      </span>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="gsm-native-portfoliolistedassetscard-13b5baf25" style={{ color: C.sub }}>
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
