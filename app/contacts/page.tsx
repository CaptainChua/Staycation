import ContactContent from "@/Components/ContactContent";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven PH | Contact",
  description: "Get in touch with Staycation Haven PH. Contact us via phone, email, or visit our location in Quezon City.",
};

const ContactsPage = () => {
  return <ContactContent />
}

export default ContactsPage;