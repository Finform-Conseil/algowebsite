import { z } from "zod";
import { createSecondarySchema, secondarySchema, updateSecondarySchema } from "../schemas/secondary.schema";
import { QueryParams } from "./pagination.type";

export type SecondaryType = z.infer<typeof secondarySchema>;
export type CreateSecondaryType = z.infer<typeof createSecondarySchema>;
export type UpdateSecondaryType = z.infer<typeof updateSecondarySchema>;

export interface SecondaryQueryParams extends QueryParams {
    primary?: string;
}