import { CreateSecondaryType, SecondaryType, UpdateSecondaryType } from "../../../domain/types/secondary.type";
import { PaginatedResponse, QueryParams } from "../../../domain/types/pagination.type";
import { SecondaryEntity } from "../../../domain/entities/secondary.entity";
import api from "./base.api";

export const secondaryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSecondary: builder.mutation<SecondaryType, CreateSecondaryType>({
      query: (secondary) => ({
        url: "/fixed-income/secondary/",
        method: "POST",
        body: secondary,
      }),
      invalidatesTags: () => [
        { type: "Secondary", id: "LIST" }
      ],
    }),
    uploadSecondaries: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/fixed-income/secondary/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Secondary", id: "LIST" }
      ],
    }),
    updateSecondary: builder.mutation<SecondaryType, UpdateSecondaryType & { id: string }>({
      query: ({ id, ...secondary }) => ({
        url: `/fixed-income/secondary/${id}/`,
        method: "PATCH",
        body: secondary,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Secondary", id }],
    }),
    getAllSecondaries: builder.query<PaginatedResponse<SecondaryEntity>, QueryParams | void>({
        query: (params) => ({
            url: "/fixed-income/secondary",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Secondary" as const, id })),
                { type: "Secondary", id: "LIST" },
                { type: "Secondary", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Secondary", id: "LIST" }],
    }),
    getSecondaryById: builder.query<SecondaryType, { id: string }>({
      query: ({ id }) => `/fixed-income/secondary/${id}/`,
    }),
    deleteSecondary: builder.mutation<void, string>({
      query: (id) => ({
        url: `/fixed-income/secondary/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Secondary", id }
      ],
    }),
  }),
  overrideExisting: true,
});