import { useState, useCallback, useRef }  from 'react';
import { 
  useCreateActionMutation,
  useDeleteActionMutation, 
  useGetActionByIdQuery, 
  useLazyGetActionByIdQuery,
  useLazyGetAllActionsQuery,

  useUpdateActionMutation,
  useUploadActionsMutation, 
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ActionLookupCriteria, ActionRequestOptions, IActionRepository } from '@/core/domain/repositories/action.repository';
import { ActionType, CreateActionType, UpdateActionType, ActionQueryParams } from '@/core/domain/types/action.type';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { PaginatedResponse } from '@/core/domain/types/pagination.type';
import {
  writePersistedActionIdentities,
  writePersistedActionIdentity,
} from './action-identity.persistence';
import {
  actionMatchesLookup,
  buildActionLookupQuery,
  buildActionLookupRequestKey,
  buildActionMarketCatalogQuery,
  normalizeActionLookupCriteria,
} from './action-lookup.policy';

const actionRequestsInFlight = new Map<string, Promise<unknown>>();

const serializeActionParams = (params: ActionQueryParams): string =>
  JSON.stringify(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "").sort(([left], [right]) => left.localeCompare(right)));

const getSharedActionRequest = <T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> => {
  const existing = actionRequestsInFlight.get(key);
  if (existing) return existing as Promise<T>;

  const request = factory();
  actionRequestsInFlight.set(key, request);
  const clearRequest = () => {
    if (actionRequestsInFlight.get(key) === request) actionRequestsInFlight.delete(key);
  };
  void request.then(clearRequest, clearRequest);
  return request;
};

export const useActionRepository = (): IActionRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateActionMutation();

  const [
    uploadActionsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadActionsMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateActionMutation();

  const [
    deleteActionMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteActionMutation();

  const [actionIdArg, setActionIdArg] = useState<string | typeof skipToken>(skipToken);


    const [
      triggerGetAllActions,
      {
        data: allActionsQueryResult,
        isLoading: isLoadingAllActionsQuery,
        isFetching: isFetchingAllActionsQuery,
        error: allActionsQueryError,
      },
    ] = useLazyGetAllActionsQuery();
  const [triggerGetActionById] = useLazyGetActionByIdQuery();

  const {
    data: currentActionQueryResult,
    isLoading: isLoadingActionByIdQuery,
    isFetching: isFetchingActionByIdQuery,
    error: actionByIdQueryError,
  } = useGetActionByIdQuery(actionIdArg === skipToken ? skipToken : { id: actionIdArg as string });

  const [currentActionByTickerQueryResult, setCurrentActionByTickerQueryResult] = useState<ActionEntity | null>(null);
  const [isLoadingActionByTickerQuery, setIsLoadingActionByTickerQuery] = useState(false);
  const [isFetchingActionByTickerQuery, setIsFetchingActionByTickerQuery] = useState(false);
  const [actionByTickerQueryError, setActionByTickerQueryError] = useState<unknown>();
  const actionByTickerRequestIdRef = useRef(0);


  const isMutationLoading = isCreating || isUpdating || isDeleting || isUploading;
  const isMutationSuccessOverall = isCreationSuccess || isUpdateSuccess || isDeletionSuccess || isUploadSuccess;
  const isMutationErrorOverall = isCreationError || isUpdateError || isDeletionError || isUploadError;
  const mutationErrorOverall = creationErrorData || updateErrorData || deletionErrorData || uploadErrorData;

  const createAction = useCallback(async (action: CreateActionType): Promise<ActionType> => {
    resetCreateMutation();
    return createMutation(action).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadActions = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadActionsMutation(formData).unwrap();
  }, [uploadActionsMutation, resetUploadMutation]);

  const updateAction = useCallback(async (id: string, action: UpdateActionType): Promise<ActionType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...action }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteAction = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteActionMutation(id).unwrap();
    return true;
  }, [deleteActionMutation, resetDeleteMutation]);

  const getAllActions = useCallback(
    async (
      params: ActionQueryParams = {},
      options: ActionRequestOptions = {},
    ): Promise<PaginatedResponse<ActionEntity>> => {
      const key = `actions:list:${serializeActionParams(params)}`;
      const preferCacheValue = options.forceRefetch !== true;
      const response = await getSharedActionRequest(
        key,
        () => triggerGetAllActions(params, preferCacheValue).unwrap(),
      );
      writePersistedActionIdentities(response.data ?? []);
      return response;
    },
    [triggerGetAllActions]
  );
    

  const getActionById = useCallback((id: string) => {
    setActionIdArg(id);
    return currentActionQueryResult || null;
  }, [currentActionQueryResult]);

  const getActionByTicker = useCallback(async (criteria: ActionLookupCriteria): Promise<ActionEntity> => {
    const normalizedCriteria = normalizeActionLookupCriteria(criteria);
    if (!normalizedCriteria.ticker) throw new Error("Cannot resolve an action without a ticker.");

    const requestId = actionByTickerRequestIdRef.current + 1;
    actionByTickerRequestIdRef.current = requestId;
    setIsLoadingActionByTickerQuery(true);
    setIsFetchingActionByTickerQuery(true);
    setActionByTickerQueryError(undefined);
    const key = buildActionLookupRequestKey(normalizedCriteria);

    try {
      const action = await getSharedActionRequest(key, async () => {
        const indexCriteria = {
          ticker: normalizedCriteria.ticker,
          ...(normalizedCriteria.marketTicker ? { marketTicker: normalizedCriteria.marketTicker } : {}),
        };

        const hydrateIndexedAction = async (candidate: ActionEntity | undefined): Promise<ActionEntity | null> => {
          if (!candidate) return null;
          const candidateId = typeof candidate.id === "string" ? candidate.id.trim() : "";
          if (!candidateId) {
            throw new Error(`API action index entry for ${normalizedCriteria.ticker} has no id.`);
          }
          const detailedAction = await triggerGetActionById({ id: candidateId }, true).unwrap();
          if (!actionMatchesLookup(detailedAction, normalizedCriteria)) {
            throw new Error(`API action detail mismatch for ${normalizedCriteria.ticker}.`);
          }
          return detailedAction;
        };

        const findIndexedCandidate = (actions: readonly ActionEntity[]): ActionEntity | undefined => (
          actions.find((candidate) => actionMatchesLookup(candidate, indexCriteria))
        );

        const resolveFromMarketCatalog = async (): Promise<ActionEntity | null> => {
          if (!normalizedCriteria.marketTicker) return null;
          let page = 1;
          let totalPages = 1;
          const maxFallbackPages = 20;

          do {
            const catalogResult = await triggerGetAllActions(
              buildActionMarketCatalogQuery(normalizedCriteria, page),
              true,
            ).unwrap();
            const indexedCandidate = findIndexedCandidate(catalogResult.data ?? []);
            const hydratedCandidate = await hydrateIndexedAction(indexedCandidate);
            if (hydratedCandidate) return hydratedCandidate;

            const reportedTotalPages = Number(catalogResult.total_pages);
            totalPages = Number.isFinite(reportedTotalPages) && reportedTotalPages > 0
              ? Math.min(maxFallbackPages, Math.floor(reportedTotalPages))
              : 1;
            page += 1;
          } while (page <= totalPages);

          return null;
        };

        const resolveIndexedLookup = async (field: "isin" | "ticker"): Promise<ActionEntity | null> => {
          let filteredLookupFailed = false;
          try {
            const result = await triggerGetAllActions(
              buildActionLookupQuery(normalizedCriteria, field),
              true,
            ).unwrap();
            if (!normalizedCriteria.marketTicker && result.count > 1) {
              throw new Error(
                `Ambiguous API action ticker ${normalizedCriteria.ticker}: ${result.count} matches; marketTicker is required.`,
              );
            }
            const hydratedCandidate = await hydrateIndexedAction(findIndexedCandidate(result.data ?? []));
            if (hydratedCandidate) return hydratedCandidate;
          } catch (error) {
            if (!normalizedCriteria.marketTicker) throw error;
            filteredLookupFailed = true;
            console.warn("[ActionRepository] Filtered action lookup failed; trying bounded market catalog fallback", {
              market: normalizedCriteria.marketTicker,
              ticker: normalizedCriteria.ticker,
              field,
            });
          }

          if (normalizedCriteria.marketTicker) {
            try {
              const catalogCandidate = await resolveFromMarketCatalog();
              if (catalogCandidate) return catalogCandidate;
            } catch (error) {
              if (filteredLookupFailed) {
                console.warn("[ActionRepository] Market catalog fallback also failed", {
                  market: normalizedCriteria.marketTicker,
                  ticker: normalizedCriteria.ticker,
                });
              }
              throw error;
            }
          }
          return null;
        };

        if (normalizedCriteria.isin) {
          const resolvedByIsin = await resolveIndexedLookup("isin");
          if (resolvedByIsin) return resolvedByIsin;
        }

        const resolvedAction = await resolveIndexedLookup("ticker");
        if (!resolvedAction) {
          throw new Error(
            `API action not found for ${normalizedCriteria.ticker}${normalizedCriteria.marketTicker ? ` on ${normalizedCriteria.marketTicker}` : ""}.`,
          );
        }
        return resolvedAction;
      });
      writePersistedActionIdentity(action);
      if (actionByTickerRequestIdRef.current === requestId) {
        setCurrentActionByTickerQueryResult(action);
        setIsLoadingActionByTickerQuery(false);
        setIsFetchingActionByTickerQuery(false);
      }
      return action;
    } catch (error) {
      if (actionByTickerRequestIdRef.current === requestId) {
        setActionByTickerQueryError(error);
        setIsLoadingActionByTickerQuery(false);
        setIsFetchingActionByTickerQuery(false);
      }
      throw error;
    }
  }, [triggerGetActionById, triggerGetAllActions]);

  return {
    createAction,
    uploadActions,
    updateAction,
    deleteAction,
    getAllActions,
    getActionById,
    getActionByTicker,

    allActionsData: allActionsQueryResult,
    isLoadingAllActions: isLoadingAllActionsQuery,
    isFetchingAllActions: isFetchingAllActionsQuery,
    allActionsError: allActionsQueryError,

    currentActionData: currentActionQueryResult,
    isLoadingActionById: isLoadingActionByIdQuery,
    isFetchingActionById: isFetchingActionByIdQuery,
    actionByIdError: actionByIdQueryError,

    currentActionByTickerData: currentActionByTickerQueryResult,
    isLoadingActionByTicker: isLoadingActionByTickerQuery,
    isFetchingActionByTicker: isFetchingActionByTickerQuery,
    actionByTickerError: actionByTickerQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
