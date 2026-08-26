import { ActionEntity } from '../entities/action.entity';
import { ActionType, CreateActionType, UpdateActionType, ActionQueryParams } from '../types/action.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface ActionRequestOptions {
  forceRefetch?: boolean;
}

export interface IActionRepository {
  createAction: (action: CreateActionType) => Promise<ActionType>;
  uploadActions: (formData: any) => Promise<void>;
  updateAction: (id: string, action: UpdateActionType) => Promise<ActionType | null>;
  deleteAction: (id: string) => Promise<boolean>;
  getAllActions: (params?: ActionQueryParams, options?: ActionRequestOptions) => Promise<PaginatedResponse<ActionEntity>>;
  getActionById: (id: string) => ActionEntity | null;
  getActionByTicker: (ticker: string, isin?: string) => Promise<ActionEntity>;

  allActionsData?: PaginatedResponse<ActionEntity>;
  isLoadingAllActions: boolean;
  isFetchingAllActions: boolean;
  allActionsError?: any;

  currentActionData?: ActionEntity | null;
  isLoadingActionById: boolean;
  isFetchingActionById: boolean;
  actionByIdError?: any;

  currentActionByTickerData?: ActionEntity | null;
  isLoadingActionByTicker: boolean;
  isFetchingActionByTicker: boolean;
  actionByTickerError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
