import { useState, useCallback }  from 'react';
import { 
  useCreateMacroMutation, 
  useDeleteMacroMutation, 
  useLazyGetAllSectorRealQuery, 
  useLazyGetAllSectorFinancesQuery, 
  useLazyGetAllSectorForeignQuery, 
  useLazyGetAllSectorMonetaryQuery, 
  useGetMacroByIdQuery,
  useUpdateMacroMutation, 
  useUploadSectorRealMutation,
  useUploadSectorFinancesMutation,
  useUploadSectorMonetaryMutation,
  useUploadSectorForeignMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { PaginatedResponse } from '../../domain/types/pagination.type';
import { IMacroRepository } from '@/core/domain/repositories/macro.repository';
import { MacroSectorValueEntity, MacroCountryDataEntity } from '@/core/domain/entities/macro.entity';
import { CreateMacroType, MacroQueryParams, MacroType, UpdateMacroType } from '@/core/domain/types/macro.type';

export const useMacroRepository = (): IMacroRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateMacroMutation();

  const [
    uploadSectorRealMutation,
    {
      isLoading: isSectorRealUploading,
      isSuccess: isSectorRealUploadSuccess,
      isError: isSectorRealUploadError,
      error: sectorRealUploadErrorData,
      reset: resetSectorRealUploadMutation,
    },
  ] = useUploadSectorRealMutation();

  const [
    uploadSectorFinancesMutation,
    {
      isLoading: isSectorFinancesUploading,
      isSuccess: isSectorFinancesUploadSuccess,
      isError: isSectorFinancesUploadError,
      error: sectorFinancesUploadErrorData,
      reset: resetSectorFinancesUploadMutation,
    },
  ] = useUploadSectorFinancesMutation();

  const [
    uploadSectorMonetaryMutation,
    {
      isLoading: isSectorMonetaryUploading,
      isSuccess: isSectorMonetaryUploadSuccess,
      isError: isSectorMonetaryUploadError,
      error: sectorMonetaryUploadErrorData,
      reset: resetSectorMonetaryUploadMutation,
    },
  ] = useUploadSectorMonetaryMutation();

  const [
    uploadSectorForeignMutation,
    {
      isLoading: isSectorForeignUploading,
      isSuccess: isSectorForeignUploadSuccess,
      isError: isSectorForeignUploadError,
      error: sectorForeignUploadErrorData,
      reset: resetSectorForeignUploadMutation,
    },
  ] = useUploadSectorForeignMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateMacroMutation();

  const [
    deleteMacroMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteMacroMutation();

  const [macroIdArg, setMacroIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllSectorReal,
    {
      data: allSectorRealQueryResult,
      isLoading: isLoadingAllSectorRealQuery,
      isFetching: isFetchingAllSectorRealQuery,
      error: allSectorRealQueryError,
    },
  ] = useLazyGetAllSectorRealQuery();

  const [
    triggerGetAllSectorFinances,
    {
      data: allSectorFinancesQueryResult,
      isLoading: isLoadingAllSectorFinancesQuery,
      isFetching: isFetchingAllSectorFinancesQuery,
      error: allSectorFinancesQueryError,
    },
  ] = useLazyGetAllSectorFinancesQuery();

  const [
    triggerGetAllSectorForeign,
    {
      data: allSectorForeignQueryResult,
      isLoading: isLoadingAllSectorForeignQuery,
      isFetching: isFetchingAllSectorForeignQuery,
      error: allSectorForeignQueryError,
    },
  ] = useLazyGetAllSectorForeignQuery();

  const [
    triggerGetAllSectorMonetary,
    {
      data: allSectorMonetaryQueryResult,
      isLoading: isLoadingAllSectorMonetaryQuery,
      isFetching: isFetchingAllSectorMonetaryQuery,
      error: allSectorMonetaryQueryError,
    },
  ] = useLazyGetAllSectorMonetaryQuery();

  const {
    data: currentMacroQueryResult,
    isLoading: isLoadingMacroByIdQuery,
    isFetching: isFetchingMacroByIdQuery,
    error: MacroByIdQueryError,
    refetch: refetchMacroByIdQuery,
  } = useGetMacroByIdQuery(macroIdArg === skipToken ? skipToken : { id: macroIdArg as string });

  const isMutationLoading = isCreating || isSectorRealUploading || isSectorFinancesUploading || isSectorMonetaryUploading || isSectorForeignUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isSectorRealUploadSuccess || isSectorFinancesUploadSuccess || isSectorMonetaryUploadSuccess || isSectorForeignUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isSectorRealUploadError || isSectorFinancesUploadError || isSectorMonetaryUploadError || isSectorForeignUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || sectorRealUploadErrorData || sectorFinancesUploadErrorData || sectorMonetaryUploadErrorData || sectorForeignUploadErrorData || updateErrorData || deletionErrorData;

  const createMacro = useCallback(async (Macro: CreateMacroType): Promise<MacroType> => {
    resetCreateMutation();
    return createMutation(Macro).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadSectorReal = useCallback(async (formData: any): Promise<void> => {
    resetSectorRealUploadMutation();
    await uploadSectorRealMutation(formData).unwrap();
  }, [uploadSectorRealMutation, resetSectorRealUploadMutation]);

  const uploadSectorFinances = useCallback(async (formData: any): Promise<void> => {
    resetSectorFinancesUploadMutation();
    await uploadSectorFinancesMutation(formData).unwrap();
  }, [uploadSectorFinancesMutation, resetSectorFinancesUploadMutation]);

  const uploadSectorMonetary = useCallback(async (formData: any): Promise<void> => {
    resetSectorMonetaryUploadMutation();
    await uploadSectorMonetaryMutation(formData).unwrap();
  }, [uploadSectorMonetaryMutation, resetSectorMonetaryUploadMutation]);

  const uploadSectorForeign = useCallback(async (formData: any): Promise<void> => {
    resetSectorForeignUploadMutation();
    await uploadSectorForeignMutation(formData).unwrap();
  }, [uploadSectorForeignMutation, resetSectorForeignUploadMutation]);

  const updateMacro = useCallback(async (id: string, Macro: UpdateMacroType): Promise<MacroType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...Macro }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteMacro = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteMacroMutation(id).unwrap();
    return true;
  }, [deleteMacroMutation, resetDeleteMutation]);

  const getAllSectorReal = useCallback(
    async (
      params: MacroQueryParams = {}
    ): Promise<MacroCountryDataEntity> => {
      const result = await triggerGetAllSectorReal(params).unwrap();
      return result;
    },
    [triggerGetAllSectorReal]
  );

  const getAllSectorMonetary = useCallback(
    async (
      params: MacroQueryParams = {}
    ): Promise<MacroCountryDataEntity> => {
      const result = await triggerGetAllSectorMonetary(params).unwrap();
      return result;
    },
    [triggerGetAllSectorMonetary]
  );

  const getAllSectorFinances = useCallback(
    async (
      params: MacroQueryParams = {}
    ): Promise<MacroCountryDataEntity> => {
      const result = await triggerGetAllSectorFinances(params).unwrap();
      return result;
    },
    [triggerGetAllSectorFinances]
  );

  const getAllSectorForeign = useCallback(
    async (
      params: MacroQueryParams = {}
    ): Promise<MacroCountryDataEntity> => {
      const result = await triggerGetAllSectorForeign(params).unwrap();
      return result;
    },
    [triggerGetAllSectorForeign]
  );

  const getMacroById = useCallback((id: string) => {
    setMacroIdArg(id);
    return currentMacroQueryResult || null;
  }, [currentMacroQueryResult]);

  return {
    createMacro,

    uploadSectorReal,
    uploadSectorFinances,
    uploadSectorMonetary,
    uploadSectorForeign,

    updateMacro,
    deleteMacro,

    getAllSectorReal,
    getAllSectorFinances,
    getAllSectorForeign,
    getAllSectorMonetary,
    getMacroById,

    allSectorRealData: allSectorRealQueryResult,
    allSectorForeignData: allSectorForeignQueryResult,
    allSectorMonetaryData: allSectorMonetaryQueryResult,
    allSectorFinancesData: allSectorFinancesQueryResult,

    currentMacroData: currentMacroQueryResult,
    isLoadingMacroById: isLoadingMacroByIdQuery,
    isFetchingMacroById: isFetchingMacroByIdQuery,
    statementByIdError: MacroByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
