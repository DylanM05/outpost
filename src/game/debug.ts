const DEBUG_KEY = "outpost.debug.v1";

export function loadDebugMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("debug");
    if (param === "1" || param === "true") return true;
    if (param === "0" || param === "false") return false;
    return window.localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

export function storeDebugMode(enabled: boolean) {
  try {
    if (enabled) window.localStorage.setItem(DEBUG_KEY, "1");
    else window.localStorage.removeItem(DEBUG_KEY);
  } catch {
    // Ignore storage errors in private mode or SSR.
  }
}
