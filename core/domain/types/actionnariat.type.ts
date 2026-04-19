import { z } from "zod";
import { createActionnariatSchema, actionnariatSchema, updateActionnariatSchema } from "../schemas/actionnariat.schema";

export type ActionnariatType = z.infer<typeof actionnariatSchema>;
export type CreateActionnariatType = z.infer<typeof createActionnariatSchema>;
export type UpdateActionnariatType = z.infer<typeof updateActionnariatSchema>;
