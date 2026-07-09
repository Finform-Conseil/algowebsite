import { AmortizationMethodEnum, BondStatusEnum, BondTypeEnum, CouponTypeEnum } from "../enums/primary.enum";
import { BondCashflowEntity } from "./bond-cashflow.entity";
import { BondIssueLotEntity } from "./bond-issue-lot.entity";
import { IssuerEntity } from "./issuer.entity";

export interface PrimaryEntity {
    id?: string;
    updated_at?: string;
    created_at?: string;

    number?: string;
    instrument?: string | null;
    bourse?: string | null;
    isin?: string;
    tenor?: string;
    ticker?: string | null;

    type?: BondTypeEnum | string;
    type_name?: string;
    legal_form?: string;

    issuer?: IssuerEntity | string;
    reference?: string;
    currency?: string;

    coupon_type?: CouponTypeEnum | string;
    coupon_rate?: number | string;
    coupon_frequency?: number;
    full_first_coupon?: boolean;
    payment_day_term?: string;
    coupon_dates?: string;

    day_count_convention?: string;
    is_amortized?: boolean;
    is_differed?: boolean;
    differed_period?: number;
    amortization_method?: AmortizationMethodEnum | string;
    minimum_trade_unit?: number | string;
    initial_unit_nominal?: number | string | null;
    is_fungible?: boolean;
    status?: BondStatusEnum | string;

    cashflows?: BondCashflowEntity[];
    latest_cashflow?: BondCashflowEntity;
    issue_lots?: BondIssueLotEntity[];

}
