import { fetchAnalyticsSummary, fetchRevenueByRoom, fetchMonthlyRevenue } from "@/backend/controller/analyticsController";
import AnalyticsClient from "@/Components/admin/Owners/AnalyticsClient";

export const metadata = {
  title: "Analytics & Reports - Staycation Haven"
}

// Force dynamic rendering to prevent build-time database connection
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  // Fetch all data in parallel on the server
  const [summary, revenueByHaven, monthlyRevenue] = await Promise.all([
    fetchAnalyticsSummary('30'),
    fetchRevenueByRoom('30'),
    fetchMonthlyRevenue('6')
  ]);

  return (
    <AnalyticsClient
      summary={summary}
      revenueByHaven={revenueByHaven}
      monthlyRevenue={monthlyRevenue}
    />
  );
}
