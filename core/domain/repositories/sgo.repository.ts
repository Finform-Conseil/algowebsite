import { CreateSgoType, UpdateSgoType } from '../types/sgo.type';
import { PaginatedResponse, QueryParams } from '../types/pagination.type';
import { SGOEntity } from '../entities/sgo.entity';

export interface ISgoRepository {
  createSgo: (sgo: CreateSgoType) => Promise<SGOEntity>;
  uploadSgos: (formData: any) => Promise<void>;
  updateSgo: (id: string, sgo: UpdateSgoType) => Promise<SGOEntity | null>;
  deleteSgo: (id: string) => Promise<boolean>;
  getAllSgos: (params?: QueryParams) => Promise<PaginatedResponse<SGOEntity>>;
  getSgoById: (id: string) => SGOEntity | null;

  allSgosData?: PaginatedResponse<SGOEntity>;
  isLoadingAllSgos: boolean;
  isFetchingAllSgos: boolean;
  allSgosError?: any;

  currentSgoData?: SGOEntity | null;
  isLoadingSgoById: boolean;
  isFetchingSgoById: boolean;
  sgoByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}