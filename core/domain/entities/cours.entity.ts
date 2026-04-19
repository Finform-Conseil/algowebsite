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