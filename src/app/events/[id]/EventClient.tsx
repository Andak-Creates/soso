"use client";
import BroadcastModal from "@/components/BroadcastModal";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import BankAccountModal from "@/components/BankAccountModal";
import CustomRegistrationBuilder from "@/components/CustomRegistrationBuilder";
import UserSearchDropdown from "@/components/UserSearchDropdown";
import { getOptimizedImageUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import {
  ArrowLeft,
  Megaphone,
  LayoutDashboard,
  DollarSign,
  Eye,
  FileText,
  Users,
  Settings,
  Copy,
  CheckCircle2,
  Edit,
  Link as LinkIcon,
  Ticket,
  Check,
  Shield,
  Smartphone,
  Tag,
  Star,
  Send,
  Download,
  Search,
  AlertTriangle,
  Plus,
  X,
  ExternalLink,
  QrCode,
  TrendingUp,
  PhoneCall,
  Building,
  UserPlus,
  Loader2,
  Mail,
  Music,
  Flame,
  Trash2,
  UtensilsCrossed,
  Users2,
  Upload,
} from "lucide-react";
import Link from "next/link";

const AVAILABLE_GENRES = [
  "Afrobeats",
  "Amapiano",
  "Hip-Hop",
  "House / EDM",
  "R&B",
  "Dancehall",
  "Pop",
  "Latin / Reggaeton",
];
const AVAILABLE_VIBES = [
  "High Energy",
  "VIP Lounge",
  "Chill & Cocktail",
  "Beach Party",
  "Rooftop",
  "Underground Rave",
  "Festival",
  "Private Gala",
];
const USHER_PRICE_PER_STAFF = 35000;

type TabType =
  | "dashboard"
  | "revenue"
  | "preview"
  | "tickets"
  | "orders"
  | "guestlist"
  | "tables"
  | "concierge"
  | "doorstaff"
  | "onsiteticket"
  | "wristbands"
  | "settings";

interface Props {
  eventId: string;
  user: any;
  profile: any;
  party: any;
  tickets: any[];
  ticketTiers: any[];
  comments: any[];
  partyMedia: any[];
  hostBalance: any;
  bankAccount: any;
  hostAdmins: any[];
  earningsLogs: any[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

// Unsigned Cloudinary upload helper using shared keys
const uploadToCloudinary = async (
  file: File,
  type: "image" | "video" = "image",
): Promise<{ url: string; thumbnailUrl?: string }> => {
  const url = `https://api.cloudinary.com/v1_1/djfhbkxst/${type}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "parties_app_media");
  formData.append("folder", "party-media");

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Media upload failed");
  }

  const data = await response.json();
  const result: any = {
    url: data.secure_url,
  };

  if (type === "video" || data.resource_type === "video") {
    const urlParts = data.secure_url.split(".");
    urlParts.pop();
    result.thumbnailUrl = `${urlParts.join(".")}.jpg`;
  }

  return result;
};

function resolveFlyer(party: any, partyMedia: any[]): string | null {
  if (partyMedia && partyMedia.length > 0) {
    const primary =
      partyMedia.find((m) => m.is_primary && m.media_type === "image") ||
      partyMedia.find((m) => m.media_type === "image");
    if (primary?.media_url) return getOptimizedImageUrl(primary.media_url, 800);
  }
  if (party?.flyer_url) return getOptimizedImageUrl(party.flyer_url, 800);
  return null;
}

function guestName(t: any): string {
  return (
    t.profiles?.full_name || t.profiles?.username || t.guest_name || "Guest"
  );
}

function guestEmail(t: any): string {
  return t.guest_email || "-";
}

function tierName(t: any, tiers?: any[]): string {
  if (t.ticket_tiers?.name) return t.ticket_tiers.name;
  if (t.tier_name) return t.tier_name;
  if (tiers && tiers.length > 0) {
    const matched = tiers.find((tier: any) => tier.id === t.ticket_tier_id);
    if (matched) return matched.name;
    const price = Number(t.purchase_price) || 0;
    const totalPaid = Number(t.total_paid) || 0;
    const qty = Number(t.quantity_purchased) || Number(t.quantity) || 1;
    const unitPrice = price > 0 ? price / qty : totalPaid / qty;
    const matchedByPrice = tiers.find(
      (tier: any) =>
        tier.price > 0 &&
        (Math.abs(tier.price - unitPrice) < 10 ||
          Math.abs(tier.price - unitPrice / 1.05) < 100)
    );
    if (matchedByPrice) return matchedByPrice.name;
  }
  return "General";
}

export default function EventClient({
  eventId,
  user,
  profile,
  party,
  tickets,
  ticketTiers,
  partyMedia,
  hostBalance,
  bankAccount,
  hostAdmins,
  earningsLogs,
}: Props) {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isPublished, setIsPublished] = useState<boolean>(
    party?.is_published ?? false,
  );
  const [updatingPublish, setUpdatingPublish] = useState(false);

  const [allTiers, setAllTiers] = useState<any[]>(ticketTiers || []);
  // localTickets mirrors the server-rendered tickets prop but also receives
  // concierge inserts in real-time so ticket counts stay accurate without a full reload.
  const [localTickets, setLocalTickets] = useState<any[]>(tickets || []);
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const [newTierForm, setNewTierForm] = useState({
    name: "",
    price: "",
    quantity: "100",
    maxPerOrder: "2",
    description: "",
    tier_type: "ticket" as "ticket" | "table" | "group",
    tableCapacity: "",
    app_only: false,
  });
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [savingTier, setSavingTier] = useState(false);

  const [settingsTitle, setSettingsTitle] = useState<string>(
    party?.title || "",
  );
  const [settingsSlug, setSettingsSlug] = useState<string>(
    party?.slug || "",
  );
  const [settingsLocation, setSettingsLocation] = useState<string>(
    party?.location || "",
  );
  const [settingsDesc, setSettingsDesc] = useState<string>(
    party?.description || "",
  );
  const [settingsAbsorbFee, setSettingsAbsorbFee] = useState<boolean>(
    party?.absorb_fee ?? false,
  );
  const [settingsPrivate, setSettingsPrivate] = useState<boolean>(
    party?.is_private ?? false,
  );
  const [settingsGenres, setSettingsGenres] = useState<string[]>(
    party?.music_genres || ["Afrobeats"],
  );
  const [settingsVibes, setSettingsVibes] = useState<string[]>(
    party?.vibes || ["High Energy"],
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const [doorStaff, setDoorStaff] = useState<any[]>(hostAdmins || []);
  const [addingStaff, setAddingStaff] = useState(false);


  const [conciergeForm, setConciergeForm] = useState({
    guestName: "",
    guestEmail: "",
    tier: ticketTiers?.[0]?.id || "",
    customMessage: "",
  });
  const [sendingPass, setSendingPass] = useState(false);
  const [sentPasses, setSentPasses] = useState<any[]>([]);

  const [usherForm, setUsherForm] = useState({
    expectedGuests: 100,
    staffCount: 4,
    offeredPrice: 35000,
    genderPref: "mixed",
  });
  const [usherRequests, setUsherRequests] = useState<any[]>([]);

  const MIN_USHER_PRICE = 20000;

  const [wristbandProduct, setWristbandProduct] = useState({
    name: "RFID / NFC Cloth Wristbands",
    price: 350,
  });
  const [wristbandQuantity, setWristbandQuantity] = useState(150);
  const [wristbandAddress, setWristbandAddress] = useState("");
  const [wristbandDesignInspo, setWristbandDesignInspo] = useState("");
  const [placingWristbandOrder, setPlacingWristbandOrder] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [currentFlyerUrl, setCurrentFlyerUrl] = useState<string | null>(
    resolveFlyer(party, partyMedia),
  );
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const flyerInputRef = React.useRef<HTMLInputElement>(null);

  // localEarningsLogs mirrors the server-rendered earningsLogs but updates in real-time
  const [localEarningsLogs, setLocalEarningsLogs] = useState<any[]>(earningsLogs || []);

  // Supabase Realtime: auto-update tickets + revenue when Paystack webhook fires
  useEffect(() => {
    const channel = supabase
      .channel(`event-live-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
          filter: `party_id=eq.${eventId}`,
        },
        (payload) => {
          const newTicket = payload.new as any;
          // Only count completed payments
          if (newTicket.payment_status !== "completed") return;
          setLocalTickets((prev) => {
            // Avoid duplicates (idempotency)
            if (prev.some((t) => t.id === newTicket.id)) return prev;
            return [newTicket, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "host_earnings_logs",
          filter: `party_id=eq.${eventId}`,
        },
        (payload) => {
          const newLog = payload.new as any;
          setLocalEarningsLogs((prev) => {
            if (prev.some((l) => l.id === newLog.id)) return prev;
            return [newLog, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, eventId]);

  const eventTitle = party?.title || "Untitled Event";
  const eventDate = party?.date
    ? new Date(party.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBA";
  const eventVenue = party?.location || "TBA";
  const rawEventDate = party?.end_date || party?.date;
  const eventEnd = rawEventDate ? new Date(rawEventDate) : null;
  const isPast = eventEnd ? eventEnd < new Date() : false;
  const isLive = isPublished && !isPast;
  const ticketsSold = localTickets.reduce(
    (s: number, t: any) => s + (Number(t.quantity_purchased) || Number(t.quantity) || 1),
    0,
  );

  const getTierSoldCount = (tId: string) => {
    return localTickets
      .filter((t: any) => t.ticket_tier_id === tId || t.ticket_tiers?.id === tId)
      .reduce(
        (sum: number, t: any) =>
          sum + (Number(t.quantity_purchased) || Number(t.quantity) || 1),
        0
      );
  };
  const ticketCapacity =
    allTiers?.reduce((s: number, t: any) => s + (t.quantity || 0), 0) ||
    party?.ticket_quantity ||
    0;
  const flyerUrl = currentFlyerUrl;
  const eventPublicUrl = party?.slug
    ? `https://thesceneapp.online/${party.slug}`
    : `https://thesceneapp.online/party/${eventId}`;

  // Per-event revenue: accurately computes net host revenue from paid tickets only.
  // Concierge passes are excluded entirely — they are not tracked as revenue.
  const totalRevenue = localTickets.reduce((sum: number, t: any) => {
    // Skip concierge passes entirely
    if ((t.reference || "").toLowerCase().startsWith("concierge_")) return sum;
    const qty = Number(t.quantity_purchased) || Number(t.quantity) || 1;
    if (Number(t.purchase_price) > 0) {
      return sum + Number(t.purchase_price);
    }
    const matchedTier = allTiers.find(
      (tier: any) =>
        tier.id === t.ticket_tier_id ||
        tier.id === t.ticket_tiers?.id ||
        (t.tier_name && tier.name.toLowerCase() === t.tier_name.toLowerCase())
    );
    if (matchedTier && matchedTier.price > 0) {
      return sum + matchedTier.price * qty;
    }
    if (Number(t.total_paid) > 0) {
      return (
        sum +
        (Number(t.total_paid) > 3000
          ? Math.round(Number(t.total_paid) / 1.05)
          : Number(t.total_paid))
      );
    }
    return sum;
  }, 0);
  const pendingPayout = hostBalance?.pending_payout ?? 0;
  const recommendedUshers = Math.max(
    1,
    Math.ceil((usherForm.expectedGuests || 100) / 75),
  );
  const usherTotalCost =
    (usherForm.staffCount || 1) *
    (usherForm.offeredPrice || USHER_PRICE_PER_STAFF);

  const filteredTickets = localTickets.filter((t: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      guestName(t).toLowerCase().includes(q) ||
      guestEmail(t).toLowerCase().includes(q) ||
      tierName(t, allTiers).toLowerCase().includes(q)
    );
  });

  const togglePublishStatus = async () => {
    setUpdatingPublish(true);
    const newStatus = !isPublished;
    try {
      const { error } = await supabase
        .from("parties")
        .update({ is_published: newStatus })
        .eq("id", eventId);
      if (error) throw error;
      setIsPublished(newStatus);
      alert(
        newStatus
          ? "Event is now LIVE on TheScene!"
          : "Event is now back in DRAFT mode.",
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingPublish(false);
    }
  };

  const copyEventLink = () => {
    navigator.clipboard.writeText(eventPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadGuestList = (format: "csv" | "pdf") => {
    if (!localTickets || localTickets.length === 0) {
      alert("No guests found for this event.");
      return;
    }

    const data = localTickets.map((t: any) => ({
      "Guest Name": guestName(t),
      "Email": guestEmail(t),
      "Tier / Table": tierName(t, allTiers),
      "Quantity": t.quantity_purchased || 1,
      "Used": t.quantity_used || 0,
      "Status":
        (t.quantity_used || 0) >= (t.quantity_purchased || 1)
          ? "Fully Checked-In"
          : (t.quantity_used || 0) > 0
            ? "Partially Checked-In"
            : "Valid",
      "Date": t.purchased_at
        ? new Date(t.purchased_at).toLocaleDateString()
        : "-",
    }));

    if (format === "csv") {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${party?.title || "Event"}_GuestList.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      doc.text(`Guest List: ${party?.title || "Event"}`, 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [["Guest Name", "Email", "Tier", "Qty", "Used", "Status"]],
        body: data.map((d) => [
          d["Guest Name"],
          d["Email"],
          d["Tier / Table"],
          d["Quantity"],
          d["Used"],
          d["Status"],
        ]),
      });
      doc.save(`${party?.title || "Event"}_GuestList.pdf`);
    }
  };

  const downloadEventReport = (format: "csv" | "pdf") => {
    const totalTicketsSold = localTickets.reduce(
      (sum: number, t: any) =>
        sum + (Number(t.quantity_purchased) || Number(t.quantity) || 1),
      0
    );
    const totalCheckedIn = localTickets.reduce(
      (sum: number, t: any) => sum + Number(t.quantity_used || 0),
      0
    );

    // Tier breakdown
    const tierData = (allTiers || []).map((tier: any) => {
      const sold = getTierSoldCount(tier.id);
      const capacity = tier.quantity || 0;
      const revenue = sold * (tier.price || 0);
      return {
        Tier: tier.name,
        Type: tier.tier_type === "table" ? "Table" : "Ticket",
        Sold: `${sold} / ${capacity}`,
        Revenue: revenue,
      };
    });

    if (format === "csv") {
      const summaryData = [
        { Metric: "Total Revenue", Value: totalRevenue },
        { Metric: "Total Tickets Sold", Value: totalTicketsSold },
        { Metric: "Total Checked In", Value: totalCheckedIn },
        {},
      ];
      const csvSummary = Papa.unparse(summaryData);
      const csvTiers = Papa.unparse(tierData);
      const blob = new Blob([csvSummary + "\n" + csvTiers], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${party?.title || "Event"}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Event Report: ${party?.title || "Event"}`, 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Total Revenue: ${party?.currency_code || "NGN"} ${totalRevenue.toLocaleString()}`, 14, 30);
      doc.text(`Total Tickets Sold: ${totalTicketsSold}`, 14, 38);
      doc.text(`Total Checked In: ${totalCheckedIn}`, 14, 46);

      autoTable(doc, {
        startY: 55,
        head: [["Tier Name", "Type", "Sold / Capacity", "Revenue"]],
        body: tierData.map(d => [d["Tier"], d["Type"], d["Sold"], `${party?.currency_code || "NGN"} ${d["Revenue"].toLocaleString()}`]),
      });
      doc.save(`${party?.title || "Event"}_Report.pdf`);
    }
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierForm.name || !newTierForm.quantity) return;
    if (newTierForm.tier_type === "table" && !newTierForm.tableCapacity) {
      alert("Please enter the guest capacity per table.");
      return;
    }
    setSavingTier(true);
    try {
      const isTableOrGroup = newTierForm.tier_type === "table" || newTierForm.tier_type === "group";
      const { data, error } = await supabase
        .from("ticket_tiers")
        .insert({
          party_id: eventId,
          name: newTierForm.name,
          price: parseFloat(newTierForm.price) || 0,
          quantity: parseInt(newTierForm.quantity) || (isTableOrGroup ? 1 : 100),
          max_per_order: isTableOrGroup ? 1 : (parseInt(newTierForm.maxPerOrder) || 2),
          description: newTierForm.description || null,
          tier_type: newTierForm.tier_type,
          table_capacity: isTableOrGroup ? (parseInt(newTierForm.tableCapacity) || null) : null,
          is_active: true,
          app_only: newTierForm.app_only ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      setAllTiers((prev) => [...prev, data]);
      setShowAddTierModal(false);
      setNewTierForm({
        name: "",
        price: "",
        quantity: "100",
        maxPerOrder: "2",
        description: "",
        tier_type: "ticket",
        tableCapacity: "",
        app_only: false,
      });
    } catch (err: any) {
      alert(err.message || "Failed to create tier");
    } finally {
      setSavingTier(false);
    }
  };

  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    setSavingTier(true);
    try {
      const isTable = editingTier.tier_type === "table";
      const { data, error } = await supabase
        .from("ticket_tiers")
        .update({
          name: editingTier.name,
          price: parseFloat(editingTier.price) || 0,
          quantity: parseInt(editingTier.quantity) || (isTable ? 1 : 100),
          max_per_order: isTable ? 1 : (parseInt(editingTier.max_per_order) || 2),
          description: editingTier.description || null,
          table_capacity: isTable ? (parseInt(editingTier.table_capacity) || null) : null,
          is_active: editingTier.is_active,
          app_only: editingTier.app_only ?? false,
        })
        .eq("id", editingTier.id)
        .select()
        .single();
      if (error) throw error;
      setAllTiers((prev) =>
        prev.map((t) => (t.id === editingTier.id ? data : t)),
      );
      setEditingTier(null);
    } catch (err: any) {
      alert(err.message || "Failed to update tier");
    } finally {
      setSavingTier(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this ticket tier?")) return;
    try {
      const { error } = await supabase
        .from("ticket_tiers")
        .delete()
        .eq("id", tierId);
      if (error) throw error;
      setAllTiers((prev) => prev.filter((t) => t.id !== tierId));
    } catch (err: any) {
      alert(err.message || "Failed to delete tier");
    }
  };


  const handleAddDoorStaff = useCallback(
    async (selectedUser: any) => {
      if (!selectedUser?.id) return;
      if (doorStaff.some((s) => s.user_id === selectedUser.id)) {
        alert("User is already added as door staff.");
        return;
      }

      setAddingStaff(true);
      try {
        let hostProfileId = party?.host_profile_id;
        if (!hostProfileId) {
          const { data: hp } = await supabase
            .from("host_profiles")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();
          hostProfileId = hp?.id;
        }

        if (!hostProfileId) {
          alert("Host profile missing. Please ensure your profile is set up.");
          return;
        }

        const { data, error } = await supabase
          .from("host_admins")
          .insert({
            host_profile_id: hostProfileId,
            user_id: selectedUser.id,
            role: "scanner",
          })
          .select("*, profiles(*)")
          .single();

        if (error) {
          alert("Failed to authorize staff: " + error.message);
          return;
        }

        await supabase.from("notifications").insert({
          user_id: selectedUser.id,
          title: "You were added as Ticket Scanner",
          body: `You are authorized to scan tickets for ${eventTitle} using TheScene app.`,
          type: "door_staff_assigned",
          data: { party_id: eventId },
        });

        setDoorStaff((prev) => [...prev, { ...data, profiles: selectedUser }]);
        alert(
          `${selectedUser.full_name || selectedUser.username} added as door staff!`,
        );
      } finally {
        setAddingStaff(false);
      }
    },
    [supabase, party, user, doorStaff, eventTitle, eventId],
  );

  const handleRemoveDoorStaff = useCallback(
    async (staffId: string, staffUserId: string) => {
      if (!confirm("Revoke scanning access for this staff member?")) return;
      try {
        await supabase.from("host_admins").delete().eq("id", staffId);
        setDoorStaff((prev) => prev.filter((s) => s.id !== staffId));
      } catch (err: any) {
        alert(err.message || "Failed to remove staff");
      }
    },
    [supabase],
  );

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const cleanSlug = settingsSlug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!cleanSlug) {
        throw new Error("Slug cannot be empty");
      }

      // Check if slug is taken by another event
      const { data: duplicate } = await supabase
        .from("parties")
        .select("id")
        .eq("slug", cleanSlug)
        .neq("id", eventId)
        .maybeSingle();

      if (duplicate) {
        throw new Error("This custom URL slug is already taken by another event.");
      }

      const { error } = await supabase
        .from("parties")
        .update({
          title: settingsTitle,
          slug: cleanSlug,
          location: settingsLocation,
          description: settingsDesc,
          absorb_fee: settingsAbsorbFee,
          is_private: settingsPrivate,
          music_genres: settingsGenres,
          vibes: settingsVibes,
        })
        .eq("id", eventId);

      if (error) throw error;
      setSettingsSlug(cleanSlug);
      alert("Event settings saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFlyerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingFlyer(true);
    try {
      // 1. Upload new flyer to Cloudinary
      const { url } = await uploadToCloudinary(file, "image");

      // 2. Update parties table
      const { error: partyError } = await supabase
        .from("parties")
        .update({ flyer_url: url })
        .eq("id", eventId);

      if (partyError) throw partyError;

      // 3. Keep party_media table updated: mark others non-primary, insert/update this one
      await supabase
        .from("party_media")
        .update({ is_primary: false })
        .eq("party_id", eventId);

      await supabase
        .from("party_media")
        .insert({
          party_id: eventId,
          media_type: "image",
          media_url: url,
          is_primary: true,
          display_order: 0,
        });

      setCurrentFlyerUrl(url);
      alert("Flyer updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to upload new flyer");
    } finally {
      setUploadingFlyer(false);
    }
  };

  const handleSendConciergePass = useCallback(async () => {
    if (!conciergeForm.guestEmail || !conciergeForm.guestName) {
      alert("Please fill in guest name and email.");
      return;
    }
    const selectedTier = allTiers?.find(
      (t: any) => t.id === conciergeForm.tier,
    );
    if (!selectedTier) {
      alert("Please select a ticket tier before sending.");
      return;
    }
    setSendingPass(true);
    try {
      // 1. Insert the ticket with the selected tier's value
      const tierPrice = Number(selectedTier.price) || 0;
      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          party_id: eventId,
          user_id: null,
          purchase_price: 0,
          service_fee: 0,
          total_paid: 0,
          payment_status: "completed",
          guest_email: conciergeForm.guestEmail,
          guest_name: conciergeForm.guestName,
          ticket_tier_id: selectedTier.id,
          quantity_purchased: 1,
          quantity_used: 0,
          reference: `CONCIERGE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        })
        .select()
        .single();

      if (error) {
        alert("Failed to create pass: " + error.message);
        return;
      }

      // 2. Log host earnings entry for record-keeping
      // 2. SKIPPED: We DO NOT insert into host_earnings_logs for concierge

      // 3. Send QR ticket email via Supabase Edge Function
      const { error: emailError } = await supabase.functions.invoke(
        "send-ticket-email",
        {
          body: {
            ticketId: ticket.id,
            partyId: eventId,
            guestEmail: conciergeForm.guestEmail,
            guestName: conciergeForm.guestName,
            partyTitle: eventTitle,
            partyDate: eventDate,
            partyLocation: eventVenue,
            partyCity: party?.city || null,
            tierName: selectedTier.name,
            quantity: 1,
            totalPaid: 0,
            currency: party?.currency_code || "NGN",
            customMessage: conciergeForm.customMessage,
            isConcierge: true,
          },
        },
      );

      if (emailError) {
        console.error("Email send error:", emailError);
        // Don't block — ticket is already issued, email failure is non-fatal
      }

      setSentPasses((prev) => [
        {
          ...ticket,
          guest_name: conciergeForm.guestName,
          guest_email: conciergeForm.guestEmail,
          tier: selectedTier.name,
          sent_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      // Also add to localTickets so ticketsSold + per-tier counts update immediately
      setLocalTickets((prev) => [
        {
          ...ticket,
          guest_name: conciergeForm.guestName,
          guest_email: conciergeForm.guestEmail,
          ticket_tier_id: selectedTier.id,
          quantity_purchased: 1,
        },
        ...prev,
      ]);
      setConciergeForm({
        guestName: "",
        guestEmail: "",
        tier: allTiers?.[0]?.id || "",
        customMessage: "",
      });
      alert(`VIP Pass dispatched to ${conciergeForm.guestEmail}!`);
    } finally {
      setSendingPass(false);
    }
  }, [
    supabase,
    conciergeForm,
    allTiers,
    eventId,
    eventTitle,
    eventDate,
    eventVenue,
    party,
  ]);

  const handlePlaceWristbandOrder = () => {
    if (!wristbandAddress.trim()) {
      alert("Please enter your full delivery address.");
      return;
    }
    setPlacingWristbandOrder(true);

    const subject = encodeURIComponent(`Wristband Inquiry - ${eventTitle}`);
    const body = encodeURIComponent(
      `Event: ${eventTitle}\nEvent ID: ${eventId}\nHost: ${profile?.full_name || profile?.username || "N/A"}\n\n` +
        `Product: ${wristbandProduct.name}\nQuantity: ${wristbandQuantity} units\nUnit Price: ${wristbandProduct.price}\nEstimated Total: ${wristbandQuantity * wristbandProduct.price}\n\n` +
        `Delivery Address: ${wristbandAddress}\n\n` +
        `Design Inspiration / Notes:\n${wristbandDesignInspo || "No design notes provided - please design for us."}\n`,
    );
    window.open(
      `mailto:thesceneappsupport@gmail.com?subject=${subject}&body=${body}`,
      "_blank",
    );

    setTimeout(() => {
      alert(
        "Your wristband inquiry has been prepared. Please send the email that just opened, and our team will get back to you with a design mockup and timeline.",
      );
      setPlacingWristbandOrder(false);
    }, 400);
  };

  const handleRequestUshers = () => {
    if (usherForm.offeredPrice < MIN_USHER_PRICE) {
      alert(
        `Minimum offer per usher is ${fmt(MIN_USHER_PRICE)}. Please increase your offer.`,
      );
      return;
    }
    if (usherForm.staffCount < 1) {
      alert("You need at least 1 usher.");
      return;
    }

    const totalCost = usherForm.staffCount * usherForm.offeredPrice;

    const subject = encodeURIComponent(
      `Usher Staffing Request - ${eventTitle}`,
    );
    const body = encodeURIComponent(
      `Event: ${eventTitle}\nEvent ID: ${eventId}\nEvent Date: ${eventDate}\nVenue: ${eventVenue}\nHost: ${profile?.full_name || profile?.username || "N/A"}\n\n` +
        `Expected Guests: ${usherForm.expectedGuests}\nUshers Requested: ${usherForm.staffCount}\nGender Preference: ${usherForm.genderPref}\n\n` +
        `Offered Price per Usher: ${usherForm.offeredPrice}\nTotal Offered: ${totalCost}\n\n` +
        `Standard Rate: ${USHER_PRICE_PER_STAFF}/usher\nRecommended Staff: ${recommendedUshers} (1 per 75 guests)\n`,
    );
    window.open(
      `mailto:thesceneappsupport@gmail.com?subject=${subject}&body=${body}`,
      "_blank",
    );

    const newReq = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      guests: usherForm.expectedGuests,
      gender: usherForm.genderPref,
      staffCount: usherForm.staffCount,
      offeredPrice: usherForm.offeredPrice,
      cost: totalCost,
      status: "Pending Review",
    };
    setUsherRequests((prev) => [newReq, ...prev]);
    alert(
      `Staffing inquiry sent! An email has been prepared to thesceneappsupport@gmail.com. Please send it, and our team will get back to you.`,
    );
  };

  const handleDeleteEvent = async () => {
    if (
      !confirm(
        "Are you absolutely sure you want to delete this event? This action cannot be undone. All ticket data will be retained for records.",
      )
    )
      return;
    setDeletingEvent(true);
    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
      alert("Event deleted successfully.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message || "Failed to delete event");
      setDeletingEvent(false);
    }
  };

  const navGroups = [
    {
      label: "Event Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: "revenue",
          label: "Revenue & Financials",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          id: "preview",
          label: "Preview Event",
          icon: <Eye className="h-4 w-4" />,
          badge: isLive ? "Live" : undefined,
        },
      ],
    },
    {
      label: "Ticket Management",
      items: [
        {
          id: "tickets",
          label: "Tickets & Tiers",
          icon: <Ticket className="h-4 w-4" />,
          count: allTiers.length,
        },
        {
          id: "orders",
          label: "Orders",
          icon: <FileText className="h-4 w-4" />,
          count: ticketsSold,
        },
        {
          id: "guestlist",
          label: "Guest List",
          icon: <Users className="h-4 w-4" />,
        },
      ],
    },
    {
      label: "Guest Experience",
      items: [
        {
          id: "tables",
          label: "Table Allocations",
          icon: <Tag className="h-4 w-4" />,
        },
        {
          id: "concierge",
          label: "Executive Concierge",
          icon: <Star className="h-4 w-4" />,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          id: "doorstaff",
          label: "Door Staff",
          icon: <Shield className="h-4 w-4" />,
          count: doorStaff.length || undefined,
        },
        {
          id: "onsiteticket",
          label: "Onsite Ticketing",
          icon: <Smartphone className="h-4 w-4" />,
        },
        {
          id: "wristbands",
          label: "Get Wristbands",
          icon: <PhoneCall className="h-4 w-4" />,
        },
        {
          id: "settings",
          label: "Event Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <div className="h-screen bg-[#080809] flex flex-col font-body overflow-hidden selection:bg-violet-500/30">
      <Header
        organizerName={profile?.full_name || profile?.username || "Host"}
        avatarUrl={profile?.avatar_url}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenPayoutSettings={() => setIsBankOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`fixed top-[62px] bottom-0 left-0 z-50 transform transition-transform duration-300 md:static w-64 min-w-[256px] bg-[#0f0f11] border-r border-white/10 flex flex-col overflow-y-auto shrink-0 py-5 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="px-4 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-violet-600/10 border border-violet-500/20 px-3.5 py-2.5 text-xs font-bold text-violet-400 hover:bg-violet-600/20 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
          </div>

          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest px-6 mb-2">
                  {group.label}
                </div>
                <div className="px-3 space-y-0.5">
                  {group.items.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabType);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        activeTab === item.id
                          ? "bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
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

        <main className="flex-1 overflow-y-auto bg-[#080809] p-6 md:p-8 text-[#F9FAFB]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl md:text-3xl font-black text-white tracking-tight">
                  {eventTitle}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                    isPast
                      ? "bg-white/10 border-white/15 text-white/50"
                      : isPublished
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isPast ? "bg-white/40" : isPublished ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
                  />
                  {isPast ? "Ended" : isPublished ? "Live & Selling" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                {eventDate} · {eventVenue}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-600/20 px-4 py-2.5 text-xs font-extrabold text-violet-300 hover:bg-violet-600/30 transition shadow-lg"
              >
                <Megaphone className="h-3.5 w-3.5 text-violet-400" />
                <span>Announcement</span>
              </button>

              <button
                onClick={togglePublishStatus}
                disabled={updatingPublish}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition shadow-lg border ${
                  isPublished
                    ? "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                    : "bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/20"
                }`}
              >
                {updatingPublish ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {updatingPublish
                  ? "Updating..."
                  : isPublished
                    ? "Unpublish Event"
                    : "Publish Live"}
              </button>

              <button
                onClick={copyEventLink}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 hover:border-violet-500/40 transition shadow-sm"
              >
                {copiedLink ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <LinkIcon className="h-3.5 w-3.5 text-violet-400" />
                )}
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex justify-end gap-3 mb-2">
                <button onClick={() => downloadEventReport("csv")} className="text-[11px] font-bold uppercase tracking-wider text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">Export CSV</button>
                <button onClick={() => downloadEventReport("pdf")} className="text-[11px] font-bold uppercase tracking-wider text-theme-purple bg-theme-purple/10 border border-theme-purple/20 px-3 py-1.5 rounded-lg hover:bg-theme-purple/20 transition">Export PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                    Total Revenue
                  </div>
                  <div className="font-heading text-3xl font-black text-white mt-2">
                    {fmt(totalRevenue)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {ticketsSold} tickets sold
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                    Tickets Sold
                  </div>
                  <div className="font-heading text-3xl font-black text-white mt-2">
                    {ticketsSold}{" "}
                    <span className="text-xl font-semibold text-white/40">
                      / {ticketCapacity || "∞"}
                    </span>
                  </div>
                  {ticketCapacity > 0 && (
                    <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (ticketsSold / ticketCapacity) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl border-l-4 border-l-violet-600">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                    Pending Payout
                  </div>
                  <div className="font-heading text-3xl font-black text-violet-400 mt-2">
                    {fmt(pendingPayout)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Clears upon event completion
                  </div>
                </div>
              </div>

              {/* Restore original 2-column Dashboard layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders table */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0e0e11] p-4 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-base font-extrabold text-white">
                      Recent Orders
                    </h2>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 transition"
                    >
                      View all &rarr;
                    </button>
                  </div>
                  {localTickets && localTickets.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <table className="w-full text-left text-xs min-w-[480px]">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-white/30">
                          <th className="pb-4 pr-4">Attendee</th>
                          <th className="pb-4 px-4">Ticket</th>
                          <th className="pb-4 px-4">Amount</th>
                          <th className="pb-4 pl-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {localTickets.slice(0, 5).map((t: any) => (
                          <tr key={t.id}>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold">
                                  {guestName(t).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">
                                    {guestName(t)}
                                  </div>
                                  <div className="text-[10px] text-white/40">
                                    {guestEmail(t)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex rounded bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-400">
                                {tierName(t, allTiers)}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-white text-xs">
                              {(t.reference || "").toLowerCase().startsWith("concierge_") ? (
                                <span className="text-violet-400 font-extrabold uppercase text-[10px] tracking-wide">Concierge</span>
                              ) : fmt(t.total_paid || 0)}
                            </td>
                            <td className="py-4 pl-4 text-white/50 text-xs">
                              {t.purchased_at
                                ? new Date(t.purchased_at).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Ticket className="h-10 w-10 text-white/10 mb-3" />
                      <div className="text-sm font-semibold text-white/40">
                        No orders yet
                      </div>
                      <div className="text-xs text-white/25 mt-1">
                        Orders will appear here once guests purchase tickets.
                      </div>
                    </div>
                  )}
                </div>

                {/* Setup Checklist */}
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl flex flex-col">
                  <h2 className="font-heading text-base font-extrabold text-white mb-6">
                    Setup Checklist
                  </h2>
                  <div className="space-y-3.5 flex-1">
                    {[
                      {
                        done: !!allTiers?.length,
                        label: "Create at least one ticket tier",
                      },
                      {
                        done: !!partyMedia?.length || !!party?.flyer_url,
                        label: "Upload event cover image",
                      },
                      {
                        done: !!party?.description,
                        label: "Add event description",
                      },
                      { done: isLive, label: "Publish event" },
                      {
                        done: doorStaff.length > 0,
                        label: "Link door staff via TheScene",
                      },
                    ].map(({ done, label }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-3 ${!done ? "opacity-40" : ""}`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${done ? "bg-emerald-500/20 text-emerald-400" : "border-2 border-white/20"}`}
                        >
                          {done && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-xs font-semibold text-white/80">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <div
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold border ${isLive ? "bg-[#0a2315] border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
                      />
                      {isLive ? "Event is Live & Selling" : "Event is in Draft"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                    Total Revenue
                  </div>
                  <div className="font-heading text-3xl font-black text-white mt-2">
                    {fmt(totalRevenue)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Gross ticket sales
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl border-l-4 border-l-emerald-600">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                    Total Settled
                  </div>
                  <div className="font-heading text-3xl font-black text-emerald-400 mt-2">
                    {fmt(hostBalance?.total_withdrawn || 0)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Paid out to bank
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl border-l-4 border-l-violet-600">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                    Pending Payout
                  </div>
                  <div className="font-heading text-3xl font-black text-violet-400 mt-2">
                    {fmt(pendingPayout)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Clears after event date
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Payout Bank Account
                </h3>
                {bankAccount ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {bankAccount.bank_name}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {bankAccount.account_number} •{" "}
                        {bankAccount.account_name}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-extrabold text-emerald-300 uppercase">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 flex items-center justify-between">
                    <span>
                      No bank account linked. Add one in Payout Settings to
                      receive funds.
                    </span>
                    <button
                      onClick={() => alert("Opening Payout Settings...")}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
                    >
                      Add Account
                    </button>
                  </div>
                )}
              </div>

              {/* Revenue History Log - Now shows buyer details and ticket tier purchased */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Revenue History ({localTickets.length})
                </h3>
                {localTickets.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0e0e11] overflow-x-auto shadow-xl">
                    <table className="w-full text-left text-xs min-w-[620px]">
                      <thead className="border-b border-white/10 bg-white/5 text-[#8E8D9A]">
                        <tr>
                          <th className="p-4 whitespace-nowrap">Date</th>
                          <th className="p-4 whitespace-nowrap">Buyer / Guest</th>
                          <th className="p-4 whitespace-nowrap">Tier Purchased</th>
                          <th className="p-4 whitespace-nowrap">Gross Amount</th>
                          <th className="p-4 whitespace-nowrap">Net Payout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {localTickets.map((t: any) => (
                          <tr key={t.id} className="hover:bg-white/[0.02]">
                            <td className="p-4 text-white/70">
                              {new Date(
                                t.purchased_at || t.created_at || 0,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="p-4 font-bold text-white">
                              <div>{guestName(t)}</div>
                              <div className="text-[10px] font-normal text-white/40">
                                {guestEmail(t)}
                              </div>
                            </td>
                            <td className="p-4 text-white/70">
                              <span className="inline-flex rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                                {tierName(t, allTiers)}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-white">
                              {(t.reference || "").toLowerCase().startsWith("concierge_") ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  Concierge
                                </span>
                              ) : fmt(t.total_paid || 0)}
                            </td>
                            <td className="p-4 font-bold text-emerald-400">
                              {(t.reference || "").toLowerCase().startsWith("concierge_") ? (
                                <span className="text-white/30 font-normal text-xs">-</span>
                              ) : fmt(
                                Number(t.purchase_price) > 0
                                  ? Number(t.purchase_price)
                                  : (allTiers.find(
                                      (tier: any) =>
                                        tier.id === t.ticket_tier_id ||
                                        tier.id === t.ticket_tiers?.id
                                    )?.price || 0) *
                                      (Number(t.quantity_purchased) || 1) ||
                                    (Number(t.total_paid) > 3000
                                      ? Math.round(Number(t.total_paid) / 1.05)
                                      : Number(t.total_paid) || 0)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-white/10 bg-[#0e0e11] text-xs text-white/40 text-center">
                    No sales history recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-black text-white">
                    Event Preview
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    This is how your event appears on TheScene website and app.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Details
                  </button>
                  <a
                    href={eventPublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Public Link
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0e0e11] overflow-hidden shadow-2xl relative group">
                <input
                  type="file"
                  ref={flyerInputRef}
                  onChange={handleFlyerChange}
                  accept="image/*"
                  className="hidden"
                />
                {flyerUrl ? (
                  <div className="relative h-80 w-full overflow-hidden">
                    <img
                      src={flyerUrl}
                      alt="Flyer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                      <button
                        onClick={() => flyerInputRef.current?.click()}
                        disabled={uploadingFlyer}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg disabled:opacity-50"
                      >
                        {uploadingFlyer ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" /> Replace Flyer Image
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 flex flex-col items-center justify-center text-white/30 gap-3">
                    <span className="font-bold">No Flyer Uploaded</span>
                    <button
                      onClick={() => flyerInputRef.current?.click()}
                      disabled={uploadingFlyer}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg disabled:opacity-50"
                    >
                      {uploadingFlyer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" /> Upload Flyer Image
                        </>
                      )}
                    </button>
                  </div>
                )}
                <div className="p-6 md:p-8 space-y-4">
                  <h1 className="font-heading text-3xl font-black text-white">
                    {eventTitle}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-xs text-white/60">
                    <span>📅 {eventDate}</span>
                    <span>📍 {eventVenue}</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {party?.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-black text-white">
                    Tickets & Pricing Tiers
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Create, update, and manage pricing tiers for your event.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewTierForm({ name: "", price: "", quantity: "100", maxPerOrder: "2", description: "", tier_type: "ticket", tableCapacity: "", app_only: false });
                    setShowAddTierModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  <Ticket className="h-3.5 w-3.5 text-violet-400" /> Add Ticket
                </button>
                <button
                  onClick={() => {
                    setNewTierForm({ name: "", price: "", quantity: "1", maxPerOrder: "1", description: "", tier_type: "table", tableCapacity: "", app_only: false });
                    setShowAddTierModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-4 py-2.5 text-xs font-bold text-violet-300 hover:bg-violet-600/30 transition"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5 text-fuchsia-400" /> Add Table
                </button>
                <button
                  onClick={() => {
                    setNewTierForm({ name: "", price: "", quantity: "1", maxPerOrder: "1", description: "", tier_type: "group", tableCapacity: "4", app_only: false });
                    setShowAddTierModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/30 px-4 py-2.5 text-xs font-bold text-fuchsia-300 hover:bg-fuchsia-600/30 transition"
                >
                  <Users2 className="h-3.5 w-3.5 text-fuchsia-400" /> Group Pass
                </button>
              </div>

              {allTiers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center space-y-2">
                  <Ticket className="h-8 w-8 text-white/20 mx-auto" />
                  <p className="text-sm font-bold text-white/40">No tiers added yet</p>
                  <p className="text-xs text-white/25">Add a ticket tier or table package to get started.</p>
                </div>
              )}

              {allTiers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allTiers.map((tier) => {
                    const isTable = tier.tier_type === "table";
                    return (
                      <div
                        key={tier.id}
                        className={`rounded-2xl border bg-[#0e0e11] p-6 shadow-xl space-y-4 ${
                          tier.tier_type === "table"
                            ? "border-violet-500/30 border-l-[3px] border-l-violet-500"
                            : tier.tier_type === "group"
                            ? "border-fuchsia-500/30 border-l-[3px] border-l-fuchsia-500"
                            : "border-white/10"
                        }`}
                      >
                        {/* Header: name + type badge */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-heading text-base font-black text-white leading-tight">
                            {tier.name}
                          </h3>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                tier.tier_type === "table"
                                  ? "bg-violet-500/20 text-violet-300"
                                  : tier.tier_type === "group"
                                  ? "bg-fuchsia-500/20 text-fuchsia-300"
                                  : "bg-white/10 text-white/50"
                              }`}
                            >
                              {tier.tier_type === "table" ? (
                                <UtensilsCrossed className="h-2.5 w-2.5" />
                              ) : tier.tier_type === "group" ? (
                                <Users2 className="h-2.5 w-2.5" />
                              ) : (
                                <Ticket className="h-2.5 w-2.5" />
                              )}
                              {tier.tier_type === "table" ? "Table" : tier.tier_type === "group" ? "Group" : "Ticket"}
                            </span>
                            {tier.app_only && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/20">
                                App Only
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                tier.is_active
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-white/10 text-white/40"
                              }`}
                            >
                              {tier.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>

                        {/* Table capacity row */}
                        {isTable && tier.table_capacity && (
                          <div className="flex items-center gap-1.5 text-xs text-violet-300/80">
                            <Users2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-semibold">{tier.table_capacity} guests per table</span>
                          </div>
                        )}

                        {tier.description && !isTable && (
                          <p className="text-xs text-white/50 line-clamp-2">{tier.description}</p>
                        )}

                        {/* Price + quantity */}
                        <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-white/40">Price</div>
                            <div className="font-heading text-xl font-black text-violet-400">
                              {tier.price === 0 ? "Free" : fmt(tier.price)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-white/40">
                              {isTable ? "Tables" : "Tickets"}
                            </div>
                            <div className="text-sm font-extrabold text-white">
                              {getTierSoldCount(tier.id)} / {tier.quantity} sold
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                          <button
                            onClick={() => setEditingTier(tier)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                          >
                            <Edit className="h-3.5 w-3.5 text-violet-400" />
                            {isTable ? "Edit Table" : "Edit Tier"}
                          </button>
                          <button
                            onClick={() => handleDeleteTier(tier.id)}
                            className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ADD TIER MODAL */}
              {showAddTierModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                  <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e11] p-6 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <h3 className="font-heading text-xl font-black text-white">
                        {newTierForm.tier_type === "table" ? "Add Table Package" : newTierForm.tier_type === "group" ? "Add Group Pass" : "Add Ticket Tier"}
                      </h3>
                      <button
                        onClick={() => setShowAddTierModal(false)}
                        className="text-white/40 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Type toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-white/10">
                      <button
                        type="button"
                        onClick={() => setNewTierForm({ ...newTierForm, tier_type: "ticket", quantity: "100", tableCapacity: "" })}
                        className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition ${
                          newTierForm.tier_type === "ticket"
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        <Ticket className="h-3.5 w-3.5" /> Ticket Tier
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTierForm({ ...newTierForm, tier_type: "table", quantity: "1", tableCapacity: "", maxPerOrder: "1" })}
                        className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition border-l border-white/10 ${
                          newTierForm.tier_type === "table"
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" /> Table Package
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTierForm({ ...newTierForm, tier_type: "group", quantity: "1", tableCapacity: "4", maxPerOrder: "1" })}
                        className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition border-l border-white/10 ${
                          newTierForm.tier_type === "group"
                            ? "bg-fuchsia-600 text-white"
                            : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        <Users2 className="h-3.5 w-3.5" /> Group Pass
                      </button>
                    </div>

                    <form onSubmit={handleCreateTier} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white/60 mb-1.5">
                          {newTierForm.tier_type === "table" ? "Table Name *" : "Tier Name *"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={newTierForm.tier_type === "table" ? "e.g. VIP Table for 6" : newTierForm.tier_type === "group" ? "e.g. Friends Group Pass" : "e.g. VIP Early Bird"}
                          value={newTierForm.name}
                          onChange={(e) => setNewTierForm({ ...newTierForm, name: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5">
                            Price (₦) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="0 for Free"
                            value={newTierForm.price}
                            onChange={(e) => setNewTierForm({ ...newTierForm, price: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5">
                            {newTierForm.tier_type === "table" ? "Tables Available *" : newTierForm.tier_type === "group" ? "Group Passes Available *" : "Tickets Available *"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={newTierForm.tier_type === "table" ? "e.g. 3" : "e.g. 100"}
                            value={newTierForm.quantity}
                            onChange={(e) => setNewTierForm({ ...newTierForm, quantity: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                      </div>

                      {/* Table-specific: guest capacity */}
                      {(newTierForm.tier_type === "table" || newTierForm.tier_type === "group") && (
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5 flex items-center gap-1.5">
                            <Users2 className="h-3.5 w-3.5 text-violet-400" />
                            {newTierForm.tier_type === "group" ? "People per Group Pass *" : "Guests per Table *"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={newTierForm.tier_type === "group" ? "e.g. 4" : "e.g. 6"}
                            value={newTierForm.tableCapacity}
                            onChange={(e) => setNewTierForm({ ...newTierForm, tableCapacity: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                      )}

                      {/* Ticket-specific: max per order */}
                      {newTierForm.tier_type === "ticket" && (
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5">
                            Max Per Order
                          </label>
                          <input
                            type="text"
                            value={newTierForm.maxPerOrder}
                            onChange={(e) => setNewTierForm({ ...newTierForm, maxPerOrder: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setShowAddTierModal(false)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingTier}
                          className="rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                          {savingTier ? "Saving..." : newTierForm.tier_type === "table" ? "Create Table" : newTierForm.tier_type === "group" ? "Create Group Pass" : "Create Tier"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* EDIT TIER MODAL */}
              {editingTier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                  <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e11] p-6 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        {editingTier.tier_type === "table" ? (
                          <UtensilsCrossed className="h-5 w-5 text-violet-400" />
                        ) : (
                          <Ticket className="h-5 w-5 text-violet-400" />
                        )}
                        <h3 className="font-heading text-xl font-black text-white">
                          {editingTier.tier_type === "table" ? "Edit Table Package" : "Edit Ticket Tier"}
                        </h3>
                      </div>
                      <button
                        onClick={() => setEditingTier(null)}
                        className="text-white/40 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateTier} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white/60 mb-1.5">
                          {editingTier.tier_type === "table" ? "Table Name *" : "Tier Name *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={editingTier.name}
                          onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5">
                            Price (₦) *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingTier.price}
                            onChange={(e) => setEditingTier({ ...editingTier, price: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5">
                            {editingTier.tier_type === "table" ? "Tables Available *" : "Tickets Available *"}
                          </label>
                          <input
                            type="text"
                            required
                            value={editingTier.quantity}
                            onChange={(e) => setEditingTier({ ...editingTier, quantity: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                      </div>

                      {/* Table-specific: guest capacity */}
                      {editingTier.tier_type === "table" && (
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5 flex items-center gap-1.5">
                            <Users2 className="h-3.5 w-3.5 text-violet-400" />
                            Guests per Table *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 6"
                            value={editingTier.table_capacity ?? ""}
                            onChange={(e) => setEditingTier({ ...editingTier, table_capacity: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                      )}

                      {/* Ticket-specific: max per order */}
                      {editingTier.tier_type !== "table" && (
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1.5">
                            Max Per Order
                          </label>
                          <input
                            type="text"
                            value={editingTier.max_per_order ?? "2"}
                            onChange={(e) => setEditingTier({ ...editingTier, max_per_order: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3.5">
                        <span className="text-xs font-bold text-white">Active</span>
                        <input
                          type="checkbox"
                          checked={editingTier.is_active}
                          onChange={(e) => setEditingTier({ ...editingTier, is_active: e.target.checked })}
                          className="h-4 w-4 rounded accent-violet-600"
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-blue-500/5 border border-blue-500/20 p-3.5">
                        <div>
                          <span className="text-xs font-bold text-white">App Exclusive</span>
                          <p className="text-[10px] text-white/40">Only purchasable via TheScene app.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editingTier.app_only ?? false}
                          onChange={(e) => setEditingTier({ ...editingTier, app_only: e.target.checked })}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setEditingTier(null)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingTier}
                          className="rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                          {savingTier ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <h2 className="font-heading text-xl font-black text-white">
                  Orders ({filteredTickets.length})
                </h2>
                <input
                  type="text"
                  placeholder="Search buyer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#141418] px-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500 transition w-full sm:w-64"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] overflow-x-auto shadow-xl">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="border-b border-white/10 bg-white/5 text-[#8E8D9A]">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Buyer</th>
                      <th className="p-4 whitespace-nowrap">Tier</th>
                      <th className="p-4 whitespace-nowrap">Amount Paid</th>
                      <th className="p-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTickets.map((t: any) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {guestName(t)}
                            {(t.reference || "").toLowerCase().startsWith("concierge_") && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                Concierge
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-normal text-white/40">
                            {guestEmail(t)}
                          </div>
                        </td>
                        <td className="p-4 text-white/70 whitespace-nowrap">{tierName(t, allTiers)}</td>
                        <td className="p-4 font-bold whitespace-nowrap">
                          {(t.reference || "").toLowerCase().startsWith("concierge_") ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              Concierge
                            </span>
                          ) : (
                            <span className="text-violet-400 font-bold">{fmt(t.total_paid || 0)}</span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {(t.reference || "").toLowerCase().startsWith("concierge_") ? (
                            <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-1 text-[10px] font-bold text-violet-300 uppercase">
                              Concierge
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 uppercase">
                              Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "guestlist" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-black text-white">
                  Guest Roster ({localTickets.length})
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => downloadGuestList("csv")} className="text-[10px] font-bold uppercase tracking-wider text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">Export CSV</button>
                  <button onClick={() => downloadGuestList("pdf")} className="text-[10px] font-bold uppercase tracking-wider text-theme-purple bg-theme-purple/10 border border-theme-purple/20 px-3 py-1.5 rounded-lg hover:bg-theme-purple/20 transition">Export PDF</button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl space-y-3">
                {localTickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 animate-fade-in"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {guestName(t)}
                      </div>
                      <div className="text-xs text-white/40">
                        {guestEmail(t)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/60">
                        {tierName(t, allTiers)}
                      </span>
                      {(t.reference || "").toLowerCase().startsWith("concierge_") && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          Concierge
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.quantity_used > 0
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {t.quantity_used > 0
                          ? `Arrived (${t.quantity_used}/${t.quantity_purchased || 1})`
                          : "Not Arrived"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tables" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-black text-white">
                    Table Allocations
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Configure tables with single claim links and seat limits.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewTierForm({ name: "", price: "", quantity: "1", maxPerOrder: "1", description: "", tier_type: "table", tableCapacity: "", app_only: false });
                    setShowAddTierModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
                >
                  <Plus className="h-4 w-4" /> Add Table
                </button>
              </div>

              {allTiers.filter((t) => t.tier_type === "table").length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center space-y-2">
                  <UtensilsCrossed className="h-8 w-8 text-white/20 mx-auto" />
                  <p className="text-sm font-bold text-white/40">No tables allocated yet</p>
                  <p className="text-xs text-white/25">Add a table package to get started.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allTiers.filter((t) => t.tier_type === "table").map((tbl: any) => (
                  <div
                    key={tbl.id}
                    className="rounded-2xl border border-violet-500/20 border-l-[3px] border-l-violet-500 bg-[#0e0e11] p-6 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-lg font-black text-white">
                        {tbl.name}
                      </h3>
                      <span className="font-heading text-lg font-black text-violet-400">
                        {fmt(tbl.price)}
                      </span>
                    </div>
                    {tbl.table_capacity && (
                      <p className="text-xs text-violet-300/80 flex items-center gap-1.5 font-semibold">
                        <Users2 className="h-3.5 w-3.5" />
                        {tbl.table_capacity} guests per table
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "concierge" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="font-heading text-xl font-black text-white">
                  Executive Concierge Pass
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Send complimentary VIP tickets directly to guest emails via
                  Resend.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 space-y-4 shadow-xl">
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Guest Name *
                  </label>
                  <input
                    placeholder="Full Name"
                    value={conciergeForm.guestName}
                    onChange={(e) =>
                      setConciergeForm({
                        ...conciergeForm,
                        guestName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Guest Email *
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={conciergeForm.guestEmail}
                    onChange={(e) =>
                      setConciergeForm({
                        ...conciergeForm,
                        guestEmail: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Ticket Tier *
                  </label>
                  {allTiers && allTiers.length > 0 ? (
                    <select
                      value={conciergeForm.tier}
                      onChange={(e) =>
                        setConciergeForm({
                          ...conciergeForm,
                          tier: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 appearance-none"
                    >
                      {allTiers.map((tier: any) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                          {tier.price > 0
                            ? ` (${fmt(tier.price)})`
                            : " Complimentary"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                      No ticket tiers set up for this event yet. Create tiers in
                      the Tickets tab first.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Personal Note{" "}
                    <span className="font-normal text-white/30">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    placeholder="e.g. Looking forward to seeing you at the event!"
                    value={conciergeForm.customMessage}
                    onChange={(e) =>
                      setConciergeForm({
                        ...conciergeForm,
                        customMessage: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 resize-none"
                  />
                </div>
                <button
                  onClick={handleSendConciergePass}
                  disabled={
                    sendingPass || !conciergeForm.tier || !allTiers?.length
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-xs font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 transition shadow-lg shadow-violet-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendingPass
                    ? "Dispatching Pass Email..."
                    : "Send Complimentary Pass"}
                </button>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-white">
                  Dispatched VIP Passes ({sentPasses.length})
                </h3>
                {sentPasses.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0e0e11] overflow-x-auto shadow-xl">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="border-b border-white/10 bg-white/5 text-[#8E8D9A]">
                        <tr>
                          <th className="p-4 whitespace-nowrap">Recipient</th>
                          <th className="p-4 whitespace-nowrap">Tier</th>
                          <th className="p-4 whitespace-nowrap">Sent Date</th>
                          <th className="p-4 whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sentPasses.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="p-4 font-bold text-white">
                              {p.guest_name}{" "}
                              <div className="text-[11px] font-normal text-white/40">
                                {p.guest_email}
                              </div>
                            </td>
                            <td className="p-4 text-white/70">{p.tier}</td>
                            <td className="p-4 text-white/50">
                              {new Date(p.sent_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-4">
                              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 uppercase">
                                Emailed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-white/10 bg-[#0e0e11] text-xs text-white/40 text-center">
                    No complimentary passes sent yet for this event.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "doorstaff" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="font-heading text-xl font-black text-white">
                  Door Staff & Ticket Moderators
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Assign staff to scan QR tickets using{" "}
                  <strong>TheScene mobile app</strong>.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 space-y-4 shadow-xl">
                <label className="block text-xs font-bold text-white/60">
                  Authorize Staff Username
                </label>
                <UserSearchDropdown
                  onSelect={handleAddDoorStaff}
                  placeholder="Type username..."
                />

                {/* Info Box explaining app scanner log-in */}
                <div className="p-4 bg-violet-600/10 border border-violet-500/25 rounded-2xl flex items-start gap-3">
                  <Shield className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60 leading-relaxed">
                    Staff members authorized here can log directly into the
                    mobile <strong>TheScene app</strong> using their own
                    account. They will instantly see this event in their scanner
                    list and can check in guests at the door.
                  </p>
                </div>

                <div className="space-y-3 pt-3">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
                    Authorized Moderators ({doorStaff.length})
                  </h3>
                  {doorStaff.length > 0 ? (
                    doorStaff.map((staff: any) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 animate-fade-in"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center font-bold text-xs text-violet-300">
                            {(staff.profiles?.full_name ||
                              staff.profiles?.username ||
                              "S")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {staff.profiles?.full_name ||
                                staff.profiles?.username}
                            </div>
                            <div className="text-[11px] text-violet-400">
                              Scanner / Ticket Moderator
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveDoorStaff(staff.id, staff.user_id)
                          }
                          className="text-xs font-bold text-red-400 hover:text-red-300"
                        >
                          Revoke Access
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 text-xs text-white/40 text-center">
                      No staff assigned yet. Search a username above to
                      authorize scanning access.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "onsiteticket" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="font-heading text-xl font-black text-white">
                  Onsite Usher Staffing
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Hire professional entry ushers from TheScene. Your request is
                  sent to our team for confirmation.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 space-y-5 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">
                      Expected Guests
                    </label>
                    <input
                      type="text"
                      value={usherForm.expectedGuests}
                      onChange={(e) =>
                        setUsherForm({
                          ...usherForm,
                          expectedGuests: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">
                      Number of Ushers
                    </label>
                    <input
                      type="text"
                      value={usherForm.staffCount}
                      onChange={(e) =>
                        setUsherForm({
                          ...usherForm,
                          staffCount: Number(e.target.value) || 1,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                    />
                    <p className="text-[10px] text-white/30 mt-1">
                      We recommend {recommendedUshers} usher
                      {recommendedUshers !== 1 ? "s" : ""} for{" "}
                      {usherForm.expectedGuests} guests (1 per 75)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Gender Preference
                  </label>
                  <select
                    value={usherForm.genderPref}
                    onChange={(e) =>
                      setUsherForm({ ...usherForm, genderPref: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  >
                    <option value="mixed">Mixed (Equal Genders)</option>
                    <option value="female">All Female</option>
                    <option value="male">All Male</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Your Offer per Usher (₦)
                  </label>
                  <input
                    type="text"
                    value={usherForm.offeredPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setUsherForm({ ...usherForm, offeredPrice: val });
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  />
                  <p className="text-[10px] text-white/30 mt-1">
                    Standard rate: {fmt(USHER_PRICE_PER_STAFF)}/usher. Minimum
                    offer: {fmt(MIN_USHER_PRICE)}/usher.
                  </p>
                  {usherForm.offeredPrice > 0 &&
                    usherForm.offeredPrice < MIN_USHER_PRICE && (
                      <p className="text-[10px] text-red-400 mt-1 font-semibold">
                        Offer is below the minimum of {fmt(MIN_USHER_PRICE)} per
                        usher.
                      </p>
                    )}
                </div>

                <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-violet-300 font-bold">
                    <span>
                      {usherForm.staffCount} Usher
                      {usherForm.staffCount !== 1 ? "s" : ""} ×{" "}
                      {fmt(usherForm.offeredPrice)}/each
                    </span>
                    <span className="text-lg font-black text-violet-400">
                      {fmt(usherTotalCost)}
                    </span>
                  </div>
                  {usherForm.offeredPrice < USHER_PRICE_PER_STAFF &&
                    usherForm.offeredPrice >= MIN_USHER_PRICE && (
                      <p className="text-[10px] text-amber-300">
                        Your offer is below our standard rate. Our team will
                        review and get back to you.
                      </p>
                    )}
                </div>

                <button
                  onClick={handleRequestUshers}
                  className="w-full rounded-xl bg-violet-600 py-3 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-600/20"
                >
                  Send Staffing Inquiry
                </button>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="h-4 w-4 text-white/40 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Your request will be sent to{" "}
                    <strong className="text-white/60">
                      thesceneappsupport@gmail.com
                    </strong>
                    . The team will review your inquiry and respond with
                    availability, pricing confirmation, and next steps.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-white">
                  Staffing Requests History ({usherRequests.length})
                </h3>
                {usherRequests.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0e0e11] overflow-x-auto shadow-xl">
                    <table className="w-full text-left text-xs min-w-[520px]">
                      <thead className="border-b border-white/10 bg-white/5 text-[#8E8D9A]">
                        <tr>
                          <th className="p-4 whitespace-nowrap">Date</th>
                          <th className="p-4 whitespace-nowrap">Ushers</th>
                          <th className="p-4 whitespace-nowrap">Offered Rate</th>
                          <th className="p-4 whitespace-nowrap">Total</th>
                          <th className="p-4 whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {usherRequests.map((req: any) => (
                          <tr key={req.id} className="hover:bg-white/[0.02]">
                            <td className="p-4 text-white/70">
                              {new Date(req.date).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-white">{req.staffCount}</td>
                            <td className="p-4 text-white/70">
                              {fmt(req.offeredPrice || USHER_PRICE_PER_STAFF)}
                              /each
                            </td>
                            <td className="p-4 font-bold text-violet-400">
                              {fmt(req.cost)}
                            </td>
                            <td className="p-4">
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-white/10 bg-[#0e0e11] text-xs text-white/40 text-center">
                    No staffing requests submitted yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "wristbands" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="font-heading text-xl font-black text-white">
                  Tags & Wristbands
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Send an inquiry for custom-designed wristbands, paper tags, or
                  lanyards. Our design team will create a mockup based on your
                  inspiration and get back to you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    name: "RFID / NFC Cloth Wristbands",
                    price: 350,
                    desc: "Reusable cloth, fast RFID entrance tap.",
                  },
                  {
                    name: "Tyvek Waterproof Paper Tags",
                    price: 120,
                    desc: "Standard single-use waterproof paper tags.",
                  },
                  {
                    name: "Custom Printed Lanyards",
                    price: 500,
                    desc: "VIP, Security & Backstage passes.",
                  },
                ].map((prod) => (
                  <div
                    key={prod.name}
                    onClick={() =>
                      setWristbandProduct({
                        name: prod.name,
                        price: prod.price,
                      })
                    }
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      wristbandProduct.name === prod.name
                        ? "bg-violet-600/20 border-violet-500 shadow-xl"
                        : "bg-[#0e0e11] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <h3 className="font-bold text-white text-sm">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 min-h-[32px]">
                      {prod.desc}
                    </p>
                    <div className="text-lg font-black text-violet-400 mt-3">
                      {fmt(prod.price)}{" "}
                      <span className="text-xs text-white/40 font-normal">
                        / unit
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 space-y-5 shadow-xl max-w-xl">
                <h3 className="text-sm font-bold text-white">
                  Request a Quote
                </h3>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Selected Product
                  </label>
                  <input
                    readOnly
                    value={`${wristbandProduct.name}: ${fmt(wristbandProduct.price)}/unit`}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Quantity (Units)
                  </label>
                  <input
                    type="text"
                    value={wristbandQuantity}
                    onChange={(e) =>
                      setWristbandQuantity(
                        Math.max(10, parseInt(e.target.value) || 10),
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  />
                  <p className="text-[10px] text-white/30 mt-1">
                    Minimum order: 10 units.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Design Inspiration / Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe colors, logo placement, event theme, or paste a link to an image that inspires your design. If left blank, our team will design it for you."
                    value={wristbandDesignInspo}
                    onChange={(e) => setWristbandDesignInspo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    placeholder="Full street address in Nigeria"
                    value={wristbandAddress}
                    onChange={(e) => setWristbandAddress(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500"
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/60 font-semibold">
                    Estimated Cost ({wristbandQuantity} units):
                  </span>
                  <span className="text-xl font-black text-violet-400">
                    {fmt(wristbandQuantity * wristbandProduct.price)}
                  </span>
                </div>

                <button
                  onClick={handlePlaceWristbandOrder}
                  disabled={placingWristbandOrder}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-xs font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 transition shadow-lg shadow-violet-600/20"
                >
                  {placingWristbandOrder
                    ? "Sending Inquiry..."
                    : "Send Inquiry to TheScene"}
                </button>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="h-4 w-4 text-white/40 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Your inquiry is sent to{" "}
                    <strong className="text-white/60">
                      thesceneappsupport@gmail.com
                    </strong>
                    . Our team will respond with a design mockup, final pricing,
                    and delivery timeline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="font-heading text-xl font-black text-white">
                  Event Settings
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Manage details, music genres, vibes, and fee absorption.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 space-y-5 shadow-xl">
                <h3 className="text-sm font-bold text-white">
                  General Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">
                      Event Title
                    </label>
                    <input
                      value={settingsTitle}
                      onChange={(e) => setSettingsTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">
                      Custom URL Slug
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-white/30 select-none">/</span>
                      <input
                        value={settingsSlug}
                        onChange={(e) => setSettingsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                        className="w-full rounded-xl border border-white/10 bg-[#141418] pl-6 pr-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                        placeholder="e.g. my-day"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">
                      Venue / Location
                    </label>
                    <input
                      value={settingsLocation}
                      onChange={(e) => setSettingsLocation(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={settingsDesc}
                    onChange={(e) => setSettingsDesc(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 space-y-5 shadow-xl">
                <h3 className="text-sm font-bold text-white">
                  Music Genres & Vibes
                </h3>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-2 flex items-center gap-1.5">
                    <Music className="h-4 w-4 text-violet-400" /> Music Genres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GENRES.map((g) => {
                      const active = settingsGenres.includes(g);
                      return (
                        <button
                          type="button"
                          key={g}
                          onClick={() =>
                            setSettingsGenres((prev) =>
                              active
                                ? prev.filter((item) => item !== g)
                                : [...prev, g],
                            )
                          }
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition border ${
                            active
                              ? "bg-violet-600/30 border-violet-500 text-violet-200"
                              : "bg-white/5 border-white/10 text-white/50"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-2 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-fuchsia-400" /> Event Vibe
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VIBES.map((v) => {
                      const active = settingsVibes.includes(v);
                      return (
                        <button
                          type="button"
                          key={v}
                          onClick={() =>
                            setSettingsVibes((prev) =>
                              active
                                ? prev.filter((item) => item !== v)
                                : [...prev, v],
                            )
                          }
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition border ${
                            active
                              ? "bg-fuchsia-600/30 border-fuchsia-500 text-fuchsia-200"
                              : "bg-white/5 border-white/10 text-white/50"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4">
                  Platform Fee
                </h3>
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
                  <div>
                    <div className="text-sm font-bold text-white">
                      Absorb 5% processing fee
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      If enabled, you cover the fee and guests pay face value.
                      If disabled, guests pay price + 5%.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsAbsorbFee}
                    onChange={(e) => setSettingsAbsorbFee(e.target.checked)}
                    className="h-5 w-5 rounded accent-violet-600"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4">
                  Event Visibility
                </h3>
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
                  <div>
                    <div className="text-sm font-bold text-white">
                      Private Event
                    </div>
                    <div className="text-xs text-white/40 mt-0.5 max-w-lg">
                      Private events won't show on TheScene browse page or search. Only people with the direct link can see it.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsPrivate}
                    onChange={(e) => setSettingsPrivate(e.target.checked)}
                    className="h-5 w-5 rounded accent-violet-600"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0e0e11] p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-1">
                  Custom Registration Questions
                </h3>
                <p className="text-xs text-white/40 mb-5">
                  Define custom questions to ask guests at checkout (e.g. phone
                  number, dietary needs, shirt size).
                </p>
                <CustomRegistrationBuilder />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 transition shadow-lg shadow-violet-600/20"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-red-400 mb-4">
                  Danger Zone
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      Delete this event
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      This is permanent and cannot be undone. All orders will be
                      retained for records.
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteEvent}
                    disabled={deletingEvent}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                  >
                    {deletingEvent ? "Deleting..." : "Delete Event"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    
      {/* BROADCAST ANNOUNCEMENT MODAL */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        party={party}
        totalAttendees={localTickets.length}
        hostName={profile?.full_name || profile?.username || "The Host"}
      />


      <BankAccountModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        user={user}
      />
    </div>
  );
}