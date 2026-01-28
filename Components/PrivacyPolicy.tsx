"use client";

import { Shield } from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";

const PrivacyPolicyPage = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <Shield className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            How we collect, use, and protect your personal information
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed">
                We collect information you provide directly to us, such as your name, email address, phone number, and payment details. This information is used to process your bookings and improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">
                Your information is used to process bookings, communicate with you, and personalize your experience. We do not sell or share your personal data with third parties without your consent, except as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Protection</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data from unauthorized access, alteration, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-600 leading-relaxed">
                You have the right to access, update, or delete your personal information. You can also request a copy of the data we hold about you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this privacy policy or how we handle your data, please contact our Data Protection Officer at privacy@staycationhaven.ph
              </p>
            </section>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PrivacyPolicyPage;
