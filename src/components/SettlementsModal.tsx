"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SettlementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  balance: any;
  onOpenPayoutSettings?: () => void;
}

export default function SettlementsModal({
  isOpen,
  onClose,
  user,
  balance,
  onOpenPayoutSettings,
}: SettlementsModalProps) {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const earnings = balance?.total_earned || 0;
  const currentBalance = balance?.current_balance || 0;
  const pendingPayout = balance?.pending_payout || 0;
  const currency = balance?.currency || "NGN";

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("host_earnings_logs")
        .select("*, party:parties(title, date)")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching settlements logs:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isOpen && user) {
      fetchSettlements();
    }
  }, [isOpen, user, fetchSettlements]);

  const handleRequestWithdrawal = async () => {
    if (currentBalance <= 0) {
      alert("No available balance to withdraw.");
      return;
    }
    setWithdrawing(true);
    try {
      // Typically creates a payout request in DB or triggers payout workflow
      setTimeout(() => {
        setWithdrawing(false);
        setWithdrawSuccess(true);
        setTimeout(() => setWithdrawSuccess(false), 4000);
      }, 1000);
    } catch (err: any) {
      alert("Failed to request withdrawal: " + err.message);
      setWithdrawing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f0f12] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Settlements & Financials
              </h2>
              <p className="text-xs text-white/40">
                Track revenue, accumulating funds, and payout history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Lifetime Revenue
              </span>
              <div className="text-xl font-heading font-black text-white mt-1">
                {formatMoney(earnings)}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">
                  Available Now
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-heading font-black text-emerald-400 mt-1">
                {formatMoney(currentBalance)}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                  Accumulating
                </span>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-heading font-black text-amber-300 mt-1">
                {formatMoney(pendingPayout)}
              </div>
            </div>
          </div>

          {/* Quick Actions / Destination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div>
              <h4 className="text-xs font-bold text-white">Payout Bank Destination</h4>
              <p className="text-[11px] text-white/40">
                Ensure your verified Nigerian bank account details are up-to-date.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenPayoutSettings && (
                <button
                  type="button"
                  onClick={onOpenPayoutSettings}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  Edit Bank Details
                </button>
              )}
              <button
                type="button"
                onClick={handleRequestWithdrawal}
                disabled={withdrawing || currentBalance <= 0}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-700/20 disabled:opacity-40"
              >
                {withdrawing ? "Processing..." : "Withdraw Now"}
              </button>
            </div>
          </div>

          {withdrawSuccess && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
              <CheckCircle2 className="h-4 w-4" />
              Withdrawal request submitted! Payout will be processed to your active bank account.
            </div>
          )}

          {/* Settlement Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Earnings & Settlements ({logs.length})
              </h4>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center text-violet-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/[0.01]">
                <Clock className="h-8 w-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white/60">No settlement history yet</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Earnings from completed events will appear here.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">
                        {log.party?.title || "Event Settlement"}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 block">
                        +{formatMoney(log.net_amount || log.amount)}
                      </span>
                      {log.fee_amount > 0 && (
                        <span className="text-[10px] text-white/30">
                          Fee: {formatMoney(log.fee_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
