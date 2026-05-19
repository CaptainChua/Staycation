import { Fraunces, Outfit } from "next/font/google";
import PartnerShell from "@/Components/admin/Partners/PartnerShell";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${outfit.variable} font-[var(--font-outfit),system-ui,sans-serif]`}>
      <PartnerShell>{children}</PartnerShell>
    </div>
  );
}
