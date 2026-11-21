import { useEffect, useMemo, useRef, useState } from "react";
import { systemsIn } from "../content";
import type { Mission } from "../content/parse";
import { REGIONS, regionMeta } from "../content/regions";
import { SKILLS } from "../content/skills";
import { isRestored, isUnlocked, regionEntry, systemProgress, type SystemState } from "../game/rules";
import type { SaveData } from "../game/save";

interface Props {
  open: boolean;
  currentRegion: string;
  currentMissionId: string;
  missions: Mission[];
  save: SaveData;
  unlockAll?: boolean;
  onClose(): void;
  onOpen(missionId: string): void;
}

function regionState(missions: Mission[], regionId: string, save: SaveData, unlockAll: boolean): {
  state: SystemState;
  systemsOnline: number;
  systemsTotal: number;
  missionsDone: number;
  missionsTotal: number;
  entry: Mission | null;
} {
  const systems = systemsIn(regionId);
  const inRegion = missions.filter((m) => m.region === regionId);
  const systemsOnline = systems.filter((s) => systemProgress(missions, s, save, unlockAll).state === "online").length;
  const missionsDone = inRegion.filter((m) => isRestored(save, m.id)).length;
  const entry = regionEntry(missions, regionId, save, unlockAll);
  const state: SystemState =
    systemsOnline === systems.length && systems.length > 0
      ? "online"
      : missionsDone > 0
        ? "underway"
        : entry
          ? "ready"
          : "locked";
  return {
    state,
    systemsOnline,
    systemsTotal: systems.length,
    missionsDone,
    missionsTotal: inRegion.length,
    entry,
  };
}

function kindBadge(mission: Mission): string | null {
  if (mission.assessment) return "Finale";
  if (mission.kind === "predict") return "Predict";
  if (mission.kind === "terminal") return "Terminal";
  return null;
}

export function AtlasDialog({ open, currentRegion, currentMissionId, missions, save, unlockAll = false, onClose, onOpen }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [selectedRegion, setSelectedRegion] = useState(currentRegion);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      setSelectedRegion(currentRegion);
      setQuery("");
      if (!element.open) element.showModal();
      window.requestAnimationFrame(() => searchInput.current?.focus());
    } else if (element.open) {
      element.close();
    }
  }, [open, currentRegion]);

  const regionStats = useMemo(
    () =>
      REGIONS.map((region, index) => ({
        region,
        index,
        ...regionState(missions, region.id, save, unlockAll),
      })),
    [missions, save, unlockAll],
  );

  const totalDone = useMemo(() => missions.filter((m) => isRestored(save, m.id)).length, [missions, save]);
  const regionsOnline = regionStats.filter((r) => r.state === "online").length;

  const trimmed = query.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!trimmed) return [];
    const tokens = trimmed.split(/\s+/);
    const matches: { mission: Mission; index: number; unlocked: boolean; done: boolean }[] = [];
    for (let i = 0; i < missions.length; i++) {
      const m = missions[i];
      const meta = regionMeta(m.region);
      const haystack = [
        m.title,
        m.system,
        meta.act,
        meta.name,
        meta.summary,
        ...m.skills.map((s) => SKILLS[s]?.name ?? s),
      ]
        .join(" ")
        .toLowerCase();
      if (tokens.every((t) => haystack.includes(t))) {
        matches.push({
          mission: m,
          index: i,
          unlocked: isUnlocked(missions, save, i, unlockAll),
          done: isRestored(save, m.id),
        });
      }
      if (matches.length >= 60) break;
    }
    return matches;
  }, [trimmed, missions, save, unlockAll]);

  const activeEntry = regionStats.find((r) => r.region.id === selectedRegion) ?? regionStats[0];
  const activeSystems = systemsIn(activeEntry.region.id);
  const previousRegion = activeEntry.index > 0 ? REGIONS[activeEntry.index - 1] : null;

  const jumpTo = (missionId: string) => {
    onOpen(missionId);
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      className="atlas-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="atlas-title"
    >
      <div className="dialog-head atlas-head">
        <div>
          <h2 id="atlas-title">Station atlas</h2>
          <p className="atlas-summary">
            {totalDone} of {missions.length} repairs complete, {regionsOnline} of {REGIONS.length} regions online
          </p>
        </div>
        <button className="quiet" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="atlas-search-bar">
        <label htmlFor="atlas-search" className="sr-only">
          Search missions, systems, regions, or skills
        </label>
        <input
          ref={searchInput}
          id="atlas-search"
          type="search"
          value={query}
          placeholder="Jump to a mission, system, region, or skill…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed) {
              const firstUnlocked = searchMatches.find((m) => m.unlocked);
              if (firstUnlocked) {
                e.preventDefault();
                jumpTo(firstUnlocked.mission.id);
              }
            }
          }}
        />
        {trimmed && (
          <span className="atlas-search-count" role="status">
            {searchMatches.length === 60 ? "60+ matches" : `${searchMatches.length} ${searchMatches.length === 1 ? "match" : "matches"}`}
          </span>
        )}
      </div>

      {trimmed ? (
        <div className="atlas-results">
          {searchMatches.length === 0 ? (
            <p className="atlas-empty">No missions match "{query.trim()}". Try a region name, system, or topic like SQL, Git, or B-tree.</p>
          ) : (
            <ul className="atlas-result-list">
              {searchMatches.map(({ mission, unlocked, done }) => {
                const meta = regionMeta(mission.region);
                const badge = kindBadge(mission);
                const current = mission.id === currentMissionId;
                return (
                  <li key={mission.id}>
                    <button
                      className={`atlas-result-row${current ? " current" : ""}`}
                      disabled={!unlocked}
                      onClick={() => unlocked && jumpTo(mission.id)}
                    >
                      <span className={`dot ${done ? "online" : unlocked ? "ready" : "locked"}`} aria-hidden="true" />
                      <span className="atlas-result-main">
                        <span className="atlas-result-title">{mission.title}</span>
                        <span className="atlas-result-meta">
                          <span className="act-plate">{meta.act}</span>
                          <span>{meta.name}</span>
                          <span className="atlas-sep" aria-hidden="true">/</span>
                          <span>{mission.system}</span>
                        </span>
                      </span>
                      <span className="atlas-result-tags">
                        {badge && <span className="tag">{badge}</span>}
                        {current && <span className="tag current-tag">Here</span>}
                        {!unlocked && <span className="tag">Locked</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="atlas-grid">
          <nav className="atlas-regions" aria-label="Regions">
            {regionStats.map(({ region, state, systemsOnline, systemsTotal }) => {
              const selected = region.id === activeEntry.region.id;
              const isCurrent = region.id === currentRegion;
              return (
                <button
                  key={region.id}
                  className={`atlas-region-btn ${state}${selected ? " selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setSelectedRegion(region.id)}
                >
                  <span className={`dot ${state}`} aria-hidden="true" />
                  <span className="atlas-region-text">
                    <span className="atlas-region-top">
                      <span className="act-plate">{region.act}</span>
                      <span className="atlas-region-name">{region.name}</span>
                      {isCurrent && <span className="tag current-tag">Here</span>}
                    </span>
                    <span className="atlas-region-sub">{region.summary}</span>
                  </span>
                  <span className="atlas-region-count">
                    {systemsOnline}/{systemsTotal}
                  </span>
                </button>
              );
            })}
          </nav>

          <section className="atlas-detail" aria-labelledby="atlas-region-heading">
            <header className="atlas-detail-head">
              <div>
                <div className="atlas-detail-title-row">
                  <span className="act-plate">{activeEntry.region.act}</span>
                  <h3 id="atlas-region-heading">{activeEntry.region.name}</h3>
                </div>
                <p className="atlas-detail-summary">{activeEntry.region.summary}</p>
                <p className="atlas-detail-progress">
                  {activeEntry.systemsOnline} of {activeEntry.systemsTotal} systems online, {activeEntry.missionsDone} of{" "}
                  {activeEntry.missionsTotal} repairs done
                </p>
              </div>
              {activeEntry.entry ? (
                <button className="primary" onClick={() => jumpTo(activeEntry.entry!.id)}>
                  {activeEntry.region.id === currentRegion
                    ? "Resume region"
                    : activeEntry.missionsDone > 0
                      ? "Continue region"
                      : "Open region"}
                </button>
              ) : (
                <p className="atlas-locked-note">
                  Opens after {previousRegion?.name ?? "the previous region"} is online.
                </p>
              )}
            </header>

            <ol className="atlas-systems">
              {activeSystems.map((system, idx) => {
                const progress = systemProgress(missions, system, save, unlockAll);
                return (
                  <li key={system.name} className={`atlas-system ${progress.state}`}>
                    <div className="atlas-system-head">
                      <span className="atlas-system-num">{idx + 1}</span>
                      <span className={`dot ${progress.state}`} aria-hidden="true" />
                      <span className="atlas-system-name">{system.name}</span>
                      <span className="atlas-system-count">
                        {progress.done}/{progress.total}
                      </span>
                    </div>
                    <ol className="atlas-missions">
                      {system.missions.map((mission) => {
                        const globalIdx = missions.indexOf(mission);
                        const done = isRestored(save, mission.id);
                        const unlocked = isUnlocked(missions, save, globalIdx, unlockAll);
                        const current = mission.id === currentMissionId;
                        const badge = kindBadge(mission);
                        return (
                          <li key={mission.id} className={`atlas-mission${done ? " done" : unlocked ? " open" : " locked"}${current ? " current" : ""}`}>
                            {unlocked ? (
                              <button className="atlas-mission-btn" onClick={() => jumpTo(mission.id)}>
                                <span className={`pip-dot${done ? " done" : ""}`} aria-hidden="true" />
                                <span className="atlas-mission-title">{mission.title}</span>
                                {badge && <span className="tag">{badge}</span>}
                                {current && <span className="tag current-tag">Here</span>}
                              </button>
                            ) : (
                              <span className="atlas-mission-locked">
                                <span className="pip-dot locked" aria-hidden="true" />
                                <span>{mission.title}</span>
                                {badge && <span className="tag">{badge}</span>}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </dialog>
  );
}
