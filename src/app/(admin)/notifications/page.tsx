"use client";

import Button from "@/app/_components/Button";
import Card from "@/app/_components/Card";
import React, { FormEvent, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { sendBroadcastNotification } from "@/lib/actions";

const NotificationsPage = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setLoading(true);
    try {
      const res = (await sendBroadcastNotification({
        title: title.trim(),
        body: body.trim(),
      })) as {
        sent?: number;
        failed?: number;
        totalTokens?: number;
        message?: string;
      };
      toast.success(
        `Sent: ${res?.sent ?? 0}, failed: ${res?.failed ?? 0}, devices: ${res?.totalTokens ?? 0}`
      );
      if (res?.message) toast(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Broadcast failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 w-full max-w-2xl">
      <Toaster />
      <h1 className="text-2xl font-semibold text-white">Push broadcast</h1>
      <Card>
        <form onSubmit={onSubmit} className="p-8 flex flex-col gap-4 text-white">
          <label className="flex flex-col gap-2">
            <span>Title</span>
            <input
              className="input-backdrop text-black"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span>Message</span>
            <textarea
              className="input-backdrop text-black min-h-[140px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification body"
            />
          </label>
          <Button
            type="submit"
            label={loading ? "Sending…" : "Send broadcast"}
            className="bg-green text-sm w-fit"
            disabled={loading}
          />
        </form>
      </Card>
    </div>
  );
};

export default NotificationsPage;
