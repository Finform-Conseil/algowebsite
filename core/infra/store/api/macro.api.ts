import { MacroSectorValueEntity, MacroCountryDataEntity } from "@/core/domain/entities/macro.entity";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";
import { CreateMacroType, MacroQueryParams, MacroType, UpdateMacroType } from "@/core/domain/types/macro.type";

export const macroApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createMacro: builder.mutation<MacroType, CreateMacroType>({
      query: (macro) => ({
        url: "/macro/",
        method: "POST",
        body: macro,
      }),
      invalidatesTags: () => [
        { type: "Macros", id: "LIST" }
      ],
    }),
    uploadSectorReal: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/macro/sector-real/values/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Macros", id: "LIST-SectorReal" }
      ],
    }),
    uploadSectorFinances: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/macro/sector-finances/values/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Macros", id: "LIST-SectorFinances" }
      ],
    }),
    uploadSectorForeign: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/macro/sector-foreign/values/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Macros", id: "LIST-SectorForeign" }
      ],
    }),
    uploadSectorMonetary: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/macro/sector-monetary/values/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Macros", id: "LIST-SectorMonetary" }
      ],
    }),
    updateMacro: builder.mutation<MacroType, UpdateMacroType & { id: string }>({
      query: ({ id, ...macro }) => ({
        url: `macro/${id}/`,
        method: "PATCH",
        body: macro,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Macros", id }],
    }),
    getAllSectorReal: builder.query<MacroCountryDataEntity, MacroQueryParams | void>({
        query: (params) => ({
            url: "/macro/sector-real/values/",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) => [{ type: "Macros", id: "LIST-SectorReal" }],
    }),
    getAllSectorForeign: builder.query<MacroCountryDataEntity, MacroQueryParams | void>({
        query: (params) => ({
            url: "/macro/sector-foreign/values/",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) => [{ type: "Macros", id: "LIST-SectorForeign" }],
    }),
    getAllSectorFinances: builder.query<MacroCountryDataEntity, MacroQueryParams | void>({
        query: (params) => ({
            url: "/macro/sector-finances/values/",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) => [{ type: "Macros", id: "LIST-SectorFinances" }],
    }),
    getAllSectorMonetary: builder.query<MacroCountryDataEntity, MacroQueryParams | void>({
        query: (params) => ({
            url: "/macro/sector-monetary/values/",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>[{ type: "Macros", id: "LIST-SectorMonetary" }],
    }),
    getMacroById: builder.query<MacroSectorValueEntity, { id: string }>({
      query: ({ id }) => `macro/${id}/`,
    }),
    deleteMacro: builder.mutation<void, string>({
      query: (id) => ({
        url: `macro/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Macros", id }
      ],
    }),
  }),
  overrideExisting: true,
});
