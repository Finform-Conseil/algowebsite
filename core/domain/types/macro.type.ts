import { z } from "zod";
import { QueryParams } from "./pagination.type";
import { createMacroSchema, macroSchema, updateMacroSchema } from "../schemas/macro.schema";

export type MacroType = z.infer<typeof macroSchema>;
export type CreateMacroType = z.infer<typeof createMacroSchema>;
export type UpdateMacroType = z.infer<typeof updateMacroSchema>;

export interface MacroQueryParams extends QueryParams {
    country?: string;
    item?: string;
    period?: string;
}