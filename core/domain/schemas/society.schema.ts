import { z } from 'zod';

export const societySchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, "Le nom est requis").max(100, "Le nom doit faire moins de 100 caractères"),
    description: z.string().max(500, "La description doit faire moins de 500 caractères"),
    country: z.uuid().optional().nullable(),
    industry: z.uuid().optional().nullable(),
    parent: z.uuid().optional().nullable(),
    phone: z.string().min(1).max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    website: z.string().url().optional().nullable(),
    employee_count: z.number().min(0).optional().nullable(),
    headquarters_location: z.string().min(1).max(200).optional().nullable(),
    founded_date: z.date().optional().nullable(),
    sector_gics: z.number().min(0).optional().nullable(),
    icb_sector_number: z.number().min(0).optional().nullable(),
    sic_code: z.number().min(0).optional().nullable(),
    fondamental_industry_code: z.string().min(1).max(10).optional().nullable(),
    last_actions_buyback_value: z.number().min(0).optional().nullable(),
    chief_executive_officer: z.string().min(1).max(100).optional().nullable(),
    financial_manager: z.string().min(1).max(100).optional().nullable(),
    chairman_board: z.string().min(1).max(100).optional().nullable(),
    head_office: z.string().min(1).max(200).optional().nullable(),
    year_founded: z.number().min(1900).max(2100).optional().nullable(),
    rating: z.string().min(1).max(10).optional().nullable(),
    subsidiaries: z.string().min(1).max(500).optional().nullable(),
});

export const createSocietySchema = societySchema.omit({
    id: true
});

export const updateSocietySchema = societySchema.partial();