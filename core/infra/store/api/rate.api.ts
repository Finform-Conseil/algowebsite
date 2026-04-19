import { RateEntity } from "@/core/domain/entities/rate.entity";
import { CreateRateType, UpdateRateType, RateQueryParams } from "../../../domain/types/rate.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const rateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createRate: builder.mutation<RateEntity, CreateRateType>({
      query: (rate) => ({
        url: "/rates/",
        method: "POST",
        body: rate,
      }),
      invalidatesTags: () => [
        { type: "Rates", id: "LIST" }
      ],
    }),
    uploadRate: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/rates/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Rates", id: "LIST" }
      ],
    }),
    updateRate: builder.mutation<RateEntity, UpdateRateType & { id: string }>({
      query: ({ id, ...sheet }) => ({
        url: `rates/${id}/`,
        method: "PATCH",
        body: sheet,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Rates", id }],
    }),
    getAllRates: builder.query<PaginatedResponse<RateEntity>, RateQueryParams | void>({
        query: (params) => ({
            url: "rates",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Rates" as const, id })),
                { type: "Rates", id: "LIST" },
                { type: "Rates", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Rates", id: "LIST" }],
    }),
    getRateById: builder.query<RateEntity, { id: string }>({
      query: ({ id }) => `/rates/${id}/`,
    }),
    deleteRate: builder.mutation<void, string>({
      query: (id) => ({
        url: `rates/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Rates", id }
      ],
    }),
  }),
  overrideExisting: true,
});
