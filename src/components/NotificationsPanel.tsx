"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  Megaphone,
  Sparkles,
  UserPlus,
  Ticket,
  ShieldCheck,
  X,
  ExternalLink,
  Inbox,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export interface AppNotification {
  id: string;
  user_id?: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

function getNotificationMeta(type: string) {
  switch (type) {
    case "party_comment":
    case "comment_reply":
      return {
        icon: MessageCircle,
        color: "text-violet-400",
        bgColor: "bg-violet-500/10 border-violet-500/20",
        label: "Comment",
      };
    case "party_like":
    case "comment_like":
      return {
        icon: Heart,
        color: "text-rose-400",
        bgColor: "bg-rose-500/10 border-rose-500/20",
        label: "Like",
      };
    case "ticket_purchase":
      return {
        icon: Ticket,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10 border-emerald-500/20",
        label: "Ticket Sale",
      };
    case "party_update":
      return {
        icon: Megaphone,
        color: "text-violet-400",
        bgColor: "bg-violet-500/10 border-violet-500/20",
        label: "Broadcast",
      };
    case "new_party":
      return {
        icon: Sparkles,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10 border-amber-500/20",
        label: "Party",
      };
    case "new_follower":
    case "host_follower":
      return {
        icon: UserPlus,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10 border-cyan-500/20",
        label: "Follower",
      };
    case "verification":
      return {
        icon: ShieldCheck,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10 border-blue-500/20",
        label: "Verification",
      };
    default:
      return {
        icon: Bell,
        color: "text-zinc-400",
        bgColor: "bg-zinc-500/10 border-zinc-500/20",
        label: "Alert",
      };
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function NotificationsPanel({
  userId,
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      if (data) {
        setNotifications(data as AppNotification[]);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications((prev) => {
            // Avoid duplicate insertion
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotif = payload.new as AppNotification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Update unread count callback
  useEffect(() => {
    const unread = notifications.filter((n) => !n.is_read).length;
    onUnreadCountChange?.(unread);
  }, [notifications, onUnreadCountChange]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId || markingAll) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    const partyId = notif.data?.party_id;
    if (partyId) {
      onClose();
      router.push(`/events/${partyId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-[#0f0f12] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Notifications Panel"
      >
        {/* Panel Header */}
        <div className="h-[62px] px-5 flex items-center justify-between border-b border-white/10 bg-[#131316] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="h-4 w-4 text-violet-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-[#131316]" />
              )}
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="text-[11px] font-semibold text-white/60 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-xs text-white/40 font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-[60vh] space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                <Inbox className="h-6 w-6 text-violet-400/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">No notifications yet</p>
                <p className="text-xs text-white/40 max-w-[260px] leading-relaxed">
                  When attendees comment, like, or buy tickets for your events, updates will appear here in real time.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => {
              const meta = getNotificationMeta(notif.type);
              const Icon = meta.icon;
              const hasPartyLink = !!notif.data?.party_id;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative p-4 transition cursor-pointer flex gap-3.5 items-start ${
                    !notif.is_read
                      ? "bg-violet-950/20 hover:bg-violet-950/30"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`shrink-0 h-9 w-9 rounded-xl border flex items-center justify-center ${meta.bgColor}`}
                  >
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !notif.is_read
                            ? "font-bold text-white"
                            : "font-medium text-white/80"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-white/40 shrink-0 font-medium flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 opacity-60" />
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-1.5">
                      {notif.body}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-white/30">
                        {meta.label}
                      </span>
                      {hasPartyLink && (
                        <span className="text-[10px] text-violet-400 font-semibold inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          View Event <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notif.is_read && (
                    <div className="shrink-0 pt-1">
                      <span className="block h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/5 bg-[#131316] text-center">
            <p className="text-[10px] text-white/30 font-medium">
              Real-time updates from TheScene
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
