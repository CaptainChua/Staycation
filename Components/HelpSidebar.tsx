"use client";

import { useState } from "react";
import { X, HelpCircle, FileText, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HelpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSidebar = ({ isOpen, onClose }: HelpSidebarProps) => {
  const [activeTab, setActiveTab] = useState<"help" | "faqs" | "terms">("help");
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help & Support</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("help")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "help"
                ? "text-brand-primary border-b-2 border-brand-primary"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <HelpCircle className="w-4 h-4 mx-auto mb-1" />
            Help
          </button>
          <button
            onClick={() => setActiveTab("faqs")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "faqs"
                ? "text-brand-primary border-b-2 border-brand-primary"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <FileText className="w-4 h-4 mx-auto mb-1" />
            FAQs
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "terms"
                ? "text-brand-primary border-b-2 border-brand-primary"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Shield className="w-4 h-4 mx-auto mb-1" />
            Terms
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          {/* Need Help Tab */}
          {activeTab === "help" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Need Help?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  We&apos;re here to assist you 24/7. Reach out to our dedicated support team for any questions or concerns.
                </p>
              </div>

              <ul className="space-y-2">
                <li>
                  <Link
                    href="/contacts"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-gray-700 ${pathname === '/contacts' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-gray-700 ${pathname === '/about' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/location"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-gray-700 ${pathname === '/location' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Our Locations
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@staycationhaven.ph"
                    className="text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Customer Support
                  </a>
                </li>
                <li>
                  <Link
                    href="/rooms"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-gray-700 ${pathname === '/rooms' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Browse Havens
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help-center"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-gray-700 ${pathname === '/help-center' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* FAQs & Policies Tab */}
          {activeTab === "faqs" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  FAQs & Policies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Find answers to common questions and review our policies.
                </p>
              </div>

              <ul className="space-y-2">
                <li>
                  <Link
                    href="/faqs"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/faqs' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/booking-policy"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/booking-policy' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Booking Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cancellation-policy"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/cancellation-policy' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/payment-options"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/payment-options' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Payment Options
                  </Link>
                </li>
                <li>
                  <Link
                    href="/house-rules"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/house-rules' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    House Rules
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Terms & Privacy Tab */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Terms & Privacy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Review our legal policies and privacy information.
                </p>
              </div>

              <ul className="space-y-2">
                <li>
                  <Link
                    href="/terms-of-service"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/terms-of-service' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/privacy-policy' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-policy"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/cookie-policy' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/data-protection"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/data-protection' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Data Protection
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accessibility"
                    onClick={onClose}
                    className={`text-sm hover:text-brand-primary transition-colors flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${pathname === '/accessibility' ? 'text-brand-primary font-semibold bg-brand-primarySoft dark:bg-brand-primaryDark/20' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HelpSidebar;
