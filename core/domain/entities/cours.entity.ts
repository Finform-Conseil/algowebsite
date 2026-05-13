import { InstrumentEntity } from "./instrument.entity";

export interface CoursEntity {
    id: string;
    instrument: InstrumentEntity;
    timestamp: string;
    timeframe: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;

    number_of_trades: number;
    total_trades_value: number;
    quantite_residuelle_put : number;
    quantite_residuelle_call : number;
    put : number;
    call : number;
    reference : number;
    residual_value : number;
    treatment_delay : number;
}

export interface ShortCoursEntity {
    timestamp: string;
    close: number;
}


export interface TechnicalIndicatorEntity {
    timeframe : number;
    timestamp : string;
    
    sma_5                       : number | null;
    sma_10                      : number | null;
    sma_20                      : number | null;
    sma_50                      : number | null;
    sma_100                     : number | null;
    sma_150                     : number | null;
    sma_200                     : number | null;
    price_vs_sma20_pct          : number | null;
    price_vs_sma50_pct          : number | null;
    price_vs_sma150_pct         : number | null;
    price_vs_sma200_pct         : number | null;

    ema_5                       : number | null;
    ema_9                       : number | null;
    ema_12                      : number | null;
    ema_20                      : number | null;
    ema_26                      : number | null;
    ema_50                      : number | null;
    ema_100                     : number | null;
    ema_200                     : number | null;
    price_vs_ema20_pct          : number | null;
    price_vs_ema50_pct          : number | null;
    price_vs_ema200_pct         : number | null;

    wma_20                      : number | null;
    wma_50                      : number | null;
    dema_20                     : number | null;
    dema_50                     : number | null;
    tema_20                     : number | null;
    tema_50                     : number | null;
    hma_20                      : number | null;
    hma_50                      : number | null;
    vwma_20                     : number | null;
    alma_20                     : number | null;
    kama_20                     : number | null;
    zlema_20                    : number | null;
    smma_20                     : number | null;

    macd_line                   : number | null;
    macd_signal                 : number | null;
    macd_histogram              : number | null;
    macd_ppo                    : number | null;
    macd_apo                    : number | null;

    parabolic_sar               : number | null;
    parabolic_sar_signal        : number | null;

    ichimoku_tenkan             : number | null;
    ichimoku_kijun              : number | null;
    ichimoku_senkou_a           : number | null;
    ichimoku_senkou_b           : number | null;
    ichimoku_chikou             : number | null;
    ichimoku_cloud_color        : number | null;
    price_vs_cloud              : number | null;

    adx                         : number | null;
    adx_plus_di                 : number | null;
    adx_minus_di                : number | null;
    adx_trend_strength          : string;

    aroon_up                    : number | null;
    aroon_down                  : number | null;
    aroon_oscillator            : number | null;

    supertrend                  : number | null;
    supertrend_signal           : number | null;

    vortex_plus                 : number | null;
    vortex_minus                : number | null;
    trix                        : number | null;
    kst                         : number | null;
    kst_signal                  : number | null;
    stc                         : number | null;
    mass_index                  : number | null;
    linear_reg_slope            : number | null;
    linear_reg_value            : number | null;

    rsi_9                       : number | null;
    rsi_14                      : number | null;
    rsi_25                      : number | null;

    stoch_k                     : number | null;
    stoch_d                     : number | null;
    stoch_rsi_k                 : number | null;
    stoch_rsi_d                 : number | null;

    cci_14                      : number | null;
    cci_20                      : number | null;
    williams_r                  : number | null;
    mfi_14                      : number | null;
    roc_10                      : number | null;
    roc_20                      : number | null;
    momentum_10                 : number | null;
    momentum_20                 : number | null;
    
    cmo_14                      : number | null;
    dpo_20                      : number | null;
    tsi                         : number | null;
    tsi_signal                  : number | null;
    ultimate_osc                : number | null;
    awesome_osc                 : number | null;
    ac_osc                      : number | null;
    rvi                         : number | null;
    rvi_signal                  : number | null;
    fisher_transform            : number | null;
    fisher_transform_signal     : number | null;
    coppock_curve               : number | null;
    elder_bull_power            : number | null;
    elder_bear_power            : number | null;
    dymi                        : number | null;

    bb_upper                    : number | null;
    bb_middle                   : number | null;
    bb_lower                    : number | null;
    bb_width                    : number | null;
    bb_pct                      : number | null;

    atr_14                      : number | null;
    atr_20                      : number | null;
    natr_14                     : number | null;
    keltner_upper               : number | null;
    keltner_lower               : number | null;
    donchian_upper              : number | null;
    donchian_middle             : number | null;
    donchian_lower              : number | null;
    hv_10                       : number | null;
    hv_20                       : number | null;
    hv_30                       : number | null;
    hv_60                       : number | null;
    hv_90                       : number | null;
    hv_252                      : number | null;
    std_dev_20                  : number | null;
    
    chaikin_vol                 : number | null;
    ulcer_index                 : number | null;

    obv                         : number | null;
    ad_line                     : number | null;
    cmf_20                      : number | null;
    chaikin_osc                 : number | null;
    force_index_13              : number | null;
    eom_14                      : number | null;
    nvi                         : number | null;
    pvi                         : number | null;
    volume_osc                  : number | null;
    vroc_14                     : number | null;
    klinger_osc                 : number | null;
    klinger_signal              : number | null;
    elder_force_index           : number | null;

    vp_poc                      : number | null;
    vp_vah                      : number | null;
    vp_val                      : number | null;

    pivot_standard              : number | null;
    pivot_r1                    : number | null;
    pivot_r2                    : number | null;
    pivot_r3                    : number | null;
    pivot_s1                    : number | null;
    pivot_s2                    : number | null;
    pivot_s3                    : number | null;
    pivot_fib_r1                : number | null;
    pivot_fib_r2                : number | null;
    pivot_fib_s1                : number | null;
    pivot_fib_s2                : number | null;

    pattern_doji                : boolean | null;
    pattern_doji_dragonfly      : boolean | null;
    pattern_doji_gravestone     : boolean | null;
    pattern_doji_longleg        : boolean | null;
    pattern_hammer              : boolean | null;
    pattern_hanging_man         : boolean | null;
    pattern_inv_hammer          : boolean | null;
    pattern_shooting_star       : boolean | null;
    pattern_marubozu_bull       : boolean | null;
    pattern_marubozu_bear       : boolean | null;
    pattern_spinning_top        : boolean | null;
    pattern_engulfing_bull      : boolean | null;
    pattern_engulfing_bear      : boolean | null;
    pattern_harami_bull         : boolean | null;
    pattern_harami_bear         : boolean | null;
    pattern_tweezer_top         : boolean | null;
    pattern_tweezer_bottom      : boolean | null;
    pattern_dark_cloud_cover    : boolean | null;
    pattern_piercing_line       : boolean | null;
    pattern_kicker_bull         : boolean | null;
    pattern_kicker_bear         : boolean | null;
    pattern_morning_star        : boolean | null;
    pattern_evening_star        : boolean | null;
    pattern_3_white_soldiers    : boolean | null;
    pattern_3_black_crows       : boolean | null;
    pattern_3_inside_up         : boolean | null;
    pattern_3_inside_down       : boolean | null;
    pattern_abandoned_baby_bull : boolean | null;
    pattern_abandoned_baby_bear : boolean | null;
    
    pattern_tristar             : boolean | null;
    pattern_belthold_bull       : boolean | null;
    pattern_belthold_bear       : boolean | null;
    pattern_breakaway_bull      : boolean | null;
    pattern_breakaway_bear      : boolean | null;
    pattern_concealing_baby_swallow : boolean | null;
    pattern_counterattack       : boolean | null;
    pattern_gap_side_side_white : boolean | null;
    pattern_hikkake             : boolean | null;
    pattern_ladder_bottom       : boolean | null;
    pattern_mat_hold            : boolean | null;
    pattern_rickshaw_man        : boolean | null;
    pattern_rising_three_methods : boolean | null;
    pattern_falling_three_methods : boolean | null;
    pattern_separating_lines    : boolean | null;
    pattern_stick_sandwich      : boolean | null;
    pattern_takuri              : boolean | null;
    pattern_tasuki_gap          : boolean | null;
    pattern_thrusting           : boolean | null;
    pattern_unique_3_river      : boolean | null;
    pattern_upside_gap_two_crows: boolean | null;

    golden_cross                : boolean | null;
    death_cross                 : boolean | null;
    is_above_sma50              : boolean | null;
    is_above_sma200             : boolean | null;
    is_above_ema20              : boolean | null;
    is_above_vwap               : boolean | null;
    is_52w_high                 : boolean | null;
    is_52w_low                  : boolean | null;
    is_ath                      : boolean | null;
    is_atl                      : boolean | null;
    breakout_resistance         : boolean | null;
    breakdown_support           : boolean | null;
    gap_up                      : boolean | null;
    gap_down                    : boolean | null;
    gap_pct                     : number | null;
    consecutive_up_days         : number | null;
    consecutive_down_days       : number | null;
    inside_bar                  : boolean | null;
    outside_bar                 : boolean | null;

}


export interface PriceIndicatorEntity {
    timestamp                   : string | null;
    
    price                       : number | null;
    open                        : number | null;
    prev_close                  : number | null;
    high_52w                    : number | null;
    low_52w                     : number | null;

    change_1d_pct               : number | null;
    change_vs_open_pct          : number | null;
    gap_pct                     : number | null;

    volume                      : number | null;
    volume_currency             : number | null;
    vol_avg_5d                  : number | null;
    vol_avg_10d                 : number | null;
    vol_avg_20d                 : number | null;
    vol_avg_50d                 : number | null;
    vol_relative                : number | null;

    change_1w_pct               : number | null;
    change_1m_pct               : number | null;
    change_3m_pct               : number | null;
    change_6m_pct               : number | null;
    change_ytd_pct              : number | null;
    change_1y_pct               : number | null;
    change_3y_pct               : number | null;
    change_5y_pct               : number | null;
    change_10y_pct              : number | null;
    change_15y_pct              : number | null;
    change_20y_pct              : number | null;

    total_return_1w_pct         : number | null;
    total_return_1m_pct         : number | null;
    total_return_3m_pct         : number | null;
    total_return_6m_pct         : number | null;
    total_return_ytd_pct        : number | null;
    total_return_1y_pct         : number | null;
    total_return_3y_pct         : number | null;
    total_return_5y_pct         : number | null;
    total_return_10y_pct        : number | null;
    total_return_15y_pct        : number | null;
    total_return_20y_pct        : number | null;

    cagr_1y                     : number | null;
    cagr_3y                     : number | null;
    cagr_5y                     : number | null;
    cagr_10y                    : number | null;
    cagr_15y                    : number | null;
    cagr_20y                    : number | null;

    ath                         : number | null;
    atl                         : number | null;
    ath_date                    : Date | null;
    atl_date                    : Date | null;
    ath_change_pct              : number | null;
    atl_change_pct              : number | null;
    change_52w_high_pct         : number | null;
    change_52w_low_pct          : number | null;


}


export interface ValuationRatioEntity {
   timestamp                   : string | null;

    market_cap                  : number | null;
    enterprise_value            : number | null;
    shares_outstanding          : number | null;
    float_shares                : number | null;
    shares_change_qoq           : number | null;
    shares_change_yoy           : number | null;

    pe_ttm                      : number | null;
    pe_forward                  : number | null;
    pe_avg_3y                   : number | null;
    pe_avg_5y                   : number | null;
    pe_avg_10y                  : number | null;
    ps_ratio                    : number | null;
    pb_ratio                    : number | null;
    p_tbv                       : number | null;
    peg_ratio                   : number | null;
    p_ocf                       : number | null;
    p_fcf                       : number | null;
    p_ebitda                    : number | null;
    earnings_yield              : number | null;
    fcf_yield_ev                : number | null;

    ev_revenue                  : number | null;
    ev_ebit                     : number | null;
    ev_ebitda                   : number | null;
    ev_fcf                      : number | null;
    ev_earnings                 : number | null;

    dividend_yield              : number | null;
    dividend_growth_3y          : number | null;
    dividend_growth_5y          : number | null;
    dividend_growth_10y         : number | null;
    payout_ratio                : number | null;
    buyback_yield               : number | null;
    shareholder_yield           : number | null;

    revenue_growth_q            : number | null;
    revenue_growth_yoy          : number | null;
    revenue_growth_3y           : number | null;
    revenue_growth_5y           : number | null;
    revenue_growth_qtrs         : number | null;
    revenue_growth_yrs          : number | null;

    net_income_growth_q         : number | null;
    net_income_growth_yoy       : number | null;
    net_income_growth_3y        : number | null;
    net_income_growth_5y        : number | null;
    net_income_growth_qtrs      : number | null;
    net_income_growth_yrs       : number | null;

    eps_growth_q                : number | null;
    eps_growth_yoy              : number | null;
    eps_growth_3y               : number | null;
    eps_growth_5y               : number | null;
    eps_growth_qtrs             : number | null;
    eps_growth_yrs              : number | null;

    gross_profit_growth_q       : number | null;
    gross_profit_growth_yoy     : number | null;
    gross_profit_growth_3y      : number | null;
    gross_profit_growth_5y      : number | null;
    gross_profit_growth_yrs     : number | null;

    op_income_growth_q          : number | null;
    op_income_growth_yoy        : number | null;
    op_income_growth_3y         : number | null;
    op_income_growth_5y         : number | null;
    op_income_growth_yrs        : number | null;

    fcf_growth_q                : number | null;
    fcf_growth_yoy              : number | null;
    fcf_growth_3y               : number | null;
    fcf_growth_5y               : number | null;
    fcf_growth_yrs              : number | null;

    debt_growth_qoq             : number | null;
    debt_growth_yoy             : number | null;
    debt_growth_3y              : number | null;
    debt_growth_5y              : number | null;
    debt_growth_yrs             : number | null;

    gross_margin                : number | null;
    operating_margin            : number | null;
    ebit_margin                 : number | null;
    ebitda_margin               : number | null;
    pretax_margin               : number | null;
    net_margin                  : number | null;
    fcf_margin                  : number | null;
    rd_over_revenue             : number | null;
    sbc_over_revenue            : number | null;

    roe                         : number | null;
    roa                         : number | null;
    roc                         : number | null;
    roce                        : number | null;
    roic                        : number | null;
    roe_5y                      : number | null;
    roa_5y                      : number | null;
    roc_5y                      : number | null;
    revenue_per_employee        : number | null;
    profits_per_employee        : number | null;

    current_ratio               : number | null;
    quick_ratio                 : number | null;
    debt_equity                 : number | null;
    debt_ebitda                 : number | null;
    debt_fcf                    : number | null;
    interest_coverage           : number | null;
    net_cash_growth             : number | null;
    cash_over_market_cap        : number | null;
    asset_turnover              : number | null;
    inventory_turnover          : number | null;

    piotroski_score             : number | null;
    altman_z_score              : number | null;
    graham_number               : number | null;
    graham_upside               : number | null;
    lynch_fair_value            : number | null;
    lynch_upside                : number | null;

    beta_5y                     : number | null;
    sharpe_ratio                : number | null;
    sortino_ratio               : number | null;
    treynor_ratio               : number | null;
    alpha_1y                    : number | null;
    information_ratio           : number | null;

    rs_vs_sector_1m             : number | null;
    rs_vs_sector_3m             : number | null;
    rs_vs_index_1m              : number | null;
    rs_vs_index_3m              : number | null;
    rs_rating                   : number | null;
    rs_mansfield                : number | null;
    percentile_52w              : number | null;

    p_ffo                       : number | null;

    effective_tax_rate          : number | null;
    tax_over_revenue            : number | null;

}