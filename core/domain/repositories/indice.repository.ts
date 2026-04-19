import { IndiceCoursEntity, IndiceEntity } from "../entities/indice.entity";
import { CreateIndiceType, IndiceType, UpdateIndiceType } from "../types/indice.type";
import { PaginatedResponse, QueryParams } from "../types/pagination.type";

export interface IIndiceRepository {
  createIndice(indice: CreateIndiceType): Promise<IndiceType>;
  uploadIndices(formData: any): Promise<void>;
  uploadIndicesCours(formData: any): Promise<void>;
  updateIndice(id: string, indice: UpdateIndiceType): Promise<IndiceType | null>;
  deleteIndice(id: string): Promise<boolean>;
  getAllIndices(params?: QueryParams): Promise<PaginatedResponse<IndiceEntity>>;
  getIndicesCoursByIndice(indice: string, params?: QueryParams): Promise<PaginatedResponse<IndiceCoursEntity>>;
  getIndiceById(id: string): IndiceEntity | null;

  // Query states
  allIndicesData?: PaginatedResponse<IndiceEntity>;
  isLoadingAllIndices?: boolean;
  isFetchingAllIndices?: boolean;
  allIndicesError?: any;

  currentIndiceData?: IndiceEntity;
  isLoadingIndiceById?: boolean;
  isFetchingIndiceById?: boolean;
  indiceByIdError?: any;

  allIndicesCoursByIndiceData?: PaginatedResponse<IndiceCoursEntity>;
  isLoadingAllIndicesCoursByIndice?: boolean;
  isFetchingAllIndicesCoursByIndice?: boolean;
  allIndicesCoursByIndiceError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}
