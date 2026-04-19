import { z } from "zod";
import { actionSchema, createActionSchema, updateActionSchema } from "../schemas/action.schema";
import { QueryParams } from "./pagination.type";

export type ActionType = z.infer<typeof actionSchema>;
export type CreateActionType = z.infer<typeof createActionSchema>;
export type UpdateActionType = z.infer<typeof updateActionSchema>;

export interface ActionQueryParams extends QueryParams {
    society?: string;
    country?: string;
    currency?: string;
    bourse?: string;
}