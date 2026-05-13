import { SectorEntity } from "./sector.entity";

export interface ActivityEntity {
    id: string;
    number?: string;
    name: string;
    slug: string;
    sector: SectorEntity;
    description?: string;
}