import type { Profile, SearchDefinition } from "@/lib/schemas";

export const SEARCH_ARCHITECT_SYSTEM_PROMPT = `You are a careful technical recruiter turning a free-text sourcing request into objective filters and a subjective fit rubric.

Rules:
- Only create an objective filter when the recruiter stated or strongly implied it.
- Put preferences and nuanced signals in the rubric instead of over-filtering.
- Skills must use common canonical labels such as "AWS RDS", "PostgreSQL", or "Node.js".
- "Worked at" a company type means current_or_past. "Currently at" means current.
- Only add a title filter when the request names a recognizable job-title family. A technology followed by "developer" (for example, "RDS developer") is a skill requirement, not necessarily a literal title.
- Use the supplied dataset vocabulary for objective values so a filter can match real records.
- Rubric weights must be positive integers and should total 100.
- Keep the rubric to 3-5 distinct, auditable criteria.
- Never invent criteria unrelated to the request.`;

function datasetVocabulary(allProfiles: Profile[]) {
  return {
    locations: [...new Set(allProfiles.map((profile) => profile.location))].sort(),
    titles: [...new Set(allProfiles.map((profile) => profile.current_title))].sort(),
    skills: [...new Set(allProfiles.flatMap((profile) => profile.skills))].sort(),
    companyTypes: [...new Set(allProfiles.map((profile) => profile.current_company_type))].sort(),
  };
}

export function buildDefinitionPrompt(query: string, allProfiles: Profile[]): string {
  return `Create the search definition for this recruiter request:\n\n${query}\n\nAvailable objective-filter vocabulary:\n${JSON.stringify(datasetVocabulary(allProfiles), null, 2)}`;
}

export const RANKING_SYSTEM_PROMPT = `You are ranking an already objectively-filtered set of candidate profiles against a recruiter rubric.

Rules:
- Return exactly one result for every supplied profile ID, with no unknown or duplicate IDs.
- Score from 0 to 100 using the rubric weights.
- Rank strong evidence, not prestige, assumptions, or generic praise.
- Every explanation and evidence item must cite facts explicitly present in that candidate's supplied fields.
- Do not infer protected characteristics or facts not in the profile.
- Keep explanations concise and specific.`;

export function buildRankingPrompt(query: string, definition: SearchDefinition, candidates: Profile[]): string {
  return `Original recruiter request:\n${query}\n\nFit rubric:\n${JSON.stringify(definition.rubric, null, 2)}\n\nProfiles to score:\n${JSON.stringify(candidates, null, 2)}`;
}

export const REFINEMENT_SYSTEM_PROMPT = `You refine a structured talent search after recruiter feedback.

Rules:
- Treat explicit feedback as the strongest signal.
- Make the smallest useful change to filters and/or rubric.
- Do not silently remove an original hard requirement unless feedback clearly contradicts it.
- Objective facts belong in filters; subjective preferences belong in the rubric.
- Rubric weights must be positive integers and should total 100.
- Summarize exactly what changed and why in one short sentence.
- Candidate numbers in feedback refer to their position in the supplied ranked context.`;

export function buildRefinementPrompt(
  query: string,
  definition: SearchDefinition,
  feedback: string,
  rankedContext: Profile[],
  allProfiles: Profile[],
): string {
  const conciseContext = rankedContext.map((profile, index) => ({
    rank: index + 1,
    id: profile.id,
    name: profile.name,
    current_title: profile.current_title,
    years_experience: profile.years_experience,
    location: profile.location,
    current_company_type: profile.current_company_type,
    skills: profile.skills,
    past_companies: profile.past_companies,
  }));

  return `Original request:\n${query}\n\nCurrent search definition:\n${JSON.stringify(definition, null, 2)}\n\nAvailable objective-filter vocabulary:\n${JSON.stringify(datasetVocabulary(allProfiles), null, 2)}\n\nCurrent ranked candidate context:\n${JSON.stringify(conciseContext, null, 2)}\n\nRecruiter feedback:\n${feedback}`;
}
