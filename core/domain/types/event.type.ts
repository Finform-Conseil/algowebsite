import { z } from "zod";
import { createEventSchema, eventSchema, updateEventSchema } from "../schemas/event.schema";
import { QueryParams } from "./pagination.type";

export type EventType = z.infer<typeof eventSchema>;
export type CreateEventType = z.infer<typeof createEventSchema>;
export type UpdateEventType = z.infer<typeof updateEventSchema>;

export interface EventQueryParams extends QueryParams {
    action?: string;
}