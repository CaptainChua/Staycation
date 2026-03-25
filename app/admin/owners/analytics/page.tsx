import AnalyticsPage from "@/Components/admin/Owners/AnalyticsPage";

export const metadata = {
  title: "Analytics & Reports - Staycation Haven"
};

// we still want dynamic in case client fetches or env
export const dynamic = 'force-dynamic';

export default function AnalyticsRoute() {
  // client component handles its own loading/fetching
  return <AnalyticsPage />;
}
