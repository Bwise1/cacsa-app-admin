"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import {
  AdminMobileUpdateConfig,
  fetchAdminMobileUpdateConfig,
  updateAdminMobileUpdateConfig,
} from "@/lib/actions";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type UpdateForm = AdminMobileUpdateConfig;

const defaultForm: UpdateForm = {
  enabled: true,
  latest_version: "",
  latest_build: null,
  min_supported_build: null,
  message: "",
  update_url: "",
  ios_url: "",
  android_url: "",
  updated_at: null,
  updated_by: null,
};

export default function AppUpdatePage() {
  const { data: session, status } = useSession();
  const canManage = session?.user?.permissions?.includes("admin:manage_app_update");

  const [form, setForm] = useState<UpdateForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const res = await fetchAdminMobileUpdateConfig();
      if (res?.config) {
        setForm({ ...defaultForm, ...res.config });
      } else {
        setForm(defaultForm);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load config");
      setForm(defaultForm);
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    if (status === "authenticated" && canManage) {
      void load();
    }
  }, [status, canManage, load]);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateAdminMobileUpdateConfig({
        enabled: form.enabled,
        latest_version: form.latest_version.trim(),
        latest_build: form.latest_build == null ? null : Number(form.latest_build),
        min_supported_build:
          form.min_supported_build == null ? null : Number(form.min_supported_build),
        message: form.message.trim(),
        update_url: form.update_url.trim(),
        ios_url: form.ios_url.trim(),
        android_url: form.android_url.trim(),
      });
      toast.success("Update config saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <div className="text-white/60 p-8">Loading…</div>;
  }

  if (!canManage) {
    return (
      <div className="text-white p-8 max-w-md">
        <p className="text-white/80">
          You don&apos;t have access to mobile app update settings. This screen requires
          the <code className="text-green">admin:manage_app_update</code> permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 text-white">
      <Toaster />
      <Card className="w-full min-w-0">
        <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-3xl">
          <h1 className="text-lg font-semibold">Mobile app update prompt</h1>
          <p className="text-sm text-white/60">
            Controls the update popup shown on app launch. Force update triggers when
            user build is below minimum supported build.
          </p>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="rounded border-white/30 text-green focus:ring-green"
              disabled={loading || saving}
            />
            <span className="text-sm text-white/85">Enable update check</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Latest version (e.g. 3.0.7)</span>
              <input
                className="input-modal text-sm rounded-lg"
                value={form.latest_version ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, latest_version: e.target.value }))
                }
                disabled={loading || saving}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Latest build</span>
              <input
                type="number"
                min={0}
                className="input-modal text-sm rounded-lg"
                value={form.latest_build ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    latest_build:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                disabled={loading || saving}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Minimum supported build (force update below this)</span>
            <input
              type="number"
              min={0}
              className="input-modal text-sm rounded-lg max-w-xs"
              value={form.min_supported_build ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  min_supported_build:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              disabled={loading || saving}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Popup message</span>
            <textarea
              rows={3}
              className="input-modal text-sm rounded-lg py-2 px-3"
              value={form.message ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              disabled={loading || saving}
            />
          </label>

          <div className="grid grid-cols-1 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Fallback update URL</span>
              <input
                className="input-modal text-sm rounded-lg"
                value={form.update_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, update_url: e.target.value }))}
                disabled={loading || saving}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">iOS App Store URL</span>
              <input
                className="input-modal text-sm rounded-lg"
                value={form.ios_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ios_url: e.target.value }))}
                disabled={loading || saving}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Android Play Store URL</span>
              <input
                className="input-modal text-sm rounded-lg"
                value={form.android_url ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, android_url: e.target.value }))
                }
                disabled={loading || saving}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              label="Save settings"
              className="bg-green text-sm"
              onClick={() => void onSave()}
              isLoading={saving}
            />
            {form.updated_at ? (
              <span className="text-xs text-white/50">
                Last updated by {form.updated_by || "admin"} at{" "}
                {new Date(form.updated_at).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

