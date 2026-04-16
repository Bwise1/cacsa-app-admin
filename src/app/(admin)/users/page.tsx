"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import Modal from "@/app/_components/Modal";
import PaginationBar from "@/app/_components/PaginationBar";
import StatCard from "@/app/_components/StatCard";
import {
  adminAddSubscriber,
  adminDeleteAppUser,
  adminUnsubscribeAppUser,
  AppUserRow,
  fetchAdminSubscriberPlans,
  fetchAppUsers,
  fetchUsersStats,
  UsersStatsPayload,
} from "@/lib/actions";
import type { SubscriptionPlanRow } from "@/types";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { BiSearch } from "react-icons/bi";
import { FiFilter } from "react-icons/fi";
import { PiStarFour, PiUsersThree } from "react-icons/pi";

const PAGE_SIZE = 10;

function formatDdMmYy(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

function humanizePlanToken(v: string | null | undefined): string {
  if (v == null || v === "") return "";
  return String(v).replace(/_/g, " ");
}

function formatPlanSummary(row: AppUserRow): string {
  if (row.authUserMissing) return "Active · no Auth user";
  if (!row.isSubscribed) return "—";
  const s = row.subscriptionInfo;
  if (!s) return "Active";
  const mysqlKind = s.mysqlPlanKind;
  const mysqlTier = s.mysqlPlanTier;
  const mysqlName = s.mysqlPlanName;
  if (mysqlKind || mysqlTier) {
    const bits = [
      humanizePlanToken(mysqlKind),
      humanizePlanToken(mysqlTier ?? undefined),
    ].filter(Boolean);
    if (bits.length) return bits.join(" · ");
  }
  if (mysqlName) return mysqlName;
  const fsParts = [s.planKind, s.familyTier, s.role].filter(Boolean);
  if (fsParts.length) return fsParts.map(humanizePlanToken).join(" · ");
  return "Active";
}

type SubscriptionFilter = "all" | "subscribed" | "unsubscribed";

const UsersPage = () => {
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const canManageSubs = perms.includes("admin:manage_subscribers");

  const [stats, setStats] = useState<UsersStatsPayload | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<SubscriptionFilter>("all");
  const [loadingStats, setLoadingStats] = useState(true);

  const [page, setPage] = useState(1);
  const [rowsByPage, setRowsByPage] = useState<Record<number, AppUserRow[]>>({});
  const [nextTokenAfterPage, setNextTokenAfterPage] = useState<
    Record<number, string | null>
  >({});
  const [queryEpoch, setQueryEpoch] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [subscriberIdentifier, setSubscriberIdentifier] = useState("");
  const [subscriberPlanId, setSubscriberPlanId] = useState<number | null>(null);
  const [subscriberExpiresAt, setSubscriberExpiresAt] = useState("");
  const [subscriberPlans, setSubscriberPlans] = useState<SubscriptionPlanRow[]>([]);
  const [loadingSubscriberPlans, setLoadingSubscriberPlans] = useState(false);
  const [submittingSubscriber, setSubmittingSubscriber] = useState(false);

  const rowsRef = useRef(rowsByPage);
  const tokensRef = useRef(nextTokenAfterPage);
  rowsRef.current = rowsByPage;
  tokensRef.current = nextTokenAfterPage;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const isEmailMode = search.includes("@");
  const emailQuery = useMemo(() => {
    if (!debouncedSearch.includes("@")) return undefined;
    const t = debouncedSearch.trim();
    return t.length ? t : undefined;
  }, [debouncedSearch]);

  const totalItemsForBar = useMemo(() => {
    if (!stats) return 0;
    const reg = stats.firebaseRegisteredUsers ?? 0;
    const sub = stats.activeSubscribers ?? 0;
    if (filter === "subscribed") return sub;
    if (filter === "unsubscribed") return Math.max(0, reg - sub);
    return reg;
  }, [stats, filter]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetchUsersStats();
      setStats(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load stats");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const resetListPagination = useCallback(() => {
    setPage(1);
    setRowsByPage({});
    setNextTokenAfterPage({});
    setQueryEpoch((v) => v + 1);
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    resetListPagination();
  }, [filter, resetListPagination]);

  useEffect(() => {
    resetListPagination();
  }, [isEmailMode, resetListPagination]);

  useEffect(() => {
    if (!isEmailMode || !emailQuery) return;
    let cancelled = false;
    setLoadingUsers(true);
    (async () => {
      try {
        const res = await fetchAppUsers({
          pageSize: PAGE_SIZE,
          pageToken: null,
          email: emailQuery,
          subscription: filter,
        });
        if (cancelled) return;
        setRowsByPage({ 1: res?.users ?? [] });
        setNextTokenAfterPage({ 1: null });
        setPage(1);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Could not load users");
          setRowsByPage({ 1: [] });
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [emailQuery, filter, isEmailMode]);

  useEffect(() => {
    if (isEmailMode) return;

    if (rowsRef.current[page] !== undefined) {
      setLoadingUsers(false);
      return;
    }

    let cancelled = false;
    setLoadingUsers(true);
    (async () => {
      try {
        const token = page <= 1 ? null : tokensRef.current[page - 1];
        if (page > 1 && tokensRef.current[page - 1] === undefined) {
          toast.error("Open the previous page first.");
          setLoadingUsers(false);
          return;
        }
        const res = await fetchAppUsers({
          pageSize: PAGE_SIZE,
          pageToken: token,
          subscription: filter,
        });
        if (cancelled) return;
        const rows = res?.users ?? [];
        setRowsByPage((prev) => ({ ...prev, [page]: rows }));
        setNextTokenAfterPage((prev) => ({
          ...prev,
          [page]: res?.nextPageToken ?? null,
        }));
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Could not load users");
          setRowsByPage((prev) => ({ ...prev, [page]: [] }));
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, filter, isEmailMode, queryEpoch]);

  const currentRows = isEmailMode
    ? rowsByPage[1] ?? []
    : rowsByPage[page] ?? [];

  const onPageChange = (next: number) => {
    if (next < 1) return;
    setPage(next);
  };

  const hasNextPage = Boolean(nextTokenAfterPage[page]);
  const hasPrevPage = page > 1;

  const reloadAfterAction = async () => {
    await loadStats();
    if (search.includes("@") && emailQuery) {
      setLoadingUsers(true);
      try {
        const res = await fetchAppUsers({
          pageSize: PAGE_SIZE,
          pageToken: null,
          email: emailQuery,
          subscription: filter,
        });
        setRowsByPage({ 1: res?.users ?? [] });
        setNextTokenAfterPage({ 1: null });
        setPage(1);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not refresh");
      } finally {
        setLoadingUsers(false);
      }
      return;
    }
    resetListPagination();
    setLoadingUsers(true);
    try {
      const res = await fetchAppUsers({
        pageSize: PAGE_SIZE,
        pageToken: null,
        subscription: filter,
      });
      setRowsByPage({ 1: res?.users ?? [] });
      setNextTokenAfterPage({ 1: res?.nextPageToken ?? null });
      setPage(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not refresh");
    } finally {
      setLoadingUsers(false);
    }
  };

  const onUnsubscribe = async (uid: string) => {
    if (!canManageSubs) return;
    if (!confirm("Remove subscription for this user?")) return;
    setActionUid(uid);
    try {
      await adminUnsubscribeAppUser(uid);
      toast.success("Unsubscribed");
      await reloadAfterAction();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionUid(null);
    }
  };

  const onDelete = async (uid: string) => {
    if (!canManageSubs) return;
    if (
      !confirm(
        "Delete this Firebase user permanently? This cannot be undone."
      )
    )
      return;
    setActionUid(uid);
    try {
      await adminDeleteAppUser(uid);
      toast.success("User deleted");
      await reloadAfterAction();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionUid(null);
    }
  };

  const loadSubscriberPlans = useCallback(async () => {
    if (!canManageSubs) return;
    setLoadingSubscriberPlans(true);
    try {
      const res = await fetchAdminSubscriberPlans();
      const plans = Array.isArray(res?.plans) ? res.plans : [];
      setSubscriberPlans(plans);
      setSubscriberPlanId((prev) => {
        if (prev && plans.some((p) => Number(p.id) === prev)) return prev;
        return plans.length ? Number(plans[0].id) : null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load plans");
      setSubscriberPlans([]);
      setSubscriberPlanId(null);
    } finally {
      setLoadingSubscriberPlans(false);
    }
  }, [canManageSubs]);

  const openSubscribeModal = () => {
    if (!canManageSubs) return;
    setSubscriberIdentifier("");
    setSubscriberExpiresAt("");
    setSubscribeModalOpen(true);
    if (subscriberPlans.length === 0) {
      void loadSubscriberPlans();
    }
  };

  const closeSubscribeModal = () => {
    if (submittingSubscriber) return;
    setSubscribeModalOpen(false);
    setSubscriberIdentifier("");
    setSubscriberExpiresAt("");
  };

  const onAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSubs) return;
    const identifier = subscriberIdentifier.trim();
    if (!identifier) {
      toast.error("Enter existing user email or UID");
      return;
    }
    if (!subscriberPlanId) {
      toast.error("Select a plan");
      return;
    }

    setSubmittingSubscriber(true);
    try {
      const res = await adminAddSubscriber({
        identifier,
        planId: subscriberPlanId,
        expiresAt: subscriberExpiresAt.trim() || null,
      });
      if (res?.outcome === "already_subscribed") {
        toast("User already has an active subscription.");
      } else {
        toast.success("Subscriber added");
      }
      await reloadAfterAction();
      setSubscribeModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add subscriber");
    } finally {
      setSubmittingSubscriber(false);
    }
  };

  const regHint =
    stats?.firebaseRegisteredApproximate === true
      ? "Partial count (huge directory)"
      : "Firebase Auth (same total as Console)";

  const subscribedHint =
    stats?.subscriptionDocumentsTotal != null &&
    stats.subscriptionDocumentsTotal !== stats?.activeSubscribers
      ? `${fmtNum(stats.activeSubscribers)} with status "active" · ${fmtNum(stats.subscriptionDocumentsTotal)} docs in collection`
      : 'Firestore: status == "active"';

  const searchPending = search !== debouncedSearch;
  const emailLookupLoading =
    isEmailMode && (searchPending || (Boolean(emailQuery) && loadingUsers));

  const showTableLoading =
    (!isEmailMode && loadingUsers && currentRows.length === 0) ||
    emailLookupLoading;

  const paginationTotal = Math.max(
    totalItemsForBar,
    (page - 1) * PAGE_SIZE + currentRows.length
  );

  const showPaginationBar =
    !isEmailMode &&
    (currentRows.length > 0 ||
      page > 1 ||
      hasNextPage ||
      (totalItemsForBar > 0 && !loadingStats));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-8 w-full min-w-0 overflow-hidden text-white">
      <Toaster />
      <div className="flex flex-wrap gap-4 shrink-0">
        <StatCard
          label="Registered users"
          value={loadingStats ? "…" : fmtNum(stats?.firebaseRegisteredUsers)}
          hint={regHint}
          icon={<PiUsersThree className="h-10 w-10" />}
        />
        <StatCard
          label="Subscribed users"
          value={loadingStats ? "…" : fmtNum(stats?.activeSubscribers)}
          hint={subscribedHint}
          icon={<PiStarFour className="h-10 w-10" />}
        />
      </div>

      <div className="w-full h-full min-h-0 flex-1 py-2 flex flex-col">
        <Card className="!self-stretch flex w-full flex-col min-h-0 flex-1 h-full">
          <div className="p-6 sm:p-12 w-full h-full min-h-0 overflow-hidden flex flex-col flex-1 gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center w-full shrink-0">
              <span className="relative top-icons flex min-w-0 flex-1 lg:min-w-[min(100%,280px)]">
                <span className="absolute inset-0 flex items-center left-6 w-min pointer-events-none">
                  <BiSearch className="h-5 w-5 text-white/50" />
                </span>
                <input
                  type="search"
                  placeholder="Search by email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="appearance-none bg-transparent w-full min-h-[2.75rem] pl-10 pr-3 py-2.5 rounded-md border border-white/20 text-white placeholder:text-white/40 focus:border-green focus:outline-none cursor-text"
                  autoComplete="off"
                />
              </span>
              <label className="flex items-center gap-2 text-sm text-white/80 shrink-0">
                <FiFilter className="h-5 w-5 text-yellow" aria-hidden />
                <select
                  className="appearance-none bg-transparent min-h-[2.75rem] rounded-md border border-white/20 px-3 py-2.5 text-white capitalize focus:border-green focus:outline-none"
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value as SubscriptionFilter)
                  }
                >
                  <option value="all" className="bg-ca-black text-white">
                    All users
                  </option>
                  <option value="subscribed" className="bg-ca-black text-white">
                    Subscribed
                  </option>
                  <option
                    value="unsubscribed"
                    className="bg-ca-black text-white"
                  >
                    Unsubscribed
                  </option>
                </select>
              </label>
              {canManageSubs ? (
                <button
                  type="button"
                  onClick={openSubscribeModal}
                  className="bg-green text-sm px-4 py-2.5 rounded-md min-h-[2.75rem] shrink-0 hover:opacity-90"
                >
                  Add subscriber
                </button>
              ) : null}
            </div>

            <div className="w-full flex-1 min-h-0 overflow-auto mt-4">
              <table className="py-3 mb-4 table-auto w-full min-w-[880px]">
                <thead className="bg-green sticky top-0 z-[1]">
                  <tr className="text-left text-white">
                    <th className="p-2">Email</th>
                    <th className="p-2">User UID</th>
                    <th className="p-2">Plan</th>
                    <th className="p-2">Date created</th>
                    <th className="p-2">Date subscribed</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showTableLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-white/50">
                        Loading…
                      </td>
                    </tr>
                  ) : currentRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-white/50">
                        {isEmailMode
                          ? "No user with that email."
                          : "No users on this page."}
                      </td>
                    </tr>
                  ) : (
                    currentRows.map((row) => (
                      <tr
                        key={row.uid}
                        className="border-b border-white/10 hover:bg-white/[0.06] transition-colors"
                      >
                        <td className="p-2 max-w-[220px] truncate text-white">
                          {row.email || "—"}
                        </td>
                        <td className="p-2 font-mono text-xs text-white/90 max-w-[200px] truncate">
                          {row.uid}
                        </td>
                        <td className="p-2 text-sm text-white/85 max-w-[180px]">
                          {formatPlanSummary(row)}
                        </td>
                        <td className="p-2 text-white/90">
                          {formatDdMmYy(row.createdAt || row.subscribedAt)}
                        </td>
                        <td className="p-2 text-white/90">
                          {row.isSubscribed
                            ? formatDdMmYy(row.subscribedAt)
                            : "—"}
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {canManageSubs ? (
                            <span className="inline-flex flex-wrap justify-end gap-3">
                              <button
                                type="button"
                                disabled={
                                  actionUid === row.uid || !row.isSubscribed
                                }
                                onClick={() => void onUnsubscribe(row.uid)}
                                className="text-yellow disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
                              >
                                Unsubscribe
                              </button>
                              <button
                                type="button"
                                disabled={actionUid === row.uid}
                                onClick={() => void onDelete(row.uid)}
                                className="text-red disabled:opacity-50 hover:underline"
                              >
                                Delete
                              </button>
                            </span>
                          ) : (
                            <span className="text-white/35 text-xs">
                              No permission
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showPaginationBar ? (
              <PaginationBar
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={paginationTotal}
                onPageChange={onPageChange}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                itemsOnPage={currentRows.length}
                className="mt-4 pt-4 border-t border-white/10 shrink-0"
              />
            ) : null}
          </div>
        </Card>
      </div>
      <Modal
        isOpen={subscribeModalOpen}
        onClose={closeSubscribeModal}
        shellClassName="relative w-[min(520px,calc(100vw-2rem))] h-auto max-w-[min(520px,calc(100vw-2rem))]"
        bodyClassName="modal-content relative bg-black px-10 py-6 sm:px-12 rounded-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg"
        cardClassName="h-auto min-h-0"
      >
        <form onSubmit={onAddSubscriber} className="pt-8 flex flex-col gap-4 text-white">
          <h2 className="text-lg font-semibold">Add subscriber</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Grants an active subscription to an existing app user. If the user already has
            active access, no changes will be made.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">User email or UID</span>
            <input
              type="text"
              autoComplete="off"
              value={subscriberIdentifier}
              onChange={(e) => setSubscriberIdentifier(e.target.value)}
              placeholder="name@example.com or firebase-uid"
              className="input-modal text-sm rounded-lg"
              disabled={submittingSubscriber}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Plan</span>
            <select
              value={subscriberPlanId ?? ""}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSubscriberPlanId(Number.isFinite(next) ? next : null);
              }}
              className="input-modal text-sm rounded-lg"
              disabled={submittingSubscriber || loadingSubscriberPlans}
              required
            >
              {loadingSubscriberPlans ? (
                <option value="">Loading plans…</option>
              ) : subscriberPlans.length === 0 ? (
                <option value="">No active plans</option>
              ) : (
                subscriberPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.currency} {String(plan.amount)})
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Expiration date (optional)</span>
            <input
              type="datetime-local"
              value={subscriberExpiresAt}
              onChange={(e) => setSubscriberExpiresAt(e.target.value)}
              className="input-modal text-sm rounded-lg"
              disabled={submittingSubscriber}
            />
            <span className="text-xs text-white/45">
              Leave empty to default to one year from now.
            </span>
          </label>
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <Button
              type="submit"
              label="Add subscriber"
              className="bg-green text-sm"
              isLoading={submittingSubscriber}
            />
            <Button
              type="button"
              label="Cancel"
              className="bg-ca-grey text-sm"
              onClick={closeSubscribeModal}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
