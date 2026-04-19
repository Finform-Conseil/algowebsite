import { ResultEntity } from "@/core/domain/entities/result.entity";
import { CreateResultType, UpdateResultType, ResultQueryParams } from "../../../domain/types/result.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const resultApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createResult: builder.mutation<ResultEntity, CreateResultType>({
      query: (result) => ({
        url: "/results/",
        method: "POST",
        body: result,
      }),
      invalidatesTags: () => [
        { type: "Results", id: "LIST" }
      ],
    }),
    uploadResult: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/results/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Results", id: "LIST" }
      ],
    }),
    updateResult: builder.mutation<ResultEntity, UpdateResultType & { id: string }>({
      query: ({ id, ...result }) => ({
        url: `results/${id}/`,
        method: "PATCH",
        body: result,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Results", id }],
    }),
    getAllResults: builder.query<PaginatedResponse<ResultEntity>, ResultQueryParams | void>({
        query: (params) => ({
            url: "results",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Results" as const, id })),
                { type: "Results", id: "LIST" },
                { type: "Results", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Results", id: "LIST" }],
    }),
    getResultById: builder.query<ResultEntity, { id: string }>({
      query: ({ id }) => `/results/${id}/`,
    }),
    deleteResult: builder.mutation<void, string>({
      query: (id) => ({
        url: `results/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Results", id }
      ],
    }),
  }),
  overrideExisting: true,
});
