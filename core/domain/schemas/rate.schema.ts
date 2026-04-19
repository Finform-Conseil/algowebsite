import { z } from 'zod';

export const rateSchema = z.object({
    id: z.uuid(),
    country: z.uuid().optional(),
    timestamp: z.string(),
    one_month: z.number().optional(),
    two_months: z.number().optional(),
    three_months: z.number().optional(),
    six_months: z.number().optional(),
    nine_months: z.number().optional(),
    one_year: z.number().optional(),
    two_years: z.number().optional(),
    three_years: z.number().optional(),
    four_years: z.number().optional(),
    five_years: z.number().optional(),
    six_years: z.number().optional(),
    seven_years: z.number().optional(),
    eight_years: z.number().optional(),
    nine_years: z.number().optional(),
    ten_years: z.number().optional(),
    eleven_years: z.number().optional(),
    twelve_years: z.number().optional(),
    thirteen_years: z.number().optional(),
    fourteen_years: z.number().optional(),
    fifteen_years: z.number().optional(),
    twenty_years: z.number().optional(),
    twenty_five_years: z.number().optional(),
    thirty_years: z.number().optional()
});

export const createRateSchema = rateSchema.omit({
    id: true,
});

export const updateRateSchema = rateSchema.partial();