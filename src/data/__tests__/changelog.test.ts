// @vitest-environment node
import { describe, it, expect } from "vitest";
import { changelog, currentAppVersion, getMissedEntries } from "@/data/changelog";

describe("changelog data", () => {
  it("has at least one entry", () => {
    expect(changelog.length).toBeGreaterThanOrEqual(1);
  });

  it("each entry has a valid semver-ish version and date", () => {
    for (const entry of changelog) {
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("each entry has at least one section with items", () => {
    for (const entry of changelog) {
      const { added, improved, fixed } = entry.sections;
      const totalItems = (added?.length ?? 0) + (improved?.length ?? 0) + (fixed?.length ?? 0);
      expect(totalItems).toBeGreaterThan(0);
    }
  });

  it("versions are unique", () => {
    const versions = changelog.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
  });
});

describe("currentAppVersion", () => {
  it("equals the first changelog entry's version", () => {
    expect(currentAppVersion).toBe(changelog[0].version);
  });
});

describe("getMissedEntries", () => {
  it("returns all entries when lastSeen is null", () => {
    expect(getMissedEntries(null)).toEqual(changelog);
  });

  it("returns empty array when lastSeen matches current version", () => {
    expect(getMissedEntries(currentAppVersion)).toEqual([]);
  });

  it("returns entries newer than lastSeen version", () => {
    // Test against real data: if there's only one entry, seeing it means nothing missed
    if (changelog.length === 1) {
      expect(getMissedEntries(changelog[0].version)).toHaveLength(0);
    } else {
      const lastEntry = changelog[changelog.length - 1];
      const missed = getMissedEntries(lastEntry.version);
      expect(missed).toHaveLength(changelog.length - 1);
      expect(missed[0].version).toBe(changelog[0].version);
    }
  });

  it("returns all entries when lastSeen version is not found", () => {
    expect(getMissedEntries("99.99.99")).toEqual(changelog);
  });
});
