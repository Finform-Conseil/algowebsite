import { z } from "zod";
import { activitySchema, createActivitySchema, updateActivitySchema } from "../schemas/activity.schema";
import { QueryParams } from "./pagination.type";

export type ActivityType = z.infer<typeof activitySchema>;
export type CreateActivityType = z.infer<typeof createActivitySchema>;
export type UpdateActivityType = z.infer<typeof updateActivitySchema>;

export interface ActivityQueryParams extends QueryParams {
    sector?: string;
}