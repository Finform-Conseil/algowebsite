import { useState, useCallback }  from 'react';
import { 
  useCreateEventMutation, 
  useDeleteEventMutation, 
  useGetAllEventsQuery, 
  useLazyGetAllEventsQuery,
  useGetEventByIdQuery,
  useUpdateEventMutation, 
  useUploadEventMutation,
} from "../store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { CreateEventType, UpdateEventType } from '@/core/domain/types/event.type';
import { PaginatedResponse, QueryParams } from '../../domain/types/pagination.type';
import { EventEntity } from '@/core/domain/entities/event.entity';
import { IEventRepository } from '@/core/domain/repositories/event.repository';

export const useEventRepository = (): IEventRepository => {
  const [
    createMutation,
    {
      isLoading: isCreating,
      isSuccess: isCreationSuccess,
      isError: isCreationError,
      error: creationErrorData,
      reset: resetCreateMutation,
    },
  ] = useCreateEventMutation();

  const [
    uploadEventsMutation,
    {
      isLoading: isUploading,
      isSuccess: isUploadSuccess,
      isError: isUploadError,
      error: uploadErrorData,
      reset: resetUploadMutation,
    },
  ] = useUploadEventMutation();

  const [
    updateMutation,
    {
      isLoading: isUpdating,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateErrorData,
      reset: resetUpdateMutation,
    },
  ] = useUpdateEventMutation();

  const [
    deleteEventMutation,
    {
      isLoading: isDeleting,
      isSuccess: isDeletionSuccess,
      isError: isDeletionError,
      error: deletionErrorData,
      reset: resetDeleteMutation,
    },
  ] = useDeleteEventMutation();

  const [eventIdArg, setEventIdArg] = useState<string | typeof skipToken>(skipToken);

  const [
    triggerGetAllEvents,
    {
      data: allEventsQueryResult,
      isLoading: isLoadingAllEventsQuery,
      isFetching: isFetchingAllEventsQuery,
      error: allEventsQueryError,
    },
  ] = useLazyGetAllEventsQuery();

  const {
    data: currentEventQueryResult,
    isLoading: isLoadingEventByIdQuery,
    isFetching: isFetchingEventByIdQuery,
    error: EventByIdQueryError,
    refetch: refetchEventByIdQuery,
  } = useGetEventByIdQuery(eventIdArg === skipToken ? skipToken : { id: eventIdArg as string });

  const isMutationLoading = isCreating || isUploading || isUpdating || isDeleting;
  const isMutationSuccessOverall = isCreationSuccess || isUploadSuccess || isUpdateSuccess || isDeletionSuccess;
  const isMutationErrorOverall = isCreationError || isUploadError || isUpdateError || isDeletionError;
  const mutationErrorOverall = creationErrorData || uploadErrorData || updateErrorData || deletionErrorData;

  const createEvent = useCallback(async (Event: CreateEventType): Promise<EventEntity> => {
    resetCreateMutation();
    return createMutation(Event).unwrap();
  }, [createMutation, resetCreateMutation]);

  const uploadEvents = useCallback(async (formData: any): Promise<void> => {
    resetUploadMutation();
    await uploadEventsMutation(formData).unwrap();
  }, [uploadEventsMutation, resetUploadMutation]);

  const updateEvent = useCallback(async (id: string, Event: UpdateEventType): Promise<EventEntity | null> => {
    resetUpdateMutation();
    return updateMutation({ id, ...Event }).unwrap();
  }, [updateMutation, resetUpdateMutation]);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    resetDeleteMutation();
    await deleteEventMutation(id).unwrap();
    return true;
  }, [deleteEventMutation, resetDeleteMutation]);

  const getAllEvents = useCallback(
    async (
      params: QueryParams = {}
    ): Promise<PaginatedResponse<EventEntity>> => {
      const result = await triggerGetAllEvents(params).unwrap();
      return result;
    },
    [triggerGetAllEvents]
  );
  
  const getEventById = useCallback((id: string) => {
    setEventIdArg(id);
    return currentEventQueryResult || null;
  }, [currentEventQueryResult]);

  return {
    createEvent,
    uploadEvents,
    updateEvent,
    deleteEvent,
    getAllEvents,
    getEventById,

    allEventsData: allEventsQueryResult,
    isLoadingAllEvents: isLoadingAllEventsQuery,
    isFetchingAllEvents: isFetchingAllEventsQuery,
    allEventsError: allEventsQueryError,

    currentEventData: currentEventQueryResult,
    isLoadingEventById: isLoadingEventByIdQuery,
    isFetchingEventById: isFetchingEventByIdQuery,
    eventByIdError: EventByIdQueryError,

    isMutationLoading,
    isMutationSuccess: isMutationSuccessOverall,
    isMutationError: isMutationErrorOverall,
    mutationError: mutationErrorOverall,
  };
};
