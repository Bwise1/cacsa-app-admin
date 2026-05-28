"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BOOK_IDS,
  type HymnBundle,
  type HymnEntry,
  type HymnLocaleContent,
  type HymnVerse,
} from "@/lib/hymns/schema";

export default function HymnEditPage() {
  const params = useParams();
  const rawParam = params?.id;
  const rawId =
    typeof rawParam === "string"
      ? decodeURIComponent(rawParam)
      : Array.isArray(rawParam)
        ? decodeURIComponent(rawParam[0] ?? "")
        : "";
  const router = useRouter();
  const isNew = rawId === "new";

  const [bundle, setBundle] = useState<HymnBundle | null>(null);
  const [entry, setEntry] = useState<HymnEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [localeTab, setLocaleTab] = useState<"en" | "yo">("en");
  const [versesEn, setVersesEn] = useState("[]");
  const [versesYo, setVersesYo] = useState("[]");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/hymns/bundle", { credentials: "include" });
        if (!r.ok) throw new Error("load");
        const data = (await r.json()) as { bundle: HymnBundle };
        if (cancelled) return;
        setBundle(data.bundle);

        if (isNew) {
          const n: HymnEntry = {
            id: `cacsa-main-${Date.now()}`,
            bookId: BOOK_IDS.main,
            number: 1,
            categoryIds: ["general"],
            locales: {
              en: { title: "", verses: [] },
              yo: { title: "", verses: [] },
            },
          };
          setEntry(n);
          setVersesEn(JSON.stringify([], null, 2));
          setVersesYo(JSON.stringify([], null, 2));
        } else {
          const found = data.bundle.hymns.find((h) => h.id === rawId);
          if (!found) {
            toast.error("Hymn not found");
            router.push("/hymns");
            return;
          }
          setEntry(found);
          setVersesEn(JSON.stringify(found.locales.en?.verses ?? [], null, 2));
          setVersesYo(JSON.stringify(found.locales.yo?.verses ?? [], null, 2));
        }
      } catch {
        toast.error("Failed to load bundle");
        router.push("/hymns");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, rawId, router]);

  function parseVerses(raw: string): HymnVerse[] {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Verses must be a JSON array");
    return parsed.map((v, i) => {
      const o = v as { label?: string; lines?: string[] };
      if (!o.lines || !Array.isArray(o.lines)) {
        throw new Error(`Invalid verse at index ${i}`);
      }
      return {
        label: o.label ?? `Verse ${i + 1}`,
        lines: o.lines.map(String),
      };
    });
  }

  async function deleteHymn() {
    if (!bundle || !entry) return;
    if (!confirm(`Delete hymn "${entry.locales.en?.title || entry.id}"? This saves as a draft — publish to apply.`)) return;
    setDeleting(true);
    try {
      const nextBundle: HymnBundle = {
        ...bundle,
        hymns: bundle.hymns.filter((h) => h.id !== entry.id),
      };
      const put = await fetch("/api/hymns/bundle", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: nextBundle, publish: false }),
      });
      if (!put.ok) throw new Error("delete");
      toast.success('Hymn deleted — use "Publish to apps" to apply.');
      router.push("/hymns");
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  async function save() {
    if (!bundle || !entry) return;
    try {
      const en: HymnLocaleContent = {
        title: entry.locales.en?.title ?? "",
        theme: entry.locales.en?.theme ?? null,
        scripture: entry.locales.en?.scripture ?? null,
        meter: entry.locales.en?.meter ?? null,
        tune: entry.locales.en?.tune ?? null,
        closingAmen: entry.locales.en?.closingAmen ?? false,
        verses: parseVerses(versesEn),
      };
      const yo: HymnLocaleContent = {
        title: entry.locales.yo?.title ?? "",
        theme: entry.locales.yo?.theme ?? null,
        scripture: entry.locales.yo?.scripture ?? null,
        meter: entry.locales.yo?.meter ?? null,
        tune: entry.locales.yo?.tune ?? null,
        closingAmen: entry.locales.yo?.closingAmen ?? false,
        verses: parseVerses(versesYo),
      };
      const next: HymnEntry = {
        ...entry,
        locales: { en, yo },
      };

      let hymns: HymnEntry[];
      if (isNew) {
        hymns = [...bundle.hymns, next];
      } else {
        hymns = bundle.hymns.map((h) => (h.id === next.id ? next : h));
      }

      const nextBundle: HymnBundle = { ...bundle, hymns };

      const put = await fetch("/api/hymns/bundle", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: nextBundle, publish: false }),
      });
      if (!put.ok) throw new Error("save");
      toast.success('Saved draft — use “Publish to apps” on the hymns list when ready');
      router.push("/hymns");
    } catch (e) {
      console.error(e);
      toast.error(
        "Save failed — check verses JSON (array of {label, lines}) or size limits."
      );
    }
  }

  const loc: Partial<HymnLocaleContent> & { title: string } = {
    title: "",
    ...(entry?.locales[localeTab] ?? {}),
  };

  function patchLocale<K extends keyof HymnLocaleContent>(
    key: K,
    value: HymnLocaleContent[K]
  ) {
    if (!entry) return;
    const tab = localeTab;
    const cur = entry.locales[tab] ?? {
      title: "",
      verses: [],
    };
    setEntry({
      ...entry,
      locales: {
        ...entry.locales,
        [tab]: { ...cur, [key]: value },
      },
    });
  }

  if (loading || !entry || !bundle) {
    return (
      <div className="text-white/80 text-sm">
        {loading ? "Loading…" : "—"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/hymns" className="text-green text-sm hover:underline">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-white">
          {isNew ? "New hymn" : "Edit hymn"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-white/70">Stable id</span>
          <input
            className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white font-mono text-sm"
            value={entry.id}
            onChange={(e) => setEntry({ ...entry, id: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-white/70">Number</span>
          <input
            type="number"
            className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
            value={entry.number}
            onChange={(e) =>
              setEntry({ ...entry, number: parseInt(e.target.value, 10) || 0 })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-white/70">Book</span>
          <select
            className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
            value={entry.bookId}
            onChange={(e) => setEntry({ ...entry, bookId: e.target.value })}
          >
            <option value={BOOK_IDS.main}>cacsa_main</option>
            <option value={BOOK_IDS.various}>cacsa_various</option>
          </select>
        </label>
      </div>

      <div className="flex gap-2 border-b border-white/15 pb-2">
        {(["en", "yo"] as const).map((code) => (
          <button
            key={code}
            type="button"
            className={`px-3 py-1 rounded-md text-sm ${
              localeTab === code
                ? "bg-green text-black"
                : "bg-white/10 text-white"
            }`}
            onClick={() => setLocaleTab(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-white/70">Title</span>
          <input
            className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
            value={loc.title}
            onChange={(e) => patchLocale("title", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-white/70">Theme</span>
          <input
            className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
            value={loc.theme ?? ""}
            onChange={(e) => patchLocale("theme", e.target.value || null)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-white/70">Scripture</span>
          <input
            className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
            value={loc.scripture ?? ""}
            onChange={(e) => patchLocale("scripture", e.target.value || null)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Meter</span>
            <input
              className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
              value={loc.meter ?? ""}
              onChange={(e) => patchLocale("meter", e.target.value || null)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Tune</span>
            <input
              className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white"
              value={loc.tune ?? ""}
              onChange={(e) => patchLocale("tune", e.target.value || null)}
            />
          </label>
        </div>
        <label className="flex gap-2 items-center text-sm text-white/80">
          <input
            type="checkbox"
            checked={!!loc.closingAmen}
            onChange={(e) => patchLocale("closingAmen", e.target.checked)}
          />
          Closing Amen
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-white/70">
          Verses JSON ({localeTab}) — array of {"{"} label, lines[]
          {"}"}
        </span>
        <textarea
          className="rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white font-mono text-xs min-h-[220px]"
          value={localeTab === "en" ? versesEn : versesYo}
          onChange={(e) =>
            localeTab === "en"
              ? setVersesEn(e.target.value)
              : setVersesYo(e.target.value)
          }
        />
      </label>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => void save()}
          className="rounded-md bg-green px-4 py-2 text-sm font-medium text-black"
        >
          Save & publish
        </button>
        <Link
          href="/hymns"
          className="rounded-md border border-white/30 px-4 py-2 text-sm text-white"
        >
          Cancel
        </Link>
        {!isNew && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => void deleteHymn()}
            className="ml-auto rounded-md border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete hymn"}
          </button>
        )}
      </div>
    </div>
  );
}
