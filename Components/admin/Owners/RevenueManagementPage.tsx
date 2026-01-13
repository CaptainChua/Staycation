'use client';

import { TrendingUp, Calendar, Edit2, Tag, DollarSign, Plus } from "lucide-react";
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

  // Revenue stats matching Bookings page card colors
  const revenueStats = [
    { label: "This Month", value: "₱145,000", change: "+12.5%", color: "bg-blue-500", icon: DollarSign },
    { label: "Last Month", value: "₱128,000", change: "+8.3%", color: "bg-green-500", icon: Calendar },
    { label: "Average Daily", value: "₱4,833", change: "+5.2%", color: "bg-yellow-500", icon: TrendingUp },
    { label: "Projected (End of Month)", value: "₱185,000", change: "+15.7%", color: "bg-indigo-500", icon: DollarSign },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching Bookings page style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Revenue Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage pricing, discounts, and revenue optimization</p>
        </div>
      </div>

      {/* Revenue Stats Cards - Matching Bookings page style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {revenueStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs font-semibold mt-2 text-green-100">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs - Matching Bookings page card style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="flex border-b-2 border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === "pricing"
                ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === "discounts"
                ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Discounts & Promos
          </button>
        </div>

        <div className="p-6">
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pricing Rules</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]">
                  <Plus className="w-5 h-5" />
                  Add Pricing Rule
                </button>
              </div>

              {/* Pricing Rules Table - Matching Bookings page table style */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Rule Name
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Haven
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Check-In Time
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Price
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Status
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRules.map((rule) => (
                        <tr
                          key={rule.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{rule.name}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700 dark:text-gray-200">{rule.haven}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700 dark:text-gray-200">{rule.checkInTime}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                              ₱{rule.price.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              rule.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {rule.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "discounts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Discounts & Promotions</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]">
                  <Plus className="w-5 h-5" />
                  Add Discount Code
                </button>
              </div>

              {/* Discounts Table - Matching Bookings page table style */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Code
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Description
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Valid Until
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Used
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Discount
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Status
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount) => (
                        <tr
                          key={discount.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-brand-primary flex-shrink-0" />
                              <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{discount.code}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700 dark:text-gray-200">{discount.description}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>{new Date(discount.validUntil).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {discount.used} times
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                              {discount.discount}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              discount.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {discount.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueManagementPage;
