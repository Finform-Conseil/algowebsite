import { ActivityEntity } from "@/core/domain/entities/activity.entity";
import { CreateActivityType, ActivityType, UpdateActivityType, ActivityQueryParams } from "../../../domain/types/activity.type";
import { PaginatedResponse } from "../../../domain/types/pagination.type";
import api from "./base.api";

export const activityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createActivity: builder.mutation<ActivityType, CreateActivityType>({
      query: (activity) => ({
        url: "/activities/",
        method: "POST",
        body: activity,
      }),
      invalidatesTags: (result) => [
        { type: "Activities", id: "LIST" }
      ],
    }),
    uploadActivities: builder.mutation<void, any>({
      query: (formData) => ({
        url: "/activities/bulk-import/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result) => [
        { type: "Activities", id: "LIST" }
      ],
    }),
    updateActivity: builder.mutation<ActivityType, UpdateActivityType & { id: string }>({
      query: ({ id, ...activity }) => ({
        url: `activities/${id}/`,
        method: "PATCH",
        body: activity,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Activities", id }],
    }),
    getAllActivities: builder.query<PaginatedResponse<ActivityEntity>, ActivityQueryParams | void>({
        query: (params) => ({
            url: "activities",
            method: "GET",
            params: params || {},
        }),
        providesTags: (result, error, arg) =>
            result
            ? [
                ...result.data.map(({ id }) => ({ type: "Activities" as const, id })),
                { type: "Activities", id: "LIST" },
                { type: "Activities", id: `PAGE-${result.current_page}` },
            ] : [{ type: "Activities", id: "LIST" }],
    }),
    getActivityById: builder.query<ActivityEntity, { id: string }>({
      query: ({ id }) => `/activities/${id}/`,
    }),
    deleteActivity: builder.mutation<void, string>({
      query: (id) => ({
        url: `activities/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Activities", id }
      ],
    }),
  }),
  overrideExisting: true,
});


