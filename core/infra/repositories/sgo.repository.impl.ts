import { useState, useCallback }  from 'react';
import { 
  useCreateSgoMutation, 
  useDeleteSgoMutation, 
  useGetAllSgosQuery, 
  useLazyGetAllSgosQuery,
  useGetSgoByIdQuery,
  useUpdateSgoMutation, 
  useUploadSgoMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateSgoType, UpdateSgoType } from '@/core/domain/types/sgo.type';
import { SGOEntity } from '@/core/domain/entities/sgo.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { ISgoRepository } from '@/core/domain/repositories/sgo.repository';

export const useSgoRepository = (): ISgoRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateSgoMutation();

  const [
    uploadSgosMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadSgoMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateSgoMutation();

  const [
    deleteSgoMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteSgoMutation();

  const [sgoIdArg, setSgoIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllSgos,
    {
      data: allSgosQueryResult,
      isLoading: isLoadingAllSgosQuery,
      isFetching: isFetchingAllSgosQuery,
      error: allSgosQueryError,
    },
  ] = useLazyGetAllSgosQuery();

  const {
    data: currentSgoQueryResult,
    isLoading: isLoadingSgoByIdQuery,
    isFetching: isFetchingSgoByIdQuery,
    error: SgoByIdQueryError,
    refetch: refetchSgoByIdQuery,
  } = useGetSgoByIdQuery(sgoIdArg === skipToken ? skipToken : { id: sgoIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createSgo = useCallback(async (Sgo: CreateSgoType): Promise<SGOEntity> => {
    resetCreateMutation();
    return createMutation(Sgo).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadSgos = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadSgosMutation(formData).unwrap();
  }, [uploadSgosMutation, resetUploadMutation]);

  const updateSgo = useCallback(async (id: string, Sgo: UpdateSgoType): Promise<SGOEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...Sgo }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteSgo = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteSgoMutation(id).unwrap();
    return true;
  }, [deleteSgoMutation, resetDeleteMutation]);

  const getAllSgos = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<SGOEntity>> => {
      const result = await triggerGetAllSgos(params).unwrap();
      return result;
    },
    [triggerGetAllSgos]
  );
  
  const getSgoById = useCallback((id: string) => {
    setSgoIdArg(id);
    return currentSgoQueryResult || null;
  }, [currentSgoQueryResult]);

  return {
    createSgo,
    uploadSgos,
    updateSgo,
    deleteSgo,
    getAllSgos,
    getSgoById,

    allSgosData: allSgosQueryResult,
    isLoadingAllSgos: isLoadingAllSgosQuery,
    isFetchingAllSgos: isFetchingAllSgosQuery,
    allSgosError: allSgosQueryError,

    currentSgoData: currentSgoQueryResult,
    isLoadingSgoById: isLoadingSgoByIdQuery,
    isFetchingSgoById: isFetchingSgoByIdQuery,
    sgoByIdError: SgoByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
