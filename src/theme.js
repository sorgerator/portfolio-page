// @ts-check

const STORAGE_KEY = "ts-theme";

/**
 * Resolves the active theme: saved user preference in localStorage if present,
 * otherwise always defaults to "dark".
 * @returns {"dark" | "light"}
 */
export function getActiveTheme() {
  const rootAttr = document.documentElement.getAttribute("data-theme");
  if (rootAttr === "dark" || rootAttr === "light") {
    return rootAttr;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch {
    // Ignore storage errors in restricted modes
  }
  return "dark";
}

/**
 * Applies the given theme to `:root[data-theme]` and updates toggle button ARIA states.
 * @param {"dark" | "light"} theme
 * @param {boolean} [persist=true]
 */
export function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute("data-theme", theme);

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }

  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    const isLight = theme === "light";
    toggleBtn.setAttribute("aria-pressed", isLight ? "true" : "false");
    toggleBtn.setAttribute(
      "aria-label",
      isLight ? "Switch to dark theme" : "Switch to light theme",
    );
    toggleBtn.setAttribute(
      "title",
      isLight ? "Switch to dark theme" : "Switch to light theme",
    );
  }

  document.documentElement.dispatchEvent(
    new CustomEvent("themechange", { detail: { theme } }),
  );
}

/**
 * Initializes the theme toggle button.
 */
export function initTheme() {
  const current = getActiveTheme();
  applyTheme(current, false);

  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const next = getActiveTheme() === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }
}
