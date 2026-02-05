import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface User {
  user_id: string;
  name: string;
  email: string;
  picture?: string;
}

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/users" }),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    // Get user profile by ID
    getUserProfile: builder.query<
      { user: User },
      { userId: string }
    >({
      query: ({ userId }) => ({
        url: `?userId=${userId}`,
        method: "GET",
      }),
      providesTags: (result, error, { userId }) => [
        { type: "Users", id: userId },
      ],
    }),

    // Get current user
    getCurrentUser: builder.query<{ user: User }, void>({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    // Get all users (admin)
    getAllUsers: builder.query<{ users: User[] }, void>({
      query: () => ({
        url: "?all=true",
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useGetCurrentUserQuery,
  useGetAllUsersQuery,
} = usersApi;
