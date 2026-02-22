import { describe, it, expect } from "vitest";
import { getCategoryStyle, getCategoryEmoji } from "../category-colors";

describe("getCategoryStyle", () => {
  it("returns style for known categories", () => {
    const categories = ["culture", "explore", "food", "art", "nightlife", "nature", "transport", "adventure", "wellness"];

    for (const cat of categories) {
      const style = getCategoryStyle(cat);
      expect(style.bgClass).toBeTruthy();
      expect(style.textClass).toBeTruthy();
      expect(style.strokeHsl).toContain("hsl");
      expect(style.bgHsl).toContain("hsl");
      expect(style.badgeBg).toBeTruthy();
    }
  });

  it("is case-insensitive", () => {
    expect(getCategoryStyle("Culture")).toEqual(getCategoryStyle("culture"));
    expect(getCategoryStyle("FOOD")).toEqual(getCategoryStyle("food"));
  });

  it("returns default gray style for unknown category", () => {
    const style = getCategoryStyle("unknown-category");
    expect(style.bgClass).toBe("bg-gray-500");
    expect(style.textClass).toContain("gray");
  });

  it("returns distinct colors for different categories", () => {
    const culture = getCategoryStyle("culture");
    const food = getCategoryStyle("food");
    const nature = getCategoryStyle("nature");

    // Each should have different bg colors
    expect(culture.bgClass).not.toBe(food.bgClass);
    expect(food.bgClass).not.toBe(nature.bgClass);
    expect(culture.strokeHsl).not.toBe(food.strokeHsl);
  });

  it("returns correct teal style for culture category", () => {
    const style = getCategoryStyle("culture");
    expect(style.bgClass).toBe("bg-teal-500");
    expect(style.badgeBg).toBe("bg-teal-600");
  });

  it("returns correct amber style for food category", () => {
    const style = getCategoryStyle("food");
    expect(style.bgClass).toBe("bg-amber-500");
    expect(style.badgeBg).toBe("bg-amber-500");
  });
});

describe("getCategoryEmoji", () => {
  it("returns correct emoji for each known category", () => {
    expect(getCategoryEmoji("culture")).toBe("🏛️");
    expect(getCategoryEmoji("food")).toBe("🍜");
    expect(getCategoryEmoji("transport")).toBe("🚆");
    expect(getCategoryEmoji("nature")).toBe("🌿");
  });

  it("is case-insensitive", () => {
    expect(getCategoryEmoji("Culture")).toBe("🏛️");
    expect(getCategoryEmoji("FOOD")).toBe("🍜");
  });

  it("returns fallback emoji for unknown category", () => {
    expect(getCategoryEmoji("unknown")).toBe("📍");
  });
});
