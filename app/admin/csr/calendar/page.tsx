"use client";

import { useEffect } from "react";
import CsrDashboard from "@/Components/admin/Csr/CsrDashboardPage";

const ACTIVE_PAGE_STORAGE_KEY = "csr-dashboard-active-page";

export default function CsrCalendarPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, "calendar");
  }, []);

  return <CsrDashboard />;
}
