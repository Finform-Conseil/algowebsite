import { ActionEntity } from "./action.entity";
import { PeriodEntity } from "./config.entity";

export interface FinancialStatementEntity {
    id: string;
    code?: string;
    name?: string;
    description?: string;
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
