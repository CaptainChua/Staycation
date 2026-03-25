'use client';

import { TrendingUp, Calendar, Edit2, Tag, DollarSign, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CreateDiscountModal from "../Csr/Modals/CreateDiscountModal";
import EditDiscountModal from "../Csr/Modals/EditDiscountModal";
import PricingManagementModal from "./Modals/PricingManagementModal";
import { getDiscounts, DiscountRecord } from "@/app/admin/csr/actions";
import { useGetAllAdminRoomsQuery } from "@/redux/api/roomApi";

const RevenueManagementPage = () => {
  const [activeTab, setActiveTab] = useState("pricing");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isEditDiscountModalOpen, setIsEditDiscountModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isEditPricingModalOpen, setIsEditPricingModalOpen] = useState(false);
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRecord | null>(null);
  const [selectedPricingRule, setSelectedPricingRule] = useState<any>(null);

  // Get havens/rooms for pricing display
  const { data: havensData } = useGetAllAdminRoomsQuery({});
  const havens = havensData || [];

  // Load discounts from database
  const loadDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const discountsData = await getDiscounts();
      setDiscounts(discountsData);
    } catch (error) {
      console.error("Failed to load discounts:", error);
      setDiscounts([]);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  // Transform haven data into pricing rules for display
  const pricingRules = havens.map((haven: any) => ({
    id: haven.uuid_id,
    name: haven.haven_name,
    haven: haven.tower ? `Tower ${haven.tower}` : "All Havens",
    six_hour_price: haven.six_hour_rate,
    ten_hour_price: haven.ten_hour_rate,
    weekday_price: haven.weekday_rate,
    weekend_price: haven.weekend_rate,
    checkInTime: haven.twenty_one_hour_check_in || "14:00",
    active: true
  }));

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
                <button onClick={() => setIsPricingModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]">
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
                          Haven Name
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          6-Hour Rate
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          10-Hour Rate
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Weekday (21h)
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Weekend (21h)
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRules.length > 0 ? (
                        pricingRules.map((rule) => (
                          <tr
                            key={rule.id}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{rule.name}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                ₱{rule.six_hour_price?.toLocaleString() || '0'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                ₱{rule.ten_hour_price?.toLocaleString() || '0'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                ₱{rule.weekday_price?.toLocaleString() || '0'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                ₱{rule.weekend_price?.toLocaleString() || '0'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => {
                                    setSelectedPricingRule(rule);
                                    setIsEditPricingModalOpen(true);
                                  }}
                                  className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors" 
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                            No pricing rules available. Create your first haven to add pricing.
                          </td>
                        </tr>
                      )}
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
                <button onClick={() => setIsDiscountModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]">
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
                      {loadingDiscounts ? (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                            Loading discounts...
                          </td>
                        </tr>
                      ) : discounts.length > 0 ? (
                        discounts.map((discount) => (
                          <tr
                            key={discount.id}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{discount.discount_code}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-700 dark:text-gray-200">{discount.description || 'N/A'}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>{new Date(discount.end_date).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {discount.used_count || 0} times
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                {discount.formatted_value}
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
                                <button 
                                  onClick={() => {
                                    setSelectedDiscount(discount);
                                    setIsEditDiscountModalOpen(true);
                                  }}
                                  className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors" 
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                            No discounts available. Create your first discount to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onSuccess={() => {
          setIsDiscountModalOpen(false);
          loadDiscounts();
        }}
      />

      <EditDiscountModal
        isOpen={isEditDiscountModalOpen}
        onClose={() => {
          setIsEditDiscountModalOpen(false);
          setSelectedDiscount(null);
        }}
        discount={selectedDiscount}
        onSuccess={() => {
          setIsEditDiscountModalOpen(false);
          setSelectedDiscount(null);
          loadDiscounts();
        }}
      />

      {/* Pricing Rule Modal - Add Mode */}
      {isPricingModalOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={() => setIsPricingModalOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close modal"
          />
          <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999] pointer-events-none">
            <div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Add Pricing Rule
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure rates for a new property
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPricingModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                <PricingManagementModal
                  onSave={() => {
                    setIsPricingModalOpen(false);
                  }}
                  isAddMode={true}
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Pricing Rule Modal - Edit Mode */}
      {isEditPricingModalOpen && selectedPricingRule && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={() => setIsEditPricingModalOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close modal"
          />
          <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999] pointer-events-none">
            <div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Edit Pricing Rule
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Update rates for {selectedPricingRule.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsEditPricingModalOpen(false);
                    setSelectedPricingRule(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                <PricingManagementModal
                  haven={selectedPricingRule}
                  onSave={() => {
                    setIsEditPricingModalOpen(false);
                    setSelectedPricingRule(null);
                  }}
                  isAddMode={false}
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default RevenueManagementPage;
