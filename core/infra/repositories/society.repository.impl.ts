import { useState, useCallback }  from 'react';
import { 
  useCreateSocietyMutation, 
  useDeleteSocietyMutation, 
  useGetAllSocietiesQuery, 
  useLazyGetAllSocietiesQuery,
  useGetSocietyByIdQuery, 
  useUpdateSocietyMutation,
  useUploadSocietiesMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ISocietyRepository } from '../../domain/repositories/society.repository';
import { CreateSocietyType, SocietyType, UpdateSocietyType, SocietyQueryParams } from '@/core/domain/types/society.type';
import { SocietyEntity } from '@/core/domain/entities/society.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useSocietyRepository = (): ISocietyRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateSocietyMutation();

  const [
    uploadSocietiesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadSocietiesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateSocietyMutation();

  const [
    deleteSocietyMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteSocietyMutation();

  const [societyIdArg, setSocietyIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllSocieties,
    {
      data: allSocietiesQueryResult,
      isLoading: isLoadingAllSocietiesQuery,
      isFetching: isFetchingAllSocietiesQuery,
      error: allSocietiesQueryError,
    },
  ] = useLazyGetAllSocietiesQuery();
  

  const {
    data: currentSocietyQueryResult,
    isLoading: isLoadingSocietyByIdQuery,
    isFetching: isFetchingSocietyByIdQuery,
    error: societyByIdQueryError,
    refetch: refetchSocietyByIdQuery,
  } = useGetSocietyByIdQuery(societyIdArg === skipToken ? skipToken : { id: societyIdArg as string });

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccessOverall = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationErrorOverall = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationErrorOverall = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createSociety = useCallback(async (society: CreateSocietyType): Promise<SocietyType> => {
    resetCreateMutation();
    return createMutation(society).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadSocieties = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadSocietiesMutation(formData).unwrap();
  }, [uploadSocietiesMutation, resetUploadMutation]);

  const updateSociety = useCallback(async (id: string, society: UpdateSocietyType): Promise<SocietyType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...society }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteSociety = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteSocietyMutation(id).unwrap();
    return true;
  }, [deleteSocietyMutation, resetDeleteMutation]);

    const getAllSocieties = useCallback(
      async (
        params: QueryParams = {}
      ): Promise<PaginatedResponse<SocietyEntity>> => {
        const result = await triggerGetAllSocieties(params).unwrap();
        return result;
      },
      [triggerGetAllSocieties]
    );

  const getSocietyById = useCallback((id: string) => {
    setSocietyIdArg(id);
    return currentSocietyQueryResult || null;
  }, [currentSocietyQueryResult]);

  return {
    createSociety,
    uploadSocieties,
    updateSociety,
    deleteSociety,
    getAllSocieties,
    getSocietyById,

    allSocietiesData: allSocietiesQueryResult,
    isLoadingAllSocieties: isLoadingAllSocietiesQuery,
    isFetchingAllSocieties: isFetchingAllSocietiesQuery,
    allSocietiesError: allSocietiesQueryError,

    currentSocietyData: currentSocietyQueryResult,
    isLoadingSocietyById: isLoadingSocietyByIdQuery,
    isFetchingSocietyById: isFetchingSocietyByIdQuery,
    societyByIdError: societyByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
