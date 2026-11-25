// @ts-check
import { setNavActive, setScrollSpyMode } from "./nav.js";

/**
 * @typedef {Object} RouteMeta
 * @property {string} title
 * @property {string} description
 * @property {string} path
 */

/** @type {((slug: string | null) => Promise<void> | void) | null} */
let blogRouteHandler = null;

/** @type {string} */
let currentView = "home";

const DEFAULT_META = {
  title: "Tarik Sorguč | Data Science & Machine Learning Engineer",
  description:
    "Portfolio of Tarik Sorguč — Data Science and AI Engineering student, former ML Engineer Intern at FlyRank AI. Building data pipelines, ML models, and web applications.",
};

/**
 * Updates document title, meta description, canonical link, and Open Graph tags.
 * @param {RouteMeta} meta
 */
export function updateRouteMeta({ title, description, path }) {
  document.title = title;

  const setMeta = (selector, content) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", content);
  };

  setMeta('meta[name="title"]', title);
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', `https://tariksorguc.me${path}`);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:url"]', `https://tariksorguc.me${path}`);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute("href", `https://tariksorguc.me${path}`);
  }
}

/**
 * Normalizes pathname (treats `/index.html` as `/` for local Live Server compatibility).
 * @param {string} pathname
 * @returns {string}
 */
function normalizePath(pathname) {
  if (!pathname || pathname === "/index.html") {
    return "/";
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Moves keyboard/screen-reader focus to the active view's `<h1>` element without jumping scroll.
 * @param {HTMLElement | null} container
 */
function focusViewHeading(container) {
  if (!container) return;
  const h1 = container.querySelector("h1");
  if (!h1) return;
  if (!h1.hasAttribute("tabindex")) {
    h1.setAttribute("tabindex", "-1");
  }
  h1.focus({ preventScroll: true });
}

/**
 * Scrolls smoothly (or instantly under reduced motion) to a section element by ID.
 * @param {string} hash
 */
function scrollToAnchor(hash) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  target.scrollIntoView({
    behavior: prefersReduced ? "auto" : "smooth",
    block: "start",
  });
}

/**
 * Resolves the current URL and switches active views (`#home-view`, `#blog-view`, `#not-found-view`).
 * @param {Object} [options]
 * @param {boolean} [options.isPopState=false]
 * @param {number} [options.restoreScrollY]
 * @param {boolean} [options.focusHeading=false]
 */
export async function handleRoute(options = {}) {
  const { isPopState = false, restoreScrollY, focusHeading = false } = options;

  const rawPath = window.location.pathname;
  const path = normalizePath(rawPath);
  const hash = window.location.hash;

  const homeView = document.getElementById("home-view");
  const blogView = document.getElementById("blog-view");
  const notFoundView = document.getElementById("not-found-view");
  const skipLink = document.querySelector(".skip-link");

  // 1. Home route (`/`)
  if (path === "/") {
    const viewChanged = currentView !== "home";
    currentView = "home";

    if (homeView) homeView.hidden = false;
    if (blogView) blogView.hidden = true;
    if (notFoundView) notFoundView.hidden = true;
    if (skipLink) skipLink.setAttribute("href", "#about");

    updateRouteMeta({
      title: DEFAULT_META.title,
      description: DEFAULT_META.description,
      path: "/",
    });

    setScrollSpyMode(true);

    if (isPopState && typeof restoreScrollY === "number") {
      window.scrollTo({ top: restoreScrollY, behavior: "auto" });
    } else if (hash) {
      // Wait a frame if switching from another view so layout is ready
      if (viewChanged) {
        requestAnimationFrame(() => scrollToAnchor(hash));
      } else {
        scrollToAnchor(hash);
      }
    } else if (viewChanged) {
      window.scrollTo({ top: 0, behavior: "auto" });
      if (focusHeading) {
        focusViewHeading(homeView);
      }
    }
    return;
  }

  // 2. Blog list (`/blog`) or blog post (`/blog/:slug`)
  const blogMatch = path.match(/^\/blog(?:\/([^/]+))?$/);
  if (blogMatch) {
    const slug = blogMatch[1] ? decodeURIComponent(blogMatch[1]) : null;
    currentView = "blog";

    if (homeView) homeView.hidden = true;
    if (blogView) blogView.hidden = false;
    if (notFoundView) notFoundView.hidden = true;
    if (skipLink) skipLink.setAttribute("href", "#blog-view");

    setScrollSpyMode(false);
    setNavActive("blog", "page");

    if (!blogRouteHandler) {
      const blogMod = await import("./blog.js");
      blogRouteHandler = blogMod.renderBlogRoute;
    }

    if (blogRouteHandler) {
      await blogRouteHandler(slug);
    }

    if (isPopState && typeof restoreScrollY === "number") {
      window.scrollTo({ top: restoreScrollY, behavior: "auto" });
    } else if (hash) {
      scrollToAnchor(hash);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    if (focusHeading && !hash) {
      focusViewHeading(blogView);
    }
    return;
  }

  // 3. Unknown path -> Styled 404 view
  currentView = "404";
  if (homeView) homeView.hidden = true;
  if (blogView) blogView.hidden = true;
  if (notFoundView) notFoundView.hidden = false;
  if (skipLink) skipLink.setAttribute("href", "#not-found-view");

  setScrollSpyMode(false);
  setNavActive(null);

  updateRouteMeta({
    title: "404 — Page Not Found | Tarik Sorguč",
    description: "The requested page could not be found on tariksorguc.me.",
    path,
  });

  window.scrollTo({ top: 0, behavior: "auto" });
  if (focusHeading) {
    focusViewHeading(notFoundView);
  }
}

/**
 * Navigates to an internal URL via History API without full page reload.
 * @param {string} href
 */
export function navigateTo(href) {
  const url = new URL(href, window.location.origin);
  const targetPath = normalizePath(url.pathname);
  const currentPath = normalizePath(window.location.pathname);

  // Save current scroll position into current history entry before pushing
  try {
    history.replaceState(
      { ...(history.state || {}), scrollY: window.scrollY },
      "",
      window.location.href,
    );
  } catch {
    // Ignore history state errors on restricted protocols
  }

  const isSamePath =
    targetPath === currentPath && url.search === window.location.search;

  if (isSamePath && url.hash) {
    history.pushState({ scrollY: window.scrollY }, "", url.pathname + url.search + url.hash);
    scrollToAnchor(url.hash);
    return;
  }

  if (isSamePath && !url.hash && targetPath === "/") {
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    return;
  }

  history.pushState({ scrollY: 0 }, "", url.pathname + url.search + url.hash);
  handleRoute({ isPopState: false, focusHeading: !url.hash });
}

/**
 * Initializes the SPA History API router.
 */
export function initRouter() {
  // Intercept internal link clicks
  document.addEventListener("click", (e) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    const target = /** @type {HTMLElement | null} */ (e.target);
    const anchor = target ? target.closest("a") : null;
    if (!anchor) return;

    const rawHref = anchor.getAttribute("href");
    if (!rawHref) return;

    // Ignore external links, new-tab links, downloads, mailto/tel
    if (
      anchor.hasAttribute("download") ||
      anchor.getAttribute("target") === "_blank" ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("http://") ||
      rawHref.startsWith("https://")
    ) {
      return;
    }

    // Ignore in-place interactive triggers like `#calendar-booking`
    if (rawHref === "#calendar-booking") {
      return;
    }

    if (rawHref.startsWith("/") || rawHref.startsWith("#")) {
      e.preventDefault();
      const normalizedHref = rawHref.startsWith("#") ? `/${rawHref}` : rawHref;
      navigateTo(normalizedHref);
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener("popstate", (e) => {
    const savedScrollY =
      e.state && typeof e.state.scrollY === "number" ? e.state.scrollY : undefined;
    handleRoute({
      isPopState: true,
      restoreScrollY: savedScrollY,
      focusHeading: true,
    });
  });

  // Initial route evaluation on page load
  handleRoute({ isPopState: false, focusHeading: false });
}
