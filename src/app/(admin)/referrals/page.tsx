"use client";

import Card from "@/app/_components/Card";
import StatCard from "@/app/_components/StatCard";
import {
  AdminReferralRow,
  fetchAdminReferrals,
} from "@/lib/actions";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BiSearch } from "react-icons/bi";
import { PiCheckCircle, PiClockCountdown, PiXCircle } from "react-icons/pi";

const ReferralsPage = () => {
  const [rows, setRows] = useState<AdminReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "converted" | "rejected">("all");
  const [summary, setSummary] = useState({
    totalAttributions: 0,
    pendingCount: 0,
    convertedCount: 0,
    rejectedCount: 0,
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchAdminReferrals({
          q: query,
          status,
          limit: 200,
        });
        setRows(data?.rows ?? []);
        setSummary(
          data?.summary ?? {
            totalAttributions: 0,
            pendingCount: 0,
            convertedCount: 0,
            rejectedCount: 0,
          }
        );
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Could not load referrals");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [query, status]);

  const conversionRate = useMemo(() => {
    if (!summary.totalAttributions) return 0;
    return Math.round((summary.convertedCount / summary.totalAttributions) * 100);
  }, [summary]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 text-white">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total attributions"
          value={loading ? "…" : summary.totalAttributions}
          hint="Captured referral entries"
          icon={<PiClockCountdown className="h-9 w-9" />}
        />
        <StatCard
          label="Converted"
          value={loading ? "…" : summary.convertedCount}
          hint={`${conversionRate}% conversion`}
          icon={<PiCheckCircle className="h-9 w-9" />}
        />
        <StatCard
          label="Pending"
          value={loading ? "…" : summary.pendingCount}
          hint="Awaiting first paid subscription"
          icon={<PiClockCountdown className="h-9 w-9" />}
        />
        <StatCard
          label="Rejected"
          value={loading ? "…" : summary.rejectedCount}
          hint="Self or invalid referrals"
          icon={<PiXCircle className="h-9 w-9" />}
        />
      </div>

      <Card className="w-full min-w-0">
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <h1 className="text-base font-medium">Referral management</h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <BiSearch className="h-4 w-4 text-white/40" />
              </span>
              <input
                type="search"
                placeholder="Search referrer, referred UID, or code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-h-[2.5rem] rounded-md border border-white/20 bg-black/30 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-green focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "all" | "pending" | "converted" | "rejected"
                )
              }
              className="input-modal !min-h-[2.5rem] !py-1 !px-2 text-sm w-full sm:w-[180px]"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="table-auto w-full min-w-[980px] text-sm">
              <thead className="bg-green text-black">
                <tr className="text-left">
                  <th className="p-2">Code</th>
                  <th className="p-2">Referrer UID</th>
                  <th className="p-2">Referred UID</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Captured</th>
                  <th className="p-2">Converted</th>
                  <th className="p-2">Reward</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-6 text-white/50" colSpan={7}>
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="p-6 text-white/50" colSpan={7}>
                      No referral rows found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-white/10 hover:bg-white/[0.06]">
                      <td className="p-2 font-semibold">{r.referral_code}</td>
                      <td className="p-2 max-w-[240px] truncate">{r.referrer_uid}</td>
                      <td className="p-2 max-w-[240px] truncate">{r.referred_uid}</td>
                      <td className="p-2 capitalize">{r.status}</td>
                      <td className="p-2">{new Date(r.captured_at).toLocaleString()}</td>
                      <td className="p-2">
                        {r.converted_at ? new Date(r.converted_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-2">{r.reward_points ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReferralsPage;
