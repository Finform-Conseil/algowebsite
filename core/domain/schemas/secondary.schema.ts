import { z } from 'zod';

export const secondarySchema = z.object({
    id: z.uuid(),
    primary: z.uuid(),
    timestamp: z.string().optional(),
    price: z.number().optional(),
    opening_yield: z.number().optional(),
    closing_yield: z.number().optional(),
    high_price: z.number().optional(),
    low_price: z.number().optional(),
    traded_yield: z.number().optional(),
    volume_traded: z.number().optional(),
    value_traded: z.number().optional()
});

export const createSecondarySchema = secondarySchema.omit({
    id: true,
});

export const updateSecondarySchema = secondarySchema.partial();