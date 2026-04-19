import { InstrumentTypeEnum } from "../enums/instrument.enum";

export interface InstrumentEntity {
    id?: string;
    number?: string;
    type: InstrumentTypeEnum;
}