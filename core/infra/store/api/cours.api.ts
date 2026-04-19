import { CoursEntity } from "@/core/domain/entities/cours.entity";
import { CreateCoursType, CoursType, UpdateCoursType, CoursQueryParams } from "../../../domain/types/cours.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export interface CoursUploadResponse {
  job_id: string;
  task_id: string;
  status: string;
  instrument_type: string;
  timeframe: string;
  timeframe_display: string;
  message: string;
  filename: string;
  file_size: number;
}

export const coursApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createCours: builder.mutation<CoursType, CreateCoursType>({
      query: (cours) => ({
        url: "/cours/",
        method: "POST",
        body: cours,
      }),
      invalidatesTags: (result) => [
        { type: "Cours", id: "LIST" }
      ],
    }),
    uploadCours: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/cours-imports/upload/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Cours", id: "LIST" }
      ],
    }),
    updateCours: builder.mutation<CoursType, UpdateCoursType & { id: string }>({
      query: ({ id, ...cours }) => ({
        url: `cours/${id}/`,
        method: "PATCH",
        body: cours,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Cours", id }],
    }),
    getAllCours: builder.query<PaginatedResponse<CoursEntity>, CoursQueryParams | void>({
        query: (params) => ({
            url: "cours",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Cours" as const, id })),
                { type: "Cours", id: "LIST" },
                { type: "Cours", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Cours", id: "LIST" }],
    }),
    getCoursById: builder.query<CoursEntity, { id: string }>({
      query: ({ id }) => `/cours/${id}/`,
    }),
    deleteCours: builder.mutation<void, string>({
      query: (id) => ({
        url: `cours/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Cours", id }
      ],
    }),
  }),
  overrideExisting: true,
});
