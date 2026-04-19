import { z } from 'zod';

export const sgoSchema = z.object({
    id: z.uuid(),
    number: z.string().optional(),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    country: z.string().min(1, "Country is required").max(100, "Country must be less than 100 characters"),
    email: z.email("Invalid email").optional(),
    phone: z.string().optional(),
    geographic_address: z.string().optional(),
});

export const createSgoSchema = sgoSchema.omit({
    id: true,
    number: true,
});

export const updateSgoSchema = sgoSchema.partial();