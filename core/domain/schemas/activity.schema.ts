import { z } from 'zod';

export const activitySchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, "Le nom est requis").max(100, "Le nom doit faire moins de 100 caractères"),
    slug: z.string(),
    number: z.string().optional().nullable(),
    sector: z.uuid().optional().nullable(),
    description: z.string().optional().nullable(),
});

export const createActivitySchema = activitySchema.omit({
    id: true,
    slug: true
});

export const updateActivitySchema = activitySchema.partial();