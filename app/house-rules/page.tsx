import HouseRules from "@/Components/HouseRules";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staycation Haven | House Rules",
  description:
    "Discover Staycation Haven's house rules to ensure a comfortable and enjoyable stay for all guests. Learn about our policies on noise, cleanliness, and more.",
};

const HouseRulesPage = () => {
  return <HouseRules />;
};

export default HouseRulesPage;
