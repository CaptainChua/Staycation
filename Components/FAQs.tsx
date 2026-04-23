"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import SidebarLayout from "./SidebarLayout";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What are your check-in and check-out times?",
    answer: "Standard check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out may be available upon request and subject to availability."
  },
  {
    question: "Do you offer short-term stays?",
    answer: "Yes! We offer flexible booking options including 6-hour short stays, 12-hour half-day stays, overnight stays, and extended stays. Choose the option that best fits your needs."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including credit/debit cards (Visa, Mastercard), GCash, PayMaya, bank transfers, and cash payments. Full payment is required to confirm your booking."
  },
  {
    question: "Is parking available?",
    answer: "Yes, we provide free parking for all our guests. Parking spaces are subject to availability on a first-come, first-served basis."
  },
  {
    question: "Are pets allowed?",
    answer: "Unfortunately, we do not allow pets in our havens to maintain cleanliness and accommodate guests with allergies. Service animals are permitted with proper documentation."
  },
  {
    question: "What amenities are included in the room?",
    answer: "All our havens include air conditioning, WiFi, cable TV, kitchen facilities, toiletries, fresh linens, and towels. Specific amenities may vary by room type - check the room details for complete information."
  },
  {
    question: "Can I cancel or modify my booking?",
    answer: "Yes, you can cancel or modify your booking according to our cancellation policy. Cancellations made 48 hours before check-in receive a full refund. Please refer to our Cancellation Policy page for complete details."
  },
  {
    question: "How many guests can stay in a room?",
    answer: "Room capacity varies by haven type. Most of our standard rooms accommodate 2-4 guests. Please check the specific room details or contact us for larger groups."
  },
  {
    question: "Do you provide extra bedding?",
    answer: "Yes, extra bedding and pillows are available upon request. Please contact us in advance to ensure availability."
  },
  {
    question: "Is WiFi available?",
    answer: "Yes, complimentary high-speed WiFi is available in all our havens. Network credentials will be provided upon check-in."
  },
  {
    question: "What is your cleaning and sanitization protocol?",
    answer: "We follow strict cleaning and sanitization protocols. All rooms are thoroughly cleaned and disinfected between guests, with special attention to high-touch surfaces."
  },
  {
    question: "Can I request early check-in or late check-out?",
    answer: "Early check-in and late check-out are subject to availability and may incur additional charges. Please contact us in advance to arrange."
  },
  {
    question: "Do you offer airport transportation?",
    answer: "We can help arrange transportation services for an additional fee. Please contact our team to coordinate airport pickup or drop-off."
  },
  {
    question: "What if I need assistance during my stay?",
    answer: "Our support team is available 24/7. You can reach us via phone, email, or the contact information provided in your booking confirmation."
  },
  {
    question: "Are smoking rooms available?",
    answer: "All our havens are non-smoking. Guests who wish to smoke must use designated outdoor areas. A cleaning fee will be charged if smoking is detected inside the room."
  }
];

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <HelpCircle className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Find answers to common questions about our staycation havens
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-brand-primary flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Our support team is ready to help.
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

export default FAQs;
