'use client';

import { useEffect, useState } from "react";

type Partner = {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  type: string;
  commission_rate: number;
  total_earnings?: number;
  total_paid?: number;
  status: "active" | "pending" | "suspended";
  created_at: string;
  updated_at: string;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "listing", label: "Listing" },
  { key: "requests", label: "Requests" },
  { key: "messages", label: "Messages" },
  { key: "documents", label: "Documents" },
  { key: "analysis", label: "Analysis" },
];

const fetchPartners = async (): Promise<{ success: boolean; data: Partner[]; error?: string }> => {
  const res = await fetch("/api/partners");
  if (!res.ok) throw new Error("Failed to fetch partners");
  return res.json();
};

export default function PartnersDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPartners();
        if (data.success) setPartners(data.data);
        else setError(data.error || "Failed to load data");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPartners = partners.filter((p) =>
    (p.fullname?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (p.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const activePartners = partners.filter((p) => p.status === "active");
  const pendingPartners = partners.filter((p) => p.status === "pending");

  const Overview = () => (
    <div className="grid md:grid-cols-3 gap-4">
      <Card title="Total Partners" value={partners.length} />
      <Card title="Active Partners" value={activePartners.length} />
      <Card title="Pending Requests" value={pendingPartners.length} />
    </div>
  );

  const Listing = () => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
      <div className="p-3 border-b">
        <input
          className="border p-2 rounded w-1/3"
          placeholder="Search partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredPartners.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.fullname}</td>
              <td className="p-3">{p.email}</td>
              <td className="p-3 capitalize">{p.type}</td>
              <td className="p-3 capitalize">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Content = () => {
    switch (tab) {
      case "overview":
        return <Overview />;
      case "listing":
        return <Listing />;
      case "requests":
        return <div>Requests</div>;
      case "messages":
        return <div>Messages</div>;
      case "documents":
        return <div>Documents</div>;
      case "analysis":
        return <div>Analysis</div>;
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">{error}</div>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 p-4 border-r">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`block w-full text-left p-2 rounded ${
              tab === t.key ? "bg-black text-white" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6">
        <Content />
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
      <p className="text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}