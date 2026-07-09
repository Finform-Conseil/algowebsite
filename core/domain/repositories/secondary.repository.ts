import { SecondaryEntity } from "../entities/secondary.entity";
import { CreateSecondaryType, UpdateSecondaryType } from "../types/secondary.type";
import { PaginatedResponse, QueryParams } from "../types/pagination.type";

export interface ISecondaryRepository {
  createSecondary(secondary: CreateSecondaryType): Promise<SecondaryEntity>;
  uploadSecondaries(formData: any): Promise<void>;
  updateSecondary(id: string, secondary: UpdateSecondaryType): Promise<SecondaryEntity | null>;
  deleteSecondary(id: string): Promise<boolean>;
  getAllSecondaries(params?: QueryParams): Promise<PaginatedResponse<SecondaryEntity>>;
  getSecondaryById(id: string): SecondaryEntity | null;

  // Query states
  allSecondariesData?: PaginatedResponse<SecondaryEntity>;
  isLoadingAllSecondaries?: boolean;
  isFetchingAllSecondaries?: boolean;
  allSecondariesError?: any;

  currentSecondaryData?: SecondaryEntity;
  isLoadingSecondaryById?: boolean;
  isFetchingSecondaryById?: boolean;
  secondaryByIdError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}