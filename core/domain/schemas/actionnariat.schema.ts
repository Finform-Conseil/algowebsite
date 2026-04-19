import { z } from 'zod';

export const actionnariatSchema = z.object({
    id: z.uuid(),
    action: z.uuid(),
    date: z.date().optional().nullable(),
    owner: z.string().min(1, "Owner is required").max(255, "Owner must be less than 255 characters"),
    percentage: z.number().min(0, "Percentage must be positive").max(100, "Percentage cannot exceed 100"),
    value: z.number().positive("Value must be positive"),
});

export const createActionnariatSchema = actionnariatSchema.omit({
    id: true,
});

export const updateActionnariatSchema = actionnariatSchema.partial();
