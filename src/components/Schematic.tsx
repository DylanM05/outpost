import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Mission, SchematicSymbol, System } from "../content/parse";
import { entryMission, isRestored, systemProgress, type SystemState } from "../game/rules";
import type { SaveData } from "../game/save";

// The outpost drawn as a control-room mimic board: one lamp per system, wired
// in order, with a pip under each lamp for every repair it needs. A wire goes
// live when the system it feeds is fully online.

const COLUMN_GAP = 128;
const TOP = 58;

// Narrow containers get three lamps per row instead of five, so the plates
// stay readable instead of being scaled down.
const perRowFor = (width: number) => (width < 520 ? 3 : 5);

function layout(perRow: number) {
  const rowGap = perRow === 3 ? 118 : 132;
  return {
    width: perRow * COLUMN_GAP,
    rowGap,
    position(index: number) {
      const row = Math.floor(index / perRow);
      const column = index % perRow;
      const fromLeft = row % 2 === 0 ? column : perRow - 1 - column;
      return { x: COLUMN_GAP / 2 + fromLeft * COLUMN_GAP, y: TOP + row * rowGap };
    },
  };
}

function describe(state: SystemState, done: number, total: number): string {
  switch (state) {
    case "online":
      return "online";
    case "underway":
      return `${done} of ${total} repairs done`;
    case "ready":
      return "ready to repair";
    case "locked":
      return "locked";
  }
}

function Lamp({ symbol }: { symbol: SchematicSymbol }) {
  switch (symbol) {
    case "instrument":
      return <circle className="lamp" r={19} />;
    case "controller":
      return <rect className="lamp" x={-16} y={-16} width={32} height={32} transform="rotate(45)" />;
    case "equipment":
      return <rect className="lamp" x={-18} y={-18} width={36} height={36} rx={3} />;
  }
}

interface Props {
  missions: Mission[];
  systems: System[];
  save: SaveData;
  currentSystem?: string;
  // The system that came fully online most recently; its wire and lamp animate once.
  energized?: string | null;
  onOpen?: (missionId: string) => void;
}

export function Schematic({ missions, systems, save, currentSystem, energized, onOpen }: Props) {
  const figure = useRef<HTMLElement>(null);
  const [perRow, setPerRow] = useState(5);

  useLayoutEffect(() => {
    const element = figure.current;
    if (!element) return;
    setPerRow(perRowFor(element.clientWidth));
    const observer = new ResizeObserver(([entry]) => setPerRow(perRowFor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { width, rowGap, position } = layout(perRow);
  const rows = Math.ceil(systems.length / perRow);
  const height = TOP + (rows - 1) * rowGap + 76;
  const first = position(0);

  // Each wire feeds the system at its end: mains feeds the first, then each
  // system feeds the next.
  const wires = systems.map((system, i) => ({
    system,
    from: i === 0 ? { x: 0, y: first.y } : position(i - 1),
    to: position(i),
  }));

  const activate = (id: string) => (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.(id);
    }
  };

  return (
    <figure className="mimic" ref={figure}>
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Outpost schematic">
        {wires.map(({ system, from, to }) => {
          const live = systemProgress(missions, system, save).state === "online";
          const animate = live && energized === system.name;
          return (
            <g key={system.name}>
              <line className="track" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              <line
                className={`bus ${live ? "live" : "dead"}${animate ? " energize" : ""}`}
                pathLength={animate ? 1 : undefined}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            </g>
          );
        })}

        {systems.map((system, index) => {
          const { x, y } = position(index);
          const { done, total, state } = systemProgress(missions, system, save);
          const current = system.name === currentSystem;
          const openable = onOpen !== undefined && state !== "locked";
          const target = entryMission(missions, system, save).id;
          const plateWidth = system.name.length * 7.4 + 18;
          const classes = ["node", state, current && "current", energized === system.name && "energize"];
          return (
            <g
              key={system.name}
              className={classes.filter(Boolean).join(" ")}
              transform={`translate(${x} ${y})`}
              role={onOpen ? "button" : undefined}
              tabIndex={openable ? 0 : undefined}
              aria-label={onOpen ? `${system.name}: ${describe(state, done, total)}` : undefined}
              aria-disabled={onOpen && !openable ? true : undefined}
              aria-current={current ? "step" : undefined}
              onClick={openable ? () => onOpen(target) : undefined}
              onKeyDown={openable ? activate(target) : undefined}
            >
              {/* Covers the gaps between lamp, plate, and pips so the whole node is clickable. */}
              <rect className="hit" x={-Math.max(plateWidth, 60) / 2} y={-32} width={Math.max(plateWidth, 60)} height={102} />
              {current && <circle className="current-ring" r={29} />}
              <Lamp symbol={system.symbol} />
              <text className="node-number" y={5}>
                {index + 1}
              </text>
              <g transform="translate(0 40)">
                <rect className="plate" x={-plateWidth / 2} y={-11} width={plateWidth} height={22} rx={2} />
                <text className="plate-text" y={5}>
                  {system.name}
                </text>
              </g>
              {total > 1 && (
                <g transform="translate(0 63)">
                  <rect className="pip-strip" x={-(total * 11 + 4) / 2} y={-6.5} width={total * 11 + 4} height={13} rx={6.5} />
                  {system.missions.map((mission, i) => (
                    <circle
                      key={mission.id}
                      className={`pip${isRestored(save, mission.id) ? " done" : ""}`}
                      cx={(i - (total - 1) / 2) * 11}
                      r={3.5}
                    />
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="legend">
        <span className="key online">Online</span>
        <span className="key underway">Under repair</span>
        <span className="key ready">Ready to repair</span>
        <span className="key locked">Locked</span>
      </figcaption>
    </figure>
  );
}
