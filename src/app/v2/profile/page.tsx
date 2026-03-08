"use client";

import {
  Clock,
  Leaf,
  UtensilsCrossed,
  Camera,
  Sparkles,
  MessageSquare,
  UserCog,
  FileText,
  Shield,
  CreditCard,
  Compass,
  Code2,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import type { LucideIcon } from "lucide-react";

const tags = [
  { label: "Avg. Trip: 14 Days", icon: Clock },
  { label: "Nature Lover", icon: Leaf },
  { label: "Foodie", icon: UtensilsCrossed },
  { label: "Photography", icon: Camera },
];

const accountItems: { icon: LucideIcon; label: string }[] = [
  { icon: UserCog, label: "Personal Info" },
  { icon: FileText, label: "Travel Documents" },
  { icon: Shield, label: "Login & Security" },
  { icon: CreditCard, label: "Payments" },
];

const prefItems: { icon: LucideIcon; label: string }[] = [
  { icon: Compass, label: "Travel DNA" },
  { icon: Code2, label: "System Architecture" },
  { icon: Settings, label: "App Settings" },
];

function MenuSection({
  title,
  items,
}: {
  title: string;
  items: { icon: LucideIcon; label: string }[];
}) {
  return (
    <div className="mt-6 px-6">
      <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-wider uppercase">{title}</p>
      <div className="border-v2-border divide-v2-border divide-y rounded-xl border bg-white">
        {items.map((item) => (
          <div key={item.label} className="flex cursor-pointer items-center gap-4 px-4 py-4">
            <item.icon size={20} className="text-v2-text-muted shrink-0" />
            <span className="text-v2-navy flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight size={16} className="text-v2-text-light shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Profile header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-v2-surface flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h1 className="text-v2-navy text-xl font-bold">Alex Doe</h1>
              <p className="text-v2-text-muted text-sm">Global Citizen &bull; 12 Countries</p>
            </div>
          </div>
        </div>

        {/* Tag chips */}
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

        {/* Help card */}
        <div className="bg-v2-navy relative mx-6 mb-6 overflow-hidden rounded-2xl p-6">
          <Sparkles size={48} className="absolute top-2 right-2 text-white/10" />
          <div className="bg-v2-pink/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <MessageSquare size={20} className="text-v2-pink" />
          </div>
          <p className="mt-3 text-lg font-bold text-white">Need Help?</p>
          <p className="mt-1 text-sm text-white/70">
            Chat with your personal travel assistant for support.
          </p>
          <span className="text-v2-navy mt-4 inline-block cursor-pointer rounded-lg bg-white px-4 py-2.5 text-xs font-bold">
            START CHAT
          </span>
        </div>

        {/* Account section */}
        <MenuSection title="ACCOUNT" items={accountItems} />

        {/* Preferences section */}
        <MenuSection title="PREFERENCES" items={prefItems} />

        {/* Sign out */}
        <div className="mt-6 mb-6 flex cursor-pointer items-center justify-center gap-2 px-6">
          <LogOut size={16} className="text-v2-red" />
          <span className="text-v2-red text-sm font-bold">SIGN OUT</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
