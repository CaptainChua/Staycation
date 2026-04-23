import { Metadata } from "next";
import CsrDashboard from "@/Components/admin/Csr/CsrDashboardPage";

export const metadata: Metadata = {
  title: "Staycation Haven | CSR Page",
  description: "Customer Service Representative dashboard for managing bookings, deposits, and customer support",
  keywords: ["CSR", "Customer Service", "Dashboard", "Bookings", "Deposits", "Staycation"],
  authors: [{ name: "Staycation Admin Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow",
};

const CsrPage = () => {
  return <CsrDashboard />;
};

export default CsrPage;