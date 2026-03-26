"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Headphones,
  Loader2,
  LogOut,
  Pencil,
  PlaneTakeoff,
  Settings,
  Shield,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";
import { InterestSelector } from "@/components/profile/InterestSelector";
import { PaceSelector } from "@/components/profile/PaceSelector";
import { ProfileBasicsFields } from "@/components/profile/ProfileBasicsFields";
import { TravelStyleSelector } from "@/components/profile/TravelStyleSelector";
import { AppScreen } from "@/components/ui/AppScreen";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useAuthStatus,
  useDeleteAccount,
  useExportData,
  useSaveProfile,
  useTravelerPreferences,
} from "@/hooks/api";
import { useTripStore } from "@/stores/useTripStore";
import { createClient } from "@/lib/core/supabase-client";
import { travelStyles } from "@/data/travelStyles";
import { hasInterest } from "@/lib/features/profile/interests";
import {
  DEFAULT_TRAVELER_PREFERENCES,
  toTravelerPreferences,
  toggleTravelerPreferenceInterest,
  type TravelerPreferences,
} from "@/lib/features/profile/traveler-preferences";

const menuItems = [
  { icon: FileText, label: "Travel Documents" },
  { icon: Shield, label: "Login & Security" },
  { icon: CreditCard, label: "Payments" },
  { icon: SlidersHorizontal, label: "App Settings" },
];

export default function ProfilePage() {
  const router = useRouter();
  const isAuth = useAuthStatus();
  const travelerPreferencesQuery = useTravelerPreferences({ includeTransientFallback: true });
  const persistedProfile = travelerPreferencesQuery.hasServerProfile
    ? travelerPreferencesQuery.data
    : null;
  const isProfileLoading = isAuth === true ? travelerPreferencesQuery.isLoading : false;
  const saveProfileMutation = useSaveProfile();
  const exportDataMutation = useExportData();
  const deleteAccountMutation = useDeleteAccount();

  const [displayName, setDisplayName] = useState("Traveler");
  const [email, setEmail] = useState("");
  const [profileEditorOverride, setProfileEditorOverride] = useState<boolean | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<TravelerPreferences | null>(null);

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

  const defaultIsEditingProfile = isAuth === true && !isProfileLoading && persistedProfile === null;
  const isEditingProfile = profileEditorOverride ?? defaultIsEditingProfile;
  const formState = draftState ?? travelerPreferencesQuery.data ?? DEFAULT_TRAVELER_PREFERENCES;

  const syncGuestPreferences = (next: TravelerPreferences) => {
    if (isAuth === true) return;

    useTripStore.setState({
      nationality: next.nationality,
      homeAirport: next.homeAirport,
      travelStyle: next.travelStyle,
      interests: next.interests,
      pace: next.pace,
      vibes: next.vibes ?? null,
    });
  };

  const updateFormState = (patch: Partial<TravelerPreferences>) => {
    setDraftState((currentDraft) => {
      const current = currentDraft ?? formState;
      const next = toTravelerPreferences({ ...current, ...patch });
      syncGuestPreferences(next);
      return next;
    });
  };

  const styleLabel =
    travelStyles.find((style) => style.id === formState.travelStyle)?.label ?? "Smart Budget";

  const tags: string[] = [];
  tags.push(styleLabel);
  if (formState.pace === "active") tags.push("Fast Explorer");
  else if (formState.pace === "relaxed") tags.push("Slow Traveler");
  else tags.push("Balanced Pace");
  if (hasInterest(formState.interests, "food")) tags.push("Foodie");
  if (hasInterest(formState.interests, "photography")) tags.push("Photography");
  if (hasInterest(formState.interests, "nature")) tags.push("Nature Lover");

  // Extract airport display info
  const airportCode = formState.homeAirport?.match(/^[A-Z]{3}/)?.[0] ?? "";
  const airportName = formState.homeAirport
    ? formState.homeAirport.replace(/^[A-Z]{3}\s*-\s*/, "").replace(/\s*\(.*\)$/, "")
    : "";

  async function handleSaveProfile() {
    try {
      const response = await saveProfileMutation.mutateAsync({
        nationality: formState.nationality,
        homeAirport: formState.homeAirport,
        travelStyle: formState.travelStyle,
        interests: formState.interests,
        pace: formState.pace,
        vibes: formState.vibes,
        onboardingCompleted: true,
      });
      const next = toTravelerPreferences(
        response.profile ?? { ...formState, onboardingCompleted: true }
      );
      setDraftState(next);
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
    <AppScreen>
      {/* Sticky Header */}
      <header className="dark:bg-card/85 shadow-glass-xs sticky top-0 z-40 bg-white/85 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <AppLogo size={40} />
            <span className="text-ink font-display text-2xl font-bold tracking-tight">Profile</span>
          </div>
          <button className="text-foreground/80 hover:bg-surface-soft flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95">
            <Settings size={20} />
          </button>
        </div>
        <div className="bg-edge h-px w-full" />
      </header>

      <main className="px-6 pt-8">
        {/* User Identity Header */}
        <section className="flex flex-col items-center space-y-4 text-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full shadow-lg ring-4 ring-white">
              <div className="bg-surface-soft flex h-full w-full items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
            </div>
            <button className="bg-brand-primary absolute right-0 bottom-0 rounded-full border-2 border-white p-2 text-white shadow-lg active:scale-90">
              <Pencil size={12} />
            </button>
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-foreground text-2xl font-extrabold tracking-tight">
              {displayName}
            </h2>
            {email && <p className="text-dim text-sm font-medium">{email}</p>}
          </div>
          {/* Interest Tags */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border-edge/30 text-foreground rounded-full border bg-white px-4 py-1.5 text-xs font-semibold shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Travel Profile Card */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-dim text-[10px] font-bold tracking-widest uppercase">
              Travel Profile
            </h3>
            <div className="flex items-center gap-2">
              {isAuth && persistedProfile && (
                <span className="text-brand-primary flex items-center gap-1 text-[10px] font-bold">
                  <Check size={14} className="fill-brand-primary text-white" />
                  SAVED
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  setProfileEditorOverride((value) => !(value ?? defaultIsEditingProfile))
                }
                className="text-brand-primary text-[10px] font-bold tracking-wider uppercase"
              >
                {isEditingProfile ? "Close" : "Edit"}
              </button>
            </div>
          </div>

          {isAuth === true && isProfileLoading && (
            <div className="text-dim flex items-center gap-2 rounded-xl bg-white p-5 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading saved profile...
            </div>
          )}

          {feedback && <p className="text-dim rounded-xl bg-white px-5 py-3 text-sm">{feedback}</p>}

          {!isEditingProfile && (
            <div className="border-edge/10 space-y-4 rounded-xl border bg-white p-5 shadow-[0_4px_12px_rgba(44,47,49,0.03)]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-dim text-[10px] font-bold tracking-tight uppercase">
                    Nationality
                  </p>
                  <p className="text-foreground text-sm font-semibold">
                    {formState.nationality || "Not set"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-dim text-[10px] font-bold tracking-tight uppercase">
                    Travel style
                  </p>
                  <p className="text-foreground text-sm font-semibold">{styleLabel}</p>
                </div>
              </div>

              <div className="border-edge/10 space-y-1 border-t pt-4">
                <p className="text-dim text-[10px] font-bold tracking-tight uppercase">
                  Home airport
                </p>
                <div className="flex items-center gap-3">
                  <div className="bg-surface-soft flex h-10 w-10 items-center justify-center rounded-lg">
                    <PlaneTakeoff size={20} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-bold">
                      {formState.homeAirport
                        ? `${airportCode}${airportName ? ` - ${airportName}` : ""}`
                        : "Not set"}
                    </p>
                    {formState.homeAirport && (
                      <p className="text-dim text-[11px]">
                        {formState.homeAirport.match(/\(([^)]+)\)/)?.[1] ?? ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEditingProfile && (
            <div className="border-edge/10 space-y-5 rounded-xl border bg-white p-5 shadow-[0_4px_12px_rgba(44,47,49,0.03)]">
              <ProfileBasicsFields
                nationality={formState.nationality}
                homeAirport={formState.homeAirport}
                onNationalityChange={(value) => {
                  updateFormState({ nationality: value });
                  setFeedback(null);
                }}
                onHomeAirportChange={(value) => {
                  updateFormState({ homeAirport: value });
                  setFeedback(null);
                }}
              />

              <section>
                <p className="text-dim mb-3 text-xs font-bold tracking-[0.22em] uppercase">
                  Travel Style
                </p>
                <TravelStyleSelector
                  value={formState.travelStyle}
                  onChange={(value) => {
                    updateFormState({ travelStyle: value });
                    setFeedback(null);
                  }}
                />
              </section>

              <section>
                <p className="text-dim mb-3 text-xs font-bold tracking-[0.22em] uppercase">
                  Trip Pace
                </p>
                <PaceSelector
                  value={formState.pace}
                  onChange={(value) => {
                    updateFormState({ pace: value });
                    setFeedback(null);
                  }}
                />
              </section>

              <section>
                <p className="text-dim mb-3 text-xs font-bold tracking-[0.22em] uppercase">
                  Interests
                </p>
                <InterestSelector
                  selected={formState.interests}
                  onToggle={(value) => {
                    setDraftState((currentDraft) => {
                      const current = currentDraft ?? formState;
                      const next = toTravelerPreferences({
                        ...current,
                        interests: toggleTravelerPreferenceInterest(current.interests, value),
                      });
                      syncGuestPreferences(next);
                      return next;
                    });
                    setFeedback(null);
                  }}
                />
              </section>

              {isAuth ? (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={
                    !formState.nationality ||
                    !formState.homeAirport ||
                    saveProfileMutation.isPending ||
                    isProfileLoading
                  }
                  className="bg-brand-primary w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
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
        </section>

        {/* Account & Preferences Menu */}
        <section className="space-y-3">
          <h3 className="text-dim px-1 text-[10px] font-bold tracking-widest uppercase">
            Account & Preferences
          </h3>
          <div className="border-edge/10 overflow-hidden rounded-xl border bg-white shadow-[0_4px_12px_rgba(44,47,49,0.03)]">
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                className={`hover:bg-surface-soft flex w-full items-center justify-between p-4 transition-colors ${
                  i > 0 ? "border-edge/10 border-t" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} className="text-dim" />
                  <span className="text-foreground text-sm font-medium">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-dim" />
              </button>
            ))}
          </div>
        </section>

        {/* Need Help Card */}
        <section className="from-brand-primary shadow-brand-primary/20 relative overflow-hidden rounded-2xl bg-gradient-to-br to-[#7b9cff] p-6 text-white shadow-xl">
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div>
              <h3 className="font-display text-lg font-bold">Need Help?</h3>
              <p className="max-w-[200px] text-sm text-white/80">
                Our travel experts are ready to assist you 24/7.
              </p>
            </div>
            <button className="text-brand-primary rounded-full bg-white px-6 py-2.5 text-xs font-bold tracking-wider uppercase shadow-lg active:scale-95">
              Start Chat
            </button>
          </div>
          <Headphones
            size={120}
            strokeWidth={1}
            className="absolute -right-4 -bottom-4 rotate-12 text-white opacity-10"
          />
        </section>

        {/* Account Data / Danger Zone */}
        {isAuth && (
          <section className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => void exportDataMutation.mutateAsync()}
              disabled={exportDataMutation.isPending}
              className="bg-surface-soft text-foreground hover:bg-edge/30 flex w-full items-center justify-center gap-2 rounded-xl p-4 text-sm font-bold transition-colors disabled:opacity-60"
            >
              <Download size={18} />
              {exportDataMutation.isPending ? "Preparing export..." : "Export my data"}
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="text-app-red hover:bg-app-red/5 flex w-full items-center justify-center gap-2 rounded-xl p-4 text-sm font-bold transition-colors"
            >
              <Trash2 size={18} />
              Delete account
            </button>
          </section>
        )}

        {/* Sign Out */}
        {isAuth && (
          <div className="flex justify-center pb-4">
            <button
              onClick={handleSignOut}
              className="text-dim hover:text-app-red flex items-center gap-2 text-sm font-bold transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </main>

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
    </AppScreen>
  );
}
