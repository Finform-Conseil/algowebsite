import { PaginatedResponse, QueryParams } from "@/core/domain/types/pagination.type";
import { CreateBourseType, BourseType, UpdateBourseType } from "../../../domain/types/bourse.type";
import api from "./base.api";
import { BourseEntity } from "@/core/domain/entities/bourse.entity";

export const bourseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createBourse: builder.mutation<BourseType, CreateBourseType>({
      query: (bourse) => ({
        url: "/bourses/",
        method: "POST",
        body: bourse,
      }),
      invalidatesTags: (result) => [
        { type: "Bourses", id: "LIST" }
      ],
    }),
    uploadBourses: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/bourses/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Bourses", id: "LIST" }
      ],
    }),
    updateBourse: builder.mutation<BourseType, UpdateBourseType & { id: string }>({
      query: ({ id, ...bourse }) => ({
        url: `bourses/${id}/`,
        method: "PATCH",
        body: bourse,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Bourses", id }],
    }),
    getAllBourses: builder.query<PaginatedResponse<BourseEntity>, QueryParams | void>({
        query: (params) => ({
            url: "bourses",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Bourses" as const, id })),
                { type: "Bourses", id: "LIST" },
                { type: "Bourses", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Bourses", id: "LIST" }],
    }),
    getBourseById: builder.query<BourseEntity, { id: string }>({
      query: ({ id }) => `/bourses/${id}/`,
    }),
    deleteBourse: builder.mutation<void, string>({
      query: (id) => ({
        url: `bourses/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Bourses", id }
      ],
    }),
  }),
  overrideExisting: true,
});