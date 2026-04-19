import { useState, useCallback } from 'react';
import { 
  useCreateOpcvmMutation, 
  useDeleteOpcvmMutation, 
  useGetAllOpcvmsQuery,
  useLazyGetAllOpcvmsQuery,
  useGetOpcvmByIdQuery,
  useUpdateOpcvmMutation, 
  useUploadOpcvmsMutation, 

  useGetAllOpcvmMetricsQuery,
  useLazyGetAllOpcvmMetricsQuery,
  useGetOpcvmMetricByIdQuery,
  useUpdateOpcvmMetricMutation, 
  useCreateOpcvmMetricMutation, 
  useDeleteOpcvmMetricMutation,
  useUploadOpcvmMetricsMutation, 
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IOpcvmMetricRepository, IOpcvmRepository } from '../../domain/repositories/opcvm.repository';
import { CreateOpcvmMetricType, CreateOpcvmType, OpcvmMetricType, OpcvmType, UpdateOpcvmMetricType, UpdateOpcvmType } from '../../domain/types/opcvm.type';
import { OPCVMEntity, OPCVMMetricEntity } from '@/core/domain/entities/opcvm.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useOpcvmRepository = (): IOpcvmRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateOpcvmMutation();

  const [
    uploadOpcvmsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadOpcvmsMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateOpcvmMutation();

  const [
    deleteOpcvmMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteOpcvmMutation();

  const [opcvmIdArg, setOpcvmIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllOpcvms,
    {
      data: allOpcvmsQueryResult,
      isLoading: isLoadingAllOpcvmsQuery,
      isFetching: isFetchingAllOpcvmsQuery,
      error: allOpcvmsQueryError,
    },
  ] = useLazyGetAllOpcvmsQuery();

  const {
    data: currentOpcvmQueryResult,
    isLoading: isLoadingOpcvmByIdQuery,
    isFetching: isFetchingOpcvmByIdQuery,
    error: opcvmByIdQueryError,
    refetch: refetchOpcvmByIdQuery,
  } = useGetOpcvmByIdQuery(opcvmIdArg === skipToken ? skipToken : { id: opcvmIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createOpcvm = useCallback(async (opcvm: CreateOpcvmType): Promise<OpcvmType> => {
    resetCreateMutation();
    return createMutation(opcvm).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadOpcvms = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadOpcvmsMutation(formData).unwrap();
  }, [uploadOpcvmsMutation, resetUploadMutation]);

  const updateOpcvm = useCallback(async (id: string, opcvm: UpdateOpcvmType): Promise<OpcvmType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...opcvm }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteOpcvm = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteOpcvmMutation(id).unwrap();
    return true;
  }, [deleteOpcvmMutation, resetDeleteMutation]);

  const getAllOpcvms = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<OPCVMEntity>> => {
      const result = await triggerGetAllOpcvms(params).unwrap();
      return result;
    },
    [triggerGetAllOpcvms]
  );

  const getOpcvmById = useCallback((id: string) => {
    setOpcvmIdArg(id);
    return currentOpcvmQueryResult || null;
  }, [currentOpcvmQueryResult]);

  return {
    createOpcvm,
    uploadOpcvms,
    updateOpcvm,
    deleteOpcvm,
    getAllOpcvms,
    getOpcvmById,

    allOpcvmsData: allOpcvmsQueryResult,
    isLoadingAllOpcvms: isLoadingAllOpcvmsQuery,
    isFetchingAllOpcvms: isFetchingAllOpcvmsQuery,
    allOpcvmsError: allOpcvmsQueryError,

    currentOpcvmData: currentOpcvmQueryResult,
    isLoadingOpcvmById: isLoadingOpcvmByIdQuery,
    isFetchingOpcvmById: isFetchingOpcvmByIdQuery,
    opcvmByIdError: opcvmByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};

export const useOpcvmMetricRepository = (): IOpcvmMetricRepository => {
  const [
    createOpcvmMetricMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateOpcvmMetricMutation();

  const [
    uploadOpcvmMetricsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadOpcvmMetricsMutation();

  const [
    updateOpcvmMetricMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateOpcvmMetricMutation();

  const [
    deleteOpcvmMetricMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteOpcvmMetricMutation();

  const [opcvmIdArg, setOpcvmIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllOpcvms,
    {
      data: allOpcvmMetricsQueryResult,
      isLoading: isLoadingAllOpcvmMetricsQuery,
      isFetching: isFetchingAllOpcvmMetricsQuery,
      error: allOpcvmMetricsQueryError,
    },
  ] = useLazyGetAllOpcvmMetricsQuery();

  const {
    data: currentOpcvmMetricQueryResult,
    isLoading: isLoadingOpcvmMetricByIdQuery,
    isFetching: isFetchingOpcvmMetricByIdQuery,
    error: opcvmMetricByIdQueryError,
    refetch: refetchOpcvmMetricByIdQuery,
  } = useGetOpcvmMetricByIdQuery(opcvmIdArg === skipToken ? skipToken : { id: opcvmIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createOpcvmMetric = useCallback(async (opcvm: CreateOpcvmMetricType): Promise<OpcvmMetricType> => {
    resetCreateMutation();
    return createOpcvmMetricMutation(opcvm).unwrap();
  }, [createOpcvmMetricMutation, resetCreateMutation]);

  const uploadOpcvmMetrics = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadOpcvmMetricsMutation(formData).unwrap();
  }, [uploadOpcvmMetricsMutation, resetUploadMutation]);

  const updateOpcvmMetric = useCallback(async (id: string, opcvm: UpdateOpcvmMetricType): Promise<OpcvmMetricType | null> => {
    resetUpdateMutation();
    return updateOpcvmMetricMutation({ id, ...opcvm }).unwrap();
  }, [updateOpcvmMetricMutation, resetUpdateMutation]);

  const deleteOpcvmMetric = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteOpcvmMetricMutation(id).unwrap();
    return true;
  }, [deleteOpcvmMetricMutation, resetDeleteMutation]);

  const getAllOpcvmMetrics = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<OPCVMMetricEntity>> => {
      const result = await triggerGetAllOpcvms(params).unwrap();
      return result;
    },
    [triggerGetAllOpcvms]
  );

  const getOpcvmMetricById = useCallback((id: string) => {
    setOpcvmIdArg(id);
    return currentOpcvmMetricQueryResult || null;
  }, [currentOpcvmMetricQueryResult]);

  return {
    createOpcvmMetric,
    uploadOpcvmMetrics,
    updateOpcvmMetric,
    deleteOpcvmMetric,
    getAllOpcvmMetrics,
    getOpcvmMetricById,

    allOpcvmMetricsData: allOpcvmMetricsQueryResult,
    isLoadingAllOpcvmMetrics: isLoadingAllOpcvmMetricsQuery,
    isFetchingAllOpcvmMetrics: isFetchingAllOpcvmMetricsQuery,
    allOpcvmMetricsError: allOpcvmMetricsQueryError,

    currentOpcvmMetricData: currentOpcvmMetricQueryResult,
    isLoadingOpcvmMetricById: isLoadingOpcvmMetricByIdQuery,
    isFetchingOpcvmMetricById: isFetchingOpcvmMetricByIdQuery,
    opcvmMetricByIdError: opcvmMetricByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};
