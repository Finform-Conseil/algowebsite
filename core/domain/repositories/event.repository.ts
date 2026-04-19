import { EventEntity } from '../entities/event.entity';
import { CreateEventType, UpdateEventType, EventQueryParams } from '../types/event.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface IEventRepository {
  createEvent: (event: CreateEventType) => Promise<EventEntity>;
  updateEvent: (id: string, event: UpdateEventType) => Promise<EventEntity | null>;
  uploadEvents: (formData: any) => Promise<void>;
  deleteEvent: (id: string) => Promise<boolean>;
  getAllEvents: (params?: EventQueryParams) => Promise<PaginatedResponse<EventEntity>>;
  getEventById: (id: string) => EventEntity | null;

  allEventsData?: PaginatedResponse<EventEntity>;
  isLoadingAllEvents: boolean;
  isFetchingAllEvents: boolean;
  allEventsError?: any;

  currentEventData?: EventEntity | null;
  isLoadingEventById: boolean;
  isFetchingEventById: boolean;
  eventByIdError?: any;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
