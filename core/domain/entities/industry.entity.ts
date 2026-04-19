import { SectorEntity } from "./sector.entity";

export interface IndustryEntity {
    id: string;
    number?: string;
    name: string;
    code: string;
    slug: string;
    sector: SectorEntity;
    description?: string;
}