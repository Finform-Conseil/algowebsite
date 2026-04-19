import { useState, useCallback }  from 'react';
import { 
  useCreateSheetMutation, 
  useDeleteSheetMutation, 
  useGetAllSheetsQuery, 
  useLazyGetAllSheetsQuery,
  useGetSheetByIdQuery,
  useUpdateSheetMutation, 
  useUploadSheetMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateSheetType, SheetType, UpdateSheetType, SheetQueryParams } from '@/core/domain/types/sheet.type';
import { SheetEntity } from '@/core/domain/entities/sheet.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { ISheetRepository } from '@/core/domain/repositories/sheet.repository';

export const useSheetRepository = (): ISheetRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateSheetMutation();

  const [
    uploadSheetsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadSheetMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateSheetMutation();

  const [
    deleteSheetMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteSheetMutation();

  const [sheetIdArg, setSheetIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllSheets,
    {
      data: allSheetsQueryResult,
      isLoading: isLoadingAllSheetsQuery,
      isFetching: isFetchingAllSheetsQuery,
      error: allSheetsQueryError,
    },
  ] = useLazyGetAllSheetsQuery();

  const {
    data: currentSheetQueryResult,
    isLoading: isLoadingSheetByIdQuery,
    isFetching: isFetchingSheetByIdQuery,
    error: SheetByIdQueryError,
    refetch: refetchSheetByIdQuery,
  } = useGetSheetByIdQuery(sheetIdArg === skipToken ? skipToken : { id: sheetIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createSheet = useCallback(async (Sheet: CreateSheetType): Promise<SheetEntity> => {
    resetCreateMutation();
    return createMutation(Sheet).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadSheets = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadSheetsMutation(formData).unwrap();
  }, [uploadSheetsMutation, resetUploadMutation]);

  const updateSheet = useCallback(async (id: string, Sheet: UpdateSheetType): Promise<SheetEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...Sheet }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteSheet = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteSheetMutation(id).unwrap();
    return true;
  }, [deleteSheetMutation, resetDeleteMutation]);

  const getAllSheets = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<SheetEntity>> => {
      const result = await triggerGetAllSheets(params).unwrap();
      return result;
    },
    [triggerGetAllSheets]
  );
  
  const getSheetById = useCallback((id: string) => {
    setSheetIdArg(id);
    return currentSheetQueryResult || null;
  }, [currentSheetQueryResult]);

  return {
    createSheet,
    uploadSheets,
    updateSheet,
    deleteSheet,
    getAllSheets,
    getSheetById,

    allSheetsData: allSheetsQueryResult,
    isLoadingAllSheets: isLoadingAllSheetsQuery,
    isFetchingAllSheets: isFetchingAllSheetsQuery,
    allSheetsError: allSheetsQueryError,

    currentSheetData: currentSheetQueryResult,
    isLoadingSheetById: isLoadingSheetByIdQuery,
    isFetchingSheetById: isFetchingSheetByIdQuery,
    sheetByIdError: SheetByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
