import { z } from 'zod';

export const industrySchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, "Le nom est requis").max(100, "Le nom doit faire moins de 100 caractères"),
    slug: z.string(),
    code: z.string().min(1, "Le code est requis").max(10, "Le code doit faire moins de 10 caractères"),
    number: z.string().optional().nullable(),
    sector: z.uuid().optional().nullable(),
    description: z.string().optional().nullable(),
});

export const createIndustrySchema = industrySchema.omit({
    id: true,
    slug: true
});

export const updateIndustrySchema = industrySchema.partial();