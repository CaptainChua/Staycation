'use client';

import { DollarSign, TrendingUp, Calendar, Edit2, Tag } from "lucide-react";
import { useState } from "react";

const RevenueManagementPage = () => {
  const [activeTab, setActiveTab] = useState("pricing");

  // Dummy data
  const pricingRules = [
    {
      id: 1,
      name: "6-Hour Rate",
      haven: "All Havens",
      price: 3000,
      checkInTime: "09:00",
      active: true
    },
    {
      id: 2,
      name: "10-Hour Rate",
      haven: "All Havens",
      price: 5000,
      checkInTime: "09:00",
      active: true
    },
    {
      id: 3,
      name: "Weekday Rate (21 hours)",
      haven: "All Havens",
      price: 7000,
      checkInTime: "14:00",
      active: true
    },
    {
      id: 4,
      name: "Weekend Rate (21 hours)",
      haven: "All Havens",
      price: 9000,
      checkInTime: "14:00",
      active: true
    },
  ];

  const discounts = [
    {
      id: 1,
      code: "WELCOME10",
      description: "10% off for new guests",
      discount: "10%",
      validUntil: "2024-12-31",
      used: 45,
      active: true
    },
    {
      id: 2,
      code: "SUMMER2024",
      description: "Summer special discount",
      discount: "15%",
      validUntil: "2024-06-30",
      used: 89,
      active: false
    },
    {
      id: 3,
      code: "LONGSTAY",
      description: "Discount for 5+ nights",
      discount: "20%",
      validUntil: "2024-12-31",
      used: 23,
      active: true
    },
  ];

  const revenueStats = [
    { label: "This Month", value: "₱145,000", change: "+12.5%" },
    { label: "Last Month", value: "₱128,000", change: "+8.3%" },
    { label: "Average Daily", value: "₱4,833", change: "+5.2%" },
    { label: "Projected (End of Month)", value: "₱185,000", change: "+15.7%" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Revenue Management</h1>
        <p className="text-gray-600">Manage pricing, discounts, and revenue optimization</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === "pricing"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === "discounts"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Discounts & Promos
          </button>
        </div>

        <div className="p-6">
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Pricing Rules</h2>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  + Add Pricing Rule
                </button>
              </div>

              <div className="space-y-3">
                {pricingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{rule.name}</h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Haven: {rule.haven}</span>
                        <span>Check-in: {rule.checkInTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-xl font-bold text-green-600">₱{rule.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "discounts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Discounts & Promotions</h2>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  + Add Discount Code
                </button>
              </div>

              <div className="space-y-3">
                {discounts.map((discount) => (
                  <div key={discount.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <h3 className="font-bold text-gray-800">{discount.code}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{discount.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Valid until: {new Date(discount.validUntil).toLocaleDateString()}
                        </span>
                        <span>Used: {discount.used} times</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Discount</p>
                        <p className="text-xl font-bold text-orange-600">{discount.discount}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${discount.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {discount.active ? "Active" : "Inactive"}
                        </span>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueManagementPage;
