"use client";

import { CreditCard, Smartphone, Building2, Wallet, Shield, CheckCircle } from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";

const PaymentOptions = () => {
  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <CreditCard className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Payment Options
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Flexible and secure payment methods for your convenience
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Payment Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Accepted Payment Methods</h2>
          <div className="grid gap-6">
            {/* Credit/Debit Cards */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit / Debit Cards</h3>
                  <p className="text-gray-600 mb-4">
                    We accept major credit and debit cards for secure online payments.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">Visa</div>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">Mastercard</div>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">American Express</div>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">JCB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* E-Wallets */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">E-Wallets</h3>
                  <p className="text-gray-600 mb-4">
                    Pay conveniently using your favorite digital wallet.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-2 bg-blue-100 rounded-lg text-sm font-medium text-blue-700">GCash</div>
                    <div className="px-4 py-2 bg-green-100 rounded-lg text-sm font-medium text-green-700">PayMaya</div>
                    <div className="px-4 py-2 bg-purple-100 rounded-lg text-sm font-medium text-purple-700">GrabPay</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Transfer</h3>
                  <p className="text-gray-600 mb-4">
                    Direct bank transfer to our account. Bank details will be provided upon booking confirmation.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Please include your booking reference number in the transfer details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Send proof of payment to support@staycationhaven.ph</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cash Payment */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash Payment</h3>
                  <p className="text-gray-600 mb-4">
                    Pay in cash at our office or upon check-in (subject to approval).
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Cash payment must be arranged in advance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Official receipt will be provided upon payment</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Security</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Payment is Secure</h3>
                <p className="text-gray-600 mb-4">
                  We use industry-standard encryption and security measures to protect your payment information.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>SSL encryption for all transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>PCI DSS compliant payment processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>We never store your complete card details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Secure payment gateway partners</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Terms</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Full Payment Required:</strong>
                  <p className="text-gray-600 mt-1">Complete payment is required at the time of booking to confirm your reservation.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Payment Confirmation:</strong>
                  <p className="text-gray-600 mt-1">You will receive an email confirmation once payment is successfully processed.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Currency:</strong>
                  <p className="text-gray-600 mt-1">All prices are in Philippine Pesos (PHP).</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Receipts:</strong>
                  <p className="text-gray-600 mt-1">Official receipts are provided upon request for all completed transactions.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-primary font-bold mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Failed Transactions:</strong>
                  <p className="text-gray-600 mt-1">If your payment fails, please contact your bank or try an alternative payment method.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Notes</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Payment must be completed before check-in to avoid cancellation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Additional charges (damages, extra services) will be settled upon check-out</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Refunds are processed according to our Cancellation Policy</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Please keep your payment confirmation for your records</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact Support */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Questions?</h2>
          <p className="text-gray-600 mb-6">
            Having trouble with payment? Our team is here to assist you.
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

export default PaymentOptions;
