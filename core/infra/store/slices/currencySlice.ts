import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { STATIC_EXCHANGE_RATES } from '@/core/data/exchangeRates';

interface CurrencyState {
    displayCurrency: string;
    rates: Record<string, number>;
    ratesTimestamp: string | null;
    ratesFetched: boolean;
}

const initialState: CurrencyState = {
    displayCurrency: 'USD',
    rates: STATIC_EXCHANGE_RATES,
    ratesTimestamp: null,
    ratesFetched: false,
};

const currencySlice = createSlice({
    name: 'currency',
    initialState,
    reducers: {
        setDisplayCurrency: (state, action: PayloadAction<string>) => {
            state.displayCurrency = action.payload;
        },
        initFromStorage: (state, action: PayloadAction<{ currency: string; rates?: Record<string, number>; timestamp?: string }>) => {
            state.displayCurrency = action.payload.currency;
            if (action.payload.rates) {
                state.rates = { ...STATIC_EXCHANGE_RATES, ...action.payload.rates };
            }
            if (action.payload.timestamp) {
                state.ratesTimestamp = action.payload.timestamp;
                state.ratesFetched = true;
            }
        },
        updateRates: (state, action: PayloadAction<{ rates: Record<string, number>; timestamp: string }>) => {
            state.rates = { ...STATIC_EXCHANGE_RATES, ...action.payload.rates };
            state.ratesTimestamp = action.payload.timestamp;
            state.ratesFetched = true;
        },
    },
});

export const { setDisplayCurrency, initFromStorage, updateRates } = currencySlice.actions;
export const currencyReducer = currencySlice.reducer;
