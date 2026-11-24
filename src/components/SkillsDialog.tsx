import { useEffect, useMemo, useRef, useState } from "react";
import type { Mission } from "../content/parse";
import { regionMeta, TRACKS, type TrackId } from "../content/regions";
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
type TrackFilter = "all" | TrackId;

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
  const firstCampaign = catalog.find((m) => !m.reviewSkill && m.skills.includes(skill));
  const base =
    (firstCampaign && save.profile.trackSupport?.[regionMeta(firstCampaign.region).track]) ?? save.profile.support;
  const { level, step } = skillSupport(catalog, save, skill);
  if (!step || level === base) return null;
  return <p className="skill-support">Missions for this skill now start at {SUPPORT_LABEL[level]} support.</p>;
}

interface Props {
  open: boolean;
  missions: Mission[];
  reviews: Mission[];
  save: SaveData;
  unlockAll?: boolean;
  onClose(): void;
  onOpen(missionId: string): void;
}

export function SkillsDialog({ open, missions, reviews, save, unlockAll = false, onClose, onOpen }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setFilter("all");
      setTrackFilter("all");
      setQuery("");
      element.showModal();
    }
    if (!open && element.open) element.close();
  }, [open]);

  const catalog = useMemo(() => [...missions, ...reviews], [missions, reviews]);
  const report = useMemo(() => skillReport(catalog, save), [catalog, save]);
  const calibration = calibrationSummary(save.confidenceLog);

  const tracksOf = (skill: (typeof report)[number]): TrackId[] => [
    ...new Set(skill.missions.filter((m) => !m.reviewSkill).map((m) => regionMeta(m.region).track)),
  ];

  const trackCounts = useMemo(() => {
    const c: Record<TrackFilter, number> = { all: report.length, python: 0, javascript: 0, typescript: 0, sql: 0 };
    for (const s of report) {
      for (const t of tracksOf(s)) c[t]++;
    }
    return c;
  }, [report]);

  const trackScoped = useMemo(
    () => (trackFilter === "all" ? report : report.filter((skill) => tracksOf(skill).includes(trackFilter))),
    [report, trackFilter],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: trackScoped.length, retained: 0, demonstrated: 0, practiced: 0, untried: 0 };
    for (const s of trackScoped) c[s.evidence]++;
    return c;
  }, [trackScoped]);

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      trackScoped.filter((skill) => {
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
    [trackScoped, filter, trimmed],
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
          <div className="skills-track-filters" role="group" aria-label="Filter skills by track">
            <button
              type="button"
              className={`filter-pill${trackFilter === "all" ? " active" : ""}`}
              aria-pressed={trackFilter === "all"}
              onClick={() => setTrackFilter("all")}
            >
              All tracks <span className="filter-count">{trackCounts.all}</span>
            </button>
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`filter-pill${trackFilter === t.id ? " active" : ""}`}
                aria-pressed={trackFilter === t.id}
                onClick={() => setTrackFilter(t.id)}
              >
                {t.shortName} <span className="filter-count">{trackCounts[t.id]}</span>
              </button>
            ))}
          </div>
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
                          {isUnlocked(missions, save, index, unlockAll) ? (
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
