"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CreditCard,
  FileText,
  Leaf,
  Loader2,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  UtensilsCrossed,
  Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { InterestSelector } from "@/components/profile/InterestSelector";
import { PaceSelector } from "@/components/profile/PaceSelector";
import { ProfileBasicsFields } from "@/components/profile/ProfileBasicsFields";
import { TravelStyleSelector } from "@/components/profile/TravelStyleSelector";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import { DevelopmentTag } from "@/components/v2/ui/DevelopmentTag";
import { MenuSection } from "@/components/v2/profile/MenuSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useAuthStatus,
  useDeleteAccount,
  useExportData,
  useProfile,
  useSaveProfile,
} from "@/hooks/api";
import { useTripStore } from "@/stores/useTripStore";
import { createClient } from "@/lib/supabase/client";
import { travelStyles } from "@/data/travelStyles";
import { hasInterest, normalizeInterests } from "@/lib/profile/interests";

const accountItems: { icon: LucideIcon; label: string; isMock?: boolean }[] = [
  { icon: FileText, label: "Travel Documents", isMock: true },
  { icon: Shield, label: "Login & Security", isMock: true },
  { icon: CreditCard, label: "Payments", isMock: true },
];

const prefItems: { icon: LucideIcon; label: string; isMock?: boolean }[] = [
  { icon: Settings, label: "App Settings", isMock: true },
];

export default function ProfilePage() {
  const router = useRouter();
  const isAuth = useAuthStatus();
  const { data: persistedProfile, isLoading: isProfileLoading } = useProfile({
    enabled: isAuth === true,
  });
  const saveProfileMutation = useSaveProfile();
  const exportDataMutation = useExportData();
  const deleteAccountMutation = useDeleteAccount();

  const nationality = useTripStore((s) => s.nationality);
  const setNationality = useTripStore((s) => s.setNationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const setHomeAirport = useTripStore((s) => s.setHomeAirport);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const setTravelStyle = useTripStore((s) => s.setTravelStyle);
  const interests = useTripStore((s) => s.interests);
  const toggleInterest = useTripStore((s) => s.toggleInterest);
  const pace = useTripStore((s) => s.pace);
  const setPace = useTripStore((s) => s.setPace);

  const [displayName, setDisplayName] = useState("Traveler");
  const [email, setEmail] = useState("");
  const [profileEditorOverride, setProfileEditorOverride] = useState<boolean | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setDisplayName(
          user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "Traveler"
        );
        setEmail(user.email ?? "");
      }
    }

    if (isAuth) {
      void loadUser();
    }
  }, [isAuth]);

  useEffect(() => {
    if (!persistedProfile) return;

    useTripStore.setState({
      nationality: persistedProfile.nationality,
      homeAirport: persistedProfile.homeAirport,
      travelStyle: persistedProfile.travelStyle,
      interests: normalizeInterests(persistedProfile.interests),
      pace: persistedProfile.pace ?? "moderate",
    });
  }, [persistedProfile]);

  const defaultIsEditingProfile = isAuth === true && !isProfileLoading && persistedProfile === null;
  const isEditingProfile = profileEditorOverride ?? defaultIsEditingProfile;

  const styleLabel =
    travelStyles.find((style) => style.id === travelStyle)?.label ?? "Smart Budget";

  const tags: { label: string; icon: LucideIcon }[] = [];
  tags.push({ label: styleLabel, icon: Sparkles });
  if (pace === "active") tags.push({ label: "Fast Explorer", icon: Clock });
  else if (pace === "relaxed") tags.push({ label: "Slow Traveler", icon: Leaf });
  else tags.push({ label: "Balanced Pace", icon: Clock });

  if (hasInterest(interests, "food")) tags.push({ label: "Foodie", icon: UtensilsCrossed });
  if (hasInterest(interests, "photography")) tags.push({ label: "Photography", icon: Camera });
  if (hasInterest(interests, "nature")) tags.push({ label: "Nature Lover", icon: Leaf });

  async function handleSaveProfile() {
    try {
      await saveProfileMutation.mutateAsync({
        nationality,
        homeAirport,
        travelStyle,
        interests,
        pace,
        onboardingCompleted: true,
      });
      setFeedback("Travel profile saved.");
      setProfileEditorOverride(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to save profile.");
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccountMutation.mutateAsync();
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.replace("/get-started");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to delete account.");
      setIsDeleteOpen(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    useTripStore.getState().resetAll();
    router.push("/get-started");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-v2-surface flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-v2-navy text-xl font-bold">{displayName}</h1>
                <DevelopmentTag label="Profile beta" />
              </div>
              {email && <p className="text-v2-text-muted text-sm">{email}</p>}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="bg-v2-chip-bg border-v2-border text-v2-navy flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                <tag.icon size={12} className="text-v2-text-muted" />
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-v2-navy text-lg font-bold">Travel Profile</h2>
                {isAuth && persistedProfile ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Saved
                  </span>
                ) : null}
              </div>
              <p className="text-v2-text-muted mt-1 text-sm">
                Used for visa checks, flights, and more relevant itinerary generation.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setProfileEditorOverride((value) => !(value ?? defaultIsEditingProfile))
              }
              className="text-brand-primary text-sm font-semibold"
            >
              {isEditingProfile ? "Close" : "Edit"}
            </button>
          </div>

          {isAuth === true && isProfileLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Loading saved profile...
            </div>
          )}

          {feedback && <p className="mt-4 text-sm text-slate-600">{feedback}</p>}

          {!isEditingProfile && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Nationality</span>
                <span className="text-v2-navy font-semibold">{nationality || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Home airport</span>
                <span className="text-v2-navy font-semibold">{homeAirport || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Travel style</span>
                <span className="text-v2-navy font-semibold">{styleLabel}</span>
              </div>
            </div>
          )}

          {isEditingProfile && (
            <div className="mt-5 space-y-5">
              <ProfileBasicsFields
                nationality={nationality}
                homeAirport={homeAirport}
                onNationalityChange={(value) => {
                  setNationality(value);
                  setFeedback(null);
                }}
                onHomeAirportChange={(value) => {
                  setHomeAirport(value);
                  setFeedback(null);
                }}
              />

              <section>
                <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
                  Travel Style
                </p>
                <TravelStyleSelector
                  value={travelStyle}
                  onChange={(value) => {
                    setTravelStyle(value);
                    setFeedback(null);
                  }}
                />
              </section>

              <section>
                <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
                  Trip Pace
                </p>
                <PaceSelector
                  value={pace}
                  onChange={(value) => {
                    setPace(value);
                    setFeedback(null);
                  }}
                />
              </section>

              <section>
                <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
                  Interests
                </p>
                <InterestSelector
                  selected={interests}
                  onToggle={(value) => {
                    toggleInterest(value);
                    setFeedback(null);
                  }}
                />
              </section>

              {isAuth ? (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={
                    !nationality ||
                    !homeAirport ||
                    saveProfileMutation.isPending ||
                    isProfileLoading
                  }
                  className="bg-v2-navy disabled:bg-v2-navy/40 w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
                >
                  {saveProfileMutation.isPending ? "Saving..." : "Save Travel Profile"}
                </button>
              ) : (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  These preferences stay on this device until you sign in.
                </div>
              )}
            </div>
          )}
        </div>

        {isAuth && (
          <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-v2-navy text-lg font-bold">Account Data</h2>
                <p className="text-v2-text-muted mt-1 text-sm">
                  These actions already use live backend endpoints.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => void exportDataMutation.mutateAsync()}
                disabled={exportDataMutation.isPending}
                className="border-v2-border text-v2-navy w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold disabled:opacity-60"
              >
                {exportDataMutation.isPending ? "Preparing export..." : "Export my data"}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="w-full rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-700"
              >
                Delete account
              </button>
            </div>
          </div>
        )}

        <div className="bg-v2-navy relative mx-6 mb-6 overflow-hidden rounded-2xl p-6">
          <Sparkles size={48} className="absolute top-2 right-2 text-white/10" />
          <div className="bg-v2-pink/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <MessageSquare size={20} className="text-v2-pink" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <p className="text-lg font-bold text-white">Need Help?</p>
            <DevelopmentTag label="Mock" className="border-white/20 bg-white/15 text-white" />
          </div>
          <p className="mt-1 text-sm text-white/70">
            Chat with your personal travel assistant for support.
          </p>
          <span className="text-v2-navy mt-4 inline-block cursor-pointer rounded-lg bg-white px-4 py-2.5 text-xs font-bold">
            START CHAT
          </span>
        </div>

        <MenuSection title="ACCOUNT" items={accountItems} />
        <MenuSection title="PREFERENCES" items={prefItems} />

        {isAuth && (
          <div
            className="mt-6 mb-6 flex cursor-pointer items-center justify-center gap-2 px-6"
            onClick={handleSignOut}
          >
            <LogOut size={16} className="text-v2-red" />
            <span className="text-v2-red text-sm font-bold">SIGN OUT</span>
          </div>
        )}
      </div>

      <BottomNav />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete account?"
        description="This will permanently remove your profile and trips."
        items={[
          "Your saved travel profile",
          "Your trips and itinerary history",
          "Any shareable links",
        ]}
        warning="This action cannot be undone."
        confirmLabel="Delete account"
        loading={deleteAccountMutation.isPending}
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  );
}
