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
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MessageCircle,
  FileText,
  BarChart3,
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
const [messagePage, setMessagePage] = useState(1);
const [docsPage, setDocsPage] = useState(1);

/* COMPOSE MESSAGE */
const [composeOpen, setComposeOpen] = useState(false);

const [composeForm, setComposeForm] = useState({
  recipient: "",
  subject: "",
  message: "",
});

const [form, setForm] = useState({
  email: "",
  password: "",
  fullname: "",
  phone: "",
  address: "",
  type: "hotel",
  commission_rate: 10,
});


const [selectedMessage, setSelectedMessage] = useState<any>(null);

const [replyText, setReplyText] = useState("");

const handleSendMessage = () => {
  if (!replyText.trim() || !selectedMessage) return;

  const newMsg = {
    id: Date.now(),
    sender: "Platform Admin",
    recipient: selectedMessage.recipient,
    subject: "",
    message: replyText,
    date: new Date().toLocaleDateString(),
    read: true,
  };

  setMessages((prev) => [...prev, newMsg]);
  setReplyText("");
};

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
      oldValue: "₱3,000",
      newValue: "₱3,500",
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
      oldValue: "₱5,000",
      newValue: "₱5,500",
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
      oldValue: "₱2,500",
      newValue: "₱2,900",
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
      oldValue: "₱4,200",
      newValue: "₱4,800",
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
      oldValue: "₱6,000",
      newValue: "₱6,300",
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
   MESSAGES DATA
========================= */
const [messages, setMessages] = useState<
  {
    id: number;
    sender: string;
    recipient: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
  }[]
>([
  {
    id: 1,
    sender: "Platform Admin",
    recipient: "Sunset Hotel",
    subject: "Listing Update",
    message: "Your listing update request has been reviewed and approved.",
    date: "Apr 29",
    read: false,
  },
  {
    id: 2,
    sender: "Platform Admin",
    recipient: "Ocean View Resort",
    subject: "Policy Update",
    message: "Please review the new booking policy updates.",
    date: "Apr 25",
    read: true,
  },

  {
    id: 3,
    sender: "Customer",
    recipient: "Ocean View Resort",
    subject: "Water Pipe Issue",
    message: "Please check my water pipe. I think it's leaking.",
    date: "Apr 25",
    read: true,
  },
]);

const paginatedMessages = messages.slice(
  (messagePage - 1) * perPage,
  messagePage * perPage
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

        toast.success("Updated");
      } else {
        await createPartner(form).unwrap();
        toast.success("Created");
      }

      setModalOpen(false);
      setEditing(null);
    } catch {
      toast.error("Error saving");
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
          { id: 4, label: "Messages", icon: MessageCircle },
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
        {tab === 1 && (
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
                  ▲ +18% this month
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
                  ⭐
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
{tab === 2 && (
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
                  ₱{p.nightly_rate.toLocaleString()}
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
                          ₱
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
      {tab === 3 && (
        <div className="space-y-6">

        {/* INFO BANNER */}
        <div
          className="
            border border-gray-200 dark:border-white/5
            border-l-4 border-l-blue-500
            bg-gray-100 dark:bg-[#1E1E1E]
            rounded-2xl
            px-4 py-3
          "
        >
          <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base font-medium leading-relaxed">
            Changes to your listing require approval from the platform admin before going live.
            You'll be notified via Messages once reviewed.
          </p>
        </div>

        {/* HEADER */}
        <div>
          <h2 className="text-sm font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
            Pending & Recent Requests
          </h2>
        </div>

        {/* REQUEST LIST */}
        <div className="space-y-4">

          {paginatedEditRequests.map((req) => (
            <div
              key={req.id}
              className="
                bg-white dark:bg-[#181818]
                border border-gray-200 dark:border-white/10
                rounded-2xl
                p-5
                flex flex-col md:flex-row
                md:items-start md:justify-between
                gap-4
                hover:border-gray-300 dark:hover:border-white/20
                transition-all duration-200
              "
            >

              {/* LEFT CONTENT */}
              <div className="flex-1">

                <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
                  {req.type === "price"
                    ? "Nightly rate update"
                    : req.type === "amenities"
                    ? "Amenities update"
                    : "Description update"}
                </h3>

                {/* PRICE */}
                {req.type === "price" && (
                  <div className="flex items-center gap-3 mt-3 text-lg font-semibold flex-wrap">

                    <span className="text-gray-500 line-through">
                      {req.oldValue}
                    </span>

                    <span className="text-gray-400">
                      →
                    </span>

                    <span className="text-green-600 dark:text-green-500">
                      {req.newValue}
                    </span>

                  </div>
                )}

                {/* AMENITIES */}
                {req.type === "amenities" && (
                  <p className="text-gray-700 dark:text-gray-200 text-lg mt-3 font-medium">
                    Adding:
                    <span className="font-bold">
                      {" "}{req.newValue}
                    </span>
                  </p>
                )}

                {/* DESCRIPTION */}
                {req.type === "description" && (
                  <div className="mt-3 space-y-2">

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Old Description
                      </p>

                      <p className="text-gray-500 line-through">
                        {req.oldValue}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        New Description
                      </p>

                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {req.newValue}
                      </p>
                    </div>

                  </div>
                )}

                {/* META */}
                <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                  Submitted May 1, 2025 · Awaiting admin review
                </p>

              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col items-start md:items-end gap-4">

                {/* STATUS */}
                <span
                  className={`
                    px-4 py-2
                    rounded-full
                    text-sm font-semibold
                    whitespace-nowrap
                    ${
                      req.status === "approved"
                        ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                        : req.status === "rejected"
                        ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
                        : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                    }
                  `}
                >
                  {req.status === "pending"
                    ? "Pending review"
                    : req.status}
                </span>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">

                  {/* ACCEPT */}
                  <button
                    onClick={() => {
                      toast.success(`Approved ${req.partner}`);
                    }}
                    className="
                      flex items-center justify-center
                      px-4 py-2
                      rounded-full
                      text-xs font-medium
                      bg-green-500 text-white
                      shadow-sm
                      transition-all duration-200
                      hover:bg-green-600 hover:scale-105
                      active:scale-95
                    "
                  >
                    Accept
                  </button>

                  {/* REJECT */}
                  <button
                    onClick={() => {
                      toast.error(`Rejected ${req.partner}`);
                    }}
                    className="
                      flex items-center justify-center
                      px-4 py-2
                      rounded-full
                      text-xs font-medium
                      bg-red-500 text-white
                      shadow-sm
                      transition-all duration-200
                      hover:bg-red-600 hover:scale-105
                      active:scale-95
                    "
                  >
                    Reject
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>

        {/* PAGINATION */}
        <div className="flex gap-2">

          {Array.from({
            length: Math.ceil(editRequests.length / perPage),
          }).map((_, i) => (
            <button
              key={i}
              onClick={() => setEditPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                editPage === i + 1
                  ? "bg-indigo-500 text-white"
                  : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

        </div>

      </div>
    )}


    {/* MESSAGES - MODERN CHAT UI */}
{tab === 4 && (
  <div className="h-[82vh] bg-white dark:bg-[#18191A] rounded-3xl border border-gray-200 dark:border-[#2A2D31] overflow-hidden flex">

    {/* =========================
        LEFT SIDEBAR
    ========================= */}
    <div className="w-[340px] border-r border-gray-200 dark:border-[#2A2D31] flex flex-col bg-[#F8F8F8] dark:bg-[#1E1F22]">

      {/* TOP */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-gray-200 dark:border-[#2A2D31]">

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Chats
        </h2>

        <div className="flex items-center gap-4 text-gray-500">
          <button className="hover:text-indigo-500 transition text-2xl">
            +
          </button>

          <button className="hover:text-red-500 transition text-2xl">
            ×
          </button>
        </div>

      </div>

      {/* SEARCH */}
      <div className="p-4">

        <div className="relative">

          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search Messenger"
            className="
              w-full pl-12 pr-4 py-3
              rounded-full
              bg-gray-100 dark:bg-[#2A2D31]
              text-sm
              border border-transparent
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          />

        </div>

      </div>

      {/* CONTACTS */}
      <div className="flex-1 overflow-y-auto">

        {Array.from(
          new Map(messages.map((m) => [m.recipient, m])).values()
        ).map((msg) => (

          <button
            key={msg.recipient}
            onClick={() => setSelectedMessage(msg)}
            className={`
              w-full px-4 py-4
              flex items-center gap-3
              text-left
              transition
              border-b border-black/5 dark:border-white/5
              hover:bg-[#ECECEC] dark:hover:bg-[#2A2D31]
              ${
                selectedMessage?.recipient === msg.recipient
                  ? "bg-[#F0E68C] dark:bg-[#3A3D45]"
                  : ""
              }
            `}
          >

            {/* AVATAR */}
            <img
              src={`https://ui-avatars.com/api/?name=${msg.recipient}`}
              alt={msg.recipient}
              className="w-14 h-14 rounded-full object-cover"
            />

            {/* INFO */}
            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2">

                <h3 className="font-semibold text-[17px] text-gray-900 dark:text-white truncate">
                  {msg.recipient}
                </h3>

                <span className="text-xs text-gray-400">
                  • 3h
                </span>

              </div>

              <p className="text-sm text-gray-500 truncate">
                {msg.message}
              </p>

            </div>

          </button>
        ))}

      </div>

    </div>

    {/* =========================
        RIGHT CHAT WINDOW
    ========================= */}
    <div className="flex-1 flex flex-col bg-white dark:bg-[#18191A]">

      {/* CHAT HEADER */}
      {selectedMessage && (
        <div className="h-[80px] px-6 border-b border-gray-200 dark:border-[#2A2D31] flex items-center justify-between">

          <div className="flex items-center gap-4">

            <img
              src={`https://ui-avatars.com/api/?name=${selectedMessage.recipient}`}
              alt=""
              className="w-14 h-14 rounded-full"
            />

            <div>

              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {selectedMessage.recipient}
              </h2>

              <p className="text-sm text-gray-500">
                Offline
              </p>

            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-5 text-[#C08A00]">

            <button className="hover:scale-110 transition">
              📞
            </button>

            <button className="hover:scale-110 transition">
              🎥
            </button>

            <button className="hover:scale-110 transition">
              ⓘ
            </button>

          </div>

        </div>
      )}

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-[#FAFAFA] dark:bg-[#18191A]">

        {!selectedMessage ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        ) : (
          messages
            .filter(
              (m) => m.recipient === selectedMessage.recipient
            )
            .map((msg) => (

              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "Platform Admin"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div className="max-w-[70%]">

                  {/* BUBBLE */}
                  <div
                    className={`
                      px-5 py-3
                      rounded-[22px]
                      text-sm
                      shadow-sm
                      break-words
                      ${
                        msg.sender === "Platform Admin"
                          ? "bg-[#C08A00] text-white rounded-br-md"
                          : "bg-white dark:bg-[#2A2D31] text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 rounded-bl-md"
                      }
                    `}
                  >
                    {msg.message}
                  </div>

                  {/* TIME */}
                  <div
                    className={`
                      text-xs mt-1 text-gray-400
                      ${
                        msg.sender === "Platform Admin"
                          ? "text-right"
                          : "text-left"
                      }
                    `}
                  >
                    {msg.date}
                  </div>

                </div>

              </div>
            ))
        )}

      </div>

      {/* INPUT */}
    {selectedMessage && (
      <div className="px-5 py-4 border-t border-gray-200 dark:border-[#2A2D31] bg-white dark:bg-[#1E1F22]">

        <div className="flex items-center gap-3">

          {/* LEFT ICONS */}
          <div className="flex items-center gap-3 pb-1">

            <button className="text-[#C08A00] text-2xl hover:scale-110 transition leading-none">
              +
            </button>

            <button className="text-[#C08A00] text-xl hover:scale-110 transition leading-none">
              🖼️
            </button>

          </div>

          {/* TEXTAREA */}
          <div className="flex-1 relative">

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              placeholder="Aa"
              className="
                w-full
                resize-none
                rounded-full
                bg-gray-100 dark:bg-[#2A2D31]
                px-5
                py-[13px]
                pr-14
                text-sm
                overflow-hidden
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                leading-[22px]
              "
              style={{
                minHeight: "52px",
                maxHeight: "140px",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "52px";
                el.style.height = el.scrollHeight + "px";
              }}
            />

            {/* EMOJI */}
            <button
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-xl
                text-[#C08A00]
                leading-none
              "
            >
              😊
            </button>

          </div>

          {/* SEND */}
          <button
            onClick={handleSendMessage}
            className="
              text-[#C08A00]
              text-2xl
              hover:scale-110
              transition
              leading-none
              pb-1
            "
          >
            ➤
          </button>

        </div>

      </div>
)}
    </div>

  </div>
)}

      {/* DOCS & ANALYTICS */}
{tab === 5 && (
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
                desc: "Signed Mar 10, 2025 • Expires Jun 30, 2025",
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
                desc: "15% platform fee • Payout every 15th",
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
                width: "72%",
                color: "bg-emerald-500",
              },

              {
                label: "Homepage",
                value: "18%",
                width: "18%",
                color: "bg-blue-500",
              },

              {
                label: "Referral",
                value: "10%",
                width: "10%",
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
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: item.width }}
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
      {/* COMPOSE MODAL */}
        {composeOpen && (
          <div
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/50
              backdrop-blur-sm
              p-6
            "
          >

        {/* MODAL */}
        <div
          className="
            w-full max-w-2xl
            rounded-3xl
            bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            shadow-2xl
            overflow-hidden
          "
        >

        {/* HEADER */}
        <div
          className="
            flex items-center justify-between
            px-6 py-5
            border-b
            border-gray-200 dark:border-gray-800
          "
        >

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Compose Message
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Send updates and announcements to partners
          </p>
        </div>

        <button
          onClick={() => setComposeOpen(false)}
          className="
            w-10 h-10
            rounded-xl
            flex items-center justify-center
            transition
            hover:bg-gray-100
            dark:hover:bg-gray-800
          "
        >
          ✕
        </button>

      </div>

      {/* BODY */}
      <div className="p-6 space-y-5">

        {/* RECIPIENT */}
        <div className="space-y-2">

          <label
            className="
              text-sm font-medium
              text-gray-700 dark:text-gray-300
            "
          >
            Recipient
          </label>

          <select
            value={composeForm.recipient}
            onChange={(e) =>
              setComposeForm((prev) => ({
                ...prev,
                recipient: e.target.value,
              }))
            }
            className="
              w-full
              px-4 py-3
              rounded-2xl
              border
              border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          >
            <option value="">Select recipient</option>
            <option value="all">All Partners</option>
            <option value="sunset-hotel">Sunset Hotel</option>
            <option value="ocean-view">Ocean View Resort</option>
            <option value="mountain-escape">Mountain Escape</option>
          </select>

        </div>

        {/* SUBJECT */}
        <div className="space-y-2">

          <label
            className="
              text-sm font-medium
              text-gray-700 dark:text-gray-300
            "
          >
            Subject
          </label>

          <input
            type="text"
            placeholder="Enter subject..."
            value={composeForm.subject}
            onChange={(e) =>
              setComposeForm((prev) => ({
                ...prev,
                subject: e.target.value,
              }))
            }
            className="
              w-full
              px-4 py-3
              rounded-2xl
              border
              border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder:text-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          />

        </div>

        {/* MESSAGE */}
        <div className="space-y-2">

          <label
            className="
              text-sm font-medium
              text-gray-700 dark:text-gray-300
            "
          >
            Message
          </label>

          <textarea
            rows={8}
            placeholder="Write your message..."
            value={composeForm.message}
            onChange={(e) =>
              setComposeForm((prev) => ({
                ...prev,
                message: e.target.value,
              }))
            }
            className="
              w-full
              px-4 py-3
              rounded-2xl
              border
              border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder:text-gray-400
              resize-none
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          />

        </div>

      </div>

      {/* FOOTER */}
      <div
        className="
          flex flex-col sm:flex-row
          items-stretch sm:items-center
          justify-end
          gap-3
          px-6 py-5
          border-t
          border-gray-200 dark:border-gray-700
          bg-gray-50 dark:bg-gray-950/40
        "
      >

        <button
          onClick={() => setComposeOpen(false)}
          className="
            px-5 py-3
            rounded-2xl
            border
            border-gray-200 dark:border-gray-700
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
          "
        >
          Cancel
        </button>

        <button
          onClick={() => {
  if (!composeForm.recipient || !composeForm.subject || !composeForm.message) {
    toast.error("Please complete all fields");
    return;
  }

  const handleSendMessage = () => {
  if (!replyText.trim() || !selectedMessage) return;

  const newMsg = {
    id: Date.now(),
    sender: "Platform Admin",
    recipient: selectedMessage.recipient,
    subject: "",
    message: replyText,
    date: new Date().toLocaleDateString(),
    read: true,
  };

   setMessages((prev) => [...prev, newMsg]);
  setReplyText("");
};

  setComposeForm({
    recipient: "",
    subject: "",
    message: "",
  });

  setComposeOpen(false);

  toast.success("Message sent");
}}
          className="
            px-5 py-3
            rounded-2xl
            bg-indigo-600
            hover:bg-indigo-700
            text-white
            font-medium
            transition
          "
        >
          Send Message
        </button>

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