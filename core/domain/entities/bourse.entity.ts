import { CurrencyEntity } from "./currency.entity";
import { OPCVMEntity } from "./opcvm.entity";

export interface TopSectorData {
    id: string;
    name: string;
    societies_count: number;
}

export interface PrincipalIndexData {
    id: string;
    number: string;
    name: string;
    slug: string;
    close: number | null;
    change_1d_pct: number | null;
    change_1y_pct: number | null;
    change_3y_pct: number | null;
    change_ytd_pct: number | null;
    monthly_performances: (number | null)[];
}

export interface BourseEntity {
    id?: string;
    number?: string;
    name: string;
    slug: string;
    ticker: string;
    currency?: CurrencyEntity;
    description: string;

    opcvm_count?: number;
    best_performing_opcvm?: OPCVMEntity;
    exchange_ticker?: string;
    
    // Treemap data
    total_market_cap?: number;
    total_change_pct?: number;
    top_stocks?: {
        ticker: string;
        company_name: string;
        market_cap: number;
        change_pct: number;
    }[];

    // Comparison data
    total_volume?: number;
    total_societies_count?: number;
    liquidity_score?: number | null;
    growth_score?: number | null;
    dynamism_score?: number | null;
    principal_index?: PrincipalIndexData | null;
    top_sectors?: TopSectorData[];
}