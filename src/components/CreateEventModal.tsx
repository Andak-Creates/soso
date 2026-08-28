"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Image as ImageIcon,
  Music,
  Flame,
  Upload,
  Calendar,
  MapPin,
  Info,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const MUSIC_GENRES = [
  "Afrobeats",
  "Hip Hop",
  "R&B",
  "Amapiano",
  "House",
  "Dancehall",
  "Reggae",
  "Afro House",
  "Pop",
  "EDM",
  "Trap",
  "Alte",
];

const VIBES = [
  "🔥 Wild",
  "😌 Chill",
  "🌳 Outdoor",
  "🏠 Indoor",
  "🎭 Exclusive",
  "🎉 Open",
  "💃 Dance",
  "🎵 Live Music",
  "🌃 Rooftop",
  "🏖️ Beach",
];

interface TicketTierInput {
  id: string;
  name: string;
  price: string;
  quantity: string;
  maxPerOrder: string;
  isLimitOn: boolean;
  tier_type: "ticket" | "table" | "group";
  tableCapacity?: string; // seats per table / group size (e.g. "5")
  description?: string; // optional display description
  app_only?: boolean; // if true, only purchasable via TheScene app
}

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

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateEventModalProps) {
  const supabase = createClient();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Navigation state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Visuals State
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<
    { id: string; file: File; preview: string; type: "image" | "video" }[]
  >([]);

  // Step 2: Basics State
  const [hostProfiles, setHostProfiles] = useState<any[]>([]);
  const [selectedHostProfile, setSelectedHostProfile] = useState<string>("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [refreshingProfiles, setRefreshingProfiles] = useState(false);

  // New Brand profile modal inline
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileBio, setNewProfileBio] = useState("");
  const [newProfileAvatarFile, setNewProfileAvatarFile] = useState<File | null>(
    null,
  );
  const [newProfileAvatarPreview, setNewProfileAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Title, description, dates
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [dateTBA, setDateTBA] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("21:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("03:00");

  // Location details
  const [locationTBA, setLocationTBA] = useState(false);
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("Lagos");
  const [city, setCity] = useState("Lagos");
  const [venueAddress, setVenueAddress] = useState("");

  // Link & Dress code
  const [communityLink, setCommunityLink] = useState("");
  const [communityPlatform, setCommunityPlatform] = useState("WhatsApp");
  const [dressCode, setDressCode] = useState("");

  // Step 3: Vibe State
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  // Step 4: Tickets & Tables State
  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([]);
  const [showTicketCount, setShowTicketCount] = useState(true);
  const [absorbPlatformFee, setAbsorbPlatformFee] = useState(false);

  const flyerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const loadHostProfiles = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshingProfiles(true);
      else setLoadingProfiles(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profiles, error: profileError } = await supabase
          .from("host_profiles")
          .select("*")
          .eq("owner_id", user.id);

        if (profileError) throw profileError;

        if (profiles && profiles.length > 0) {
          setHostProfiles(profiles);
          setSelectedHostProfile(profiles[0].id);
        }
      } catch (err: any) {
        console.error("Failed to fetch host profiles:", err);
      } finally {
        setLoadingProfiles(false);
        setRefreshingProfiles(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!isOpen) return;
    loadHostProfiles();
  }, [isOpen, loadHostProfiles]);

  // Instantly scroll the form body to top whenever the step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      alert("Please enter a host name");
      return;
    }
    setSavingProfile(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatarUrl = "";
      if (newProfileAvatarFile) {
        const uploadRes = await uploadToCloudinary(
          newProfileAvatarFile,
          "image",
        );
        avatarUrl = uploadRes.url;
      }

      const { data: newProfile, error: insertError } = await supabase
        .from("host_profiles")
        .insert({
          owner_id: user.id,
          name: newProfileName.trim(),
          bio: newProfileBio.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setHostProfiles((prev) => [...prev, newProfile]);
      setSelectedHostProfile(newProfile.id);
      setShowNewProfileModal(false);
      setNewProfileName("");
      setNewProfileBio("");
      setNewProfileAvatarFile(null);
      setNewProfileAvatarPreview("");
    } catch (err: any) {
      alert(err.message || "Failed to create host profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFlyerFile(file);
      setFlyerPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newItems = filesArray.map((file) => {
        const type = file.type.startsWith("video/") ? "video" : "image";
        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview: URL.createObjectURL(file),
          type: type as "image" | "video",
        };
      });
      setGalleryFiles((prev) => [...prev, ...newItems].slice(0, 10)); // Limit to 10 max
    }
  };

  const removeGalleryItem = (id: string) => {
    setGalleryFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddTicketTier = () => {
    setTicketTiers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        price: "",
        quantity: "",
        maxPerOrder: "2",
        isLimitOn: true,
        tier_type: "ticket",
      },
    ]);
  };

  const handleAddTableTier = () => {
    setTicketTiers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        price: "",
        quantity: "",
        maxPerOrder: "1",
        isLimitOn: true,
        tier_type: "table",
        tableCapacity: "5",
        app_only: false,
      },
    ]);
  };

  const handleAddGroupTier = () => {
    setTicketTiers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        price: "",
        quantity: "",
        maxPerOrder: "1",
        isLimitOn: true,
        tier_type: "group",
        tableCapacity: "4",
        app_only: false,
      },
    ]);
  };

  const removeTicketTier = (id: string) => {
    setTicketTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTicketTier = (
    id: string,
    field: keyof TicketTierInput,
    value: any,
  ) => {
    setTicketTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!flyerFile) {
        setError("Please upload a party flyer (cover image)");
        return false;
      }
    } else if (step === 2) {
      if (!selectedHostProfile) {
        setError("Please select or create a host profile");
        return false;
      }
      if (!title.trim()) {
        setError("Please enter an event title");
        return false;
      }
      if (!country.trim() || !state.trim() || !city.trim()) {
        setError("Please fill in country, state, and city fields");
        return false;
      }
      if (!locationTBA && !venueAddress.trim()) {
        setError("Please enter a venue address or mark as TBA");
        return false;
      }
      if (!dateTBA) {
        if (!startDate) {
          setError("Please specify a start date");
          return false;
        }
        if (!endDate) {
          setError("Please specify an end date");
          return false;
        }
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        if (end <= start) {
          setError("End date/time must be strictly after the start date/time");
          return false;
        }
      }
    } else if (step === 3) {
      if (selectedGenres.length === 0) {
        setError("Please select at least one music genre");
        return false;
      }
      if (selectedVibes.length === 0) {
        setError("Please select at least one vibe");
        return false;
      }
    } else if (step === 4) {
      for (const tier of ticketTiers) {
        if (!tier.name.trim()) {
          setError("Please fill in all names for your tickets/tables");
          return false;
        }
        if (
          tier.price === "" ||
          isNaN(Number(tier.price)) ||
          Number(tier.price) < 0
        ) {
          setError("Please specify a valid price (>= 0)");
          return false;
        }
        if (
          !tier.quantity ||
          isNaN(Number(tier.quantity)) ||
          Number(tier.quantity) <= 0
        ) {
          setError("Please specify a valid quantity (> 0)");
          return false;
        }
        if (tier.tier_type === "table" || tier.tier_type === "group") {
          if (
            !tier.tableCapacity ||
            !tier.tableCapacity.trim() ||
            isNaN(Number(tier.tableCapacity))
          ) {
            setError(
              tier.tier_type === "group"
                ? "Please specify group size (e.g. 4 people per group pass)"
                : "Please specify seat capacity for the table (e.g. 5)",
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSaveEvent = async (publishImmediately: boolean) => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Upload Flyer to Cloudinary
      let flyerUrl = "";
      if (flyerFile) {
        const uploadRes = await uploadToCloudinary(flyerFile, "image");
        flyerUrl = uploadRes.url;
      }

      // 2. Upload Gallery Media in parallel
      const galleryUploads = await Promise.all(
        galleryFiles.map((item) => uploadToCloudinary(item.file, item.type)),
      );

      // 3. Resolve start/end dates
      let partyDateTimeISO = null;
      let partyEndDateTimeISO = null;
      if (!dateTBA) {
        partyDateTimeISO = new Date(
          `${startDate}T${startTime}:00`,
        ).toISOString();
        partyEndDateTimeISO = new Date(
          `${endDate}T${endTime}:00`,
        ).toISOString();
      }

      // 4. Calculate total quantity and lowest ticket price
      const totalQuantity = ticketTiers.reduce(
        (acc, t) => acc + Number(t.quantity || 0),
        0,
      );
      const lowestPrice =
        ticketTiers.length > 0
          ? Math.min(...ticketTiers.map((t) => Number(t.price || 0)))
          : 0;

      // 5. Insert event into 'parties' table
      const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if clean slug is taken; if so, append a short random suffix
      const { data: existingSlug } = await supabase
        .from("parties")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      const generatedSlug = existingSlug
        ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
        : baseSlug;

      const { data: party, error: partyError } = await supabase
        .from("parties")
        .insert({
          host_id: user.id,
          title: title.trim(),
          slug: generatedSlug,
          description: description.trim() || null,
          flyer_url: flyerUrl || null,
          date: partyDateTimeISO,
          end_date: partyEndDateTimeISO,
          date_tba: dateTBA,
          location: locationTBA ? null : venueAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          location_tba: locationTBA,
          ticket_price: lowestPrice,
          currency_code: "NGN", // defaulted to Naira
          dress_code: dressCode.trim() || null,
          community_link: communityLink.trim() || null,
          community_platform: communityPlatform.trim().toLowerCase(),
          ticket_quantity: totalQuantity > 0 ? totalQuantity : null,
          tickets_sold: 0,
          music_genres: selectedGenres,
          vibes: selectedVibes,
          is_published: publishImmediately,
          is_private: isPrivate,
          host_profile_id: selectedHostProfile || null,
          show_ticket_count: showTicketCount,
          absorb_fee: absorbPlatformFee,
        })
        .select()
        .single();

      if (partyError) throw partyError;

      // 6. Insert gallery media into 'party_media'
      if (galleryUploads.length > 0) {
        const mediaRows = galleryUploads.map((res, index) => ({
          party_id: party.id,
          media_type: galleryFiles[index].type,
          media_url: res.url,
          thumbnail_url: res.thumbnailUrl || null,
          display_order: index,
          is_primary: false,
        }));
        await supabase.from("party_media").insert(mediaRows);
      }

      // 7. Insert ticket tiers
      if (ticketTiers.length > 0) {
        const tierRows = ticketTiers.map((tier, index) => ({
          party_id: party.id,
          name: tier.name.trim(),
          table_capacity:
            tier.tier_type === "table" || tier.tier_type === "group"
              ? parseInt(tier.tableCapacity || "0") || null
              : null,
          price: Number(tier.price || 0),
          quantity: Number(tier.quantity || 0),
          quantity_sold: 0,
          tier_order: index,
          is_active: true,
          currency_code: "NGN",
          max_per_order:
            tier.isLimitOn && tier.maxPerOrder
              ? Number(tier.maxPerOrder)
              : null,
          tier_type: tier.tier_type,
          app_only: tier.app_only ?? false,
        }));
        const { error: tierError } = await supabase
          .from("ticket_tiers")
          .insert(tierRows);
        if (tierError) throw tierError;
      }

      if (onSubmit) {
        onSubmit(party);
      }
      onClose();
      window.location.href = `/events/${party.id}`;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe],
    );
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#080809] flex flex-col md:flex-row overflow-hidden text-[#F9FAFB] selection:bg-violet-500/30">
      {/* LEFT SIDEBAR: Process Steps & Accent Graphic */}
      <aside className="w-full md:w-80 bg-[#0f0f11] border-b md:border-b-0 md:border-r border-white/10 flex flex-row md:flex-col p-6 shrink-0 justify-between items-center md:items-start gap-4">
        <div className="space-y-6 w-full">
          <div className="flex items-center gap-2">
            <span className="font-brand text-2xl text-white tracking-widest group-hover:opacity-80 transition">
              Bhind.
            </span>
          </div>

          <nav className="hidden md:block space-y-4">
            {[
              { num: 1, name: "Upload Visuals", desc: "Cover flyer & gallery" },
              {
                num: 2,
                name: "Basic Details",
                desc: "Name, host, date & address",
              },
              { num: 3, name: "Music & Vibe", desc: "Pills for discovery" },
              { num: 4, name: "Tickets & Tables", desc: "Pricing & inventory" },
              { num: 5, name: "Preview & Launch", desc: "Final checks" },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-start gap-3 transition ${step >= s.num ? "opacity-100" : "opacity-30"}`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === s.num ? "bg-violet-600 text-white shadow-md" : step > s.num ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 border border-white/10 text-white/40"}`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${step === s.num ? "text-violet-400" : "text-white"}`}
                  >
                    {s.name}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between md:w-full">
          <div className="text-left">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400">
              Step {step} of 5
            </div>
            <div className="text-sm font-black text-white hidden md:block mt-0.5">
              {step === 1 && "Visuals"}
              {step === 2 && "Basics"}
              {step === 3 && "The Vibe"}
              {step === 4 && "Checkout Setups"}
              {step === 5 && "Confirmation"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <section className="flex-1 flex flex-col overflow-hidden bg-[#080809]">
        {/* Top Header - Dismiss button for Desktop */}
        <header className="hidden md:flex items-center justify-between p-6 border-b border-white/10 bg-[#080809]/50 backdrop-blur-md">
          <h2 className="font-heading text-lg font-black text-white tracking-tight">
            Create New Event Listing
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Form Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8 md:px-12 max-w-4xl w-full mx-auto space-y-6"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs font-semibold leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* STEP 1: VISUALS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-black text-white tracking-tight">
                  Party Visuals
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Upload the event flyer as the main cover, and optionally add
                  secondary photos/videos to the swiping gallery.
                </p>
              </div>

              {/* Main Flyer Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                  Main Flyer *
                </label>
                <div
                  onClick={() => flyerInputRef.current?.click()}
                  className="relative group cursor-pointer aspect-[4/5] max-w-sm mx-auto rounded-3xl border-2 border-dashed border-white/20 hover:border-violet-500 bg-[#0e0e11] overflow-hidden flex flex-col items-center justify-center p-6 text-center transition"
                >
                  {flyerPreview ? (
                    <>
                      <img
                        src={flyerPreview}
                        alt="Flyer Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200">
                        <Upload className="h-8 w-8 text-violet-400 mb-2" />
                        <span className="text-xs font-bold">Replace Flyer</span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-14 w-14 rounded-full bg-violet-600/10 flex items-center justify-center mx-auto text-violet-400 group-hover:scale-110 transition">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Tap to upload event flyer
                        </p>
                        <p className="text-[11px] text-white/40 mt-1">
                          Recommended: 4:5 vertical portrait aspect ratio
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={flyerInputRef}
                  onChange={handleFlyerChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="h-px bg-white/10 w-full my-8" />

              {/* Secondary Media Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                      Vibe Gallery{" "}
                      <span className="text-white/30 font-normal">
                        (optional)
                      </span>
                    </label>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Add up to 10 photos or short looping video clips
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Media
                  </button>
                </div>

                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGalleryChange}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                />

                {galleryFiles.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {galleryFiles.map((item) => (
                      <div
                        key={item.id}
                        className="relative aspect-square rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden group"
                      >
                        {item.type === "video" ? (
                          <video
                            src={item.preview}
                            className="w-full h-full object-cover"
                            muted
                            loop
                          />
                        ) : (
                          <img
                            src={item.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(item.id)}
                          className="absolute top-1.5 right-1.5 rounded-lg bg-black/80 p-1.5 text-red-400 border border-white/5 hover:text-red-300 transition duration-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 border border-white/5 text-[8px] font-bold uppercase text-white/80 select-none">
                          {item.type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/30 bg-[#0e0e11]/30">
                    No extra gallery media uploaded.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BASICS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-black text-white tracking-tight">
                  The Basics
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Specify which host profile is publishing, when, and where the
                  event takes place.
                </p>
              </div>

              {/* Host Profile selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Host Profile *
                  </label>
                  <button
                    type="button"
                    onClick={() => loadHostProfiles(true)}
                    disabled={refreshingProfiles}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${refreshingProfiles ? "animate-spin" : ""}`}
                    />{" "}
                    Refresh
                  </button>
                </div>

                {loadingProfiles ? (
                  <div className="h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/40">
                    Loading profiles...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {hostProfiles.map((hp) => (
                      <button
                        type="button"
                        key={hp.id}
                        onClick={() => setSelectedHostProfile(hp.id)}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 border transition text-sm font-bold ${
                          selectedHostProfile === hp.id
                            ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/10"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {hp.avatar_url && (
                          <img
                            src={hp.avatar_url}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        {hp.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewProfileModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white/50 hover:text-white hover:border-white/45 transition"
                    >
                      + New Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Event Title *
                  </label>
                  <input
                    placeholder="e.g. Neon Mirage: Rooftop Party"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Description{" "}
                    <span className="text-white/30 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    placeholder="Tell guests about your event vibes, special line-ups, and rules..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="h-px bg-white/10 w-full my-6" />

              {/* Private Event Toggle */}
              <div className="flex items-center justify-between bg-[#141418] border border-white/10 rounded-2xl p-4 mb-6">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    Private Event
                    <span className="bg-theme-purple/20 text-theme-purple px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border border-theme-purple/30">
                      New
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">
                    Private events won't show on TheScene browse page. Only
                    people with the direct link can see it.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Start & End Dates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#141418] border border-white/10 rounded-2xl p-4">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Date & Time TBA?
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      Toggle ON if you haven't finalized the timing.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={dateTBA}
                      onChange={(e) => setDateTBA(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {!dateTBA && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                        Start Date & Time *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1 rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                        />
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-24 rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                        End Date & Time *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex-1 rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                        />
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-24 rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/10 w-full my-6" />

              {/* Location Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#141418] border border-white/10 rounded-2xl p-4">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Location TBA?
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      Toggle ON if the exact venue is still private.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={locationTBA}
                      onChange={(e) => setLocationTBA(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      Country *
                    </label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      State / Region *
                    </label>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      City *
                    </label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                {!locationTBA && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                      Venue Address *
                    </label>
                    <input
                      placeholder="e.g. Hard Rock Beach Club, Landmark Beach, Lagos"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-white/10 w-full my-6" />

              {/* Extra Meta (Community Link & Dress Code) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                    Community Link{" "}
                    <span className="text-white/30 font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={communityPlatform}
                      onChange={(e) => setCommunityPlatform(e.target.value)}
                      className="rounded-xl border border-white/10 bg-[#141418] px-3 text-xs text-white outline-none focus:border-violet-500 transition"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telegram">Telegram</option>
                      <option value="Snapchat">Snapchat</option>
                      <option value="Discord">Discord</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      placeholder={
                        communityPlatform.toLowerCase() === "whatsapp"
                          ? "https://chat.whatsapp.com/..."
                          : communityPlatform.toLowerCase() === "telegram"
                            ? "https://t.me/..."
                            : communityPlatform.toLowerCase() === "snapchat"
                              ? "https://snapchat.com/add/..."
                              : communityPlatform.toLowerCase() === "discord"
                                ? "https://discord.gg/..."
                                : "https://..."
                      }
                      value={communityLink}
                      onChange={(e) => setCommunityLink(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-[#141418] px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Dress Code{" "}
                    <span className="text-white/30 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    placeholder="e.g. All White / Casual Elegant"
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              {/* INLINE NEW BRAND PROFILE CREATOR MODAL */}
              {showNewProfileModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
                  <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0e11] p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h4 className="font-heading text-base font-black text-white">
                        Create Host Brand Profile
                      </h4>
                      <button
                        onClick={() => setShowNewProfileModal(false)}
                        className="rounded-lg bg-white/5 p-1.5 text-white/40 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Brand avatar upload */}
                    <div className="flex flex-col items-center gap-3">
                      <div
                        onClick={() => avatarInputRef.current?.click()}
                        className="h-16 w-16 rounded-full border border-white/20 bg-[#141418] hover:border-violet-500 overflow-hidden flex items-center justify-center cursor-pointer group relative"
                      >
                        {newProfileAvatarPreview ? (
                          <img
                            src={newProfileAvatarPreview}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-white/30" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition">
                          Upload
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setNewProfileAvatarFile(file);
                            setNewProfileAvatarPreview(
                              URL.createObjectURL(file),
                            );
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <input
                        placeholder="Host / Brand Name (e.g. TheScene Ent)"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-xs text-white outline-none focus:border-violet-500"
                      />
                      <textarea
                        placeholder="Short host bio..."
                        value={newProfileBio}
                        onChange={(e) => setNewProfileBio(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-xs text-white outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleCreateProfile}
                      disabled={savingProfile}
                      className="w-full rounded-xl bg-violet-600 py-3 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-40"
                    >
                      {savingProfile ? "Creating Brand..." : "Save Host Brand"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: THE VIBE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-black text-white tracking-tight">
                  Music Genres & Vibes
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Select genres and vibes so music lovers can discover your
                  event on the app feed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-3 flex items-center gap-1.5">
                  <Music className="h-4 w-4 text-violet-400" /> Music Genres *
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {MUSIC_GENRES.map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition border ${
                          active
                            ? "bg-violet-600/30 border-violet-500 text-violet-200 shadow-md"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/10 w-full my-6" />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-3 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-fuchsia-400" /> Event Vibes *
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {VIBES.map((vibe) => {
                    const active = selectedVibes.includes(vibe);
                    return (
                      <button
                        type="button"
                        key={vibe}
                        onClick={() => toggleVibe(vibe)}
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition border ${
                          active
                            ? "bg-fuchsia-600/30 border-fuchsia-500 text-fuchsia-200 shadow-md"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TICKETS & TABLES */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between">
                <div>
                  <h3 className="font-heading text-2xl font-black text-white tracking-tight">
                    Tickets & Tables
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Configure pricing tiers and table reservations. All prices
                    are in NGN.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddTicketTier}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-violet-400" /> Add Ticket
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTableTier}
                    className="inline-flex items-center gap-1 rounded-xl bg-violet-600/20 border border-violet-500/30 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-600/30 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-fuchsia-400" /> Add Table
                  </button>
                  <button
                    type="button"
                    onClick={handleAddGroupTier}
                    className="inline-flex items-center gap-1 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/30 px-3 py-2 text-xs font-bold text-fuchsia-300 hover:bg-fuchsia-600/30 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-fuchsia-400" /> Group Pass
                  </button>
                </div>
              </div>

              {/* Tiers List */}
              <div className="space-y-4">
                {ticketTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`rounded-2xl border bg-[#0e0e11] p-5 space-y-4 relative shadow-xl ${
                      tier.tier_type === "table"
                        ? "border-violet-500/25 border-l-4 border-l-violet-600"
                        : tier.tier_type === "group"
                          ? "border-fuchsia-500/25 border-l-4 border-l-fuchsia-500"
                          : "border-white/10"
                    }`}
                  >
                    {/* Header badge & delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            tier.tier_type === "table"
                              ? "bg-violet-500/20 text-violet-300"
                              : tier.tier_type === "group"
                                ? "bg-fuchsia-500/20 text-fuchsia-300"
                                : "bg-white/10 text-white/50"
                          }`}
                        >
                          {tier.tier_type === "table"
                            ? "🪑 Table"
                            : tier.tier_type === "group"
                              ? "👥 Group Pass"
                              : "🎟 Ticket Tier"}
                        </span>
                        {tier.app_only && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            App Only
                          </span>
                        )}
                      </div>
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketTier(tier.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-white/5 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                          Name *
                        </label>
                        <input
                          placeholder={
                            tier.tier_type === "table"
                              ? "e.g. VIP Table A"
                              : "e.g. General Admission"
                          }
                          value={tier.name}
                          onChange={(e) =>
                            updateTicketTier(tier.id, "name", e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                          Price (₦) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 15000"
                          value={tier.price}
                          onChange={(e) =>
                            updateTicketTier(tier.id, "price", e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                          {tier.tier_type === "table"
                            ? "Tables Available *"
                            : "Tickets Available *"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10"
                          value={tier.quantity}
                          onChange={(e) =>
                            updateTicketTier(
                              tier.id,
                              "quantity",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Table/Group seats / Max per order fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {tier.tier_type === "table" ||
                      tier.tier_type === "group" ? (
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                            {tier.tier_type === "group"
                              ? "People per Group Pass *"
                              : "Guests Capacity per Table *"}
                          </label>
                          <input
                            placeholder={
                              tier.tier_type === "group" ? "e.g. 4" : "e.g. 5"
                            }
                            type="number"
                            min="2"
                            value={tier.tableCapacity || ""}
                            onChange={(e) =>
                              updateTicketTier(
                                tier.id,
                                "tableCapacity",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 pt-3.5">
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={tier.isLimitOn}
                              onChange={(e) =>
                                updateTicketTier(
                                  tier.id,
                                  "isLimitOn",
                                  e.target.checked,
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                          </label>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Limit ticket sales per order
                            </span>
                            <span className="text-[10px] text-white/40">
                              Guests can only buy up to a specified quantity at
                              checkout.
                            </span>
                          </div>
                        </div>
                      )}

                      {(!tier.tier_type || tier.tier_type === "ticket") &&
                        tier.isLimitOn && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                              Max Tickets per Order
                            </label>
                            <input
                              value={tier.maxPerOrder}
                              onChange={(e) =>
                                updateTicketTier(
                                  tier.id,
                                  "maxPerOrder",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                            />
                          </div>
                        )}
                    </div>

                    {/* App Only Toggle */}
                    <div className="flex items-center justify-between rounded-xl bg-blue-500/5 border border-blue-500/20 px-4 py-3">
                      <div>
                        <div className="text-xs font-bold text-white">
                          TheScene App Exclusive
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          Only visible and purchasable via the TheScene mobile
                          app.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={tier.app_only ?? false}
                          onChange={(e) =>
                            updateTicketTier(
                              tier.id,
                              "app_only",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/10 w-full my-6" />

              {/* Extra toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#141418] border border-white/10 rounded-2xl p-4">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Show remaining ticket counts?
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      Let users see how many tickets are left on the checkout
                      page.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={showTicketCount}
                      onChange={(e) => setShowTicketCount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-[#141418] border border-white/10 rounded-2xl p-4">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Absorb platform service fees (5%)?
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      ON: Host covers the 5% platform fee. OFF: 5% fee is paid by buyers at checkout (standard 1.5% gateway fees apply to payout settlements).
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={absorbPlatformFee}
                      onChange={(e) => setAbsorbPlatformFee(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREVIEW */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-2xl font-black text-white tracking-tight">
                  Preview Listing
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Review your details before saving or launching live.
                </p>
              </div>

              {/* Event card details summary */}
              <div className="rounded-3xl border border-white/10 bg-[#0e0e11] overflow-hidden shadow-2xl space-y-6">
                {/* Cover Image mockup */}
                <div className="aspect-[16/9] relative bg-black flex items-center justify-center">
                  {flyerPreview ? (
                    <img
                      src={flyerPreview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-white/25" />
                  )}
                  <div className="absolute top-4 left-4 bg-violet-600 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-full border border-violet-500 shadow-md">
                    Preview Mode
                  </div>
                </div>

                {/* Info details */}
                <div className="px-6 pb-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-heading text-2xl font-black text-white tracking-tight leading-tight">
                      {title || "Untitled Event"}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-col md:grid-col-2 gap-4 text-xs">
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <Calendar className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">
                          Date & Time
                        </span>
                        <span className="text-white/50 mt-0.5 block text-[11px]">
                          {dateTBA
                            ? "TBA (To Be Announced)"
                            : `${startDate} at ${startTime} to ${endDate} at ${endTime}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <MapPin className="h-4.5 w-4.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">
                          Location
                        </span>
                        <span className="text-white/50 mt-0.5 block text-[11px]">
                          {locationTBA
                            ? "TBA (To Be Announced)"
                            : `${venueAddress}, ${city}, ${state}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    {selectedGenres.length > 0 && (
                      <div>
                        <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest block mb-2">
                          Genres
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedGenres.map((g) => (
                            <span
                              key={g}
                              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/70"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVibes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest block mb-2">
                          Vibes
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedVibes.map((v) => (
                            <span
                              key={v}
                              className="px-2.5 py-1 rounded-lg bg-violet-600/10 border border-violet-500/25 text-[10px] font-bold text-violet-300"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tiers summary */}
                  <div className="border-t border-white/10 pt-5 space-y-3">
                    <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest block mb-2">
                      Configured Tiers
                    </span>
                    <div className="space-y-2">
                      {ticketTiers.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#141418] border border-white/5 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">
                              {t.name}
                            </span>
                            <span className="text-white/40 text-[10px] block mt-0.5">
                              {t.tier_type === "table"
                                ? `${t.tableCapacity || "5"} seats`
                                : `Max ${t.maxPerOrder} per order`}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-violet-400 block">
                              {t.price === "0" || !t.price
                                ? "Free"
                                : fmtCurrency(Number(t.price))}
                            </span>
                            <span className="text-[10px] text-white/40 mt-0.5 block">
                              {t.quantity}{" "}
                              {t.tier_type === "table" ? "tables" : "tickets"}{" "}
                              available
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM STEP CONTROLS BAR */}
        <footer className="p-6 border-t border-white/10 bg-[#0c0c0e] flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white hover:bg-violet-500 shadow-lg shadow-violet-600/25 transition"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveEvent(false)}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-[#141418] px-5 py-3 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                >
                  {loading ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEvent(true)}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-xs font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/20 transition disabled:opacity-40"
                >
                  {loading ? "Publishing..." : "Publish Live"}
                </button>
              </>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
