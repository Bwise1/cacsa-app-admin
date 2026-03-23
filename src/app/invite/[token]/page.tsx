"use client";

import Card from "@/app/_components/Card";
import Button from "@/app/_components/Button";
import {
  acceptAdminInvite,
  checkAdminInviteUsernameAvailable,
} from "@/lib/actions";
import { useRouter, useParams } from "next/navigation";
import React, { FormEvent, useEffect, useRef, useState } from "react";

const fieldClass =
  "input-modal w-full max-w-full rounded-lg text-sm text-white placeholder:text-white/45 caret-white";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const raw = params?.token;
  const token = typeof raw === "string" ? decodeURIComponent(raw) : "";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const usernameCheckSeq = useRef(0);

  useEffect(() => {
    const t = username.trim();
    if (t.length < 2) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const seq = ++usernameCheckSeq.current;
    const id = setTimeout(() => {
      void (async () => {
        try {
          const ok = await checkAdminInviteUsernameAvailable(t);
          if (usernameCheckSeq.current !== seq) return;
          setUsernameStatus(ok ? "available" : "taken");
        } catch {
          if (usernameCheckSeq.current !== seq) return;
          setUsernameStatus("idle");
        }
      })();
    }, 400);
    return () => clearTimeout(id);
  }, [username]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Invalid invitation link.");
      return;
    }
    const u = username.trim();
    if (u.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken. Choose another.");
      return;
    }
    setLoading(true);
    try {
      const available = await checkAdminInviteUsernameAvailable(u);
      if (!available) {
        setError("That username is already taken. Choose another.");
        setUsernameStatus("taken");
        return;
      }
      setUsernameStatus("available");
      await acceptAdminInvite({ token, username: u, password });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setLoading(false);
    }
  };

  const usernameHint = () => {
    const t = username.trim();
    if (t.length < 2) {
      return (
        <p className="text-xs text-white/50">
          At least 2 characters. Must be unique among admin accounts (checked
          against the server).
        </p>
      );
    }
    if (usernameStatus === "checking") {
      return <p className="text-xs text-white/55">Checking username…</p>;
    }
    if (usernameStatus === "available") {
      return <p className="text-xs text-green">Username available</p>;
    }
    if (usernameStatus === "taken") {
      return (
        <p className="text-xs text-red">
          This username is already taken. Choose another.
        </p>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <form onSubmit={onSubmit} className="p-8 flex flex-col gap-4 w-full">
          <h1 className="text-xl font-semibold text-white">Accept admin invite</h1>
          <p className="text-sm text-white/70">
            Choose a username and password for your admin account.
          </p>
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-white/55">Username</span>
            <input
              className={fieldClass}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={2}
            />
            {usernameHint()}
          </label>
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs text-white/55">Password</span>
            <input
              className={fieldClass}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error ? (
            <p className="text-red text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            label={loading ? "Activating…" : "Activate account"}
            className="bg-green w-full flex justify-center items-center min-h-[2.75rem] px-6 font-medium"
            disabled={loading || !token || usernameStatus === "taken"}
          />
        </form>
      </Card>
    </div>
  );
}
