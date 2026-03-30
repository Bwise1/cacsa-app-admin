import React, { ReactNode } from "react";

type OverviewSectionProps = {
  title: string;
  /** Kept for backward compatibility; content is always visible (no collapse). */
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function OverviewSection({
  title,
  children,
}: OverviewSectionProps) {
  return (
    <div className="w-full min-w-0 shrink-0 rounded-[5px] border border-green bg-ca-black overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <span className="font-medium text-lg text-white">{title}</span>
      </div>
      <div className="w-full min-w-0 px-5 py-5">{children}</div>
    </div>
  );
}
