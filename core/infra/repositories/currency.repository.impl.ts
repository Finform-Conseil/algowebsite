import { useState, useCallback }  from 'react';
import { 
  useCreateCurrencyMutation, 
  useDeleteCurrencyMutation, 
  useGetAllCurrenciesQuery,
  useLazyGetAllCurrenciesQuery,
  useGetCurrencyByIdQuery,
  useUpdateCurrencyMutation, 
  useUploadCurrenciesMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ICurrencyRepository } from '../../domain/repositories/currency.repository';
import { CreateCurrencyType, CurrencyType, UpdateCurrencyType } from '../../domain/types/currency.type';
import { CurrencyEntity } from '../../domain/entities/currency.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';

export const useCurrencyRepository = (): ICurrencyRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateCurrencyMutation();

  const [
    uploadCurrenciesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadCurrenciesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateCurrencyMutation();

  const [
    deleteCurrencyMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteCurrencyMutation();

  const [currencyIdArg, setCurrencyIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllCurrencies,
    {
      data: allCurrenciesQueryResult,
      isLoading: isLoadingAllCurrenciesQuery,
      isFetching: isFetchingAllCurrenciesQuery,
      error: allCurrenciesQueryError,
    },
  ] = useLazyGetAllCurrenciesQuery();

  const {
    data: currentCurrencyQueryResult,
    isLoading: isLoadingCurrencyByIdQuery,
    isFetching: isFetchingCurrencyByIdQuery,
    error: currencyByIdQueryError,
    refetch: refetchCurrencyByIdQuery,
  } = useGetCurrencyByIdQuery(currencyIdArg === skipToken ? skipToken : { id: currencyIdArg as string });

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccessOverall = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationErrorOverall = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationErrorOverall = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createCurrency = useCallback(async (currency: CreateCurrencyType): Promise<CurrencyEntity> => {
    resetCreateMutation();
    return createMutation(currency).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadCurrencies = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadCurrenciesMutation(formData).unwrap();
  }, [uploadCurrenciesMutation, resetUploadMutation]);

  const updateCurrency = useCallback(async (id: string, currency: UpdateCurrencyType): Promise<CurrencyEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...currency }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteCurrency = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteCurrencyMutation(id).unwrap();
    return true;
  }, [deleteCurrencyMutation, resetDeleteMutation]);

  const getAllCurrencies = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<CurrencyEntity>> => {
      const result = await triggerGetAllCurrencies(params).unwrap();
      return result;
    },
    [triggerGetAllCurrencies]
  );

  const getCurrencyById = useCallback((id: string) => {
    setCurrencyIdArg(id);
    return currentCurrencyQueryResult || null;
  }, [currentCurrencyQueryResult]);

  return {
    createCurrency,
    uploadCurrencies,
    updateCurrency,
    deleteCurrency,
    getAllCurrencies,
    getCurrencyById,

    allCurrenciesData: allCurrenciesQueryResult,
    isLoadingAllCurrencies: isLoadingAllCurrenciesQuery,
    isFetchingAllCurrencies: isFetchingAllCurrenciesQuery,
    allCurrenciesError: allCurrenciesQueryError,

    currentCurrencyData: currentCurrencyQueryResult,
    isLoadingCurrencyById: isLoadingCurrencyByIdQuery,
    isFetchingCurrencyById: isFetchingCurrencyByIdQuery,
    currencyByIdError: currencyByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
