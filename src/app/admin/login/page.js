"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagicWand } from "@phosphor-icons/react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin/blog");
    } else {
      setError("Wrong password");
    }
  }

  return (
    <div className="min-h-dvh bg-[#f8f7f4] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center mx-auto mb-3">
            <MagicWand size={16} weight="duotone" className="text-[#c9a96e]" />
          </div>
          <h1 className="text-sm font-semibold text-[#1a1a2e]">Admin Login</h1>
        </div>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30 mb-3"
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-[#1a1a2e] text-white text-xs font-medium hover:bg-[#2a2a4e] transition-all"
        >
          Login
        </button>
      </form>
    </div>
  );
}
