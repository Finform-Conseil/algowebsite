import { fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C } from '../../shared/theme/theme';

export interface PortfolioIncome {
  titre: string;
  type: string;
  montant: number;
  devise: string;
  date: string;
}

export interface PortfolioDeposit {
  type: string;
  montant: number;
  devise: string;
  date: string;
}

export interface RecentPortfolioMovement {
  date: string;
  type: string;
  title: string;
  amount: string;
}

const DEFAULT_RECENT_MOVEMENTS: RecentPortfolioMovement[] = [
  { date: '18/07/2026', type: 'Acquisition', title: 'SONATEL', amount: '7 100 000 XOF' },
  { date: '12/07/2026', type: 'Encaissement', title: 'Coupon Trésor 6.5%', amount: '410 000 XOF' },
  { date: '03/07/2026', type: 'Cession', title: 'ECOBANK CI', amount: '7 980 000 XOF' },
];

export function PortfolioActivityCards({
  incomes,
  deposits,
  recentMovements = DEFAULT_RECENT_MOVEMENTS,
}: {
  incomes: PortfolioIncome[];
  deposits: PortfolioDeposit[];
  recentMovements?: RecentPortfolioMovement[];
}) {
  return (
    <>
      <div className="gsm-native-portfolioactivitycards-08a11a0a0">
        <Card className="gsm-native-portfolioactivitycards-4039ebbf9">
          <Eyebrow>Présentation des encaissements (dividendes, coupons)</Eyebrow>
          <table className="gsm-native-portfolioactivitycards-5758daa85">
            <thead><tr><Th>Titre</Th><Th>Type</Th><Th>Montant</Th><Th>Date</Th></tr></thead>
            <tbody>
              {incomes.map((income, index) => (
                <tr key={`${income.titre}-${income.date}-${index}`} style={{ borderTop: `1px solid ${C.line}` }}>
                  <Td>{income.titre}</Td>
                  <Td><Badge tone="teal">{income.type}</Badge></Td>
                  <Td mono>{fmt(income.montant)} {income.devise}</Td>
                  <Td>{income.date}</Td>
                </tr>
              ))}
              {incomes.length === 0 && (
                <tr><td colSpan={4} className="gsm-native-portfolioactivitycards-b4a0b3710" style={{ color: C.sub }}>Aucun encaissement sur la période</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card className="gsm-native-portfolioactivitycards-4039ebbf9">
          <Eyebrow>Présentation des versements (espèces, chèques, virement)</Eyebrow>
          <table className="gsm-native-portfolioactivitycards-5758daa85">
            <thead><tr><Th>Type</Th><Th>Montant</Th><Th>Date</Th></tr></thead>
            <tbody>
              {deposits.map((deposit, index) => (
                <tr key={`${deposit.type}-${deposit.date}-${index}`} style={{ borderTop: `1px solid ${C.line}` }}>
                  <Td><Badge tone="navy">{deposit.type}</Badge></Td>
                  <Td mono>{fmt(deposit.montant)} {deposit.devise}</Td>
                  <Td>{deposit.date}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="gsm-native-portfolioactivitycards-4039ebbf9">
        <Eyebrow>Mouvements récents</Eyebrow>
        <table className="gsm-native-portfolioactivitycards-5758daa85">
          <thead><tr><Th>Date</Th><Th>Type</Th><Th>Titre</Th><Th>Montant</Th></tr></thead>
          <tbody>
            {recentMovements.map((movement, index) => (
              <tr key={`${movement.date}-${movement.type}-${index}`} style={{ borderTop: `1px solid ${C.line}` }}>
                <Td>{movement.date}</Td>
                <Td>{movement.type}</Td>
                <Td>{movement.title}</Td>
                <Td mono>{movement.amount}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
