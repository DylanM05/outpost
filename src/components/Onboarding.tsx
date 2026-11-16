import { useState, type FormEvent } from "react";
import { systemsIn } from "../content";
import { REGIONS } from "../content/regions";
import type { Mission } from "../content/parse";
import { SUPPORT_FOR_EXPERIENCE, SUPPORT_LABEL } from "../game/rules";
import type { Background, Experience, Profile, SaveData } from "../game/save";
import { Schematic } from "./Schematic";

const EXPERIENCE_OPTIONS: { id: Experience; label: string; detail: string }[] = [
  {
    id: "new",
    label: "I've never written code",
    detail: "Each mission walks you through the steps, with most of the code there for you to finish.",
  },
  {
    id: "tutorials",
    label: "I've followed tutorials, but I get stuck on my own",
    detail: "You get a starting point for each mission, and the lesson when you want it.",
  },
  {
    id: "small-programs",
    label: "I can write small programs",
    detail: "You get an empty file and the requirements. Every mission is open from the start.",
  },
  {
    id: "experienced",
    label: "I already program and want to fill gaps",
    detail: "Every mission is open. Pass the final mission to bring the whole outpost online at once.",
  },
];

const BACKGROUND_OPTIONS: { id: Background; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "other-language", label: "Another programming language" },
  { id: "terminal", label: "A terminal or command line" },
  { id: "git", label: "Git" },
];

interface Props {
  missions: Mission[];
  save: SaveData;
  onStart(profile: Profile): void;
}

export function Onboarding({ missions, save, onStart }: Props) {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [background, setBackground] = useState<Background[]>([]);
  const support = experience ? SUPPORT_FOR_EXPERIENCE[experience] : null;
  const returning = Object.keys(save.completions).length > 0 || Object.keys(save.drafts).length > 0;

  const toggle = (id: Background) =>
    setBackground((current) => (current.includes(id) ? current.filter((b) => b !== id) : [...current, id]));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (experience && support) onStart({ experience, background, support });
  };

  return (
    <main className="onboarding">
      <form className="onboarding-form" onSubmit={submit}>
        <h1>Kestrel Ridge has been dark for 211 days.</h1>
        <p className="lede">
          You're the outpost's new maintenance engineer. Every system here runs on Python, and every one of them is broken.
          You repair them by writing code: the outpost runs what you write, and the schematic shows what it changed.
        </p>

        <fieldset>
          <legend>How much code have you written?</legend>
          {EXPERIENCE_OPTIONS.map((option) => (
            <label key={option.id} className="choice">
              <input
                type="radio"
                name="experience"
                value={option.id}
                checked={experience === option.id}
                onChange={() => setExperience(option.id)}
              />
              <span className="choice-label">{option.label}</span>
              <span className="choice-detail">{option.detail}</span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>
            Which of these have you used? <span className="optional">Optional</span>
          </legend>
          <p className="field-note">Later parts of the outpost use this to decide what to explain.</p>
          <div className="chips">
            {BACKGROUND_OPTIONS.map((option) => (
              <label key={option.id} className="chip">
                <input type="checkbox" checked={background.includes(option.id)} onChange={() => toggle(option.id)} />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="onboarding-start">
          <button className="primary" type="submit" disabled={!experience}>
            {returning ? "Return to the outpost" : "Start the first mission"}
          </button>
          <p className="field-note">
            {support
              ? `You'll start with ${SUPPORT_LABEL[support]} support. It adapts to each skill as you go, and you can fix one level from the top bar.`
              : "Choose an answer to continue."}
          </p>
        </div>
      </form>

      <div className="onboarding-board" aria-hidden="true">
        <Schematic missions={missions} systems={systemsIn(REGIONS[0].id)} save={save} />
      </div>
    </main>
  );
}
