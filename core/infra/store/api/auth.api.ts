import api from "./base.api";
import * as z from "zod";
import { UserEntity } from "../../../domain/entities/user.entity";
import { loginSchema } from "@/core/domain/schemas/user.schema";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, {email: string, password: string}>({
      query: ({ email, password } : z.infer<typeof loginSchema>) => ({
				url: '/users/login/',
				method: 'POST',
				body: { email, password },
			}),
    }),
    // register: builder.mutation<any, {firstname: string, lastname: string, email: string, password: string}>({
    //   query: ({ firstname, lastname, email, password } : z.infer<typeof RegistrationSchema>) => ({
		// 		url: '/users/register/',
		// 		method: 'POST',
		// 		body: { firstname, lastname, email, password },
		// 	}),
    // }),
    userList: builder.query<UserEntity[], void>({
      query: () => ({
          url: "/users",
          method: "GET",
      }),
      transformResponse: (response: { data: UserEntity[] }) => response.data,
      providesTags: (result) =>[{ type: "User", id: "LIST" }],
    }),
    deleteUser: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
				url: `/users/deleteUser/${id}`,
				method: 'DELETE',
			}),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/users/logout",
        method: "POST",
      }),
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/users/refresh-token",
        method: "POST",
      }),
    }),
  }),
  overrideExisting: true,
});


