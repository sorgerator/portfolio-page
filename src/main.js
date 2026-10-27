// @ts-check
import { initTheme } from "./theme.js";
import { initNav } from "./nav.js";
import { initRouter } from "./router.js";
import { initHeroCanvas } from "./hero-canvas.js";
import { initCaseStudies } from "./case-studies.js";

/**
 * Application entry point.
 */
function bootstrap() {
  initTheme();
  initNav();
  initCaseStudies();
  initRouter();
  initHeroCanvas();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
