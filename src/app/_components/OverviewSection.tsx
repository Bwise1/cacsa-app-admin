import React, { ReactNode, useState } from "react";

type OverviewSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function OverviewSection({
  title,
  defaultOpen = true,
  children,
}: OverviewSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[5px] border border-green bg-ca-black overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-white hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-lg">{title}</span>
        <span className="text-white/70 text-sm tabular-nums shrink-0">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-5 py-5">{children}</div>
      ) : null}
    </div>
  );
}
