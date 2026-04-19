import { BourseEntity } from "./bourse.entity";
import { SectorEntity } from "./sector.entity";

export interface IndiceEntity {
    id: string;
    number?: string;
    name: string;
    slug?: string;
    instrument?: string;
    bourse?: BourseEntity;
    sector?: SectorEntity;
    sectorial_index?: boolean;
    global_index?: boolean;
    principal_index?: boolean;
    description?: string;
}

export interface IndiceCoursEntity {
    id: string;
    indice: string;
    timestamp: string;
    close: number;
}