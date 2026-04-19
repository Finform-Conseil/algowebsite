import { ActionEntity } from "./action.entity";
import { PeriodEntity } from "./config.entity";

export interface ResultMetricEntity {
    id?: string;
    slug?: string;
    label?: string;
    category?: string;
    description?: string;
}

export interface ResultEntity {
    id?: string;
    action: ActionEntity;
    metric: ResultMetricEntity;
    period: PeriodEntity;
    value: number;
    perspectives?: string;
}
