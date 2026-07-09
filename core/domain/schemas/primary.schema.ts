import { z } from 'zod';
import { PrimaryOperationEnum, BondTypeEnum } from '../enums/primary.enum';

export const primarySchema = z.object({
    id: z.uuid(),
    country: z.uuid(),
    
    instrument: z.uuid().optional(),
    isin: z.string().min(1, "ISIN is required").max(50, "ISIN must be less than 50 characters"),
    tenor: z.string().optional(),
    type: z.enum([
        BondTypeEnum.BILL,
        BondTypeEnum.BOND,
    ]),
    type_name: z.string().optional(),
    operation: z.enum([
        PrimaryOperationEnum.NEW_ISSUE,
        PrimaryOperationEnum.REOPENING,
        PrimaryOperationEnum.TAP_SALE,
        PrimaryOperationEnum.SWITCH_IN,
        PrimaryOperationEnum.SWITCH_OUT,
        PrimaryOperationEnum.BUYBACK,
    ]),

    auction_reference: z.string().optional(),
    auction_date: z.string().optional(),
    settlement_date: z.string().optional(),
    maturity_date: z.string().optional(),

    amount_on_offer: z.number().optional(),
    amount_allocated: z.number().optional(),
    amount_bids_received: z.number().optional(),
    amount_accepted: z.number().optional(),
    amount_rejected: z.number().optional(),

    coverage_rate: z.number().optional(),
    absorption_rate: z.number().optional(),
    worst_bid_rate: z.number().optional(),
    weighted_average_effective_rate: z.number().optional(),

    number_bids_received: z.number().optional(),

    coupon: z.number().optional(),
    clearing_yield: z.number().optional(),
    best_bid: z.number().optional(),
    worst_bid: z.number().optional(),

    bid_to_cover_ratio: z.number().optional(),

    best_alloted_yield: z.number().optional(),
    worst_alloted_yield: z.number().optional(),
    deferred_repayment: z.boolean().optional(),
    repayment_periodicity: z.boolean().optional(),

    annual_coupon: z.number().optional(),
    cashflows: z.any().optional(),
    valorisations: z.any().optional(),
    duration_macaulay: z.any().optional(),

});

export const createPrimarySchema = primarySchema.omit({
    id: true,
});

export const updatePrimarySchema = primarySchema.partial();