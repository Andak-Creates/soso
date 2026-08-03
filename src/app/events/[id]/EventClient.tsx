'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import CustomRegistrationBuilder from '@/components/CustomRegistrationBuilder';
import {
  ArrowLeft, LayoutDashboard, DollarSign, Eye, FileText, Users,
  Settings, Copy, CheckCircle2, Edit, Link as LinkIcon, Ticket,
  Check, Shield, Smartphone, Tag, Star, Send, Download, Search,
  RefreshCw, AlertTriangle, Plus, X, ExternalLink, QrCode,
  ChevronRight, Zap, Clock, TrendingUp, PhoneCall,
} from 'lucide-react';
import Link from 'next/link';

type TabType =
  | 'dashboard' | 'revenue' | 'preview' | 'orders' | 'guestlist'
  | 'tables' | 'concierge' | 'doorstaff' | 'onsite' | 'wristbands' | 'settings';

export default function EventClient({ eventId, user, profile, party, tickets, ticketTiers, comments }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffEmail, setStaffEmail] = useState('');

  const eventTitle = party?.title || 'Untitled Event';
  const eventDate = party?.date
    ? new Date(party.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'TBA';
  const eventVenue = party?.location || 'TBA';
  const isLive = party?.is_published ?? false;
  const ticketsSold = tickets?.length || 0;
  const ticketCapacity = party?.ticket_quantity || 0;
  const ticketPrice = party?.ticket_price || 0;

  const PLATFORM_FEE_RATE = 0.05;
  const grossRevenue = ticketsSold * ticketPrice;
  const platformFees = grossRevenue * PLATFORM_FEE_RATE;
  const netRevenue = grossRevenue - platformFees;
  const pendingPayout = netRevenue * 0.3; // approx

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

  const copyEventLink = () => {
    navigator.clipboard.writeText(`https://thesceneapp.online/events/${eventId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navGroups = [
    {
      label: 'Event Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: 'revenue', label: 'Revenue & Financials', icon: <DollarSign className="h-4 w-4" /> },
        { id: 'preview', label: 'Preview Event', icon: <Eye className="h-4 w-4" />, badge: 'Live' },
      ],
    },
    {
      label: 'Ticket Management',
      items: [
        { id: 'orders', label: 'Orders', icon: <FileText className="h-4 w-4" />, count: ticketsSold },
        { id: 'guestlist', label: 'Guest List', icon: <Users className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Guest Experience',
      items: [
        { id: 'tables', label: 'Table Allocations', icon: <Tag className="h-4 w-4" /> },
        { id: 'concierge', label: 'Executive Concierge', icon: <Star className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'doorstaff', label: 'Door Staff', icon: <Shield className="h-4 w-4" /> },
        { id: 'onsite', label: 'Onsite Ticketing', icon: <Smartphone className="h-4 w-4" /> },
        { id: 'wristbands', label: 'Get Wristbands', icon: <PhoneCall className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Settings',
      items: [
        { id: 'settings', label: 'Event Settings', icon: <Settings className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <div className="h-screen bg-[#080809] flex flex-col font-body overflow-hidden">
      <Header organizerName={profile?.full_name || profile?.username || 'Host'} plan="free" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 min-w-[256px] bg-[#0f0f11] border-r border-white/10 flex flex-col overflow-y-auto shrink-0 py-5">
          <div className="px-4 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-violet-600/10 px-3 py-2 text-xs font-bold text-violet-400 hover:bg-violet-600/20 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Events
            </Link>
          </div>

          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest px-6 mb-2">
                  {group.label}
                </div>
                <div className="px-3 space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                        activeTab === item.id
                          ? 'bg-violet-600/20 text-violet-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </div>
                      {'count' in item && item.count !== undefined && (
                        <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                          {item.count}
                        </span>
                      )}
                      {'badge' in item && item.badge && (
                        <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#080809] p-8">
          {/* Page Header (shared) */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-white">{eventTitle}</h1>
              <p className="text-sm text-white/50 mt-1">{eventDate} · {eventVenue}</p>
            </div>
            <div className="flex items-center gap-3">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400">
                  Draft
                </span>
              )}
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition">
                <Edit className="h-3.5 w-3.5" />
                Edit Event
              </button>
              <button
                onClick={copyEventLink}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition shadow-sm"
              >
                {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Gross Revenue</div>
                  <div className="font-heading text-3xl font-extrabold text-white mt-2">{formatMoney(grossRevenue)}</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">↑ 18% this week</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Tickets Sold</div>
                  <div className="font-heading text-3xl font-extrabold text-white mt-2">
                    {ticketsSold} <span className="text-xl font-semibold text-white/40">/ {ticketCapacity}</span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">{ticketCapacity - ticketsSold} tickets remaining</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6 border-l-4 border-l-violet-600 relative overflow-hidden">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Pending Payout</div>
                  <div className="font-heading text-3xl font-extrabold text-violet-400 mt-2">{formatMoney(pendingPayout)}</div>
                  <div className="text-xs text-white/50 mt-1">Disburses tomorrow 06:00 AM</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-base font-extrabold text-white">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-violet-400 hover:text-violet-300 transition">
                      View all →
                    </button>
                  </div>
                  {tickets && tickets.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-white/30">
                          <th className="pb-4 pr-4">Attendee</th>
                          <th className="pb-4 px-4">Ticket</th>
                          <th className="pb-4 px-4">Amount</th>
                          <th className="pb-4 pl-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {tickets.slice(0, 5).map((t: any, i: number) => (
                          <tr key={t.id}>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold">
                                  {(t.buyer_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{t.buyer_name || 'Guest'}</div>
                                  <div className="text-xs text-white/40">{t.buyer_email || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex rounded bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-400">
                                {t.ticket_tier || 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-white">{formatMoney(t.amount_paid || ticketPrice)}</td>
                            <td className="py-4 pl-4 text-white/50 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Ticket className="h-10 w-10 text-white/10 mb-3" />
                      <div className="text-sm font-semibold text-white/40">No orders yet</div>
                      <div className="text-xs text-white/25 mt-1">Orders will appear here once guests purchase tickets.</div>
                    </div>
                  )}
                </div>

                {/* Setup Checklist */}
                <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6 flex flex-col">
                  <h2 className="font-heading text-base font-extrabold text-white mb-6">Setup Checklist</h2>
                  <div className="space-y-3.5 flex-1">
                    {[
                      { done: !!ticketTiers?.length, label: 'Create at least one ticket tier' },
                      { done: !!party?.flyer_url, label: 'Upload event cover image' },
                      { done: !!party?.description, label: 'Add event description' },
                      { done: isLive, label: 'Publish event' },
                      { done: false, label: 'Link door staff via TheScene' },
                    ].map(({ done, label }) => (
                      <div key={label} className={`flex items-center gap-3 ${!done ? 'opacity-50' : ''}`}>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${done ? 'bg-emerald-500/20 text-emerald-400' : 'border-2 border-white/20'}`}>
                          {done && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm font-medium text-white/80">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <div className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold border ${isLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {isLive ? 'Event is Live & Selling' : 'Event is in Draft'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REVENUE TAB ── */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Gross Revenue', val: formatMoney(grossRevenue), sub: 'Total ticket sales', color: 'text-white' },
                  { label: 'Platform Fees (5%)', val: formatMoney(platformFees), sub: 'Deducted by Soso', color: 'text-red-400' },
                  { label: 'Net Revenue', val: formatMoney(netRevenue), sub: 'After fees', color: 'text-emerald-400' },
                  { label: 'Pending Payout', val: formatMoney(pendingPayout), sub: 'Tomorrow 06:00 AM', color: 'text-violet-400' },
                ].map(({ label, val, sub, color }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-[#0f0f11] p-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">{label}</div>
                    <div className={`font-heading text-2xl font-extrabold ${color}`}>{val}</div>
                    <div className="text-xs text-white/40 mt-1">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Settlement History */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-base font-extrabold text-white">Settlement History</h2>
                  <button className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition">
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="h-12 w-12 text-white/10 mb-4" />
                  <div className="text-sm font-semibold text-white/40">No settlements yet</div>
                  <div className="text-xs text-white/25 mt-1">Automatic payouts begin the morning after your first sale.</div>
                </div>
              </div>

              {/* Payout Breakdown */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <h2 className="font-heading text-base font-extrabold text-white mb-5">Payout Breakdown</h2>
                <div className="space-y-3">
                  {ticketTiers && ticketTiers.length > 0 ? ticketTiers.map((tier: any) => (
                    <div key={tier.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-bold text-white">{tier.name}</div>
                        <div className="text-xs text-white/40">{tier.quantity_sold || 0} sold · {formatMoney(tier.price || 0)} each</div>
                      </div>
                      <div className="text-sm font-extrabold text-emerald-400">
                        {formatMoney((tier.quantity_sold || 0) * (tier.price || 0))}
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-white/40 text-center py-8">No ticket tiers found for this event.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PREVIEW TAB ── */}
          {activeTab === 'preview' && (
            <div className="max-w-2xl">
              <div className="rounded-2xl border border-white/10 bg-[#0f0f11] overflow-hidden">
                {/* Event Cover */}
                <div
                  className="h-64 bg-cover bg-center relative"
                  style={{ backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.9) 100%), url('${party?.flyer_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800'}')` }}
                >
                  <div className="absolute bottom-5 left-6 right-6">
                    <h2 className="font-heading text-2xl font-extrabold text-white">{eventTitle}</h2>
                    <p className="text-sm text-white/70 mt-1">{eventDate} · {eventVenue}</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Ticket Tiers */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Ticket Tiers</h3>
                    {ticketTiers && ticketTiers.length > 0 ? (
                      <div className="space-y-2">
                        {ticketTiers.map((tier: any) => (
                          <div key={tier.id} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/5 px-4 py-3">
                            <div>
                              <div className="text-sm font-bold text-white">{tier.name}</div>
                              <div className="text-xs text-white/40">{tier.quantity_available || 0} available</div>
                            </div>
                            <div className="font-heading text-base font-extrabold text-violet-400">{formatMoney(tier.price || 0)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-400 font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        No ticket tiers created yet. Add tiers in Event Settings.
                      </div>
                    )}
                  </div>

                  {/* About */}
                  {party?.description && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">About</h3>
                      <p className="text-sm text-white/60 leading-relaxed">{party.description}</p>
                    </div>
                  )}

                  {/* Live link */}
                  <div className="pt-2 border-t border-white/10">
                    <a
                      href={`https://thesceneapp.online/events/${eventId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View live on TheScene
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0f0f11] pl-8 pr-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet-600 w-64"
                  />
                </div>
                <button className="inline-flex items-center gap-2 text-xs font-bold text-white/60 border border-white/10 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0f0f11] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-white/30">
                      <th className="p-4">Attendee</th>
                      <th className="p-4">Ticket Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets && tickets.length > 0 ? tickets
                      .filter((t: any) =>
                        !searchQuery ||
                        (t.buyer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.buyer_email || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((t: any) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold shrink-0">
                                {(t.buyer_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{t.buyer_name || 'Guest'}</div>
                                <div className="text-xs text-white/40">{t.buyer_email || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex rounded bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-400">
                              {t.ticket_tier || 'General'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-white text-sm">{formatMoney(t.amount_paid || ticketPrice)}</td>
                          <td className="p-4">
                            {t.checked_in ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Checked In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400">
                                <Ticket className="h-3 w-3" /> Confirmed
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-white/50">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      )) : (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <Ticket className="h-10 w-10 text-white/10 mx-auto mb-3" />
                          <div className="text-sm text-white/40">No orders yet</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── GUEST LIST TAB ── */}
          {activeTab === 'guestlist' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Guests', val: ticketsSold, color: 'text-white' },
                  { label: 'Checked In', val: tickets?.filter((t: any) => t.checked_in).length || 0, color: 'text-emerald-400' },
                  { label: 'Pending', val: tickets?.filter((t: any) => !t.checked_in).length || 0, color: 'text-amber-400' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-[#0f0f11] p-5 text-center">
                    <div className={`font-heading text-3xl font-extrabold ${color}`}>{val}</div>
                    <div className="text-xs text-white/40 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0f0f11] overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-heading text-base font-extrabold text-white">Guest Roster</h2>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <QrCode className="h-4 w-4" />
                    QR scanning via TheScene app
                  </div>
                </div>
                {tickets && tickets.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {tickets.map((t: any, i: number) => (
                      <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i % 3 === 0 ? 'bg-violet-500/20 text-violet-400' : i % 3 === 1 ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {(t.buyer_name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{t.buyer_name || 'Guest'}</div>
                            <div className="text-xs text-white/40">{t.ticket_tier || 'General'}</div>
                          </div>
                        </div>
                        <div>
                          {t.checked_in ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                              <Check className="h-3 w-3" /> In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/50">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Users className="h-10 w-10 text-white/10 mb-3" />
                    <div className="text-sm text-white/40">No guests yet</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TABLES TAB ── */}
          {activeTab === 'tables' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-white">VVIP Table Allocations</h2>
                  <p className="text-xs text-white/40 mt-1">Generate unique claim links per table. Guests self-assign seats.</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition">
                  <Plus className="h-3.5 w-3.5" />
                  Add Table
                </button>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0f0f11] py-24 text-center">
                <Tag className="h-12 w-12 text-white/10 mb-4" />
                <div className="text-sm font-semibold text-white/40">No VVIP tables set up yet</div>
                <div className="text-xs text-white/25 mt-1 max-w-xs">
                  Create table sections and generate shareable claim links for your VIP guests.
                </div>
                <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition">
                  <Plus className="h-3.5 w-3.5" />
                  Create First Table
                </button>
              </div>
            </div>
          )}

          {/* ── CONCIERGE TAB ── */}
          {activeTab === 'concierge' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">Executive Concierge</h2>
                <p className="text-xs text-white/40 mt-1">Send personalised VIP passes directly to guest phones via SMS.</p>
              </div>

              {/* Send Form */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <h3 className="text-sm font-bold text-white mb-4">Dispatch a Concierge Pass</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5">Guest Name</label>
                    <input
                      type="text"
                      placeholder="Full name"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+234 xxx xxxx xxxx"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5">Pass Type</label>
                    <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition">
                      <option>VIP Access</option>
                      <option>VVIP Table</option>
                      <option>Backstage</option>
                      <option>Complimentary</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition">
                      <Send className="h-4 w-4" />
                      Send Pass via SMS
                    </button>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <h3 className="text-sm font-bold text-white mb-5">Pass History</h3>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Star className="h-10 w-10 text-white/10 mb-3" />
                  <div className="text-sm text-white/40">No concierge passes sent yet</div>
                </div>
              </div>
            </div>
          )}

          {/* ── DOOR STAFF TAB ── */}
          {activeTab === 'doorstaff' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">Door Staff</h2>
                <p className="text-xs text-white/40 mt-1">
                  Authorise staff via their existing TheScene account. Scanner access is granted automatically and expires after the event.
                </p>
              </div>

              {/* Add Staff */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <h3 className="text-sm font-bold text-white mb-4">Authorise Staff Member</h3>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      placeholder="Search by TheScene email or username..."
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition">
                    <Plus className="h-4 w-4" />
                    Authorise
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  The staff member must have an active TheScene account. They'll be notified instantly.
                </p>
              </div>

              {/* Staff List */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0f0f11] py-20 text-center">
                <Shield className="h-10 w-10 text-white/10 mb-3" />
                <div className="text-sm text-white/40">No door staff authorised yet</div>
                <div className="text-xs text-white/25 mt-1">Authorised staff will appear here with their access status.</div>
              </div>
            </div>
          )}

          {/* ── ONSITE TICKETING TAB ── */}
          {activeTab === 'onsite' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">Onsite Ticketing</h2>
                <p className="text-xs text-white/40 mt-1">Sell tickets at the door via the TheScene app. All transactions are tracked here.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6 flex flex-col items-center text-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-400">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">TheScene Scanner Mode</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Open the TheScene app, go to your event, and tap "Scan Tickets" to activate scanner mode for door staff.
                  </p>
                  <a
                    href="https://thesceneapp.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open TheScene App
                  </a>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                  <h3 className="text-base font-bold text-white mb-4">Onsite Sales Today</h3>
                  <div className="flex flex-col items-center justify-center py-10">
                    <Zap className="h-10 w-10 text-white/10 mb-3" />
                    <div className="text-sm text-white/40">No onsite sales recorded</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── WRISTBANDS TAB ── */}
          {activeTab === 'wristbands' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">Get Wristbands</h2>
                <p className="text-xs text-white/40 mt-1">Order branded wristbands for your event. Minimum order: 100 bands.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-8 flex flex-col items-center text-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-400">
                  <PhoneCall className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">Branded Event Wristbands</h3>
                  <p className="text-sm text-white/40 max-w-md leading-relaxed">
                    Soso can source custom printed wristbands for your event. Contact our team to get a quote and timeline.
                  </p>
                </div>
                <a
                  href="mailto:hello@thesceneapp.online?subject=Wristband Order - Soso"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700 transition"
                >
                  Contact for Quote
                </a>
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-white">Event Settings</h2>
                <p className="text-xs text-white/40 mt-1">Manage event configuration, fees, registration, and visibility.</p>
              </div>

              {/* General Settings */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6 space-y-5">
                <h3 className="text-sm font-bold text-white">General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5">Event Title</label>
                    <input defaultValue={party?.title || ''} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5">Venue / Location</label>
                    <input defaultValue={party?.location || ''} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1.5">Description</label>
                  <textarea rows={4} defaultValue={party?.description || ''} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition resize-none" />
                </div>
              </div>

              {/* Platform Fee Setting */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <h3 className="text-sm font-bold text-white mb-4">Platform Fee</h3>
                <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-4">
                  <div>
                    <div className="text-sm font-bold text-white">Absorb 5% processing fee</div>
                    <div className="text-xs text-white/40 mt-0.5">If enabled, you cover the fee and guests pay face value. If disabled, guests pay price + 5%.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={party?.absorb_fee ?? false} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                  </label>
                </div>
              </div>

              {/* Custom Registration Builder */}
              <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6">
                <h3 className="text-sm font-bold text-white mb-1">Registration Questions</h3>
                <p className="text-xs text-white/40 mb-5">Define what info you collect from guests at checkout.</p>
                <CustomRegistrationBuilder />
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                <h3 className="text-sm font-bold text-red-400 mb-4">Danger Zone</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Delete this event</div>
                    <div className="text-xs text-white/40 mt-0.5">This is permanent and cannot be undone. All orders will be retained.</div>
                  </div>
                  <button className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition">
                    Delete Event
                  </button>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700 transition shadow-sm">
                Save Settings
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
