import { SocietyEntity } from '../entities/society.entity';
import { SocietyType, UpdateSocietyType, CreateSocietyType, SocietyQueryParams } from '../types/society.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface ISocietyRepository {
  createSociety: (society: CreateSocietyType) => Promise<SocietyType>;
  uploadSocieties: (formData: any) => Promise<void>;
  updateSociety: (id: string, society: UpdateSocietyType) => Promise<SocietyType | null>;
  deleteSociety: (id: string) => Promise<boolean>;
  getAllSocieties: (params?: SocietyQueryParams) => Promise<PaginatedResponse<SocietyEntity>>;
  getSocietyById: (id: string) => SocietyEntity | null;

  allSocietiesData?: PaginatedResponse<SocietyEntity>;
  isLoadingAllSocieties: boolean;
  isFetchingAllSocieties: boolean;
  allSocietiesError?: any;
  // refetchAllSocieties: () => void;

  currentSocietyData?: SocietyEntity | null;
  isLoadingSocietyById: boolean;
  isFetchingSocietyById: boolean;
  societyByIdError?: any;
  // refetchSocietyById: () => void;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
