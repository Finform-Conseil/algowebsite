import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { fmt } from '../../shared/lib/finance';
import { Badge, Card, Eyebrow, Td, Th } from '../../shared/ui/UiAtoms';
import { C, F_BODY, F_DISPLAY, F_MONO } from '../../shared/theme/theme';

export interface PortfolioCashflow {
  id: string;
  type: 'Dépôt' | 'Retrait';
  libelle: string;
  date: Date;
  montant: number;
  devise: string;
}

export interface PortfolioOpeningSituation {
  dateOuverture: Date;
  encoursActuel: number;
  totalDepots: number;
  totalRetraits: number;
  capitalNetVerse: number;
  plusMoinsValue: number;
  pourcentagePlusMoinsValue: number;
  flux: PortfolioCashflow[];
}

export function PortfolioOpeningPerformanceCard({
  currency,
  situation,
  formatDate,
}: {
  currency: string;
  situation: PortfolioOpeningSituation;
  formatDate: (date: Date) => string;
}) {
  const [cashflowsOpen, setCashflowsOpen] = useState(false);
  const positive = situation.plusMoinsValue >= 0;

  return (
    <Card
      className="gsm-native-portfolioopeningperformancecard-158a7a1cd"
      style={{
        borderColor: C.borderSubtle,
        background: C.surfaceCard,
      }}
    >
      <div className="gsm-native-portfolioopeningperformancecard-4e5f4dceb">
        <div>
          <Eyebrow>Performance depuis l'ouverture du compte</Eyebrow>
          <div className="gsm-native-portfolioopeningperformancecard-f211de55f" style={{ ...F_DISPLAY, color: C.ink }}>
            Plus / moins-value cumulée, nette des dépôts et retraits
          </div>
          <div className="gsm-native-portfolioopeningperformancecard-c222c840b" style={{ color: C.sub, ...F_BODY }}>
            Compte ouvert le {formatDate(situation.dateOuverture)}. Le calcul neutralise
            les flux externes du client afin de ne pas confondre un dépôt avec une
            performance ni un retrait avec une perte.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCashflowsOpen((open) => !open)}
          className="gsm-native-portfolioopeningperformancecard-45e20eeaf"
          style={{
            background: cashflowsOpen ? C.surfaceInset : C.activeBackground,
            color: C.textPrimary,
            ...F_BODY,
          }}
          aria-expanded={cashflowsOpen}
        >
          {cashflowsOpen ? 'Masquer les dépôts & retraits' : 'Voir les dépôts & retraits'}
        </button>
      </div>

      <div className="gsm-native-portfolioopeningperformancecard-090558fa5">
        <Metric label="Encours actuel" value={`${fmt(situation.encoursActuel)} ${currency}`} />
        <Metric label="Total investi" value={`${fmt(situation.totalDepots)} ${currency}`} note="Somme de tous les dépôts" />
        <Metric label="Retraits cumulés" value={`${fmt(situation.totalRetraits)} ${currency}`} note="Flux sortis du compte" />
        <Metric label="Apport net cumulé" value={`${fmt(situation.capitalNetVerse)} ${currency}`} note="Dépôts − retraits" />

        <div
          className="gsm-native-portfolioopeningperformancecard-afad2706f"
          style={{
            borderColor: C.borderSubtle,
            background: C.surfaceCard,
          }}
        >
          <div className="gsm-native-portfolioopeningperformancecard-1f82305df" style={{ color: positive ? C.teal : C.coral }}>
            {positive ? 'Plus-value' : 'Moins-value'} cumulée
          </div>
          <div className="gsm-native-portfolioopeningperformancecard-b7750c396" style={{ color: positive ? C.teal : C.coral, ...F_MONO }}>
            {positive ? '+' : '-'}{fmt(Math.abs(situation.plusMoinsValue))} {currency}
          </div>
          <div className="gsm-native-portfolioopeningperformancecard-7d7913d75">
            <span className="gsm-native-portfolioopeningperformancecard-35e7994ef" style={{ color: positive ? C.teal : C.coral, ...F_MONO }}>
              {positive ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
              {Math.abs(situation.pourcentagePlusMoinsValue).toFixed(2)}% du total investi
            </span>
          </div>
        </div>
      </div>

      <div
        className="gsm-native-portfolioopeningperformancecard-274442c4a"
        style={{
          borderTop: `1px solid ${C.borderSubtle}`,
          color: C.sub,
          ...F_BODY,
        }}
      >
        <b style={{ color: C.ink }}>Méthode :</b> plus / moins-value = encours actuel +
        retraits cumulés − dépôts cumulés. Le pourcentage affiché rapporte cette plus /
        moins-value à la somme de tous les dépôts effectués depuis l'ouverture. Il s'agit
        donc d'un indicateur cumulé simple, non annualisé.
      </div>

      {cashflowsOpen && (
        <div className="gsm-native-portfolioopeningperformancecard-0ba9e7c99">
          <div className="gsm-native-portfolioopeningperformancecard-a66891264">
            <div>
              <div className="gsm-native-portfolioopeningperformancecard-89dbf347a" style={{ color: C.ink }}>
                Historique des apports et retraits
              </div>
              <div className="gsm-native-portfolioopeningperformancecard-c7700d7e6" style={{ color: C.sub }}>
                Flux externes pris en compte depuis l'ouverture du compte.
              </div>
            </div>
            <Badge tone="navy">{situation.flux.length} mouvement(s)</Badge>
          </div>

          <div className="gsm-table-scroll gsm-native-portfolioopeningperformancecard-11dbc91da" style={{ borderColor: C.line }}>
            <table className="gsm-table--banking gsm-native-portfolioopeningperformancecard-dfd8e9ca2">
              <thead style={{ background: C.surfaceElevated }}>
                <tr><Th>Date</Th><Th>Nature</Th><Th>Libellé</Th><Th>Montant</Th><Th>Impact capital</Th></tr>
              </thead>
              <tbody>
                {situation.flux.map((cashflow, index) => {
                  const deposit = cashflow.type === 'Dépôt';
                  return (
                    <tr
                      key={cashflow.id}
                      style={{ borderTop: index === 0 ? 'none' : `1px solid ${C.line}` }}
                    >
                      <Td mono>{formatDate(cashflow.date)}</Td>
                      <Td><Badge tone={deposit ? 'teal' : 'gold'}>{cashflow.type}</Badge></Td>
                      <Td>{cashflow.libelle}</Td>
                      <Td mono>{fmt(cashflow.montant)} {cashflow.devise}</Td>
                      <Td>
                        <span className="gsm-native-portfolioopeningperformancecard-89dbf347a" style={{ color: deposit ? C.teal : C.coral, ...F_MONO }}>
                          {deposit ? '+' : '-'}{fmt(cashflow.montant)} {cashflow.devise}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="gsm-native-portfolioopeningperformancecard-a3d74ca6b" style={{ color: C.sub, ...F_BODY }}>
            Données de démonstration dans cette maquette. En production, cet historique
            devra provenir des mouvements espèces réellement enregistrés pour le compte du client.
          </div>
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="gsm-native-portfolioopeningperformancecard-afad2706f" style={{ borderColor: C.line, background: C.surfaceCard }}>
      <div className="gsm-native-portfolioopeningperformancecard-1f82305df" style={{ color: C.sub }}>{label}</div>
      <div className="gsm-native-portfolioopeningperformancecard-e90d47194" style={{ color: C.ink, ...F_MONO }}>{value}</div>
      {note && <div className="gsm-native-portfolioopeningperformancecard-467d72a0d" style={{ color: C.sub }}>{note}</div>}
    </div>
  );
}
