import { useState, useCallback }  from 'react';
import { 
  useCreateIndustryMutation, 
  useDeleteIndustryMutation, 
  useGetAllIndustriesQuery, 
  useLazyGetAllIndustriesQuery,
  useGetIndustryByIdQuery,
  useUpdateIndustryMutation, 
  useUploadIndustriesMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IIndustryRepository } from '../../domain/repositories/industry.repository';
import { CreateIndustryType, IndustryType, UpdateIndustryType, IndustryQueryParams } from '@/core/domain/types/industry.type';
import { IndustryEntity } from '@/core/domain/entities/industry.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';

export const useIndustryRepository = (): IIndustryRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateIndustryMutation();

  const [
    uploadIndustriesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadIndustriesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateIndustryMutation();

  const [
    deleteIndustryMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteIndustryMutation();

  const [industryIdArg, setIndustryIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllIndustries,
    {
      data: allIndustriesQueryResult,
      isLoading: isLoadingAllIndustriesQuery,
      isFetching: isFetchingAllIndustriesQuery,
      error: allIndustriesQueryError,
    },
  ] = useLazyGetAllIndustriesQuery();

  const {
    data: currentIndustryQueryResult,
    isLoading: isLoadingIndustryByIdQuery,
    isFetching: isFetchingIndustryByIdQuery,
    error: industryByIdQueryError,
    refetch: refetchIndustryByIdQuery,
  } = useGetIndustryByIdQuery(industryIdArg === skipToken ? skipToken : { id: industryIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createIndustry = useCallback(async (industry: CreateIndustryType): Promise<IndustryType> => {
    resetCreateMutation();
    return createMutation(industry).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadIndustries = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadIndustriesMutation(formData).unwrap();
  }, [uploadIndustriesMutation, resetUploadMutation]);

  const updateIndustry = useCallback(async (id: string, industry: UpdateIndustryType): Promise<IndustryType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...industry }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteIndustry = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteIndustryMutation(id).unwrap();
    return true;
  }, [deleteIndustryMutation, resetDeleteMutation]);

  const getAllIndustries = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<IndustryEntity>> => {
      const result = await triggerGetAllIndustries(params).unwrap();
      return result;
    },
    [triggerGetAllIndustries]
  );
  
  const getIndustryById = useCallback((id: string) => {
    setIndustryIdArg(id);
    return currentIndustryQueryResult || null;
  }, [currentIndustryQueryResult]);

  return {
    createIndustry,
    uploadIndustries,
    updateIndustry,
    deleteIndustry,
    getAllIndustries,
    getIndustryById,

    allIndustriesData: allIndustriesQueryResult,
    isLoadingAllIndustries: isLoadingAllIndustriesQuery,
    isFetchingAllIndustries: isFetchingAllIndustriesQuery,
    allIndustriesError: allIndustriesQueryError,

    currentIndustryData: currentIndustryQueryResult,
    isLoadingIndustryById: isLoadingIndustryByIdQuery,
    isFetchingIndustryById: isFetchingIndustryByIdQuery,
    industryByIdError: industryByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
