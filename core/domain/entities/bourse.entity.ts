import { CurrencyEntity } from "./currency.entity";

export interface BourseEntity {
    id?: string;
    number?: string;
    name: string;
    slug: string;
    ticker: string;
    currency?: CurrencyEntity;
    description: string;
}