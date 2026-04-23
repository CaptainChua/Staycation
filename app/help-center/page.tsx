import HelpCenter from "@/Components/HelpCenter";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Help Center",
  description: "Get assistance and find answers to your questions about Staycation Haven services, bookings, and more.",
};

const HelpCenterPage = () => {
  return <HelpCenter />;
};

export default HelpCenterPage;
