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
