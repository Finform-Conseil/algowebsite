import { CreateCurrencyType, CurrencyType, UpdateCurrencyType } from "../../../domain/types/currency.type";
import { PaginatedResponse, QueryParams } from "../../../domain/types/pagination.type";
import { CurrencyEntity } from "../../../domain/entities/currency.entity";
import api from "./base.api";

export const currencyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createCurrency: builder.mutation<CurrencyType, CreateCurrencyType>({
      query: (currency) => ({
        url: "/currencies/",
        method: "POST",
        body: currency,
      }),
      invalidatesTags: (result) => [
        { type: "Currencies", id: "LIST" }
      ],
    }),
    uploadCurrencies: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/currencies/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Currencies", id: "LIST" }
      ],
    }),
    updateCurrency: builder.mutation<CurrencyType, UpdateCurrencyType & { id: string }>({
      query: ({ id, ...currency }) => ({
        url: `currencies/${id}/`,
        method: "PATCH",
        body: currency,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Currencies", id }],
    }),
    getAllCurrencies: builder.query<PaginatedResponse<CurrencyEntity>, QueryParams | void>({
        query: (params) => ({
            url: "currencies",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Currencies" as const, id })),
                { type: "Currencies", id: "LIST" },
                { type: "Currencies", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Currencies", id: "LIST" }],
    }),
    getCurrencyById: builder.query<CurrencyType, { id: string }>({
      query: ({ id }) => `/currencies/${id}/`,
    }),
    deleteCurrency: builder.mutation<void, string>({
      query: (id) => ({
        url: `currencies/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Currencies", id }
      ],
    }),
  }),
  overrideExisting: true,
});


