import PaymentOptions from "@/Components/PaymentOptions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staycation Haven | Payment Options",
  description:
    "Explore the various payment options available at Staycation Haven. Learn about accepted payment methods, booking procedures, and secure transaction processes for a hassle-free experience.",
};

const PaymentOptionsPage = () => {
  return <PaymentOptions />;
};

export default PaymentOptionsPage;
