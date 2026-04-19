import { DividendEntity } from "../entities/dividend.entity";
import { CreateDividendType, DividendType, UpdateDividendType } from "../types/dividend.type";
import { PaginatedResponse, QueryParams } from "../types/pagination.type";

export interface IDividendRepository {
  createDividend(dividend: CreateDividendType): Promise<DividendType>;
  uploadDividends(formData: any): Promise<void>;
  updateDividend(id: string, dividend: UpdateDividendType): Promise<DividendType | null>;
  deleteDividend(id: string): Promise<boolean>;
  getAllDividends(params?: QueryParams): Promise<PaginatedResponse<DividendEntity>>;
  getDividendById(id: string): DividendEntity | null;

  // Query states
  allDividendsData?: PaginatedResponse<DividendEntity>;
  isLoadingAllDividends?: boolean;
  isFetchingAllDividends?: boolean;
  allDividendsError?: any;

  currentDividendData?: DividendEntity;
  isLoadingDividendById?: boolean;
  isFetchingDividendById?: boolean;
  dividendByIdError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}
