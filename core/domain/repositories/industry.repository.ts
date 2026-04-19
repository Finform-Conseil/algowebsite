import { IndustryEntity } from '../entities/industry.entity';
import { IndustryType, CreateIndustryType, UpdateIndustryType, IndustryQueryParams } from '../types/industry.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface IIndustryRepository {
  createIndustry: (industry: CreateIndustryType) => Promise<IndustryType>;
  uploadIndustries: (formData: any) => Promise<void>;
  updateIndustry: (id: string, industry: UpdateIndustryType) => Promise<IndustryType | null>;
  deleteIndustry: (id: string) => Promise<boolean>;
  getAllIndustries: (params?: IndustryQueryParams) => Promise<PaginatedResponse<IndustryEntity>>;
  getIndustryById: (id: string) => IndustryEntity | null;

  allIndustriesData?: PaginatedResponse<IndustryEntity>;
  isLoadingAllIndustries: boolean;
  isFetchingAllIndustries: boolean;
  allIndustriesError?: any;
  // refetchAllIndustries: () => void;

  currentIndustryData?: IndustryEntity | null;
  isLoadingIndustryById: boolean;
  isFetchingIndustryById: boolean;
  industryByIdError?: any;
  // refetchIndustryById: () => void;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
