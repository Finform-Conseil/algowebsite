import { SGOEntity } from "@/core/domain/entities/sgo.entity";
import { CreateSgoType, UpdateSgoType, SgoQueryParams } from "../../../domain/types/sgo.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const sgoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSgo: builder.mutation<SGOEntity, CreateSgoType>({
      query: (sgo) => ({
        url: "/sgos/",
        method: "POST",
        body: sgo,
      }),
      invalidatesTags: () => [
        { type: "Sgos", id: "LIST" }
      ],
    }),
    uploadSgo: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/sgos/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Sgos", id: "LIST" }
      ],
    }),
    updateSgo: builder.mutation<SGOEntity, UpdateSgoType & { id: string }>({
      query: ({ id, ...sgo }) => ({
        url: `sgos/${id}/`,
        method: "PATCH",
        body: sgo,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Sgos", id }],
    }),
    getAllSgos: builder.query<PaginatedResponse<SGOEntity>, SgoQueryParams | void>({
        query: (params) => ({
            url: "sgos",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Sgos" as const, id })),
                { type: "Sgos", id: "LIST" },
                { type: "Sgos", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Sgos", id: "LIST" }],
    }),
    getSgoById: builder.query<SGOEntity, { id: string }>({
      query: ({ id }) => `/sgos/${id}/`,
    }),
    deleteSgo: builder.mutation<void, string>({
      query: (id) => ({
        url: `sgos/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Sgos", id }
      ],
    }),
  }),
  overrideExisting: true,
});
