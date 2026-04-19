import { z } from 'zod';

export const countrySchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, "Le nom est requis").max(100, "Le nom doit faire moins de 100 caractères"),
    slug: z.string(),
    symbol: z.string().min(1, "Le symbole est requis").max(10, "Le symbole doit faire moins de 10 caractères"),
    bourse: z.uuid().optional().nullable(),
    currency: z.uuid().optional().nullable(),
});

export const createCountrySchema = countrySchema.omit({
    id: true,
    slug: true
});

export const updateCountrySchema = countrySchema.partial();