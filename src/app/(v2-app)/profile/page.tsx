"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import { useAuthStatus } from "@/hooks/api";
import { useTripStore } from "@/stores/useTripStore";
import { createClient } from "@/lib/supabase/client";
import { travelStyles } from "@/data/travelStyles";
import type { LucideIcon } from "lucide-react";

const accountItems: { icon: LucideIcon; label: string }[] = [
  { icon: UserCog, label: "Personal Info" },
  { icon: FileText, label: "Travel Documents" },
  { icon: Shield, label: "Login & Security" },
  { icon: CreditCard, label: "Payments" },
];

const prefItems: { icon: LucideIcon; label: string; href?: string }[] = [
  { icon: Compass, label: "Travel DNA", href: "/onboarding/preferences" },
  { icon: Settings, label: "App Settings" },
];

function MenuSection({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: { icon: LucideIcon; label: string; href?: string }[];
  onItemClick?: (href: string) => void;
}) {
  return (
    <div className="mt-6 px-6">
      <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-wider uppercase">{title}</p>
      <div className="border-v2-border divide-v2-border divide-y rounded-xl border bg-white">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex cursor-pointer items-center gap-4 px-4 py-4"
            onClick={() => item.href && onItemClick?.(item.href)}
          >
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
  const router = useRouter();
  const isAuth = useAuthStatus();
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const pace = useTripStore((s) => s.pace);

  const [displayName, setDisplayName] = useState("Traveler");
  const [email, setEmail] = useState("");

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
    if (isAuth) void loadUser();
  }, [isAuth]);

  const styleLabel = travelStyles.find((s) => s.id === travelStyle)?.label ?? "Comfort";

  // Build dynamic tag chips from actual profile data
  const tags: { label: string; icon: LucideIcon }[] = [];
  tags.push({ label: styleLabel, icon: Sparkles });
  if (pace === "active") tags.push({ label: "Fast Explorer", icon: Clock });
  else if (pace === "relaxed") tags.push({ label: "Slow Traveler", icon: Leaf });
  else tags.push({ label: "Balanced Pace", icon: Clock });

  if (interests.includes("Food")) tags.push({ label: "Foodie", icon: UtensilsCrossed });
  if (interests.includes("Photography")) tags.push({ label: "Photography", icon: Camera });
  if (interests.includes("Nature")) tags.push({ label: "Nature Lover", icon: Leaf });

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/get-started");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Profile header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-v2-surface flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h1 className="text-v2-navy text-xl font-bold">{displayName}</h1>
              {email && <p className="text-v2-text-muted text-sm">{email}</p>}
              {!isAuth && (
                <button
                  onClick={() => router.push("/login?next=/profile")}
                  className="text-v2-orange mt-1 text-sm font-semibold"
                >
                  Sign in to save your profile
                </button>
              )}
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
        <MenuSection
          title="ACCOUNT"
          items={accountItems}
          onItemClick={(href) => router.push(href)}
        />

        {/* Preferences section */}
        <MenuSection
          title="PREFERENCES"
          items={prefItems}
          onItemClick={(href) => router.push(href)}
        />

        {/* Sign out */}
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
    </div>
  );
}
