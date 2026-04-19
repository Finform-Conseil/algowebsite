import { z } from "zod";
import { countrySchema, createCountrySchema, updateCountrySchema } from "../schemas/country.schema";
import { QueryParams } from "./pagination.type";

export type CountryType = z.infer<typeof countrySchema>;
export type CreateCountryType = z.infer<typeof createCountrySchema>;
export type UpdateCountryType = z.infer<typeof updateCountrySchema>;

export interface CountryQueryParams extends QueryParams {
    bourse?: string;
    currency?: string;
}