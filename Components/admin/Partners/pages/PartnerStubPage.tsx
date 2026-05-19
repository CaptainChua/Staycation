"use client";

import { Sparkles } from "lucide-react";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

interface StubProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function PartnerStubPage({ title, description, icon: IconCmp }: StubProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
          {title}
        </h1>
        <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">{description}</p>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-16 text-center">
        <div className="w-[72px] h-[72px] rounded-[18px] bg-[#FEF3C7] text-[#B8860B] grid place-items-center mx-auto mb-4">
          <IconCmp className="w-8 h-8" />
        </div>
        <h2 className={`text-[22px] leading-[1.2] mb-2 text-[#111827] font-medium ${fontFraunces}`}>
          Coming next
        </h2>
        <p className="text-[#6B7280] max-w-[380px] mx-auto text-[14px] leading-relaxed">
          {description}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 rounded-full bg-[#FEF3C7] border border-[#DAA520]/30 text-[#92400e] text-[11.5px] font-semibold uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Under development
        </div>
      </div>
    </div>
  );
}
