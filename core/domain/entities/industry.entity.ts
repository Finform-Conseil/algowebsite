import { SectorEntity } from "./sector.entity";
import { ShortSocietyEntity, SocietyEntity } from "./society.entity";

export interface IndustryEntity {
    id: string;
    number?: string;
    name: string;
    code: string;
    slug: string;
    sector: SectorEntity;
    description?: string;
}

export interface ShortIndustryEntity {
    id: string;
    number?: string;
    name: string;
    societies: ShortSocietyEntity[];
}