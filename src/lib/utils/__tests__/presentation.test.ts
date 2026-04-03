import { describe, expect, it } from "vitest";
import { buildTripPresentation } from "../trip/presentation";

describe("buildTripPresentation", () => {
  it("prefers destination for summary cards", () => {
    expect(
      buildTripPresentation({
        destination: "Lisbon",
        region: "Portugal",
      }).destinationLabel
    ).toBe("Lisbon");
  });

  it("uses route cities for multi-city trip titles", () => {
    expect(
      buildTripPresentation({
        route: [
          { city: "Tokyo", country: "Japan" },
          { city: "Kyoto", country: "Japan" },
          { city: "Bangkok", country: "Thailand" },
        ],
      }).tripTitle
    ).toBe("Tokyo → Kyoto → Bangkok");
  });

  it("falls back to region when no destination or route exists", () => {
    expect(
      buildTripPresentation({
        region: "Southeast Asia",
      }).destinationLabel
    ).toBe("Southeast Asia");
  });
});
