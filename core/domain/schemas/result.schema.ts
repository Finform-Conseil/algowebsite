import { z } from 'zod';

export const resultSchema = z.object({
    id: z.uuid(),
    action: z.uuid().optional(),
    metric: z.uuid().optional(),
    period: z.uuid().optional(),
    value: z.number().optional(),
    perspectives: z.string().optional().nullable(),
});

export const createResultSchema = resultSchema.omit({
    id: true,
});

export const updateResultSchema = resultSchema.partial();