import { useEffect, useRef } from "react";
import type { Mission } from "../content/parse";
import type { SkillId } from "../content/skills";
import { isUnlocked, skillReport, skillSupport, SUPPORT_LABEL, type Evidence } from "../game/rules";
import type { SaveData } from "../game/save";

const EVIDENCE_TEXT: Record<Evidence, string> = {
  retained: "Retained",
  demonstrated: "Demonstrated",
  practiced: "Practiced with help",
  untried: "Not yet",
};

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

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={dialog} className="skills-dialog" onClose={onClose} aria-labelledby="skills-title">
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
        <ul className="skill-list">
          {skillReport([...missions, ...reviews], save).map((skill) => (
            <li key={skill.id} className={`skill ${skill.evidence}`}>
              <div className="skill-row">
                <span className="skill-name">{skill.name}</span>
                <span className="evidence">{EVIDENCE_TEXT[skill.evidence]}</span>
              </div>
              <p>{skill.summary}</p>
              <AdaptedLevel catalog={[...missions, ...reviews]} save={save} skill={skill.id} />
              <p className="skill-missions">
                {skill.missions.filter((m) => !m.reviewSkill).map((mission, i) => {
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
          ))}
        </ul>
      </div>
    </dialog>
  );
}
