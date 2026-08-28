"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Search,
  Check,
  ShieldCheck,
} from "lucide-react";

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSaved?: () => void;
}

// Major Nigerian Banks supported by Paystack
const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Access Bank (Diamond)", code: "063" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay Digital Services", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Taj Bank", code: "302" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Wema Bank (ALAT)", code: "035" },
  { name: "Zenith Bank", code: "057" },
].sort((a, b) => a.name.localeCompare(b.name));

export function BankAccountModal({
  isOpen,
  onClose,
  user,
  onSaved,
}: BankAccountModalProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  const [searchBankQuery, setSearchBankQuery] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activatingPayout, setActivatingPayout] = useState(false);
  const [payoutActivated, setPayoutActivated] = useState(false);
  const [subaccountError, setSubaccountError] = useState<string | null>(null);

  const fetchBankAccount = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("host_bank_accounts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setExistingId(data.id);
        const bank = NIGERIAN_BANKS.find((b) => b.code === data.bank_code) || {
          name: data.bank_name,
          code: data.bank_code,
        };
        setSelectedBank(bank);
        setAccountNumber(data.account_number || "");
        setAccountName(data.account_name || "");
        setIsResolved(true);
      } else {
        setExistingId(null);
        setSelectedBank(null);
        setAccountNumber("");
        setAccountName("");
        setIsResolved(false);
      }
    } catch (err) {
      console.error("Error fetching host bank account:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchBankAccount();
    }
  }, [isOpen, user, fetchBankAccount]);

  // Live NUBAN resolution whenever 10 digits and a bank are selected
  const resolveNuban = useCallback(async (num: string, bankCode: string) => {
    if (num.length !== 10 || !bankCode) return;

    setIsResolving(true);
    setResolveError(null);
    setIsResolved(false);

    try {
      const res = await fetch("/api/paystack/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_number: num, bank_code: bankCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.resolved) {
        setResolveError(data.error || "Could not verify account name with bank.");
        setAccountName("");
        setIsResolved(false);
      } else {
        setAccountName(data.account_name);
        setIsResolved(true);
        setResolveError(null);
      }
    } catch (err: any) {
      setResolveError("Verification request failed. Please check network connection.");
      setIsResolved(false);
    } finally {
      setIsResolving(false);
    }
  }, []);

  const handleAccountNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(cleaned);
    setIsResolved(false);
    setResolveError(null);

    if (cleaned.length === 10 && selectedBank) {
      resolveNuban(cleaned, selectedBank.code);
    }
  };

  const handleBankSelect = (bank: { name: string; code: string }) => {
    setSelectedBank(bank);
    setShowBankDropdown(false);
    setSearchBankQuery("");
    setIsResolved(false);
    setResolveError(null);

    if (accountNumber.length === 10) {
      resolveNuban(accountNumber, bank.code);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBank || !accountNumber || !accountName) {
      alert("Please ensure bank details are verified before saving.");
      return;
    }

    if (accountNumber.trim().length !== 10) {
      alert("NUBAN Account Number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    setSuccess(false);
    setSubaccountError(null);

    try {
      const bankData = {
        user_id: user.id,
        bank_name: selectedBank.name,
        bank_code: selectedBank.code,
        account_number: accountNumber.trim(),
        account_name: accountName.trim().toUpperCase(),
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let savedId = existingId;

      if (existingId) {
        const { error } = await supabase
          .from("host_bank_accounts")
          .update(bankData)
          .eq("id", existingId);

        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("host_bank_accounts")
          .insert(bankData)
          .select("id")
          .single();

        if (error) throw error;
        savedId = inserted?.id ?? null;
      }

      setSuccess(true);
      if (onSaved) onSaved();

      // Activate Paystack subaccount for automated split payouts
      if (savedId) {
        setActivatingPayout(true);
        setSubaccountError(null);
        try {
          // Call secure Next.js API route to create/update subaccount
          const res = await fetch("/api/paystack/subaccount", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bank_account_id: savedId }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }
          setPayoutActivated(true);
        } catch (fnErr: any) {
          console.warn("Subaccount setup failed:", fnErr.message);
          setSubaccountError(
            "Bank account saved, but automated payout activation failed: " + fnErr.message
          );
        } finally {
          setActivatingPayout(false);
        }
      }

      setTimeout(() => {
        setSuccess(false);
        setPayoutActivated(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      alert("Failed to save bank account: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredBanks = searchBankQuery.trim()
    ? NIGERIAN_BANKS.filter((b) =>
        b.name.toLowerCase().includes(searchBankQuery.toLowerCase())
      )
    : NIGERIAN_BANKS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f0f12] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Payout Bank Account
              </h2>
              <p className="text-xs text-white/40">
                Direct bank settlement destination for ticket revenue
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
          {loading ? (
            <div className="py-12 flex justify-center text-emerald-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Notice */}
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/70 leading-relaxed">
                  Automated payouts clear directly to this account daily via Paystack. Account names are verified in real time against official CBN records (standard 1.5% payment gateway processing fees apply at settlement).
                </p>
              </div>

              {/* Bank Selector */}
              <div className="relative">
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Select Nigerian Bank *
                </label>
                <button
                  type="button"
                  onClick={() => setShowBankDropdown(!showBankDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-left text-white outline-none focus:border-violet-500 transition"
                >
                  <span className={selectedBank ? "text-white font-medium" : "text-white/30"}>
                    {selectedBank ? selectedBank.name : "Select your bank..."}
                  </span>
                  <Building className="h-4 w-4 text-white/40" />
                </button>

                {showBankDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/10 bg-[#16161b] shadow-2xl p-2 z-20 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                      <input
                        type="text"
                        autoFocus
                        value={searchBankQuery}
                        onChange={(e) => setSearchBankQuery(e.target.value)}
                        placeholder="Search banks..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                      {filteredBanks.map((b) => {
                        const isSelected = selectedBank?.code === b.code;
                        return (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => handleBankSelect(b)}
                            className={`w-full flex items-center justify-between p-2.5 text-xs text-left rounded-lg transition ${
                              isSelected
                                ? "bg-violet-600/20 text-violet-300 font-bold"
                                : "text-white/80 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span>{b.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-violet-400" />}
                          </button>
                        );
                      })}
                      {filteredBanks.length === 0 && (
                        <div className="p-3 text-center text-xs text-white/40">
                          No banks found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Account Number (10 digits) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    placeholder="0123456789"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white font-mono placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition tracking-wider pr-10"
                  />
                  {isResolving && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-violet-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Account Name & Verification Status */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Verified Account Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    required
                    value={accountName}
                    placeholder={
                      isResolving
                        ? "Verifying NUBAN with CBN registry..."
                        : selectedBank && accountNumber.length === 10
                        ? "Account name will appear here"
                        : "Enter bank and 10-digit account number"
                    }
                    className={`w-full rounded-xl border px-3.5 py-3 text-sm font-medium tracking-wide transition uppercase ${
                      isResolved
                        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                        : "border-white/10 bg-white/5 text-white/50"
                    } outline-none`}
                  />
                  {isResolved && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                        Verified ✓
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error if NUBAN resolve failed */}
              {resolveError && (
                <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  {resolveError}
                </div>
              )}

              {success && !activatingPayout && !payoutActivated && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  Bank account saved successfully!
                </div>
              )}

              {activatingPayout && (
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 p-3 rounded-xl">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating automated Paystack subaccount...
                </div>
              )}

              {payoutActivated && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  Subaccount activated ✓ — 95% ticket revenue routes automatically to your bank!
                </div>
              )}

              {subaccountError && (
                <div className="flex items-start gap-2 text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {subaccountError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || activatingPayout || !isResolved || !accountName}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : activatingPayout ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Activating Payouts...
                    </>
                  ) : (
                    "Save & Activate Payouts"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default BankAccountModal;
