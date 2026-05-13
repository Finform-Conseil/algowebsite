import { BourseEntity } from "./bourse.entity";
import { SocietyEntity } from "./society.entity";
import { InstrumentEntity } from "./instrument.entity";
import { PriceIndicatorEntity, ShortCoursEntity, TechnicalIndicatorEntity, ValuationRatioEntity } from "./cours.entity";

export interface ActionEntity {
    id: string;
    ticker: string;
    society: SocietyEntity;
    instrument: string;
    bourse: BourseEntity;
    number_of_actions?: number;

    cusip?: string;
    isin?: string;
    sedol?: string;

    last_public_offer_date?: Date;
    last_public_offer_action_number?: number;
    last_public_offer_price?: number;
    lead_manager?: string;
    options_available?: boolean;

    initial_public_offer_date?: Date;
    initial_public_offer_price?: number;
    initial_public_offer_action_given?: number;
    foreign_action_ratio?: number;
    lombard_russian_bond_indicator?: boolean;

    latest_technical_indicator?: TechnicalIndicatorEntity;
    latest_price_metric?: PriceIndicatorEntity;
    latest_valuation_ratio?: ValuationRatioEntity;

    recent_cours?: ShortCoursEntity[];
}