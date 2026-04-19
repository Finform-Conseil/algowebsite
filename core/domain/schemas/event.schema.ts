import { number, z } from 'zod';
import { EventTypeEnum } from '../enums/event.enum';

export const eventSchema = z.object({
    id: z.uuid(),
    action: z.uuid(),
    type: z.array(z.enum([EventTypeEnum.SPLIT, EventTypeEnum.REVERSE_SPLIT, EventTypeEnum.DIVIDEND, EventTypeEnum.SPIN_OFF, EventTypeEnum.MERGER, EventTypeEnum.ACQUISITION, EventTypeEnum.DELISTING, EventTypeEnum.BANKRUPTCY, EventTypeEnum.RIGHTS_ISSUE])),
    announcement_date : z.date().optional(),
    effective_date : z.date().optional(),
    description : z.string().optional(),
    status : z.string().optional(),

    split_ratio_from : z.number().optional(),
    split_ratio_to : z.number().optional(),
    old_par_value : z.number().optional(),
    new_par_value : z.number().optional(),
    reverse_ratio_from : z.number().optional(),
    reverse_ratio_to : z.number().optional(),
    cash_in_lieu : z.number().optional(),

    acquirer_name : z.string().optional(),
    target_name : z.string().optional(),
    exchange_ratio : z.number().optional(),
    new_entity_name : z.string().optional(),
    deal_value : z.number().optional(),

    offer_type : z.string().optional(),
    offer_price : z.number().optional(),

    delisting_reason : z.string().optional(),
    last_trading_date : z.date().optional(),
    post_delisting_date : z.date().optional(),
    compensation : z.number().optional(),

    filling_date : z.date().optional(),
    bankruptcy_type : z.string().optional(),
    equity_cancelled : z.boolean().optional(),

    parent_company : z.string().optional(),
    spin_ratio : z.number().optional(),
    spin_entity : z.string().optional(),
    new_isin : z.string().optional(),

    subscription_ratio : z.number().optional(),
    subscription_price : z.number().optional(),
    rights_trading_start : z.date().optional(),
    rights_trading_end : z.date().optional(),
    subscription_start : z.date().optional(),
    subscription_end : z.date().optional(),

    buyback_type : z.string().optional(),
    max_shares : z.number().optional(),
    max_amount : z.number().optional(),
    program_start_date : z.date().optional(),
    program_end_date : z.date().optional(),
    cancellation_intent : z.boolean().optional(),

});

export const createEventSchema = eventSchema.omit({
    id: true,
});

export const updateEventSchema = eventSchema.partial();