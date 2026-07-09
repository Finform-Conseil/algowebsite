import { z } from "zod";
import { createPrimarySchema, primarySchema, updatePrimarySchema } from "../schemas/primary.schema";
import { QueryParams } from "./pagination.type";

export type PrimaryType = z.infer<typeof primarySchema>;
export type CreatePrimaryType = z.infer<typeof createPrimarySchema>;
export type UpdatePrimaryType = z.infer<typeof updatePrimarySchema>;

export interface PrimaryQueryParams extends QueryParams {
    country?: string;
}