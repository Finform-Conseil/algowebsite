import { useState, useCallback }  from 'react';
import { 
  useCreateSectorMutation, 
  useDeleteSectorMutation, 
  useGetAllSectorsQuery,
  useLazyGetAllSectorsQuery,
  useGetSectorByIdQuery,
  useUpdateSectorMutation, 
  useUploadSectorsMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ISectorRepository } from '../../domain/repositories/sector.repository';
import { CreateSectorType, SectorType, UpdateSectorType } from '../../domain/types/sector.type';
import { SectorEntity } from '../../domain/entities/sector.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';

export const useSectorRepository = (): ISectorRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateSectorMutation();

  const [
    uploadSectorsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadSectorsMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateSectorMutation();

  const [
    deleteSectorMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteSectorMutation();

  const [sectorIdArg, setSectorIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllSectors,
    {
      data: allSectorsQueryResult,
      isLoading: isLoadingAllSectorsQuery,
      isFetching: isFetchingAllSectorsQuery,
      error: allSectorsQueryError,
    },
  ] = useLazyGetAllSectorsQuery();

  const {
    data: currentSectorQueryResult,
    isLoading: isLoadingSectorByIdQuery,
    isFetching: isFetchingSectorByIdQuery,
    error: sectorByIdQueryError,
    refetch: refetchSectorByIdQuery,
  } = useGetSectorByIdQuery(sectorIdArg === skipToken ? skipToken : { id: sectorIdArg as string });

  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccess = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationError = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationError = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createSector = useCallback(async (sector: CreateSectorType): Promise<SectorType> => {
    resetCreateMutation();
    return createMutation(sector).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadSectors = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadSectorsMutation(formData).unwrap();
  }, [uploadSectorsMutation, resetUploadMutation]);

  const updateSector = useCallback(async (id: string, sector: UpdateSectorType): Promise<SectorType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...sector }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteSector = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteSectorMutation(id).unwrap();
    return true;
  }, [deleteSectorMutation, resetDeleteMutation]);

  const getAllSectors = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<SectorEntity>> => {
      const result = await triggerGetAllSectors(params).unwrap();
      return result;
    }, [triggerGetAllSectors]
  );

  const getSectorById = useCallback((id: string) => {
    setSectorIdArg(id);
    return currentSectorQueryResult || null;
  }, [currentSectorQueryResult]);

  return {
    createSector,
    uploadSectors,
    updateSector,
    deleteSector,
    getAllSectors,
    getSectorById,

    allSectorsData: allSectorsQueryResult,
    isLoadingAllSectors: isLoadingAllSectorsQuery,
    isFetchingAllSectors: isFetchingAllSectorsQuery,
    allSectorsError: allSectorsQueryError,

    currentSectorData: currentSectorQueryResult,
    isLoadingSectorById: isLoadingSectorByIdQuery,
    isFetchingSectorById: isFetchingSectorByIdQuery,
    sectorByIdError: sectorByIdQueryError,

    isMutationLoading,
    isMutationSuccess,
    isMutationError,
    mutationError,
  };
};