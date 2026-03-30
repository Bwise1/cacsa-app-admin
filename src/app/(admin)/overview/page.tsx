"use client";

import OverviewSection from "@/app/_components/OverviewSection";
import LeaderboardVibeLayout from "@/app/_components/LeaderboardVibeLayout";
import StatCard from "@/app/_components/StatCard";
import {
  AudioPlayStatsPayload,
  AdminDevotionalLeaderboardRow,
  fetchAdminDevotionalLeaderboard,
  DevotionalLeaderboardTimeframe,
  fetchAudioPlayStats,
  fetchAdminDevotionalSettings,
  fetchOverviewMetrics,
  fetchAdminAds,
  OverviewMetricsPayload,
  updateAdminDevotionalSettings,
} from "@/lib/actions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  type OverviewTab = "audio" | "ads" | "devotionals";
  const [activeTab, setActiveTab] = useState<OverviewTab>("devotionals");
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
  const [devotionalTimeframe, setDevotionalTimeframe] =
    useState<DevotionalLeaderboardTimeframe>("this_month");
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
      const res = await fetchAdminDevotionalLeaderboard(20, devotionalTimeframe);
      setLeaderboardRows(res?.rows ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load leaderboard");
      setLeaderboardRows([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [devotionalTimeframe]);

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

  const audioTracksSortedByPlays = useMemo(() => {
    const tracks = audio?.byTrack ?? [];
    return [...tracks].sort((a, b) => {
      const playsDiff = b.plays - a.plays;
      if (playsDiff !== 0) return playsDiff;
      const listenDiff = (b.listen_seconds ?? 0) - (a.listen_seconds ?? 0);
      if (listenDiff !== 0) return listenDiff;
      return a.title.localeCompare(b.title);
    });
  }, [audio]);

  const audioMostActiveDay = useMemo(() => {
    const daysArr = audio?.byDay ?? [];
    if (!daysArr.length) return null;
    return [...daysArr].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0))[0] ?? null;
  }, [audio]);

  const audioTopListenTrack = useMemo(() => {
    const tracks = audio?.byTrack ?? [];
    if (!tracks.length) return null;
    return [...tracks].sort((a, b) => (b.listen_seconds ?? 0) - (a.listen_seconds ?? 0))[0] ?? null;
  }, [audio]);

  const audioTopCards = audioTracksSortedByPlays.slice(0, 3);
  const audioRankedRows = audioTracksSortedByPlays.slice(0, 15);

  const adsTopCards = adsRows.slice(0, 3);
  const adsRankedRows = adsRows.slice(0, 20);

  const adsBestCtr = useMemo(() => {
    const rows = adsRows ?? [];
    if (!rows.length) return null;
    const withCtr = rows
      .filter((r) => r.seen > 0)
      .map((r) => ({ ...r, ctr: (r.clicks / r.seen) * 100 }));
    if (!withCtr.length) return null;
    return withCtr.sort((a, b) => b.ctr - a.ctr)[0] ?? null;
  }, [adsRows]);

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
    <div className="flex w-full min-w-0 flex-col gap-6 pb-8 text-white">
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

      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: "audio", label: "Audio engagement" },
          { key: "ads", label: "Ads engagement" },
          { key: "devotionals", label: "Devotionals" },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={[
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === t.key
                ? "bg-green text-black"
                : "bg-white/5 text-white/80 hover:bg-white/10",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "audio" ? (
        <OverviewSection title="Audio engagement">
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
            <div className="flex w-full min-w-0 items-end gap-1 pb-1 h-44">
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
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1 h-40"
                    title={`${d.date}: ${d.plays} plays, ${formatListenSeconds(
                      d.listen_seconds ?? 0
                    )} listening`}
                  >
                    <div
                      className="w-full rounded-t bg-green/80 min-h-[4px]"
                      style={{ height: `${barPx}px` }}
                    />
                    <span className="w-full text-[10px] text-white/50 text-center leading-tight px-0.5 pt-1 truncate">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          {loadingAudio ? (
            <p className="text-white/50 text-sm">Loading…</p>
          ) : !audioTracksSortedByPlays.length ? (
            <p className="text-white/50 text-sm">No data for this range.</p>
          ) : (
            <LeaderboardVibeLayout
              title="Ranked tracks"
              topCards={audioTopCards.map((t, idx) => ({
                rank: idx + 1,
                name: t.title,
                subLabel: t.artist ?? "—",
                metricLabel: "Plays",
                metricValue: t.plays.toLocaleString(),
              }))}
              rankedRows={audioRankedRows.map((row, idx) => ({
                key: String(row.audio_id),
                rank: idx + 1,
                name: row.title,
                subLabel: row.artist ?? "—",
                leftAvatarText: row.artist ?? row.title,
                cells: [
                  row.plays.toLocaleString(),
                  formatListenSeconds(row.listen_seconds ?? 0),
                ],
              }))}
              sidebar={
                <div className="rounded-[5px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white mb-3">
                    Achievements
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-xs text-white/50">
                        Top listen time track
                      </div>
                      <div className="text-sm font-semibold text-white truncate">
                        {audioTopListenTrack ? audioTopListenTrack.title : "—"}
                      </div>
                      <div className="text-xs text-white/50 tabular-nums">
                        {audioTopListenTrack
                          ? formatListenSeconds(audioTopListenTrack.listen_seconds ?? 0)
                          : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">
                        Most active day
                      </div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {audioMostActiveDay ? audioMostActiveDay.plays : 0} plays
                      </div>
                      <div className="text-xs text-white/50">
                        {audioMostActiveDay ? audioMostActiveDay.date : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">
                        Tracks with activity
                      </div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {audio?.byTrack?.length ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          )}
        </div>
      </OverviewSection>
      ) : null}

      {activeTab === "ads" ? (
        <OverviewSection title="Ads engagement">
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

        <div className="mt-6">
          {loadingAds ? (
            <p className="text-sm text-white/60">Loading…</p>
          ) : !adsRankedRows.length ? (
            <p className="text-sm text-white/60">No ad engagement data yet.</p>
          ) : (
            <LeaderboardVibeLayout
              title="Ranked adverts"
              topCards={adsTopCards.map((t, idx) => {
                const ctr =
                  t.seen > 0 ? ((t.clicks / t.seen) * 100).toFixed(1) : "0.0";
                return {
                  rank: idx + 1,
                  name: t.name,
                  subLabel: t.slot ?? "—",
                  metricLabel: "Seen",
                  metricValue: t.seen.toLocaleString(),
                };
              })}
              rankedRows={adsRankedRows.map((t, idx) => {
                const ctr =
                  t.seen > 0 ? ((t.clicks / t.seen) * 100).toFixed(1) : "0.0";
                return {
                  key: String(t.id),
                  rank: idx + 1,
                  name: t.name,
                  subLabel: t.slot ?? "—",
                  leftAvatarText: t.name,
                  cells: [
                    <span key="seen" className="tabular-nums">
                      {t.seen.toLocaleString()}
                    </span>,
                    <span key="clicks" className="tabular-nums">
                      {t.clicks.toLocaleString()}
                    </span>,
                    <span key="ctr" className="tabular-nums">
                      {ctr}%
                    </span>,
                  ],
                };
              })}
              sidebar={
                <div className="rounded-[5px] border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white mb-3">
                    Achievements
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-xs text-white/50">Highest CTR</div>
                      <div className="text-sm font-semibold text-white truncate">
                        {adsBestCtr ? adsBestCtr.name : "—"}
                      </div>
                      <div className="text-xs text-white/50">
                        {adsBestCtr ? `${adsBestCtr.ctr.toFixed(1)}%` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Total seen</div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {adsSummary ? fmtNum(adsSummary.totalSeen) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Total clicks</div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {adsSummary ? fmtNum(adsSummary.totalClicks) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          )}
        </div>
      </OverviewSection>
      ) : null}

      {activeTab === "devotionals" ? (
        <OverviewSection title="Devotionals">
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
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-medium text-white">Leaderboard</h3>
              <div className="flex items-center gap-2 rounded-md bg-white/5 p-1">
                {(["this_month", "this_year"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDevotionalTimeframe(t)}
                    className={[
                      "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                      devotionalTimeframe === t
                        ? "bg-green text-black"
                        : "text-white/70 hover:text-white",
                      loadingLeaderboard ? "opacity-60" : "",
                    ].join(" ")}
                    disabled={loadingLeaderboard}
                  >
                    {t === "this_month" ? "This Month" : "This year"}
                  </button>
                ))}
              </div>
            </div>

            {loadingLeaderboard ? (
              <p className="text-sm text-white/60">Loading…</p>
            ) : !leaderboardRows.length ? (
              <p className="text-sm text-white/60">
                No devotional progress data yet.
              </p>
            ) : (
              <LeaderboardVibeLayout
                title={devotionalTimeframe === "this_month" ? "Monthly leaderboard" : "Year leaderboard"}
                topCards={leaderboardRows.slice(0, 3).map((row, idx) => ({
                  rank: idx + 1,
                  name: row.fullName,
                  subLabel: "Streak",
                  metricLabel: `${row.currentStreakDays} days`,
                  metricValue: `${fmtNum(row.totalPoints)} pts`,
                  rankLabel: row.rank ?? "Labourer",
                  rankColorHex: row.rankColorHex ?? "#FF1B1B",
                }))}
                rankedRows={leaderboardRows.map((row, idx) => ({
                  key: row.firebaseUid,
                  rank: idx + 1,
                  name: row.fullName,
                  rankLabel: row.rank ?? "Labourer",
                  rankColorHex: row.rankColorHex ?? "#FF1B1B",
                  subLabel: `Streak: ${fmtNum(row.currentStreakDays)}d`,
                  cells: [
                    <span key="streak" className="tabular-nums">{fmtNum(row.currentStreakDays)}d</span>,
                    <span key="longest" className="tabular-nums">{fmtNum(row.longestStreakDays)}d</span>,
                    <span key="points" className="tabular-nums">{fmtNum(row.totalPoints)} pts</span>,
                    <span key="last" className="tabular-nums text-white/70">{row.lastCompletedDate || "—"}</span>,
                  ],
                }))}
                sidebar={
                  <div className="rounded-[5px] border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-white mb-3">
                      Achiever in other categories
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="text-xs text-white/50">Highest streak</div>
                        <div className="text-lg font-semibold tabular-nums text-white">
                          {fmtNum(
                            Math.max(...leaderboardRows.map((r) => r.currentStreakDays))
                          )}{" "}
                          days
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Highest longest</div>
                        <div className="text-lg font-semibold tabular-nums text-white">
                          {fmtNum(
                            Math.max(...leaderboardRows.map((r) => r.longestStreakDays))
                          )}{" "}
                          days
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/50">Leaders badge</div>
                        <div className="text-sm text-white/70">
                          Ranked by total points ({devotionalTimeframe === "this_month" ? "this month" : "this calendar year"})
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            )}
        </div>
      </OverviewSection>
      ) : null}
    </div>
  );
}
