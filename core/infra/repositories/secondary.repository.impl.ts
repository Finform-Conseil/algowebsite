import { useState, useCallback } from 'react';
import { 
  useCreateSecondaryMutation, 
  useDeleteSecondaryMutation, 
  useGetAllSecondariesQuery,
  useLazyGetAllSecondariesQuery,
  useGetSecondaryByIdQuery,
  useUpdateSecondaryMutation, 
  useUploadSecondariesMutation, 
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateSecondaryType, UpdateSecondaryType } from '../../domain/types/secondary.type';
import { SecondaryEntity } from '@/core/domain/entities/secondary.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';
import { ISecondaryRepository } from '../../domain/repositories/secondary.repository';

export const useSecondaryRepository = (): ISecondaryRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateSecondaryMutation();

  const [
    uploadSecondariesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadSecondariesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateSecondaryMutation();

  const [
    deleteSecondaryMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteSecondaryMutation();

  const [secondaryIdArg, setSecondaryIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllSecondaries,
    {
      data: allSecondariesQueryResult,
      isLoading: isLoadingAllSecondariesQuery,
      isFetching: isFetchingAllSecondariesQuery,
      error: allSecondariesQueryError,
    },
  ] = useLazyGetAllSecondariesQuery();

  const {
    data: currentSecondaryQueryResult,
    isLoading: isLoadingSecondaryByIdQuery,
    isFetching: isFetchingSecondaryByIdQuery,
    error: secondaryByIdQueryError,
    refetch: refetchSecondaryByIdQuery,
  } = useGetSecondaryByIdQuery(secondaryIdArg === skipToken ? skipToken : { id: secondaryIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createSecondary = useCallback(async (secondary: CreateSecondaryType): Promise<SecondaryEntity> => {
    resetCreateMutation();
    return createMutation(secondary).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadSecondaries = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadSecondariesMutation(formData).unwrap();
  }, [uploadSecondariesMutation, resetUploadMutation]);

  const updateSecondary = useCallback(async (id: string, secondary: UpdateSecondaryType): Promise<SecondaryEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...secondary }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteSecondary = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteSecondaryMutation(id).unwrap();
    return true;
  }, [deleteSecondaryMutation, resetDeleteMutation]);

  const getAllSecondaries = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<SecondaryEntity>> => {
      const result = await triggerGetAllSecondaries(params).unwrap();
      return result;
    },
    [triggerGetAllSecondaries]
  );

  const getSecondaryById = useCallback((id: string) => {
    setSecondaryIdArg(id);
    return currentSecondaryQueryResult || null;
  }, [currentSecondaryQueryResult]);

  return {
    createSecondary,
    uploadSecondaries,
    updateSecondary,
    deleteSecondary,
    getAllSecondaries,
    getSecondaryById,

    allSecondariesData: allSecondariesQueryResult,
    isLoadingAllSecondaries: isLoadingAllSecondariesQuery,
    isFetchingAllSecondaries: isFetchingAllSecondariesQuery,
    allSecondariesError: allSecondariesQueryError,

    currentSecondaryData: currentSecondaryQueryResult,
    isLoadingSecondaryById: isLoadingSecondaryByIdQuery,
    isFetchingSecondaryById: isFetchingSecondaryByIdQuery,
    secondaryByIdError: secondaryByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};