import { z } from "zod";
import { createBourseSchema, bourseSchema, updateBourseSchema } from "../schemas/bourse.schema";
import { QueryParams } from "./pagination.type";

export type BourseType = z.infer<typeof bourseSchema>;
export type CreateBourseType = z.infer<typeof createBourseSchema>;
export type UpdateBourseType = z.infer<typeof updateBourseSchema>;


export interface BourseQueryParams extends QueryParams {
    view_type?: string;
}