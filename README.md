# Sift — AI sourcing refinement loop

A focused implementation of Flexiple's engineering assignment: a recruiter describes a role in free text, reviews transparent filters and a fit rubric, reacts to ranked profiles, and iterates until the search is frozen.

## Stack

- Next.js 16 App Router and TypeScript
- Gemini Developer API through server-only route handlers
- Zod validation for requests and every model response
- Local filtering over the supplied 48 fictional profiles
- Plain CSS with bundled Inter and Fraunces variable fonts
- Vitest for deterministic filter coverage

## Run locally

Requirements: Node.js 20.19 or newer and a Gemini API key.

1. Create a free API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Install dependencies and create your local environment file:

   ```powershell
   npm install
   Copy-Item .env.example .env.local
   ```

3. Replace `your_key_here` in `.env.local`, then run:

   ```powershell
   npm run dev
   ```

4. Open `http://localhost:3000`.

The required variable is `GEMINI_API_KEY`. `GEMINI_MODEL` is optional and defaults to `gemini-3.1-flash-lite`, which currently has free-tier availability. Quotas and model availability can change, so confirm the selected model in AI Studio before the walkthrough.

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel.
2. Add `GEMINI_API_KEY` under **Project → Settings → Environment Variables** for Production and Preview.
3. Optionally add `GEMINI_MODEL` to override the default.
4. Deploy. No database, storage, or custom build command is required.

The API key has no `NEXT_PUBLIC_` prefix and is read only inside route handlers, so it is not included in the browser bundle.

## Product flow

1. `/api/search` asks Gemini to translate free text into objective filters and a weighted rubric.
2. The app validates that structure before showing it to the recruiter.
3. Objective filters run deterministically against `data/profiles.json`.
4. Gemini scores every remaining profile against the visible rubric and returns evidence tied to profile fields.
5. The recruiter can edit criteria directly, mark profiles yes/no, and add written feedback.
6. `/api/refine` makes the smallest useful criteria change, then filters and ranks again.
7. Freeze locks the current criteria and displays the complete ranked shortlist.

No candidate data or search state is persisted between browser sessions.

## Prompts and structured output

All evaluated prompts are readable in `lib/prompts.ts`. JSON response contracts are in `lib/json-schemas.ts`, with independent runtime validation in `lib/schemas.ts`.

Model calls use a 24-second timeout. Missing or invalid keys, timeouts, rate limits, malformed JSON, invalid structures, incomplete rankings, empty results, and ordinary server failures receive distinct user-facing states. A failed refinement leaves the current results unchanged.

## Decisions and trade-offs

### Prioritised

- A trustworthy end-to-end refinement loop rather than a generic chat interface
- Visible and editable search logic
- Deterministic filtering before subjective model ranking
- Evidence grounded in the supplied profile fields
- Mobile-first layout, keyboard focus states, reduced-motion support, and clear empty/loading/error/frozen states
- A compact visual language inspired by Flexiple's current forest-green, lime, and warm-neutral palette

### Deliberately cut

- Authentication, databases, saved searches, and multiple roles
- Real talent-provider integrations
- Streaming model output, which would complicate structured validation
- Retrying rate-limited or invalid model responses automatically; only a connection failure gets one safe transport retry
- Profile pagination because the exercise contains only 48 records

## Verification

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

The model-powered loop additionally requires a valid key and network access. A useful walkthrough query is:

> RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore

The deterministic interpretation of that example produces six candidates before model ranking.

## Suggested Loom walkthrough

Keep the video under 15 minutes:

1. Run the example search and point out the generated/editable filters and rubric.
2. Explain why the first 4-5 candidates rank where they do using profile evidence.
3. Reject one profile, approve another, add a short note, and refine.
4. Show the visible change summary and updated ranking.
5. Freeze the search and show the complete final state.
6. Briefly demonstrate a recoverable error by starting once without `GEMINI_API_KEY`, then restoring it and retrying.
