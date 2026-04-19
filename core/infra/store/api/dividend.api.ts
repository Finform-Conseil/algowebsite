import { PaginatedResponse, QueryParams } from "@/core/domain/types/pagination.type";
import { CreateDividendType, DividendType, UpdateDividendType } from "@/core/domain/types/dividend.type";
import api from "./base.api";
import { DividendEntity } from "@/core/domain/entities/dividend.entity";

export const dividendApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createDividend: builder.mutation<DividendType, CreateDividendType>({
      query: (dividend) => ({
        url: "/dividends/",
        method: "POST",
        body: dividend,
      }),
      invalidatesTags: () => [
        { type: "Dividends", id: "LIST" }
      ],
    }),
    uploadDividends: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/dividends/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Dividends", id: "LIST" }
      ],
    }),
    updateDividend: builder.mutation<DividendType, UpdateDividendType & { id: string }>({
      query: ({ id, ...dividend }) => ({
        url: `dividends/${id}/`,
        method: "PATCH",
        body: dividend,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Dividends", id },
        { type: "Dividends", id: "LIST" }
      ],
    }),
    getAllDividends: builder.query<PaginatedResponse<DividendEntity>, QueryParams | void>({
      query: (params) => ({
        url: "dividends",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Dividends" as const, id })),
              { type: "Dividends", id: "LIST" },
              { type: "Dividends", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "Dividends", id: "LIST" }],
    }),
    getDividendById: builder.query<DividendEntity, { id: string }>({
      query: ({ id }) => `/dividends/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "Dividends", id }],
    }),
    deleteDividend: builder.mutation<void, string>({
      query: (id) => ({
        url: `dividends/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Dividends", id },
        { type: "Dividends", id: "LIST" }
      ],
    }),
  }),
  overrideExisting: true,
});
