import { ResultType, CreateResultType, UpdateResultType } from '../types/result.type';
import { PaginatedResponse, QueryParams } from '../types/pagination.type';
import { ResultEntity } from '../entities/result.entity';

export interface IResultRepository {
  createResult: (result: CreateResultType) => Promise<ResultEntity>;
  uploadResults: (formData: any) => Promise<void>;
  updateResult: (id: string, result: UpdateResultType) => Promise<ResultEntity | null>;
  deleteResult: (id: string) => Promise<boolean>;
  getAllResults: (params?: QueryParams) => Promise<PaginatedResponse<ResultEntity>>;
  getResultById: (id: string) => ResultEntity | null;

  allResultsData?: PaginatedResponse<ResultEntity>;
  isLoadingAllResults: boolean;
  isFetchingAllResults: boolean;
  allResultsError?: any;

  currentResultData?: ResultEntity | null;
  isLoadingResultById: boolean;
  isFetchingResultById: boolean;
  resultByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}