"use client";
import React, { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import Logo from "../../public/cacsa.svg";
import Thinktech from "../../public/thinktech.png";
import Image from "next/image";
import Card from "./_components/Card";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use the signIn function from next-auth
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (result?.error) {
        console.log(result.error);
      } else {
        const session = await getSession();
        const perms = session?.user?.permissions ?? [];
        let dest = "/overview";
        if (perms.includes("admin:analytics")) dest = "/overview";
        else if (perms.includes("admin:manage_plans")) dest = "/plans";
        else if (perms.includes("audio:write")) dest = "/audio";
        else if (perms.includes("branch:write")) dest = "/location";
        else if (perms.includes("notifications:send")) dest = "/notifications";
        else if (perms.includes("admin:manage_roles")) dest = "/roles";
        else if (perms.includes("admin:invite")) dest = "/invites";
        else if (perms.includes("user:read")) dest = "/users";
        router.push(dest);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white flex-col items-center px-24 py-12 justify-center">
      <Card>
        <div className="p-8">
          <span className="">Welcome!</span>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                className="input-backdrop"
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div className="mb-4">
              <input
                className="input-backdrop"
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            <button
              className="lg:rounded-lg bg-green flex items-center justify-center lg:h-[54px] lg:w-[434px] w-[280px] h-[30px] lg:mb-4 text-xs lg:text-base mb-2"
              type="submit"
            >
              Log In
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
