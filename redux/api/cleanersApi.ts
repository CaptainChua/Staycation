import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface CleaningTask {
  cleaning_id: string;
  booking_id: string;
  haven: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  check_out_time: string;
  cleaning_status: "pending" | "in-progress" | "cleaned" | "inspected";
  assigned_cleaner_id: string | null;
  cleaner_first_name: string | null;
  cleaner_last_name: string | null;
  cleaner_employment_id: string | null;
  cleaning_time_in: string | null;
  cleaning_time_out: string | null;
  cleaned_at: string | null;
  inspected_at: string | null;
}

export interface UpdateCleaningTaskRequest {
  cleaning_status?: "pending" | "in-progress" | "cleaned" | "inspected";
  assigned_to?: string | null;
  cleaning_time_in?: string | null;
  cleaning_time_out?: string | null;
  cleaned_at?: string | null;
  inspected_at?: string | null;
}

export const cleanersApi = createApi({
  reducerPath: "cleanersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin/cleaners" }),
  tagTypes: ["CleaningTask"],
  endpoints: (builder) => ({
    // Get all cleaning tasks
    getCleaningTasks: builder.query<CleaningTask[], { status?: string } | void>({
      query(params?: { status?: string }) {
        return {
          url: "/tasks",
          params,
        };
      },
      transformResponse: (response: { success: boolean; data: CleaningTask[] }) => {
        return response.data || [];
      },
      providesTags: ["CleaningTask"],
    }),

    // Get single cleaning task by ID
    getCleaningTaskById: builder.query<CleaningTask, string>({
      query(id) {
        return {
          url: `/tasks/${id}`,
        };
      },
      providesTags: ["CleaningTask"],
    }),

    // Update cleaning task
    updateCleaningTask: builder.mutation<CleaningTask, { id: string; body: UpdateCleaningTaskRequest }>({
      query({ id, body }) {
        return {
          url: `/tasks/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["CleaningTask"],
    }),

    // Assign cleaner to task
    assignCleaner: builder.mutation<CleaningTask, { taskId: string; cleanerId: string }>({
      query({ taskId, cleanerId }) {
        return {
          url: `/tasks/${taskId}/assign`,
          method: "PUT",
          body: { assigned_to: cleanerId },
        };
      },
      invalidatesTags: ["CleaningTask"],
    }),

    // Update cleaning status
    updateCleaningStatus: builder.mutation<CleaningTask, { taskId: string; status: "pending" | "in-progress" | "cleaned" | "inspected" }>({
      query({ taskId, status }) {
        return {
          url: `/tasks/${taskId}/status`,
          method: "PUT",
          body: { cleaning_status: status },
        };
      },
      invalidatesTags: ["CleaningTask"],
    }),

    // Start cleaning (set time_in and update status to in-progress)
    startCleaning: builder.mutation<CleaningTask, string>({
      query(taskId) {
        return {
          url: `/tasks/${taskId}/start`,
          method: "PUT",
          body: { 
            cleaning_status: "in-progress",
            cleaning_time_in: new Date().toISOString()
          },
        };
      },
      invalidatesTags: ["CleaningTask"],
    }),

    // Complete cleaning (set time_out and cleaned_at, update status)
    completeCleaning: builder.mutation<CleaningTask, string>({
      query(taskId) {
        return {
          url: `/tasks/${taskId}/complete`,
          method: "PUT",
          body: { 
            cleaning_status: "cleaned",
            cleaning_time_out: new Date().toISOString(),
            cleaned_at: new Date().toISOString()
          },
        };
      },
      invalidatesTags: ["CleaningTask"],
    }),
  }),
});

export const {
  useGetCleaningTasksQuery,
  useGetCleaningTaskByIdQuery,
  useUpdateCleaningTaskMutation,
  useAssignCleanerMutation,
  useUpdateCleaningStatusMutation,
  useStartCleaningMutation,
  useCompleteCleaningMutation,
} = cleanersApi;
