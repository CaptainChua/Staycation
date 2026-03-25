"use client";

import React from "react";
import { Booking } from "@/types/booking";

interface Props {
  bookings: Booking[];
  reservations?: Booking[];
  title?: string;
}

const statusOrder = [
  "pending",
  "approved",
  "confirmed",
  "checked-in",
  "completed",
  "rejected",
  "cancelled",
];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  confirmed: "Confirmed",
  "checked-in": "Checked In",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function BookingReservationChart({ bookings, reservations = [], title = 'Bookings vs Reservations' }: Props) {
  const bookingCounts = statusOrder.reduce((acc: Record<string, number>, s) => {
    acc[s] = bookings.filter(b => (b.status || '').toLowerCase() === s).length;
    return acc;
  }, {} as Record<string, number>);

  const reservationCounts = statusOrder.reduce((acc: Record<string, number>, s) => {
    acc[s] = reservations.filter(b => (b.status || '').toLowerCase() === s).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(1, ...statusOrder.map(s => Math.max(bookingCounts[s] || 0, reservationCounts[s] || 0)));

  const totalBookings = Object.values(bookingCounts).reduce((a,b) => a+b, 0);
  const totalReservations = Object.values(reservationCounts).reduce((a,b) => a+b, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">Bookings <span className="font-semibold">{totalBookings}</span></div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Reservations <span className="font-semibold">{totalReservations}</span></div>
        </div>
      </div>

      <div className="space-y-2">
        {statusOrder.map((s) => {
          const bCount = bookingCounts[s] || 0;
          const rCount = reservationCounts[s] || 0;
          const bPercent = Math.round((bCount / Math.max(1, maxCount)) * 100);
          const rPercent = Math.round((rCount / Math.max(1, maxCount)) * 100);

          return (
            <div key={s} className="flex items-center gap-3">
              <div className="w-32 min-w-[120px]">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{statusLabels[s]}</div>
              </div>

              <div className="flex-1">
                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 absolute left-0 top-0 transition-all duration-300"
                    style={{ width: `${bPercent}%` }}
                    title={`Bookings: ${bCount}`}
                  />
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 absolute left-0 top-0 opacity-60 transition-all duration-300"
                    style={{ width: `${rPercent}%` }}
                    title={`Reservations: ${rCount}`}
                  />
                </div>
              </div>

              <div className="w-28 text-right">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{bCount} / {rCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Bookings / Reservations</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
