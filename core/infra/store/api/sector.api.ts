import { CreateSectorType, SectorType, UpdateSectorType } from "../../../domain/types/sector.type";
import { PaginatedResponse, QueryParams } from "../../../domain/types/pagination.type";
import { SectorEntity } from "../../../domain/entities/sector.entity";
import api from "./base.api";

export const sectorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSector: builder.mutation<SectorType, CreateSectorType>({
      query: (sector) => ({
        url: "/sectors/",
        method: "POST",
        body: sector,
      }),
      invalidatesTags: (result) => [
        { type: "Sectors", id: "LIST" }
      ],
    }),
    uploadSectors: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/sectors/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Sectors", id: "LIST" }
      ],
    }),
    updateSector: builder.mutation<SectorType, UpdateSectorType & { id: string }>({
      query: ({ id, ...sector }) => ({
        url: `sectors/${id}/`,
        method: "PATCH",
        body: sector,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Sectors", id }],
    }),
    getAllSectors: builder.query<PaginatedResponse<SectorEntity>, QueryParams | void>({
        query: (params) => ({
            url: "sectors",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Sectors" as const, id })),
                { type: "Sectors", id: "LIST" },
                { type: "Sectors", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Sectors", id: "LIST" }],
    }),
    getSectorById: builder.query<SectorType, { id: string }>({
      query: ({ id }) => `/sectors/${id}/`,
    }),
    deleteSector: builder.mutation<void, string>({
      query: (id) => ({
        url: `sectors/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Sectors", id }
      ],
    }),
  }),
  overrideExisting: true,
});