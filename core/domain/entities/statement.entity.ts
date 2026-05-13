import { ActionEntity } from "./action.entity";
import { PeriodEntity } from "./config.entity";

export interface FinancialStatementEntity {
    id: string;
    code?: string;
    name?: string;
    description?: string;
    items_tree?: FinancialItemTreeNode[];
}

export interface FinancialItemEntity {
    id: string;
    statement: FinancialStatementEntity;
    code: string;
    label: string;
    path: string;
    level: number;
}

export interface FinancialValueEntity {
    id: string;
    action: ActionEntity;
    item: FinancialItemEntity;
    period: PeriodEntity;
    value: number;
}

// Structure hiérarchique pour l'arbre des items
export interface FinancialItemTreeNode {
    id: string;
    code: string;
    label: string;
    level: number;
    values: {
        period: PeriodEntity;
        value: string;
    }[];
    children?: FinancialItemTreeNode[];
}

// Response de l'API pour les statements
export interface FinancialStatementsResponse {
    action: ActionEntity;
    statements: FinancialStatementEntity[];
}
