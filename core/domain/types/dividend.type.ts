import { z } from "zod";
import { createDividendSchema, dividendSchema, updateDividendSchema } from "../schemas/dividend.schema";

export type DividendType = z.infer<typeof dividendSchema>;
export type CreateDividendType = z.infer<typeof createDividendSchema>;
export type UpdateDividendType = z.infer<typeof updateDividendSchema>;
