import { IndustryEntity } from "@/core/domain/entities/industry.entity";
import { CreateIndustryType, IndustryType, UpdateIndustryType, IndustryQueryParams } from "../../../domain/types/industry.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const industryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createIndustry: builder.mutation<IndustryType, CreateIndustryType>({
      query: (industry) => ({
        url: "/industries/",
        method: "POST",
        body: industry,
      }),
      invalidatesTags: (result) => [
        { type: "Industries", id: "LIST" }
      ],
    }),
    uploadIndustries: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/industries/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Industries", id: "LIST" }
      ],
    }),
    updateIndustry: builder.mutation<IndustryType, UpdateIndustryType & { id: string }>({
      query: ({ id, ...industry }) => ({
        url: `industries/${id}/`,
        method: "PATCH",
        body: industry,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Industries", id }],
    }),
    getAllIndustries: builder.query<PaginatedResponse<IndustryEntity>, IndustryQueryParams | void>({
        query: (params) => ({
            url: "industries",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Industries" as const, id })),
                { type: "Industries", id: "LIST" },
                { type: "Industries", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Industries", id: "LIST" }],
    }),
    getIndustryById: builder.query<IndustryEntity, { id: string }>({
      query: ({ id }) => `/industries/${id}/`,
    }),
    deleteIndustry: builder.mutation<void, string>({
      query: (id) => ({
        url: `industries/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Industries", id }
      ],
    }),
  }),
  overrideExisting: true,
});


