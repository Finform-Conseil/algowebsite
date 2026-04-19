import { useState, useCallback } from 'react';
import { 
  useCreateIndiceMutation, 
  useDeleteIndiceMutation, 
  useGetAllIndicesQuery,
  useLazyGetAllIndicesQuery,
  useLazyGetIndicesCoursByIndiceQuery,
  useGetIndiceByIdQuery,
  useUpdateIndiceMutation, 
  useUploadIndicesMutation,
  useUploadIndicesCoursMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IIndiceRepository } from '../../domain/repositories/indice.repository';
import { CreateIndiceType, IndiceType, UpdateIndiceType } from '../../domain/types/indice.type';
import { IndiceCoursEntity, IndiceEntity } from '@/core/domain/entities/indice.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useIndiceRepository = (): IIndiceRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateIndiceMutation();

  const [
    uploadIndicesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadIndicesMutation();

  const [
    uploadIndicesCoursMutation,
    {
      isLoading: isCoursUploading,
      isSuccess: isCoursUploadSuccess,
      isError: isCoursUploadError,
      error: coursUploadErrorData,
      reset: resetCoursUploadMutation,
    },
  ] = useUploadIndicesCoursMutation();


  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateIndiceMutation();

  const [
    deleteIndiceMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteIndiceMutation();

  const [indiceIdArg, setIndiceIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllIndices,
    {
      data: allIndicesQueryResult,
      isLoading: isLoadingAllIndicesQuery,
      isFetching: isFetchingAllIndicesQuery,
      error: allIndicesQueryError,
    },
  ] = useLazyGetAllIndicesQuery();
  
  const [
    triggerGetIndicesCoursByIndice,
    {
      data: indicesCoursQueryResult,
      isLoading: isLoadingIndicesCoursQuery,
      isFetching: isFetchingIndicesCoursQuery,
      error: indicesCoursQueryError,
    },
  ] = useLazyGetIndicesCoursByIndiceQuery();

  const {
    data: currentIndiceQueryResult,
    isLoading: isLoadingIndiceByIdQuery,
    isFetching: isFetchingIndiceByIdQuery,
    error: indiceByIdQueryError,
    refetch: refetchIndiceByIdQuery,
  } = useGetIndiceByIdQuery(indiceIdArg === skipToken ? skipToken : { id: indiceIdArg as string }, {});

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading || isCoursUploading || isLoadingIndicesCoursQuery;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess || isCoursUploadSuccess || isFetchingIndicesCoursQuery;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError || isCoursUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData || coursUploadErrorData;

  const createIndice = useCallback(async (indice: CreateIndiceType): Promise<IndiceType> => {
    resetCreateMutation();
    return createMutation(indice).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadIndices = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadIndicesMutation(formData).unwrap();
  }, [uploadIndicesMutation, resetUploadMutation]);

  const uploadIndicesCours = useCallback(async (formData: any): Promise<void> => {
    resetCoursUploadMutation();
    await uploadIndicesCoursMutation(formData).unwrap();
  }, [uploadIndicesCoursMutation, resetCoursUploadMutation]);

  const updateIndice = useCallback(async (id: string, indice: UpdateIndiceType): Promise<IndiceType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...indice }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteIndice = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteIndiceMutation(id).unwrap();
    return true;
  }, [deleteIndiceMutation, resetDeleteMutation]);

  const getAllIndices = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<IndiceEntity>> => {
      const result = await triggerGetAllIndices(params).unwrap();
      return result;
    },
    [triggerGetAllIndices]
  );

  const getIndicesCoursByIndice = useCallback(
    async (
      indice: string,
      params: QueryParams = {}
    ): Promise<PaginatedResponse<IndiceCoursEntity>> => {
      const result = await triggerGetIndicesCoursByIndice({ indice, ...params }).unwrap();
      return result;
    },
    [triggerGetIndicesCoursByIndice]
  );

  const getIndiceById = useCallback((id: string) => {
    setIndiceIdArg(id);
    return currentIndiceQueryResult || null;
  }, [currentIndiceQueryResult]);

  return {
    createIndice,
    uploadIndices,
    uploadIndicesCours,
    updateIndice,
    deleteIndice,
    getAllIndices,
    getIndicesCoursByIndice,
    getIndiceById,

    allIndicesData: allIndicesQueryResult,
    isLoadingAllIndices: isLoadingAllIndicesQuery,
    isFetchingAllIndices: isFetchingAllIndicesQuery,
    allIndicesError: allIndicesQueryError,

    currentIndiceData: currentIndiceQueryResult,
    isLoadingIndiceById: isLoadingIndiceByIdQuery,
    isFetchingIndiceById: isFetchingIndiceByIdQuery,
    indiceByIdError: indiceByIdQueryError,

    allIndicesCoursByIndiceData: indicesCoursQueryResult,
    isLoadingAllIndicesCoursByIndice: isLoadingIndicesCoursQuery,
    isFetchingAllIndicesCoursByIndice: isFetchingIndicesCoursQuery,
    allIndicesCoursByIndiceError: indicesCoursQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};
