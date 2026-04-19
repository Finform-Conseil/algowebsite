import { z } from "zod";
import { createSocietySchema, societySchema, updateSocietySchema } from "../schemas/society.schema";
import { QueryParams } from "./pagination.type";

export type SocietyType = z.infer<typeof societySchema>;
export type CreateSocietyType = z.infer<typeof createSocietySchema>;
export type UpdateSocietyType = z.infer<typeof updateSocietySchema>;

export interface SocietyQueryParams extends QueryParams {
    parent?: string;
    industry?: string;
}