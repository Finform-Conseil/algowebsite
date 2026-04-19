import { z } from 'zod';

export const sectorSchema = z.object({
    id: z.uuid(),
    number: z.string().optional(),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    slug: z.string(),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

export const createSectorSchema = sectorSchema.omit({
    id: true,
    number: true,
    slug: true
});

export const updateSectorSchema = sectorSchema.partial();