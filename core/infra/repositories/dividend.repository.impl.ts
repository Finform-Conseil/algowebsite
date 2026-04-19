import { useState, useCallback } from 'react';
import { 
  useCreateDividendMutation, 
  useDeleteDividendMutation, 
  useGetAllDividendsQuery,
  useLazyGetAllDividendsQuery,
  useGetDividendByIdQuery,
  useUpdateDividendMutation, 
  useUploadDividendsMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IDividendRepository } from '../../domain/repositories/dividend.repository';
import { CreateDividendType, DividendType, UpdateDividendType } from '../../domain/types/dividend.type';
import { DividendEntity } from '@/core/domain/entities/dividend.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useDividendRepository = (): IDividendRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateDividendMutation();

  const [
    uploadDividendsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadDividendsMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateDividendMutation();

  const [
    deleteDividendMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteDividendMutation();

  const [dividendIdArg, setDividendIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllDividends,
    {
      data: allDividendsQueryResult,
      isLoading: isLoadingAllDividendsQuery,
      isFetching: isFetchingAllDividendsQuery,
      error: allDividendsQueryError,
    },
  ] = useLazyGetAllDividendsQuery();

  const {
    data: currentDividendQueryResult,
    isLoading: isLoadingDividendByIdQuery,
    isFetching: isFetchingDividendByIdQuery,
    error: dividendByIdQueryError,
    refetch: refetchDividendByIdQuery,
  } = useGetDividendByIdQuery(dividendIdArg === skipToken ? skipToken : { id: dividendIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createDividend = useCallback(async (dividend: CreateDividendType): Promise<DividendType> => {
    resetCreateMutation();
    return createMutation(dividend).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadDividends = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadDividendsMutation(formData).unwrap();
  }, [uploadDividendsMutation, resetUploadMutation]);

  const updateDividend = useCallback(async (id: string, dividend: UpdateDividendType): Promise<DividendType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...dividend }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteDividend = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteDividendMutation(id).unwrap();
    return true;
  }, [deleteDividendMutation, resetDeleteMutation]);

  const getAllDividends = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<DividendEntity>> => {
      const result = await triggerGetAllDividends(params).unwrap();
      return result;
    },
    [triggerGetAllDividends]
  );

  const getDividendById = useCallback((id: string) => {
    setDividendIdArg(id);
    return currentDividendQueryResult || null;
  }, [currentDividendQueryResult]);

  return {
    createDividend,
    uploadDividends,
    updateDividend,
    deleteDividend,
    getAllDividends,
    getDividendById,

    allDividendsData: allDividendsQueryResult,
    isLoadingAllDividends: isLoadingAllDividendsQuery,
    isFetchingAllDividends: isFetchingAllDividendsQuery,
    allDividendsError: allDividendsQueryError,

    currentDividendData: currentDividendQueryResult,
    isLoadingDividendById: isLoadingDividendByIdQuery,
    isFetchingDividendById: isFetchingDividendByIdQuery,
    dividendByIdError: dividendByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};
