export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "outpost.theme.v1";

export function loadTheme(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // Ignore storage errors in private mode or SSR.
  }
  return "system";
}

export function applyTheme(theme: ThemePreference) {
  try {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore DOM/storage errors in non-browser tests.
  }
}
