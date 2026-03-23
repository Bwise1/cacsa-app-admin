"use client";

import Button from "@/app/_components/Button";
import Modal from "@/app/_components/Modal";
import {
  AdminAdRow,
  createAdminAd,
  deleteAdminAd,
  fetchAdminAds,
  updateAdminAd,
  uploadAdImage,
} from "@/lib/actions";
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { HiMagnifyingGlass, HiPhoto } from "react-icons/hi2";

function dateInputValue(s: string | null | undefined): string {
  if (!s) return "";
  const t = String(s).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
}

/** Display name column: image filename from URL, else brand. */
function adDisplayName(a: AdminAdRow): string {
  const brand = a.brand_name?.trim();
  if (brand) return brand;
  try {
    const u = new URL(a.asset_url);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg) return decodeURIComponent(seg.split("?")[0] ?? seg);
  } catch {
    /* ignore */
  }
  return "Ad image";
}

/** Table "DATE" column: campaign start, else created date. */
function adListDate(a: AdminAdRow): string {
  const raw = a.starts_at || a.created_at;
  return formatDDMMYY(raw);
}

function formatDDMMYY(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const t = String(raw).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "—";
    const [y, m, day] = t.split("-");
    return `${day}-${m}-${y.slice(2)}`;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}-${mm}-${yy}`;
}

/** Detail panel: "17 - 09 - 2026" style */
function formatDateAdded(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const t = String(raw).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "—";
    const [y, m, day] = t.split("-");
    return `${day} - ${m} - ${y}`;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd} - ${mm} - ${yyyy}`;
}

/** Human-readable run length from start/end dates. */
function durationLabel(
  starts: string | null | undefined,
  ends: string | null | undefined
): string {
  if (!starts || !ends) return "—";
  const s = new Date(String(starts).slice(0, 10));
  const e = new Date(String(ends).slice(0, 10));
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  const days =
    Math.round((e.getTime() - s.getTime()) / (86400 * 1000)) + 1;
  if (days < 1) return "—";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function matchesSearch(a: AdminAdRow, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    (a.brand_name?.toLowerCase().includes(s) ?? false) ||
    (a.slot?.toLowerCase().includes(s) ?? false) ||
    (a.state?.toLowerCase().includes(s) ?? false) ||
    (a.link_url?.toLowerCase().includes(s) ?? false) ||
    (a.public_id.toLowerCase().includes(s) ?? false) ||
    adDisplayName(a).toLowerCase().includes(s)
  );
}

const AdsPage = () => {
  const [ads, setAds] = useState<AdminAdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminAdRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAdRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    brand_name: "",
    contact: "",
    state: "",
    asset_url: "",
    link_url: "",
    slot: "",
    sort_order: 0,
    is_active: true,
    starts_at: "" as string,
    ends_at: "" as string,
  });

  const filteredAds = useMemo(
    () => ads.filter((a) => matchesSearch(a, search)),
    [ads, search]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAds();
      setAds(res?.ads ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load ads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      brand_name: "",
      contact: "",
      state: "",
      asset_url: "",
      link_url: "",
      slot: "",
      sort_order: 0,
      is_active: true,
      starts_at: "",
      ends_at: "",
    });
    setModalOpen(true);
  };

  const openEdit = (ad: AdminAdRow) => {
    setEditing(ad);
    setForm({
      brand_name: ad.brand_name ?? "",
      contact: ad.contact ?? "",
      state: ad.state ?? "",
      asset_url: ad.asset_url,
      link_url: ad.link_url ?? "",
      slot: ad.slot ?? "",
      sort_order: ad.sort_order,
      is_active: ad.is_active,
      starts_at: dateInputValue(ad.starts_at),
      ends_at: dateInputValue(ad.ends_at),
    });
    setModalOpen(true);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("adfile", file);
      const { link } = await uploadAdImage(fd);
      setForm((f) => ({ ...f, asset_url: link }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.asset_url.trim()) {
      toast.error("Image URL is required (upload or paste)");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        brand_name: form.brand_name.trim() || null,
        contact: form.contact.trim() || null,
        state: form.state.trim() || null,
        asset_url: form.asset_url.trim(),
        link_url: form.link_url.trim() || null,
        slot: form.slot.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        starts_at: form.starts_at.trim() || null,
        ends_at: form.ends_at.trim() || null,
      };
      if (editing) {
        await updateAdminAd(editing.id, payload);
        toast.success("Ad updated");
      } else {
        await createAdminAd(payload);
        toast.success("Ad created");
      }
      setModalOpen(false);
      await load();
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (ad: AdminAdRow) => {
    if (!confirm(`Delete this advert (${ad.brand_name || adDisplayName(ad)})?`)) {
      return;
    }
    try {
      await deleteAdminAd(ad.id);
      toast.success("Deleted");
      if (selected?.id === ad.id) setSelected(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const detailField = (label: string, value: React.ReactNode) => (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
        {label}
      </dt>
      <dd className="break-words text-sm text-white/95">{value ?? "—"}</dd>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col text-white">
      <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl border-2 border-green p-4 sm:p-5">
        {/* Top bar: search + Upload Ads */}
        <div className="flex flex-wrap items-stretch gap-3">
          <div className="top-icons relative min-h-[2.75rem] min-w-0 flex-1 basis-[min(100%,20rem)]">
            <HiMagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full min-h-[2.75rem] rounded-[10px] bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/45 outline-none ring-inset focus:ring-2 focus:ring-green"
            />
          </div>
          <Button
            type="button"
            icon={<HiPhoto className="h-5 w-5" />}
            label="Upload Ads"
            className="shrink-0 bg-green px-5 text-sm font-medium"
            onClick={openCreate}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:min-h-[280px]">
          {/* List */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-zinc-900/50 ring-1 ring-white/10">
            <div className="overflow-auto p-3 sm:p-4">
              {loading ? (
                <p className="text-sm text-white/60">Loading…</p>
              ) : filteredAds.length === 0 ? (
                <p className="text-sm text-white/60">
                  {ads.length === 0 ? "No ads yet." : "No matches."}
                </p>
              ) : (
                <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/15 text-[11px] font-semibold uppercase tracking-wide text-white/55">
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Slot</th>
                      <th className="pb-2 pr-3">Date</th>
                      <th className="pb-2 pr-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAds.map((a) => (
                      <tr
                        key={a.id}
                        className={`cursor-pointer border-b border-white/10 last:border-0 ${
                          selected?.id === a.id ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                        onClick={() => setSelected(a)}
                      >
                        <td className="max-w-[200px] truncate py-2.5 pr-3 font-medium">
                          {adDisplayName(a)}
                        </td>
                        <td className="py-2.5 pr-3 text-white/85">
                          {a.slot || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-white/85">
                          {adListDate(a)}
                        </td>
                        <td className="py-2.5 pr-3 text-white/85">
                          {durationLabel(a.starts_at, a.ends_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <aside className="flex w-full shrink-0 flex-col gap-4 rounded-lg bg-zinc-900/60 p-4 ring-1 ring-white/10 lg:w-[320px] xl:w-[340px]">
            {!selected ? (
              <p className="text-sm text-white/55">
                Select an advert from the list.
              </p>
            ) : (
              <>
                <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-white/10">
                  {selected.asset_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.asset_url}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/35">
                      No image
                    </div>
                  )}
                </div>

                <dl className="flex flex-col gap-3 text-sm">
                  {detailField("Brand name", selected.brand_name || "—")}
                  {detailField("Slot", selected.slot || "—")}
                  {detailField(
                    "Link",
                    selected.link_url ? (
                      <span className="break-all font-normal">
                        {selected.link_url}
                      </span>
                    ) : (
                      "—"
                    )
                  )}
                  {detailField("State", selected.state || "—")}
                  {detailField(
                    "Duration",
                    durationLabel(selected.starts_at, selected.ends_at)
                  )}
                  {detailField(
                    "Date added",
                    formatDateAdded(selected.created_at)
                  )}
                  {detailField("Contact", selected.contact || "—")}
                </dl>

                <div className="mt-auto flex w-full flex-col gap-2 pt-1">
                  <button
                    type="button"
                    className="block w-full rounded-md bg-[#ff1f1f] py-2.5 text-sm font-medium text-white text-center hover:bg-[#ff2f2f]"
                    onClick={() => void onDelete(selected)}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className="block w-full rounded-md border border-white/45 bg-transparent py-2.5 text-sm font-medium text-white text-center hover:bg-white/10"
                    onClick={() => openEdit(selected)}
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shellClassName="relative w-[min(440px,calc(100vw-1.5rem))] max-h-[min(92vh,640px)]"
        bodyClassName="modal-content relative max-h-[min(92vh,640px)] rounded-xl bg-black px-5 pb-5 pt-10 shadow-lg overflow-y-auto no-scrollbar"
        cardClassName="h-auto min-h-0"
        closeButtonClassName="top-3 right-4"
      >
        <h2 className="mb-3 text-lg font-semibold leading-tight">
          {editing ? "Edit advert" : "Upload advert"}
        </h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg bg-green px-3 py-2 text-xs font-medium text-black hover:bg-green/90">
              Choose image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
            </label>
            {uploading ? (
              <span className="text-xs text-white/50">Uploading…</span>
            ) : null}
          </div>
          <input
            className="input-modal w-full"
            value={form.asset_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, asset_url: e.target.value }))
            }
            placeholder="Image URL"
            required
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">Brand name</span>
              <input
                className="input-modal w-full"
                value={form.brand_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand_name: e.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">Contact</span>
              <input
                className="input-modal w-full"
                value={form.contact}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact: e.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs sm:col-span-2">
              <span className="text-white/65">Link (tap target)</span>
              <input
                className="input-modal w-full"
                value={form.link_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, link_url: e.target.value }))
                }
                placeholder="https://…"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">State</span>
              <input
                className="input-modal w-full"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">Slot</span>
              <input
                className="input-modal w-full"
                value={form.slot}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slot: e.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">Starts</span>
              <input
                type="date"
                className="input-modal w-full"
                value={form.starts_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, starts_at: e.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">Ends</span>
              <input
                type="date"
                className="input-modal w-full"
                value={form.ends_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ends_at: e.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-white/65">Sort order</span>
              <input
                type="number"
                className="input-modal w-full"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sort_order: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-xs sm:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-white/30"
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <Button
              type="submit"
              label={saving ? "Saving…" : editing ? "Save" : "Create"}
              className="bg-green px-5 text-sm"
              disabled={saving}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdsPage;
