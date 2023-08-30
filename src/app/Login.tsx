"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use the signIn function from next-auth
    const result = await signIn("credentials", {
      username,
      password,
      // Add any other fields required by your custom signIn function
    });
    console.log("RESULT RESULT RESULT", result);
    if (result?.error) {
      console.error("Login failed:", result.error);
    } else {
      // Handle successful login, e.g., redirect to dashboard
      console.log("Logged IN");
      //   router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-md">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:outline-none focus:border-blue-500"
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:outline-none focus:border-blue-500"
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <button
            className="w-full bg-blue-500 text-white bg-green py-2 rounded-sm hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
            type="submit"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
