import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ReviewData {
  booking_id: string;
  haven_id: string;
  user_id?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  comment?: string;
  cleanliness_rating?: number;
  communication_rating?: number;
  checkin_rating?: number;
  accuracy_rating?: number;
  location_rating?: number;
  value_rating?: number;
  is_public?: boolean;
  is_verified?: boolean;
}

export interface Review {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  comment?: string;
  cleanliness_rating?: number;
  communication_rating?: number;
  checkin_rating?: number;
  accuracy_rating?: number;
  location_rating?: number;
  value_rating?: number;
  overall_rating: number;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  check_in_date?: string;
  check_out_date?: string;
}

export interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  total: number;
  hasMore: boolean;
}

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Review"],
  endpoints: (builder) => ({
    // Submit a review
    submitReview: builder.mutation<
      { success: boolean; review_id: string; message: string },
      ReviewData
    >({
      query(body) {
        return {
          url: "/reviews",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Review"],
    }),

    // Get reviews for a specific haven
    getHavenReviews: builder.query<
      ReviewsResponse,
      { haven_id: string; limit?: number; offset?: number }
    >({
      query({ haven_id, limit = 10, offset = 0 }) {
        return {
          url: "/reviews",
          params: { haven_id, limit, offset },
        };
      },
      transformResponse: (response: ReviewsResponse) => {
        return response;
      },
      providesTags: ["Review"],
    }),

    // Get review statistics for a haven
    getHavenReviewStats: builder.query<
      {
        cleanliness_avg: number;
        communication_avg: number;
        checkin_avg: number;
        accuracy_avg: number;
        location_avg: number;
        value_avg: number;
        overall_avg: number;
        total_reviews: number;
      },
      string
    >({
      query(haven_id) {
        return {
          url: `/reviews/stats/${haven_id}`,
        };
      },
      providesTags: ["Review"],
    }),

    // Get all reviews for an owner
    getReviews: builder.query<
      { success: boolean; data: Review[] },
      void
    >({
      query() {
        return {
          url: "/reviews/all",
        };
      },
      providesTags: ["Review"],
    }),
  }),
});

export const {
  useSubmitReviewMutation,
  useGetHavenReviewsQuery,
  useGetHavenReviewStatsQuery,
  useGetReviewsQuery,
} = reviewsApi;
