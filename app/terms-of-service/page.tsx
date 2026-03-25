import TermsOfService from "@/Components/TermsOfService";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Terms of Service",
  description: "Legal terms and conditions for using Staycation Haven services. Read our comprehensive terms of service, booking policies, and user agreements.",
};

const TermsOfServicePage = () => {
  return <TermsOfService />;
};

export default TermsOfServicePage;
