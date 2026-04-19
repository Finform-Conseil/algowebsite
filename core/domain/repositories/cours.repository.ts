import { CoursEntity } from '../entities/cours.entity';
import { CoursType, CreateCoursType, UpdateCoursType, CoursQueryParams } from '../types/cours.type';
import { PaginatedResponse } from '../types/pagination.type';
import { CoursUploadResponse } from '@/core/infra/store/api/cours.api';

export interface ICoursRepository {
  createCours: (cours: CreateCoursType) => Promise<CoursType>;
  uploadCours: (formData: FormData) => Promise<CoursUploadResponse>;
  updateCours: (id: string, cours: UpdateCoursType) => Promise<CoursType | null>;
  deleteCours: (id: string) => Promise<boolean>;
  getAllCours: (params?: CoursQueryParams) => Promise<PaginatedResponse<CoursEntity>>;
  getCoursById: (id: string) => CoursEntity | null;

  allCoursData?: PaginatedResponse<CoursEntity>;
  isLoadingAllCours: boolean;
  isFetchingAllCours: boolean;
  allCoursError?: any;

  currentCoursData?: CoursEntity | null;
  isLoadingCoursById: boolean;
  isFetchingCoursById: boolean;
  coursByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
