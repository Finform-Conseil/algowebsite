import { CreateRateType, UpdateRateType } from '../types/rate.type';
import { PaginatedResponse, QueryParams } from '../types/pagination.type';
import { RateEntity } from '../entities/rate.entity';

export interface IRateRepository {
  createRate: (rate: CreateRateType) => Promise<RateEntity>;
  uploadRates: (formData: any) => Promise<void>;
  updateRate: (id: string, rate: UpdateRateType) => Promise<RateEntity | null>;
  deleteRate: (id: string) => Promise<boolean>;
  getAllRates: (params?: QueryParams) => Promise<PaginatedResponse<RateEntity>>;
  getRateById: (id: string) => RateEntity | null;

  allRatesData?: PaginatedResponse<RateEntity>;
  isLoadingAllRates: boolean;
  isFetchingAllRates: boolean;
  allRatesError?: any;

  currentRateData?: RateEntity | null;
  isLoadingRateById: boolean;
  isFetchingRateById: boolean;
  rateByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}