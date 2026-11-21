import { useEffect, useMemo, useRef, useState } from "react";
import type { Mission } from "../content/parse";
import { regionMeta } from "../content/regions";
import type { SkillId } from "../content/skills";
import { calibrationSummary } from "../game/confidence";
import { isUnlocked, skillReport, skillSupport, SUPPORT_LABEL, type Evidence } from "../game/rules";
import type { SaveData } from "../game/save";

const EVIDENCE_TEXT: Record<Evidence, string> = {
  retained: "Retained",
  demonstrated: "Demonstrated",
  practiced: "Practiced with help",
  untried: "Not yet",
};

type Filter = "all" | Evidence;

const FILTER_LABELS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "retained", label: "Retained" },
  { id: "demonstrated", label: "Demonstrated" },
  { id: "practiced", label: "Practiced" },
  { id: "untried", label: "Not yet" },
];

// Shown only when adaptive support has moved this skill away from the
// starting level, so the player can see what changed.
function AdaptedLevel({ catalog, save, skill }: { catalog: Mission[]; save: SaveData; skill: SkillId }) {
  if (!save.profile || save.profile.fixedSupport) return null;
  const { level } = skillSupport(catalog, save, skill);
  if (level === save.profile.support) return null;
  return <p className="skill-support">Missions for this skill now start at {SUPPORT_LABEL[level]} support.</p>;
}

interface Props {
  open: boolean;
  missions: Mission[];
  reviews: Mission[];
  save: SaveData;
  onClose(): void;
  onOpen(missionId: string): void;
}

export function SkillsDialog({ open, missions, reviews, save, onClose, onOpen }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setFilter("all");
      setQuery("");
      element.showModal();
    }
    if (!open && element.open) element.close();
  }, [open]);

  const catalog = useMemo(() => [...missions, ...reviews], [missions, reviews]);
  const report = useMemo(() => skillReport(catalog, save), [catalog, save]);
  const calibration = calibrationSummary(save.confidenceLog);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: report.length, retained: 0, demonstrated: 0, practiced: 0, untried: 0 };
    for (const s of report) c[s.evidence]++;
    return c;
  }, [report]);

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      report.filter((skill) => {
        if (filter !== "all" && skill.evidence !== filter) return false;
        if (!trimmed) return true;
        const firstCampaign = skill.missions.find((m) => !m.reviewSkill);
        const region = firstCampaign ? regionMeta(firstCampaign.region) : null;
        const hay = [
          skill.name,
          skill.summary,
          region?.act ?? "",
          region?.name ?? "",
          ...skill.missions.filter((m) => !m.reviewSkill).map((m) => m.title),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(trimmed);
      }),
    [report, filter, trimmed],
  );

  return (
    <dialog
      ref={dialog}
      className="skills-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="skills-title"
    >
      <div className="dialog-head">
        <h2 id="skills-title">Skills</h2>
        <button className="quiet" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="dialog-body">
        <p className="dialog-intro">
          Demonstrated means you solved a related mission without hints at Standard or Challenge support.
          Retained adds an independent maintenance success at least a week after earlier independent evidence.
          Guided work and hints count as practice. Retention is evidence of a past success, not a guarantee that you will never forget.
        </p>
        {calibration.total > 0 && (
          <section className="calibration" aria-labelledby="calibration-title">
            <div className="calibration-head">
              <h3 id="calibration-title">Calibration</h3>
              <span className="note">Optional self-check, never a grade</span>
            </div>
            <ul className="calibration-grid">
              {calibration.buckets.map((bucket) => (
                <li key={bucket.level} className="calibration-bucket">
                  <span className="calibration-label">{bucket.label}</span>
                  <span className="calibration-stat">
                    {bucket.total === 0
                      ? "No ratings yet"
                      : `${bucket.passed} of ${bucket.total} passed (${Math.round((bucket.rate ?? 0) * 100)}%)`}
                  </span>
                </li>
              ))}
            </ul>
            {calibration.note && <p className="note">{calibration.note}</p>}
          </section>
        )}

        <div className="skills-toolbar">
          <div className="skills-filters" role="group" aria-label="Filter skills by status">
            {FILTER_LABELS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`filter-pill${filter === id ? " active" : ""}`}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label} <span className="filter-count">{counts[id]}</span>
              </button>
            ))}
          </div>
          <label htmlFor="skills-search" className="sr-only">
            Filter skills
          </label>
          <input
            id="skills-search"
            className="skills-search"
            type="search"
            value={query}
            placeholder="Filter skills or missions…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <p className="muted">No skills match that filter.</p>
        ) : (
          <ul className="skill-list">
            {visible.map((skill) => {
              const campaignMissions = skill.missions.filter((m) => !m.reviewSkill);
              const originRegion = campaignMissions[0] ? regionMeta(campaignMissions[0].region) : null;
              return (
                <li key={skill.id} className={`skill ${skill.evidence}`}>
                  <div className="skill-row">
                    <span className="skill-title-group">
                      <span className="skill-name">{skill.name}</span>
                      {originRegion && <span className="act-plate">{originRegion.act}</span>}
                    </span>
                    <span className="evidence">{EVIDENCE_TEXT[skill.evidence]}</span>
                  </div>
                  <p>{skill.summary}</p>
                  <AdaptedLevel catalog={catalog} save={save} skill={skill.id} />
                  <p className="skill-missions">
                    {campaignMissions.map((mission, i) => {
                      const index = missions.indexOf(mission);
                      return (
                        <span key={mission.id}>
                          {i > 0 && ", "}
                          {isUnlocked(missions, save, index) ? (
                            <button
                              className="link"
                              onClick={() => {
                                onOpen(mission.id);
                                onClose();
                              }}
                            >
                              {mission.title}
                            </button>
                          ) : (
                            <span className="muted">{mission.title} (locked)</span>
                          )}
                        </span>
                      );
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </dialog>
  );
}
