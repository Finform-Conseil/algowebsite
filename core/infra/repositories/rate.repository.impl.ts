import { useState, useCallback }  from 'react';
import { 
  useCreateRateMutation, 
  useDeleteRateMutation, 
  useGetAllRatesQuery, 
  useLazyGetAllRatesQuery,
  useGetRateByIdQuery,
  useUpdateRateMutation, 
  useUploadRateMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateRateType, UpdateRateType } from '@/core/domain/types/rate.type';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { RateEntity } from '@/core/domain/entities/rate.entity';
import { IRateRepository } from '@/core/domain/repositories/rate.repository';

export const useRateRepository = (): IRateRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateRateMutation();

  const [
    uploadRatesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadRateMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateRateMutation();

  const [
    deleteRateMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteRateMutation();

  const [rateIdArg, setRateIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllRates,
    {
      data: allRatesQueryRate,
      isLoading: isLoadingAllRatesQuery,
      isFetching: isFetchingAllRatesQuery,
      error: allRatesQueryError,
    },
  ] = useLazyGetAllRatesQuery();

  const {
    data: currentRateQueryRate,
    isLoading: isLoadingRateByIdQuery,
    isFetching: isFetchingRateByIdQuery,
    error: rateByIdQueryError,
    refetch: refetchRateByIdQuery,
  } = useGetRateByIdQuery(rateIdArg === skipToken ? skipToken : { id: rateIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createRate = useCallback(async (rate: CreateRateType): Promise<RateEntity> => {
    resetCreateMutation();
    return createMutation(rate).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadRates = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadRatesMutation(formData).unwrap();
  }, [uploadRatesMutation, resetUploadMutation]);

  const updateRate = useCallback(async (id: string, rate: UpdateRateType): Promise<RateEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...rate }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteRate = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteRateMutation(id).unwrap();
    return true;
  }, [deleteRateMutation, resetDeleteMutation]);

  const getAllRates = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<RateEntity>> => {
      const rate = await triggerGetAllRates(params).unwrap();
      return rate;
    },
    [triggerGetAllRates]
  );
  
  const getRateById = useCallback((id: string) => {
    setRateIdArg(id);
    return currentRateQueryRate || null;
  }, [currentRateQueryRate]);

  return {
    createRate,
    uploadRates,
    updateRate,
    deleteRate,
    getAllRates,
    getRateById,

    allRatesData: allRatesQueryRate,
    isLoadingAllRates: isLoadingAllRatesQuery,
    isFetchingAllRates: isFetchingAllRatesQuery,
    allRatesError: allRatesQueryError,

    currentRateData: currentRateQueryRate,
    isLoadingRateById: isLoadingRateByIdQuery,
    isFetchingRateById: isFetchingRateByIdQuery,
    rateByIdError: rateByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
