"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button, ChipGroup, FormField, ConfirmDialog } from "@/components/ui";
import { useTripStore } from "@/stores/useTripStore";
import { interestOptions } from "@/data/sampleData";
import { nationalities } from "@/data/nationalities";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { TravelStylePicker } from "@/components/TravelStylePicker";
import { inputClass } from "@/components/auth/auth-styles";
import { useSaveProfile, useExportData, useDeleteAccount } from "@/hooks/api/useProfile";
import { validate, profileSaveSchema } from "@/lib/validation/schemas";
import { useToastStore } from "@/stores/useToastStore";

export default function ProfilePage() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) => setErrors(prev => { const { [field]: _, ...rest } = prev; return rest; });
  const toast = useToastStore((s) => s.toast);

  const saveMutation = useSaveProfile();
  const exportMutation = useExportData();
  const deleteMutation = useDeleteAccount();

  const {
    displayName,
    nationality,
    homeAirport,
    travelStyle,
    interests,
    setDisplayName,
    setNationality,
    setHomeAirport,
    setTravelStyle,
    toggleInterest,
  } = useTripStore();

  const handleSave = () => {
    const fieldErrors = validate(profileSaveSchema, { nationality, homeAirport, travelStyle, interests });
    if (fieldErrors) { setErrors(fieldErrors); return; }
    setErrors({});
    saveMutation.mutate(
      { nationality, homeAirport, travelStyle, interests },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
        onError: () => toast({ title: "Save failed", description: "Failed to save profile. Please try again.", variant: "error" }),
      },
    );
  };

  const handleExportData = () => {
    exportMutation.mutate(undefined, {
      onError: () => toast({ title: "Export failed", description: "Failed to export data. Please try again.", variant: "error" }),
    });
  };

  const handleDeleteAccount = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("travel-pro-store");
        setDeleteOpen(false);
        router.push("/");
      },
      onError: () => toast({ title: "Delete failed", description: "Failed to delete account. Please try again.", variant: "error" }),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl font-bold text-foreground mb-1">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Update your travel preferences. Changes apply to all future trips.
        </p>

        <div className="space-y-8">
          {/* Personal */}
          <section className="card-travel p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Personal</h2>
            <div className="space-y-4">
              <FormField label="First name">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Nationality" error={errors.nationality}>
                <select value={nationality} onChange={(e) => { setNationality(e.target.value); clearError("nationality"); }} className={inputClass}>
                  {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </FormField>
              <FormField label="Home Airport">
                <AirportCombobox value={homeAirport} onChange={setHomeAirport} />
              </FormField>
            </div>
          </section>

          {/* Travel Style */}
          <section className="card-travel p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Travel Style</h2>
            <TravelStylePicker value={travelStyle} onChange={setTravelStyle} compact />
          </section>

          {/* Interests */}
          <section className="card-travel p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Interests</h2>
            <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
          </section>

          {/* Save */}
          <Button
            onClick={handleSave}
            loading={saveMutation.isPending}
            className="w-full"
          >
            {saved ? "Saved!" : "Save changes"}
          </Button>

          {/* Data & Account */}
          <section className="card-travel p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground mb-1">Data & Privacy</h2>

            <Button variant="ghost" onClick={handleExportData} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download my data (JSON)
            </Button>

            <Button
              variant="danger-outline"
              onClick={() => setDeleteOpen(true)}
              className="w-full gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete account
            </Button>

            <ConfirmDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title="Delete account"
              description="This will permanently delete:"
              items={[
                "Your profile and preferences",
                "All trips and itineraries",
                "Your account login",
              ]}
              warning="This action cannot be undone."
              confirmLabel={deleteMutation.isPending ? "Deleting..." : "Yes, delete everything"}
              confirmVariant="danger"
              loading={deleteMutation.isPending}
              onConfirm={handleDeleteAccount}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
