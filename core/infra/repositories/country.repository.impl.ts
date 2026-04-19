import { useState, useCallback }  from 'react';
import { 
  useCreateCountryMutation, 
  useDeleteCountryMutation, 
  useGetAllCountriesQuery, 
  useLazyGetAllCountriesQuery,
  useGetCountryByIdQuery,
  useUpdateCountryMutation, 
  useUploadCountriesMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ICountryRepository } from '../../domain/repositories/country.repository';
import { CreateCountryType, CountryType, UpdateCountryType, CountryQueryParams } from '@/core/domain/types/country.type';
import { CountryEntity } from '@/core/domain/entities/country.entity';
import { PaginatedResponse, QueryParams } from '@/core/domain/types/pagination.type';

export const useCountryRepository = (): ICountryRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateCountryMutation();

  const [
    uploadCountriesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadCountriesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateCountryMutation();

  const [
    deleteCountryMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteCountryMutation();

  const [countryIdArg, setCountryIdArg] = useState<string | typeof skipToken>(skipToken);

    const [
      triggerGetAllCountries,
      {
        data: allCountriesQueryResult,
        isLoading: isLoadingAllCountriesQuery,
        isFetching: isFetchingAllCountriesQuery,
        error: allCountriesQueryError,
      },
    ] = useLazyGetAllCountriesQuery();

  const {
    data: currentCountryQueryResult,
    isLoading: isLoadingCountryByIdQuery,
    isFetching: isFetchingCountryByIdQuery,
    error: countryByIdQueryError,
    refetch: refetchCountryByIdQuery,
  } = useGetCountryByIdQuery(countryIdArg === skipToken ? skipToken : { id: countryIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createCountry = useCallback(async (country: CreateCountryType): Promise<CountryType> => {
    resetCreateMutation();
    return createMutation(country).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadCountries = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadCountriesMutation(formData).unwrap();
  }, [uploadCountriesMutation, resetUploadMutation]);

  const updateCountry = useCallback(async (id: string, country: UpdateCountryType): Promise<CountryType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...country }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteCountry = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteCountryMutation(id).unwrap();
    return true;
  }, [deleteCountryMutation, resetDeleteMutation]);

    const getAllCountries = useCallback(
      async (
        params: QueryParams = {}
      ): Promise<PaginatedResponse<CountryEntity>> => {
        const result = await triggerGetAllCountries(params).unwrap();
        return result;
      },
      [triggerGetAllCountries]
    );

  const getCountryById = useCallback((id: string) => {
    setCountryIdArg(id);
    return currentCountryQueryResult || null;
  }, [currentCountryQueryResult]);

  return {
    createCountry,
    uploadCountries,
    updateCountry,
    deleteCountry,
    getAllCountries,
    getCountryById,

    allCountriesData: allCountriesQueryResult,
    isLoadingAllCountries: isLoadingAllCountriesQuery,
    isFetchingAllCountries: isFetchingAllCountriesQuery,
    allCountriesError: allCountriesQueryError,

    currentCountryData: currentCountryQueryResult,
    isLoadingCountryById: isLoadingCountryByIdQuery,
    isFetchingCountryById: isFetchingCountryByIdQuery,
    countryByIdError: countryByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
