import { z } from "zod";
import { createSheetSchema, sheetSchema, updateSheetSchema } from "../schemas/sheet.schema";
import { QueryParams } from "./pagination.type";

export type SheetType = z.infer<typeof sheetSchema>;
export type CreateSheetType = z.infer<typeof createSheetSchema>;
export type UpdateSheetType = z.infer<typeof updateSheetSchema>;

export interface SheetQueryParams extends QueryParams {
    action?: string;
}