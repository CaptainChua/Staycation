import PrivacyPolicy from "@/Components/PrivacyPolicy";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven PH | Privacy Policy",
  description: "Read Staycation Haven PH's comprehensive privacy policy. Learn how we collect, use, and protect your personal information in accordance with data protection regulations.",
};

const PrivacyPolicyPage = () => {
  return <PrivacyPolicy />
}

export default PrivacyPolicyPage;