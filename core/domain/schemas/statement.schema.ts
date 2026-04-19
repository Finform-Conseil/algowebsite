import { z } from 'zod';

export const statementSchema = z.object({
    id: z.uuid(),
    action: z.uuid(),
    item: z.uuid().optional().nullable(),
    period: z.uuid().optional().nullable(),
    value: z.number().optional().nullable(),
});

export const createStatementSchema = statementSchema.omit({
    id: true,
});

export const updateStatementSchema = statementSchema.partial();