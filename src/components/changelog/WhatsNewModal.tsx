"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Sparkles, Wrench, Bug } from "lucide-react";
import {
  currentAppVersion,
  getMissedEntries,
  type ChangelogEntry,
} from "@/data/changelog";
import { useProfile } from "@/hooks/api";
import { useMarkChangelogSeen } from "@/hooks/api/profile/useMarkChangelogSeen";
import { useAuthStatus } from "@/hooks/api/auth/useAuthStatus";

const sectionConfig = {
  added: { icon: Sparkles, label: "New", color: "text-app-green" },
  improved: { icon: Wrench, label: "Improved", color: "text-brand-primary" },
  fixed: { icon: Bug, label: "Fixed", color: "text-accent" },
} as const;

type SectionKey = keyof typeof sectionConfig;

export function WhatsNewModal() {
  const isAuth = useAuthStatus();
  const { data: profile } = useProfile({ enabled: isAuth === true });
  const markSeen = useMarkChangelogSeen();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    const lastSeen = profile.lastSeenAppVersion;
    if (lastSeen === currentAppVersion) return;

    const missed = getMissedEntries(lastSeen ?? null);
    if (missed.length > 0) {
      setEntries(missed);
      setOpen(true);
    }
  }, [profile]);

  function handleDismiss(isOpen: boolean) {
    if (!isOpen) {
      setOpen(false);
      // Fire-and-forget — if it fails, they'll just see the modal again
      markSeen.mutate(currentAppVersion);
    }
  }

  if (!open || entries.length === 0) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleDismiss}
      title="What's New"
      maxWidth="max-w-md"
      mobileSheet
    >
      <div className="scrollbar-hide max-h-[60vh] space-y-6 overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.version}>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-ink text-sm font-bold">v{entry.version}</span>
              <span className="text-label text-xs">{entry.date}</span>
            </div>
            <div className="space-y-3">
              {(Object.keys(sectionConfig) as SectionKey[]).map((key) => {
                const items = entry.sections[key];
                if (!items || items.length === 0) return null;
                const { icon: Icon, label, color } = sectionConfig[key];
                return (
                  <div key={key}>
                    <div className={`mb-1.5 flex items-center gap-1.5 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {items.map((item) => (
                        <li
                          key={item}
                          className="text-prose flex items-start gap-2 text-sm"
                        >
                          <span className="text-label mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-current" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
