import { number, z } from 'zod';

export const actionSchema = z.object({
    id: z.uuid(),
    ticker: z.string().min(1, "Le ticker est requis"),
    society: z.uuid().optional().nullable(),
    bourse: z.uuid().optional().nullable(),
    number_of_actions: z.number().min(0).optional().nullable(),
    cusip: z.string().max(20, "Le CUSIP doit faire moins de 20 caractères").optional().nullable(),
    isin: z.string().max(20, "L'ISIN doit faire moins de 20 caractères").optional().nullable(),
    sedol: z.string().max(20, "Le SEDOL doit faire moins de 20 caractères").optional().nullable(),
    last_public_offer_date: z.date().optional().nullable(),
    last_public_offer_action_number: z.number().min(0).optional().nullable(),
    last_public_offer_price: z.number().min(0).optional().nullable(),
    lead_manager: z.string().max(100, "Le gestionnaire principal doit faire moins de 100 caractères").optional().nullable(),
    options_available: z.boolean().optional().nullable(),
    initial_public_offer_date: z.date().optional().nullable(),
    initial_public_offer_price: z.number().min(0).optional().nullable(),
    initial_public_offer_action_given: z.number().min(0).optional().nullable(),
    foreign_action_ratio: z.number().min(0).max(100).optional().nullable(),
    lombard_russian_bond_indicator: z.boolean().optional().nullable()
});

export const createActionSchema = actionSchema.omit({
    id: true
});

export const updateActionSchema = actionSchema.partial();