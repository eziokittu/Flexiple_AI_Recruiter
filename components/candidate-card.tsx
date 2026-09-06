"use client";

import type { RankedProfile } from "@/lib/schemas";

type Judgment = "yes" | "no";

export function CandidateCard({
  candidate,
  rank,
  judgment,
  onJudge,
  frozen,
}: {
  candidate: RankedProfile;
  rank: number;
  judgment?: Judgment;
  onJudge: (value: Judgment) => void;
  frozen: boolean;
}) {
  const initials = candidate.name.split(" ").map((part) => part[0]).join("").slice(0, 2);

  return (
    <article className="candidate-card">
      <div className="candidate-head">
        <div className="rank-avatar" aria-label={`Rank ${rank}`}>
          <span className="rank-number">{rank}</span>
          <span aria-hidden="true">{initials}</span>
        </div>
        <div className="candidate-identity">
          <div className="candidate-title-row">
            <h3>{candidate.name}</h3>
            <span className="score-pill">{Math.round(candidate.score)} fit</span>
          </div>
          <p>{candidate.current_title} at {candidate.current_company}</p>
          <div className="candidate-meta" aria-label="Candidate facts">
            <span>{candidate.years_experience} years</span>
            <span>{candidate.location}</span>
            <span className="capitalize">{candidate.current_company_type}</span>
          </div>
        </div>
      </div>

      <p className="match-explanation">{candidate.explanation}</p>

      <div className="evidence-list">
        {candidate.evidence.map((item) => <span key={item}>{item}</span>)}
      </div>

      <div className="skills-row" aria-label="Skills">
        {candidate.skills.map((skill) => <span key={skill}>{skill}</span>)}
      </div>

      {!frozen && (
        <div className="candidate-actions">
          <span>Does this profile match?</span>
          <div className="judgment-buttons">
            <button
              type="button"
              className={judgment === "yes" ? "selected positive" : ""}
              aria-pressed={judgment === "yes"}
              onClick={() => onJudge("yes")}
            >
              <span aria-hidden="true">✓</span> Yes
            </button>
            <button
              type="button"
              className={judgment === "no" ? "selected negative" : ""}
              aria-pressed={judgment === "no"}
              onClick={() => onJudge("no")}
            >
              <span aria-hidden="true">×</span> No
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
