import { EventEntity } from "@/core/domain/entities/event.entity";
import { CreateEventType, UpdateEventType, EventQueryParams } from "../../../domain/types/event.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const eventApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createEvent: builder.mutation<EventEntity, CreateEventType>({
      query: (event) => ({
        url: "/events/",
        method: "POST",
        body: event,
      }),
      invalidatesTags: () => [
        { type: "Events", id: "LIST" }
      ],
    }),
    uploadEvent: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/events/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: () => [
        { type: "Events", id: "LIST" }
      ],
    }),
    updateEvent: builder.mutation<EventEntity, UpdateEventType & { id: string }>({
      query: ({ id, ...event }) => ({
        url: `events/${id}/`,
        method: "PATCH",
        body: event,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Events", id }],
    }),
    getAllEvents: builder.query<PaginatedResponse<EventEntity>, EventQueryParams | void>({
        query: (params) => ({
            url: "events",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Events" as const, id })),
                { type: "Events", id: "LIST" },
                { type: "Events", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Events", id: "LIST" }],
    }),
    getEventById: builder.query<EventEntity, { id: string }>({
      query: ({ id }) => `/events/${id}/`,
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `events/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Events", id }
      ],
    }),
  }),
  overrideExisting: true,
});
