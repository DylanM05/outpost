import { useEffect, useLayoutEffect, useState } from "react";
import { MOD_KEY } from "./Results";

const TOUR_KEY = "outpost.tour.v1";

export function hasSeenTour(): boolean {
  try {
    return window.localStorage.getItem(TOUR_KEY) === "done";
  } catch {
    return false;
  }
}

export function markTourSeen() {
  try {
    window.localStorage.setItem(TOUR_KEY, "done");
  } catch {
    // Ignore storage errors in private mode or SSR.
  }
}

export interface TourStep {
  id: string;
  target: string;
  pane?: "brief" | "bench" | "plant";
  title: string;
  body: string;
  tip: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "brief",
    target: "brief",
    pane: "brief",
    title: "Read the briefing and objective",
    body: "Start on the left. Each mission explains the broken system, opens a short lesson when you need it, and states the exact objective to pass.",
    tip: "Hints live at the bottom of this panel, along with Previous and Next buttons to step through unlocked repairs.",
  },
  {
    id: "bench",
    target: "bench-controls",
    pane: "bench",
    title: "Run examples, then submit",
    body: `Write your solution in main.py. Click Run (${MOD_KEY}+Enter) as often as you like to test against the visible examples and inspect printed output.`,
    tip: `When everything looks right, click Submit (${MOD_KEY}+Shift+Enter) to run the hidden checks and bring the repair online.`,
  },
  {
    id: "board",
    target: "mimic-board",
    pane: "plant",
    title: "Track and click systems on the mimic board",
    body: "Every lamp on this schematic is a system in the current region, with a pip underneath for each repair it needs. Click any ready or lit lamp to jump straight there.",
    tip: "When a mission has a live visualization—like a Git graph, file tree, or grid search—it appears right above the board.",
  },
  {
    id: "atlas",
    target: "region-switcher",
    title: "Switch acts or search with the Station Atlas",
    body: `Click the region plate here—or press ${MOD_KEY}+K from anywhere—to open the Station Atlas across all 14 acts and 384 missions.`,
    tip: "Use the Atlas search bar to jump directly to any unlocked mission, system, or topic like SQL, Git, or B-trees.",
  },
  {
    id: "tools",
    target: "topbar-tools",
    title: "Support, Skills, and Progress",
    body: "Support adapts how much starter code you receive as you solve missions cleanly. Skills tracks what you've demonstrated, retained, and calibrated.",
    tip: "Open Progress anytime to switch Day or Night shift, download a backup, or change your experience answers.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  onClose(): void;
  onFocusPane?: (pane: "brief" | "bench" | "plant") => void;
}

export function ControlRoomTour({ open, onClose, onFocusPane }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || !step.pane || !onFocusPane) return;
    onFocusPane(step.pane);
  }, [open, step.pane, onFocusPane]);

  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) {
        setRect(null);
        return;
      }
      const pad = 6;
      setRect({
        top: Math.max(4, box.top - pad),
        left: Math.max(4, box.left - pad),
        width: Math.min(window.innerWidth - 8, box.width + pad * 2),
        height: Math.min(window.innerHeight - 8, box.height + pad * 2),
      });
    };

    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    measure();
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step.target, stepIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        markTourSeen();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isLast) {
          markTourSeen();
          onClose();
        } else {
          setStepIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
        }
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLast, onClose]);

  if (!open) return null;

  const finish = () => {
    markTourSeen();
    onClose();
  };

  // Position the enamel callout beside or beneath the highlighted region,
  // staying strictly inside the viewport.
  const cardStyle = computeCardPosition(rect, viewport.width, viewport.height);

  return (
    <div className="tour-layer" role="dialog" aria-modal="false" aria-labelledby="tour-step-title">
      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="tour-backdrop" aria-hidden="true" />
      )}

      <div className="tour-card" style={cardStyle}>
        <div className="tour-head">
          <span className="act-plate">
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button type="button" className="link tour-skip" onClick={finish}>
            Skip tour
          </button>
        </div>
        <h3 id="tour-step-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>
        <p className="tour-tip">{step.tip}</p>
        <div className="tour-actions">
          <button
            type="button"
            className="quiet"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              if (isLast) finish();
              else setStepIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
            }}
          >
            {isLast ? "Start repairing" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function computeCardPosition(rect: Rect | null, vw: number, vh: number): React.CSSProperties {
  if (!rect || vw <= 820) {
    return {};
  }
  const cardWidth = Math.min(370, vw - 32);
  const approxHeight = 250;
  const gap = 14;
  const clampLeft = (x: number) => Math.max(16, Math.min(x, vw - cardWidth - 16));
  const clampTop = (y: number) => Math.max(16, Math.min(y, vh - approxHeight - 16));

  // If the target is tall (like the full Briefing or Mimic Board), place card to its side.
  if (rect.height > vh * 0.45) {
    const spaceRight = vw - (rect.left + rect.width);
    const spaceLeft = rect.left;
    if (spaceRight >= cardWidth + gap + 16) {
      return {
        top: `${clampTop(rect.top + 36)}px`,
        left: `${rect.left + rect.width + gap}px`,
        width: `${cardWidth}px`,
      };
    }
    if (spaceLeft >= cardWidth + gap + 16) {
      return {
        top: `${clampTop(rect.top + 36)}px`,
        left: `${rect.left - cardWidth - gap}px`,
        width: `${cardWidth}px`,
      };
    }
  }

  // Prefer below the target if there is room; otherwise above.
  const spaceBelow = vh - (rect.top + rect.height);
  if (spaceBelow >= approxHeight + gap) {
    return {
      top: `${rect.top + rect.height + gap}px`,
      left: `${clampLeft(rect.left)}px`,
      width: `${cardWidth}px`,
    };
  }
  return {
    top: `${clampTop(rect.top - approxHeight - gap)}px`,
    left: `${clampLeft(rect.left)}px`,
    width: `${cardWidth}px`,
  };
}
