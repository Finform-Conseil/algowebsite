import { z } from 'zod';

export const coursSchema = z.object({
    id: z.uuid(),
    instrument: z.uuid().optional().nullable(),
    open: z.number().min(0).optional().nullable(),
    high: z.number().min(0).optional().nullable(),
    low: z.number().min(0).optional().nullable(),
    close: z.number().min(0).optional().nullable(),
    timestamp: z.string(),
    volume: z.number().min(0).optional().nullable(),
    number_of_trades: z.number().min(0).optional().nullable(),
    total_trades_value: z.number().min(0).optional().nullable(),
    quantite_residuelle_put: z.number().min(0).optional().nullable(),
    quantite_residuelle_call: z.number().min(0).optional().nullable(),
    put: z.number().min(0).optional().nullable(),
    call: z.number().min(0).optional().nullable(),
    reference: z.number().min(0).optional().nullable(),
    residual_value: z.number().min(0).optional().nullable(),
    treatment_delay: z.number().min(0).optional().nullable(),
});

export const createCoursSchema = coursSchema.omit({
    id: true
});

export const updateCoursSchema = coursSchema.partial();