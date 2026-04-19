import { z } from "zod";
import { createSgoSchema, sgoSchema, updateSgoSchema } from "../schemas/sgo.schema";
import { QueryParams } from "./pagination.type";

export type SgoType = z.infer<typeof sgoSchema>;
export type CreateSgoType = z.infer<typeof createSgoSchema>;
export type UpdateSgoType = z.infer<typeof updateSgoSchema>;

export interface SgoQueryParams extends QueryParams {
    institution?: string;
}