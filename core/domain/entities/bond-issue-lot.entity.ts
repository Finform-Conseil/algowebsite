import { BondStatusEnum, BondTypeEnum, PrimaryOperationEnum } from "../enums/primary.enum";

export interface BondIssueLotEntity {
    id?: string | number;
    issue_type?: BondTypeEnum | string;
    issue_type_name?: string;
    operation?: PrimaryOperationEnum | string;
    status?: BondStatusEnum | string;

    security?: string;
    reference?: string;
    tenor?: string;

    quantity_issued?: number;
    auction_reference?: string;
    auction_date?: string;
    settlement_date?: string;
    maturity_date?: string;

    amount_on_offer?: number;
    amount_allocated?: number;
    amount_competitive?: number;
    amount_non_competitive?: number;
    amount_bids_received?: number;
    amount_accepted?: number;
    amount_rejected?: number;

    coverage_rate?: number;
    absorption_rate?: number;
    worst_bid_rate?: number;
    weighted_average_rate?: number;
    weighted_average_effective_rate?: number;

    number_bids_received?: number;

    coupon_rate?: number;
    clearing_yield?: number;
    best_bid?: number;
    worst_bid?: number;

    bid_to_cover_ratio?: number;

    best_allocated_yield?: number;
    worst_allocated_yield?: number;
    best_alloted_yield?: number;
    worst_alloted_yield?: number;
    deferred_repayment?: boolean;
    repayment_periodicity?: boolean;
}
