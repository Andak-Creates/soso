"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import CreateEventModal from "@/components/CreateEventModal";
import ProfileModal from "@/components/ProfileModal";
import BankAccountModal from "@/components/BankAccountModal";
import SettlementsModal from "@/components/SettlementsModal";
import { getOptimizedImageUrl } from "@/lib/media";
import {
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Ticket,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CreditCard,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";

/** Helper to resolve the best flyer image for an event */
function resolveFlyer(party: any): string {
  if (party.media && party.media.length > 0) {
    const primary =
      party.media.find((m: any) => m.is_primary && m.media_type === "image") ||
      party.media.find((m: any) => m.media_type === "image");
    if (primary?.media_url) {
      const opt = getOptimizedImageUrl(primary.media_url, 600);
      if (opt) return opt;
    }
  }
  if (party.flyer_url) {
    const opt = getOptimizedImageUrl(party.flyer_url, 600);
    if (opt) return opt;
  }
  return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600";
}

export default function GlobalHostHub({
  user,
  profile: initialProfile,
  parties,
  balance,
  totalTicketsSold,
}: any) {
  const [profile, setProfile] = useState(initialProfile);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isSettlementsOpen, setIsSettlementsOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "all" | "live" | "draft" | "ended"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [todayLabel, setTodayLabel] = useState("");

  React.useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  const earnings = balance?.total_earned || 0;
  const currentBalance = balance?.current_balance || 0;
  const pendingPayout = balance?.pending_payout || 0;
  const currency = balance?.currency || "NGN";
  const firstName =
    profile?.full_name?.split(" ")[0] || profile?.username || "Host";

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter parties by activeTab and searchQuery
  const filteredParties = parties.filter((party: any) => {
    const matchesSearch =
      !searchQuery ||
      party.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      party.location?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "all") return true;

    const isPast = party.date && new Date(party.date) < new Date();
    if (activeTab === "ended") return isPast;
    if (activeTab === "live") return party.is_published && !isPast;
    if (activeTab === "draft") return !party.is_published && !isPast;

    return true;
  });

  return (
    <div className="h-screen bg-[#080809] flex flex-col font-body overflow-hidden text-[#F9FAFB]">
      {/* Header */}
      <Header
        organizerName={
          profile?.full_name || profile?.username || "TheScene Host"
        }
        avatarUrl={profile?.avatar_url}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPayoutSettings={() => setIsBankOpen(true)}
      />

      {/* Main Hub Container */}
      <div className="flex-1 w-full overflow-y-auto">
        {/* Inner Content */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-black text-white tracking-tight">
                Welcome,{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
              <div className="text-xs text-white/50 mt-1 flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex gap-2 items-start">
                  <span>{todayLabel}</span>
                  <span>•</span>
                </div>
                <span className="text-emerald-400/90 font-medium">
                  Payouts clear automatically upon event completion
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-700/25"
              >
                <Plus className="h-4 w-4" />
                Create New Event
              </button>
            </div>
          </div>

          {/* OVERVIEW STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lifetime Earnings */}
            <div
              onClick={() => setIsSettlementsOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#131317] to-[#0c0c0e] p-5 shadow-xl transition-all duration-300 hover:border-violet-500/40 hover:-translate-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                  Lifetime Earnings
                </span>
                <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="font-heading text-2xl font-black text-white mt-2 tracking-tight">
                {formatMoney(earnings)}
              </div>
              <div className="text-[11px] font-medium text-violet-400/80 mt-1 flex items-center justify-between">
                <span>Across all events</span>
                <span className="text-[10px] text-white/30 group-hover:text-white/60">View details →</span>
              </div>
            </div>

            {/* Current Balance */}
            <div
              onClick={() => setIsSettlementsOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#131317] to-[#0c0c0e] p-5 shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                  Available to Withdraw
                </span>
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="font-heading text-2xl font-black text-emerald-400 mt-2 tracking-tight">
                {formatMoney(currentBalance)}
              </div>
              <div className="text-[11px] font-medium text-emerald-400/80 mt-1 flex items-center justify-between">
                <span>Ready for settlement</span>
                <span className="text-[10px] text-white/30 group-hover:text-white/60">Withdraw →</span>
              </div>
            </div>

            {/* Accumulating */}
            <div
              onClick={() => setIsSettlementsOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#131317] to-[#0c0c0e] p-5 shadow-xl transition-all duration-300 hover:border-amber-500/40 hover:-translate-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                  Accumulating
                </span>
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 group-hover:scale-110 transition-transform">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="font-heading text-2xl font-black text-amber-300 mt-2 tracking-tight">
                {formatMoney(pendingPayout)}
              </div>
              <div className="text-[11px] font-medium text-amber-400/80 mt-1">
                Pending event clearance
              </div>
            </div>

            {/* Total Tickets Sold */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#131317] to-[#0c0c0e] p-5 shadow-xl transition-all duration-300 hover:border-fuchsia-500/40 hover:-translate-y-1 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                  Total Tickets Sold
                </span>
                <div className="rounded-xl bg-fuchsia-500/10 p-2.5 text-fuchsia-400 group-hover:scale-110 transition-transform">
                  <Ticket className="h-4 w-4" />
                </div>
              </div>
              <div className="font-heading text-2xl font-black text-white mt-2 tracking-tight">
                {totalTicketsSold}
              </div>
              <div className="text-[11px] font-medium text-fuchsia-400/80 mt-1">
                Across {parties.length} events
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS STRIP */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <button
              onClick={() => setIsSettlementsOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white hover:border-violet-500/40 transition-all shadow-sm"
            >
              <CreditCard className="h-3.5 w-3.5 text-violet-400" />
              View Settlements
            </button>

            <button
              onClick={() => setIsBankOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white hover:border-emerald-500/40 transition-all shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Payout Bank Account
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white hover:border-fuchsia-500/40 transition-all shadow-sm"
            >
              <User className="h-3.5 w-3.5 text-fuchsia-400" />
              Account & Host Profile
            </button>
          </div>

          {/* EVENTS SECTION */}
          <div className="space-y-5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-extrabold text-white tracking-tight">
                  My Events
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {parties.filter((p: any) => p.is_published).length} published
                  &nbsp;·&nbsp;{" "}
                  {parties.filter((p: any) => !p.is_published).length} draft
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#111114] px-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition w-full sm:w-56"
                />

                <div className="flex rounded-xl border border-white/10 bg-[#111114] p-1 text-xs font-semibold">
                  {(["all", "live", "draft", "ended"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition ${
                        activeTab === tab
                          ? "bg-violet-600 text-white font-bold shadow-md"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create Card Prompt */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/[0.03] transition-all min-h-[280px]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="font-heading text-sm font-extrabold text-white mt-4">
                  Create New Event
                </div>
                <p className="text-xs text-white/50 max-w-[200px] mt-1 leading-relaxed">
                  Tickets, VVIP tables & concierges live in under 2 minutes.
                </p>
              </div>

              {/* Dynamic Event Cards */}
              {filteredParties.map((party: any) => {
                const sold = party.tickets_sold || 0;
                const total = party.ticket_quantity || 1;
                const percent = Math.min(100, Math.round((sold / total) * 100));

                // Determine event status
                const eventDate = party.date ? new Date(party.date) : null;
                const isPast = eventDate ? eventDate < new Date() : false;
                const isLive = party.is_published && !isPast;

                let statusBadge = {
                  text: "Draft",
                  classes: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                };
                if (isPast) {
                  statusBadge = {
                    text: "Ended",
                    classes: "bg-white/10 text-white/60 border-white/10",
                  };
                } else if (isLive) {
                  statusBadge = {
                    text: "Live & Selling",
                    classes:
                      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  };
                }

                const bgImage = resolveFlyer(party);

                return (
                  <Link
                    href={`/events/${party.id}`}
                    key={party.id}
                    className="block group"
                  >
                    <div className="rounded-2xl border border-white/10 bg-[#0e0e11] overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/30">
                      {/* Card Image Header */}
                      <div
                        className="h-44 bg-cover bg-center relative p-4 flex flex-col justify-between"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(8,8,9,0.3) 0%, rgba(8,8,9,0.85) 100%), url('${bgImage}')`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm ${statusBadge.classes}`}
                          >
                            {statusBadge.text}
                          </span>

                          <div className="flex items-center gap-1 rounded-full bg-black/50 border border-white/10 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur-md group-hover:bg-violet-600 group-hover:border-violet-500 transition-colors">
                            <span>Manage</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>

                        {/* Title & Overlay info inside header */}
                        <div>
                          <h3 className="font-heading text-lg font-black text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
                            {party.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-white/70 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-violet-400" />
                              {eventDate
                                ? eventDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "TBA"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 text-violet-400 shrink-0" />
                              <span className="truncate">
                                {party.location || party.city || "TBA"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Footer */}
                      <div className="p-5 bg-[#0e0e11] space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-white/60">Ticket Sales</span>
                            <span className="text-white font-extrabold">
                              {sold} / {total}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLive
                                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                  : "bg-white/30"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className="text-[11px] font-bold text-white/40">
                            {isLive
                              ? `${percent}% capacity reached`
                              : isPast
                                ? "Event concluded"
                                : "Draft listing"}
                          </div>
                          <div className="font-heading text-sm font-black text-violet-400">
                            {party.ticket_price
                              ? formatMoney(party.ticket_price)
                              : "Free"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        initialProfile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <BankAccountModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        user={user}
      />

      <SettlementsModal
        isOpen={isSettlementsOpen}
        onClose={() => setIsSettlementsOpen(false)}
        user={user}
        balance={balance}
        onOpenPayoutSettings={() => {
          setIsSettlementsOpen(false);
          setIsBankOpen(true);
        }}
      />
    </div>
  );
}
