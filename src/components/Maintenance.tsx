import { useEffect, useRef, type Dispatch } from "react";
import type { MaintenanceCall } from "../game/maintenance";
import type { Action } from "../game/save";
import { dueIn } from "../game/time";

interface Props {
  calls: MaintenanceCall[];
  now: number;
  dispatch: Dispatch<Action>;
  onOpen(): void;
}

export function Maintenance({ calls, now, dispatch, onOpen }: Props) {
  const panel = useRef<HTMLDetailsElement>(null);
  const ready = calls.filter((c) => Date.parse(c.state.dueAt) <= now);
  const upcoming = calls.filter((c) => Date.parse(c.state.dueAt) > now);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panel.current?.open) panel.current.open = false;
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const renderCall = ({ skill, mission, state }: MaintenanceCall, due: boolean) => (
    <li key={skill}>
      <div>
        <strong>{mission.title}</strong>
        <span className="note">
          {mission.system}. {due ? (state.active ? "In progress." : "Ready now.") : `Arrives ${dueIn(state.dueAt, now)}.`}
        </span>
      </div>
      <button
        disabled={!due}
        onClick={() => {
          dispatch({ type: "review-start", skill, missionId: mission.id, state });
          if (panel.current) panel.current.open = false;
          onOpen();
        }}
      >
        {state.active ? "Resume call" : "Open call"}
      </button>
    </li>
  );

  return (
    <details className={`maintenance-queue${ready.length ? " has-ready" : ""}`} ref={panel}>
      <summary>
        <span>
          Maintenance calls: {ready.length ? `${ready.length} ready` : "none due"}
        </span>
        {upcoming.length > 0 && (
          <span className="maintenance-upcoming-note">
            {upcoming.length} scheduled later
          </span>
        )}
      </summary>
      <div className="maintenance-body">
        <p>Short return visits that keep earlier skills working. Calls never block your campaign or undo a repair.</p>
        {calls.length === 0 ? (
          <p className="note">Your first call arrives a day after you finish Restore power.</p>
        ) : (
          <>
            {ready.length > 0 && (
              <ul aria-label="Ready maintenance calls">
                {ready.map((c) => renderCall(c, true))}
              </ul>
            )}
            {upcoming.length > 0 && (
              ready.length > 0 ? (
                <details className="maintenance-later">
                  <summary>Scheduled later ({upcoming.length})</summary>
                  <ul>{upcoming.map((c) => renderCall(c, false))}</ul>
                </details>
              ) : (
                <ul className="maintenance-scroll" aria-label="Scheduled maintenance calls">
                  {upcoming.map((c) => renderCall(c, false))}
                </ul>
              )
            )}
          </>
        )}
        <p className="note">
          Start with what you remember. Documentation is welcome, and hints are there when you need them.
        </p>
      </div>
    </details>
  );
}
