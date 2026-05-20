"use client";

import OwnerPageHeader from "./OwnerPageHeader";
import React, { useState, useMemo } from "react";
import {
  useGetPartnersQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  Partner,
} from "@/redux/api/partnersApi";
import {
  useGetPartnerSubmissionsQuery,
  useReviewPartnerHavenMutation,
  PartnerHavenSubmission,
} from "@/redux/api/partnerHavensReviewApi";
import {
  useGetPartnersOverviewQuery,
  useGetPartnerListingsQuery,
  PartnerListingRow,
} from "@/redux/api/partnersAdminApi";
import Image from "next/image";
import { Check, X as XIcon, AlertCircle, Loader2, Building, Edit } from "lucide-react";
import HavenFormModal from "./Modals/HavenFormModal";

import {
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MessageCircle,
  FileText,
  BarChart3,
  Users,
} from "lucide-react";

import toast from "react-hot-toast";
import AddPartnerModal from "./Modals/AddPartnerModal";

/* =========================
   TABLE SKELETON
========================= */
const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse border-b dark:border-gray-700">
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </td>
      </tr>
    ))}
  </>
);

/* =========================
   PAGE
========================= */
const PartnerManagementPage = () => {
  const { data, isLoading } = useGetPartnersQuery();

  const [createPartner] = useCreatePartnerMutation();
  const [updatePartner] = useUpdatePartnerMutation();
  const [deletePartner] = useDeletePartnerMutation();
  
  const partners: Partner[] = data?.data || [];

  /* =========================
   STATE
========================= */
const [tab, setTab] = useState(1);
const [search, setSearch] = useState("");
const [modalOpen, setModalOpen] = useState(false);
const [editing, setEditing] = useState<Partner | null>(null);
const [selectedListing, setSelectedListing] = useState<any>(null);

const [page, setPage] = useState(1);
const perPage = 10;

const [editPage, setEditPage] = useState(1);
const [docsPage, setDocsPage] = useState(1);

const [form, setForm] = useState({
  email: "",
  password: "",
  fullname: "",
  phone: "",
  address: "",
  type: "hotel",
  commission_rate: 10,
});


  /* =========================
     REVENUE
  ========================= */
  const totalRevenue = useMemo(() => {
    return partners.reduce(
      (sum: number, p: any) => sum + Number(p.total_earnings || 0),
      0
    );
  }, [partners]);

  const totalCommission = useMemo(() => {
    return partners.reduce((sum: number, p: any) => {
      return (
        sum +
        (Number(p.total_earnings || 0) *
          Number(p.commission_rate || 0)) /
          100
      );
    }, 0);
  }, [partners]);

  /* =========================
     FILTER
  ========================= */
  const filtered = partners.filter(
    (p) =>
      p.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     PAGINATION (10 PER PAGE)
  ========================= */
  const paginated = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* =========================
     EDIT REQUESTS DATA
  ========================= */
  const editRequests = [
    {
      id: 1,
      partner: "Sunset Hotel",
      type: "price",
      oldValue: "â‚±3,000",
      newValue: "â‚±3,500",
      status: "pending",
    },
    {
      id: 2,
      partner: "Ocean View Resort",
      type: "description",
      oldValue: "Beachfront room",
      newValue: "Luxury beachfront suite",
      status: "approved",
    },
    {
      id: 3,
      partner: "Mountain Escape",
      type: "amenities",
      oldValue: "WiFi only",
      newValue: "WiFi + Pool",
      status: "rejected",
    },
    {
      id: 4,
      partner: "Palm Resort",
      type: "price",
      oldValue: "â‚±5,000",
      newValue: "â‚±5,500",
      status: "pending",
    },
    {
      id: 5,
      partner: "Azure Suites",
      type: "description",
      oldValue: "Standard room",
      newValue: "Premium suite",
      status: "approved",
    },
    {
      id: 6,
      partner: "City Lights Hotel",
      type: "price",
      oldValue: "â‚±2,500",
      newValue: "â‚±2,900",
      status: "pending",
    },
    {
      id: 7,
      partner: "Island Breeze",
      type: "amenities",
      oldValue: "Breakfast",
      newValue: "Breakfast + Spa",
      status: "approved",
    },
    {
      id: 8,
      partner: "Royal Peak",
      type: "description",
      oldValue: "Deluxe room",
      newValue: "Executive deluxe room",
      status: "pending",
    },
    {
      id: 9,
      partner: "Golden Bay",
      type: "price",
      oldValue: "â‚±4,200",
      newValue: "â‚±4,800",
      status: "approved",
    },
    {
      id: 10,
      partner: "Crystal Inn",
      type: "amenities",
      oldValue: "No gym",
      newValue: "Gym included",
      status: "pending",
    },
    {
      id: 11,
      partner: "Skyline Hotel",
      type: "price",
      oldValue: "â‚±6,000",
      newValue: "â‚±6,300",
      status: "approved",
    },
    {
      id: 12,
      partner: "Harbor View",
      type: "description",
      oldValue: "Sea view",
      newValue: "Panoramic sea view",
      status: "pending",
    },
  ];

  const paginatedEditRequests = editRequests.slice(
    (editPage - 1) * perPage,
    editPage * perPage
  );

  
  /* =========================
     DOCS DATA
  ========================= */
  const docsAnalytics = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `Monthly Report ${i + 1}`,
    type: "PDF",
  }));

  const paginatedDocs = docsAnalytics.slice(
    (docsPage - 1) * perPage,
    docsPage * perPage
  );

  /* =========================
     SAVE
  ========================= */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editing) {
        await updatePartner({
          id: editing.id,
          ...form,
        }).unwrap();

        toast.success("Partner updated successfully");
      } else {
        await createPartner(form).unwrap();
        toast.success("Partner created successfully");
      }

      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string }; status?: number };
      const message =
        apiError?.data?.error ||
        (apiError?.status === 409
          ? "This email is already in use"
          : "Failed to save partner");
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete partner?")) return;

    await deletePartner(id);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6">

      <OwnerPageHeader
        title="Partner Dashboard"
        description="Manage partners, listings, revenue, and operations"
      />

      {/* TABS */}
      <div className="flex gap-3 border-b dark:border-gray-700">

        {[
          { id: 1, label: "Overview", icon: BarChart3 },
          { id: 2, label: "Listings", icon: Eye },
          { id: 3, label: "Pending Requests", icon: FileText },
          { id: 5, label: "Docs & Analytics", icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 ${
              tab === t.id
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}

      </div>

      {/* OVERVIEW */}
        {tab === 1 && <OverviewTab />}
        {false && (
          <div className="space-y-6">

            {/* TOP NOTICE */}
            <div
              className="
                border-l-4 border-l-indigo-500
                bg-gray-100 dark:bg-gray-900
                rounded-2xl
                px-5 py-4
                shadow-md
                border border-gray-200 dark:border-gray-700
              "
            >
              <p className="text-gray-700 dark:text-gray-200 text-sm md:text-base font-medium">
                Your listings have been active since March 12, 2025.
                Last reviewed by the platform admin 4 days ago.
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

              {/* PROFILE VIEWS */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 shadow-lg hover:scale-[1.02] transition-all duration-300">

                <div className="absolute top-4 right-4 opacity-20">
                  <Eye className="w-14 h-14 text-white" />
                </div>

                <p className="text-indigo-100 text-sm font-medium">
                  Profile Views
                </p>

                <h2 className="text-4xl font-bold text-white mt-2">
                  1,248
                </h2>

                <p className="text-indigo-200 text-sm mt-3 font-medium">
                  â–² +18% this month
                </p>
              </div>

              {/* INQUIRIES */}
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-700 rounded-2xl p-5 shadow-lg hover:scale-[1.02] transition-all duration-300">

                <div className="absolute top-4 right-4 opacity-20">
                  <MessageCircle className="w-14 h-14 text-white" />
                </div>

                <p className="text-blue-100 text-sm font-medium">
                  Inquiries
                </p>

                <h2 className="text-4xl font-bold text-white mt-2">
                  34
                </h2>

                <p className="text-blue-100 text-sm mt-3 font-medium">
                  Last 30 days
                </p>
              </div>

              {/* CONFIRMED BOOKINGS */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl p-5 shadow-lg hover:scale-[1.02] transition-all duration-300">

                <div className="absolute top-4 right-4 opacity-20">
                  <FileText className="w-14 h-14 text-white" />
                </div>

                <p className="text-green-100 text-sm font-medium">
                  Confirmed Bookings
                </p>

                <h2 className="text-4xl font-bold text-white mt-2">
                  9
                </h2>

                <p className="text-green-100 text-sm mt-3 font-medium">
                  Via this platform
                </p>
              </div>

              {/* AVG RATING */}
              <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 shadow-lg hover:scale-[1.02] transition-all duration-300">

                <div className="absolute top-4 right-4 opacity-20 text-6xl">
                  â­
                </div>

                <p className="text-yellow-100 text-sm font-medium">
                  Avg. Rating
                </p>

                <h2 className="text-4xl font-bold text-white mt-2">
                  4.7
                </h2>

                <p className="text-yellow-100 text-sm mt-3 font-medium">
                  From 22 reviews
                </p>
              </div>

            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">

              {/* HEADER */}
              <div className="px-6 pt-5 pb-3 flex items-center justify-between">

                <h2 className="text-sm font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
                  Recent Activity
                </h2>

                <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                  Live
                </span>

              </div>

              {/* ACTIVITY LIST */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">

                {[
                  {
                    title: "Edit request submitted",
                    date: "May 1",
                    color: "bg-yellow-500",
                  },
                  {
                    title: "New message from platform owner",
                    date: "Apr 29",
                    color: "bg-sky-500",
                  },
                  {
                    title: "Photo update approved",
                    date: "Apr 22",
                    color: "bg-green-500",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-200 dark:hover:bg-white/5 transition-all duration-200"
                  >

                    <div className="flex items-center gap-3">

                      <div className={`w-3 h-3 rounded-full ${activity.color}`} />

                      <p className="text-gray-700 dark:text-gray-200 font-medium">
                        {activity.title}
                      </p>

                    </div>

                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {activity.date}
                    </span>

                  </div>
                ))}

              </div>

            </div>

          </div>
        )}

     {/* LISTINGS */}
{tab === 2 && <ListingsTab />}
{false && (
  <div className="space-y-5">

    {/* SEARCH + ACTIONS */}
    <div className="flex gap-3">

      <div className="relative w-full">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

        <input
          className="
            w-full pl-10 py-2.5
            border border-gray-200 dark:border-gray-700
            rounded-xl
            dark:bg-gray-800
            focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
          placeholder="Search listing..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button
        type="button"
        title="Add Partner"
        aria-label="Add Partner"
        onClick={() => setModalOpen(true)}
        className="
          bg-indigo-600 hover:bg-indigo-700
          text-white px-4 rounded-xl
          flex items-center justify-center
          transition
        "
      >
        <Plus className="w-5 h-5" />
      </button>

      <button
        type="button"
        title="Refresh"
        aria-label="Refresh"
        onClick={() => window.location.reload()}
        className="
          px-4 rounded-xl
          border border-gray-200 dark:border-gray-700
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition
        "
      >
        <RefreshCw className="w-5 h-5" />
      </button>

    </div>

    {(() => {

      const listingsExample = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,

        fullname: `Tagaytay Villa ${i + 1}`,
        email: `villa${i + 1}@example.com`,
        status: i % 2 === 0 ? "active" : "inactive",

        location: "Tagaytay City, Cavite",
        property_type: "Villa / Private house",
        guests: 12,
        bedrooms: 4,
        bathrooms: 3,
        nightly_rate: 8500,
        minimum_nights: 2,

        description:
          "A serene hilltop retreat overlooking Taal Lake. Includes private pool, full kitchen, and outdoor BBQ area. Perfect for family gatherings and barkada outings.",

        amenities: [
          "Pool",
          "WiFi",
          "Air-con",
          "Parking",
          "BBQ",
          "Kitchen",
          "Smart TV",
        ],

        image:
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop",
      }));

      const filteredListings = listingsExample.filter((p) =>
        p.fullname.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
      );

      const paginatedListings = filteredListings.slice(
        (page - 1) * perPage,
        page * perPage
      );

      return (
        <>
          {/* MAIN LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

           {/* LEFT SIDE */}
<div className="xl:col-span-1">

  <div
    className="
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      rounded-2xl
      overflow-hidden
      shadow-sm
    "
  >

    <div className="p-4 border-b dark:border-gray-700">
      <h2 className="font-semibold text-lg">
        Listings
      </h2>

      <p className="text-sm text-gray-500">
        Select a listing to view details
      </p>
    </div>

    <div className="max-h-[700px] overflow-y-auto">

      {paginatedListings.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelectedListing(p as any)}
          className={`
            w-full text-left p-2.5 border-b
            dark:border-gray-700
            transition-all duration-200
            hover:bg-gray-50 dark:hover:bg-gray-800
            ${
              selectedListing?.id === p.id
                ? "bg-indigo-50 dark:bg-indigo-500/10"
                : ""
            }
          `}
        >

          <div className="flex gap-3">

            {/* SMALLER IMAGE */}
            <img
              src={p.image}
              alt={p.fullname}
              className="w-16 h-16 rounded-lg object-cover"
            />

            <div className="flex-1 min-w-0">

              <div className="flex items-start justify-between gap-2">

                <div className="min-w-0">

                  <h3 className="font-semibold text-sm truncate text-gray-800 dark:text-white">
                    {p.fullname}
                  </h3>

                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {p.location}
                  </p>

                </div>

                <span
                  className={`
                    text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap
                    ${
                      p.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                >
                  {p.status}
                </span>

              </div>

              <div className="mt-2 flex items-center justify-between gap-2">

                <p className="text-[11px] text-gray-500 truncate">
                  {p.property_type}
                </p>

                <p className="text-xs font-semibold text-indigo-600 whitespace-nowrap">
                  â‚±{p.nightly_rate.toLocaleString()}
                </p>

              </div>

            </div>

          </div>

        </button>
      ))}

    </div>

  </div>

</div>

            {/* RIGHT SIDE DETAILS */}
            <div className="xl:col-span-2">

              {selectedListing ? (
                <div
                  className="
                    bg-white dark:bg-gray-900
                    border border-gray-200 dark:border-gray-700
                    rounded-2xl
                    overflow-hidden
                    shadow-sm
                  "
                >

                  {/* IMAGE */}
                  <div className="relative h-[320px]">

                    <img
                      src={selectedListing.image}
                      alt={selectedListing.fullname}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className="absolute bottom-6 left-6 text-white">

                      <h2 className="text-3xl font-bold">
                        {selectedListing.fullname}
                      </h2>

                      <p className="mt-1 text-white/90">
                        {selectedListing.location}
                      </p>

                    </div>

                    <div className="absolute top-5 right-5">

                      <span
                        className={`
                          px-3 py-1 rounded-full text-sm font-medium
                          ${
                            selectedListing.status === "active"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }
                        `}
                      >
                        {selectedListing.status}
                      </span>

                    </div>

                  </div>

                  {/* CONTENT */}
                  <div className="p-6 space-y-6">

                    {/* QUICK INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-500">
                          Property type
                        </p>

                        <p className="font-semibold mt-1">
                          {selectedListing.property_type}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-500">
                          Max guests
                        </p>

                        <p className="font-semibold mt-1">
                          {selectedListing.guests} pax
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-500">
                          Bedrooms / Baths
                        </p>

                        <p className="font-semibold mt-1">
                          {selectedListing.bedrooms} BR /{" "}
                          {selectedListing.bathrooms} Bath
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-500">
                          Nightly rate shown
                        </p>

                        <p className="font-semibold mt-1 text-indigo-600">
                          â‚±
                          {selectedListing.nightly_rate.toLocaleString()} /
                          night
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 md:col-span-2">
                        <p className="text-sm text-gray-500">
                          Minimum nights
                        </p>

                        <p className="font-semibold mt-1">
                          {selectedListing.minimum_nights} nights
                        </p>
                      </div>

                    </div>

                    {/* DESCRIPTION */}
                    <div>

                      <h3 className="text-lg font-semibold mb-3">
                        Description on platform
                      </h3>

                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {selectedListing.description}
                      </p>

                    </div>

                    {/* AMENITIES */}
                    <div>

                      <h3 className="text-lg font-semibold mb-3">
                        Amenities listed
                      </h3>

                      <div className="flex flex-wrap gap-3">

                        {selectedListing.amenities.map(
                          (item: string, idx: number) => (
                            <span
                              key={idx}
                              className="
                                px-4 py-2 rounded-full
                                bg-indigo-50 dark:bg-indigo-500/10
                                text-indigo-700 dark:text-indigo-300
                                text-sm font-medium
                              "
                            >
                              {item}
                            </span>
                          )
                        )}

                      </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap gap-3 pt-4">

                      <button
                        onClick={() => {
                          setEditing(selectedListing as any);
                          setForm(selectedListing as any);
                          setModalOpen(true);
                        }}
                        className="
                          px-5 py-2.5
                          rounded-xl
                          bg-indigo-600 hover:bg-indigo-700
                          text-white
                          flex items-center gap-2
                          transition
                        "
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Listing
                      </button>

                      <button
                        onClick={() => {
                          toast.success(
                            `${selectedListing.fullname} approved`
                          );
                        }}
                        className="
                          px-5 py-2.5
                          rounded-xl
                          bg-green-600 hover:bg-green-700
                          text-white
                          transition
                        "
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => {
                          toast.error(
                            `${selectedListing.fullname} rejected`
                          );
                        }}
                        className="
                          px-5 py-2.5
                          rounded-xl
                          bg-red-600 hover:bg-red-700
                          text-white
                          transition
                        "
                      >
                        Reject
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(String(selectedListing.id))
                        }
                        className="
                          px-5 py-2.5
                          rounded-xl
                          border border-red-300
                          text-red-600
                          hover:bg-red-50
                          transition
                        "
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              ) : (
                <div
                  className="
                    h-full min-h-[500px]
                    flex items-center justify-center
                    rounded-2xl
                    border border-dashed border-gray-300 dark:border-gray-700
                    bg-white dark:bg-gray-900
                  "
                >
                  <div className="text-center">

                    <Eye className="w-12 h-12 mx-auto text-gray-400 mb-3" />

                    <h3 className="text-lg font-semibold">
                      No Listing Selected
                    </h3>

                    <p className="text-gray-500 text-sm mt-1">
                      Choose a listing from the left panel
                    </p>

                  </div>
                </div>
              )}

            </div>

          </div>

          {/* PAGINATION */}
          <div className="flex gap-2">

            {Array.from({
              length: Math.ceil(filteredListings.length / perPage),
            }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`
                  px-3 py-1 rounded-lg border
                  ${
                    page === i + 1
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 dark:border-gray-700"
                  }
                `}
              >
                {i + 1}
              </button>
            ))}

          </div>
        </>
      );
    })()}

  </div>
)}

      {/* PENDING REQUESTS */}
      {tab === 3 && <PendingRequestsTab />}



      {/* DOCS & ANALYTICS */}
{tab === 5 && <DocsAnalyticsTab />}
{false && (
  <div className="space-y-6">

    {/* TOP NOTICE */}
    <div
      className="
        border-l-4 border-l-indigo-500
        bg-gray-100 dark:bg-[#1E1E1E]
        rounded-2xl
        px-5 py-4
        border border-gray-200 dark:border-white/10
      "
    >
      <p className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
        Review platform agreements, downloadable files,
        and listing performance analytics.
      </p>
    </div>

    {/* MAIN GRID */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* =========================================
          DOCUMENTS
      ========================================= */}
      <div className="xl:col-span-1">

        <div
          className="
            rounded-3xl
            border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#181818]
            overflow-hidden
            shadow-sm
          "
        >

          {/* HEADER */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents & Agreements
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Partnership files and policies
            </p>

          </div>

          {/* DOC LIST */}
          <div className="divide-y divide-gray-200 dark:divide-white/10">

            {[
              {
                title: "Partnership agreement",
                desc: "Signed Mar 10, 2025 â€¢ Expires Jun 30, 2025",
                badge: "Active",
                color:
                  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
              },

              {
                title: "Platform guidelines & policies",
                desc: "Updated Jan 2025",
                badge: "PDF",
                color:
                  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
              },

              {
                title: "Commission & payout structure",
                desc: "15% platform fee â€¢ Payout every 15th",
                badge: "PDF",
                color:
                  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
              },

              {
                title: "Monthly analytics report",
                desc: "Generated automatically",
                badge: "PDF",
                color:
                  "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
              },
            ].map((doc, index) => (

              <button
                key={index}
                className="
                  w-full
                  flex items-center justify-between
                  gap-4
                  px-5 py-4
                  text-left
                  hover:bg-gray-50 dark:hover:bg-white/[0.03]
                  transition
                "
              >

                {/* LEFT */}
                <div className="flex items-center gap-4 min-w-0">

                  <div
                    className="
                      h-12 w-12
                      rounded-2xl
                      bg-gray-100 dark:bg-white/5
                      flex items-center justify-center
                      shrink-0
                    "
                  >
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>

                  <div className="min-w-0">

                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {doc.title}
                    </p>

                    <p className="text-sm text-gray-500 truncate">
                      {doc.desc}
                    </p>

                  </div>

                </div>

                {/* BADGE */}
                <span
                  className={`
                    px-3 py-1
                    rounded-full
                    text-xs font-semibold
                    whitespace-nowrap
                    ${doc.color}
                  `}
                >
                  {doc.badge}
                </span>

              </button>
            ))}

          </div>

        </div>

      </div>

      {/* =========================================
          ANALYTICS
      ========================================= */}
      <div className="xl:col-span-2">

        <div
          className="
            rounded-3xl
            border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#181818]
            p-6
            shadow-sm
          "
        >

          {/* HEADER */}
          <div className="mb-8">

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Listing Performance
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Traffic sources and engagement insights
            </p>

          </div>

          {/* TRAFFIC */}
          <div className="space-y-5">

            {[
              {
                label: "Search",
                value: "72%",
                widthClass: "w-[72%]",
                color: "bg-emerald-500",
              },

              {
                label: "Homepage",
                value: "18%",
                widthClass: "w-[18%]",
                color: "bg-blue-500",
              },

              {
                label: "Referral",
                value: "10%",
                widthClass: "w-[10%]",
                color: "bg-amber-500",
              },
            ].map((item, index) => (

              <div key={index}>

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>

                </div>

                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">

                  <div
                    className={`h-full rounded-full ${item.color} ${item.widthClass}`}
                  />

                </div>

              </div>
            ))}

          </div>

          {/* STATS */}
          <div
            className="
              grid grid-cols-1 sm:grid-cols-3
              gap-5
              mt-8
              pt-6
              border-t border-gray-200 dark:border-white/10
            "
          >

            <div>

              <p className="text-sm text-gray-500">
                Click-through rate
              </p>

              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                8.3%
              </h3>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Avg. session time
              </p>

              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                2m 14s
              </h3>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Saved / wishlist
              </p>

              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                47
              </h3>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
)}

      {/* MODAL */}
      <AddPartnerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingPartner={editing}
        formData={form}
        onFormChange={(e) =>
          setForm((p) => ({
            ...p,
            [e.target.name]:
              e.target.name === "commission_rate"
                ? Number(e.target.value)
                : e.target.value,
          }))
        }
        onSave={handleSave}
        isCreating={false}
        isUpdating={false}
      />

    </div>
  );
};

export default PartnerManagementPage;


/* =========================================
   PENDING REQUESTS TAB
   Real partner haven submissions awaiting review
========================================= */
function PendingRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const { data: submissions = [], isLoading } = useGetPartnerSubmissionsQuery({ status: statusFilter });
  const [reviewMutation, { isLoading: isReviewing }] = useReviewPartnerHavenMutation();
  const [selected, setSelected] = useState<PartnerHavenSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMode, setRejectMode] = useState(false);

  const closeDrawer = () => {
    setSelected(null);
    setRejectMode(false);
    setRejectReason("");
  };

  const handleApprove = async (haven: PartnerHavenSubmission) => {
    try {
      await reviewMutation({ haven_id: haven.uuid_id, action: "approve" }).unwrap();
      toast.success(`${haven.haven_name} approved and now live`);
      closeDrawer();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      await reviewMutation({
        haven_id: selected.uuid_id,
        action: "reject",
        reason: rejectReason.trim(),
      }).unwrap();
      toast.success(`${selected.haven_name} rejected`);
      closeDrawer();
    } catch {
      toast.error("Failed to reject");
    }
  };

  const statusFilters = [
    { id: "pending" as const, label: "Pending" },
    { id: "approved" as const, label: "Approved" },
    { id: "rejected" as const, label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* INFO BANNER */}
      <div className="border border-gray-200 dark:border-white/5 border-l-4 border-l-indigo-500 bg-gray-100 dark:bg-[#1E1E1E] rounded-2xl px-4 py-3">
        <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base font-medium leading-relaxed">
          Review havens submitted by partner accounts. Approving makes them visible to guests instantly. Rejecting sends the reason back to the partner so they can resubmit.
        </p>
      </div>

      {/* STATUS FILTER + HEADER */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
          Partner haven submissions
        </h2>
        <div className="flex gap-2">
          {statusFilters.map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading submissionsâ€¦</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500 grid place-items-center mx-auto mb-4">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            No {statusFilter} submissions
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
            {statusFilter === "pending"
              ? "When partners submit new havens for review, they'll appear here."
              : `No havens have been ${statusFilter} yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div
              key={s.uuid_id}
              className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200"
            >
              {/* Image */}
              <div className="relative w-full md:w-44 h-40 md:h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                {s.images?.[0]?.image_url ? (
                  <Image
                    src={s.images[0].image_url}
                    alt={s.haven_name}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-gray-400">
                    <Building className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
                  {s.haven_name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 mt-1">
                  Submitted by <strong className="text-gray-700 dark:text-gray-300">{s.partner_name || s.partner_email}</strong>
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Type:</strong> {s.view_type || "â€”"} Â· sleeps {s.capacity || "â€”"}</div>
                  <div><strong>Location:</strong> {[s.tower, s.floor].filter(Boolean).join(" Â· ") || "â€”"}</div>
                  <div><strong>Weekday:</strong> â‚±{Number(s.weekday_rate || 0).toLocaleString("en-PH")} / night</div>
                </div>
                {s.reason && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    <strong>Reason:</strong> {s.reason}
                  </div>
                )}
              </div>

              {/* Right side actions */}
              <div className="flex flex-col items-stretch md:items-end gap-3 md:w-auto">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-center ${
                    statusFilter === "approved"
                      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                      : statusFilter === "rejected"
                      ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
                      : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                  }`}
                >
                  {statusFilter === "pending" ? "Pending review" : statusFilter}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(s)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  {statusFilter === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(s)}
                        disabled={isReviewing}
                        className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelected(s); setRejectMode(true); }}
                        disabled={isReviewing}
                        className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XIcon className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL / REJECT DRAWER */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeDrawer} />
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white flex-shrink-0">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur grid place-items-center text-base font-bold flex-shrink-0">
                  {(selected.partner_name || selected.partner_email).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{selected.haven_name}</h2>
                  <p className="text-sm opacity-90 truncate">
                    by {selected.partner_name || selected.partner_email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                title="Close"
                aria-label="Close"
                className="p-2 rounded-xl hover:bg-white/20 transition flex-shrink-0"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* BODY â€” 2 column on desktop */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
              {/* LEFT COLUMN â€” Listing details */}
              <div className="space-y-4">
                {/* Hero photo */}
                {selected.images && selected.images.length > 0 ? (
                  <>
                    <div className="relative h-56 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800">
                      <Image
                        src={selected.images[0].image_url}
                        alt={selected.haven_name}
                        fill
                        sizes="800px"
                        className="object-cover"
                      />
                    </div>
                    {selected.images.length > 1 && (
                      <div className="grid grid-cols-6 gap-1.5">
                        {selected.images.slice(1, 7).map((img) => (
                          <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-slate-800">
                            <Image src={img.image_url} alt="" fill sizes="80px" className="object-cover" />
                          </div>
                        ))}
                        {selected.images.length > 7 && (
                          <div className="relative aspect-square rounded-md bg-gray-900/80 grid place-items-center text-white text-[10px] font-bold">
                            +{selected.images.length - 7}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-44 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border-2 border-dashed border-rose-200 dark:border-rose-500/30 grid place-items-center text-rose-700 dark:text-rose-300 text-sm font-semibold">
                    <div className="text-center">
                      <AlertCircle className="w-7 h-7 mx-auto mb-1" />
                      No photos uploaded yet
                    </div>
                  </div>
                )}

                {/* Quick facts â€” single grouped card */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-slate-700">
                    <FactCell label="Type" value={selected.view_type || "â€”"} />
                    <FactCell label="Sleeps" value={String(selected.capacity || "â€”")} />
                    <FactCell label="Beds" value={selected.beds || "â€”"} />
                    <FactCell label="Room size" value={selected.room_size ? `${selected.room_size} sqm` : "â€”"} />
                  </div>
                </div>

                {/* Pricing â€” single row */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Pricing</p>
                  </div>
                  <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-slate-700">
                    <FactCell label="6h" value={`â‚±${Number(selected.six_hour_rate || 0).toLocaleString("en-PH")}`} />
                    <FactCell label="10h" value={`â‚±${Number(selected.ten_hour_rate || 0).toLocaleString("en-PH")}`} />
                    <FactCell label="Weekday" value={`â‚±${Number(selected.weekday_rate || 0).toLocaleString("en-PH")}`} />
                    <FactCell label="Weekend" value={`â‚±${Number(selected.weekend_rate || 0).toLocaleString("en-PH")}`} />
                  </div>
                </div>

                {/* Check-in / out â€” single row */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Check-in / out</p>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700">
                    <TimeCell label="6h stay" start={selected.six_hour_check_in} end={selected.six_hour_check_out} />
                    <TimeCell label="10h stay" start={selected.ten_hour_check_in} end={selected.ten_hour_check_out} />
                    <TimeCell label="21h stay" start={selected.twenty_one_hour_check_in} end={selected.twenty_one_hour_check_out} />
                  </div>
                </div>

                {/* Amenities â€” compact chips */}
                {selected.amenities && Object.keys(selected.amenities).filter((k) => selected.amenities![k]).length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                      Amenities Â· {Object.keys(selected.amenities).filter((k) => selected.amenities![k]).length}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(selected.amenities)
                        .filter((k) => selected.amenities![k])
                        .map((amenity) => (
                          <span key={amenity} className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            {amenity.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Description + tour meta + YouTube â€” combined */}
                {(selected.description || (selected.photo_tour && selected.photo_tour.length > 0) || selected.youtube_url) && (
                  <div className="space-y-3">
                    {selected.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selected.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                      {selected.photo_tour && selected.photo_tour.length > 0 && (
                        <span>
                          {selected.photo_tour.length} photo tour Â·{" "}
                          {new Set(selected.photo_tour.map(p => p.category)).size} categories
                        </span>
                      )}
                      {selected.youtube_url && (
                        <a
                          href={selected.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                        >
                          â–¶ Watch video tour
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN â€” Partner track record + Reject reason */}
              <div className="space-y-5">
                {/* Partner track record card */}
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500 text-white grid place-items-center font-bold text-sm flex-shrink-0">
                      {(selected.partner_name || selected.partner_email).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{selected.partner_name || "â€”"}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{selected.partner_email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {selected.partner_phone && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Phone</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{selected.partner_phone}</span>
                      </div>
                    )}
                    {selected.partner_address && (
                      <div className="flex justify-between text-xs gap-2">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Address</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium text-right truncate">{selected.partner_address}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Account status</span>
                      <span className={`font-bold uppercase ${selected.partner_status === "active" ? "text-emerald-600" : "text-amber-600"}`}>
                        {selected.partner_status || "â€”"}
                      </span>
                    </div>
                    {selected.partner_joined_at && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Joined</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {new Date(selected.partner_joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Commission rate</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {Number(selected.partner_commission_rate || 12).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Submission history */}
                  <div className="pt-3 border-t border-indigo-200 dark:border-indigo-500/30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                      Submission Track Record
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-900">
                        <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                          {selected.partner_total_havens || 0}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">Total</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {selected.partner_approved_havens || 0}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-emerald-600">Approved</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                        <div className="text-xl font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                          {selected.partner_rejected_havens || 0}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-rose-600">Rejected</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviewer Checklist */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                  <p className="text-xs uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Reviewer Checklist
                  </p>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5">
                    <li>â€¢ Photos clear and high-resolution?</li>
                    <li>â€¢ Description matches the photos?</li>
                    <li>â€¢ Pricing reasonable for the type?</li>
                    <li>â€¢ Required amenities listed?</li>
                    <li>â€¢ Check-in / check-out times valid?</li>
                  </ul>
                </div>

                {rejectMode && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Rejection reason (sent to partner)
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={5}
                      placeholder="e.g. Photos are too dark â€” please resubmit with brighter lighting and at least 3 angles of each room."
                      className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex flex-col-reverse sm:flex-row gap-3 justify-end bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={closeDrawer}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-sm"
              >
                Close
              </button>
              {statusFilter === "pending" && !rejectMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setRejectMode(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm inline-flex items-center gap-2 justify-center"
                  >
                    <XIcon className="w-4 h-4" /> Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selected)}
                    disabled={isReviewing}
                    className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm inline-flex items-center gap-2 justify-center disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Approve & publish
                  </button>
                </>
              )}
              {statusFilter === "pending" && rejectMode && (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isReviewing}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm inline-flex items-center gap-2 justify-center disabled:opacity-50"
                >
                  {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XIcon className="w-4 h-4" />}
                  Confirm rejection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DrawerInfo = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
    <p className="text-[10px] uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
  </div>
);

// Format DB time string "HH:MM:SS" â†’ "9:00 AM"
const formatTime = (t?: string | null): string => {
  if (!t) return "â€”";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
};

const TimeRangeBox = ({ label, start, end }: { label: string; start?: string | null; end?: string | null }) => (
  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 dark:bg-white/5 border border-gray-200 dark:border-slate-700 dark:border-white/5">
    <p className="text-[10px] uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-800 dark:text-gray-200">
      <span>{formatTime(start)}</span>
      <span className="text-gray-400">â†’</span>
      <span>{formatTime(end)}</span>
    </div>
  </div>
);

// Compact cell for grouped fact tables (no border, sits inside a divided container)
const FactCell = ({ label, value }: { label: string; value: string }) => (
  <div className="px-3 py-2.5 min-w-0">
    <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400 dark:text-gray-500 truncate">{label}</p>
    <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate mt-0.5">{value}</p>
  </div>
);

const TimeCell = ({ label, start, end }: { label: string; start?: string | null; end?: string | null }) => (
  <div className="px-3 py-2.5 min-w-0">
    <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400 dark:text-gray-500 truncate">{label}</p>
    <p className="text-[12px] font-semibold text-gray-900 dark:text-white mt-0.5">
      {formatTime(start)} <span className="text-gray-400">â†’</span> {formatTime(end)}
    </p>
  </div>
);


/* =========================================
   OVERVIEW TAB â€” real partner-wide stats
========================================= */
function OverviewTab() {
  const { data, isLoading } = useGetPartnersOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading overviewâ€¦</p>
      </div>
    );
  }

  const ov = data || {
    partners: { total: 0, active: 0, pending: 0, suspended: 0 },
    havens: { total: 0, pending: 0, approved: 0, rejected: 0 },
    bookings: { total: 0, completed: 0, last_30_days: 0, gross_revenue: 0 },
    financials: { partner_earnings: 0, partner_paid: 0, platform_commission: 0, avg_commission_rate: 12 },
    recent_activity: [] as Array<{ kind: string; title: string; partner: string | null; at: string }>,
  };

  const peso = (n: number) => "â‚±" + (n || 0).toLocaleString("en-PH");
  const relTime = (iso: string) => {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* TOP NOTICE */}
      <div className="border-l-4 border-l-indigo-500 bg-gray-100 dark:bg-gray-900 rounded-2xl px-5 py-4 shadow-md border border-gray-200 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-200 text-sm md:text-base font-medium">
          <strong>{ov.partners.active} active partners</strong> across the platform with{" "}
          <strong>{ov.havens.approved} live listings</strong>.{" "}
          {ov.havens.pending > 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {ov.havens.pending} submission{ov.havens.pending === 1 ? "" : "s"} awaiting your review.
            </span>
          ) : (
            "No pending submissions."
          )}
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={<Users className="w-14 h-14 text-white" />}
          label="Total Partners"
          value={String(ov.partners.total)}
          sub={`${ov.partners.active} active, ${ov.partners.pending} pending`}
          gradient="from-indigo-600 to-indigo-800"
          fg="text-indigo-100"
          fgSub="text-indigo-200"
        />
        <StatCard
          icon={<Building className="w-14 h-14 text-white" />}
          label="Partner Listings"
          value={String(ov.havens.total)}
          sub={`${ov.havens.approved} live, ${ov.havens.pending} pending`}
          gradient="from-sky-500 to-blue-700"
          fg="text-blue-100"
          fgSub="text-blue-200"
        />
        <StatCard
          icon={<FileText className="w-14 h-14 text-white" />}
          label="Bookings (30d)"
          value={String(ov.bookings.last_30_days)}
          sub={`${ov.bookings.total} total Â· ${ov.bookings.completed} completed`}
          gradient="from-emerald-500 to-green-700"
          fg="text-green-100"
          fgSub="text-green-200"
        />
        <StatCard
          icon={<BarChart3 className="w-14 h-14 text-white" />}
          label="Platform Revenue"
          value={peso(ov.financials.platform_commission)}
          sub={`${ov.financials.avg_commission_rate.toFixed(1)}% avg commission`}
          gradient="from-yellow-400 to-orange-500"
          fg="text-yellow-100"
          fgSub="text-yellow-200"
        />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
            Recent Activity
          </h2>
          <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
            Live
          </span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {ov.recent_activity.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 px-6 py-8 text-sm">
              No recent partner activity.
            </p>
          ) : (
            ov.recent_activity.map((a, i) => {
              const color = a.kind === "haven_submitted" ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-200 dark:hover:bg-white/5 transition-all duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
                    <p className="text-gray-700 dark:text-gray-200 font-medium truncate">
                      {a.title} {a.partner ? <span className="text-gray-500 font-normal">â€” {a.partner}</span> : null}
                    </p>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap flex-shrink-0 ml-3">
                    {relTime(a.at)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, sub, gradient, fg, fgSub }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  gradient: string; fg: string; fgSub: string;
}) => (
  <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-lg hover:scale-[1.02] transition-all duration-300`}>
    <div className="absolute top-4 right-4 opacity-20">{icon}</div>
    <p className={`${fg} text-sm font-medium`}>{label}</p>
    <h2 className="text-3xl xl:text-4xl font-bold text-white mt-2 truncate">{value}</h2>
    <p className={`${fgSub} text-xs mt-3 font-medium`}>{sub}</p>
  </div>
);


/* =========================================
   LISTINGS TAB â€” master-detail layout
   Left: scrollable list of partners
   Right: selected partner's rooms with hero
========================================= */
interface PartnerGroup {
  partner_id: string;
  partner_name: string;
  partner_email: string;
  commission_rate: number | null;
  rooms: PartnerListingRow[];
}

function ListingsTab() {
  const [search, setSearch] = useState("");
  const { data: listings = [], isLoading } = useGetPartnerListingsQuery();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Group listings by partner
  const groupedByPartner: PartnerGroup[] = useMemo(() => {
    const map = new Map<string, PartnerGroup>();
    for (const l of listings) {
      const existing = map.get(l.partner_id);
      if (existing) {
        existing.rooms.push(l);
      } else {
        map.set(l.partner_id, {
          partner_id: l.partner_id,
          partner_name: l.partner_name || l.partner_email.split("@")[0],
          partner_email: l.partner_email,
          commission_rate: l.commission_rate,
          rooms: [l],
        });
      }
    }
    return Array.from(map.values());
  }, [listings]);

  const filtered = groupedByPartner.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.partner_name.toLowerCase().includes(q) ||
      p.partner_email.toLowerCase().includes(q) ||
      p.rooms.some((r) => r.haven_name.toLowerCase().includes(q))
    );
  });

  // Auto-select first partner when list loads
  React.useEffect(() => {
    if (!selectedPartnerId && filtered.length > 0) {
      setSelectedPartnerId(filtered[0].partner_id);
    }
  }, [filtered, selectedPartnerId]);

  const selectedPartner = filtered.find((p) => p.partner_id === selectedPartnerId) || filtered[0] || null;
  const peso = (n: number) => "â‚±" + (n || 0).toLocaleString("en-PH");

  return (
    <div className="space-y-5">
      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by partner name, email, or room nameâ€¦"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search partners"
          className="w-full pl-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* MASTER-DETAIL */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
          <Loader2 className="w-7 h-7 text-brand-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading partnersâ€¦</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary grid place-items-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No partners with listings</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
            {search ? "Try a different search." : "Partners haven't submitted any havens yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 min-h-[640px]">
          {/* LEFT â€” partner list */}
          <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[760px]">
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Partners</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {filtered.length} active Â· select to view details
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((p) => {
                const isActive = selectedPartnerId === p.partner_id;
                const liveCount = p.rooms.filter((r) => r.status === "approved").length;
                const pendingCount = p.rooms.filter((r) => r.status === "pending").length;
                const initials = p.partner_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

                return (
                  <button
                    key={p.partner_id}
                    type="button"
                    onClick={() => setSelectedPartnerId(p.partner_id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 transition ${
                      isActive
                        ? "bg-brand-primary/5 dark:bg-brand-primary/10 border-l-4 border-l-brand-primary pl-3"
                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl grid place-items-center font-bold text-sm flex-shrink-0 ${
                      isActive ? "bg-brand-primary text-white" : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200"
                    }`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? "text-brand-primary" : "text-gray-900 dark:text-white"}`}>
                        {p.partner_name}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {p.rooms.length} room{p.rooms.length === 1 ? "" : "s"}
                        {liveCount > 0 && <> Â· <span className="text-emerald-600 dark:text-emerald-400">{liveCount} live</span></>}
                        {pendingCount > 0 && <> Â· <span className="text-amber-600 dark:text-amber-400">{pendingCount} pending</span></>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT â€” selected partner detail */}
          <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[760px]">
            {!selectedPartner ? (
              <div className="flex-1 grid place-items-center text-gray-400 text-sm">
                Select a partner to view their listings
              </div>
            ) : (
              <PartnerDetailPane partner={selectedPartner} peso={peso} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PartnerDetailPaneProps {
  partner: PartnerGroup;
  peso: (n: number) => string;
}

function PartnerDetailPane({ partner, peso }: PartnerDetailPaneProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  React.useEffect(() => {
    setSelectedRoomId(partner.rooms[0]?.uuid_id || null);
  }, [partner.partner_id, partner.rooms]);

  const selectedRoom = partner.rooms.find((r) => r.uuid_id === selectedRoomId) || partner.rooms[0];
  const liveCount = partner.rooms.filter((r) => r.status === "approved").length;
  const pendingCount = partner.rooms.filter((r) => r.status === "pending").length;
  const rejectedCount = partner.rooms.filter((r) => r.status === "rejected").length;
  const totalBookings = partner.rooms.reduce((s, r) => s + (r.bookings_count || 0), 0);
  const initials = partner.partner_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  if (!selectedRoom) {
    return (
      <div className="flex-1 grid place-items-center text-gray-400 text-sm">
        This partner has no rooms yet.
      </div>
    );
  }

  const statusConfig =
    selectedRoom.status === "approved"
      ? { label: "Live", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" }
      : selectedRoom.status === "rejected"
      ? { label: "Rejected", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" }
      : { label: "Pending", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };

  return (
    <>
      {/* Partner profile band */}
      <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/5 bg-gradient-to-br from-brand-primary/8 via-brand-primary/4 to-transparent dark:from-brand-primary/15 dark:via-brand-primary/8 flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white grid place-items-center font-bold text-base shadow-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{partner.partner_name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{partner.partner_email}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
            <NumStat value={partner.rooms.length} label="Rooms" />
            <NumStat value={totalBookings} label="Bookings" />
            <NumStat value={`${Number(partner.commission_rate || 12).toFixed(0)}%`} label="Fee" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          {liveCount > 0 && <StatusPill dot="bg-emerald-500" count={liveCount} label="Live" />}
          {pendingCount > 0 && <StatusPill dot="bg-amber-500" count={pendingCount} label="Pending" />}
          {rejectedCount > 0 && <StatusPill dot="bg-rose-500" count={rejectedCount} label="Rejected" />}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Hero image */}
        <div className="relative h-64 bg-gray-100 dark:bg-white/5 overflow-hidden rounded-2xl">
          {selectedRoom.image_url ? (
            <Image src={selectedRoom.image_url} alt={selectedRoom.haven_name} fill sizes="800px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-gray-400">
              <Building className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-2xl font-bold text-white drop-shadow">{selectedRoom.haven_name}</h3>
              <p className="text-sm text-white/90 mt-1">
                {[selectedRoom.tower, selectedRoom.floor].filter(Boolean).join(" Â· ") || "â€”"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
              <button
                type="button"
                onClick={() => setShowRoomDetails(true)}
                className="px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-gray-900 text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Minimal info under hero */}
        <div className="pt-5 space-y-5">
          {selectedRoom.rejection_reason && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-300 mb-1">Reason for rejection</p>
                <p className="text-sm text-rose-700/90 dark:text-rose-300/90">{selectedRoom.rejection_reason}</p>
              </div>
            </div>
          )}

          {partner.rooms.length > 1 && (
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mb-3">
                Other rooms from this partner
              </p>
              <div className="flex flex-wrap gap-2">
                {partner.rooms.map((r) => {
                  const isActive = r.uuid_id === selectedRoomId;
                  return (
                    <button
                      key={r.uuid_id}
                      type="button"
                      onClick={() => setSelectedRoomId(r.uuid_id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        isActive
                          ? "bg-brand-primary text-white"
                          : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {r.haven_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROOM DETAILS MODAL */}
      {showRoomDetails && (
        <RoomDetailsModal
          room={selectedRoom}
          peso={peso}
          onClose={() => setShowRoomDetails(false)}
        />
      )}
    </>
  );
}

interface RoomDetailsModalProps {
  room: PartnerListingRow;
  peso: (n: number) => string;
  onClose: () => void;
}

function RoomDetailsModal({ room, peso, onClose }: RoomDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  // If editing, only render the HavenFormModal (hide the details modal underneath)
  if (isEditing) {
    return (
      <HavenFormModal
        isOpen={true}
        onClose={() => {
          setIsEditing(false);
          onClose();
        }}
        initialData={{
          uuid_id: room.uuid_id,
          haven_name: room.haven_name,
          tower: room.tower,
          floor: room.floor,
          view_type: room.view_type,
          capacity: room.capacity,
          room_size: room.room_size,
          beds: room.beds,
          description: room.description,
          youtube_url: room.youtube_url,
          six_hour_rate: room.six_hour_rate,
          ten_hour_rate: room.ten_hour_rate,
          weekday_rate: room.weekday_rate,
          weekend_rate: room.weekend_rate,
          six_hour_check_in: room.six_hour_check_in,
          six_hour_check_out: room.six_hour_check_out,
          ten_hour_check_in: room.ten_hour_check_in,
          ten_hour_check_out: room.ten_hour_check_out,
          twenty_one_hour_check_in: room.twenty_one_hour_check_in,
          twenty_one_hour_check_out: room.twenty_one_hour_check_out,
          amenities: room.amenities,
          images: room.images,
          photo_tours: room.photo_tour,
          blocked_dates: [],
          partner_id: room.partner_id,
        } as unknown as Record<string, unknown>}
      />
    );
  }

  const statusConfig =
    room.status === "approved"
      ? { label: "Live", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" }
      : room.status === "rejected"
      ? { label: "Rejected", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" }
      : { label: "Pending", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#181818] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header with image */}
        <div className="relative h-56 bg-gray-100 dark:bg-white/5 overflow-hidden flex-shrink-0">
          {room.image_url ? (
            <Image src={room.image_url} alt={room.haven_name} fill sizes="900px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-gray-400">
              <Building className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-900 grid place-items-center transition active:scale-95 shadow"
          >
            <XIcon className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow">{room.haven_name}</h2>
              <p className="text-sm text-white/90 mt-0.5">
                {[room.tower, room.floor].filter(Boolean).join(" Â· ") || "â€”"}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Body â€” 2 column layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
          {/* LEFT â€” Listing details */}
          <div className="space-y-4">
            {/* Gallery (compact thumbnails) */}
            {room.images && room.images.length > 1 && (
              <div className="grid grid-cols-6 gap-1.5">
                {room.images.slice(0, 6).map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-white/5">
                    <Image src={img.image_url} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                ))}
                {room.images.length > 6 && (
                  <div className="relative aspect-square rounded-md bg-gray-900/80 grid place-items-center text-white text-[10px] font-bold">
                    +{room.images.length - 6}
                  </div>
                )}
              </div>
            )}

            {/* Quick facts â€” single grouped card */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/5">
                <FactCell label="Type" value={room.view_type || "â€”"} />
                <FactCell label="Sleeps" value={String(room.capacity || "â€”")} />
                <FactCell label="Beds" value={room.beds || "â€”"} />
                <FactCell label="Room size" value={room.room_size ? `${room.room_size} sqm` : "â€”"} />
              </div>
            </div>

            {/* Pricing â€” single row */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Pricing</p>
              </div>
              <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-white/5">
                <FactCell label="6h" value={peso(Number(room.six_hour_rate || 0))} />
                <FactCell label="10h" value={peso(Number(room.ten_hour_rate || 0))} />
                <FactCell label="Weekday" value={peso(Number(room.weekday_rate || 0))} />
                <FactCell label="Weekend" value={peso(Number(room.weekend_rate || 0))} />
              </div>
            </div>

            {/* Check-in / out â€” single row */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Check-in / out</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/5">
                <TimeCell label="6h stay" start={room.six_hour_check_in} end={room.six_hour_check_out} />
                <TimeCell label="10h stay" start={room.ten_hour_check_in} end={room.ten_hour_check_out} />
                <TimeCell label="21h stay" start={room.twenty_one_hour_check_in} end={room.twenty_one_hour_check_out} />
              </div>
            </div>

            {/* Amenities â€” compact chips */}
            {room.amenities && Object.keys(room.amenities).filter((k) => room.amenities![k]).length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                  Amenities Â· {Object.keys(room.amenities).filter((k) => room.amenities![k]).length}
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(room.amenities)
                    .filter((k) => room.amenities![k])
                    .map((amenity) => (
                      <span key={amenity} className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        {amenity.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Description + Photo tour + YouTube â€” combined extras row */}
            {(room.description || (room.photo_tour && room.photo_tour.length > 0) || room.youtube_url) && (
              <div className="space-y-3">
                {room.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {room.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  {room.photo_tour && room.photo_tour.length > 0 && (
                    <span>
                      {room.photo_tour.length} photo tour Â·{" "}
                      {Array.from(new Set(room.photo_tour.map((p) => p.category))).length} categories
                    </span>
                  )}
                  {room.youtube_url && (
                    <a
                      href={room.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                    >
                      â–¶ Watch video tour
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT â€” Partner info + rejection reason */}
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primaryDark text-white grid place-items-center font-bold text-sm flex-shrink-0">
                  {(room.partner_name || room.partner_email).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{room.partner_name || "â€”"}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{room.partner_email}</p>
                </div>
              </div>
              <div className="space-y-2">
                {room.partner_phone && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Phone</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{room.partner_phone}</span>
                  </div>
                )}
                {room.partner_address && (
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Address</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium text-right truncate">{room.partner_address}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Account status</span>
                  <span className={`font-bold uppercase ${room.partner_status === "active" ? "text-emerald-600" : "text-amber-600"}`}>
                    {room.partner_status || "â€”"}
                  </span>
                </div>
                {room.partner_joined_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Joined</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {new Date(room.partner_joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Commission rate</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {Number(room.commission_rate || 12).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Submitted</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {new Date(room.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {room.rejection_reason && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-700 dark:text-rose-300 mb-1">Reason for rejection</p>
                  <p className="text-sm text-rose-700/90 dark:text-rose-300/90">{room.rejection_reason}</p>
                  {room.reviewer_notes && (
                    <p className="text-xs text-rose-600/80 mt-2"><strong>Notes:</strong> {room.reviewer_notes}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-white/5 px-6 py-4 flex justify-end gap-3 bg-white dark:bg-[#181818] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-semibold text-sm transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold text-sm transition inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Room
          </button>
        </div>
      </div>
    </div>
  );
}

const DetailBox = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mb-1">
      {label}
    </p>
    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</p>
  </div>
);

const PartnerStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className={`rounded-lg px-2 py-2 text-center ${color}`}>
    <div className="text-base font-bold leading-none">{value}</div>
    <div className="text-[10px] uppercase tracking-wide font-semibold mt-1">{label}</div>
  </div>
);

const StatusPill = ({ dot, count, label }: { dot: string; count: number; label: string }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium">
    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
    <strong className="text-gray-900 dark:text-white">{count}</strong>
    <span className="text-gray-500">{label}</span>
  </span>
);

const NumStat = ({ value, label }: { value: number | string; label: string }) => (
  <div className="text-center">
    <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
      {label}
    </div>
  </div>
);


/* =========================================
   DOCS & ANALYTICS TAB â€” real aggregated metrics
========================================= */
function DocsAnalyticsTab() {
  const { data: ov, isLoading } = useGetPartnersOverviewQuery();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading analyticsâ€¦</p>
      </div>
    );
  }

  const peso = (n: number) => "â‚±" + (n || 0).toLocaleString("en-PH");
  const totalRevenue = ov?.bookings.gross_revenue || 0;
  const partnerEarnings = ov?.financials.partner_earnings || 0;
  const platformShare = ov?.financials.platform_commission || 0;
  const partnerPaid = ov?.financials.partner_paid || 0;
  const partnerOwed = Math.max(0, partnerEarnings - partnerPaid);
  const totalBookings = ov?.bookings.total || 0;
  const completedBookings = ov?.bookings.completed || 0;
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* TOP NOTICE */}
      <div className="border-l-4 border-l-indigo-500 bg-gray-100 dark:bg-[#1E1E1E] rounded-2xl px-5 py-4 border border-gray-200 dark:border-white/10">
        <p className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
          Aggregated metrics across all partner accounts. Updated live from the database.
        </p>
      </div>

      {/* REVENUE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Revenue Distribution
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              How total partner-haven revenue is split between partners and the platform.
            </p>
          </div>

          <div className="space-y-5">
            <AllocationBar
              label="Partner Earnings"
              value={peso(partnerEarnings)}
              pct={totalRevenue > 0 ? Math.round((partnerEarnings / totalRevenue) * 100) : 0}
              color="bg-emerald-500"
            />
            <AllocationBar
              label="Platform Commission"
              value={peso(platformShare)}
              pct={totalRevenue > 0 ? Math.round((platformShare / totalRevenue) * 100) : 0}
              color="bg-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            <div>
              <p className="text-sm text-gray-500">Total Gross Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {peso(totalRevenue)}
              </h3>
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Out to Partners</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {peso(partnerPaid)}
              </h3>
            </div>
            <div>
              <p className="text-sm text-gray-500">Partner Balance Owed</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {peso(partnerOwed)}
              </h3>
            </div>
          </div>
        </div>

        {/* OPERATIONAL METRICS */}
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Operations
          </h2>
          <div className="space-y-5">
            <MetricRow label="Total Bookings" value={String(totalBookings)} />
            <MetricRow label="Completed" value={`${completedBookings} (${completionRate}%)`} />
            <MetricRow label="Last 30 days" value={String(ov?.bookings.last_30_days || 0)} />
            <MetricRow label="Avg. commission rate" value={`${ov?.financials.avg_commission_rate.toFixed(1)}%`} />
            <MetricRow label="Live partner listings" value={String(ov?.havens.approved || 0)} />
            <MetricRow label="Pending review" value={String(ov?.havens.pending || 0)} />
          </div>
        </div>
      </div>

      {/* DOCUMENTS PLACEHOLDER */}
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Documents & Agreements
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Partnership files and policies (upload integration coming soon)
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {[
            { title: "Partnership agreement template", desc: "Reusable contract template for new partner onboarding", badge: "PDF" },
            { title: "Platform guidelines & policies", desc: "Standards partners must follow", badge: "PDF" },
            { title: "Commission & payout structure", desc: `${ov?.financials.avg_commission_rate.toFixed(1)}% platform fee Â· payout 15th & 30th`, badge: "Policy" },
          ].map((doc, i) => (
            <div key={i} className="w-full flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-white/5 grid place-items-center shrink-0">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{doc.title}</p>
                  <p className="text-sm text-gray-500 truncate">{doc.desc}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                {doc.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const AllocationBar = ({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) => {
  // Round to nearest 5 for Tailwind static class lookup
  const WIDTHS: Record<number, string> = {
    0: "w-0", 5: "w-[5%]", 10: "w-[10%]", 15: "w-[15%]", 20: "w-[20%]",
    25: "w-1/4", 30: "w-[30%]", 35: "w-[35%]", 40: "w-[40%]", 45: "w-[45%]",
    50: "w-1/2", 55: "w-[55%]", 60: "w-[60%]", 65: "w-[65%]", 70: "w-[70%]",
    75: "w-3/4", 80: "w-[80%]", 85: "w-[85%]", 90: "w-[90%]", 95: "w-[95%]", 100: "w-full",
  };
  const widthClass = WIDTHS[Math.round(pct / 5) * 5] || "w-0";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {value} <span className="text-gray-500 font-normal">Â· {pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color} ${widthClass}`} />
      </div>
    </div>
  );
};

const MetricRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-baseline">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-base font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);
