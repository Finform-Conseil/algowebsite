import { PaginatedResponse, QueryParams } from "@/core/domain/types/pagination.type";
import { CreateIndiceType, IndiceCoursQueryParams, IndiceType, UpdateIndiceType } from "@/core/domain/types/indice.type";
import api from "./base.api";
import { IndiceCoursEntity, IndiceEntity } from "@/core/domain/entities/indice.entity";

export const indiceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createIndice: builder.mutation<IndiceType, CreateIndiceType>({
      query: (indice) => ({
        url: "/indices/",
        method: "POST",
        body: indice,
      }),
      invalidatesTags: () => [
        { type: "Indices", id: "LIST" }
      ],
    }),
    uploadIndices: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/indices/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Indices", id: "LIST" }
      ],
    }),
    uploadIndicesCours: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/indices/cours-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Indices", id: "LIST" }
      ],
    }),
    updateIndice: builder.mutation<IndiceType, UpdateIndiceType & { id: string }>({
      query: ({ id, ...indice }) => ({
        url: `indices/${id}/`,
        method: "PATCH",
        body: indice,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Indices", id },
        { type: "Indices", id: "LIST" }
      ],
    }),
    getAllIndices: builder.query<PaginatedResponse<IndiceEntity>, QueryParams | void>({
      query: (params) => ({
        url: "indices",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Indices" as const, id })),
              { type: "Indices", id: "LIST" },
              { type: "Indices", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "Indices", id: "LIST" }],
    }),
    getIndicesCoursByIndice: builder.query<PaginatedResponse<IndiceCoursEntity>, IndiceCoursQueryParams>({
      query: ({ indice, ...params }) => ({
        url: `indices/${indice}/cours`,
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "IndiceCours" as const, id })),
              { type: "IndiceCours", id: "LIST" },
              { type: "IndiceCours", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "IndiceCours", id: "LIST" }],
    }),
    getIndiceById: builder.query<IndiceEntity, { id: string }>({
      query: ({ id }) => `/indices/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "Indices", id }],
    }),
    deleteIndice: builder.mutation<void, string>({
      query: (id) => ({
        url: `indices/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Indices", id },
        { type: "Indices", id: "LIST" }
      ],
    }),
  }),
  overrideExisting: true,
});
