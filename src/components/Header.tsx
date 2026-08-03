"use client";

import React, { useState } from "react";
import { Bell, Heart, LogOut, User } from "lucide-react";
import { SubscriptionPlan } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  organizerName?: string;
  plan?: SubscriptionPlan;
  avatarUrl?: string;
}

export default function Header({
  organizerName = "TheScene Nightlife LLC",
  plan = "free",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="sticky top-0 z-50 flex h-[62px] w-full items-center justify-between border-b border-white/10 bg-[#0f0f11] px-8">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <span className="font-brand text-2xl text-white tracking-widest">
          soso.
        </span>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3.5">
        <span className="text-xs text-white/60">
          <strong className="text-white font-semibold">{organizerName}</strong>
        </span>

        <div className="h-6 w-px bg-white/10" />

        {/* Plan Badge */}
        {plan === "free" ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-orange-400">
            <Heart className="h-2.5 w-2.5 fill-orange-400 text-orange-400" />
            Free Plan
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-violet-400">
            Pro Plan
          </div>
        )}

        <div className="h-6 w-px bg-white/10" />

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-violet-600/20 hover:text-violet-400"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[#0f0f11]" />
        </button>

        {/* User Avatar with Dropdown */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Host Avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10 cursor-pointer hover:ring-violet-500 transition"
          />

          {dropdownOpen && (
            <>
              {/* Invisible overlay to close dropdown */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#111113] p-1.5 shadow-2xl z-50">
                <button
                  onClick={() => alert("Profile view coming soon!")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </button>
                <div className="my-1 h-px w-full bg-white/5" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
