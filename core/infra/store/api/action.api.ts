import api from "./base.api";
import { ActionType, CreateActionType, UpdateActionType, ActionQueryParams } from "@/core/domain/types/action.type";
import { ActionEntity } from "@/core/domain/entities/action.entity";
import { PaginatedResponse } from "@/core/domain/types/pagination.type";

export const actionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createAction: builder.mutation<ActionType, CreateActionType>({
      query: (action) => ({
        url: "/actions/",
        method: "POST",
        body: action,
      }),
      invalidatesTags: (result) => [
        { type: "Actions", id: "LIST" }
      ],
    }),
    uploadActions: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/actions/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Actions", id: "LIST" }
      ],
    }),
    updateAction: builder.mutation<ActionType, UpdateActionType & { id: string }>({
      query: ({ id, ...action }) => ({
        url: `actions/${id}/`,
        method: "PATCH",
        body: action,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Actions", id }],
    }),
    getAllActions: builder.query<PaginatedResponse<ActionEntity>, ActionQueryParams | void>({
        query: (params) => ({
            url: "actions",
            method: "GET",
            params: params || {},
        }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Actions" as const, id })),
              { type: "Actions", id: "LIST" },
              { type: "Actions", id: `PAGE-${result.current_page}` }
            ]
          : [{ type: "Actions", id: "LIST" }],
    }),
    getActionById: builder.query<ActionEntity, { id: string }>({
      query: ({ id }) => `/actions/${id}/`,
    }),
    getActionByTicker: builder.query<ActionEntity, { ticker: string }>({
      query: ({ ticker }) => `/actions/ticker/?ticker=${ticker}`,
    }),
    deleteAction: builder.mutation<void, string>({
      query: (id) => ({
        url: `actions/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Actions", id }
      ],
    }),
  }),
  overrideExisting: true,
});


