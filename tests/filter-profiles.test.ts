import { describe, expect, it } from "vitest";
import { filterProfiles } from "@/lib/filter-profiles";
import { profiles } from "@/lib/profiles";
import type { SearchFilters } from "@/lib/schemas";

const emptyFilters: SearchFilters = {
  skills: [],
  skillMatch: "all",
  titles: [],
  minimumYearsExperience: null,
  maximumYearsExperience: null,
  locations: [],
  companyTypes: [],
  companyScope: "current_or_past",
};

describe("filterProfiles", () => {
  it("returns the complete local pool when no objective filters are active", () => {
    expect(filterProfiles(profiles, emptyFilters)).toHaveLength(48);
  });

  it("finds the six literal matches for the assignment example", () => {
    const result = filterProfiles(profiles, {
      ...emptyFilters,
      skills: ["AWS RDS"],
      minimumYearsExperience: 4,
      maximumYearsExperience: 7,
      locations: ["Bangalore"],
      companyTypes: ["startup"],
    });

    expect(result.map((profile) => profile.id)).toEqual(["p01", "p02", "p03", "p04", "p05", "p06"]);
  });

  it("normalizes common location and skill aliases", () => {
    const result = filterProfiles(profiles, {
      ...emptyFilters,
      skills: ["RDS"],
      locations: ["Bengaluru"],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((profile) => profile.location === "Bangalore")).toBe(true);
    expect(result.every((profile) => profile.skills.includes("AWS RDS"))).toBe(true);
  });

  it("distinguishes current-company filtering from career-history filtering", () => {
    const currentOnly = filterProfiles(profiles, {
      ...emptyFilters,
      companyTypes: ["startup"],
      companyScope: "current",
    });
    const currentOrPast = filterProfiles(profiles, {
      ...emptyFilters,
      companyTypes: ["startup"],
      companyScope: "current_or_past",
    });

    expect(currentOrPast.length).toBeGreaterThan(currentOnly.length);
  });
});
