import { PaginatedResponse, QueryParams } from "@/core/domain/types/pagination.type";
import { CreateActionnariatType, ActionnariatType, UpdateActionnariatType } from "@/core/domain/types/actionnariat.type";
import api from "./base.api";
import { ActionnariatEntity } from "@/core/domain/entities/actionnariat.entity";

export const actionnariatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createActionnariat: builder.mutation<ActionnariatType, CreateActionnariatType>({
      query: (actionnariat) => ({
        url: "/actionnariats/",
        method: "POST",
        body: actionnariat,
      }),
      invalidatesTags: () => [
        { type: "Actionnariats", id: "LIST" }
      ],
    }),
    uploadActionnariats: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/actionnariats/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Actionnariats", id: "LIST" }
      ],
    }),
    updateActionnariat: builder.mutation<ActionnariatType, UpdateActionnariatType & { id: string }>({
      query: ({ id, ...actionnariat }) => ({
        url: `actionnariats/${id}/`,
        method: "PATCH",
        body: actionnariat,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Actionnariats", id },
        { type: "Actionnariats", id: "LIST" }
      ],
    }),
    getAllActionnariats: builder.query<PaginatedResponse<ActionnariatEntity>, QueryParams | void>({
      query: (params) => ({
        url: "actionnariats",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Actionnariats" as const, id })),
              { type: "Actionnariats", id: "LIST" },
              { type: "Actionnariats", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "Actionnariats", id: "LIST" }],
    }),
    getActionnariatById: builder.query<ActionnariatEntity, { id: string }>({
      query: ({ id }) => `/actionnariats/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "Actionnariats", id }],
    }),
    deleteActionnariat: builder.mutation<void, string>({
      query: (id) => ({
        url: `actionnariats/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Actionnariats", id },
        { type: "Actionnariats", id: "LIST" }
      ],
    }),
  }),
  overrideExisting: true,
});
