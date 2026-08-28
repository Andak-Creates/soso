"use client";

import React, { useState } from "react";
import { Bell, LogOut, User, Menu, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface HeaderProps {
  organizerName?: string;
  avatarUrl?: string;
  onMenuToggle?: () => void;
  onOpenProfile?: () => void;
  onOpenPayoutSettings?: () => void;
}

export default function Header({
  organizerName = "TheScene Nightlife LLC",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
  onMenuToggle,
  onOpenProfile,
  onOpenPayoutSettings,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="sticky top-0 z-200 flex h-[62px] w-full items-center justify-between border-b border-white/10 bg-[#0f0f11] px-4 md:px-8">
      {/* Brand & Mobile Menu */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-violet-600/20 hover:text-violet-400 mr-1"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="font-brand text-2xl text-white tracking-widest group-hover:opacity-80 transition">
            Bhind.
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
            Host Hub
          </span>
        </Link>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3.5">
        <span className="text-xs text-white/60 hidden sm:inline-block">
          <strong className="text-white font-semibold">{organizerName}</strong>
        </span>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-violet-600/20 hover:text-violet-400"
          aria-label="Notifications"
          onClick={() => alert("No new notifications")}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[#0f0f11]" />
        </button>

        {/* User Avatar with Dropdown */}
        <div className="relative">
          <img
            src={
              avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"
            }
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

              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#111114] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-bold text-white truncate">
                    {organizerName}
                  </p>
                  <p className="text-[10px] text-white/40">Host Account</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5 hover:text-white transition"
                >
                  <User className="h-4 w-4 text-violet-400" />
                  Account & Profile
                </button>

                {onOpenPayoutSettings && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenPayoutSettings();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5 hover:text-white transition"
                  >
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    Payout Bank Account
                  </button>
                )}

                <div className="my-1 h-px w-full bg-white/5" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
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
