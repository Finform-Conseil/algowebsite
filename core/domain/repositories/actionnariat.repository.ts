import { ActionnariatEntity } from "../entities/actionnariat.entity";
import { CreateActionnariatType, ActionnariatType, UpdateActionnariatType } from "../types/actionnariat.type";
import { PaginatedResponse, QueryParams } from "../types/pagination.type";

export interface IActionnariatRepository {
  createActionnariat(actionnariat: CreateActionnariatType): Promise<ActionnariatType>;
  uploadActionnariats(formData: any): Promise<void>;
  updateActionnariat(id: string, actionnariat: UpdateActionnariatType): Promise<ActionnariatType | null>;
  deleteActionnariat(id: string): Promise<boolean>;
  getAllActionnariats(params?: QueryParams): Promise<PaginatedResponse<ActionnariatEntity>>;
  getActionnariatById(id: string): ActionnariatEntity | null;

  // Query states
  allActionnariatsData?: PaginatedResponse<ActionnariatEntity>;
  isLoadingAllActionnariats?: boolean;
  isFetchingAllActionnariats?: boolean;
  allActionnariatsError?: any;

  currentActionnariatData?: ActionnariatEntity;
  isLoadingActionnariatById?: boolean;
  isFetchingActionnariatById?: boolean;
  actionnariatByIdError?: any;

  // Mutation states
  isMutationLoading?: boolean;
  isMutationSuccess?: boolean;
  isMutationError?: boolean;
  mutationError?: any;
}
