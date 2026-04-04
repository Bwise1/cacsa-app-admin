"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import Modal from "@/app/_components/Modal";
import PaginationBar from "@/app/_components/PaginationBar";
import {
  createAdminSubscriptionPlan,
  deleteAdminStudentVerification,
  fetchAdminSubscriptionPlans,
  fetchStudentVerificationStatus,
  putAdminStudentVerification,
  updateAdminSubscriptionPlan,
} from "@/lib/actions";
import type { SubscriptionPlanRow } from "@/types";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { BiSearch } from "react-icons/bi";
import { PiCreditCard, PiNotePencil, PiPlus } from "react-icons/pi";

const PAGE_SIZE = 10;

const STUDENT_VERIFICATION_KINDS = new Set([
  "individual_student",
  "family_student",
]);

function isStudentVerificationKind(kind: string | undefined | null) {
  return STUDENT_VERIFICATION_KINDS.has(String(kind || "").trim());
}

const INTERVALS = ["annually", "monthly"] as const;
const PLAN_KINDS = [
  "individual",
  "individual_student",
  "family_regular",
  "family_student",
] as const;

type PlanForm = {
  name: string;
  description: string;
  amount: string;
  interval: string;
  currency: string;
  plan_code: string;
  plan_kind: string;
  is_active: boolean;
};

const emptyForm = (): PlanForm => ({
  name: "",
  description: "",
  amount: "",
  interval: "annually",
  currency: "NGN",
  plan_code: "",
  plan_kind: "individual",
  is_active: true,
});

function rowToForm(row: SubscriptionPlanRow): PlanForm {
  return {
    name: row.name ?? "",
    description: row.description ?? "",
    amount: String(row.amount ?? ""),
    interval: row.interval || "annually",
    currency: row.currency || "NGN",
    plan_code: row.plan_code ?? "",
    plan_kind: row.plan_kind || "individual",
    is_active: Boolean(row.is_active === 1 || row.is_active === true),
  };
}

const PlansPage = () => {
  const { data: session, status } = useSession();
  const canManage = session?.user?.permissions?.includes("admin:manage_plans");

  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [verificationMap, setVerificationMap] = useState<
    Record<string, boolean>
  >({});
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [verificationSaving, setVerificationSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const res = await fetchAdminSubscriptionPlans();
      if (res && "plans" in res && Array.isArray(res.plans)) {
        setPlans(res.plans);
        const codes = Array.from(
          new Set(
            res.plans
              .filter(
                (p) =>
                  isStudentVerificationKind(p.plan_kind) &&
                  String(p.plan_code ?? "").trim() !== ""
              )
              .map((p) => String(p.plan_code).trim())
          )
        );
        if (codes.length > 0) {
          const st = await fetchStudentVerificationStatus(codes);
          if (st?.configured && typeof st.configured === "object") {
            setVerificationMap(st.configured);
          } else {
            setVerificationMap({});
          }
        } else {
          setVerificationMap({});
        }
      } else {
        setPlans([]);
        setVerificationMap({});
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load plans");
      setPlans([]);
      setVerificationMap({});
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    if (status === "authenticated" && canManage) void load();
  }, [status, canManage, load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) => {
      const parts = [
        p.name,
        p.description ?? "",
        p.plan_code ?? "",
        p.plan_kind,
        String(p.amount),
        p.currency,
      ];
      return parts.some((s) => String(s).toLowerCase().includes(q));
    });
  }, [plans, searchQuery]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filtered.length / PAGE_SIZE) || 1
    );
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [filtered.length]);

  useEffect(() => {
    if (selectedId === null) return;
    if (!filtered.some((p) => p.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? null,
    [plans, selectedId]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = () => {
    if (selectedId == null || !selectedPlan) return;
    setEditingId(selectedId);
    setForm(rowToForm(selectedPlan));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setVerificationCodeInput("");
  };

  const persistedPlan =
    editingId != null ? plans.find((p) => p.id === editingId) ?? null : null;
  const persistedCode =
    persistedPlan?.plan_code && String(persistedPlan.plan_code).trim() !== ""
      ? String(persistedPlan.plan_code).trim()
      : "";
  const persistedIsStudent =
    persistedPlan != null && isStudentVerificationKind(persistedPlan.plan_kind);
  const formIsStudent = isStudentVerificationKind(form.plan_kind);
  const verificationConfigured =
    persistedCode !== "" ? Boolean(verificationMap[persistedCode]) : false;

  const handleSaveVerification = async () => {
    if (editingId == null) return;
    const code = verificationCodeInput.trim();
    if (!code) {
      toast.error("Enter a verification code");
      return;
    }
    setVerificationSaving(true);
    try {
      await putAdminStudentVerification(editingId, code);
      if (persistedCode) {
        setVerificationMap((m) => ({ ...m, [persistedCode]: true }));
      }
      setVerificationCodeInput("");
      toast.success("Verification code saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save code");
    } finally {
      setVerificationSaving(false);
    }
  };

  const handleRemoveVerification = async () => {
    if (editingId == null) return;
    setVerificationSaving(true);
    try {
      await deleteAdminStudentVerification(editingId);
      if (persistedCode) {
        setVerificationMap((m) => ({ ...m, [persistedCode]: false }));
      }
      toast.success("Verification removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setVerificationSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.amount === "") {
      toast.error("Name and amount are required");
      return;
    }
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      toast.error("Amount must be a valid number");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        amount: amountNum,
        interval: form.interval,
        currency: form.currency.trim() || "NGN",
        plan_code: form.plan_code.trim() || null,
        plan_kind: form.plan_kind,
        is_active: form.is_active,
      };
      if (editingId != null) {
        await updateAdminSubscriptionPlan(editingId, payload);
        toast.success("Plan updated");
      } else {
        await createAdminSubscriptionPlan(payload);
        toast.success("Plan created");
      }
      closeModal();
      await load();
      setSelectedId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="text-white/60 p-8">Loading…</div>
    );
  }

  if (!canManage) {
    return (
      <div className="text-white p-8 max-w-md">
        <p className="text-white/80">
          You don&apos;t have access to subscription plans. This screen requires
          the <code className="text-green">admin:manage_plans</code> permission
          (typically super admin). Sign out and back in after your role is
          updated.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 w-full overflow-hidden text-white">
      <Toaster />
      <div className="flex flex-wrap gap-4">
        <Card>
          <div className="w-[190px] h-[137px] flex flex-row text-3xl items-center justify-center gap-5">
            <span className="text-yellow">
              <PiCreditCard className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>{loading ? "…" : plans.length}</span>
              <span className="text-base font-medium">Plans</span>
            </span>
          </div>
        </Card>
        <Card>
          <div className="w-[190px] h-[137px] flex flex-row text-3xl items-center justify-center gap-5">
            <span className="text-yellow">
              <PiCreditCard className="h-10 w-10" />
            </span>
            <span className="flex flex-col text-4xl font-semibold">
              <span>
                {loading
                  ? "…"
                  : plans.filter((p) => p.is_active === 1 || p.is_active === true)
                      .length}
              </span>
              <span className="text-base font-medium">Active</span>
            </span>
          </div>
        </Card>
      </div>

      <div className="w-full min-h-0 flex-1 py-2">
        <Card>
          <div className="p-6 sm:p-12 w-full flex flex-col gap-4 min-h-0">
            <h1 className="text-lg font-medium text-white">Subscription plans</h1>
            <p className="text-sm text-white/50 -mt-1">
              Amounts and plan codes are used by the app and Paystack checkout.
              Inactive plans are hidden from new purchases. Student plans store a
              separate verification code in Firestore (edit plan to manage).
            </p>

            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center w-full">
              <span className="relative top-icons flex min-w-0 flex-1 lg:min-w-[min(100%,280px)]">
                <span className="absolute inset-0 flex items-center left-6 w-min pointer-events-none">
                  <BiSearch className="h-5 w-5" />
                </span>
                <input
                  type="search"
                  placeholder="Search name, code, kind, amount…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="appearance-none bg-transparent w-full min-h-[2.75rem] pl-10 pr-3 py-2.5 rounded-md border border-white/20 focus:border-green focus:outline-none cursor-text"
                  autoComplete="off"
                />
              </span>

              <button
                type="button"
                onClick={openCreate}
                className="bg-green text-sm flex items-center gap-2 px-4 py-2 rounded-md shrink-0 text-white"
              >
                <PiPlus className="h-5 w-5" />
                Add plan
              </button>
              <button
                type="button"
                onClick={openEdit}
                disabled={selectedId === null}
                title={
                  selectedId === null
                    ? "Select a plan in the table"
                    : "Edit selected plan"
                }
                className={`text-sm flex items-center gap-2 px-4 py-2 rounded-md shrink-0 ${
                  selectedId === null
                    ? "bg-ca-grey opacity-40 cursor-not-allowed"
                    : "bg-ca-grey hover:bg-green cursor-pointer"
                }`}
              >
                <PiNotePencil className="h-5 w-5" />
                Edit
              </button>
            </div>

            <div className="w-full overflow-x-auto mt-4">
              <table className="py-3 mb-4 table-auto w-full min-w-[720px]">
                <thead className="bg-green">
                  <tr className="text-left">
                    <th className="p-2">Name</th>
                    <th className="p-2">Code</th>
                    <th className="p-2">Kind</th>
                    <th className="p-2">Amount (NGN)</th>
                    <th className="p-2">Interval</th>
                    <th className="p-2">Verification</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-white/50">
                        Loading…
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-white/50">
                        No plans match.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => {
                      const active = p.is_active === 1 || p.is_active === true;
                      const pc = String(p.plan_code ?? "").trim();
                      const isStudent = isStudentVerificationKind(p.plan_kind);
                      let verificationCell: React.ReactNode = "—";
                      if (isStudent) {
                        if (!pc) {
                          verificationCell = (
                            <span className="text-white/40 text-xs">No code</span>
                          );
                        } else if (verificationMap[pc]) {
                          verificationCell = (
                            <span className="text-green text-sm">Set</span>
                          );
                        } else {
                          verificationCell = (
                            <span className="text-amber-200/90 text-sm">Not set</span>
                          );
                        }
                      }
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedId(p.id)}
                          className={`cursor-pointer select-none transition-colors duration-150 ease-out ${
                            selectedId === p.id
                              ? "bg-green/15 border-l-4 border-green shadow-[inset_0_0_0_1px_rgba(0,165,81,0.35)]"
                              : "border-l-4 border-transparent hover:bg-white/[0.06]"
                          }`}
                        >
                          <td className="p-2 font-medium max-w-[200px] truncate">
                            {p.name}
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {p.plan_code ?? "—"}
                          </td>
                          <td className="p-2 text-sm">{p.plan_kind}</td>
                          <td className="p-2 tabular-nums">{String(p.amount)}</td>
                          <td className="p-2">{p.interval}</td>
                          <td className="p-2 text-sm">{verificationCell}</td>
                          <td className="p-2">
                            <span
                              className={
                                active
                                  ? "text-green text-sm"
                                  : "text-white/40 text-sm"
                              }
                            >
                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              className="mt-4 pt-4 border-t border-white/10"
            />
          </div>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        shellClassName="relative w-[min(520px,calc(100vw-2rem))] h-auto max-w-[min(520px,calc(100vw-2rem))]"
        bodyClassName="modal-content relative bg-black px-14 py-6 sm:px-16 md:px-20 rounded-lg max-h-[calc(100vh-4rem)] overflow-y-auto shadow-lg"
        cardClassName="h-auto min-h-0"
      >
        <form onSubmit={handleSubmit} className="pt-8 flex flex-col gap-4 text-white">
          <h2 className="text-lg font-semibold">
            {editingId != null ? "Edit plan" : "New plan"}
          </h2>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Name</span>
            <input
              className="input-modal text-sm rounded-lg"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Description</span>
            <textarea
              className="input-modal min-h-[80px] py-2 px-4 text-sm rounded-lg resize-y"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Amount (NGN)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input-modal text-sm rounded-lg"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Currency</span>
              <input
                className="input-modal text-sm rounded-lg"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Billing interval</span>
              <select
                className="input-modal text-sm rounded-lg"
                value={form.interval}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interval: e.target.value }))
                }
              >
                {INTERVALS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Plan kind</span>
              <select
                className="input-modal text-sm rounded-lg"
                value={form.plan_kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plan_kind: e.target.value }))
                }
              >
                {PLAN_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Plan code (unique)</span>
            <input
              className="input-modal text-sm rounded-lg font-mono"
              value={form.plan_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, plan_code: e.target.value }))
              }
              placeholder="e.g. nigeria"
            />
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-white/30 text-green focus:ring-green"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            <span className="text-sm text-white/80">Active (shown in app)</span>
          </label>

          {editingId != null && formIsStudent && (
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/90">
                Student verification (Firestore)
              </h3>
              {!persistedIsStudent || !persistedCode ? (
                <p className="text-xs text-white/50 leading-relaxed">
                  Save this plan with kind <code className="text-white/70">individual_student</code>{" "}
                  or <code className="text-white/70">family_student</code> and a non-empty plan code
                  before setting the verification code.
                </p>
              ) : (
                <>
                  <p className="text-xs text-white/50">
                    Status:{" "}
                    <span
                      className={
                        verificationConfigured ? "text-green" : "text-amber-200/90"
                      }
                    >
                      {verificationConfigured ? "Configured" : "Not configured"}
                    </span>
                  </p>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/50">
                      New verification code (stored securely; not shown again)
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="input-modal text-sm rounded-lg font-mono"
                      value={verificationCodeInput}
                      onChange={(e) => setVerificationCodeInput(e.target.value)}
                      placeholder="Enter code to save"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveVerification()}
                      disabled={
                        verificationSaving || verificationCodeInput.trim() === ""
                      }
                      className={`text-sm px-4 py-2 rounded-md ${
                        verificationSaving || verificationCodeInput.trim() === ""
                          ? "bg-ca-grey opacity-50 cursor-not-allowed"
                          : "bg-green hover:opacity-90 cursor-pointer"
                      } text-white`}
                    >
                      Save verification
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemoveVerification()}
                      disabled={verificationSaving || !verificationConfigured}
                      className={`text-sm px-4 py-2 rounded-md border border-white/20 ${
                        verificationSaving || !verificationConfigured
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-white/10 cursor-pointer"
                      }`}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <Button
              type="submit"
              label={editingId != null ? "Save changes" : "Create plan"}
              className="bg-green text-sm"
              isLoading={saving}
            />
            <Button
              type="button"
              label="Cancel"
              className="bg-ca-grey text-sm"
              onClick={closeModal}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlansPage;
