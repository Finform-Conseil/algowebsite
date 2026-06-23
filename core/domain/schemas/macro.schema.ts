import { z } from 'zod';

export const macroSchema = z.object({
    id: z.uuid(),
    country: z.uuid(),
    item: z.uuid().optional().nullable(),
    period: z.uuid().optional().nullable(),
    value: z.number().optional().nullable(),
});

export const createMacroSchema = macroSchema.omit({
    id: true,
});

export const updateMacroSchema = macroSchema.partial();