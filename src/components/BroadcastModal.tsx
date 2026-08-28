"use client";

import React, { useState } from "react";
import {
  Megaphone,
  X,
  Mail,
  Bell,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: {
    id: string;
    title: string;
    currency_code?: string;
  };
  totalAttendees: number;
  hostName: string;
}

export default function BroadcastModal({
  isOpen,
  onClose,
  party,
  totalAttendees,
  hostName,
}: BroadcastModalProps) {
  const supabase = createClient();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [activeView, setActiveView] = useState<"write" | "preview">("write");

  const [isSending, setIsSending] = useState(false);
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please fill out both the subject line and message body.");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccessResult(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke(
        "send-event-broadcast",
        {
          body: {
            partyId: party.id,
            subject: subject.trim(),
            message: message.trim(),
            sendPush,
          },
        }
      );

      if (funcError) throw funcError;
      if (data?.error) throw new Error(data.error);

      setSuccessResult(
        data?.message || `Broadcast delivered to ${totalAttendees} ticket holders!`
      );
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("Broadcast failed:", err);
      setError(err.message || "Failed to send broadcast. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessResult(null);
    setActiveView("write");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-2xl shadow-violet-950/40">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-gradient-to-r from-violet-950/30 to-fuchsia-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-black text-white tracking-tight">
                Event Announcement
              </h2>
              <p className="text-xs text-white/50">
                Broadcast only to ticket holders of <strong className="text-violet-300">{party.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AUDIENCE PILL */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-xs text-violet-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Audience: <strong className="text-white font-bold">{totalAttendees} Ticket Buyers</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-violet-300/80 font-semibold">
              <Mail className="h-3.5 w-3.5" /> Email + {sendPush && <Bell className="h-3.5 w-3.5 ml-1" />} In-App
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6">
          {successResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-heading text-xl font-black text-white">
                Announcement Sent!
              </h3>
              <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                {successResult}
              </p>
              <button
                onClick={handleClose}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-white/10 px-6 py-3 text-xs font-extrabold text-white hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              
              {/* TABS: WRITE vs PREVIEW */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveView("write")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeView === "write"
                      ? "bg-violet-600/20 border border-violet-500/40 text-violet-300"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" /> Compose
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("preview")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeView === "preview"
                      ? "bg-violet-600/20 border border-violet-500/40 text-violet-300"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview Email
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeView === "write" ? (
                <>
                  {/* SUBJECT */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-white/50 mb-1.5">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Important update regarding Potluck in the Park"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      required
                    />
                  </div>

                  {/* MESSAGE */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-white/50 mb-1.5">
                      Announcement Message
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Type your message to all ticket holders here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      required
                    />
                  </div>

                  {/* DELIVERY OPTIONS */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pushCheckbox"
                        checked={sendPush}
                        onChange={(e) => setSendPush(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
                      />
                      <label htmlFor="pushCheckbox" className="text-xs font-semibold text-white/80 cursor-pointer">
                        Also send push notification to app users
                      </label>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                </>
              ) : (
                /* LIVE PREVIEW BOX */
                <div className="rounded-2xl border border-white/10 bg-[#070709] p-5 space-y-3 max-h-80 overflow-y-auto">
                  <div className="border-b border-white/10 pb-3 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
                      Email Preview
                    </span>
                    <h4 className="font-heading text-base font-black text-white">
                      [{party.title}] {subject || "Untitled Announcement"}
                    </h4>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      From: {party.title} via TheScene &lt;tickets@thesceneapp.online&gt;
                    </p>
                  </div>
                  <div className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                    {message || "Your message will appear here..."}
                  </div>
                  <div className="border-t border-white/5 pt-3 text-[10px] text-white/30 text-center">
                    Sent to ticket holders of {party.title} • Powered by TheScene
                  </div>
                </div>
              )}

              {/* ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending || !subject.trim() || !message.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-xs font-extrabold text-white shadow-xl shadow-violet-950/50 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Broadcasting to {totalAttendees} attendees...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Announcement to {totalAttendees} Attendees
                    </>
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
