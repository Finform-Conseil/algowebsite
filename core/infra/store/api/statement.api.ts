import { FinancialValueEntity } from "@/core/domain/entities/statement.entity";
import { CreateStatementType, StatementType, UpdateStatementType, StatementQueryParams } from "../../../domain/types/statement.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const statementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createStatement: builder.mutation<StatementType, CreateStatementType>({
      query: (statement) => ({
        url: "/financial-values/",
        method: "POST",
        body: statement,
      }),
      invalidatesTags: () => [
        { type: "Statements", id: "LIST" }
      ],
    }),
    uploadStatement: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/financial-values/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Statements", id: "LIST" }
      ],
    }),
    updateStatement: builder.mutation<StatementType, UpdateStatementType & { id: string }>({
      query: ({ id, ...statement }) => ({
        url: `financial-values/${id}/`,
        method: "PATCH",
        body: statement,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Statements", id }],
    }),
    getAllStatements: builder.query<PaginatedResponse<FinancialValueEntity>, StatementQueryParams | void>({
        query: (params) => ({
            url: "financial-values",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Statements" as const, id })),
                { type: "Statements", id: "LIST" },
                { type: "Statements", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Statements", id: "LIST" }],
    }),
    getStatementById: builder.query<FinancialValueEntity, { id: string }>({
      query: ({ id }) => `/financial-values/${id}/`,
    }),
    deleteStatement: builder.mutation<void, string>({
      query: (id) => ({
        url: `financial-values/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Statements", id }
      ],
    }),
  }),
  overrideExisting: true,
});
