import { CountryEntity } from "./country.entity";
import { IndustryEntity } from "./industry.entity";
import { InstitutionEntity } from "./institution.entity";

export interface SocietyEntity {
    id: string;
    number?: string;
    name: string;
    slug?: string;
    institution?: InstitutionEntity;
    country?: CountryEntity;
    industry: IndustryEntity;
    description: string;
    phone?: string;
    email?: string;
    website?: string;
    employee_count?: number;
    headquarters_address?: string;
    founded_date?: Date;
    sector_gics?: number;
    icb_sector_number?: number;
    fondamental_industry_code?: string;
    last_actions_buyback_value?: number;

    parent?: SocietyEntity;

    chief_executive_officer?: string;
    financial_manager?: string;
    chairman_board?: string;
    head_office?: string;
    year_founded?: number;
    rating?: string;
    
    subsidiaries?: string;
}


    
