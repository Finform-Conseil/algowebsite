import { z } from "zod";
import { createBourseSchema, bourseSchema, updateBourseSchema } from "../schemas/bourse.schema";

export type BourseType = z.infer<typeof bourseSchema>;
export type CreateBourseType = z.infer<typeof createBourseSchema>;
export type UpdateBourseType = z.infer<typeof updateBourseSchema>;