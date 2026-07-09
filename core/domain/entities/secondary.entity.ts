import { PrimaryEntity } from "./primary.entity";

export interface SecondaryEntity {
    id?             : string;
    primary?        : string | PrimaryEntity;
    timestamp?      : string;
    opening_yield?  : number;
    closing_yield?  : number;
    high_price?     : number;
    low_price?      : number;
    opening_price?  : number;
    closing_price?  : number;
    traded_yield?   : number;
    number_of_trades: number;
    volume_traded?  : number;
    value_traded?   : number;
}