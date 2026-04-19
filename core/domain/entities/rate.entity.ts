import { CountryEntity } from "./country.entity";

export interface RateEntity {
    id?: string;
    number?: string;
    timestamp: string;
    one_month: number;
    two_months: number;
    three_months: number;
    six_months: number;
    nine_months: number;
    one_year: number;
    two_years: number;
    three_years: number;
    four_years: number;
    five_years: number;
    six_years: number;
    seven_years: number;
    eight_years: number;
    nine_years: number;
    ten_years: number;
    eleven_years: number;
    twelve_years: number;
    thirteen_years: number;
    fourteen_years: number;
    fifteen_years: number;
    twenty_years: number;
    twenty_five_years: number;
    thirty_years: number;

    country?: CountryEntity;
}