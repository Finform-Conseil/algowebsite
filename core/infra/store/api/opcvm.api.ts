import { PaginatedResponse, QueryParams } from "@/core/domain/types/pagination.type";
import { CreateOpcvmMetricType, CreateOpcvmType, OpcvmMetricQueryParams, OpcvmMetricType, OpcvmQueryParams, OpcvmType, UpdateOpcvmMetricType, UpdateOpcvmType } from "@/core/domain/types/opcvm.type";
import api from "./base.api";
import { OPCVMEntity, OPCVMMetricEntity } from "@/core/domain/entities/opcvm.entity";

export const opcvmApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createOpcvm: builder.mutation<OpcvmType, CreateOpcvmType>({
      query: (opcvm) => ({
        url: "/opcvms/",
        method: "POST",
        body: opcvm,
      }),
      invalidatesTags: () => [
        { type: "OPCVMs", id: "LIST" }
      ],
    }),
    uploadOpcvms: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/opcvms/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "OPCVMs", id: "LIST" }
      ],
    }),
    updateOpcvm: builder.mutation<OpcvmType, UpdateOpcvmType & { id: string }>({
      query: ({ id, ...opcvm }) => ({
        url: `opcvms/${id}/`,
        method: "PATCH",
        body: opcvm,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "OPCVMs", id },
        { type: "OPCVMs", id: "LIST" }
      ],
    }),
    getAllOpcvms: builder.query<PaginatedResponse<OPCVMEntity>, QueryParams | void>({
      query: (params) => ({
        url: "opcvms",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "OPCVMs" as const, id })),
              { type: "OPCVMs", id: "LIST" },
              { type: "OPCVMs", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "OPCVMs", id: "LIST" }],
    }),
    getOpcvmById: builder.query<OPCVMEntity, { id: string }>({
      query: ({ id }) => `/opcvms/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "OPCVMs", id }],
    }),
    deleteOpcvm: builder.mutation<void, string>({
      query: (id) => ({
        url: `opcvms/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "OPCVMs", id },
        { type: "OPCVMs", id: "LIST" }
      ],
    }),
  }),
  overrideExisting: true,
});


export const opcvmMetricApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createOpcvmMetric: builder.mutation<OpcvmMetricType, CreateOpcvmMetricType>({
      query: (opcvmMetric) => ({
        url: "/opcvm-metrics/",
        method: "POST",
        body: opcvmMetric,
      }),
      invalidatesTags: () => [
        { type: "OPCVMMetrics", id: "LIST" }
      ],
    }),
    uploadOpcvmMetrics: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/opcvm-metrics/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "OPCVMMetrics", id: "LIST" }
      ],
    }),
    updateOpcvmMetric: builder.mutation<OpcvmMetricType, UpdateOpcvmMetricType & { id: string }>({
      query: ({ id, ...opcvm }) => ({
        url: `opcvm-metrics/${id}/`,
        method: "PATCH",
        body: opcvm,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "OPCVMMetrics", id },
        { type: "OPCVMMetrics", id: "LIST" }
      ],
    }),
    getAllOpcvmMetrics: builder.query<PaginatedResponse<OPCVMMetricEntity>, QueryParams | void>({
      query: (params) => ({
        url: "opcvm-metrics",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "OPCVMMetrics" as const, id })),
              { type: "OPCVMMetrics", id: "LIST" },
              { type: "OPCVMMetrics", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "OPCVMMetrics", id: "LIST" }],
    }),
    getOpcvmMetricById: builder.query<OPCVMMetricEntity, { id: string }>({
      query: ({ id }) => `/opcvm-metrics/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "OPCVMMetrics", id }],
    }),
    deleteOpcvmMetric: builder.mutation<void, string>({
      query: (id) => ({
        url: `opcvm-metrics/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "OPCVMMetrics", id },
        { type: "OPCVMMetrics", id: "LIST" }
      ],
    }),
  }),
  overrideExisting: true,
});
