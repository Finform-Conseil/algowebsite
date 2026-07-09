import { CreatePrimaryType, PrimaryType, UpdatePrimaryType } from "../../../domain/types/primary.type";
import { PaginatedResponse, QueryParams } from "../../../domain/types/pagination.type";
import { PrimaryEntity } from "../../../domain/entities/primary.entity";
import api from "./base.api";
import { BondCashflowEntity } from "@/core/domain/entities/bond-cashflow.entity";

export const primaryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPrimary: builder.mutation<PrimaryType, CreatePrimaryType>({
      query: (primary) => ({
        url: "/fixed-income/bond-securities/",
        method: "POST",
        body: primary,
      }),
      invalidatesTags: () => [
        { type: "Primary", id: "LIST" }
      ],
    }),
    uploadPrimaries: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/fixed-income/bond-securities/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Primary", id: "LIST" }
      ],
    }),
    updatePrimary: builder.mutation<PrimaryType, UpdatePrimaryType & { id: string }>({
      query: ({ id, ...primary }) => ({
        url: `/fixed-income/bond-securities/${id}/`,
        method: "PATCH",
        body: primary,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Primary", id }],
    }),
    getAllPrimaries: builder.query<PaginatedResponse<PrimaryEntity>, QueryParams | void>({
        query: (params) => ({
            url: "/fixed-income/bond-securities",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Primary" as const, id })),
                { type: "Primary", id: "LIST" },
                { type: "Primary", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Primary", id: "LIST" }],
    }),
    getPrimaryById: builder.query<PrimaryType, { id: string }>({
      query: ({ id }) => `/fixed-income/bond-securities/${id}/`,
    }),
    getBondCashflowsBySecurity: builder.query<PaginatedResponse<BondCashflowEntity>, QueryParams & { security: string }>({
        query: (params) => ({
            url: "/fixed-income/bond-cashflows/",
            method: "GET",
            params,
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "BondCashflow" as const, id })),
                { type: "BondCashflow", id: "LIST" },
                { type: "BondCashflow", id: `PAGE-${result.current_page}` },
            ] : [{ type: "BondCashflow", id: "LIST" }],
    }),
    deletePrimary: builder.mutation<void, string>({
      query: (id) => ({
        url: `/fixed-income/bond-securities/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Primary", id }
      ],
    }),
  }),
  overrideExisting: true,
});


