import { z } from 'zod';

export const currencySchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    slug: z.string(),
    symbol: z.string().min(1, "Symbol is required").max(10, "Symbol must be less than 10 characters"),
    code: z.string().min(1, "Code is required").max(10, "Code must be less than 10 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

export const createCurrencySchema = currencySchema.omit({
    id: true,
    slug: true
});

export const updateCurrencySchema = currencySchema.partial();