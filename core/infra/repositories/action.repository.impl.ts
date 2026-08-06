import { useState, useCallback }  from 'react';
import { 
  useCreateActionMutation,
  useDeleteActionMutation, 
  useGetActionByIdQuery, 
  useLazyGetActionByTickerQuery,
  useLazyGetAllActionsQuery,
  useGetAllActionsQuery, 
  useUpdateActionMutation,
  useUploadActionsMutation, 
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IActionRepository } from '@/core/domain/repositories/action.repository';
import { ActionType, CreateActionType, UpdateActionType, ActionQueryParams } from '@/core/domain/types/action.type';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { PaginatedResponse } from '@/core/domain/types/pagination.type';
import { getBRVMSecurityByTicker } from '@/core/data/brvm-securities';

const isNotFoundError = (error: unknown): boolean => (
  typeof error === 'object' && error !== null && 'status' in error && error.status === 404
);

const actionRequestsInFlight = new Map<string, Promise<unknown>>();

const serializeActionParams = (params: ActionQueryParams): string =>
  JSON.stringify(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)));

const getSharedActionRequest = <T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> => {
  const existing = actionRequestsInFlight.get(key);
  if (existing) return existing as Promise<T>;

  const request = factory();
  actionRequestsInFlight.set(key, request);
  const clearRequest = () => {
    if (actionRequestsInFlight.get(key) === request) actionRequestsInFlight.delete(key);
  };
  void request.then(clearRequest, clearRequest);
  return request;
};

export const useActionRepository = (): IActionRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateActionMutation();

  const [
    uploadActionsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadActionsMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateActionMutation();

  const [
    deleteActionMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteActionMutation();

  const [actionIdArg, setActionIdArg] = useState<string | typeof skipToken>(skipToken);


    const [
      triggerGetAllActions,
      {
        data: allActionsQueryResult,
        isLoading: isLoadingAllActionsQuery,
        isFetching: isFetchingAllActionsQuery,
        error: allActionsQueryError,
      },
    ] = useLazyGetAllActionsQuery();

  const {
    data: currentActionQueryResult,
    isLoading: isLoadingActionByIdQuery,
    isFetching: isFetchingActionByIdQuery,
    error: actionByIdQueryError,
    refetch: refetchActionByIdQuery,
  } = useGetActionByIdQuery(actionIdArg === skipToken ? skipToken : { id: actionIdArg as string });

  const [
    triggerGetActionByTicker,
    {
      data: currentActionByTickerQueryResult,
      isLoading: isLoadingActionByTickerQuery,
      isFetching: isFetchingActionByTickerQuery,
      error: actionByTickerQueryError,
    },
  ] = useLazyGetActionByTickerQuery();


  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccessOverall = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationErrorOverall = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationErrorOverall = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createAction = useCallback(async (action: CreateActionType): Promise<ActionType> => {
    resetCreateMutation();
    return createMutation(action).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadActions = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadActionsMutation(formData).unwrap();
  }, [uploadActionsMutation, resetUploadMutation]);

  const updateAction = useCallback(async (id: string, action: UpdateActionType): Promise<ActionType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...action }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteAction = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteActionMutation(id).unwrap();
    return true;
  }, [deleteActionMutation, resetDeleteMutation]);

  const getAllActions = useCallback(
    async (
      params: ActionQueryParams = {}
    ): Promise<PaginatedResponse<ActionEntity>> => {
      const key = `actions:list:${serializeActionParams(params)}`;
      return getSharedActionRequest(key, () => triggerGetAllActions(params).unwrap());
    },
    [triggerGetAllActions]
  );
    

  const getActionById = useCallback((id: string) => {
    setActionIdArg(id);
    return currentActionQueryResult || null;
  }, [currentActionQueryResult]);

  const getActionByTicker = useCallback(async (ticker: string): Promise<ActionEntity> => {
    const normalizedTicker = ticker.trim().toUpperCase();
    const key = `actions:ticker:${normalizedTicker}`;

    return getSharedActionRequest(key, async () => {
      try {
        return await triggerGetActionByTicker({ ticker: normalizedTicker }).unwrap();
      } catch (error) {
        if (!isNotFoundError(error)) throw error;
        const security = getBRVMSecurityByTicker(normalizedTicker);
        if (!security?.isin) throw error;
        const result = await triggerGetAllActions({ isin: security.isin, page_size: 1 }).unwrap();
        const action = result.data?.[0];
        if (!action) throw error;
        return action;
      }
    });
  }, [triggerGetActionByTicker, triggerGetAllActions]);

  return {
    createAction,
    uploadActions,
    updateAction,
    deleteAction,
    getAllActions,
    getActionById,
    getActionByTicker,

    allActionsData: allActionsQueryResult,
    isLoadingAllActions: isLoadingAllActionsQuery,
    isFetchingAllActions: isFetchingAllActionsQuery,
    allActionsError: allActionsQueryError,

    currentActionData: currentActionQueryResult,
    isLoadingActionById: isLoadingActionByIdQuery,
    isFetchingActionById: isFetchingActionByIdQuery,
    actionByIdError: actionByIdQueryError,

    currentActionByTickerData: currentActionByTickerQueryResult,
    isLoadingActionByTicker: isLoadingActionByTickerQuery,
    isFetchingActionByTicker: isFetchingActionByTickerQuery,
    actionByTickerError: actionByTickerQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
