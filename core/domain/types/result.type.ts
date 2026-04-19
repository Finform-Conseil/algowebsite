import { z } from "zod";
import { createResultSchema, resultSchema, updateResultSchema } from "../schemas/result.schema";
import { QueryParams } from "./pagination.type";

export type ResultType = z.infer<typeof resultSchema>;
export type CreateResultType = z.infer<typeof createResultSchema>;
export type UpdateResultType = z.infer<typeof updateResultSchema>;

export interface ResultQueryParams extends QueryParams {
    action?: string;
}