import { CountryEntity } from "./country.entity";
import { OPCVMEntity } from "./opcvm.entity";

export interface SGOEntity {
    id?: string;
    number?: string;
    institution?: string;
    name?: string;
    longitude?: number;
    latitude?: number;
    country?: CountryEntity;
    email?: string;
    phone?: string;
    geographic_address?: string;
    opcvms_count?: number;
    opcvms?: OPCVMEntity[]
}
