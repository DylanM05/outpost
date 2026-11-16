const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const HOUR = 60 * 60 * 1000;

// "in 5 hours", "in 3 days": a due date in terms a player can plan around.
export function dueIn(dueAt: string, now: number): string {
  const ms = Date.parse(dueAt) - now;
  if (ms <= 0) return "now";
  if (ms < HOUR) return "within the hour";
  const hours = Math.round(ms / HOUR);
  if (hours < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}
