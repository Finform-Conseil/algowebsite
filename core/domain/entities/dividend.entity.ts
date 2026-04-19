import { DividendFrequencyEnum, DividendTypeEnum } from "../enums/dividend.enum";
import { ActionEntity } from "./action.entity";

export interface DividendEntity {
    id: string;
    action: ActionEntity;
    ex_date: string;
    declared_date: string;
    record_date: string;
    pay_date: string;
    amount: number;
    frequency: DividendFrequencyEnum;
    type: DividendTypeEnum;
}
