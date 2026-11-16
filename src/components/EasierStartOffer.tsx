import type { SupportLevel } from "../content/parse";
import { SUPPORT_LABEL } from "../game/rules";

const UNDO_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘Z" : "Ctrl+Z";

// Offered after several failed submissions. Switching replaces the player's
// code with a more complete starter; the editor's undo brings theirs back.
export function EasierStartOffer({ level, onSwitch }: { level: SupportLevel; onSwitch(): void }) {
  return (
    <div className="stuck-offer">
      <p>
        Stuck? {SUPPORT_LABEL[level]} support gives you a more complete starting point for this mission. Your current code will
        be replaced, and {UNDO_KEY} in the editor brings it back.
      </p>
      <button className="quiet" onClick={onSwitch}>
        Switch to {SUPPORT_LABEL[level]} support
      </button>
    </div>
  );
}
