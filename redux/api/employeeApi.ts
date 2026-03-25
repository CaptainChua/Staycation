import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ADMIN_API_ENDPOINTS } from "@/lib/apiEndpoints";

export const employeeApi = createApi({
    reducerPath: "employeeApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
    tagTypes: ['Employee'],
    endpoints: (builder) => ({
        getEmployees: builder.query({
            query(params) {
                return {
                    url: ADMIN_API_ENDPOINTS.EMPLOYEES,
                    params
                };
            },
            providesTags: ['Employee']
        }),

        // Get employee by ID
        getEmployeeById: builder.query({
            query(id) {
                return {
                    url: `${ADMIN_API_ENDPOINTS.EMPLOYEES}/${id}`
                };
            },
            providesTags: ['Employee']
        }),

        //Create employee
        createEmployee: builder.mutation({
            query(body) {
                return {
                    url: ADMIN_API_ENDPOINTS.EMPLOYEES,
                    method: "POST",
                    body
                }
            },
            invalidatesTags: ['Employee']
        }),

        // Update employee
        updateEmployee: builder.mutation({
            query(body) {
                const { id } = body;
                return {
                    url: `${ADMIN_API_ENDPOINTS.EMPLOYEES}/${id}`,
                    method: "PUT",
                    body
                }
            },
            invalidatesTags: ['Employee']
        }),

        // Delete employee
        deleteEmployee: builder.mutation({
            query(id) {
                return {
                    url: ADMIN_API_ENDPOINTS.EMPLOYEES,
                    method: "DELETE",
                    params: { id }
                }
            },
            invalidatesTags: ['Employee']
        }),

        loginEmployee: builder.mutation({
            query(body) {
                return {
                    url: ADMIN_API_ENDPOINTS.LOGIN,
                    method: "POST",
                    body
                }
            }
        })
    })
});

export const {
    useGetEmployeesQuery,
    useGetEmployeeByIdQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
    useLoginEmployeeMutation
} = employeeApi