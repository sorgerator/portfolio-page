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
 * Attaches the pointer-tracking radial spotlight effect (`--mx`, `--my`) to each project card.
 * Disabled automatically when `prefers-reduced-motion: reduce` is active.
 * @param {NodeListOf<HTMLElement>} cards
 */
function initCardSpotlight(cards) {
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  cards.forEach((card) => {
    card.addEventListener(
      "pointermove",
      (e) => {
        if (reducedMotionQuery && reducedMotionQuery.matches) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mx", `${x.toFixed(1)}px`);
        card.style.setProperty("--my", `${y.toFixed(1)}px`);
      },
      { passive: true },
    );
  });
}

/**
 * Initializes the native `<dialog>` detail view for project cards.
 * @param {NodeListOf<HTMLElement>} cards
 */
function initCaseDialog(cards) {
  const dialog = /** @type {HTMLDialogElement | null} */ (
    document.getElementById("caseDialog")
  );
  if (!dialog) return;

  const trackEl = document.getElementById("caseDialogTrack");
  const periodEl = document.getElementById("caseDialogPeriod");
  const titleEl = document.getElementById("caseDialogTitle");
  const metricsEl = document.getElementById("caseDialogMetrics");
  const bodyEl = document.getElementById("caseDialogBody");
  const tagsEl = document.getElementById("caseDialogTags");
  const linksEl = document.getElementById("caseDialogLinks");
  const closeBtn = document.getElementById("caseDialogClose");
  const doneBtn = document.getElementById("caseDialogDoneBtn");

  /** @type {HTMLElement | null} */
  let lastTriggerBtn = null;

  /**
   * Populates and opens the native `<dialog>` from a given card element.
   * @param {HTMLElement} card
   * @param {HTMLElement} triggerBtn
   */
  function openDialogForCard(card, triggerBtn) {
    if (!dialog) return;
    lastTriggerBtn = triggerBtn;

    const cardTrack = card.getAttribute("data-track") || "data";
    dialog.setAttribute("data-track", cardTrack);

    const badge = card.querySelector(".track-badge");
    if (trackEl) {
      trackEl.textContent = badge ? badge.textContent || "" : "";
    }

    const period = card.querySelector(".card-period");
    if (periodEl) {
      periodEl.textContent = period ? period.textContent || "" : "";
    }

    const title = card.querySelector(".card-title");
    if (titleEl) {
      titleEl.textContent = title ? (title.textContent || "").trim() : "";
    }

    const metrics = card.querySelector(".card-metrics");
    if (metricsEl) {
      if (metrics && metrics.innerHTML.trim()) {
        metricsEl.innerHTML = metrics.innerHTML;
        metricsEl.hidden = false;
      } else {
        metricsEl.innerHTML = "";
        metricsEl.hidden = true;
      }
    }

    const details = card.querySelector(".card-details");
    if (bodyEl) {
      if (details) {
        bodyEl.innerHTML = details.innerHTML;
      } else {
        const summary = card.querySelector(".card-summary");
        bodyEl.innerHTML = summary ? `<p>${summary.innerHTML}</p>` : "";
      }
    }

    const tags = card.querySelector(".card-tags");
    if (tagsEl) {
      tagsEl.innerHTML = tags ? tags.innerHTML : "";
    }

    const links = card.querySelector(".card-links");
    if (linksEl) {
      linksEl.innerHTML = links ? links.innerHTML : "";
    }

    document.body.classList.add("modal-open");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  /**
   * Closes the native `<dialog>`.
   */
  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      document.body.classList.remove("modal-open");
      if (lastTriggerBtn) lastTriggerBtn.focus();
    }
  }

  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (lastTriggerBtn) {
      lastTriggerBtn.focus();
    }
  });

  // Close when clicking the backdrop area outside `.case-dialog-inner`
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeDialog);
  }

  if (doneBtn) {
    doneBtn.addEventListener("click", closeDialog);
  }

  cards.forEach((card) => {
    const detailsBtn = /** @type {HTMLElement | null} */ (
      card.querySelector(".card-details-btn")
    );
    if (detailsBtn) {
      detailsBtn.addEventListener("click", () => {
        openDialogForCard(card, detailsBtn);
      });
    }
  });
}

/**
 * Initializes the Case Studies segmented control, card counts, track filtering,
 * staggered reveal animation, URL query synchronization, card spotlight, and `<dialog>`.
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

  // Initialize Phase 5 spotlight and native `<dialog>`
  initCardSpotlight(cards);
  initCaseDialog(cards);

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

    const grid = document.getElementById("casesGrid");
    if (grid) {
      grid.setAttribute(
        "aria-labelledby",
        track === "software" ? "tab-software" : "tab-data",
      );
    }

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

  // 5. Re-sync track when navigating back/forward via browser history
  window.addEventListener("popstate", () => {
    if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
      setTrack(getInitialTrack(), { updateUrl: false, animate: false });
    }
  });
}
