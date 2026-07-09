import { configureStore } from '@reduxjs/toolkit'
import { api } from './api'
import { currencyReducer } from './slices/currencySlice'

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
        currency: currencyReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production'
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>