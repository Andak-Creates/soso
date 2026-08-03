'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import CreateEventModal from '@/components/CreateEventModal';
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
  Crown,
} from 'lucide-react';
import Link from 'next/link';

export default function GlobalHostHub({ user, profile, parties, balance, totalTicketsSold }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'draft' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const earnings = balance?.total_earned || 0;
  const currentBalance = balance?.current_balance || 0;
  const pendingPayout = balance?.pending_payout || 0;
  const currency = balance?.currency || 'NGN';
  const firstName = profile?.full_name?.split(' ')[0] || profile?.username || 'Host';

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="h-screen bg-black flex flex-col font-body overflow-hidden">
      {/* Header */}
      <Header organizerName={profile?.full_name || profile?.username || 'TheScene Nightlife LLC'} plan="free" />

      {/* Main Hub Container */}
      <div className="flex-1 w-full overflow-y-auto">


        {/* Inner Content */}
        <div className="max-w-7xl mx-auto px-8 py-9 space-y-7">
          {/* Top Bar */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-white leading-tight">
                Good evening, <span className="text-violet-600">{firstName}</span>
              </h1>
              <p className="text-xs text-white/60 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} &nbsp;·&nbsp; Your next payout disburses tomorrow at 06:00 AM.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 font-heading text-xs font-bold text-white hover:bg-violet-700 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create New Event
            </button>
          </div>

          {/* OVERVIEW STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lifetime Earnings */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f0f11] p-5 shadow-sm border-l-4 border-l-violet-600 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Lifetime Earnings
              </div>
              <div className="font-heading text-2xl font-extrabold text-violet-600 mt-1.5">
                {formatMoney(earnings)}
              </div>
              <div className="text-xs text-white/60 mt-1">Across all events</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-violet-50 p-2.5 text-violet-600 opacity-60">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Current Balance */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f0f11] p-5 shadow-sm border-l-4 border-l-emerald-600 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Available to Withdraw
              </div>
              <div className="font-heading text-2xl font-extrabold text-emerald-600 mt-1.5">
                {formatMoney(currentBalance)}
              </div>
              <div className="text-xs text-white/60 mt-1">Ready for settlement</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 p-2.5 text-emerald-600 opacity-60">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {/* Accumulating */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f0f11] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Accumulating
              </div>
              <div className="font-heading text-2xl font-extrabold text-white mt-1.5">
                {formatMoney(pendingPayout)}
              </div>
              <div className="text-xs text-white/60 mt-1">Pending clearance</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2.5 text-white/60 opacity-60">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Total Tickets Sold */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f0f11] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Total Tickets Sold
              </div>
              <div className="font-heading text-2xl font-extrabold text-white mt-1.5">
                {totalTicketsSold}
              </div>
              <div className="text-xs text-white/60 mt-1">Across {parties.length} events</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2.5 text-white/60 opacity-60">
                <Ticket className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS STRIP */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => alert('Opening settlement history...')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f0f11] px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600 transition"
            >
              <CreditCard className="h-3.5 w-3.5 text-white/60" />
              View Settlements
            </button>

            <button
              onClick={() => alert('Opening payout settings...')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f0f11] px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600 transition"
            >
              <TrendingUp className="h-3.5 w-3.5 text-white/60" />
              Payout Settings
            </button>

            <button
              onClick={() => alert('Opening account settings...')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f0f11] px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600 transition"
            >
              <User className="h-3.5 w-3.5 text-white/60" />
              Account & Profile
            </button>

            <button
              onClick={() => alert('Upgrade to Soso Pro')}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-700 shadow-sm hover:bg-orange-100 transition"
            >
              <Crown className="h-3.5 w-3.5 text-orange-700" />
              Upgrade Plan
            </button>
          </div>

          {/* EVENTS SECTION */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">My Events</h2>
                <p className="text-xs text-white/60">2 active &nbsp;·&nbsp; 1 draft</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0f0f11] px-3.5 py-1.5 text-xs text-white outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition w-48"
                />

                <div className="flex rounded-lg border border-white/10 bg-white/10 p-0.5 text-xs font-semibold">
                  {(['all', 'live', 'draft', 'ended'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-md px-3 py-1 capitalize transition ${
                        activeTab === tab
                          ? 'bg-[#0f0f11] text-white shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* EVENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create Card */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-[#0f0f11] p-8 text-center min-h-[290px] cursor-pointer transition hover:border-violet-600 hover:bg-violet-50/30 hover:-translate-y-0.5"
              >
                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:scale-110 transition">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="font-heading text-base font-extrabold text-white mt-3.5">
                  Create New Event
                </div>
                <p className="text-xs text-white/60 max-w-[200px] mt-1 leading-relaxed">
                  Tickets, VVIP tables & concierges live in under 2 minutes.
                </p>
              </div>

              {/* Dynamic Event Cards */}
              {parties.map((party: any) => {
                const sold = party.tickets_sold || 0;
                const total = party.ticket_quantity || 1;
                const percent = Math.round((sold / total) * 100);
                
                // Determine event status
                const eventDate = new Date(party.date);
                const isPast = eventDate < new Date();
                const isLive = party.is_published;
                
                let statusBadge = { text: 'Draft', classes: 'bg-amber-100 text-amber-800' };
                if (isPast) {
                  statusBadge = { text: 'Ended', classes: 'bg-slate-200 text-slate-700' };
                } else if (isLive) {
                  statusBadge = { text: 'Live & Selling', classes: 'bg-emerald-100 text-emerald-800' };
                }

                const bgImage = party.flyer_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600';

                return (
                  <Link href={`/events/${party.id}`} key={party.id} className="block">
                    <div className="group rounded-2xl border border-white/10 bg-[#0f0f11] overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-violet-300">
                      <div
                        className="h-40 bg-cover bg-center relative p-3.5 flex items-start justify-between"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url('${bgImage}')`,
                        }}
                      >
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-extrabold relative z-10 ${statusBadge.classes}`}>
                          {statusBadge.text}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90 relative z-10">
                          <span>Manage</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-heading text-base font-extrabold text-white line-clamp-1 group-hover:text-violet-600 transition">
                          {party.title}
                        </h3>
                        <p className="text-xs text-white/60 mt-1 line-clamp-1">
                          {new Date(party.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} &nbsp;·&nbsp; {party.location || 'TBA'}
                        </p>
                        <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                          <div className={`h-full rounded-full ${isLive ? 'bg-violet-600' : 'bg-slate-300'}`} style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5">
                          <div>
                            <div className="text-xs text-white/60 font-medium">{sold} / {total} {isLive ? 'sold' : 'guests'}</div>
                            {isLive ? (
                              <div className="text-[11px] text-white/40">{percent}% sold through</div>
                            ) : (
                              <div className="text-[11px] font-bold text-orange-700">Free plan: 80 guest cap</div>
                            )}
                          </div>
                          {isLive ? (
                            <div className="font-heading text-sm font-extrabold text-violet-600">
                              {/* Ideally we sum up actual ticket revenue, but for now we multiply sold by price */}
                              {formatMoney(sold * (party.ticket_price || 0))}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-white/40">Unpublished</div>
                          )}
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

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
