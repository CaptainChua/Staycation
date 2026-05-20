"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Loader2, ScrollText, ChevronDown, ChevronRight, Mail } from "lucide-react";
import { useGetSystemAuditLogsQuery, type SystemAuditLog } from "@/redux/api/systemAuditLogsApi";

const ENTITY_COLORS: Record<string, string> = {
  haven: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  partner: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  payout: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  amenity_verification: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  booking: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  ical_feed: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const ACTION_TONE = (action: string): string => {
  if (/approve|verify|mark_paid|reactivate/.test(action)) return "text-green-700 dark:text-green-300";
  if (/reject|suspend|cancel|fail/.test(action)) return "text-red-600 dark:text-red-300";
  if (/revision|update/.test(action)) return "text-blue-600 dark:text-blue-300";
  return "text-gray-700 dark:text-gray-200";
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function SystemAuditLogsTab() {
  const [entityType, setEntityType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [expanded, setExpanded] = useState<string | number | null>(null);

  const { data, isLoading, isError } = useGetSystemAuditLogsQuery({
    entity_type: entityType === "all" ? undefined : entityType,
    action: search || undefined,
    actor_email: actorEmail || undefined,
  });
  const rows = data?.rows || [];
  const counts = data?.counts || [];

  const filters = useMemo(() => [
    { id: "all", label: "All", count: counts.reduce((s, c) => s + c.count, 0) },
    ...counts.map((c) => ({ id: c.entity_type, label: c.entity_type, count: c.count })),
  ], [counts]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">System Audit Logs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Every state change to partners, havens, amenity verifications, and payouts.
            Used to answer &ldquo;who did what, when, and why&rdquo;.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Entity type</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEntityType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${
                entityType === f.id
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="capitalize">{f.label.replace(/_/g, " ")}</span>
              <span className="text-[10px] opacity-70">({f.count})</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Action filter (e.g. approve, reject, mark_paid)"
              aria-label="Action filter"
              className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={actorEmail}
              onChange={(e) => setActorEmail(e.target.value)}
              placeholder="Actor email contains…"
              aria-label="Actor email filter"
              className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading audit logs…</p>
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-semibold mb-1">Couldn&apos;t load audit logs</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Run the migration in Neon if you haven&apos;t yet.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-14 text-center">
          <ScrollText className="w-10 h-10 text-brand-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">No audit entries yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Audit entries get written automatically when admins approve/reject partners, verify amenities, or mark payouts paid.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          {rows.map((row) => (
            <LogRow
              key={row.id}
              row={row}
              expanded={expanded === row.id}
              onToggle={() => setExpanded(expanded === row.id ? null : row.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LogRow({ row, expanded, onToggle }: { row: SystemAuditLog; expanded: boolean; onToggle: () => void }) {
  const entityColor = ENTITY_COLORS[row.entity_type] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
      >
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${entityColor}`}>
          {row.entity_type.replace(/_/g, " ")}
        </span>
        <span className={`font-mono text-sm font-semibold ${ACTION_TONE(row.action)}`}>
          {row.action}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate flex-1 hidden md:inline">
          {String(row.entity_id).slice(0, 24)}{String(row.entity_id).length > 24 ? "…" : ""}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
          {row.actor_email || row.actor_type}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {fmtTime(row.created_at)}
        </span>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900/40 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11.5px]">
            <Meta label="Entity ID" value={row.entity_id} mono />
            <Meta label="Actor" value={row.actor_email || row.actor_id || row.actor_type} />
            <Meta label="Actor type" value={row.actor_type} />
            <Meta label="IP" value={row.ip_address || "—"} mono />
          </div>
          {row.metadata && Object.keys(row.metadata).length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-gray-500 mb-1.5">Metadata</div>
              <pre className="text-[11px] font-mono text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-all">
                {JSON.stringify(row.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{label}</div>
      <div className={`text-gray-800 dark:text-gray-100 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}
