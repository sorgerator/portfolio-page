// @ts-check
import { initTheme } from "./theme.js";
import { initNav } from "./nav.js";
import { initRouter } from "./router.js";

/**
 * Application entry point.
 */
function bootstrap() {
  initTheme();
  initNav();
  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
