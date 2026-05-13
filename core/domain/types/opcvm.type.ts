import { z } from "zod";
import { createOpcvmMetricSchema, createOpcvmSchema, opcvmMetricSchema, opcvmSchema, updateOpcvmMetricSchema, updateOpcvmSchema } from "../schemas/opcvm.schema";
import { QueryParams } from "./pagination.type";

export type OpcvmType = z.infer<typeof opcvmSchema>;
export type CreateOpcvmType = z.infer<typeof createOpcvmSchema>;
export type UpdateOpcvmType = z.infer<typeof updateOpcvmSchema>;

export interface OpcvmQueryParams extends QueryParams {
    country?: string;
    ordering?: string;
    search?: string;
    natures?: string;
    types?: string;
    bourse_tickers?: string;
    niveaux_risque?: string;
}

export type OpcvmMetricType = z.infer<typeof opcvmMetricSchema>;
export type CreateOpcvmMetricType = z.infer<typeof createOpcvmMetricSchema>;
export type UpdateOpcvmMetricType = z.infer<typeof updateOpcvmMetricSchema>;

export interface OpcvmMetricQueryParams extends QueryParams {
    opcvmId?: string;
}