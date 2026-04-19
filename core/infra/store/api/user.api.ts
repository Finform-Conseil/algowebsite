import { UserEntity } from "@/core/domain/entities/user.entity";
import api from "./base.api";
import {
  ChangePasswordType,
  CreateUserType,
  LoginType,
  UpdateUserType,
  UserQueryParams,
  UserType,
} from "@/core/domain/types/user.type";
import { PaginatedResponse } from "@/core/domain/types/pagination.type";

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, LoginType>({
      query: (user) => {
        return {
          url: "/users/login/",
          method: "POST",
          body: user,
        };
      },
    }),
    me: builder.query<UserType, void>({
      query: () => ({
        url: "/users/me/",
        method: "GET",
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/users/logout/",
        method: "POST",
      }),
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/users/refresh-token/",
        method: "POST",
      }),
    }),
    changePassword: builder.mutation<void, ChangePasswordType>({
      query: (user) => {
        return {
          url: "/users/change-password/",
          method: "POST",
          body: user,
        };
      },
    }),
    createUser: builder.mutation<UserEntity, CreateUserType>({
      query: (user) => {
        return {
          url: "/users/register/",
          method: "POST",
          body: user,
        };
      },
      invalidatesTags: (result) => [{ type: "Users", id: "LIST" }],
    }),
    updateUser: builder.mutation<UserEntity, UpdateUserType & { id: string }>({
      query: ({ id, ...user }) => ({
        url: `/users/${id}/`,
        method: "PATCH",
        body: user,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }],
    }),
    getAllUsers: builder.query<
      PaginatedResponse<UserEntity>,
      UserQueryParams | void
    >({
      query: (params) => ({
        url: "users",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Users" as const, id })),
              { type: "Users", id: "LIST" },
              { type: "Users", id: `PAGE-${result.current_page}` },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),
    getUserById: builder.query<UserEntity, { id: string }>({
      query: ({ id }: { id: string }) => `/users/${id}/`,
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Users", id }],
    }),
  }),
  overrideExisting: true,
});