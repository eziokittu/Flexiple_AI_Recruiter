"use client";

import type { CompanyType, SearchDefinition, SearchFilters } from "@/lib/schemas";

const companyTypes: CompanyType[] = ["startup", "scaleup", "enterprise", "agency"];

function listToText(values: string[]): string {
  return values.join(", ");
}

function textToList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function SearchDefinitionPanel({
  definition,
  onChange,
  onRun,
  disabled,
  frozen,
}: {
  definition: SearchDefinition;
  onChange: (definition: SearchDefinition) => void;
  onRun: () => void;
  disabled: boolean;
  frozen: boolean;
}) {
  const updateFilters = (update: Partial<SearchFilters>) => {
    onChange({ ...definition, filters: { ...definition.filters, ...update } });
  };

  const toggleCompanyType = (companyType: CompanyType) => {
    const selected = definition.filters.companyTypes.includes(companyType);
    updateFilters({
      companyTypes: selected
        ? definition.filters.companyTypes.filter((item) => item !== companyType)
        : [...definition.filters.companyTypes, companyType],
    });
  };

  return (
    <aside className="definition-panel" aria-label="Search criteria">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Search logic</span>
          <h2>{frozen ? "Frozen criteria" : "Filters & rubric"}</h2>
        </div>
        {!frozen && <span className="edit-hint">Editable</span>}
      </div>

      <fieldset disabled={disabled || frozen}>
        <legend>Objective filters</legend>

        <label className="field">
          <span>Required skills</span>
          <input
            value={listToText(definition.filters.skills)}
            onChange={(event) => updateFilters({ skills: textToList(event.target.value) })}
            placeholder="AWS RDS, PostgreSQL"
          />
        </label>

        <div className="two-column-fields">
          <label className="field">
            <span>Skill rule</span>
            <select
              value={definition.filters.skillMatch}
              onChange={(event) => updateFilters({ skillMatch: event.target.value as "all" | "any" })}
            >
              <option value="all">Match all</option>
              <option value="any">Match any</option>
            </select>
          </label>
          <label className="field">
            <span>Company history</span>
            <select
              value={definition.filters.companyScope}
              onChange={(event) => updateFilters({ companyScope: event.target.value as SearchFilters["companyScope"] })}
            >
              <option value="current_or_past">Current or past</option>
              <option value="current">Current only</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Role titles</span>
          <input
            value={listToText(definition.filters.titles)}
            onChange={(event) => updateFilters({ titles: textToList(event.target.value) })}
            placeholder="Backend Engineer"
          />
        </label>

        <div className="two-column-fields">
          <label className="field">
            <span>Min. years</span>
            <input
              type="number"
              min="0"
              max="50"
              value={definition.filters.minimumYearsExperience ?? ""}
              onChange={(event) => updateFilters({ minimumYearsExperience: event.target.value === "" ? null : Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Max. years</span>
            <input
              type="number"
              min="0"
              max="50"
              value={definition.filters.maximumYearsExperience ?? ""}
              onChange={(event) => updateFilters({ maximumYearsExperience: event.target.value === "" ? null : Number(event.target.value) })}
            />
          </label>
        </div>

        <label className="field">
          <span>Locations</span>
          <input
            value={listToText(definition.filters.locations)}
            onChange={(event) => updateFilters({ locations: textToList(event.target.value) })}
            placeholder="Bangalore"
          />
        </label>

        <div className="field">
          <span>Company types</span>
          <div className="check-grid">
            {companyTypes.map((companyType) => (
              <label key={companyType} className="check-pill">
                <input
                  type="checkbox"
                  checked={definition.filters.companyTypes.includes(companyType)}
                  onChange={() => toggleCompanyType(companyType)}
                />
                <span className="capitalize">{companyType}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rubric-legend">Fit rubric</div>
        <div className="rubric-list">
          {definition.rubric.map((criterion, index) => (
            <div className="rubric-item" key={`${criterion.name}-${index}`}>
              <div className="rubric-title-row">
                <input
                  aria-label={`Rubric criterion ${index + 1}`}
                  className="rubric-name"
                  value={criterion.name}
                  onChange={(event) => {
                    const rubric = [...definition.rubric];
                    rubric[index] = { ...criterion, name: event.target.value };
                    onChange({ ...definition, rubric });
                  }}
                />
                <label className="weight-field">
                  <input
                    aria-label={`${criterion.name} weight`}
                    type="number"
                    min="1"
                    max="100"
                    value={criterion.weight}
                    onChange={(event) => {
                      const rubric = [...definition.rubric];
                      rubric[index] = { ...criterion, weight: Number(event.target.value) };
                      onChange({ ...definition, rubric });
                    }}
                  />
                  <span>%</span>
                </label>
              </div>
              <textarea
                aria-label={`${criterion.name} description`}
                value={criterion.description}
                rows={2}
                onChange={(event) => {
                  const rubric = [...definition.rubric];
                  rubric[index] = { ...criterion, description: event.target.value };
                  onChange({ ...definition, rubric });
                }}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {!frozen && (
        <button type="button" className="secondary-button full-width" onClick={onRun} disabled={disabled}>
          Run edited search <span aria-hidden="true">→</span>
        </button>
      )}
    </aside>
  );
}
