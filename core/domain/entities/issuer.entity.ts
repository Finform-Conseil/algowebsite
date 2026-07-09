import { CountryEntity } from "./country.entity";

export interface IssuerEntity {
    id?: string;
    updated_at?: string;
    created_at?: string;
    name?: string;
    issuer_type?: string;
    debt_manager?: string;
    commercial_register_number?: string | null;
    social_capital?: string | null;
    head_office?: string | null;
    phone?: string | null;
    registrary?: string | null;
    coordinates?: string | null;
    resources_persons?: string | null;
    country?: string;
}
