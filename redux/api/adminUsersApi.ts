import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AdminUser {
  user_id: string;
  google_id?: string;
  facebook_id?: string;
  email: string;
  user_role: string;
  name?: string;
  picture?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
  register_as?: string;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  count: number;
}

export interface AdminUserResponse {
  success: boolean;
  data: AdminUser;
  message?: string;
}

export const adminUsersApi = createApi({
  reducerPath: "adminUsersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ['AdminUser'],
  endpoints: (builder) => ({
    // Get all users
    getAdminUsers: builder.query<AdminUsersResponse, { role?: string; search?: string }>({
      query: (params) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: ['AdminUser'],
    }),

    // Get user by ID
    getAdminUserById: builder.query<AdminUserResponse, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
      }),
      providesTags: ['AdminUser'],
    }),

    // Update user
    updateAdminUser: builder.mutation<AdminUserResponse, Partial<AdminUser>>({
      query: (body) => ({
        url: "/admin/users",
        method: "PUT",
        body,
      }),
      invalidatesTags: ['AdminUser'],
    }),

    // Delete user
    deleteAdminUser: builder.mutation<AdminUserResponse, string>({
      query: (id) => ({
        url: "/admin/users",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
} = adminUsersApi;
