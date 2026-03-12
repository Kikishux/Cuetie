import { describe, it, expect } from "vitest";
import { getPartnerName } from "@/lib/ai/name-pools";

describe("getPartnerName", () => {
  it("returns null when dating preference is undefined", () => {
    expect(getPartnerName(undefined, 0)).toBeNull();
  });

  it("returns null when dating preference is 'no-preference'", () => {
    expect(getPartnerName("no-preference", 0)).toBeNull();
  });

  it("returns a female name when preference is 'female'", () => {
    const name = getPartnerName("female", 0);
    expect(name).toBeTruthy();
    expect(typeof name).toBe("string");
  });

  it("returns a male name when preference is 'male'", () => {
    const name = getPartnerName("male", 0);
    expect(name).toBeTruthy();
    expect(typeof name).toBe("string");
  });

  it("returns a non-binary name when preference is 'non-binary'", () => {
    const name = getPartnerName("non-binary", 0);
    expect(name).toBeTruthy();
  });

  it("returns a name for genderqueer preference", () => {
    const name = getPartnerName("genderqueer", 0);
    expect(name).toBeTruthy();
  });

  it("returns deterministic names for the same scenario index", () => {
    const name1 = getPartnerName("female", 3);
    const name2 = getPartnerName("female", 3);
    expect(name1).toBe(name2);
  });

  it("returns different names for different scenario indices", () => {
    const name1 = getPartnerName("female", 0);
    const name2 = getPartnerName("female", 1);
    expect(name1).not.toBe(name2);
  });

  it("wraps around when index exceeds pool size", () => {
    const name1 = getPartnerName("male", 0);
    const name2 = getPartnerName("male", 10);
    expect(name1).toBe(name2);
  });
});
