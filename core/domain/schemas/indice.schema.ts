import { z } from 'zod';

export const indiceSchema = z.object({
    id: z.uuid(),
    number: z.string().optional(),
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    bourse: z.uuid().optional(),
    sector: z.uuid().optional(),
    sectorial_index: z.boolean().optional(),
    global_index: z.boolean().optional(),
    principal_index: z.boolean().optional(),
    description: z.string().optional(),
});

export const createIndiceSchema = indiceSchema.omit({
    id: true,
});

export const updateIndiceSchema = indiceSchema.partial();
