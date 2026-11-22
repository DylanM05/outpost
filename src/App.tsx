import { useEffect, useReducer } from "react";
import { Game } from "./components/Game";
import { Onboarding } from "./components/Onboarding";
import { missions } from "./content";
import { loadSave, reducer, storeSave } from "./game/save";
import { applyTheme, loadTheme } from "./game/theme";

export function App() {
  const [save, dispatch] = useReducer(reducer, undefined, loadSave);

  useEffect(() => storeSave(save), [save]);
  useEffect(() => applyTheme(loadTheme()), []);

  if (!save.profile) {
    return (
      <Onboarding
        missions={missions}
        save={save}
        onStart={(profile) => dispatch({ type: "start", profile, missionId: missions[0].id })}
      />
    );
  }
  return <Game save={save} profile={save.profile} dispatch={dispatch} />;
}
