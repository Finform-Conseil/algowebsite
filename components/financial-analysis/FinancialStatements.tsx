'use client';

import { useState } from 'react';
import { IncomeStatement, BalanceSheet, CashFlowStatement } from '@/types/financial-analysis';
import { formatCurrency } from '@/core/data/FinancialData';

interface FinancialStatementsProps {
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
  cashFlowStatements: CashFlowStatement[];
  currency: string;
}

type StatementType = 'income' | 'balance' | 'cashflow';

export default function FinancialStatements({
  incomeStatements,
  balanceSheets,
  cashFlowStatements,
  currency
}: FinancialStatementsProps) {
  const [activeStatement, setActiveStatement] = useState<StatementType>('income');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(
    incomeStatements.slice(0, 3).map(s => s.period)
  );

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    return value.toLocaleString();
  };

  const renderIncomeStatement = () => {
    const statements = incomeStatements.filter(s => selectedPeriods.includes(s.period));
    
    return (
      <div className="statement-table">
        <table>
          <thead>
            <tr>
              <th className="row-header">Compte de résultat</th>
              {statements.map(stmt => (
                <th key={stmt.period} className="period-header">{stmt.period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="section-header">
              <td colSpan={statements.length + 1}>Revenus</td>
            </tr>
            <tr>
              <td className="row-label">Chiffre d'affaires</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.revenue)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Coût des revenus</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(stmt.costOfRevenue)})</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Marge brute</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.grossProfit)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Charges opérationnelles</td>
            </tr>
            <tr>
              <td className="row-label indent">Frais généraux et admin.</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(stmt.sellingGeneralAdmin)})</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Résultat opérationnel</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.operatingIncome)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Résultat net</td>
            </tr>
            <tr>
              <td className="row-label indent">Charges d'intérêts</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(stmt.interestExpense)})</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Autres revenus/charges</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.otherIncomeExpense)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label">Résultat avant impôts</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.incomeBeforeTax)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Impôts sur le revenu</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(stmt.incomeTax)})</td>
              ))}
            </tr>
            <tr className="total-row highlight">
              <td className="row-label">Résultat net</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.netIncome)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Par action</td>
            </tr>
            <tr>
              <td className="row-label">BPA (dilué)</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{stmt.epsDiluted.toLocaleString()}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const statements = balanceSheets.filter(s => selectedPeriods.includes(s.period));
    
    return (
      <div className="statement-table">
        <table>
          <thead>
            <tr>
              <th className="row-header">Bilan</th>
              {statements.map(stmt => (
                <th key={stmt.period} className="period-header">{stmt.period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="section-header">
              <td colSpan={statements.length + 1}>Actifs courants</td>
            </tr>
            <tr>
              <td className="row-label indent">Trésorerie et équivalents</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.cashAndEquivalents)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Placements court terme</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.shortTermInvestments)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Créances clients</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.accountsReceivable)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Stocks</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.inventory)}</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Total actifs courants</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.currentAssets)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Actifs non courants</td>
            </tr>
            <tr>
              <td className="row-label indent">Immobilisations</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.propertyPlantEquipment)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Goodwill</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.goodwill)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Actifs incorporels</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.intangibleAssets)}</td>
              ))}
            </tr>
            <tr className="total-row highlight">
              <td className="row-label">Total actifs</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.totalAssets)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Passifs courants</td>
            </tr>
            <tr>
              <td className="row-label indent">Dettes fournisseurs</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.accountsPayable)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Dette court terme</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.shortTermDebt)}</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Total passifs courants</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.currentLiabilities)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Passifs non courants</td>
            </tr>
            <tr>
              <td className="row-label indent">Dette long terme</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.longTermDebt)}</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Total passifs</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.totalLiabilities)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Capitaux propres</td>
            </tr>
            <tr>
              <td className="row-label indent">Capital social</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.commonStock)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Résultats non distribués</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.retainedEarnings)}</td>
              ))}
            </tr>
            <tr className="total-row highlight">
              <td className="row-label">Total capitaux propres</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.totalEquity)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderCashFlowStatement = () => {
    const statements = cashFlowStatements.filter(s => selectedPeriods.includes(s.period));
    
    return (
      <div className="statement-table">
        <table>
          <thead>
            <tr>
              <th className="row-header">Flux de trésorerie</th>
              {statements.map(stmt => (
                <th key={stmt.period} className="period-header">{stmt.period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="section-header">
              <td colSpan={statements.length + 1}>Activités opérationnelles</td>
            </tr>
            <tr>
              <td className="row-label indent">Résultat net</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.netIncome)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Amortissements</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.depreciationAmortization)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Variation BFR</td>
              {statements.map(stmt => (
                <td key={stmt.period} className={`value ${stmt.changeInWorkingCapital < 0 ? 'negative' : ''}`}>
                  {stmt.changeInWorkingCapital < 0 ? '(' : ''}{formatValue(Math.abs(stmt.changeInWorkingCapital))}{stmt.changeInWorkingCapital < 0 ? ')' : ''}
                </td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Flux opérationnels</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.operatingCashFlow)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Activités d'investissement</td>
            </tr>
            <tr>
              <td className="row-label indent">Investissements (CAPEX)</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(Math.abs(stmt.capitalExpenditures))})</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Achats de placements</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(Math.abs(stmt.investmentPurchases))})</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Flux d'investissement</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold negative">({formatValue(Math.abs(stmt.investingCashFlow))})</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Activités de financement</td>
            </tr>
            <tr>
              <td className="row-label indent">Émission de dette</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.debtIssuance)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Remboursement dette</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(Math.abs(stmt.debtRepayment))})</td>
              ))}
            </tr>
            <tr>
              <td className="row-label indent">Dividendes versés</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value negative">({formatValue(Math.abs(stmt.dividendsPaid))})</td>
              ))}
            </tr>
            <tr className="total-row">
              <td className="row-label">Flux de financement</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold negative">({formatValue(Math.abs(stmt.financingCashFlow))})</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Variation de trésorerie</td>
            </tr>
            <tr className="total-row highlight">
              <td className="row-label">Variation nette</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.netChangeInCash)}</td>
              ))}
            </tr>
            <tr>
              <td className="row-label">Trésorerie début</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value">{formatValue(stmt.cashAtBeginning)}</td>
              ))}
            </tr>
            <tr className="total-row highlight">
              <td className="row-label">Trésorerie fin</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold">{formatValue(stmt.cashAtEnd)}</td>
              ))}
            </tr>

            <tr className="section-header">
              <td colSpan={statements.length + 1}>Indicateur clé</td>
            </tr>
            <tr className="total-row highlight">
              <td className="row-label">Free Cash Flow</td>
              {statements.map(stmt => (
                <td key={stmt.period} className="value bold primary">{formatValue(stmt.freeCashFlow)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="financial-statements">
      <div className="statements-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          États Financiers
        </h2>
        <div className="statements-info">
          <span className="info-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Montants en {currency}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="statements-tabs">
        <button
          className={`tab-btn ${activeStatement === 'income' ? 'active' : ''}`}
          onClick={() => setActiveStatement('income')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Compte de résultat
        </button>
        <button
          className={`tab-btn ${activeStatement === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveStatement('balance')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Bilan
        </button>
        <button
          className={`tab-btn ${activeStatement === 'cashflow' ? 'active' : ''}`}
          onClick={() => setActiveStatement('cashflow')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Flux de trésorerie
        </button>
      </div>

      {/* Content */}
      <div className="statements-content">
        {activeStatement === 'income' && renderIncomeStatement()}
        {activeStatement === 'balance' && renderBalanceSheet()}
        {activeStatement === 'cashflow' && renderCashFlowStatement()}
      </div>
    </div>
  );
}
