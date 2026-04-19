import { FileEntity } from "@/core/domain/entities/file.entity";
import { CreateFileType, FileQueryParams, UploadFileResponse } from "@/core/domain/types/file.type";
import { PaginatedResponse } from "@/core/domain/types/pagination.type";
import api from "./base.api";

export const fileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UploadFileResponse, FormData>({
      query: (formData) => ({
        url: "/files/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Files", id: "LIST" }
      ],
    }),
    getAllFiles: builder.query<PaginatedResponse<FileEntity>, FileQueryParams | void>({
      query: (params) => ({
        url: "/files/",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Files" as const, id })),
              { type: "Files", id: "LIST" },
            ]
          : [{ type: "Files", id: "LIST" }],
    }),
    getFileById: builder.query<FileEntity, { id: string }>({
      query: ({ id }) => `/files/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "Files", id }],
    }),
    deleteFile: builder.mutation<void, string>({
      query: (id) => ({
        url: `/files/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Files", id },
        { type: "Files", id: "LIST" }
      ],
    }),
  }),
  overrideExisting: true,
});
