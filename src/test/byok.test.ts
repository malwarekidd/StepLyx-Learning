import { describe, expect, it } from "vitest";

import { ByokError, errorForStatus, maskKey, parseExtraction, parseModelJson, validateByok } from "@/lib/byok";
import { usableLength } from "@/lib/pdf-text";

const kindOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof ByokError ? e.kind : "other";
  }
  return "none";
};

describe("BYOK error handling", () => {
  it("maps 401 to an invalid key error", () => expect(errorForStatus(401).kind).toBe("auth"));
  it("maps 403 to a permission error", () => expect(errorForStatus(403).kind).toBe("forbidden"));
  it("maps 429 to a quota/rate limit error", () => expect(errorForStatus(429).kind).toBe("quota"));
  it("treats Gemini's 400 API_KEY_INVALID as an invalid key", () => expect(errorForStatus(400, "INVALID_ARGUMENT API key not valid").kind).toBe("auth"));
  it("rejects a missing key before any request", () => expect(validateByok({ provider: "gemini", apiKey: " ", model: "m", baseUrl: "" })).not.toBeNull());
  it("rejects a non-https custom endpoint", () =>
    expect(validateByok({ provider: "custom", apiKey: "k", model: "m", baseUrl: "http://api.example.com/v1" })).not.toBeNull());
});

describe("BYOK key masking", () => {
  it("shows only the first and last 4 characters", () => expect(maskKey("sk-abcdefghijklmnop")).toBe("sk-a••••mnop"));
  it("hides short keys completely", () => expect(maskKey("abc123")).toBe("••••••"));
});

describe("BYOK response parsing", () => {
  it("reads JSON wrapped in a markdown fence", () => expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }));
  it("flags malformed JSON", () => expect(kindOf(() => parseModelJson('{"title": "x",'))).toBe("json"));
  it("flags valid JSON with the wrong structure", () => expect(kindOf(() => parseExtraction('{"title":"x","units":[]}'))).toBe("json"));
});

describe("scanned PDF detection", () => {
  it("ignores page markers when measuring text", () => expect(usableLength("[Səhifə 1]\n\n[Səhifə 2]\n")).toBe(0));
});
