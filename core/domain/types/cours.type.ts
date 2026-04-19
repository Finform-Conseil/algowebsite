import { z } from "zod";
import { coursSchema, createCoursSchema, updateCoursSchema } from "../schemas/cours.schema";
import { QueryParams } from "./pagination.type";

export type CoursType = z.infer<typeof coursSchema>;
export type CreateCoursType = z.infer<typeof createCoursSchema>;
export type UpdateCoursType = z.infer<typeof updateCoursSchema>;

export interface CoursQueryParams extends QueryParams {
    instrument_id?: string;
    ticker?: string;
}