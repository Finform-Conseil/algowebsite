import { SheetEntity } from "@/core/domain/entities/sheet.entity";
import { CreateSheetType, UpdateSheetType, SheetQueryParams } from "../../../domain/types/sheet.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const sheetApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSheet: builder.mutation<SheetEntity, CreateSheetType>({
      query: (sheet) => ({
        url: "/sheets/",
        method: "POST",
        body: sheet,
      }),
      invalidatesTags: () => [
        { type: "Sheets", id: "LIST" }
      ],
    }),
    uploadSheet: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/sheets/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Sheets", id: "LIST" }
      ],
    }),
    updateSheet: builder.mutation<SheetEntity, UpdateSheetType & { id: string }>({
      query: ({ id, ...sheet }) => ({
        url: `sheets/${id}/`,
        method: "PATCH",
        body: sheet,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Sheets", id }],
    }),
    getAllSheets: builder.query<PaginatedResponse<SheetEntity>, SheetQueryParams | void>({
        query: (params) => ({
            url: "sheets",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Sheets" as const, id })),
                { type: "Sheets", id: "LIST" },
                { type: "Sheets", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Sheets", id: "LIST" }],
    }),
    getSheetById: builder.query<SheetEntity, { id: string }>({
      query: ({ id }) => `/sheets/${id}/`,
    }),
    deleteSheet: builder.mutation<void, string>({
      query: (id) => ({
        url: `sheets/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Sheets", id }
      ],
    }),
  }),
  overrideExisting: true,
});
