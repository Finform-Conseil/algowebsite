import { OPCVMEntity, OPCVMMetricEntity } from "../entities/opcvm.entity";
import { CreateOpcvmMetricType, CreateOpcvmType, OpcvmMetricType, OpcvmType, UpdateOpcvmMetricType, UpdateOpcvmType } from "../types/opcvm.type";
import { PaginatedResponse, QueryParams } from "../types/pagination.type";

export interface IOpcvmRepository {
  createOpcvm(opcvm: CreateOpcvmType): Promise<OpcvmType>;
  uploadOpcvms(formData: any): Promise<void>;
  updateOpcvm(id: string, opcvm: UpdateOpcvmType): Promise<OpcvmType | null>;
  deleteOpcvm(id: string): Promise<boolean>;
  getAllOpcvms(params?: QueryParams): Promise<PaginatedResponse<OPCVMEntity>>;
  getOpcvmById(id: string): OPCVMEntity | null;

  // Query states
  allOpcvmsData?: PaginatedResponse<OPCVMEntity>;
  isLoadingAllOpcvms?: boolean;
  isFetchingAllOpcvms?: boolean;
  allOpcvmsError?: any;

  currentOpcvmData?: OPCVMEntity;
  isLoadingOpcvmById?: boolean;
  isFetchingOpcvmById?: boolean;
  opcvmByIdError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}


export interface IOpcvmMetricRepository {
  createOpcvmMetric(metric: CreateOpcvmMetricType): Promise<OpcvmMetricType>;
  uploadOpcvmMetrics(formData: any): Promise<void>;
  updateOpcvmMetric(id: string, metric: UpdateOpcvmMetricType): Promise<OpcvmMetricType | null>;
  deleteOpcvmMetric(id: string): Promise<boolean>;
  getAllOpcvmMetrics(params?: QueryParams): Promise<PaginatedResponse<OPCVMMetricEntity>>;
  getOpcvmMetricById(id: string): OPCVMMetricEntity | null;

  // Query states
  allOpcvmMetricsData?: PaginatedResponse<OPCVMMetricEntity>;
  isLoadingAllOpcvmMetrics?: boolean;
  isFetchingAllOpcvmMetrics?: boolean;
  allOpcvmMetricsError?: any;

  currentOpcvmMetricData?: OPCVMMetricEntity;
  isLoadingOpcvmMetricById?: boolean;
  isFetchingOpcvmMetricById?: boolean;
  opcvmMetricByIdError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}
