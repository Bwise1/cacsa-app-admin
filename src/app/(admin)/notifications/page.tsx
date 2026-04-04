"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import YtEmbedPreview from "@/app/_components/YtEmbedPreview";
import {
  fetchAdminBroadcastNotifications,
  fetchAdminYtStreamChannels,
  fetchAllStates,
  removeAdminBroadcastNotification,
  sendBroadcastNotification,
  updateAdminYtStreamChannel,
  type BroadcastNotificationRow,
  type YtStreamChannel,
} from "@/lib/actions";
import { useSession } from "next-auth/react";
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { PiPaperPlaneTilt, PiPlayFill, PiTrash } from "react-icons/pi";

/** Fallback labels for known Flutter doc ids (optional `name` in Firestore overrides). */
const DEFAULT_YT_LABELS: Record<string, string> = {
  V906YkgSW0uy1L1b45Us: "National / Teens TV",
  IzSA7TAl7F7yrWpVJ78X: "Children TV",
  dEEhNADWvzBrYh5mLDg7: "Young Adult TV",
};

function displayChannelName(ch: YtStreamChannel) {
  const n = ch.name?.trim();
  if (n) return n;
  return DEFAULT_YT_LABELS[ch.id] ?? "Unnamed channel";
}

/** Parse pasted UIDs: commas, semicolons, or line breaks. Dedupes, trims. */
function parseUidInput(raw: string): string[] {
  const parts = raw.split(/[\s,;]+/);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const u = p.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

interface StateRow {
  id: number;
  state_name: string;
}

const NotificationsPage = () => {
  const { data: session, status } = useSession();
  const canSend = session?.user?.permissions?.includes("notifications:send");

  const [channels, setChannels] = useState<YtStreamChannel[]>([]);
  const [history, setHistory] = useState<BroadcastNotificationRow[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [draftLinks, setDraftLinks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "subscribed" | "state" | "uids">("all");
  const [selectedUidsText, setSelectedUidsText] = useState("");
  const [statesList, setStatesList] = useState<StateRow[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [selectedStateNames, setSelectedStateNames] = useState<string[]>([]);
  const [stateSearch, setStateSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const loadStreams = useCallback(async () => {
    if (!canSend) return;
    setLoadingStreams(true);
    try {
      const res = await fetchAdminYtStreamChannels();
      if (res?.channels) {
        setChannels(res.channels);
        const drafts: Record<string, string> = {};
        res.channels.forEach((c) => {
          drafts[c.id] = c.link ?? "";
        });
        setDraftLinks((prev) => ({ ...drafts, ...prev }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load TV streams");
    } finally {
      setLoadingStreams(false);
    }
  }, [canSend]);

  const loadHistory = useCallback(async () => {
    if (!canSend) return;
    setLoadingHistory(true);
    try {
      const res = await fetchAdminBroadcastNotifications();
      if (res?.notifications) setHistory(res.notifications);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load past notifications");
    } finally {
      setLoadingHistory(false);
    }
  }, [canSend]);

  useEffect(() => {
    if (status === "authenticated" && canSend) {
      void loadStreams();
      void loadHistory();
    }
  }, [status, canSend, loadStreams, loadHistory]);

  useEffect(() => {
    if (status !== "authenticated" || !canSend) return;
    let cancelled = false;
    setLoadingStates(true);
    void (async () => {
      try {
        const res = (await fetchAllStates()) as { states?: StateRow[] };
        const rows = res?.states ?? [];
        if (!cancelled) {
          setStatesList(
            [...rows].sort((a, b) =>
              String(a.state_name).localeCompare(String(b.state_name), undefined, {
                sensitivity: "base",
              })
            )
          );
        }
      } catch {
        if (!cancelled) toast.error("Could not load states list");
      } finally {
        if (!cancelled) setLoadingStates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, canSend]);

  const filteredStatesForPicker = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    if (!q) return statesList;
    return statesList.filter((s) => s.state_name.toLowerCase().includes(q));
  }, [statesList, stateSearch]);

  const toggleStateSelected = (name: string) => {
    setSelectedStateNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAllFilteredStates = () => {
    const names = filteredStatesForPicker.map((s) => s.state_name);
    setSelectedStateNames((prev) => Array.from(new Set([...prev, ...names])));
  };

  const clearSelectedStates = () => {
    setSelectedStateNames([]);
  };

  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => {
      if (a.section !== b.section) return a.section === "primary" ? -1 : 1;
      return displayChannelName(a).localeCompare(displayChannelName(b), undefined, {
        sensitivity: "base",
      });
    });
  }, [channels]);

  const saveChannel = async (ch: YtStreamChannel) => {
    const link = (draftLinks[ch.id] ?? ch.link ?? "").trim();
    setSavingId(ch.id);
    try {
      await updateAdminYtStreamChannel(ch.id, { link });
      toast.success("Stream link saved");
      await loadStreams();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (audience === "state" && selectedStateNames.length === 0) {
      toast.error("Select at least one state");
      return;
    }
    const uidsList = audience === "uids" ? parseUidInput(selectedUidsText) : [];
    if (audience === "uids" && uidsList.length === 0) {
      toast.error("Enter at least one Firebase user UID (app users page shows uid)");
      return;
    }
    setSending(true);
    try {
      const res = (await sendBroadcastNotification({
        title: subject.trim(),
        body: message.trim(),
        audience,
        states: audience === "state" ? selectedStateNames : undefined,
        uids: audience === "uids" ? uidsList : undefined,
      })) as {
        sent?: number;
        failed?: number;
        totalTokens?: number;
        message?: string;
        uidsRequested?: number;
      };
      const uidNote =
        res?.uidsRequested != null
          ? `, UIDs listed: ${res.uidsRequested}`
          : "";
      toast.success(
        `Sent: ${res?.sent ?? 0}, failed: ${res?.failed ?? 0}, devices: ${res?.totalTokens ?? 0}${uidNote}`
      );
      if (res?.message) toast(res.message);
      setSubject("");
      setMessage("");
      if (audience === "uids") setSelectedUidsText("");
      await loadHistory();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setSending(false);
    }
  };

  const removeOne = async (row: BroadcastNotificationRow) => {
    if (
      !window.confirm(
        "Delete this notification from history? (Does not unsend pushes already delivered.)"
      )
    ) {
      return;
    }
    const key = `${row.timeStamp}::${row.title}`;
    setRemovingKey(key);
    try {
      await removeAdminBroadcastNotification(row);
      toast.success("Removed from list");
      await loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setRemovingKey(null);
    }
  };

  const streamGrid = (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-white">Live TV channels</h2>
      {loadingStreams ? (
        <p className="text-white/50 text-sm">Loading…</p>
      ) : sortedChannels.length === 0 ? (
        <p className="text-white/40 text-sm">No channels yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedChannels.map((ch) => (
            <Card key={ch.id}>
              <div className="p-4 flex flex-col gap-3 text-white">
                <div className="relative aspect-video rounded-lg bg-white/10 overflow-hidden flex flex-col items-center justify-center min-h-[120px]">
                  {(draftLinks[ch.id] ?? ch.link)?.trim() ? (
                    <YtEmbedPreview url={(draftLinks[ch.id] ?? ch.link).trim()} />
                  ) : (
                    <PiPlayFill className="w-14 h-14 text-red-500 drop-shadow-md" aria-hidden />
                  )}
                </div>
                <p className="font-medium text-sm leading-snug text-white/95">
                  {displayChannelName(ch)}
                </p>
                <input
                  type="url"
                  className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30"
                  placeholder="YouTube or Facebook video URL"
                  value={draftLinks[ch.id] ?? ch.link}
                  onChange={(e) =>
                    setDraftLinks((d) => ({ ...d, [ch.id]: e.target.value }))
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void saveChannel(ch)}
                    disabled={savingId === ch.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-40"
                  >
                    <PiPaperPlaneTilt className="w-4 h-4" />
                    {savingId === ch.id ? "Saving…" : "Update"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (status === "loading") {
    return <div className="text-white/60 p-8">Loading…</div>;
  }

  if (!canSend) {
    return (
      <div className="text-white p-8 max-w-md">
        <p className="text-white/80">
          You don&apos;t have access to notifications. This screen requires the{" "}
          <code className="text-green">notifications:send</code> permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1600px] mx-auto pb-10">
      <Toaster />
      <h1 className="text-2xl font-semibold text-white">Notifications &amp; live TV</h1>
      <p className="text-sm text-white/50 -mt-4 max-w-3xl">
        TV stream URLs are stored in Firestore <code className="text-white/70">yt_stream</code>{" "}
        (same documents the app loads by id).         Push broadcasts use device tokens from Firestore{" "}
        <code className="text-white/70">users</code> (optional: send only to selected UIDs for
        testing) and append history to{" "}
        <code className="text-white/70">broadCastNotifications/notifications</code>.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-12 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {streamGrid}
          {!loadingStreams && channels.length === 0 && (
            <p className="text-amber-200/90 text-sm">
              No documents in <code>yt_stream</code>. Add them in Firebase (each channel is one
              document with a <code>link</code> field) so they appear here.
            </p>
          )}
        </div>

        <div
          className={
            "flex flex-col gap-4 min-w-0 w-full xl:max-w-[440px] xl:justify-self-end " +
            "xl:sticky xl:top-6 xl:self-start xl:h-[min(720px,calc(100dvh-7rem))] xl:max-h-[min(720px,calc(100dvh-7rem))] " +
            "xl:flex xl:flex-col xl:min-h-0"
          }
        >
          <Card className="shrink-0 overflow-hidden flex flex-col xl:min-h-0">
            <div className="p-6 sm:p-8 flex flex-col gap-4 text-white max-h-[min(420px,52vh)] overflow-y-auto overscroll-contain xl:max-h-[min(380px,45vh)]">
              <h2 className="text-lg font-semibold shrink-0">Notifications</h2>
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-white/70">Subject</span>
                  <input
                    className="rounded-md border border-white/20 px-3 py-2 text-sm text-black bg-white"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Notification title"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-white/70">Message</span>
                  <textarea
                    className="rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-black min-h-[140px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Notification body"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-white/70">Audience</span>
                  <select
                    className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm"
                    value={audience}
                    onChange={(e) =>
                      setAudience(e.target.value as "all" | "subscribed" | "state" | "uids")
                    }
                  >
                    <option value="all">All users with a device token</option>
                    <option value="subscribed">Subscribed users only (subscribed === true)</option>
                    <option value="state">By Nigerian state (matches users.state)</option>
                    <option value="uids">Selected users only (Firebase UIDs — for testing)</option>
                  </select>
                </label>
                {audience === "uids" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-white/70">User IDs (Firebase UID)</span>
                    <p className="text-xs text-white/45 leading-relaxed">
                      One UID per line, or separate with commas. Must match Firestore{" "}
                      <code className="text-white/60">users</code> document ids (same as Auth uid).
                      Max 500 per send. Copy from App users in admin if needed.
                    </p>
                    <textarea
                      className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white font-mono min-h-[100px] placeholder:text-white/30"
                      value={selectedUidsText}
                      onChange={(e) => setSelectedUidsText(e.target.value)}
                      placeholder="e.g. AbCdEf123…"
                      spellCheck={false}
                      autoComplete="off"
                    />
                    <span className="text-xs text-white/40">
                      {parseUidInput(selectedUidsText).length} UID(s) parsed
                    </span>
                  </label>
                )}
                {audience === "state" && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-white/70">States (multi-select)</span>
                    <p className="text-xs text-white/45 leading-relaxed">
                      Same names as <code className="text-white/60">GET /state</code> (
                      <code className="text-white/60">state_name</code>) — these should match what
                      the app stores on each user as <code className="text-white/60">users.state</code>{" "}
                      in Firestore.
                    </p>
                    <input
                      type="search"
                      className="rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-black"
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      placeholder="Filter states…"
                      autoComplete="off"
                    />
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        className="text-green underline-offset-2 hover:underline"
                        onClick={selectAllFilteredStates}
                      >
                        Select all shown
                      </button>
                      <button
                        type="button"
                        className="text-white/50 underline-offset-2 hover:underline"
                        onClick={clearSelectedStates}
                      >
                        Clear all
                      </button>
                      <span className="text-white/40">
                        {selectedStateNames.length} selected
                      </span>
                    </div>
                    <div
                      className="max-h-52 overflow-y-auto rounded-md border border-white/15 bg-black/30 p-2 space-y-1.5"
                      role="group"
                      aria-label="States"
                    >
                      {loadingStates ? (
                        <p className="text-white/50 text-sm px-1">Loading states…</p>
                      ) : filteredStatesForPicker.length === 0 ? (
                        <p className="text-white/40 text-sm px-1">No states match.</p>
                      ) : (
                        filteredStatesForPicker.map((s) => {
                          const checked = selectedStateNames.includes(s.state_name);
                          return (
                            <label
                              key={s.id}
                              className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-white/5"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-white/30 text-green focus:ring-green shrink-0"
                                checked={checked}
                                onChange={() => toggleStateSelected(s.state_name)}
                              />
                              <span className="text-sm text-white/90">{s.state_name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  label={sending ? "Sending…" : "Send"}
                  className="bg-green text-sm w-fit"
                  disabled={sending}
                />
              </form>
            </div>
          </Card>

          <div className="flex flex-col gap-3 flex-1 min-h-0 xl:flex-1 xl:min-h-[12rem]">
            <h2 className="text-lg font-semibold text-white shrink-0">Past notifications</h2>
            <div className="flex-1 min-h-0 max-h-[min(400px,50vh)] overflow-y-auto pr-1 -mr-1 xl:max-h-none">
              {loadingHistory ? (
                <p className="text-white/50 text-sm">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-white/40 text-sm">No history yet.</p>
              ) : (
                <ul className="flex flex-col gap-3 pb-1">
                  {history.map((row) => {
                    const key = `${row.timeStamp}::${row.title}`;
                    return (
                      <li key={key}>
                        <Card>
                          <div className="p-4 flex gap-3 items-start text-white">
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <p className="font-medium text-sm truncate" title={row.title}>
                                {row.title}
                              </p>
                              <p className="text-xs text-white/45">{row.timeStamp}</p>
                            </div>
                            <button
                              type="button"
                              title="Delete from history"
                              onClick={() => void removeOne(row)}
                              disabled={removingKey === key}
                              className="shrink-0 p-2 rounded-md text-red-400 hover:bg-white/10 disabled:opacity-40"
                            >
                              <PiTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
