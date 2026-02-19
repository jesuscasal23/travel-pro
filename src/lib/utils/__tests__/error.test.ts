// @vitest-environment node
import { describe, it, expect } from "vitest";
import { getErrorMessage } from "../error";

describe("getErrorMessage", () => {
  it("extracts message from Error instance", () => {
    expect(getErrorMessage(new Error("something broke"))).toBe("something broke");
  });

  it("extracts message from TypeError", () => {
    expect(getErrorMessage(new TypeError("type error"))).toBe("type error");
  });

  it("converts string to string", () => {
    expect(getErrorMessage("raw string error")).toBe("raw string error");
  });

  it("converts number to string", () => {
    expect(getErrorMessage(404)).toBe("404");
  });

  it("converts null to string", () => {
    expect(getErrorMessage(null)).toBe("null");
  });

  it("converts undefined to string", () => {
    expect(getErrorMessage(undefined)).toBe("undefined");
  });

  it("converts object to string", () => {
    expect(getErrorMessage({ code: "ERR" })).toBe("[object Object]");
  });
});
