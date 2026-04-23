'use client';

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import type { Booking } from "@/types/booking";

Chart.register(ArcElement, Tooltip, Legend);

interface StatusChartProps {
  data: Booking[];
  title: string;
  statusFilter: string[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  confirmed: "#3b82f6",
  "checked-in": "#6366f1",
  "checked-out": "#8b5cf6",
  completed: "#10b981",
  rejected: "#ef4444",
  cancelled: "#f97316",
};

export default function StatusChart({ data, title, statusFilter }: StatusChartProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const status of statusFilter) {
      map[status] = 0;
    }
    for (const booking of data) {
      const s = (booking.status ?? "").toLowerCase();
      if (statusFilter.includes(s)) {
        map[s] = (map[s] ?? 0) + 1;
      }
    }
    return map;
  }, [data, statusFilter]);

  const labels = statusFilter.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const values = statusFilter.map((s) => counts[s] ?? 0);
  const colors = statusFilter.map((s) => STATUS_COLORS[s] ?? "#6b7280");
  const total = values.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(() => "#fff"),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { padding: 12, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => {
            const val = Number(ctx.raw);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
            return ` ${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title} Status</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
      </div>
      {total === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
          No data for selected period
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-64 h-64">
            <Doughnut data={chartData} options={options} />
          </div>
        </div>
      )}
    </div>
  );
}
