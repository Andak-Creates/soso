"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  User,
  Building2,
  Users,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Search,
  FileCheck,
  Clock,
  Upload,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  initialProfile: any;
  onProfileUpdated?: (updatedProfile: any) => void;
}

// Unsigned Cloudinary upload helper
const uploadToCloudinary = async (
  file: File,
  folder = "profiles"
): Promise<string> => {
  const url = `https://api.cloudinary.com/v1_1/djfhbkxst/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "parties_app_media");
  formData.append("folder", folder);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Image upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  initialProfile,
  onProfileUpdated,
}: ProfileModalProps) {
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const hostAvatarInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"personal" | "brands" | "team" | "verification">("personal");

  // Personal profile state
  const [fullName, setFullName] = useState(initialProfile?.full_name || "");
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialProfile?.avatar_url || "");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState(false);

  // Host Profiles / Brands state
  const [hostProfiles, setHostProfiles] = useState<any[]>([]);
  const [loadingHostProfiles, setLoadingHostProfiles] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandBio, setBrandBio] = useState("");
  const [brandAvatarUrl, setBrandAvatarUrl] = useState("");
  const [brandAvatarFile, setBrandAvatarFile] = useState<File | null>(null);
  const [brandAvatarPreview, setBrandAvatarPreview] = useState("");
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  // Team / Admins state
  const [teamAdmins, setTeamAdmins] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedProfileForAdmins, setSelectedProfileForAdmins] = useState<string>("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  // ID Verification state
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "not_submitted" | "pending" | "approved" | "rejected">("idle");
  const [verificationRejectionReason, setVerificationRejectionReason] = useState<string | null>(null);
  const [verIdType, setVerIdType] = useState("");
  const [verIdImageFile, setVerIdImageFile] = useState<File | null>(null);
  const [verIdImagePreview, setVerIdImagePreview] = useState("");
  const [verFullName, setVerFullName] = useState(initialProfile?.full_name || "");
  const [verPhone, setVerPhone] = useState(initialProfile?.phone || "");
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const verIdInputRef = React.useRef<HTMLInputElement>(null);

  const fetchVerificationStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("host_verified_at, host_verification_status")
        .eq("id", user.id)
        .single();
      const { data: verData } = await supabase
        .from("host_verifications")
        .select("status, rejection_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData?.host_verified_at || profileData?.host_verification_status === "approved") {
        setVerificationStatus("approved");
      } else if (verData?.status === "pending") {
        setVerificationStatus("pending");
      } else if (verData?.status === "rejected") {
        setVerificationStatus("rejected");
        setVerificationRejectionReason(verData.rejection_reason || null);
      } else {
        setVerificationStatus("not_submitted");
      }
    } catch (err) {
      console.error("Error fetching verification status:", err);
      setVerificationStatus("not_submitted");
    }
  }, [supabase, user]);

  const fetchTeamAdmins = useCallback(async (hostProfileId: string) => {
    if (!hostProfileId) return;
    setLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from("host_admins")
        .select("id, user_id, role, profile:profiles!user_id(id, username, full_name, avatar_url, phone)")
        .eq("host_profile_id", hostProfileId);

      if (error) {
        console.warn("Could not query host_admins with join:", error);
        // Fallback: fetch raw host_admins
        const { data: rawAdmins } = await supabase
          .from("host_admins")
          .select("*")
          .eq("host_profile_id", hostProfileId);
        setTeamAdmins(rawAdmins || []);
      } else {
        setTeamAdmins(data || []);
      }
    } catch (err) {
      console.error("Error fetching team admins:", err);
    } finally {
      setLoadingTeam(false);
    }
  }, [supabase]);

  const fetchHostProfiles = useCallback(async () => {
    if (!user) return;
    setLoadingHostProfiles(true);
    try {
      const { data, error } = await supabase
        .from("host_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .is("deletion_requested_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHostProfiles(data || []);
      if (data && data.length > 0) {
        setSelectedProfileForAdmins(data[0].id);
        fetchTeamAdmins(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching host profiles:", err);
    } finally {
      setLoadingHostProfiles(false);
    }
  }, [supabase, user, fetchTeamAdmins]);

  useEffect(() => {
    if (isOpen && user) {
      fetchHostProfiles();
      fetchVerificationStatus();
    }
  }, [isOpen, user, fetchHostProfiles, fetchVerificationStatus]);

  const handleVerIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerIdImageFile(file);
      setVerIdImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!verIdType) { alert("Please select an ID type."); return; }
    if (!verIdImageFile) { alert("Please upload a photo of your ID."); return; }
    if (!verFullName.trim()) { alert("Please enter your full legal name."); return; }
    setSubmittingVerification(true);
    try {
      const idImageUrl = await uploadToCloudinary(verIdImageFile, `host-verifications/${user.id}`);
      await supabase.from("host_verifications").upsert({
        user_id: user.id,
        id_type: verIdType,
        id_image_url: idImageUrl,
        full_name: verFullName.trim(),
        phone: verPhone.trim() || null,
        status: "pending",
      }, { onConflict: "user_id" });
      await supabase.from("profiles").update({ host_verification_status: "pending" }).eq("id", user.id);
      setVerificationStatus("pending");
    } catch (err: any) {
      alert(err.message || "Failed to submit verification. Please try again.");
    } finally {
      setSubmittingVerification(false);
    }
  };



  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBrandAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandAvatarFile(file);
      setBrandAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingPersonal(true);
    setPersonalSuccess(false);

    try {
      let finalAvatar = avatarUrl;
      if (avatarFile) {
        finalAvatar = await uploadToCloudinary(avatarFile, `user-avatars/${user.id}`);
      }

      const updates = {
        full_name: fullName.trim(),
        username: username.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        avatar_url: finalAvatar || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setAvatarUrl(finalAvatar);
      setPersonalSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated({ ...initialProfile, ...updates });
      }
      setTimeout(() => setPersonalSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleOpenBrandModal = (brand?: any) => {
    if (brand) {
      setSelectedBrand(brand);
      setBrandName(brand.name);
      setBrandBio(brand.bio || "");
      setBrandAvatarUrl(brand.avatar_url || "");
      setBrandAvatarPreview(brand.avatar_url || "");
    } else {
      setSelectedBrand(null);
      setBrandName("");
      setBrandBio("");
      setBrandAvatarUrl("");
      setBrandAvatarPreview("");
    }
    setBrandAvatarFile(null);
    setIsEditingBrand(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !brandName.trim()) return;
    setSavingBrand(true);

    try {
      let finalAvatar = brandAvatarUrl;
      if (brandAvatarFile) {
        finalAvatar = await uploadToCloudinary(brandAvatarFile, `host-profiles/${user.id}`);
      }

      if (selectedBrand) {
        // Update
        const { error } = await supabase
          .from("host_profiles")
          .update({
            name: brandName.trim(),
            bio: brandBio.trim() || null,
            avatar_url: finalAvatar || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedBrand.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("host_profiles").insert({
          owner_id: user.id,
          name: brandName.trim(),
          bio: brandBio.trim() || null,
          avatar_url: finalAvatar || null,
        });

        if (error) throw error;
      }

      setIsEditingBrand(false);
      fetchHostProfiles();
    } catch (err: any) {
      alert("Failed to save host brand: " + err.message);
    } finally {
      setSavingBrand(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setUserSearchResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddAdmin = async (targetUser: any) => {
    if (!selectedProfileForAdmins) {
      alert("Please select a Host Brand first.");
      return;
    }
    setAddingAdmin(true);
    try {
      const { error } = await supabase.from("host_admins").insert({
        host_profile_id: selectedProfileForAdmins,
        user_id: targetUser.id,
        role: "admin",
      });

      if (error) {
        if (error.code === "23505") {
          alert("This user is already an admin on this brand.");
        } else {
          throw error;
        }
      } else {
        setUserSearchQuery("");
        setUserSearchResults([]);
        fetchTeamAdmins(selectedProfileForAdmins);
      }
    } catch (err: any) {
      alert("Failed to add admin: " + err.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;
    try {
      const { error } = await supabase
        .from("host_admins")
        .delete()
        .eq("id", adminId);

      if (error) throw error;
      fetchTeamAdmins(selectedProfileForAdmins);
    } catch (err: any) {
      alert("Failed to remove admin: " + err.message);
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
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Account & Host Profile
              </h2>
              <p className="text-xs text-white/40">
                Manage your credentials, host entities, and team access
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-[#111114]">
          {[
            { id: "personal", label: "My Profile", icon: User },
            { id: "brands", label: "Host Brands", icon: Building2 },
            { id: "team", label: "Team & Admins", icon: Users },
            { id: "verification", label: "ID Verify", icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
                  active
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PERSONAL PROFILE */}
          {activeTab === "personal" && (
            <form onSubmit={handleSavePersonal} className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <img
                    src={
                      avatarPreview ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"
                    }
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-violet-500/40 bg-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Profile Photo</h4>
                  <p className="text-xs text-white/40 mt-0.5">
                    Recommended 400x400 PNG or JPG
                  </p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                  >
                    Upload new photo
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alexj"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 xxx xxxx xxxx"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white/40 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">
                  Bio / About
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your attendees about yourself..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none"
                />
              </div>

              {personalSuccess && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  Profile updated successfully!
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-700/20 disabled:opacity-50"
                >
                  {savingPersonal ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: HOST BRANDS & ENTITIES */}
          {activeTab === "brands" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Your Host Entities</h4>
                  <p className="text-xs text-white/40">
                    Host entities appear as the official organiser on your Bhind event listings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBrandModal()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-600/30 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Brand
                </button>
              </div>

              {loadingHostProfiles ? (
                <div className="py-12 flex justify-center text-violet-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : hostProfiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/[0.02]">
                  <Building2 className="h-8 w-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white/60">No host brands created yet</p>
                  <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">
                    Create a brand profile (e.g. &apos;TheScene Events&apos;) to host public and private parties on Bhind.
                  </p>
                  <button
                    onClick={() => handleOpenBrandModal()}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create First Brand
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {hostProfiles.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            brand.avatar_url ||
                            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150"
                          }
                          alt={brand.name}
                          className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {brand.name}
                            </span>
                            {brand.is_verified && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                Verified
                              </span>
                            )}
                          </div>
                          {brand.bio && (
                            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">
                              {brand.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenBrandModal(brand)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submodal for Create / Edit Host Brand */}
              {isEditingBrand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                  <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131317] p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading text-base font-bold text-white">
                        {selectedBrand ? "Edit Host Brand" : "Create Host Brand"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsEditingBrand(false)}
                        className="text-white/40 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveBrand} className="space-y-4">
                      {/* Avatar */}
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            brandAvatarPreview ||
                            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150"
                          }
                          alt="Brand Avatar"
                          className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <button
                            type="button"
                            onClick={() => hostAvatarInputRef.current?.click()}
                            className="text-xs font-semibold text-violet-400 hover:text-violet-300"
                          >
                            Upload Brand Logo
                          </button>
                          <input
                            ref={hostAvatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBrandAvatarSelect}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          Brand / Entity Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g. Lagos Nightlife Co."
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          Bio / Description
                        </label>
                        <textarea
                          rows={2}
                          value={brandBio}
                          onChange={(e) => setBrandBio(e.target.value)}
                          placeholder="Short summary of this brand..."
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingBrand(false)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingBrand}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500 transition disabled:opacity-50"
                        >
                          {savingBrand ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : selectedBrand ? (
                            "Save Brand"
                          ) : (
                            "Create Brand"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM & CO-ADMINS */}
          {/* TAB 4: ID VERIFICATION */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Host ID Verification</h3>
                <p className="text-xs text-white/40 mt-0.5">Verify your identity to earn the verified host badge and unlock payouts.</p>
              </div>

              {verificationStatus === "approved" && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-400">Verified Host ✓</h4>
                  <p className="text-xs text-white/40 max-w-xs">Your identity has been verified. Your profile displays the verified badge.</p>
                </div>
              )}

              {verificationStatus === "pending" && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
                    <Clock className="h-8 w-8 text-amber-400" />
                  </div>
                  <h4 className="text-base font-bold text-amber-400">Under Review</h4>
                  <p className="text-xs text-white/40 max-w-xs">We received your documents and are reviewing them. This usually takes 1–2 business days.</p>
                </div>
              )}

              {verificationStatus === "rejected" && (
                <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5 mb-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-red-400">Verification Rejected</h4>
                      {verificationRejectionReason && <p className="text-xs text-white/50 mt-0.5">{verificationRejectionReason}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mt-2">Please re-submit with a clearer document.</p>
                </div>
              )}

              {(verificationStatus === "not_submitted" || verificationStatus === "rejected") && (
                <form onSubmit={handleSubmitVerification} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2">Government ID Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["National ID (NIN)", "Driver's License", "International Passport", "Voter's Card"].map((idType) => (
                        <button key={idType} type="button" onClick={() => setVerIdType(idType)}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-bold text-left transition ${verIdType === idType ? "border-violet-500 bg-violet-600/20 text-violet-300" : "border-white/10 bg-white/5 text-white/50 hover:text-white"}`}
                        >{idType}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Full Legal Name *</label>
                    <input type="text" required value={verFullName} onChange={(e) => setVerFullName(e.target.value)}
                      placeholder="As it appears on your ID"
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Phone Number</label>
                    <input type="tel" value={verPhone} onChange={(e) => setVerPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full rounded-xl border border-white/10 bg-[#141418] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2">Upload ID Photo *</label>
                    <input ref={verIdInputRef} type="file" accept="image/*" onChange={handleVerIdSelect} className="hidden" />
                    {verIdImagePreview ? (
                      <div className="relative">
                        <img src={verIdImagePreview} alt="ID preview" className="w-full h-44 object-cover rounded-2xl border border-white/10" />
                        <button type="button" onClick={() => { setVerIdImageFile(null); setVerIdImagePreview(""); }}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => verIdInputRef.current?.click()}
                        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] py-8 hover:border-violet-500/50 transition">
                        <Upload className="h-7 w-7 text-white/30" />
                        <span className="text-xs font-semibold text-white/40">Click to upload ID image</span>
                        <span className="text-[10px] text-white/25">JPG or PNG, max 5MB</span>
                      </button>
                    )}
                  </div>

                  <button type="submit" disabled={submittingVerification}
                    className="w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
                    {submittingVerification
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                      : <><FileCheck className="h-4 w-4" /> Submit for Verification</>
                    }
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-5">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Select Host Brand
                </label>
                <select
                  value={selectedProfileForAdmins}
                  onChange={(e) => {
                    setSelectedProfileForAdmins(e.target.value);
                    fetchTeamAdmins(e.target.value);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#16161b] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition"
                >
                  {hostProfiles.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#16161b] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Co-Admin / Door Staff */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                  Invite / Add Team Member
                </h5>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search by username or name to add..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500 transition"
                  />
                </div>

                {searchingUsers && (
                  <div className="text-xs text-white/40 flex items-center gap-2 py-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching users...
                  </div>
                )}

                {userSearchResults.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-[#16161a] divide-y divide-white/5 overflow-hidden">
                    {userSearchResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 hover:bg-white/5 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              u.avatar_url ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"
                            }
                            alt={u.username}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              {u.full_name || u.username}
                            </span>
                            <span className="text-[10px] text-white/40">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddAdmin(u)}
                          disabled={addingAdmin}
                          className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-violet-500 transition disabled:opacity-50"
                        >
                          Add Admin
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Team List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Active Team Members ({teamAdmins.length})
                </h5>

                {loadingTeam ? (
                  <div className="py-6 flex justify-center text-violet-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : teamAdmins.length === 0 ? (
                  <p className="text-xs text-white/30 italic py-2">
                    No team members assigned to this brand yet.
                  </p>
                ) : (
                  <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
                    {teamAdmins.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.profile?.avatar_url ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"
                            }
                            alt="Admin avatar"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {item.profile?.full_name || item.profile?.username || "Admin"}
                              </span>
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-400 border border-violet-500/20 uppercase">
                                {item.role || "Admin"}
                              </span>
                            </div>
                            <span className="text-[10px] text-white/40">
                              @{item.profile?.username}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAdmin(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                          title="Remove admin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
