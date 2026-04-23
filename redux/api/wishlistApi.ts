import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const wishlistApi = createApi({
  reducerPath: "wishlistApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api"}),
  tagTypes: ['Wishlist'],
  endpoints: (builder) => ({
    // Get user's wishlist
    getUserWishlist: builder.query({
      query(userId) {
        return {
          url: `/wishlist/${userId}`
        };
      },
      providesTags: ['Wishlist']
    }),

    // Add to wishlist
    addToWishlist: builder.mutation({
      query(body) {
        return {
          url: "/wishlist",
          method: "POST",
          body
        }
      },
      invalidatesTags: ['Wishlist']
    }),

    // Remove from wishlist
    removeFromWishlist: builder.mutation({
      query(id) {
        return {
          url: `/wishlist/delete/${id}`,
          method: "DELETE"
        }
      },
      invalidatesTags: ['Wishlist']
    }),

    // Check if item is in wishlist
    checkWishlistStatus: builder.query({
      query({ userId, havenId }) {
        return {
          url: `/wishlist/check/${userId}/${havenId}`
        };
      },
      providesTags: ['Wishlist']
    }),
  })
});

export const {
  useGetUserWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useCheckWishlistStatusQuery,
} = wishlistApi;
