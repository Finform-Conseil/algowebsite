import { useState, useCallback }  from 'react';
import { 
  useCreateCoursMutation, 
  useDeleteCoursMutation, 
  useGetAllCoursQuery, 
  useLazyGetAllCoursQuery,
  useGetCoursByIdQuery,
  useUpdateCoursMutation, 
  useUploadCoursMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ICoursRepository } from '../../domain/repositories/cours.repository';
import { CreateCoursType, CoursType, UpdateCoursType, CoursQueryParams } from '@/core/domain/types/cours.type';
import { CoursEntity } from '@/core/domain/entities/cours.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { CoursUploadResponse } from '../store/api/cours.api';

export const useCoursRepository = (): ICoursRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateCoursMutation();

  const [
    uploadCoursMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadCoursMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateCoursMutation();

  const [
    deleteCoursMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteCoursMutation();

  const [coursIdArg, setCoursIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllCours,
    {
      data: allCoursQueryResult,
      isLoading: isLoadingAllCoursQuery,
      isFetching: isFetchingAllCoursQuery,
      error: allCoursQueryError,
    },
  ] = useLazyGetAllCoursQuery();

  const {
    data: currentCoursQueryResult,
    isLoading: isLoadingCoursByIdQuery,
    isFetching: isFetchingCoursByIdQuery,
    error: coursByIdQueryError,
    refetch: refetchCoursByIdQuery,
  } = useGetCoursByIdQuery(coursIdArg === skipToken ? skipToken : { id: coursIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createCours = useCallback(async (cours: CreateCoursType): Promise<CoursType> => {
    resetCreateMutation();
    return createMutation(cours).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadCours = useCallback(async (formData: FormData): Promise<CoursUploadResponse> => {
    resetUploadMutation();
    return await uploadCoursMutation(formData).unwrap();
  }, [uploadCoursMutation, resetUploadMutation]);

  const updateCours = useCallback(async (id: string, cours: UpdateCoursType): Promise<CoursType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...cours }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteCours = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteCoursMutation(id).unwrap();
    return true;
  }, [deleteCoursMutation, resetDeleteMutation]);

  const getAllCours = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<CoursEntity>> => {
      const result = await triggerGetAllCours(params).unwrap();
      return result;
    },
    [triggerGetAllCours]
  );
  
  const getCoursById = useCallback((id: string) => {
    setCoursIdArg(id);
    return currentCoursQueryResult || null;
  }, [currentCoursQueryResult]);

  return {
    createCours,
    uploadCours,
    updateCours,
    deleteCours,
    getAllCours,
    getCoursById,

    allCoursData: allCoursQueryResult,
    isLoadingAllCours: isLoadingAllCoursQuery,
    isFetchingAllCours: isFetchingAllCoursQuery,
    allCoursError: allCoursQueryError,

    currentCoursData: currentCoursQueryResult,
    isLoadingCoursById: isLoadingCoursByIdQuery,
    isFetchingCoursById: isFetchingCoursByIdQuery,
    coursByIdError: coursByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
