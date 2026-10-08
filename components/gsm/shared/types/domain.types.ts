export type CurrencyCode = string;

export interface PortfolioClient {
  id?: string;
  type: string;
  profilRisque: string;
  marche: string;
  devise: CurrencyCode;
  pays: string;
  encours: number;
  perf?: number;
  rentabilite?: number;
  dateEntree?: string | null;
  [key: string]: unknown;
}

export interface AllocationSlice {
  name?: string;
  label?: string;
  value: number;
  [key: string]: unknown;
}

export interface QuarterlyPortfolioHistoryPoint {
  trimestre: string;
  fin: string;
}

export interface ProfileStatistic {
  profil: string;
  nombre: number;
  encoursProfil: number;
  variationEncoursPonderee: number;
  rendementPondere: number;
}

export interface PortfolioHistoryPoint {
  trimestre: string;
  nombre: number;
}
