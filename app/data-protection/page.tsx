import DataProtection from "@/Components/DataProtection";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Data Protection Policy",
  description: "Learn about Staycation Haven's data protection policy. Understand how we collect, process, and protect your personal information in compliance with data protection regulations.",
};

const DataProtectionPage = () => {
  return <DataProtection />
}

export default DataProtectionPage;