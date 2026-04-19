import { z } from "zod";
import { industrySchema, createIndustrySchema, updateIndustrySchema } from "../schemas/industry.schema";
import { QueryParams } from "./pagination.type";

export type IndustryType = z.infer<typeof industrySchema>;
export type CreateIndustryType = z.infer<typeof createIndustrySchema>;
export type UpdateIndustryType = z.infer<typeof updateIndustrySchema>;

export interface IndustryQueryParams extends QueryParams {
    sector?: string;
}