export enum PrimaryOperationEnum {
    NEW_ISSUE = "NEW_ISSUE",
    REOPENING = "REOPENING",
    TAP_SALE = "TAP_SALE",
    SWITCH_IN = "SWITCH_IN",
    SWITCH_OUT = "SWITCH_OUT",
    BUYBACK = "BUYBACK",
}

export enum BondTypeEnum {
    BILL = "BILL",
    BOND = "BOND",
}

export enum CouponTypeEnum {
    FIXED = "FIXED",
    FLOATING = "FLOATING",
    ZERO_COUPON = "ZERO_COUPON",
    INDEXED = "INDEXED",
}

export enum AmortizationMethodEnum {
    BULLET = "BULLET",
    ACD = "ACD",
    AC = "AC",
    NOMINAL_REDUCTION = "NOMINAL_REDUCTION",
    QUANTITY_REDUCTION = "QUANTITY_REDUCTION",
    MIXED = "MIXED",
    CUSTOM = "CUSTOM",
}

export enum BondStatusEnum {
    ANNOUNCED = "ANNOUNCED",
    ACTIVE = "ACTIVE",
    MATURED = "MATURED",
    SUSPENDED = "SUSPENDED",
    CANCELLED = "CANCELLED",
}

export enum BondCashflowStatusEnum {
    FORECAST = "FORECAST",
    CONFIRMED = "CONFIRMED",
    PAID = "PAID",
    CANCELLED = "CANCELLED",
}