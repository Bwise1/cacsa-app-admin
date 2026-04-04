"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import toast from "react-hot-toast";
import type { HymnBundle, HymnManifest } from "@/lib/hymns/schema";

async function apiErrorMessage(r: Response): Promise<string> {
  let detail = `HTTP ${r.status}`;
  try {
    const j = (await r.json()) as {
      error?: string;
      hint?: string;
      message?: string;
      status?: string;
    };
    if (j.error) detail = j.error;
    else if (j.message) detail = j.message;
    if (j.hint) detail = `${detail} — ${j.hint}`;
  } catch {
    /* ignore */
  }
  return detail;
}

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(await apiErrorMessage(r));
  return r.json() as Promise<{
    bundle: HymnBundle;
    exists: boolean;
    hasDraft?: boolean;
  }>;
};

const fetchManifest = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(await apiErrorMessage(r));
  return r.json() as Promise<{
    manifest: HymnManifest | null;
    manifestUrl: string;
  }>;
};

export default function HymnsPage() {
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR("/api/hymns/bundle", fetcher);
  const { data: manifestData } = useSWR("/api/hymns/manifest", fetchManifest);
  const [q, setQ] = useState("");
  const [bookFilter, setBookFilter] = useState<string>("all");
  const [publishing, setPublishing] = useState(false);

  async function publishToApps() {
    setPublishing(true);
    try {
      const r = await fetch("/api/hymns/publish", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        throw new Error(await apiErrorMessage(r));
      }
      const j = (await r.json()) as { syncVersion?: number };
      toast.success(
        j.syncVersion != null
          ? `Published to apps (sync v${j.syncVersion})`
          : "Published to apps"
      );
      await mutate("/api/hymns/bundle");
      await mutate("/api/hymns/manifest");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!data?.bundle) return [];
    const qq = q.trim().toLowerCase();
    let list = data.bundle.hymns;
    if (bookFilter !== "all") {
      list = list.filter((h) => h.bookId === bookFilter);
    }
    if (!qq) return list;
    return list.filter((h) => {
      if (h.number.toString().includes(qq)) return true;
      if (h.id.toLowerCase().includes(qq)) return true;
      for (const loc of Object.values(h.locales)) {
        if (loc.title.toLowerCase().includes(qq)) return true;
      }
      return false;
    });
  }, [data, q, bookFilter]);

  if (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to load hymns bundle.";
    return (
      <div className="text-red-400 text-sm space-y-2 max-w-2xl">
        <p className="font-medium text-white/90">Could not load hymns</p>
        <p className="text-white/80 whitespace-pre-wrap">{msg}</p>
        <ul className="text-white/50 text-xs list-disc list-inside space-y-1">
          <li>
            <strong className="text-white/70">403 / Forbidden</strong> — your user
            needs <code className="text-green/90">hymns:write</code> or{" "}
            <code className="text-green/90">admin:analytics</code>.
          </li>
          <li>
            <strong className="text-white/70">503 / REST API not configured</strong>{" "}
            — set <code className="text-white/80">NEXT_PUBLIC_REST_API_ENDPOINT</code>{" "}
            in admin env (same base URL as login, e.g.{" "}
            <code className="text-white/80">http://localhost:5001/</code>).
          </li>
          <li>
            <strong className="text-white/70">Storage / Firebase</strong> — hymns
            are written by <code className="text-white/80">cacsa_app_api</code> only.
            Enable <strong>Firebase Storage</strong> in Console (no manual file
            upload needed; the first successful save creates the JSON in the
            bucket).
          </li>
        </ul>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-white/80 text-sm">Loading hymns…</div>;
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div>
        <h1 className="text-xl font-semibold text-white">Hymns</h1>
        <p className="text-sm text-white/60 mt-1">
          Saves are <strong className="text-white/80">drafts</strong> until you
          publish — mobile apps only see updates after{" "}
          <strong className="text-white/80">Publish to apps</strong> (one sync
          version bump, not per hymn edit).
        </p>
        <p className="text-sm text-white/50 mt-2">
          Live sync version:{" "}
          <span className="text-green font-mono">
            {manifestData?.manifest?.syncVersion ??
              manifestData?.manifest?.contentRevision ??
              data.bundle.contentRevision}
          </span>
          {data.hasDraft ? (
            <span className="ml-2 text-amber-300/90">
              — unpublished draft in Storage
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Search id, number, title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 w-full max-w-md"
        />
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white"
        >
          <option value="all">All books</option>
          <option value="cacsa_main">Main</option>
          <option value="cacsa_various">Various</option>
        </select>
        <Link
          href="/hymns/new"
          className="inline-flex items-center rounded-md bg-green px-3 py-2 text-sm font-medium text-black"
        >
          New hymn
        </Link>
        <button
          type="button"
          disabled={publishing}
          onClick={() => void publishToApps()}
          className="inline-flex items-center rounded-md border border-green/60 bg-green/10 px-3 py-2 text-sm font-medium text-green hover:bg-green/20 disabled:opacity-50"
        >
          {publishing ? "Publishing…" : "Publish to apps"}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-md border border-white/15">
        <table className="w-full text-left text-sm text-white/90">
          <thead className="bg-white/5 text-white/70 sticky top-0">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Book</th>
              <th className="px-3 py-2">Id</th>
              <th className="px-3 py-2">Title (en)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id} className="border-t border-white/10">
                <td className="px-3 py-2 font-mono">{h.number}</td>
                <td className="px-3 py-2">{h.bookId}</td>
                <td className="px-3 py-2 font-mono text-xs">{h.id}</td>
                <td className="px-3 py-2">{h.locales.en?.title ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/hymns/${encodeURIComponent(h.id)}`}
                    className="text-green hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-white/50"
                >
                  No hymns match.{" "}
                  {data.bundle.hymns.length === 0
                    ? "Create one or import from the Flutter export script."
                    : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {manifestData && (
        <div className="rounded-md border border-white/15 p-3 text-xs text-white/70 space-y-2 break-all">
          <div className="font-sans text-white/50">
            Flutter: <code className="text-green font-mono">HYMNS_MANIFEST_URL</code>{" "}
            = public URL of <code className="font-mono text-white/80">hymns_manifest.json</code>
            :
          </div>
          <div className="font-mono text-white/90">{manifestData.manifestUrl}</div>
          {manifestData.manifest && (
            <div className="font-sans text-white/50">
              Bundle URL (inside manifest):{" "}
              <span className="font-mono text-white/80 break-all">
                {manifestData.manifest.bundleUrl}
              </span>
              <br />
              Sync v{" "}
              <span className="text-green">
                {manifestData.manifest.syncVersion ??
                  manifestData.manifest.contentRevision}
              </span>
              {" "}
              (contentRevision {manifestData.manifest.contentRevision}). SHA256:{" "}
              {manifestData.manifest.bundleSha256 ?? "—"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
