import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistStore, persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => ({
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, value: unknown) => Promise.resolve(value),
  removeItem: (_key: string) => Promise.resolve(),
});

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();
import bookingReducer from "./slices/bookingSlice";
import { employeeApi } from "./api/employeeApi";
import { roomApi } from "./api/roomApi";
import { bookingsApi } from "./api/bookingsApi";
import { bookingPaymentsApi } from "./api/bookingPaymentsApi";
import { wishlistApi } from "./api/wishlistApi";
import { messagesApi } from "./api/messagesApi";
import { usersApi } from "./api/usersApi";
import { activityLogApi } from "./api/activityLogApi";
import { analyticsApi } from "./api/analyticsApi";
import { reportApi } from "./api/reportApi";
import { notificationsApi } from "./api/notificationsApi";
import { reviewsApi } from "./api/reviewsApi";
import { blockedDatesApi } from "./api/blockedDatesApi";
import { adminUsersApi } from "./api/adminUsersApi";
import { cleanersApi } from "./api/cleanersApi";
import { partnersApi } from "./api/partnersApi";
import { partnerSelfApi } from "./api/partnerSelfApi";
import { partnerHavensReviewApi } from "./api/partnerHavensReviewApi";
import { partnersAdminApi } from "./api/partnersAdminApi";
import { amenityVerificationApi } from "./api/amenityVerificationApi";
import { partnerCalendarApi } from "./api/partnerCalendarApi";
import { adminPayoutsApi } from "./api/adminPayoutsApi";
import { partnerRegistrationApi } from "./api/partnerRegistrationApi";
import { systemAuditLogsApi } from "./api/systemAuditLogsApi";
import { havenListingStatusApi } from "./api/havenListingStatusApi";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["booking"],
};

const persistedBookingReducer = persistReducer(persistConfig, bookingReducer);

export const store = configureStore({
  reducer: {
    booking: persistedBookingReducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [roomApi.reducerPath]: roomApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [bookingPaymentsApi.reducerPath]: bookingPaymentsApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [activityLogApi.reducerPath]: activityLogApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [blockedDatesApi.reducerPath]: blockedDatesApi.reducer,
    [adminUsersApi.reducerPath]: adminUsersApi.reducer,
    [cleanersApi.reducerPath]: cleanersApi.reducer,
    [partnersApi.reducerPath]: partnersApi.reducer,
    [partnerSelfApi.reducerPath]: partnerSelfApi.reducer,
    [partnerHavensReviewApi.reducerPath]: partnerHavensReviewApi.reducer,
    [partnersAdminApi.reducerPath]: partnersAdminApi.reducer,
    [amenityVerificationApi.reducerPath]: amenityVerificationApi.reducer,
    [partnerCalendarApi.reducerPath]: partnerCalendarApi.reducer,
    [adminPayoutsApi.reducerPath]: adminPayoutsApi.reducer,
    [partnerRegistrationApi.reducerPath]: partnerRegistrationApi.reducer,
    [systemAuditLogsApi.reducerPath]: systemAuditLogsApi.reducer,
    [havenListingStatusApi.reducerPath]: havenListingStatusApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
        ],
        ignoredPaths: [
          "booking._persist",
        ],
      },
      immutableCheck: {
        warnAfter: 128,
      },
    })
      .concat(employeeApi.middleware)
      .concat(roomApi.middleware)
      .concat(bookingsApi.middleware)
      .concat(bookingPaymentsApi.middleware)
      .concat(wishlistApi.middleware)
      .concat(messagesApi.middleware)
      .concat(usersApi.middleware)
      .concat(activityLogApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(reportApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(reviewsApi.middleware)
      .concat(blockedDatesApi.middleware)
      .concat(adminUsersApi.middleware)
      .concat(cleanersApi.middleware)
      .concat(partnersApi.middleware)
      .concat(partnerSelfApi.middleware)
      .concat(partnerHavensReviewApi.middleware)
      .concat(partnersAdminApi.middleware)
      .concat(amenityVerificationApi.middleware)
      .concat(partnerCalendarApi.middleware)
      .concat(adminPayoutsApi.middleware)
      .concat(partnerRegistrationApi.middleware)
      .concat(systemAuditLogsApi.middleware)
      .concat(havenListingStatusApi.middleware),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
