"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Plus, Edit, Eye, Info, Home, Map, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import HavenFormModal from "@/Components/admin/Owners/Modals/HavenFormModal";
import { useGetMyListingsQuery, PartnerListing } from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";
const peso = (n: number) => "₱" + (n || 0).toLocaleString("en-PH");

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  capacity: number;
  status: "approved" | "pending" | "review" | "rejected";
  location: string;
  bookings: number;
  occupancy: number;
  rating: number | null;
  submitted: string;
  img: string;
  imageUrl?: string;
  rejection?: string;
  note?: string;
  raw?: Record<string, unknown>;
}

interface HavenApiRow {
  uuid_id?: string;
  id?: string | number;
  haven_name?: string;
  view_type?: string;
  capacity?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  ten_hour_rate?: number;
  six_hour_rate?: number;
  tower?: string;
  floor?: string;
  status?: string;
  rating?: number | null;
  bookings_count?: number;
  occupancy?: number;
  created_at?: string;
  images?: Array<{ image_url?: string; is_main?: boolean } | undefined>;
  [key: string]: unknown;
}

const normaliseStatus = (s?: string): Room["status"] => {
  const v = (s || "").toLowerCase();
  if (v === "approved" || v === "active" || v === "live") return "approved";
  if (v === "rejected" || v === "needs revision") return "rejected";
  if (v === "review" || v === "under_review") return "review";
  return "pending";
};

const toRoom = (h: HavenApiRow): Room => {
  const mainImage =
    h.images?.find((i) => i?.is_main)?.image_url ||
    h.images?.[0]?.image_url ||
    undefined;
  const price =
    Number(h.weekday_rate) ||
    Number(h.weekend_rate) ||
    Number(h.ten_hour_rate) ||
    Number(h.six_hour_rate) ||
    0;
  return {
    id: String(h.uuid_id || h.id || h.haven_name || Math.random()),
    name: h.haven_name || "Untitled haven",
    type: h.view_type || "Standard",
    price,
    capacity: Number(h.capacity) || 0,
    status: normaliseStatus(h.status),
    location: [h.tower, h.floor].filter(Boolean).join(" · ") || "—",
    bookings: Number(h.bookings_count) || 0,
    occupancy: Number(h.occupancy) || 0,
    rating: h.rating ?? null,
    submitted: h.created_at
      ? new Date(h.created_at as string).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : "—",
    img: h.haven_name || "Haven",
    imageUrl: mainImage,
    raw: h as Record<string, unknown>,
  };
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  approved: { label: "Live", bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  pending: { label: "Pending", bg: "bg-[#fef3c7]", text: "text-[#92400e]" },
  review: { label: "Under review", bg: "bg-[#dbeafe]", text: "text-[#2563eb]" },
  rejected: { label: "Needs revision", bg: "bg-[#fee2e2]", text: "text-[#dc2626]" },
};

interface MyListingsPageProps {
  onNavigate: (page: string) => void;
}

export default function MyListingsPage({ onNavigate }: MyListingsPageProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  // Force light mode for the wizard while editing (matches partner area)
  useEffect(() => {
    if (!editing) return;
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    if (wasDark) html.classList.remove("dark");
    return () => {
      if (wasDark) html.classList.add("dark");
    };
  }, [editing]);

  const { data: apiListings, isLoading, isError } = useGetMyListingsQuery();

  const rooms: Room[] = useMemo(() => {
    return (apiListings || []).map((h: PartnerListing) => {
      const mainImage =
        h.images?.find((i) => i.is_main)?.image_url || h.images?.[0]?.image_url;
      const price =
        Number(h.weekday_rate) ||
        Number(h.weekend_rate) ||
        Number(h.ten_hour_rate) ||
        Number(h.six_hour_rate) ||
        0;
      return {
        id: String(h.uuid_id),
        name: h.haven_name || "Untitled",
        type: h.view_type || "Standard",
        price,
        capacity: Number(h.capacity) || 0,
        status: ((s) => {
          const v = (s || "").toLowerCase();
          if (v === "approved" || v === "active" || v === "live") return "approved";
          if (v === "rejected") return "rejected";
          if (v === "review" || v === "under_review") return "review";
          return "pending";
        })(h.status) as Room["status"],
        location: [h.tower, h.floor].filter(Boolean).join(" · ") || "—",
        bookings: Number(h.bookings_count) || 0,
        occupancy: 0,
        rating: null,
        submitted: h.created_at
          ? new Date(h.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
          : "—",
        img: h.haven_name || "Listing",
        imageUrl: mainImage,
        raw: h as unknown as Record<string, unknown>,
      };
    });
  }, [apiListings]);

  const filters = [
    { id: "all", label: "All", count: rooms.length },
    { id: "approved", label: "Live", count: rooms.filter((r) => r.status === "approved").length },
    { id: "pending", label: "Pending", count: rooms.filter((r) => r.status === "pending").length },
    { id: "review", label: "Under review", count: rooms.filter((r) => r.status === "review").length },
    { id: "rejected", label: "Needs revision", count: rooms.filter((r) => r.status === "rejected").length },
  ];

  const list = rooms.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    if (list.length === 0) {
      toast.error("No listings to export");
      return;
    }
    const headers = ["Name", "Type", "Price", "Capacity", "Status", "Location", "Bookings", "Occupancy", "Rating", "Submitted"];
    const rows = list.map((r) => [
      r.name,
      r.type,
      r.price,
      r.capacity,
      r.status,
      r.location,
      r.bookings,
      `${r.occupancy}%`,
      r.rating ?? "—",
      r.submitted,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-listings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const handleEdit = (room: Room) => {
    if (!room.raw) {
      toast.error("Cannot edit — missing data");
      return;
    }
    setEditing(room.raw);
  };

  const handleViewDetails = (room: Room) => {
    toast(`Viewing ${room.name}`, { icon: "👁️" });
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
            Property management
          </div>
          <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
            My listings
          </h1>
          <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">
            Every room you&apos;ve submitted, with its current status. Edits re-trigger admin approval.
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleExport}
            disabled={list.length === 0}
            className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-white border border-[#d1d5db] text-[#111827] hover:bg-[#f3f4f6] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={() => onNavigate("add")}
            className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-[#B8860B] hover:bg-[#8B6508] text-white border border-[#B8860B] transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add room
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] mb-6 px-4 py-3.5 flex items-center gap-4 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-[8px] border text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition ${
                  isActive
                    ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B]"
                    : "border-[#e5e7eb] bg-transparent text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {f.label}
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-[#B8860B] text-white" : "bg-[#f3f4f6] text-[#6B7280]"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-[9px] px-3 py-1.5 w-[260px] text-[#6B7280]">
          <Search className="w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search by room name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search listings"
            className="bg-transparent border-none outline-none flex-1 text-[13px] text-[#111827] placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      {/* CARDS */}
      <div className="flex flex-col gap-3.5">
        {isLoading ? (
          <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-14 text-center">
            <Loader2 className="w-7 h-7 text-[#B8860B] animate-spin mx-auto mb-3" />
            <p className="text-[#6B7280] text-[14px]">Loading your listings…</p>
          </div>
        ) : isError ? (
          <div className="bg-white border border-[#fecaca] rounded-[14px] p-8 text-center">
            <p className="text-[#dc2626] font-semibold mb-1">Couldn&apos;t load listings</p>
            <p className="text-[#6B7280] text-[13px]">Please refresh the page or try again later.</p>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] text-[#B8860B] grid place-items-center mx-auto mb-4">
              <Home className="w-7 h-7" />
            </div>
            <h2 className={`text-[22px] font-medium mb-2 text-[#111827] ${fontFraunces}`}>
              No listings match this view
            </h2>
            <p className="text-[#6B7280] max-w-[360px] mx-auto mb-4 text-[14px]">
              Try a different filter, or start a new submission — we&apos;ll help you get it live.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("add")}
              className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold inline-flex items-center gap-2 bg-[#B8860B] hover:bg-[#8B6508] text-white border border-[#B8860B] transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add your first room
            </button>
          </div>
        ) : (
          list.map((room) => {
            const badge = STATUS_BADGES[room.status];
            const isExpanded = expanded === room.id;
            return (
              <div key={room.id} className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto]">
                  {/* Image */}
                  <div className="bg-[#f9fafb] border-r border-[#e5e7eb] grid place-items-center text-[#6B7280] font-mono text-[11px] h-[140px] md:h-auto relative overflow-hidden">
                    {room.imageUrl ? (
                      <Image
                        src={room.imageUrl}
                        alt={room.name}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_9px,#f3f4f6_9px,#f3f4f6_18px)] opacity-90" />
                        <span className="relative bg-white border border-[#e5e7eb] rounded-md px-2 py-1">
                          {room.img}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-5 py-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <h3 className={`text-[18px] text-[#111827] font-medium ${fontFraunces}`}>
                          {room.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${badge.bg} ${badge.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[12.5px] text-[#6B7280] flex items-center gap-3.5 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Home className="w-3 h-3" /> {room.type} · sleeps {room.capacity}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Map className="w-3 h-3" /> {room.location}
                        </span>
                        {room.rating && (
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3 h-3" /> {room.rating} rating
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-4 mt-3 flex-wrap">
                      <div>
                        <span className={`text-[20px] text-[#111827] font-medium ${fontFraunces}`}>
                          {peso(room.price)}
                        </span>
                        <span className="text-[11.5px] text-[#6B7280]"> / night</span>
                      </div>
                      <div className="text-[11.5px] text-[#6B7280]">·</div>
                      <div className="text-[12.5px] text-[#374151]">
                        <strong className="text-[#111827]">{room.bookings}</strong> bookings &nbsp;·&nbsp;
                        <strong className="text-[#111827]">{room.occupancy}%</strong> occupancy
                      </div>
                      <div className="text-[11.5px] text-[#6B7280] md:ml-auto">
                        Submitted {room.submitted}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 flex flex-col gap-2 justify-center md:border-l border-t md:border-t-0 border-[#e5e7eb] bg-[#f9fafb]">
                    <button
                      type="button"
                      onClick={() => handleEdit(room)}
                      className="w-full md:w-[140px] justify-center px-3 py-2 rounded-[9px] text-[12.5px] font-semibold inline-flex items-center gap-1.5 bg-white border border-[#d1d5db] text-[#111827] hover:bg-[#f3f4f6] transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewDetails(room)}
                      className="w-full md:w-[140px] justify-center px-3 py-2 rounded-[9px] text-[12.5px] font-semibold inline-flex items-center gap-1.5 text-[#374151] hover:bg-[#f9fafb] transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View details
                    </button>
                    {(room.status === "rejected" || room.note) && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : room.id)}
                        className="w-full md:w-[140px] justify-center px-3 py-2 rounded-[9px] text-[12px] font-semibold inline-flex items-center gap-1.5 text-[#dc2626] hover:bg-[#fee2e2]/40 transition"
                      >
                        <Info className="w-3 h-3" /> {isExpanded ? "Hide reason" : "See reason"}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (room.rejection || room.note) && (
                  <div
                    className={`px-5 py-3.5 border-t border-[#e5e7eb] flex gap-3 ${
                      room.status === "rejected" ? "bg-[#fee2e2]" : "bg-[#dbeafe]"
                    }`}
                  >
                    <Info
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        room.status === "rejected" ? "text-[#dc2626]" : "text-[#2563eb]"
                      }`}
                    />
                    <div>
                      <div
                        className={`font-semibold mb-0.5 text-[13px] ${
                          room.status === "rejected" ? "text-[#dc2626]" : "text-[#2563eb]"
                        }`}
                      >
                        {room.status === "rejected" ? "Why this needs revision" : "Currently under review"}
                      </div>
                      <div className="text-[12.5px] text-[#374151]">
                        {room.rejection || room.note}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* EDIT WIZARD */}
      <HavenFormModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        initialData={editing}
      />
    </div>
  );
}
