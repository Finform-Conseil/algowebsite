import { DocumentEntity, DocumentVersionEntity, DocumentCommentEntity } from "@/core/domain/entities/document.entity";
import { CreateDocumentType, UpdateDocumentType, DocumentQueryParams, AutoSavePayload, CreateCommentType } from "../../../domain/types/document.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createDocument: builder.mutation<DocumentEntity, CreateDocumentType>({
      query: (document) => ({
        url: "/documents/",
        method: "POST",
        body: document,
      }),
      invalidatesTags: () => [
        { type: "Documents", id: "LIST" }
      ],
    }),
    updateDocument: builder.mutation<DocumentEntity, UpdateDocumentType & { id: string }>({
      query: ({ id, ...document }) => ({
        url: `documents/${id}/`,
        method: "PATCH",
        body: document,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Documents", id },
        { type: "Documents", id: "LIST" }
      ],
    }),
    autoSaveDocument: builder.mutation<{ status: string }, AutoSavePayload & { id: string }>({
      query: ({ id, ...payload }) => ({
        url: `documents/${id}/autosave/`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Documents", id }
      ],
    }),
    getAllDocuments: builder.query<PaginatedResponse<DocumentEntity>, DocumentQueryParams | void>({
      query: (params) => ({
        url: "documents",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Documents" as const, id })),
              { type: "Documents", id: "LIST" },
              { type: "Documents", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "Documents", id: "LIST" }],
    }),
    getDocumentById: builder.query<DocumentEntity, { id: string }>({
      query: ({ id }) => `/documents/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "Documents", id }],
    }),
    deleteDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `documents/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Documents", id },
        { type: "Documents", id: "LIST" }
      ],
    }),
    duplicateDocument: builder.mutation<DocumentEntity, string>({
      query: (id) => ({
        url: `documents/${id}/duplicate/`,
        method: "POST",
      }),
      invalidatesTags: () => [
        { type: "Documents", id: "LIST" }
      ],
    }),
    publishDocument: builder.mutation<DocumentEntity, string>({
      query: (id) => ({
        url: `documents/${id}/publish/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Documents", id },
        { type: "Documents", id: "LIST" }
      ],
    }),
    getDocumentVersions: builder.query<DocumentVersionEntity[], { id: string }>({
      query: ({ id }) => `/documents/${id}/versions/`,
      providesTags: (result, error, { id }) => [
        { type: "Documents", id: `${id}-versions` }
      ],
    }),
    uploadImage: builder.mutation<{ image_url: string }, FormData>({
      query: (formData) => ({
        url: "/upload-image/",
        method: "POST",
        body: formData,
      }),
    }),
    createComment: builder.mutation<DocumentCommentEntity, CreateCommentType>({
      query: (comment) => ({
        url: "/comments/",
        method: "POST",
        body: comment,
      }),
      invalidatesTags: (result, error, { document_id }) => [
        { type: "Documents", id: `${document_id}-comments` }
      ],
    }),
    getDocumentComments: builder.query<DocumentCommentEntity[], { document_id: string }>({
      query: ({ document_id }) => `/documents/${document_id}/comments/`,
      providesTags: (result, error, { document_id }) => [
        { type: "Documents", id: `${document_id}-comments` }
      ],
    }),
  }),
  overrideExisting: true,
});
