import { z } from "zod";
import { createStatementSchema, statementSchema, updateStatementSchema } from "../schemas/statement.schema";
import { QueryParams } from "./pagination.type";

export type StatementType = z.infer<typeof statementSchema>;
export type CreateStatementType = z.infer<typeof createStatementSchema>;
export type UpdateStatementType = z.infer<typeof updateStatementSchema>;

export interface StatementQueryParams extends QueryParams {
    action?: string;
}