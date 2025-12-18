import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const employeeApi = createApi({
    reducerPath: "employeeApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api"}),
    tagTypes: ['Employee'],
    endpoints: (builder) => ({
        getEmployees: builder.query({
            query(params) {
                return {
                    url: "/admin/employees",
                    params
                };
            },
            providesTags: ['Employee']
        }),

        // Get employee by ID
        getEmployeeById: builder.query({
            query(id) {
                return {
                    url: `/admin/employees/${id}`
                };
            },
            providesTags: ['Employee']
        }),

        //Create employee
        createEmployee: builder.mutation({
            query(body) {
                return {
                    url: "/admin/employees",
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
                    url: `/admin/employees/${id}`,
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
                    url: `/admin/employees`,
                    method: "DELETE",
                    params: { id }
                }
            },
            invalidatesTags: ['Employee']
        }),

        loginEmployee: builder.mutation({
            query(body) {
                return {
                    url: "/admin/login",
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