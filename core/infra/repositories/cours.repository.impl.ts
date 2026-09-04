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
import { SharedRequestCache } from '../cache/sharedRequestCache';

const coursRequestCache = new SharedRequestCache({ maxSettledEntries: 256 });
const COURS_LIVE_PAGE_TTL_MS = 15_000;
const COURS_HISTORY_PAGE_TTL_MS = 10 * 60_000;

const serializeCoursParams = (params: QueryParams): string =>
  JSON.stringify(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)));

const getSharedCoursRequest = <T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs = COURS_LIVE_PAGE_TTL_MS,
): Promise<T> => coursRequestCache.getOrCreate(key, factory, ttlMs);

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
      const key = `cours:list:${serializeCoursParams(params)}`;
      const page = Number(params.page ?? 1);
      const ttlMs = Number.isInteger(page) && page > 1 ? COURS_HISTORY_PAGE_TTL_MS : COURS_LIVE_PAGE_TTL_MS;
      return getSharedCoursRequest(key, () => triggerGetAllCours(params).unwrap(), ttlMs);
    },
    [triggerGetAllCours]
  );
  
  const getCoursHistory = useCallback(
    async (params: QueryParams = {}, maxPoints = 500): Promise<CoursEntity[]> => {
      if (typeof params.instrument !== "string" || params.instrument.trim() === "") {
        throw new Error("Cours history requires a valid instrument identifier.");
      }
      const requestedPageSize = Math.min(500, Math.max(100, maxPoints));
      const fetchHistoryPage = (page: number) =>
        getSharedCoursRequest(
          `cours:history:${serializeCoursParams({ ...params, page, page_size: requestedPageSize })}`,
          () => triggerGetAllCours({ ...params, page, page_size: requestedPageSize }).unwrap(),
          page > 1 ? COURS_HISTORY_PAGE_TTL_MS : COURS_LIVE_PAGE_TTL_MS,
        );

      const firstResponse = await fetchHistoryPage(1);
      const firstPage = firstResponse.data ?? [];
      const reportedTotalPages = Number(firstResponse.total_pages);
      const effectivePageSize = Number(firstResponse.page_size);
      const pageSize = Number.isFinite(effectivePageSize) && effectivePageSize > 0
        ? effectivePageSize
        : requestedPageSize;
      const maxPages = Math.ceil(maxPoints / pageSize);

      if (Number.isFinite(reportedTotalPages)) {
        const pageCount = Math.min(maxPages, Math.max(1, reportedTotalPages));
        const remainingResponses = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, index) =>
            fetchHistoryPage(index + 2)
          )
        );

        return [firstPage, ...remainingResponses.map((response) => response.data ?? [])]
          .flat()
          .slice(0, maxPoints);
      }

      const pages = [...firstPage];
      let response = firstResponse;

      for (let page = 2; page <= maxPages && response.links?.next; page += 1) {
        response = await fetchHistoryPage(page);
        const receivedPage = response.data ?? [];
        pages.push(...receivedPage);
        if (receivedPage.length === 0) break;
      }

      return pages.slice(0, maxPoints);
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
    getCoursHistory,
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
