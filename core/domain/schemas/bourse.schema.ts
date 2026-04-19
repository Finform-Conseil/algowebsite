import { z } from 'zod';

export const bourseSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    currency: z.uuid().optional().nullable(),
    slug: z.string().min(1, "Slug is required").max(100, "Slug must be less than 100 characters"),
    ticker: z.string().min(1, "Ticker is required").max(10, "Ticker must be less than 10 characters"),
    number: z.string().optional(),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

export const createBourseSchema = bourseSchema.omit({
    id: true,
    number: true,
    slug: true,
});

export const updateBourseSchema = bourseSchema.partial();