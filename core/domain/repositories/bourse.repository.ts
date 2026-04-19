import { BourseEntity } from '../entities/bourse.entity';
import { BourseType, CreateBourseType, UpdateBourseType } from '../types/bourse.type';
import { PaginatedResponse, QueryParams } from '../types/pagination.type';

export interface IBourseRepository {
  createBourse: (bourse: CreateBourseType) => Promise<BourseType>;
  uploadBourses: (formData: any) => Promise<void>;
  updateBourse: (id: string, bourse: UpdateBourseType) => Promise<BourseType | null>;
  deleteBourse: (id: string) => Promise<boolean>;
  getAllBourses(params?: QueryParams): Promise<PaginatedResponse<BourseEntity>>;
  getBourseById: (id: string) => BourseEntity | null;

  allBoursesData?: PaginatedResponse<BourseEntity>;
  isLoadingAllBourses: boolean;
  isFetchingAllBourses: boolean;
  allBoursesError?: any;

  currentBourseData?: BourseEntity | null;
  isLoadingBourseById: boolean;
  isFetchingBourseById: boolean;
  bourseByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}