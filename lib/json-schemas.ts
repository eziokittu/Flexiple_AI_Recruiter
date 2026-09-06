export const definitionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["filters", "rubric"],
  properties: {
    filters: {
      type: "object",
      additionalProperties: false,
      required: ["skills", "skillMatch", "titles", "minimumYearsExperience", "maximumYearsExperience", "locations", "companyTypes", "companyScope"],
      properties: {
        skills: { type: "array", items: { type: "string" }, maxItems: 12 },
        skillMatch: { type: "string", enum: ["all", "any"] },
        titles: { type: "array", items: { type: "string" }, maxItems: 8 },
        minimumYearsExperience: { anyOf: [{ type: "number" }, { type: "null" }] },
        maximumYearsExperience: { anyOf: [{ type: "number" }, { type: "null" }] },
        locations: { type: "array", items: { type: "string" }, maxItems: 8 },
        companyTypes: { type: "array", items: { type: "string", enum: ["startup", "scaleup", "enterprise", "agency"] } },
        companyScope: { type: "string", enum: ["current", "current_or_past"] },
      },
    },
    rubric: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "weight"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          weight: { type: "integer", minimum: 1, maximum: 100 },
        },
      },
    },
  },
} as const;

export const rankingJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidates"],
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["profileId", "score", "explanation", "evidence"],
        properties: {
          profileId: { type: "string" },
          score: { type: "number", minimum: 0, maximum: 100 },
          explanation: { type: "string" },
          evidence: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
        },
      },
    },
  },
} as const;

export const refinementJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["definition", "summary"],
  properties: {
    definition: definitionJsonSchema,
    summary: { type: "string" },
  },
} as const;
