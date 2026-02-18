"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Download, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ChipGroup } from "@/components/ui/Chip";
import { useTripStore } from "@/stores/useTripStore";
import { nationalities, interestOptions } from "@/data/sampleData";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import type { TravelStyle } from "@/types";

const travelStyles: { id: TravelStyle; emoji: string; label: string }[] = [
  { id: "backpacker", emoji: "🎒", label: "Backpacker" },
  { id: "comfort", emoji: "🛏️", label: "Comfort" },
  { id: "luxury", emoji: "✨", label: "Luxury" },
];

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground";
const labelClass = "block text-sm font-medium text-foreground mb-2";

export default function ProfilePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    // Phase 1: call PATCH /api/v1/profile
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    // Phase 1: call GET /api/v1/profile/export
    const data = { displayName, nationality, homeAirport, travelStyle, interests };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "travel-pro-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    // Phase 1: call DELETE /api/v1/profile
    await new Promise((r) => setTimeout(r, 1000));
    setIsDeleting(false);
    setDeleteOpen(false);
    router.push("/");
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
              <div>
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClass}>
                  {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Home Airport</label>
                <AirportCombobox value={homeAirport} onChange={setHomeAirport} />
              </div>
            </div>
          </section>

          {/* Travel Style */}
          <section className="card-travel p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Travel Style</h2>
            <div className="flex gap-3">
              {travelStyles.map((style) => (
                <button key={style.id} type="button" onClick={() => setTravelStyle(style.id)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${travelStyle === style.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  <div className="text-xl mb-1">{style.emoji}</div>
                  <div className="text-sm font-medium text-foreground">{style.label}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Interests */}
          <section className="card-travel p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">Interests</h2>
            <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
          </section>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full disabled:opacity-60"
          >
            {saved ? "Saved!" : isSaving ? "Saving..." : "Save changes"}
          </button>

          {/* Data & Account */}
          <section className="card-travel p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground mb-1">Data & Privacy</h2>

            <button
              type="button"
              onClick={handleExportData}
              className="btn-ghost w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download my data (JSON)
            </button>

            <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-lg border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete account
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-background rounded-2xl shadow-xl border border-border">
                  <div className="flex items-start justify-between mb-4">
                    <Dialog.Title className="text-lg font-bold text-foreground">
                      Delete account
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-6 ml-4">
                    <li>• Your profile and preferences</li>
                    <li>• All trips and itineraries</li>
                    <li>• Your account login</li>
                  </ul>
                  <p className="text-sm font-medium text-foreground mb-6">
                    This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <Dialog.Close asChild>
                      <button className="btn-ghost flex-1">Cancel</button>
                    </Dialog.Close>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Yes, delete everything"}
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </section>
        </div>
      </div>
    </div>
  );
}
