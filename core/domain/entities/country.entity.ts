import { BourseEntity } from "./bourse.entity";
import { CurrencyEntity } from "./currency.entity";

export interface CountryEntity {
    id: string;
    number?: string;
    symbol: string;
    name: string;
    slug: string;
    bourse: BourseEntity;
    currency: CurrencyEntity
}