import { SocietyEntity } from "@/core/domain/entities/society.entity";
import { CreateSocietyType, SocietyType, UpdateSocietyType, SocietyQueryParams } from "../../../domain/types/society.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const societyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSociety: builder.mutation<SocietyType, CreateSocietyType>({
      query: (society) => ({
        url: "/societies/",
        method: "POST",
        body: society,
      }),
      invalidatesTags: (result) => [
        { type: "Societies", id: "LIST" }
      ],
    }),
    uploadSocieties: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/societies/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Societies", id: "LIST" }
      ],
    }),
    updateSociety: builder.mutation<SocietyType, UpdateSocietyType & { id: string }>({
      query: ({ id, ...society }) => ({
        url: `societies/${id}/`,
        method: "PATCH",
        body: society,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Societies", id }],
    }),
    getAllSocieties: builder.query<PaginatedResponse<SocietyEntity>, SocietyQueryParams | void>({
        query: (params) => ({
            url: "societies",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Societies" as const, id })),
                { type: "Societies", id: "LIST" },
                { type: "Societies", id: `PAGE-${result.current_page}`},
            ] : [{ type: "Societies", id: "LIST" }],
    }),
    getSocietyById: builder.query<SocietyEntity, { id: string }>({
      query: ({ id }) => `/societies/${id}/`,
    }),
    deleteSociety: builder.mutation<void, string>({
      query: (id) => ({
        url: `societies/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Societies", id }
      ],
    }),
  }),
  overrideExisting: true,
});


