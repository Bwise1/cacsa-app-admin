"use client";

import React from "react";
import Card from "./Card";

type InitialAvatarProps = {
  text: string;
  size?: number;
};

function RankChip({ label, colorHex }: { label: string; colorHex: string }) {
  return (
    <span
      className="inline-flex max-w-[9rem] shrink-0 items-center truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-tight"
      style={{
        color: colorHex,
        borderColor: `${colorHex}99`,
        backgroundColor: `${colorHex}18`,
      }}
      title={label}
    >
      {label}
    </span>
  );
}

function InitialAvatar({ text, size = 40 }: InitialAvatarProps) {
  const initials = (text || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="text-white/80 text-xs font-semibold">{initials || "?"}</span>
    </div>
  );
}

export type LeaderboardTopCard = {
  rank: number; // 1..3
  name: string;
  subLabel?: string;
  metricLabel?: string;
  metricValue?: string;
  /** Devotional tier (e.g. Labourer) with accent color from API */
  rankLabel?: string;
  rankColorHex?: string;
};

export type LeaderboardRankedRow = {
  key: string;
  rank: number;
  name: string;
  subLabel?: string;
  leftAvatarText?: string;
  cells?: React.ReactNode[];
  rankLabel?: string;
  rankColorHex?: string;
};

export default function LeaderboardVibeLayout({
  title,
  topCards,
  rankedRows,
  sidebar,
  emptyMessage = "No data yet.",
}: {
  title?: string;
  topCards: LeaderboardTopCard[];
  rankedRows: LeaderboardRankedRow[];
  sidebar?: React.ReactNode;
  emptyMessage?: string;
}) {
  return (
    <Card className="!self-stretch w-full min-w-0 shrink-0 p-5">
      {/* Stack on smaller screens so ranked list + top cards use full width; side-by-side only on wide viewports */}
      <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="min-w-0 w-full">
          {title ? (
            <div className="mb-3">
              <h3 className="text-base font-medium text-white">{title}</h3>
            </div>
          ) : null}

          {rankedRows.length === 0 && topCards.length === 0 ? (
            <p className="text-sm text-white/60">{emptyMessage}</p>
          ) : null}

          {topCards.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {topCards.map((c) => {
                const bg =
                  c.rank === 1
                    ? "bg-blue-500/20 border-blue-500/20"
                    : c.rank === 2
                      ? "bg-white/5 border-white/10"
                      : "bg-green-500/15 border-green-500/20";

                return (
                  <div
                    key={c.rank}
                    className={`rounded-[5px] border ${bg} p-4`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white/70 text-sm font-medium">
                          {c.subLabel ?? ""}
                        </div>
                        <div className="mt-2 flex items-center gap-3 min-w-0">
                          <div className="flex flex-col">
                            <div className="text-[42px] leading-none font-semibold tabular-nums text-white">
                              #{c.rank}
                            </div>
                            {c.metricLabel ? (
                              <div className="text-white/60 text-xs mt-0.5">
                                {c.metricLabel}
                              </div>
                            ) : null}
                          </div>
                          <InitialAvatar text={c.name} size={44} />
                        </div>
                        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-white">
                            {c.name}
                          </span>
                          {c.rankLabel && c.rankColorHex ? (
                            <RankChip label={c.rankLabel} colorHex={c.rankColorHex} />
                          ) : null}
                        </div>
                        {c.metricValue ? (
                          <div className="mt-1 text-white/80 text-sm tabular-nums">
                            {c.metricValue}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="rounded-[5px] border border-white/10 bg-black/20 overflow-hidden">
            {rankedRows.length ? (
              <div>
                {rankedRows.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 text-right text-white/60 tabular-nums">
                        {r.rank}
                      </div>
                      {r.leftAvatarText ? (
                        <InitialAvatar text={r.leftAvatarText} size={34} />
                      ) : null}
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-white">
                            {r.name}
                          </span>
                          {r.rankLabel && r.rankColorHex ? (
                            <RankChip label={r.rankLabel} colorHex={r.rankColorHex} />
                          ) : null}
                        </div>
                        {r.subLabel ? (
                          <div className="text-xs text-white/50 truncate">
                            {r.subLabel}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {r.cells?.length ? (
                      <div className="flex gap-6 items-center">
                        {r.cells.map((cell, idx) => (
                          <div key={idx} className="text-right tabular-nums">
                            {cell}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-white/60">{emptyMessage}</p>
              </div>
            )}
          </div>
        </div>

        {sidebar ? (
          <div className="min-w-0">
            {sidebar}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

