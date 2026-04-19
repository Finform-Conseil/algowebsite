import { InstitutionTypeEnum } from "../enums/institution.enum";

export interface InstitutionEntity {
    id?: string;
    number?: string;
    type: InstitutionTypeEnum;
}