import { marked } from "marked";
import { useMemo } from "react";

// Mission files are first-party content shipped with the game, so their
// Markdown is rendered as-is. Community-authored content would need sanitizing.
export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => marked.parse(source, { async: false }), [source]);
  return <div className={className ? `prose ${className}` : "prose"} dangerouslySetInnerHTML={{ __html: html }} />;
}
