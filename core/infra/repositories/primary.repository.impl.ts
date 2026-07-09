import { useState, useCallback } from 'react';
import { 
  useCreatePrimaryMutation, 
  useDeletePrimaryMutation, 
  useGetAllPrimariesQuery,
  useLazyGetAllPrimariesQuery,
  useGetPrimaryByIdQuery,
  useLazyGetBondCashflowsBySecurityQuery,
  useUpdatePrimaryMutation, 
  useUploadPrimariesMutation, 
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IOpcvmMetricRepository, IOpcvmRepository } from '../../domain/repositories/opcvm.repository';
import { CreatePrimaryType, PrimaryType, UpdatePrimaryType } from '../../domain/types/primary.type';
import { PrimaryEntity } from '@/core/domain/entities/primary.entity';
import { BondCashflowEntity } from '@/core/domain/entities/bond-cashflow.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';
import { IPrimaryRepository } from '../../domain/repositories/primary.repository';

export const usePrimaryRepository = (): IPrimaryRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreatePrimaryMutation();

  const [
    uploadPrimariesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadPrimariesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdatePrimaryMutation();

  const [
    deletePrimaryMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeletePrimaryMutation();

  const [primaryIdArg, setPrimaryIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllPrimaries,
    {
      data: allPrimariesQueryResult,
      isLoading: isLoadingAllPrimariesQuery,
      isFetching: isFetchingAllPrimariesQuery,
      error: allPrimariesQueryError,
    },
  ] = useLazyGetAllPrimariesQuery();

  const {
    data: currentPrimaryQueryResult,
    isLoading: isLoadingPrimaryByIdQuery,
    isFetching: isFetchingPrimaryByIdQuery,
    error: primaryByIdQueryError,
    refetch: refetchPrimaryByIdQuery,
  } = useGetPrimaryByIdQuery(primaryIdArg === skipToken ? skipToken : { id: primaryIdArg as string }, {});

  const [
    triggerGetBondCashflowsBySecurity,
    {
      data: bondCashflowsQueryResult,
      isLoading: isLoadingBondCashflowsQuery,
      isFetching: isFetchingBondCashflowsQuery,
      error: bondCashflowsQueryError,
    },
  ] = useLazyGetBondCashflowsBySecurityQuery();

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createPrimary = useCallback(async (primary: CreatePrimaryType): Promise<PrimaryEntity> => {
    resetCreateMutation();
    return createMutation(primary).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadPrimaries = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadPrimariesMutation(formData).unwrap();
  }, [uploadPrimariesMutation, resetUploadMutation]);

  const updatePrimary = useCallback(async (id: string, primary: UpdatePrimaryType): Promise<PrimaryEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...primary }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deletePrimary = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deletePrimaryMutation(id).unwrap();
    return true;
  }, [deletePrimaryMutation, resetDeleteMutation]);

  const getAllPrimaries = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<PrimaryEntity>> => {
      const result = await triggerGetAllPrimaries(params).unwrap();
      return result;
    },
    [triggerGetAllPrimaries]
  );

  const getPrimaryById = useCallback((id: string) => {
    setPrimaryIdArg(id);
    return currentPrimaryQueryResult || null;
  }, [currentPrimaryQueryResult]);

  const getBondCashflowsBySecurity = useCallback(
    async (
      securityId: string,
      params: QueryParams = {}
    ): Promise<PaginatedResponse<BondCashflowEntity>> => {
      const result = await triggerGetBondCashflowsBySecurity({
        security: securityId,
        ...params,
      }).unwrap();
      return result;
    },
    [triggerGetBondCashflowsBySecurity]
  );

  return {
    createPrimary,
    uploadPrimaries,
    updatePrimary,
    deletePrimary,
    getAllPrimaries,
    getPrimaryById,
    getBondCashflowsBySecurity,

    allPrimariesData: allPrimariesQueryResult,
    isLoadingAllPrimaries: isLoadingAllPrimariesQuery,
    isFetchingAllPrimaries: isFetchingAllPrimariesQuery,
    allPrimariesError: allPrimariesQueryError,

    currentPrimaryData: currentPrimaryQueryResult,
    isLoadingPrimaryById: isLoadingPrimaryByIdQuery,
    isFetchingPrimaryById: isFetchingPrimaryByIdQuery,
    primaryByIdError: primaryByIdQueryError,

    bondCashflowsData: bondCashflowsQueryResult,
    isLoadingBondCashflows: isLoadingBondCashflowsQuery,
    isFetchingBondCashflows: isFetchingBondCashflowsQuery,
    bondCashflowsError: bondCashflowsQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};