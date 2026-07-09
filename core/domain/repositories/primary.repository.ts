import { PrimaryEntity } from "../entities/primary.entity";
import { BondCashflowEntity } from "../entities/bond-cashflow.entity";
import { CreatePrimaryType, UpdatePrimaryType } from "../types/primary.type";
import { PaginatedResponse, QueryParams } from "../types/pagination.type";

export interface IPrimaryRepository {
  createPrimary(primary: CreatePrimaryType): Promise<PrimaryEntity>;
  uploadPrimaries(formData: any): Promise<void>;
  updatePrimary(id: string, primary: UpdatePrimaryType): Promise<PrimaryEntity | null>;
  deletePrimary(id: string): Promise<boolean>;
  getAllPrimaries(params?: QueryParams): Promise<PaginatedResponse<PrimaryEntity>>;
  getPrimaryById(id: string): PrimaryEntity | null;
  getBondCashflowsBySecurity(securityId: string, params?: QueryParams): Promise<PaginatedResponse<BondCashflowEntity>>;

  // Query states
  allPrimariesData?: PaginatedResponse<PrimaryEntity>;
  isLoadingAllPrimaries?: boolean;
  isFetchingAllPrimaries?: boolean;
  allPrimariesError?: any;

  currentPrimaryData?: PrimaryEntity;
  isLoadingPrimaryById?: boolean;
  isFetchingPrimaryById?: boolean;
  primaryByIdError?: any;

  bondCashflowsData?: PaginatedResponse<BondCashflowEntity>;
  isLoadingBondCashflows?: boolean;
  isFetchingBondCashflows?: boolean;
  bondCashflowsError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}