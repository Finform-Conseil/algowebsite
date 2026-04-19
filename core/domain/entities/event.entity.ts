import { EventTypeEnum } from "../enums/event.enum";
import { ActionEntity } from "./action.entity";

export interface EventEntity {
    id?: string;
    number?: string;
    action: ActionEntity;
    type: EventTypeEnum;
    announcement_date : Date;
    effective_date : Date;
    description : string;
    status : string;

    split_ratio_from : number;
    split_ratio_to : number;
    old_par_value : number;
    new_par_value : number;
    reverse_ratio_from : number;
    reverse_ratio_to : number;
    cash_in_lieu : number;

    acquirer_name : string;
    target_name : string;
    exchange_ratio : number;
    new_entity_name : string;
    deal_value : number;

    offer_type : string;
    offer_price : number;

    delisting_reason : string;
    last_trading_date : Date;
    post_delisting_date : Date;
    compensation : number;

    filling_date : Date;
    bankruptcy_type : string;
    equity_cancelled : boolean;

    parent_company : string;
    spin_ratio : number;
    spin_entity : string;
    new_isin : string;

    subscription_ratio : number;
    subscription_price : number;
    rights_trading_start : Date;
    rights_trading_end : Date;
    subscription_start : Date;
    subscription_end : Date;

    buyback_type : string;
    max_shares : number;
    max_amount : number;
    program_start_date : Date;
    program_end_date : Date;
    cancellation_intent : boolean;

    
}