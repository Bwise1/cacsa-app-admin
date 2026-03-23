"use client";

import React from "react";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";

export type PaginationBarProps = {
  /** 1-based current page */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
  /** When false, disables Next (e.g. server has no further page). Overrides totalItems-based disable. */
  hasNextPage?: boolean;
  /** When false, disables Prev (e.g. first page of server-backed list). */
  hasPrevPage?: boolean;
  /** When set, "Showing a–b" uses b = start + itemsOnPage - 1 (last page with fewer rows). */
  itemsOnPage?: number;
};

/**
 * Reusable prev/next + range label. Assumes items are already sliced client- or server-side.
 */
const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className = "",
  hasNextPage,
  hasPrevPage,
  itemsOnPage,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end =
    totalItems === 0
      ? 0
      : itemsOnPage !== undefined
        ? start + Math.max(0, itemsOnPage) - 1
        : Math.min(safePage * pageSize, totalItems);
  const nextDisabled =
    hasNextPage === false ||
    totalItems === 0 ||
    (hasNextPage === undefined && safePage >= totalPages);
  const prevDisabled =
    hasPrevPage === false ||
    totalItems === 0 ||
    (hasPrevPage === undefined && safePage <= 1);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-sm text-white/90 ${className}`}
    >
      <span className="tabular-nums">
        {totalItems === 0 ? (
          "No results"
        ) : (
          <>
            Showing {start}–{end} of {totalItems}
          </>
        )}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={prevDisabled}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 rounded-md bg-ca-grey px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-green/80 disabled:hover:bg-ca-grey"
          aria-label="Previous page"
        >
          <PiCaretLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="tabular-nums text-white/70 px-1">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 rounded-md bg-ca-grey px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-green/80 disabled:hover:bg-ca-grey"
          aria-label="Next page"
        >
          Next
          <PiCaretRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;
