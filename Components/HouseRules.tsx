"use client";

import { Clock, Users, Volume2, Cigarette, PawPrint, Shield, AlertCircle } from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";

const HouseRules = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-16 overflow-hidden border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <Shield className="w-8 h-8 text-brand-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">House Rules</h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Guidelines to ensure a pleasant stay for all our guests
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Core Rules */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Rules</h2>
          <div className="space-y-6">
            {/* Check-in/Check-out */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Check-in & Check-out Times</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Check-in: 2:00 PM onwards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Check-out: 12:00 PM (noon)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Early check-in or late check-out subject to availability and additional charges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Valid government-issued ID required for all guests during check-in</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Guest Capacity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Guest Capacity</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Maximum occupancy must be strictly observed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Additional guests beyond the booked capacity are not allowed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Visitors are permitted only in common areas and must leave before 10:00 PM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Overnight visitors require prior approval and may incur additional charges</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Noise Policy */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Noise & Quiet Hours</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Quiet hours: 10:00 PM to 7:00 AM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Please be considerate of other guests and keep noise levels low</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>No loud music, parties, or gatherings that disturb other guests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Violations may result in immediate termination of stay without refund</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Smoking Policy */}
            <div className="bg-white rounded-xl border border-red-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Cigarette className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Smoking Policy</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>All havens are strictly non-smoking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>Smoking is only permitted in designated outdoor areas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>Violation will result in a ₱5,000 cleaning fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>This includes vaping and e-cigarettes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pet Policy */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <PawPrint className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pet Policy</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Pets are not allowed in our havens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Service animals are permitted with proper documentation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Please inform us in advance if traveling with a service animal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Property Care */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Care & Responsibilities</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
              <div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Guests are responsible for any damages to the property or furnishings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Report any damages or issues immediately to management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Lost keys or access cards will incur a replacement fee of ₱500</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Keep the haven clean and dispose of trash properly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Do not move or remove furniture and fixtures</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-primary font-bold">•</span>
                    <span>Turn off all lights, appliances, and air conditioning when leaving</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Safety & Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Safety & Security</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold">•</span>
                <span>Lock doors and windows when leaving the haven</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold">•</span>
                <span>Do not share access codes or keys with unauthorized persons</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold">•</span>
                <span>Keep valuables secure - management is not responsible for lost items</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold">•</span>
                <span>Follow fire safety procedures and know emergency exit locations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold">•</span>
                <span>No illegal activities, drugs, or weapons allowed on the premises</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold">•</span>
                <span>Report suspicious activity immediately to security or management</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Prohibited Items & Activities */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Prohibited Items & Activities</h2>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Illegal drugs and controlled substances</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Weapons, firearms, and explosives</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Flammable or hazardous materials</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Illegal gambling or activities</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Unregistered cooking appliances (hot plates, rice cookers, etc.)</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-red-700 font-medium">
              Violation of these rules may result in immediate eviction without refund and possible legal action.
            </p>
          </div>
        </section>

        {/* Contact Support */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Our Rules?</h2>
          <p className="text-gray-600 mb-6">
            Need clarification on our house rules? Contact our support team.
          </p>
          <a
            href="/help-center"
            className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default HouseRules;
