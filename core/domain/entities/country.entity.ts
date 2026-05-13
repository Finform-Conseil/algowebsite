import { BourseEntity } from "./bourse.entity";
import { CurrencyEntity } from "./currency.entity";

export interface CountryEntity {
    id: string;
    number?: string;
    symbol: string;
    name: string;
    slug: string;
    bourse: string | BourseEntity;
    currency: string | CurrencyEntity;
    orientation_strategique?: string;
    objectif_investissement?: string;
    aum?: number;
    performance?: number;
}