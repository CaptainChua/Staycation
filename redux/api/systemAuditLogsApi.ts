import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface SystemAuditLog {
  id: string | number;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_type: string;
  actor_id: string | null;
  actor_email: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface ApiOk<T> {
  success: true;
  data: T;
  counts?: Array<{ entity_type: string; count: number }>;
}

interface ListResponse {
  rows: SystemAuditLog[];
  counts: Array<{ entity_type: string; count: number }>;
}

export const systemAuditLogsApi = createApi({
  reducerPath: "systemAuditLogsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
  tagTypes: ["SystemAuditLogs"],
  endpoints: (builder) => ({
    getSystemAuditLogs: builder.query<
      ListResponse,
      { entity_type?: string; entity_id?: string; actor_email?: string; action?: string } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.entity_type) qs.set("entity_type", params.entity_type);
        if (params?.entity_id) qs.set("entity_id", params.entity_id);
        if (params?.actor_email) qs.set("actor_email", params.actor_email);
        if (params?.action) qs.set("action", params.action);
        const s = qs.toString();
        return `/system-audit-logs${s ? `?${s}` : ""}`;
      },
      transformResponse: (res: ApiOk<SystemAuditLog[]>) => ({
        rows: res.data,
        counts: res.counts || [],
      }),
      providesTags: ["SystemAuditLogs"],
    }),
  }),
});

export const { useGetSystemAuditLogsQuery } = systemAuditLogsApi;
