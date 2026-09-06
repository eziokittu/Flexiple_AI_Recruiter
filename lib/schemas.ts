import { z } from "zod";

export const companyTypeSchema = z.enum(["startup", "scaleup", "enterprise", "agency"]);

export const pastCompanySchema = z.object({
  company: z.string(),
  company_type: companyTypeSchema,
  title: z.string(),
  years: z.number(),
});

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_title: z.string(),
  years_experience: z.number(),
  location: z.string(),
  current_company: z.string(),
  current_company_type: companyTypeSchema,
  skills: z.array(z.string()),
  past_companies: z.array(pastCompanySchema),
  education: z.string(),
  summary: z.string(),
});

export const filterSchema = z.object({
  skills: z.array(z.string()).max(12),
  skillMatch: z.enum(["all", "any"]),
  titles: z.array(z.string()).max(8),
  minimumYearsExperience: z.number().min(0).max(50).nullable(),
  maximumYearsExperience: z.number().min(0).max(50).nullable(),
  locations: z.array(z.string()).max(8),
  companyTypes: z.array(companyTypeSchema),
  companyScope: z.enum(["current", "current_or_past"]),
});

export const rubricCriterionSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(320),
  weight: z.number().int().min(1).max(100),
});

export const searchDefinitionSchema = z.object({
  filters: filterSchema,
  rubric: z.array(rubricCriterionSchema).min(1).max(6),
});

export const scoredCandidateSchema = z.object({
  profileId: z.string(),
  score: z.number().min(0).max(100),
  explanation: z.string().min(1).max(500),
  evidence: z.array(z.string().min(1).max(180)).min(1).max(4),
});

export const rankingSchema = z.object({
  candidates: z.array(scoredCandidateSchema),
});

export const refinementSchema = z.object({
  definition: searchDefinitionSchema,
  summary: z.string().min(1).max(320),
});

export const searchRequestSchema = z.object({
  query: z.string().trim().min(8).max(1000),
  definition: searchDefinitionSchema.optional(),
});

export const refineRequestSchema = z.object({
  query: z.string().trim().min(8).max(1000),
  feedback: z.string().trim().min(2).max(1500),
  definition: searchDefinitionSchema,
  rankedProfileIds: z.array(z.string()).max(48),
});

export type Profile = z.infer<typeof profileSchema>;
export type CompanyType = z.infer<typeof companyTypeSchema>;
export type SearchFilters = z.infer<typeof filterSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type SearchDefinition = z.infer<typeof searchDefinitionSchema>;
export type ScoredCandidate = z.infer<typeof scoredCandidateSchema>;

export type RankedProfile = Profile & ScoredCandidate;

export type SearchRun = {
  definition: SearchDefinition;
  results: RankedProfile[];
  totalProfiles: number;
  filteredCount: number;
  generatedAt: string;
  iteration: number;
  refinementSummary?: string;
};
