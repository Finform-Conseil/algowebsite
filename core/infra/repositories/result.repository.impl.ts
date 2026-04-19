import { useState, useCallback }  from 'react';
import { 
  useCreateResultMutation, 
  useDeleteResultMutation, 
  useGetAllResultsQuery, 
  useLazyGetAllResultsQuery,
  useGetResultByIdQuery,
  useUpdateResultMutation, 
  useUploadResultMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateResultType, UpdateResultType } from '@/core/domain/types/result.type';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { ResultEntity } from '@/core/domain/entities/result.entity';
import { IResultRepository } from '@/core/domain/repositories/result.repository';

export const useResultRepository = (): IResultRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateResultMutation();

  const [
    uploadResultsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadResultMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateResultMutation();

  const [
    deleteResultMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteResultMutation();

  const [resultIdArg, setResultIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllResults,
    {
      data: allResultsQueryResult,
      isLoading: isLoadingAllResultsQuery,
      isFetching: isFetchingAllResultsQuery,
      error: allResultsQueryError,
    },
  ] = useLazyGetAllResultsQuery();

  const {
    data: currentResultQueryResult,
    isLoading: isLoadingResultByIdQuery,
    isFetching: isFetchingResultByIdQuery,
    error: resultByIdQueryError,
    refetch: refetchResultByIdQuery,
  } = useGetResultByIdQuery(resultIdArg === skipToken ? skipToken : { id: resultIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createResult = useCallback(async (result: CreateResultType): Promise<ResultEntity> => {
    resetCreateMutation();
    return createMutation(result).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadResults = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadResultsMutation(formData).unwrap();
  }, [uploadResultsMutation, resetUploadMutation]);

  const updateResult = useCallback(async (id: string, result: UpdateResultType): Promise<ResultEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...result }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteResult = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteResultMutation(id).unwrap();
    return true;
  }, [deleteResultMutation, resetDeleteMutation]);

  const getAllResults = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<ResultEntity>> => {
      const result = await triggerGetAllResults(params).unwrap();
      return result;
    },
    [triggerGetAllResults]
  );
  
  const getResultById = useCallback((id: string) => {
    setResultIdArg(id);
    return currentResultQueryResult || null;
  }, [currentResultQueryResult]);

  return {
    createResult,
    uploadResults,
    updateResult,
    deleteResult,
    getAllResults,
    getResultById,

    allResultsData: allResultsQueryResult,
    isLoadingAllResults: isLoadingAllResultsQuery,
    isFetchingAllResults: isFetchingAllResultsQuery,
    allResultsError: allResultsQueryError,

    currentResultData: currentResultQueryResult,
    isLoadingResultById: isLoadingResultByIdQuery,
    isFetchingResultById: isFetchingResultByIdQuery,
    resultByIdError: resultByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
