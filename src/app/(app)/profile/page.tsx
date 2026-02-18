"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ChipGroup } from "@/components/ui/Chip";
import { useTripStore } from "@/stores/useTripStore";
import { interestOptions } from "@/data/sampleData";
import { nationalities } from "@/data/nationalities";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { TravelStylePicker } from "@/components/TravelStylePicker";
import { Modal } from "@/components/ui/Modal";
import { inputClass, labelClass } from "@/components/auth/auth-styles";
import type { TravelStyle } from "@/types";

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
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationality, homeAirport, travelStyle, interests }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/v1/profile/export");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "travel-pro-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      localStorage.removeItem("travel-pro-store");
      setDeleteOpen(false);
      router.push("/");
    } catch {
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
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
            <TravelStylePicker value={travelStyle} onChange={setTravelStyle} compact />
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
            </Dialog.Root>

            <Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete account">
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
                <button type="button" onClick={() => setDeleteOpen(false)} className="btn-ghost flex-1">Cancel</button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete everything"}
                </button>
              </div>
            </Modal>
          </section>
        </div>
      </div>
    </div>
  );
}
