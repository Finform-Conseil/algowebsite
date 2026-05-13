import { IndustryEntity, ShortIndustryEntity } from "./industry.entity";

export interface SectorEntity {
    id?: string;
    number?: string;
    name: string;
    slug: string;
    description: string;

    industries?: ShortIndustryEntity[];
}

// Structure pour les sociétés dans les industries
export interface SectorSocietyData {
    id: string;
    name: string;
    market_cap: number | null;
    bourse: string;
    performance_1y: number | null;
    volatility: number | null;
    roe: number | null;
    roa: number | null;
}

// Structure pour les industries dans les secteurs
export interface SectorIndustryData {
    id: string;
    name: string;
    societies: SectorSocietyData[];
}

// Structure complète du secteur avec données backend
export interface SectorWithStats {
    id: string;
    number: string;
    name: string;
    industries: SectorIndustryData[];
}