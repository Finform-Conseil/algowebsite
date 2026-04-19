import { z } from "zod";
import { createRateSchema, rateSchema, updateRateSchema } from "../schemas/rate.schema";
import { QueryParams } from "./pagination.type";

export type RateType = z.infer<typeof rateSchema>;
export type CreateRateType = z.infer<typeof createRateSchema>;
export type UpdateRateType = z.infer<typeof updateRateSchema>;

export interface RateQueryParams extends QueryParams {
    country?: string;
}