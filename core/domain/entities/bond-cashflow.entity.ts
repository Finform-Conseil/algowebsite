import { BondCashflowStatusEnum } from "../enums/primary.enum";

export interface BondCashflowEntity {
    id?: string;
    security?: string;
    timestamp?: string;
    is_payment_date?: boolean;
    coupon_rate?: number;
    amortization?: number;
    redemption?: number;
    total_cashflow?: number;

    valorization?: number | string;
    z_spread?: number | string;
    economic_value_plus_100bps?: number;
    economic_value_minus_100bps?: number;
    economic_value_steepening_shock?: number;
    economic_value_flattening_shock?: number;
    economic_value_short_rates_shock_up?: number;
    economic_value_short_rates_shock_down?: number;

    duration_macaulay?: number;
    duration_modigliani?: number;
    duration_encours?: number;

    outstanding_nominal?: number;
    accrued_interest?: number;
    dirty_price?: number | string;
    clean_price?: number | string;
    dv01?: number;
    convexity?: number;

    status?: BondCashflowStatusEnum;
}
