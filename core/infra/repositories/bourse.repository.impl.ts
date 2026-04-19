import { useState, useCallback }  from 'react';
import { 
  useCreateBourseMutation, 
  useDeleteBourseMutation, 
  useGetAllBoursesQuery,
  useLazyGetAllBoursesQuery,
  useGetBourseByIdQuery,
  useUpdateBourseMutation, 
  useUploadBoursesMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IBourseRepository } from '../../domain/repositories/bourse.repository';
import { CreateBourseType, BourseType, UpdateBourseType } from '../../domain/types/bourse.type';
import { BourseEntity } from '@/core/domain/entities/bourse.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useBourseRepository = (): IBourseRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateBourseMutation();

  const [
    uploadBoursesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadBoursesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateBourseMutation();

  const [
    deleteBourseMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteBourseMutation();

  const [bourseIdArg, setBourseIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllBourses,
    {
      data: allBoursesQueryResult,
      isLoading: isLoadingAllBoursesQuery,
      isFetching: isFetchingAllBoursesQuery,
      error: allBoursesQueryError,
    },
  ] = useLazyGetAllBoursesQuery();

  const {
    data: currentBourseQueryResult,
    isLoading: isLoadingBourseByIdQuery,
    isFetching: isFetchingBourseByIdQuery,
    error: bourseByIdQueryError,
    refetch: refetchBourseByIdQuery,
  } = useGetBourseByIdQuery(bourseIdArg === skipToken ? skipToken : { id: bourseIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createBourse = useCallback(async (bourse: CreateBourseType): Promise<BourseType> => {
    resetCreateMutation();
    return createMutation(bourse).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadBourses = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadBoursesMutation(formData).unwrap();
  }, [uploadBoursesMutation, resetUploadMutation]);

  const updateBourse = useCallback(async (id: string, bourse: UpdateBourseType): Promise<BourseType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...bourse }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteBourse = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteBourseMutation(id).unwrap();
    return true;
  }, [deleteBourseMutation, resetDeleteMutation]);

  const getAllBourses = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<BourseEntity>> => {
      const result = await triggerGetAllBourses(params).unwrap();
      return result;
    },
    [triggerGetAllBourses]
  );
  

  const getBourseById = useCallback((id: string) => {
    setBourseIdArg(id);
    return currentBourseQueryResult || null;
  }, [currentBourseQueryResult]);

  return {
    createBourse,
    uploadBourses,
    updateBourse,
    deleteBourse,
    getAllBourses,
    getBourseById,

    allBoursesData: allBoursesQueryResult,
    isLoadingAllBourses: isLoadingAllBoursesQuery,
    isFetchingAllBourses: isFetchingAllBoursesQuery,
    allBoursesError: allBoursesQueryError,

    currentBourseData: currentBourseQueryResult,
    isLoadingBourseById: isLoadingBourseByIdQuery,
    isFetchingBourseById: isFetchingBourseByIdQuery,
    bourseByIdError: bourseByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};