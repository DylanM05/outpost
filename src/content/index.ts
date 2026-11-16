import { groupSystems, parseMission, type Mission, type System } from "./parse";
import { REGIONS } from "./regions";

const files = import.meta.glob<string>("./act*/*.md", { query: "?raw", import: "default", eager: true });

// Regions play in order. Within a region, file names set the order: the
// number is the system, the letter the mission within it
// ("03b-trace-the-readings.md").
export const missions = REGIONS.flatMap((region) =>
  Object.keys(files)
    .filter((path) => path.startsWith(`./${region.id}/`))
    .sort()
    .map((path) => parseMission(files[path], path, region.id)),
);

export const missionsById = new Map(missions.map((m) => [m.id, m]));

export const systems = groupSystems(missions);

export function systemOf(mission: Mission): System {
  return systems.find((s) => s.missions.includes(mission))!;
}

export function systemsIn(region: string): System[] {
  return systems.filter((s) => s.region === region);
}

const reviewFiles = import.meta.glob<string>("./maintenance/*.md", { query: "?raw", import: "default", eager: true });
export const reviewMissions = Object.keys(reviewFiles).sort().map((path) => parseMission(reviewFiles[path], path));
export const allMissions = [...missions, ...reviewMissions];

// The region a mission belongs to on the map. Maintenance calls take the
// region of the lesson they review.
export function regionOf(mission: Mission): string {
  return (mission.reviewSkill ? missionsById.get(mission.prerequisite ?? "")?.region : mission.region) || REGIONS[0].id;
}
