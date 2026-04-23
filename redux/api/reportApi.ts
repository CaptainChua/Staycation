import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ReportIssueRequest {
  haven_id: string;
  issue_type: string;
  priority_level: string;
  specific_location: string;
  issue_description: string;
  user_id: string;
  images?: File[];
}

export interface ReportIssueResponse {
  success: boolean;
  message: string;
  data?: {
    report_id: string;
    haven_id: string;
    issue_type: string;
    priority_level: string;
    specific_location: string;
    issue_description: string;
    created_at: string;
  };
}

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api"}),
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    // Submit a new issue report
    submitReport: builder.mutation<ReportIssueResponse, ReportIssueRequest>({
      query: (data) => {
        const formData = new FormData();
        
        // Add all form fields
        formData.append('haven_id', data.haven_id);
        formData.append('issue_type', data.issue_type);
        formData.append('priority_level', data.priority_level);
        formData.append('specific_location', data.specific_location);
        formData.append('issue_description', data.issue_description);
        formData.append('user_id', data.user_id);
        
        // Add images if any
        if (data.images && data.images.length > 0) {
          data.images.forEach((image, index) => {
            formData.append(`image_${index}`, image);
          });
        }
        
        return {
          url: "/report/submit",
          method: "POST",
          body: formData,
          formData: true
        };
      },
      invalidatesTags: ['Report']
    }),

    // Get all reports (for admin)
    getReports: builder.query({
      query: (params) => ({
        url: "/report",
        params
      }),
      providesTags: ['Report']
    }),

    // Get reports by haven ID
    getReportsByHaven: builder.query({
      query: (havenId) => ({
        url: `/report/haven/${havenId}`
      }),
      providesTags: ['Report']
    }),

    // Get single report by ID
    getReportById: builder.query({
      query: (reportId) => ({
        url: `/report/${reportId}`
      }),
      providesTags: ['Report']
    }),

    // Update report status
    updateReportStatus: builder.mutation({
      query: ({ reportId, status }) => ({
        url: `/report/${reportId}/status`,
        method: "PATCH",
        body: { status }
      }),
      invalidatesTags: ['Report']
    }),

    // Update report assignment
    updateReportAssignment: builder.mutation({
      query: ({ reportId, assignedTo }) => ({
        url: `/report`,
        method: "PATCH",
        body: { reportId, assigned_to: assignedTo }
      }),
      invalidatesTags: ['Report']
    }),

    // Update report
    updateReport: builder.mutation<ReportIssueResponse, { reportId: string } & Partial<ReportIssueRequest>>({
      query: ({ reportId, ...data }) => {
        const formData = new FormData();
        
        // Add all form fields if provided
        if (data.haven_id) formData.append('haven_id', data.haven_id);
        if (data.issue_type) formData.append('issue_type', data.issue_type);
        if (data.priority_level) formData.append('priority_level', data.priority_level);
        if (data.specific_location) formData.append('specific_location', data.specific_location);
        if (data.issue_description) formData.append('issue_description', data.issue_description);
        if (data.user_id) formData.append('user_id', data.user_id);
        
        // Add images if any
        if (data.images && data.images.length > 0) {
          data.images.forEach((image, index) => {
            formData.append(`image_${index}`, image);
          });
        }
        
        return {
          url: `/report/${reportId}`,
          method: "PATCH",
          body: formData,
          formData: true
        };
      },
      invalidatesTags: ['Report']
    }),

    // Delete report
    deleteReport: builder.mutation({
      query: (reportId) => ({
        url: `/report/${reportId}`,
        method: "DELETE"
      }),
      invalidatesTags: ['Report']
    }),

    // Get user by ID
    getUserById: builder.query({
      query: (userId) => ({
        url: `/admin/employees/${userId}`
      })
    })
  })
});

export const {
  useSubmitReportMutation,
  useGetReportsQuery,
  useGetReportsByHavenQuery,
  useGetReportByIdQuery,
  useUpdateReportStatusMutation,
  useUpdateReportAssignmentMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useGetUserByIdQuery
} = reportApi;
