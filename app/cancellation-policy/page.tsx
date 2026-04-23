import CancellationPolicy from "@/Components/CancellationPolicy";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Cancellation Policy",
  description: "Everything you need to know about booking your stay with Staycation Haven - policies, procedures, and guidelines.",
};

const CancellationPolicyPage = () => {
  return <CancellationPolicy />;
};

export default CancellationPolicyPage;
