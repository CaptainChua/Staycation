import BookingPolicy from "@/Components/BookingPolicy";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven PH | Booking Policy",
  description: "Everything you need to know about booking your stay with Staycation Haven PH - policies, procedures, and guidelines.",
};

const BookingPolicyPage = () => {
  return <BookingPolicy />;
};

export default BookingPolicyPage;
