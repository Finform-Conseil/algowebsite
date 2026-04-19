import { z } from "zod";
import { createIndiceSchema, indiceSchema, updateIndiceSchema } from "../schemas/indice.schema";
import { QueryParams } from "./pagination.type";

export type IndiceType = z.infer<typeof indiceSchema>;
export type CreateIndiceType = z.infer<typeof createIndiceSchema>;
export type UpdateIndiceType = z.infer<typeof updateIndiceSchema>;

export interface IndiceCoursQueryParams extends QueryParams {
    indice?: string;
}