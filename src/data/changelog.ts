export interface ChangelogSection {
  added?: string[];
  improved?: string[];
  fixed?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection;
}

/**
 * Curated changelog entries, newest first.
 * The first entry's version is treated as the current app version.
 *
 * Use `/draft-changelog` to auto-generate a starting draft from git commits.
 */
export const changelog: ChangelogEntry[] = [
  {
    version: "0.3.0",
    date: "2026-03-28",
    sections: {
      added: [
        "3-dot action menu on trip cards with delete and share (coming soon)",
        "Empty state card on home page when no trips exist",
        "Hotel review scores and review counts alongside star ratings",
      ],
      improved: [
        "Loading spinner in delete confirmation modal until deletion completes",
        "Consolidated shared schema definitions for cleaner codebase",
      ],
      fixed: [
        "What's New modal centering on desktop with scrollbar support",
        "Ref access during render in trip action menu",
      ],
    },
  },
  {
    version: "0.2.1",
    date: "2026-03-28",
    sections: {
      added: [
        "Delete your own trips directly from the trips list",
        "API reference documentation page",
        "Auth required on enrichment and photo endpoints for better security",
      ],
      improved: [
        "Rebranded from Travel Pro to Fichi across the entire app",
        "Error page now shows the reason and lets you copy details for support",
        "Removed dead code and unused exports for a leaner codebase",
        "Client-side error reporting replaced with Sentry for better tracking",
      ],
      fixed: [
        "Fixed a crash that could trap you on an error page after deleting all trips",
        "Deleting a trip now properly clears cached cart, booking, and trip data",
      ],
    },
  },
  {
    version: "0.2.0",
    date: "2026-03-28",
    sections: {
      added: [
        "Per-trip budget breakdown with real cost data",
        "Flight and hotel selection with a shopping cart",
        "What's New modal so you never miss an update",
      ],
      improved: [
        "Hotel star ratings shown as icons instead of numbers",
        "Faster image loading for activity cards",
        "Authenticated users now land on the home dashboard",
      ],
    },
  },
  {
    version: "0.1.0",
    date: "2026-03-28",
    sections: {
      added: [
        "Plan multi-city trips with an interactive questionnaire",
        "AI-powered activity discovery for each city",
        "Flight price optimization with real-time search",
        "Hotel search and booking integration",
        "Visa and weather enrichment for your destinations",
        "Share your itinerary with a public link",
        "What's New modal so you never miss an update",
      ],
    },
  },
];

/** The current app version, derived from the latest changelog entry. */
export const currentAppVersion = changelog[0].version;

/** Returns all changelog entries the user hasn't seen yet. */
export function getMissedEntries(lastSeenVersion: string | null): ChangelogEntry[] {
  if (!lastSeenVersion) return changelog;

  const entries: ChangelogEntry[] = [];
  for (const entry of changelog) {
    if (entry.version === lastSeenVersion) break;
    entries.push(entry);
  }
  return entries;
}
