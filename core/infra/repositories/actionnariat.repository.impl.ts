import { useState, useCallback } from 'react';
import { 
  useCreateActionnariatMutation, 
  useDeleteActionnariatMutation, 
  useGetAllActionnariatsQuery,
  useLazyGetAllActionnariatsQuery,
  useGetActionnariatByIdQuery,
  useUpdateActionnariatMutation, 
  useUploadActionnariatsMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IActionnariatRepository } from '../../domain/repositories/actionnariat.repository';
import { CreateActionnariatType, ActionnariatType, UpdateActionnariatType } from '../../domain/types/actionnariat.type';
import { ActionnariatEntity } from '@/core/domain/entities/actionnariat.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useActionnariatRepository = (): IActionnariatRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateActionnariatMutation();

  const [
    uploadActionnariatsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadActionnariatsMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateActionnariatMutation();

  const [
    deleteActionnariatMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteActionnariatMutation();

  const [actionnariatIdArg, setActionnariatIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllActionnariats,
    {
      data: allActionnariatsQueryResult,
      isLoading: isLoadingAllActionnariatsQuery,
      isFetching: isFetchingAllActionnariatsQuery,
      error: allActionnariatsQueryError,
    },
  ] = useLazyGetAllActionnariatsQuery();

  const {
    data: currentActionnariatQueryResult,
    isLoading: isLoadingActionnariatByIdQuery,
    isFetching: isFetchingActionnariatByIdQuery,
    error: actionnariatByIdQueryError,
    refetch: refetchActionnariatByIdQuery,
  } = useGetActionnariatByIdQuery(actionnariatIdArg === skipToken ? skipToken : { id: actionnariatIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createActionnariat = useCallback(async (actionnariat: CreateActionnariatType): Promise<ActionnariatType> => {
    resetCreateMutation();
    return createMutation(actionnariat).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadActionnariats = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadActionnariatsMutation(formData).unwrap();
  }, [uploadActionnariatsMutation, resetUploadMutation]);

  const updateActionnariat = useCallback(async (id: string, actionnariat: UpdateActionnariatType): Promise<ActionnariatType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...actionnariat }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteActionnariat = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteActionnariatMutation(id).unwrap();
    return true;
  }, [deleteActionnariatMutation, resetDeleteMutation]);

  const getAllActionnariats = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<ActionnariatEntity>> => {
      const result = await triggerGetAllActionnariats(params).unwrap();
      return result;
    },
    [triggerGetAllActionnariats]
  );

  const getActionnariatById = useCallback((id: string) => {
    setActionnariatIdArg(id);
    return currentActionnariatQueryResult || null;
  }, [currentActionnariatQueryResult]);

  return {
    createActionnariat,
    uploadActionnariats,
    updateActionnariat,
    deleteActionnariat,
    getAllActionnariats,
    getActionnariatById,

    allActionnariatsData: allActionnariatsQueryResult,
    isLoadingAllActionnariats: isLoadingAllActionnariatsQuery,
    isFetchingAllActionnariats: isFetchingAllActionnariatsQuery,
    allActionnariatsError: allActionnariatsQueryError,

    currentActionnariatData: currentActionnariatQueryResult,
    isLoadingActionnariatById: isLoadingActionnariatByIdQuery,
    isFetchingActionnariatById: isFetchingActionnariatByIdQuery,
    actionnariatByIdError: actionnariatByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};
