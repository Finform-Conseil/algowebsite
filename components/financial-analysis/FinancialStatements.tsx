'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStatementRepository } from '@/core/infra/repositories/statement.repository.impl';
import { useQueryParams } from '@/core/presenter/hooks/useQueryParams';
import { StatementQueryParams } from '@/core/domain/types/statement.type';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { FinancialStatementEntity, FinancialItemTreeNode } from '@/core/domain/entities/statement.entity';
import { PeriodEntity } from '@/core/domain/entities/config.entity';

interface FinancialStatementsProps {
  action: ActionEntity;
  currency: string;
}

export default function FinancialStatements({
  action,
  currency
}: FinancialStatementsProps) {

  const { params: queryParams } = useQueryParams<StatementQueryParams>({ view_type: "action_tree", action_id: action.id });
  const { allStatementsData, getAllStatements } = useStatementRepository();
  
  useEffect(() => { 
    getAllStatements(queryParams); 
  }, [queryParams]);

  const [activeStatementName, setActiveStatementName] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fonction pour toggle l'expansion d'un item
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Récupérer les statements de l'API
  const statements = useMemo(() => {
    const extracted = (allStatementsData as any)?.statements || [];
    return extracted;
  }, [allStatementsData]);

  // Statement actif
  const activeStatement = useMemo(() => {
    const found = statements.find((s: FinancialStatementEntity) => s.name === activeStatementName) || statements[0];
    return found;
  }, [statements, activeStatementName]);

  // Extraire les périodes disponibles
  const availablePeriods = useMemo(() => {
    if (!activeStatement?.items?.[0]?.values) {
      console.log("[FinancialStatements] ⚠️ No values found in items");
      return [];
    }
    
    const periods = activeStatement.items[0].values.map((v: any) => v.period);
    console.log("[FinancialStatements] 📅 Extracted periods:", periods);
    return periods;
  }, [activeStatement]);

  // Toutes les périodes disponibles (pas de limitation)
  const selectedPeriods = useMemo(() => {
    return availablePeriods;
  }, [availablePeriods]);

  // Formater les valeurs
  const formatValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    return value.toLocaleString();
  };

  // Déterminer la classe CSS selon le level et le code
  const getRowClassName = (level: number, code: string): string => {
    // Les totaux principaux (level 0) sont mis en évidence
    if (level === 0) return 'total-row highlight';
    // Les sous-totaux (level 1) sont en gras
    if (level === 1) return 'total-row';
    // Les lignes normales
    return '';
  };

  // Déterminer la classe d'indentation
  const getIndentClass = (level: number): string => {
    return level > 1 ? 'indent' : '';
  };

  // Déterminer si une valeur est négative et doit être affichée entre parenthèses
  const isNegativeValue = (value: number): boolean => {
    return value < 0;
  };

  // Fonction récursive pour rendre un item et ses enfants
  const renderStatementItem = (item: FinancialItemTreeNode, periods: PeriodEntity[]): JSX.Element[] => {
    const rowClassName = getRowClassName(item.level, item.code);
    const labelClassName = `row-label ${getIndentClass(item.level)}`;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    const rows: JSX.Element[] = [];

    // Ligne principale
    rows.push(
      <tr key={item.id} className={rowClassName}>
        <td className={labelClassName}>
          {item.level === 0 && hasChildren && (
            <button
              onClick={() => toggleExpand(item.id)}
              className="expand-toggle"
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          {item.label}
        </td>
        {periods.map((period: PeriodEntity) => {
          const valueData = item.values.find((v: any) => v.period.id === period.id);
          const numValue = parseFloat(valueData?.value || '0');
          const isNegative = isNegativeValue(numValue);
          
          return (
            <td 
              key={period.id} 
              className={`value ${isNegative ? 'negative' : ''} ${rowClassName.includes('bold') || rowClassName.includes('highlight') ? 'bold' : ''}`}
              title={`${isNegative ? '-' : ''}${Math.abs(numValue)} ${action.bourse.currency?.symbol}`}
            >
              {isNegative ? '-' : ''}{formatValue(Math.abs(numValue))}
            </td>
          );
        })}
      </tr>
    );
    
    // Rendu récursif des enfants (seulement si level 0 est expanded ou si ce n'est pas level 0)
    if (hasChildren) {
      if (item.level === 0) {
        // Pour level 0, afficher les enfants seulement si expanded
        if (isExpanded) {
          item.children!.forEach((child: FinancialItemTreeNode) => {
            rows.push(...renderStatementItem(child, periods));
          });
        }
      } else {
        // Pour les autres levels, toujours afficher les enfants
        item.children!.forEach((child: FinancialItemTreeNode) => {
          rows.push(...renderStatementItem(child, periods));
        });
      }
    }
    
    return rows;
  };

  // Rendu dynamique du statement actif
  const renderDynamicStatement = () => {
    if (!activeStatement || !activeStatement.items || activeStatement.items.length === 0) {
      console.log("[FinancialStatements] ❌ No data available for rendering");
      return (
        <div className="statement-table">
          <div className="no-data">Aucune donnée disponible</div>
        </div>
      );
    }
    
    return (
      <div className="statement-table">
        <table>
          <thead>
            <tr>
              <th className="row-header">{activeStatement.name || 'État Financier'}</th>
              {selectedPeriods.map((period: PeriodEntity) => (
                <th key={period.id} className="period-header">{period.display || period.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeStatement.items.map((item: FinancialItemTreeNode) => 
              renderStatementItem(item, selectedPeriods)
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Initialiser le premier statement au chargement
  useEffect(() => {
    if (statements.length > 0 && !activeStatementName) {
      const firstName = statements[0].name || '';
      console.log("[FinancialStatements] ✅ Setting active statement to:", firstName);
      setActiveStatementName(firstName);
    }
  }, [statements, activeStatementName]);

  // Déplier tous les items de niveau 0 par défaut au changement de statement
  useEffect(() => {
    if (activeStatement?.items) {
      const level0Ids = activeStatement.items
        .filter((item: FinancialItemTreeNode) => item.level === 0 && item.children && item.children.length > 0)
        .map((item: FinancialItemTreeNode) => item.id);
      
      if (level0Ids.length > 0) {
        setExpandedItems(new Set(level0Ids));
      }
    }
  }, [activeStatement]);

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
        {statements.map((statement: FinancialStatementEntity) => (
          <button
            key={statement.id}
            className={`tab-btn ${activeStatementName === statement.name ? 'active' : ''}`}
            onClick={() => setActiveStatementName(statement.name || '')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {statement.code === 'IS' && (
                <>
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </>
              )}
              {statement.code === 'BS' && (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </>
              )}
              {statement.code === 'CF' && (
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              )}
            </svg>
            {statement.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="statements-content">
        {renderDynamicStatement()}
      </div>
    </div>
  );
}
