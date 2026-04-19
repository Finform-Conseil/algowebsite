import { z } from "zod";
import { createSectorSchema, sectorSchema, updateSectorSchema } from "../schemas/sector.schema";

export type SectorType = z.infer<typeof sectorSchema>;
export type CreateSectorType = z.infer<typeof createSectorSchema>;
export type UpdateSectorType = z.infer<typeof updateSectorSchema>;