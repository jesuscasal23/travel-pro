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
import { useSaveProfile, useExportData, useDeleteAccount } from "@/hooks/api";
import { validate, profileSaveSchema } from "@/lib/api/schemas";
import { useToastStore } from "@/stores/useToastStore";

export default function ProfilePage() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) =>
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  const toast = useToastStore((s) => s.toast);

  const saveMutation = useSaveProfile();
  const exportMutation = useExportData();
  const deleteMutation = useDeleteAccount();

  const {
    nationality,
    homeAirport,
    travelStyle,
    interests,
    pace,
    setNationality,
    setHomeAirport,
    setTravelStyle,
    toggleInterest,
  } = useTripStore();

  const handleSave = () => {
    const fieldErrors = validate(profileSaveSchema, {
      nationality,
      homeAirport,
      travelStyle,
      interests,
    });
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveMutation.mutate(
      { nationality, homeAirport, travelStyle, interests, pace },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
        onError: () =>
          toast({
            title: "Save failed",
            description: "Failed to save profile. Please try again.",
            variant: "error",
          }),
      }
    );
  };

  const handleExportData = () => {
    exportMutation.mutate(undefined, {
      onError: () =>
        toast({
          title: "Export failed",
          description: "Failed to export data. Please try again.",
          variant: "error",
        }),
    });
  };

  const handleDeleteAccount = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("travel-pro-store");
        setDeleteOpen(false);
        router.push("/");
      },
      onError: () =>
        toast({
          title: "Delete failed",
          description: "Failed to delete account. Please try again.",
          variant: "error",
        }),
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={true} />

      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
        <h1 className="text-foreground mb-1 text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Update your travel preferences. Changes apply to all future trips.
        </p>

        <div className="space-y-8">
          {/* Personal */}
          <section className="card-travel p-6">
            <h2 className="text-foreground mb-5 text-base font-semibold">Personal</h2>
            <div className="space-y-4">
              <FormField label="Nationality" error={errors.nationality}>
                <select
                  value={nationality}
                  onChange={(e) => {
                    setNationality(e.target.value);
                    clearError("nationality");
                  }}
                  className={inputClass}
                >
                  {nationalities.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Home Airport" error={errors.homeAirport}>
                <AirportCombobox
                  value={homeAirport}
                  onChange={(v) => {
                    setHomeAirport(v);
                    clearError("homeAirport");
                  }}
                />
              </FormField>
            </div>
          </section>

          {/* Travel Style */}
          <section className="card-travel p-6">
            <h2 className="text-foreground mb-5 text-base font-semibold">Travel Style</h2>
            <TravelStylePicker value={travelStyle} onChange={setTravelStyle} compact />
          </section>

          {/* Interests */}
          <section className="card-travel p-6">
            <h2 className="text-foreground mb-5 text-base font-semibold">Interests</h2>
            <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
          </section>

          {/* Save */}
          <Button onClick={handleSave} loading={saveMutation.isPending} className="w-full">
            {saved ? "Saved!" : "Save changes"}
          </Button>

          {/* Data & Account */}
          <section className="card-travel space-y-4 p-6">
            <h2 className="text-foreground mb-1 text-base font-semibold">Data & Privacy</h2>

            <Button variant="ghost" onClick={handleExportData} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download my data (JSON)
            </Button>

            <Button
              variant="danger-outline"
              onClick={() => setDeleteOpen(true)}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
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
