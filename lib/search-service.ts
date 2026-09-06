import { filterProfiles } from "@/lib/filter-profiles";
import { generateStructured, LlmError } from "@/lib/gemini";
import { definitionJsonSchema, rankingJsonSchema, refinementJsonSchema } from "@/lib/json-schemas";
import {
  buildDefinitionPrompt,
  buildRankingPrompt,
  buildRefinementPrompt,
  RANKING_SYSTEM_PROMPT,
  REFINEMENT_SYSTEM_PROMPT,
  SEARCH_ARCHITECT_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { profiles, profilesByIds } from "@/lib/profiles";
import {
  rankingSchema,
  refinementSchema,
  searchDefinitionSchema,
  type Profile,
  type RankedProfile,
  type SearchDefinition,
  type SearchRun,
} from "@/lib/schemas";

function normalizeWeights(definition: SearchDefinition): SearchDefinition {
  const total = definition.rubric.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (total === 100) return definition;

  let assigned = 0;
  const rubric = definition.rubric.map((criterion, index) => {
    const weight = index === definition.rubric.length - 1
      ? 100 - assigned
      : Math.max(1, Math.round((criterion.weight / total) * 100));
    assigned += weight;
    return { ...criterion, weight };
  });
  return searchDefinitionSchema.parse({ ...definition, rubric });
}

async function rankProfiles(query: string, definition: SearchDefinition, candidates: Profile[]): Promise<RankedProfile[]> {
  if (candidates.length === 0) return [];

  const ranking = await generateStructured({
    systemPrompt: RANKING_SYSTEM_PROMPT,
    prompt: buildRankingPrompt(query, definition, candidates),
    jsonSchema: rankingJsonSchema,
    schema: rankingSchema,
    temperature: 0.1,
  });

  const allowed = new Map(candidates.map((profile) => [profile.id, profile]));
  const seen = new Set<string>();
  const ranked: RankedProfile[] = [];

  for (const score of ranking.candidates) {
    const profile = allowed.get(score.profileId);
    if (!profile || seen.has(score.profileId)) continue;
    seen.add(score.profileId);
    ranked.push({ ...profile, ...score });
  }

  if (ranked.length !== candidates.length) {
    throw new LlmError(
      "The model omitted or duplicated candidates. The incomplete ranking was rejected; please try again.",
      502,
      "INCOMPLETE_RANKING",
    );
  }

  return ranked.sort((a, b) => b.score - a.score);
}

export async function executeSearch(query: string, suppliedDefinition?: SearchDefinition): Promise<SearchRun> {
  const definition = normalizeWeights(
    suppliedDefinition ?? await generateStructured({
      systemPrompt: SEARCH_ARCHITECT_SYSTEM_PROMPT,
      prompt: buildDefinitionPrompt(query, profiles),
      jsonSchema: definitionJsonSchema,
      schema: searchDefinitionSchema,
    }),
  );

  const filtered = filterProfiles(profiles, definition.filters);
  const results = await rankProfiles(query, definition, filtered);

  return {
    definition,
    results,
    totalProfiles: profiles.length,
    filteredCount: filtered.length,
    generatedAt: new Date().toISOString(),
    iteration: suppliedDefinition ? 1 : 0,
  };
}

export async function refineSearch(options: {
  query: string;
  feedback: string;
  definition: SearchDefinition;
  rankedProfileIds: string[];
}): Promise<SearchRun> {
  const context = profilesByIds(options.rankedProfileIds).sort(
    (a, b) => options.rankedProfileIds.indexOf(a.id) - options.rankedProfileIds.indexOf(b.id),
  );
  const refinement = await generateStructured({
    systemPrompt: REFINEMENT_SYSTEM_PROMPT,
    prompt: buildRefinementPrompt(options.query, options.definition, options.feedback, context, profiles),
    jsonSchema: refinementJsonSchema,
    schema: refinementSchema,
  });
  const definition = normalizeWeights(refinement.definition);
  const filtered = filterProfiles(profiles, definition.filters);
  const results = await rankProfiles(options.query, definition, filtered);

  return {
    definition,
    results,
    totalProfiles: profiles.length,
    filteredCount: filtered.length,
    generatedAt: new Date().toISOString(),
    iteration: 1,
    refinementSummary: refinement.summary,
  };
}
