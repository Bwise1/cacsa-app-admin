"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import Modal from "@/app/_components/Modal";
import StatCard from "@/app/_components/StatCard";
import {
  createAdminRole,
  deleteAdminRole,
  fetchAdminRolesDetailed,
  putAdminRolePermissions,
} from "@/lib/actions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { PiShieldCheck } from "react-icons/pi";

type PermissionRow = { id: number; slug: string; description: string | null };
type RoleRow = {
  id: number;
  slug: string;
  name: string;
  permissionIds: number[];
};

function permissionSlugsForRole(
  r: RoleRow,
  permissions: PermissionRow[]
): string[] {
  const set = new Set(r.permissionIds);
  return permissions.filter((p) => set.has(p.id)).map((p) => p.slug);
}

function permissionSummaryLine(slugs: string[], maxShow = 5): string {
  if (slugs.length === 0) return "—";
  if (slugs.length <= maxShow) return slugs.join(", ");
  return `${slugs.slice(0, maxShow).join(", ")} · +${slugs.length - maxShow} more`;
}

const RolesPage = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSelection, setEditSelection] = useState<number[]>([]);

  const editingRole = useMemo(
    () => roles.find((r) => r.id === editingId) ?? null,
    [roles, editingId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await fetchAdminRolesDetailed()) as {
        roles?: RoleRow[];
        permissions?: PermissionRow[];
      };
      setRoles(res?.roles ?? []);
      setPermissions(res?.permissions ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createRole = async () => {
    if (!slug.trim() || !name.trim()) {
      toast.error("Slug and name are required");
      return;
    }
    try {
      await createAdminRole({ slug: slug.trim(), name: name.trim() });
      setSlug("");
      setName("");
      toast.success("Role created");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const openEdit = (r: RoleRow) => {
    setEditingId(r.id);
    setEditSelection([...r.permissionIds]);
  };

  const togglePerm = (id: number) => {
    setEditSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const savePerms = async () => {
    if (editingId == null) return;
    try {
      await putAdminRolePermissions(editingId, editSelection);
      toast.success("Permissions updated");
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const removeRole = async (r: RoleRow) => {
    if (r.slug === "super_admin") {
      toast.error("Cannot delete super_admin");
      return;
    }
    if (!confirm(`Delete role ${r.slug}?`)) return;
    try {
      await deleteAdminRole(r.id);
      toast.success("Role deleted");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 w-full min-w-0 overflow-hidden text-white">
      <Toaster />
      <div className="flex flex-col lg:flex-row gap-4 items-stretch w-full min-w-0">
        <div className="w-full sm:w-[190px] shrink-0 max-w-full">
          <StatCard
            label="Roles"
            value={loading ? "…" : roles.length}
            hint="Defined for admin access"
            icon={<PiShieldCheck className="h-10 w-10" />}
          />
        </div>
        <Card className="min-w-0 flex-1 w-full">
          <div className="p-6 flex flex-col gap-5 w-full">
            <h2 className="text-sm font-medium text-white/80 tracking-wide">
              Create role
            </h2>
            <div className="flex flex-col xl:flex-row xl:items-end gap-4 xl:gap-5 w-full min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-w-0">
                <label className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs text-white/55">Slug</span>
                  <input
                    type="text"
                    className="input-modal text-sm rounded-lg"
                    placeholder="e.g. content_editor"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs text-white/55">Display name</span>
                  <input
                    type="text"
                    className="input-modal text-sm rounded-lg"
                    placeholder="Content editor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                </label>
              </div>
              <div className="flex w-full xl:w-auto xl:shrink-0 xl:pb-0.5">
                <Button
                  label="Create"
                  className="bg-green text-sm w-full xl:min-w-[8.5rem] xl:w-auto h-[2.75rem] min-h-[2.75rem] px-6 py-0 inline-flex items-center justify-center"
                  onClick={() => void createRole()}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="w-full min-w-0">
        <div className="p-6 sm:p-12 w-full flex flex-col gap-4 min-h-[320px] min-w-0 max-w-full">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium text-white">All roles</h2>
            <span className="text-xs text-white/45">
              {permissions.length} permission
              {permissions.length === 1 ? "" : "s"} available
            </span>
          </div>

          <div className="w-full max-h-[min(60vh,560px)] overflow-x-auto overflow-y-auto mt-4 -mx-1 px-1">
            <table className="py-3 mb-4 table-fixed w-full min-w-[640px] max-w-full text-left text-sm border-collapse">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[47%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-green">
                <tr className="text-left">
                  <th className="p-2 font-medium">Display name</th>
                  <th className="p-2 font-medium">Slug</th>
                  <th className="p-2 font-medium">Permissions</th>
                  <th className="p-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-white/50">
                      Loading…
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-white/50">
                      No roles yet. Create one above.
                    </td>
                  </tr>
                ) : (
                  roles.map((r) => {
                    const slugs = permissionSlugsForRole(r, permissions);
                    const line = permissionSummaryLine(slugs);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-white/10 hover:bg-white/[0.06]"
                      >
                        <td className="p-2 font-medium text-white align-top">
                          {r.name}
                        </td>
                        <td className="p-2 font-mono text-xs text-white/80 align-top">
                          <span className="line-clamp-2 break-all">{r.slug}</span>
                        </td>
                        <td className="p-2 align-top">
                          <span
                            className="text-xs text-white/80 line-clamp-4 break-words"
                            title={slugs.length ? slugs.join(", ") : undefined}
                          >
                            {line}
                          </span>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap align-top">
                          <span className="inline-flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="text-green hover:underline text-sm"
                            >
                              Edit permissions
                            </button>
                            {r.slug !== "super_admin" ? (
                              <button
                                type="button"
                                onClick={() => void removeRole(r)}
                                className="text-red hover:underline text-sm"
                              >
                                Delete
                              </button>
                            ) : (
                              <span className="text-white/35 text-xs">
                                Protected
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={editingId != null}
        onClose={() => setEditingId(null)}
        shellClassName="relative w-[min(520px,calc(100vw-2rem))] h-auto max-w-[min(520px,calc(100vw-2rem))]"
        bodyClassName="modal-content relative bg-black px-14 py-6 sm:px-16 md:px-20 rounded-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg"
        cardClassName="h-auto min-h-0"
      >
        <div className="pt-8 flex flex-col gap-4 text-white">
          <div>
            <h3 className="text-lg font-semibold">Edit permissions</h3>
            {editingRole ? (
              <p className="text-sm text-white/55 mt-1">
                <span className="text-white/90">{editingRole.name}</span>
                <span className="font-mono text-xs text-white/50 ml-2">
                  {editingRole.slug}
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 max-h-[min(50vh,420px)] overflow-y-auto no-scrollbar pr-1">
            {permissions.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-3 cursor-pointer rounded-md border border-white/10 bg-black/30 px-3 py-2.5 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-white/30 text-green focus:ring-green focus:ring-offset-0 bg-black/50"
                  checked={editSelection.includes(p.id)}
                  onChange={() => togglePerm(p.id)}
                />
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-green/90">
                    {p.slug}
                  </span>
                  {p.description ? (
                    <span className="block text-[11px] text-white/45 mt-0.5">
                      {p.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <Button
              label="Save"
              className="bg-green text-sm"
              onClick={() => void savePerms()}
            />
            <Button
              label="Cancel"
              className="bg-ca-grey text-sm"
              onClick={() => setEditingId(null)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RolesPage;
