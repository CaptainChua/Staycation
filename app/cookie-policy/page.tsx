import CookiePolicy from "@/Components/CookiePolicy";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Cookie Policy",
  description: "Learn about Staycation Haven's cookie policy. Understand how we use cookies and tracking technologies to enhance your browsing experience.",
};

const CookiePolicyPage = () => {
  return <CookiePolicy />
}

export default CookiePolicyPage;