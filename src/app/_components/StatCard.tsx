import Card from "@/app/_components/Card";
import React, { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <Card>
      <div
        className={`flex flex-row items-center justify-center gap-4 px-5 py-5 min-h-[120px] ${className}`}
      >
        {icon ? <span className="text-yellow shrink-0">{icon}</span> : null}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-white/60 text-sm">{label}</span>
          <span className="text-3xl font-semibold tabular-nums leading-tight">
            {value}
          </span>
          {hint ? (
            <span className="text-white/45 text-xs mt-0.5">{hint}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
