"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import PaginationBar from "@/app/_components/PaginationBar";
import StatCard from "@/app/_components/StatCard";
import {
  AdminUserRow,
  createAdminInvitation,
  deleteAdminUser,
  fetchAdminInvitations,
  fetchAdminRolesDetailed,
  fetchAdminUsers,
  fetchAdminUsersCount,
  revokeAdminInvitation,
  updateAdminUserRole,
} from "@/lib/actions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BiSearch } from "react-icons/bi";
import { PiEnvelopeSimple, PiUsersThree } from "react-icons/pi";

const PAGE_SIZE = 8;

type RoleRow = { id: number; slug: string; name: string };
type InviteRow = {
  id: number;
  email: string;
  role_id: number;
  expires_at: string;
  role_slug?: string;
  role_name?: string;
};

function formatExpiry(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const InvitesPage = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [searchInvites, setSearchInvites] = useState("");
  const [searchAdmins, setSearchAdmins] = useState("");
  const [currentPageInvites, setCurrentPageInvites] = useState(1);
  const [currentPageAdmins, setCurrentPageAdmins] = useState(1);
  const [adminUserCount, setAdminUserCount] = useState<number | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, invRes, countRes, usersRes] = await Promise.all([
        fetchAdminRolesDetailed() as Promise<{ roles?: RoleRow[] }>,
        fetchAdminInvitations() as Promise<{ invitations?: InviteRow[] }>,
        fetchAdminUsersCount(),
        fetchAdminUsers() as Promise<{ users?: AdminUserRow[] }>,
      ]);
      setRoles(rolesRes?.roles ?? []);
      setInvites(invRes?.invitations ?? []);
      setAdminUsers(usersRes?.users ?? []);
      setAdminUserCount(
        typeof countRes?.count === "number" ? countRes.count : 0
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inviteRoles = useMemo(
    () => roles.filter((r) => r.slug !== "super_admin"),
    [roles]
  );

  useEffect(() => {
    if (inviteRoles.length && roleId === "") setRoleId(inviteRoles[0].id);
  }, [inviteRoles, roleId]);

  const filteredInvites = useMemo(() => {
    const q = searchInvites.trim().toLowerCase();
    if (!q) return invites;
    return invites.filter((i) => {
      const roleLabel = `${i.role_name ?? ""} ${i.role_slug ?? ""}`.toLowerCase();
      return i.email.toLowerCase().includes(q) || roleLabel.includes(q);
    });
  }, [invites, searchInvites]);

  const filteredAdmins = useMemo(() => {
    const q = searchAdmins.trim().toLowerCase();
    if (!q) return adminUsers;
    return adminUsers.filter((u) =>
      `${u.username} ${u.email} ${u.role_name ?? ""} ${u.role_slug ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [adminUsers, searchAdmins]);

  const paginatedInvites = useMemo(() => {
    const start = (currentPageInvites - 1) * PAGE_SIZE;
    return filteredInvites.slice(start, start + PAGE_SIZE);
  }, [filteredInvites, currentPageInvites]);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPageAdmins - 1) * PAGE_SIZE;
    return filteredAdmins.slice(start, start + PAGE_SIZE);
  }, [filteredAdmins, currentPageAdmins]);

  useEffect(() => {
    setCurrentPageInvites(1);
  }, [searchInvites]);

  useEffect(() => {
    setCurrentPageAdmins(1);
  }, [searchAdmins]);

  const sendInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (roleId === "") {
      toast.error("Select a role");
      return;
    }
    try {
      const res = await createAdminInvitation({
        email: email.trim(),
        role_id: Number(roleId),
      });
      setEmail("");
      const msg =
        res?.message ||
        (res?.emailSent
          ? "Invitation email sent."
          : "Invitation created. Check server logs if email is off.");
      toast.success(msg);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invite failed");
    }
  };

  const revoke = async (id: number) => {
    if (!confirm("Revoke this invitation?")) return;
    try {
      await revokeAdminInvitation(id);
      toast.success("Revoked");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Revoke failed");
    }
  };

  const changeRole = async (userId: number, nextRoleId: number) => {
    try {
      setBusyUserId(userId);
      await updateAdminUserRole(userId, nextRoleId);
      toast.success("Role updated");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update role");
    } finally {
      setBusyUserId(null);
    }
  };

  const removeAdmin = async (user: AdminUserRow) => {
    if (!confirm(`Delete admin user ${user.username} (${user.email})?`)) return;
    try {
      setBusyUserId(user.id);
      await deleteAdminUser(user.id);
      toast.success("Admin user deleted");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 text-white">
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <StatCard
          label="Pending invites"
          value={loading ? "…" : invites.length}
          hint="Not yet accepted"
          icon={<PiEnvelopeSimple className="h-9 w-9" />}
        />
        <StatCard
          label="Admin users"
          value={loading ? "…" : adminUserCount ?? "—"}
          hint="Console login accounts"
          icon={<PiUsersThree className="h-9 w-9" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
        <Card className="w-full min-w-0 h-full">
          <div className="p-4 sm:p-5 flex flex-col gap-3 w-full min-h-[260px] h-full">
            <div>
              <h1 className="text-base font-medium text-white">Invite admin user</h1>
              <p className="text-xs text-white/45 mt-1">
                Send a one-time link (expires in 7 days).
              </p>
            </div>
            <div className="flex flex-col gap-3 mt-1">
              <label className="flex flex-col gap-1 min-w-0 max-w-md">
                <span className="text-xs text-white/55">Email</span>
                <input
                  type="email"
                  className="input-modal text-sm rounded-md w-full text-white placeholder:text-white/50 min-h-[2.75rem]"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="flex flex-col gap-1 min-w-0 max-w-md">
                <span className="text-xs text-white/55">Role</span>
                <select
                  className="input-modal text-sm rounded-md w-full text-white appearance-none min-h-[2.75rem]"
                  value={roleId === "" ? "" : String(roleId)}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  disabled={inviteRoles.length === 0}
                >
                  {inviteRoles.length === 0 ? (
                    <option value="">No roles available</option>
                  ) : (
                    inviteRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.slug})
                      </option>
                    ))
                  )}
                </select>
              </label>
              <Button
                label="Send invite"
                className="bg-green text-sm w-full sm:w-auto min-w-[10rem] h-[2.75rem] px-6 py-0 inline-flex items-center justify-center self-start"
                onClick={() => void sendInvite()}
                disabled={inviteRoles.length === 0}
              />
            </div>
          </div>
        </Card>

        <Card className="w-full min-w-0 h-full">
          <div className="p-4 sm:p-5 w-full flex flex-col gap-3 min-h-[260px] h-full">
            <h2 className="text-base font-medium text-white">Pending invitations</h2>
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <BiSearch className="h-4 w-4 text-white/40" />
              </span>
              <input
                type="search"
                placeholder="Search email or role…"
                value={searchInvites}
                onChange={(e) => setSearchInvites(e.target.value)}
                className="w-full min-h-[2.5rem] rounded-md border border-white/20 bg-black/30 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-green focus:outline-none"
              />
            </div>

            <div className="w-full overflow-x-auto overflow-y-auto mt-1 max-h-[190px] min-h-[190px]">
              <table className="table-auto w-full min-w-[520px] text-sm">
                <thead className="bg-green text-black">
                  <tr className="text-left">
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Expires</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-white/50">Loading…</td>
                    </tr>
                  ) : paginatedInvites.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-white/50">
                        {invites.length === 0
                          ? "No pending invitations."
                          : "No results."}
                      </td>
                    </tr>
                  ) : (
                    paginatedInvites.map((i) => (
                      <tr key={i.id} className="border-b border-white/10 hover:bg-white/[0.06]">
                        <td className="p-2 max-w-[220px] truncate">{i.email}</td>
                        <td className="p-2">{i.role_name ?? i.role_slug ?? "—"}</td>
                        <td className="p-2 text-white/80">{formatExpiry(i.expires_at)}</td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => void revoke(i.id)}
                            className="rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={currentPageInvites}
              pageSize={PAGE_SIZE}
              totalItems={filteredInvites.length}
              onPageChange={setCurrentPageInvites}
              className="pt-2 border-t border-white/10"
            />
          </div>
        </Card>
      </div>

      <Card className="w-full min-w-0">
        <div className="p-4 sm:p-5 w-full flex flex-col gap-3 min-h-[320px]">
          <h2 className="text-base font-medium text-white">Admin users</h2>
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <BiSearch className="h-4 w-4 text-white/40" />
            </span>
            <input
              type="search"
              placeholder="Search name, email or role…"
              value={searchAdmins}
              onChange={(e) => setSearchAdmins(e.target.value)}
              className="w-full min-h-[2.5rem] rounded-md border border-white/20 bg-black/30 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-green focus:outline-none"
            />
          </div>

          <div className="w-full overflow-x-auto mt-1">
            <table className="table-auto w-full min-w-[720px] text-sm">
              <thead className="bg-green text-black">
                <tr className="text-left">
                  <th className="p-2">Username</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-white/50">Loading…</td>
                  </tr>
                ) : paginatedAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-white/50">No admin users found.</td>
                  </tr>
                ) : (
                  paginatedAdmins.map((u) => (
                    <tr key={u.id} className="border-b border-white/10 hover:bg-white/[0.06]">
                      <td className="p-2">{u.username}</td>
                      <td className="p-2 max-w-[260px] truncate">{u.email}</td>
                      <td className="p-2 min-w-[220px]">
                        <select
                          className="input-modal !min-h-[2.2rem] !py-1 !px-2 text-sm w-full max-w-[260px]"
                          value={u.role_id == null ? "" : String(u.role_id)}
                          onChange={(e) =>
                            void changeRole(u.id, Number(e.target.value))
                          }
                          disabled={busyUserId === u.id || roles.length === 0 || u.role_id == null}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.slug})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => void removeAdmin(u)}
                          className="rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                          disabled={busyUserId === u.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={currentPageAdmins}
            pageSize={PAGE_SIZE}
            totalItems={filteredAdmins.length}
            onPageChange={setCurrentPageAdmins}
            className="pt-2 border-t border-white/10"
          />
        </div>
      </Card>
    </div>
  );
};

export default InvitesPage;
