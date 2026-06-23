import { BourseEntity } from "./bourse.entity";
import { CountryEntity } from "./country.entity";
import { OPCVMEntity } from "./opcvm.entity";

export interface SGOEntity {
    id?: string;
    number?: string;
    institution?: string;
    name?: string;
    longitude?: number;
    latitude?: number;
    email?: string;
    phone?: string;
    geographic_address?: string;
    opcvms_count?: number;
    opcvms?: OPCVMEntity[];

    bourse?: BourseEntity;
    country?: CountryEntity;
    aum?: number;
    performance?: number;
    objectif_investissement?: string;
    orientation_strategique?: string;
    website?: string;
}
