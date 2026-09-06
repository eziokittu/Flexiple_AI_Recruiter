import type { Profile, SearchFilters } from "@/lib/schemas";

const aliases: Record<string, string> = {
  bengaluru: "bangalore",
  rds: "aws rds",
  postgres: "postgresql",
  js: "javascript",
  ts: "typescript",
};

function normalize(value: string): string {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ");
  return aliases[normalized] ?? normalized;
}

function looselyMatches(actual: string, requested: string): boolean {
  const left = normalize(actual);
  const right = normalize(requested);
  return left === right || left.includes(right);
}

export function filterProfiles(allProfiles: Profile[], filters: SearchFilters): Profile[] {
  return allProfiles.filter((profile) => {
    if (
      filters.minimumYearsExperience !== null &&
      profile.years_experience < filters.minimumYearsExperience
    ) return false;

    if (
      filters.maximumYearsExperience !== null &&
      profile.years_experience > filters.maximumYearsExperience
    ) return false;

    if (
      filters.locations.length > 0 &&
      !filters.locations.some((location) => looselyMatches(profile.location, location))
    ) return false;

    if (
      filters.titles.length > 0 &&
      !filters.titles.some((title) => looselyMatches(profile.current_title, title))
    ) return false;

    if (filters.skills.length > 0) {
      const matchSkill = (skill: string) => profile.skills.some((candidateSkill) => looselyMatches(candidateSkill, skill));
      const skillsMatch = filters.skillMatch === "all"
        ? filters.skills.every(matchSkill)
        : filters.skills.some(matchSkill);
      if (!skillsMatch) return false;
    }

    if (filters.companyTypes.length > 0) {
      const currentMatch = filters.companyTypes.includes(profile.current_company_type);
      const pastMatch = profile.past_companies.some((company) => filters.companyTypes.includes(company.company_type));
      const companyMatch = filters.companyScope === "current" ? currentMatch : currentMatch || pastMatch;
      if (!companyMatch) return false;
    }

    return true;
  });
}
