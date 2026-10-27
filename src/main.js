// @ts-check
import { initTheme } from "./theme.js";

/**
 * Application entry point.
 */
function bootstrap() {
  initTheme();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
