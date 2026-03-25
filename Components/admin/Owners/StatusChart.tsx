"use client";

import React, { useState } from "react";
import { Booking } from "@/types/booking";

interface Props {
  data: Booking[];
  title: string;
  statusFilter?: string[];
}

const allStatusOrder = [
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

const statusHexColors: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  confirmed: "#10b981",
  "checked-in": "#3b82f6",
  completed: "#10b981",
  rejected: "#ef4444",
  cancelled: "#f97316",
};

interface PieSegment {
  status: string;
  count: number;
  startAngle: number;
  endAngle: number;
  percentage: number;
}

export default function StatusChart({ data, title, statusFilter }: Props) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const statusOrder = statusFilter || allStatusOrder;
  const counts = statusOrder.reduce((acc: Record<string, number>, s) => {
    acc[s] = data.filter(b => (b.status || '').toLowerCase() === s).length;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Calculate pie segments
  const segments: PieSegment[] = [];
  let currentAngle = 0;

  statusOrder.forEach((s) => {
    const count = counts[s] || 0;
    if (count > 0) {
      const percentage = (count / total) * 100;
      const sliceAngle = (count / total) * 360;
      segments.push({
        status: s,
        count,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        percentage,
      });
      currentAngle += sliceAngle;
    }
  });

  // Function to convert angle to SVG doughnut path
  const getPathData = (segment: PieSegment, radius: number = 70): string => {
    const centerX = 100;
    const centerY = 100;
    const innerRadius = 45;
    const toRadians = (angle: number) => angle * (Math.PI / 180);

    const angleDiff = segment.endAngle - segment.startAngle;

    // For a full or nearly-full circle, draw as two semicircles
    if (angleDiff > 359.9) {
      const midAngle = segment.startAngle + 180;
      const startRad = toRadians(segment.startAngle - 90);
      const midRad = toRadians(midAngle - 90);

      const outerStart = {
        x: centerX + radius * Math.cos(startRad),
        y: centerY + radius * Math.sin(startRad),
      };
      const outerMid = {
        x: centerX + radius * Math.cos(midRad),
        y: centerY + radius * Math.sin(midRad),
      };

      const innerStart = {
        x: centerX + innerRadius * Math.cos(startRad),
        y: centerY + innerRadius * Math.sin(startRad),
      };
      const innerMid = {
        x: centerX + innerRadius * Math.cos(midRad),
        y: centerY + innerRadius * Math.sin(midRad),
      };

      return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${radius} ${radius} 0 1 1 ${outerMid.x} ${outerMid.y}`,
        `A ${radius} ${radius} 0 1 1 ${outerStart.x} ${outerStart.y}`,
        `L ${innerStart.x} ${innerStart.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${innerMid.x} ${innerMid.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${innerStart.x} ${innerStart.y}`,
        "Z",
      ].join(" ");
    }

    const startRad = toRadians(segment.startAngle - 90);
    const endRad = toRadians(segment.endAngle - 90);

    const outerStart = {
      x: centerX + radius * Math.cos(startRad),
      y: centerY + radius * Math.sin(startRad),
    };
    const outerEnd = {
      x: centerX + radius * Math.cos(endRad),
      y: centerY + radius * Math.sin(endRad),
    };

    const innerStart = {
      x: centerX + innerRadius * Math.cos(startRad),
      y: centerY + innerRadius * Math.sin(startRad),
    };
    const innerEnd = {
      x: centerX + innerRadius * Math.cos(endRad),
      y: centerY + innerRadius * Math.sin(endRad),
    };

    const largeArc = angleDiff > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  };

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 text-center">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 text-center mb-4">{title}</h3>

      {/* Pie Chart */}
      <div className="flex justify-center mb-6 relative">
        <svg 
          width="200" 
          height="200" 
          viewBox="0 0 200 200"
          style={{ position: 'relative' }}
        >
          {segments.map((segment) => (
            <path
              key={segment.status}
              d={getPathData(segment)}
              fill={statusHexColors[segment.status]}
              stroke="white"
              strokeWidth="2"
              opacity={hoveredSegment === null || hoveredSegment === segment.status ? "0.9" : "0.5"}
              style={{ 
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={() => {
                setHoveredSegment(segment.status);
              }}
              onMouseLeave={() => {
                setHoveredSegment(null);
              }}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredSegment && (
          <div
            className="absolute bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium px-3 py-2 rounded shadow-lg whitespace-nowrap z-50"
            style={{
              pointerEvents: 'none',
              top: `-40px`,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div>{statusLabels[hoveredSegment]}</div>
            <div className="text-xs text-gray-300">
              {segments.find(s => s.status === hoveredSegment)?.count} ({segments.find(s => s.status === hoveredSegment)?.percentage.toFixed(1)}%)
            </div>
          </div>
        )}
      </div>

      {/* Legend/Description below */}
      <div className="flex flex-wrap gap-4 justify-center">
        {statusOrder.map((s) => (
          <div 
            key={s} 
            className="flex items-center gap-2 cursor-pointer relative group"
            onMouseEnter={() => counts[s] > 0 && setHoveredSegment(s)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div
              className="w-4 h-4 rounded-full transition-opacity"
              style={{ 
                backgroundColor: statusHexColors[s],
                opacity: hoveredSegment === null || hoveredSegment === s ? 1 : 0.4,
              }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {statusLabels[s]}
            </span>

            {/* Legend tooltip */}
            {hoveredSegment === s && counts[s] > 0 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                {counts[s]} ({((counts[s] / total) * 100).toFixed(1)}%)
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
        Total: {total}
      </div>
    </div>
  );
}
