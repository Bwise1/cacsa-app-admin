"use client";

import OverviewSection from "@/app/_components/OverviewSection";
import StatCard from "@/app/_components/StatCard";
import {
  AudioPlayStatsPayload,
  AdminDevotionalLeaderboardRow,
  fetchAdminDevotionalLeaderboard,
  fetchAudioPlayStats,
  fetchAdminDevotionalSettings,
  fetchOverviewMetrics,
  fetchAdminAds,
  OverviewMetricsPayload,
  updateAdminDevotionalSettings,
} from "@/lib/actions";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { PiChurch, PiUsersThree } from "react-icons/pi";
import { MdMusicNote, MdOutlineAdminPanelSettings } from "react-icons/md";

const RANGE_OPTIONS: { label: string; days: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
];

function formatListenSeconds(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "0s";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

export default function OverviewPage() {
  const [days, setDays] = useState(30);
  const [audio, setAudio] = useState<AudioPlayStatsPayload | null>(null);
  const [metrics, setMetrics] = useState<OverviewMetricsPayload | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingDevotionalSettings, setLoadingDevotionalSettings] = useState(true);
  const [savingDevotionalSettings, setSavingDevotionalSettings] = useState(false);
  const [minReadSeconds, setMinReadSeconds] = useState(120);
  const [minScrollPercent, setMinScrollPercent] = useState(70);
  const [serverTimezone, setServerTimezone] = useState("Africa/Lagos");
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [leaderboardRows, setLeaderboardRows] = useState<AdminDevotionalLeaderboardRow[]>([]);
  const [adsSummary, setAdsSummary] = useState<{
    totalAds: number;
    activeAds: number;
    scheduledAds: number;
    totalSeen: number;
    totalClicks: number;
  } | null>(null);
  const [adsRows, setAdsRows] = useState<
    {
      id: number;
      name: string;
      slot: string | null;
      seen: number;
      clicks: number;
    }[]
  >([]);

  const loadAudio = useCallback(async () => {
    setLoadingAudio(true);
    try {
      const res = await fetchAudioPlayStats(days);
      if (res) setAudio(res);
      else setAudio(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load audio stats");
      setAudio(null);
    } finally {
      setLoadingAudio(false);
    }
  }, [days]);


  const loadAdsSummary = useCallback(async () => {
    setLoadingAds(true);
    try {
      const res = await fetchAdminAds();
      const rows = res?.ads ?? [];
      const today = new Date().toISOString().slice(0, 10);
      const isLive = (a: { is_active: boolean; starts_at: string | null; ends_at: string | null }) => {
        if (!a.is_active) return false;
        const startsOk = !a.starts_at || String(a.starts_at).slice(0, 10) <= today;
        const endsOk = !a.ends_at || String(a.ends_at).slice(0, 10) >= today;
        return startsOk && endsOk;
      };
      const sum = rows.reduce(
        (acc, a) => {
          acc.totalSeen += Number(a.impression_count ?? 0);
          acc.totalClicks += Number(a.click_count ?? 0);
          if (a.is_active) acc.activeAds += 1;
          if (isLive(a)) acc.scheduledAds += 1;
          return acc;
        },
        {
          totalAds: rows.length,
          activeAds: 0,
          scheduledAds: 0,
          totalSeen: 0,
          totalClicks: 0,
        }
      );
      setAdsSummary(sum);
      setAdsRows(
        rows
          .map((a) => ({
            id: a.id,
            name: a.brand_name?.trim() || `Ad #${a.id}`,
            slot: a.slot,
            seen: Number(a.impression_count ?? 0),
            clicks: Number(a.click_count ?? 0),
          }))
          .sort((a, b) => b.seen - a.seen || b.clicks - a.clicks)
      );
    } catch (e) {
      setAdsSummary(null);
      setAdsRows([]);
    } finally {
      setLoadingAds(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetchOverviewMetrics();
      if (res) setMetrics(res);
      else setMetrics(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load overview metrics");
      setMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const loadDevotionalSettings = useCallback(async () => {
    setLoadingDevotionalSettings(true);
    try {
      const res = await fetchAdminDevotionalSettings();
      setMinReadSeconds(Number(res?.settings?.min_read_seconds ?? 120));
      setMinScrollPercent(Number(res?.settings?.min_scroll_percent ?? 70));
      setServerTimezone(String(res?.settings?.server_timezone ?? "Africa/Lagos"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load devotional settings");
    } finally {
      setLoadingDevotionalSettings(false);
    }
  }, []);

  const loadDevotionalLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetchAdminDevotionalLeaderboard(20);
      setLeaderboardRows(res?.rows ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load leaderboard");
      setLeaderboardRows([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    void loadAudio();
  }, [loadAudio]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    void loadAdsSummary();
  }, [loadAdsSummary]);

  useEffect(() => {
    void loadDevotionalSettings();
  }, [loadDevotionalSettings]);

  useEffect(() => {
    void loadDevotionalLeaderboard();
  }, [loadDevotionalLeaderboard]);

  const maxDayPlays =
    audio?.byDay?.reduce(
      (m, d) => Math.max(m, d.plays, (d.listen_seconds ?? 0) / 60),
      0
    ) ?? 0;

  const regLabel =
    metrics?.firebaseRegisteredApproximate === true
      ? "Count capped (very large project); refresh cache or check Console"
      : "Firebase Auth (total matches Console)";

  const subscribersHint =
    metrics?.subscriptionDocumentsTotal != null &&
    metrics.subscriptionDocumentsTotal !== metrics?.activeSubscribers
      ? `${fmtNum(metrics.activeSubscribers)} with status "active" · ${fmtNum(metrics.subscriptionDocumentsTotal)} total docs in subscriptions`
      : 'Firestore where status == "active" (matches app gate)';

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col gap-6 text-white">
      <Toaster />
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-white/70">
          At-a-glance org metrics: app users, subscriptions, library, and
          engagement. Audio details below are from the mobile app (signed-in
          listeners).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="App users (registered)"
          value={loadingMetrics ? "…" : fmtNum(metrics?.firebaseRegisteredUsers)}
          hint={regLabel}
          icon={<PiUsersThree className="h-10 w-10" />}
        />
        <StatCard
          label="Active subscribers"
          value={loadingMetrics ? "…" : fmtNum(metrics?.activeSubscribers)}
          hint={subscribersHint}
          icon={<PiChurch className="h-10 w-10" />}
        />
        <StatCard
          label="Audio tracks"
          value={loadingMetrics ? "…" : fmtNum(metrics?.totalAudioTracks)}
          hint="In library"
          icon={<MdMusicNote className="h-10 w-10" />}
        />
        <StatCard
          label="Admin accounts"
          value={loadingMetrics ? "…" : fmtNum(metrics?.adminUserCount)}
          hint="Web panel"
          icon={<MdOutlineAdminPanelSettings className="h-10 w-10" />}
        />
      </div>

      <OverviewSection title="Audio engagement" defaultOpen>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <p className="text-sm text-white/60 max-w-xl">
            Plays when a track starts; listen time while playback is running.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Range</span>
            <select
              className="input-backdrop !h-auto min-h-[2.75rem] rounded-md px-3 py-2.5 text-black min-w-[180px]"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.label} value={o.days}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Total plays</span>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {loadingAudio ? "…" : (audio?.totalPlays ?? 0).toLocaleString()}
            </p>
            <p className="text-white/45 text-xs mt-2">
              {audio?.allTime
                ? "All recorded plays"
                : `Window: ${audio?.days ?? days} days`}
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Total listen time</span>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {loadingAudio
                ? "…"
                : formatListenSeconds(audio?.totalListenSeconds ?? 0)}
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Tracks with activity</span>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {loadingAudio ? "…" : (audio?.byTrack?.length ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-base font-medium text-white">Activity by day</h3>
          {loadingAudio ? (
            <p className="text-white/50 text-sm">Loading…</p>
          ) : !audio?.byDay?.length ? (
            <p className="text-white/50 text-sm">
              No plays in this range yet. Data appears when listeners use the app
              (signed in).
            </p>
          ) : (
            <div className="flex items-end gap-1.5 h-44 overflow-x-auto pb-1 no-scrollbar">
              {audio.byDay.map((d) => {
                const barMaxPx = 152;
                const listenMin = (d.listen_seconds ?? 0) / 60;
                const h =
                  maxDayPlays > 0
                    ? Math.max(d.plays, listenMin) / maxDayPlays
                    : 0;
                const barPx =
                  maxDayPlays > 0 ? Math.max(4, h * barMaxPx) : 4;
                return (
                  <div
                    key={d.date}
                    className="flex flex-col items-center justify-end gap-1 min-w-[36px] flex-shrink-0 h-40"
                    title={`${d.date}: ${d.plays} plays, ${formatListenSeconds(
                      d.listen_seconds ?? 0
                    )} listening`}
                  >
                    <div
                      className="w-full rounded-t bg-green/80 min-h-[4px]"
                      style={{ height: `${barPx}px` }}
                    />
                    <span className="text-[10px] text-white/50 text-center leading-tight px-0.5 pt-1 max-w-[40px] truncate">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-8 overflow-x-auto">
          <h3 className="text-base font-medium text-white">Per track</h3>
          {loadingAudio ? (
            <p className="text-white/50 text-sm">Loading…</p>
          ) : !audio?.byTrack?.length ? (
            <p className="text-white/50 text-sm">No data for this range.</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-white/20 text-white/60">
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Artist</th>
                  <th className="py-2 pr-4 text-right font-medium tabular-nums">
                    Plays
                  </th>
                  <th className="py-2 text-right font-medium tabular-nums">
                    Listen time
                  </th>
                </tr>
              </thead>
              <tbody>
                {audio.byTrack.map((row) => (
                  <tr
                    key={row.audio_id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="py-2 pr-4 max-w-[240px] truncate">
                      {row.title}
                    </td>
                    <td className="py-2 pr-4 text-white/70">
                      {row.artist ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {row.plays.toLocaleString()}
                    </td>
                    <td className="py-2 text-right tabular-nums text-white/90">
                      {formatListenSeconds(row.listen_seconds ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </OverviewSection>


      <OverviewSection title="Ads engagement" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Total ads</span>
            <p className="text-3xl font-semibold tabular-nums mt-1">
              {loadingAds ? "…" : fmtNum(adsSummary?.totalAds)}
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Enabled ads</span>
            <p className="text-3xl font-semibold tabular-nums mt-1">
              {loadingAds ? "…" : fmtNum(adsSummary?.activeAds)}
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Currently live</span>
            <p className="text-3xl font-semibold tabular-nums mt-1">
              {loadingAds ? "…" : fmtNum(adsSummary?.scheduledAds)}
            </p>
            <p className="text-white/45 text-xs mt-2">Date window + is_active</p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Total seen</span>
            <p className="text-3xl font-semibold tabular-nums mt-1">
              {loadingAds ? "…" : fmtNum(adsSummary?.totalSeen)}
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 px-4 py-4">
            <span className="text-white/60 text-sm">Total clicks</span>
            <p className="text-3xl font-semibold tabular-nums mt-1">
              {loadingAds ? "…" : fmtNum(adsSummary?.totalClicks)}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <h3 className="mb-3 text-base font-medium text-white">Per advert</h3>
          {loadingAds ? (
            <p className="text-sm text-white/60">Loading…</p>
          ) : !adsRows.length ? (
            <p className="text-sm text-white/60">No ad engagement data yet.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-white/60">
                  <th className="py-2 pr-3 font-medium">Advert</th>
                  <th className="py-2 pr-3 font-medium">Slot</th>
                  <th className="py-2 pr-3 text-right font-medium">Seen</th>
                  <th className="py-2 pr-3 text-right font-medium">Clicks</th>
                  <th className="py-2 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {adsRows.slice(0, 20).map((row) => {
                  const ctr = row.seen > 0 ? ((row.clicks / row.seen) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={row.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-2 pr-3 max-w-[260px] truncate">{row.name}</td>
                      <td className="py-2 pr-3">{row.slot || "—"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.seen.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums">{ctr}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </OverviewSection>

      <OverviewSection title="Daily walk & reading" defaultOpen={false}>
        <div className="flex flex-col gap-3 max-w-md">
          <p className="text-sm text-white/60">
            Configure thresholds used for daily walk streak counting.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Minimum read time (seconds)</span>
            <input
              type="number"
              min={10}
              step={1}
              value={minReadSeconds}
              onChange={(e) => setMinReadSeconds(Number(e.target.value || 0))}
              className="input-backdrop !h-auto min-h-[2.75rem] rounded-md px-3 py-2.5 text-black"
              disabled={loadingDevotionalSettings || savingDevotionalSettings}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Minimum scroll engagement (%)</span>
            <input
              type="number"
              min={10}
              max={100}
              step={1}
              value={minScrollPercent}
              onChange={(e) => setMinScrollPercent(Number(e.target.value || 0))}
              className="input-backdrop !h-auto min-h-[2.75rem] rounded-md px-3 py-2.5 text-black"
              disabled={loadingDevotionalSettings || savingDevotionalSettings}
            />
          </label>
          <p className="text-xs text-white/50">
            Timezone: {serverTimezone} (env fallback applies if admin settings are not configured)
          </p>
          <button
            type="button"
            className="rounded-md bg-green px-4 py-2 text-black font-medium disabled:opacity-60"
            disabled={
              loadingDevotionalSettings ||
              savingDevotionalSettings ||
              !Number.isFinite(minReadSeconds) ||
              minReadSeconds < 10 ||
              !Number.isFinite(minScrollPercent) ||
              minScrollPercent < 10 ||
              minScrollPercent > 100
            }
            onClick={async () => {
              try {
                setSavingDevotionalSettings(true);
                await updateAdminDevotionalSettings({
                  min_read_seconds: Math.round(minReadSeconds),
                  min_scroll_percent: Math.round(minScrollPercent),
                  server_timezone: serverTimezone,
                });
                toast.success("Devotional settings updated");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save settings");
              } finally {
                setSavingDevotionalSettings(false);
              }
            }}
          >
            {savingDevotionalSettings ? "Saving..." : "Save settings"}
          </button>
        </div>
        <div className="mt-8 overflow-x-auto">
          <h3 className="mb-3 text-base font-medium text-white">
            Leaderboard (top users)
          </h3>
          {loadingLeaderboard ? (
            <p className="text-sm text-white/60">Loading…</p>
          ) : !leaderboardRows.length ? (
            <p className="text-sm text-white/60">No devotional progress data yet.</p>
          ) : (
            <table className="w-full min-w-[620px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-white/60">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">User</th>
                  <th className="py-2 pr-3 text-right font-medium">Current streak</th>
                  <th className="py-2 pr-3 text-right font-medium">Longest streak</th>
                  <th className="py-2 pr-3 text-right font-medium">Total points</th>
                  <th className="py-2 text-right font-medium">Last completed</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardRows.map((row, idx) => (
                  <tr key={row.firebaseUid} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-2 pr-3 tabular-nums">{idx + 1}</td>
                    <td className="py-2 pr-3 max-w-[260px] truncate">{row.fullName}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(row.currentStreakDays)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(row.longestStreakDays)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(row.totalPoints)}</td>
                    <td className="py-2 text-right tabular-nums text-white/80">
                      {row.lastCompletedDate || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </OverviewSection>
    </div>
  );
}
