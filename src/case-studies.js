// @ts-check

/** @typedef {"data" | "software"} TrackType */

/**
 * Reads the initial track from `?track=software` or `?track=data` URL query parameter.
 * Defaults to `"data"` (Data and Automation) on first visit.
 * @returns {TrackType}
 */
function getInitialTrack() {
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("track");
    if (param === "software" || param === "data") {
      return param;
    }
  } catch {
    // Ignore URL parsing errors
  }
  return "data";
}

/**
 * Updates the `?track=` query parameter in the URL without triggering a page reload.
 * @param {TrackType} track
 */
function syncTrackToUrl(track) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("track", track);
    history.replaceState(
      history.state || { scrollY: window.scrollY },
      "",
      url.pathname + url.search + url.hash,
    );
  } catch {
    // Ignore replaceState errors on restricted origins
  }
}

/**
 * Initializes the Case Studies segmented control, card counts, track filtering,
 * staggered reveal animation, and URL query synchronization.
 */
export function initCaseStudies() {
  const section = document.getElementById("work");
  if (!section) return;

  const tablist = section.querySelector('[role="tablist"]');
  const tabs = /** @type {NodeListOf<HTMLButtonElement>} */ (
    section.querySelectorAll('[role="tab"][data-track-tab]')
  );
  const cards = /** @type {NodeListOf<HTMLElement>} */ (
    section.querySelectorAll(".card[data-track]")
  );
  const emptyState = /** @type {HTMLElement | null} */ (
    document.getElementById("casesEmptyState")
  );

  if (!tablist || tabs.length === 0) return;

  // 1. Compute and render project counts next to each tab label
  const counts = { data: 0, software: 0 };
  cards.forEach((card) => {
    const t = card.getAttribute("data-track");
    if (t === "data") counts.data += 1;
    else if (t === "software") counts.software += 1;
  });

  tabs.forEach((tab) => {
    const t = tab.getAttribute("data-track-tab");
    const badge = tab.querySelector(".tab-count");
    if (badge && (t === "data" || t === "software")) {
      badge.textContent = String(counts[t]);
    }
  });

  /**
   * Switches the active track, updates ARIA attributes, filters cards with staggered animation,
   * and optionally updates the URL query string.
   * @param {TrackType} track
   * @param {Object} [options]
   * @param {boolean} [options.updateUrl=true]
   * @param {boolean} [options.animate=true]
   * @param {boolean} [options.focusTab=false]
   */
  function setTrack(track, options = {}) {
    const { updateUrl = true, animate = true, focusTab = false } = options;

    if (!section) return;
    section.setAttribute("data-track", track);

    tabs.forEach((tab) => {
      const tabTrack = tab.getAttribute("data-track-tab");
      const isSelected = tabTrack === track;
      tab.setAttribute("aria-selected", isSelected ? "true" : "false");
      tab.setAttribute("tabindex", isSelected ? "0" : "-1");
      tab.classList.toggle("is-active", isSelected);

      if (isSelected && focusTab) {
        tab.focus();
      }
    });

    let visibleIndex = 0;
    cards.forEach((card) => {
      const cardTrack = card.getAttribute("data-track");
      const isMatch = cardTrack === track;

      if (isMatch) {
        card.hidden = false;
        card.style.setProperty("--stagger-index", String(visibleIndex));
        if (animate) {
          card.classList.remove("is-entering");
          // Force reflow to restart CSS stagger animation cleanly
          void card.offsetWidth;
          card.classList.add("is-entering");
        }
        visibleIndex += 1;
      } else {
        card.hidden = true;
        card.classList.remove("is-entering");
      }
    });

    if (emptyState) {
      emptyState.hidden = visibleIndex > 0;
    }

    if (updateUrl) {
      syncTrackToUrl(track);
    }
  }

  // 2. Click listeners on tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTrack = /** @type {TrackType | null} */ (
        tab.getAttribute("data-track-tab")
      );
      if (targetTrack === "data" || targetTrack === "software") {
        setTrack(targetTrack, { updateUrl: true, animate: true });
      }
    });
  });

  // 3. Keyboard navigation (ArrowLeft, ArrowRight, Home, End) on tablist
  tablist.addEventListener("keydown", (e) => {
    const keyEvent = /** @type {KeyboardEvent} */ (e);
    const key = keyEvent.key;
    if (
      key !== "ArrowLeft" &&
      key !== "ArrowRight" &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }

    keyEvent.preventDefault();
    const tabArray = Array.from(tabs);
    const currentIndex = tabArray.findIndex(
      (t) => t.getAttribute("aria-selected") === "true",
    );

    let nextIndex = currentIndex;
    if (key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabArray.length;
    } else if (key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
    } else if (key === "Home") {
      nextIndex = 0;
    } else if (key === "End") {
      nextIndex = tabArray.length - 1;
    }

    const nextTab = tabArray[nextIndex];
    const nextTrack = /** @type {TrackType | null} */ (
      nextTab ? nextTab.getAttribute("data-track-tab") : null
    );
    if (nextTrack === "data" || nextTrack === "software") {
      setTrack(nextTrack, {
        updateUrl: true,
        animate: true,
        focusTab: true,
      });
    }
  });

  // 4. Initialize with URL parameter (if present) or default to "data"
  const initialTrack = getInitialTrack();
  const hasUrlParam = new URLSearchParams(window.location.search).has("track");
  setTrack(initialTrack, { updateUrl: hasUrlParam, animate: false });
}
