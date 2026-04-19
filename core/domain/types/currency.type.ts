import { z } from "zod";
import { createCurrencySchema, currencySchema, updateCurrencySchema } from "../schemas/currency.schema";

export type CurrencyType = z.infer<typeof currencySchema>;
export type CreateCurrencyType = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyType = z.infer<typeof updateCurrencySchema>;