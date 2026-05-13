import { useState, useCallback }  from 'react';
import { 
  useCreateActivityMutation, 
  useDeleteActivityMutation, 
  useGetAllActivitiesQuery, 
  useLazyGetAllActivitiesQuery,
  useGetActivityByIdQuery,
  useUpdateActivityMutation, 
  useUploadActivitiesMutation
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IActivityRepository } from '../../domain/repositories/activity.repository';
import { CreateActivityType, ActivityType, UpdateActivityType, ActivityQueryParams } from '@/core/domain/types/activity.type';
import { ActivityEntity } from '@/core/domain/entities/activity.entity';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';

export const useActivityRepository = (): IActivityRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateActivityMutation();

  const [
    uploadActivitiesMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadActivitiesMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateActivityMutation();

  const [
    deleteActivityMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteActivityMutation();

  const [activityIdArg, setActivityIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllActivities,
    {
      data: allActivitiesQueryResult,
      isLoading: isLoadingAllActivitiesQuery,
      isFetching: isFetchingAllActivitiesQuery,
      error: allActivitiesQueryError,
    },
  ] = useLazyGetAllActivitiesQuery();

  const {
    data: currentActivityQueryResult,
    isLoading: isLoadingActivityByIdQuery,
    isFetching: isFetchingActivityByIdQuery,
    error: activityByIdQueryError,
    refetch: refetchActivityByIdQuery,
  } = useGetActivityByIdQuery(activityIdArg === skipToken ? skipToken : { id: activityIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createActivity = useCallback(async (activity: CreateActivityType): Promise<ActivityType> => {
    resetCreateMutation();
    return createMutation(activity).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadActivities = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadActivitiesMutation(formData).unwrap();
  }, [uploadActivitiesMutation, resetUploadMutation]);

  const updateActivity = useCallback(async (id: string, activity: UpdateActivityType): Promise<ActivityType | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...activity }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteActivityMutation(id).unwrap();
    return true;
  }, [deleteActivityMutation, resetDeleteMutation]);

  const getAllActivities = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<ActivityEntity>> => {
      const result = await triggerGetAllActivities(params).unwrap();
      return result;
    },
    [triggerGetAllActivities]
  );
  
  const getActivityById = useCallback((id: string) => {
    setActivityIdArg(id);
    return currentActivityQueryResult || null;
  }, [currentActivityQueryResult]);

  return {
    createActivity,
    uploadActivities,
    updateActivity,
    deleteActivity,
    getAllActivities,
    getActivityById,

    allActivitiesData: allActivitiesQueryResult,
    isLoadingAllActivities: isLoadingAllActivitiesQuery,
    isFetchingAllActivities: isFetchingAllActivitiesQuery,
    allActivitiesError: allActivitiesQueryError,

    currentActivityData: currentActivityQueryResult,
    isLoadingActivityById: isLoadingActivityByIdQuery,
    isFetchingActivityById: isFetchingActivityByIdQuery,
    activityByIdError: activityByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
