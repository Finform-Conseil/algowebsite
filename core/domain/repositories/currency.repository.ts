import { CreateCurrencyType, UpdateCurrencyType } from '../types/currency.type';
import { PaginatedResponse, QueryParams } from '../types/pagination.type';
import { CurrencyEntity } from '../entities/currency.entity';

export interface ICurrencyRepository {
  createCurrency: (currency: CreateCurrencyType) => Promise<CurrencyEntity>;
  uploadCurrencies: (formData: any) => Promise<void>;
  updateCurrency: (id: string, currency: UpdateCurrencyType) => Promise<CurrencyEntity | null>;
  deleteCurrency: (id: string) => Promise<boolean>;
  getAllCurrencies: (params?: QueryParams) => Promise<PaginatedResponse<CurrencyEntity>>;
  getCurrencyById: (id: string) => CurrencyEntity | null;

  allCurrenciesData?: PaginatedResponse<CurrencyEntity>;
  isLoadingAllCurrencies: boolean;
  isFetchingAllCurrencies: boolean;
  allCurrenciesError?: any;
  // refetchAllCurrencies: () => void;

  currentCurrencyData?: CurrencyEntity | null;
  isLoadingCurrencyById: boolean;
  isFetchingCurrencyById: boolean;
  currencyByIdError?: any;
  // refetchCurrencyById: () => void;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
