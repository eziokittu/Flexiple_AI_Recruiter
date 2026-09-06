"use client";

import { FormEvent, useMemo, useState } from "react";
import { CandidateCard } from "@/components/candidate-card";
import { SearchDefinitionPanel } from "@/components/search-definition-panel";
import type { SearchDefinition, SearchRun } from "@/lib/schemas";

const SAMPLE_QUERY = "RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore";

type Judgment = "yes" | "no";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The request could not be completed.");
  return payload as T;
}

export function SearchWorkspace() {
  const [query, setQuery] = useState("");
  const [run, setRun] = useState<SearchRun | null>(null);
  const [feedback, setFeedback] = useState("");
  const [judgments, setJudgments] = useState<Record<string, Judgment>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");
  const [frozen, setFrozen] = useState(false);

  const visibleResults = useMemo(
    () => frozen ? (run?.results ?? []) : (run?.results.slice(0, 5) ?? []),
    [frozen, run],
  );

  async function startSearch(event?: FormEvent) {
    event?.preventDefault();
    if (query.trim().length < 8) {
      setError("Describe the role in a little more detail before searching.");
      return;
    }
    setIsBusy(true);
    setBusyMessage("Translating your brief into a precise search…");
    setError("");
    setFrozen(false);
    try {
      const nextRun = await postJson<SearchRun>("/api/search", { query });
      setRun(nextRun);
      setJudgments({});
      setFeedback("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function runEditedSearch() {
    if (!run) return;
    setIsBusy(true);
    setBusyMessage("Applying filters and re-ranking the talent pool…");
    setError("");
    try {
      const nextRun = await postJson<SearchRun>("/api/search", { query, definition: run.definition });
      setRun({ ...nextRun, iteration: run.iteration + 1, refinementSummary: "Applied your manual criteria changes." });
      setJudgments({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The edited search failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function refine() {
    if (!run) return;
    const reactions = visibleResults
      .map((candidate, index) => {
        const judgment = judgments[candidate.id];
        return judgment ? `Candidate ${index + 1}, ${candidate.name} (${candidate.id}), is ${judgment === "yes" ? "a match" : "not a match"}.` : "";
      })
      .filter(Boolean);
    const combinedFeedback = [...reactions, feedback.trim()].filter(Boolean).join(" ");
    if (combinedFeedback.length < 2) {
      setError("Mark a profile yes/no or add a short note before refining.");
      return;
    }

    setIsBusy(true);
    setBusyMessage("Learning from your feedback and revising the search…");
    setError("");
    try {
      const nextRun = await postJson<SearchRun>("/api/refine", {
        query,
        feedback: combinedFeedback,
        definition: run.definition,
        rankedProfileIds: run.results.map((candidate) => candidate.id),
      });
      setRun({ ...nextRun, iteration: run.iteration + 1 });
      setFeedback("");
      setJudgments({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Refinement failed.");
    } finally {
      setIsBusy(false);
    }
  }

  function updateDefinition(definition: SearchDefinition) {
    setRun((current) => current ? { ...current, definition } : current);
  }

  function reset() {
    setRun(null);
    setFeedback("");
    setJudgments({});
    setError("");
    setFrozen(false);
  }

  return (
    <main>
      <header className="site-header">
        <button type="button" className="brand" onClick={reset} aria-label="Sift home">
          sift<span>.</span>
        </button>
        <div className="header-context">
          <span className="status-dot" aria-hidden="true" />
          AI sourcing workspace
        </div>
      </header>

      {!run ? (
        <section className="landing-shell">
          <div className="landing-copy">
            <span className="eyebrow">A sharper talent search</span>
            <h1>Describe the hire.<br /><em>Shape the shortlist.</em></h1>
            <p>
              Turn a plain-English brief into transparent filters, review real evidence,
              and refine the search with every reaction.
            </p>
          </div>

          <form className="search-card" onSubmit={startSearch}>
            <label htmlFor="role-query">Who are you looking for?</label>
            <textarea
              id="role-query"
              rows={4}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. Backend engineers with AWS RDS experience who have worked at startups…"
              disabled={isBusy}
            />
            <div className="search-actions">
              <button type="button" className="example-button" onClick={() => setQuery(SAMPLE_QUERY)} disabled={isBusy}>
                Try an example
              </button>
              <button type="submit" className="primary-button" disabled={isBusy}>
                {isBusy ? "Building search…" : "Find talent"} <span aria-hidden="true">→</span>
              </button>
            </div>
            {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p></div>}
          </form>

          <div className="process-strip" aria-label="How the search works">
            <span><b>01</b> Generate criteria</span>
            <span><b>02</b> Review evidence</span>
            <span><b>03</b> Refine & freeze</span>
          </div>
        </section>
      ) : (
        <div className="workspace-shell">
          <section className="workspace-topbar">
            <div>
              <span className="eyebrow">{frozen ? "Search complete" : `Refinement ${run.iteration}`}</span>
              <h1>{frozen ? "Your final shortlist" : "Shape your shortlist"}</h1>
            </div>
            <div className="topbar-actions">
              <button type="button" className="text-button" onClick={reset} disabled={isBusy}>New search</button>
              {!frozen && (
                <button type="button" className="primary-button compact" onClick={() => setFrozen(true)} disabled={isBusy || run.results.length === 0}>
                  Freeze search <span aria-hidden="true">◇</span>
                </button>
              )}
            </div>
          </section>

          <div className="query-summary">
            <span>Original brief</span>
            <p>“{query}”</p>
          </div>

          {error && <div className="error-banner workspace-error" role="alert"><span>!</span><p>{error}</p><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}

          {frozen && (
            <div className="frozen-banner">
              <div className="frozen-icon" aria-hidden="true">✓</div>
              <div><strong>Search frozen</strong><p>The criteria and ranked shortlist are locked for review.</p></div>
              <button type="button" onClick={() => setFrozen(false)}>Continue refining</button>
            </div>
          )}

          <div className="workspace-grid">
            <SearchDefinitionPanel
              definition={run.definition}
              onChange={updateDefinition}
              onRun={runEditedSearch}
              disabled={isBusy}
              frozen={frozen}
            />

            <section className="results-column" aria-busy={isBusy}>
              <div className="results-heading">
                <div>
                  <span className="eyebrow">Ranked matches</span>
                  <h2>{run.filteredCount} of {run.totalProfiles} profiles</h2>
                </div>
                <span className="round-badge">Round {run.iteration + 1}</span>
              </div>

              {run.refinementSummary && (
                <div className="change-note"><span aria-hidden="true">↗</span><p><strong>What changed</strong>{run.refinementSummary}</p></div>
              )}

              {isBusy ? (
                <div className="loading-state" role="status">
                  <div className="thinking-mark"><span /><span /><span /></div>
                  <h3>{busyMessage}</h3>
                  <p>Checking objective fit, then scoring the evidence.</p>
                  <div className="skeleton-card" /><div className="skeleton-card short" />
                </div>
              ) : visibleResults.length > 0 ? (
                <div className="candidate-list">
                  {visibleResults.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      rank={index + 1}
                      judgment={judgments[candidate.id]}
                      frozen={frozen}
                      onJudge={(value) => setJudgments((current) => ({ ...current, [candidate.id]: value }))}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span aria-hidden="true">0</span>
                  <h3>No profiles cleared these filters</h3>
                  <p>Broaden a required skill, location, or experience range, then run the edited search.</p>
                </div>
              )}

              {!frozen && !isBusy && visibleResults.length > 0 && (
                <div className="feedback-card">
                  <div className="feedback-heading">
                    <span className="feedback-step">Next</span>
                    <div><h3>What should change?</h3><p>Use the yes/no buttons above, add context, or do both.</p></div>
                  </div>
                  <label htmlFor="feedback">Recruiter feedback</label>
                  <textarea
                    id="feedback"
                    rows={3}
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    placeholder="e.g. Candidate 1 is too junior. Prioritise deeper PostgreSQL ownership…"
                  />
                  <div className="feedback-footer">
                    <span>{Object.keys(judgments).length} profile reactions</span>
                    <button type="button" className="primary-button" onClick={refine}>
                      Refine results <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <footer>
        <span>48 fictional profiles</span>
        <span>Structured with Gemini</span>
        <span>Evidence over instinct</span>
      </footer>
    </main>
  );
}
