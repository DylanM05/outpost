import { CONFIDENCE_LABEL, CONFIDENCE_LEVELS } from "../game/confidence";
import type { Confidence } from "../game/save";

interface Props {
  value: Confidence | null;
  disabled?: boolean;
  onChange(next: Confidence | null): void;
}

// Optional pre-submit confidence check: clicking an active option clears it,
// and leaving it unset never blocks submitting.
export function ConfidencePicker({ value, disabled, onChange }: Props) {
  return (
    <div className="confidence-picker" role="group" aria-label="Confidence before submitting (optional)">
      <span className="confidence-label">How sure?</span>
      <div className="confidence-pills">
        {CONFIDENCE_LEVELS.map((level) => {
          const active = value === level;
          return (
            <button
              key={level}
              type="button"
              className={`confidence-pill${active ? " active" : ""}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(active ? null : level)}
            >
              {CONFIDENCE_LABEL[level]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
