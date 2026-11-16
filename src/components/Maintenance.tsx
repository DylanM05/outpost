import { useRef, type Dispatch } from "react";
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

  return (
    <details className={`maintenance-queue${ready.length ? " has-ready" : ""}`} ref={panel}>
      <summary>
        Maintenance calls: {ready.length ? `${ready.length} ready` : "none due"}
      </summary>
      <div className="maintenance-body">
        <p>Short return visits that keep earlier skills working. Calls never block your campaign or undo a repair.</p>
        {calls.length === 0 ? (
          <p className="note">Your first call arrives a day after you finish Restore power.</p>
        ) : (
          <ul>
            {calls.map(({ skill, mission, state }) => {
              const due = Date.parse(state.dueAt) <= now;
              return (
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
            })}
          </ul>
        )}
        <p className="note">
          Start with what you remember. Documentation is welcome, and hints are there when you need them.
        </p>
      </div>
    </details>
  );
}
