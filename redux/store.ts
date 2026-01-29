import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import bookingReducer from "./slices/bookingSlice";
import { employeeApi } from "./api/employeeApi";
import { roomApi } from "./api/roomApi";
import { bookingsApi } from "./api/bookingsApi";
import { bookingPaymentsApi } from "./api/bookingPaymentsApi";
import { wishlistApi } from "./api/wishlistApi";
import { messagesApi } from "./api/messagesApi";
import { activityLogApi } from "./api/activityLogApi";
import { analyticsApi } from "./api/analyticsApi";
import { reportApi } from "./api/reportApi";
import { notificationsApi } from "./api/notificationsApi";
import { reviewsApi } from "./api/reviewsApi";
import { blockedDatesApi } from "./api/blockedDatesApi";
import { adminUsersApi } from "./api/adminUsersApi";

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [roomApi.reducerPath]: roomApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [bookingPaymentsApi.reducerPath]: bookingPaymentsApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [activityLogApi.reducerPath]: activityLogApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [blockedDatesApi.reducerPath]: blockedDatesApi.reducer,
    [adminUsersApi.reducerPath]: adminUsersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(employeeApi.middleware)
      .concat(roomApi.middleware)
      .concat(bookingsApi.middleware)
      .concat(bookingPaymentsApi.middleware)
      .concat(wishlistApi.middleware)
      .concat(messagesApi.middleware)
      .concat(activityLogApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(reportApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(reviewsApi.middleware)
      .concat(blockedDatesApi.middleware)
      .concat(adminUsersApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
