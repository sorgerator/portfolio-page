// @ts-check

/** @type {IntersectionObserver | null} */
let spyObserver = null;
/** @type {boolean} */
let isHomeActive = true;

/**
 * Updates the active state of navigation links.
 * @param {string | null} activeKey - "about" | "work" | "blog" | "contact" | null
 * @param {"page" | "location"} [ariaType="location"]
 */
export function setNavActive(activeKey, ariaType = "location") {
  const links = document.querySelectorAll(".nav-links a[data-nav]");
  links.forEach((link) => {
    const key = link.getAttribute("data-nav");
    if (activeKey && key === activeKey) {
      link.classList.add("active");
      link.setAttribute("aria-current", ariaType);
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * Enables or disables home section scroll-spy depending on the active route.
 * @param {boolean} onHome
 */
export function setScrollSpyMode(onHome) {
  isHomeActive = onHome;
  if (!onHome) {
    return;
  }
  updateScrollSpyFromScroll();
}

/**
 * Computes which home section is currently in view based on scroll position.
 */
function updateScrollSpyFromScroll() {
  if (!isHomeActive) return;

  const scrollY = window.scrollY;
  if (scrollY < 180) {
    setNavActive(null);
    return;
  }

  const sectionIds = ["about", "work", "contact"];
  const viewportTrigger = scrollY + window.innerHeight * 0.35;
  /** @type {string | null} */
  let currentId = null;

  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= viewportTrigger) {
      currentId = id;
    }
  }

  setNavActive(currentId, "location");
}

/**
 * Updates the 2px top scroll progress bar width.
 */
function updateScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;

  const docEl = document.documentElement;
  const scrollTop = window.scrollY || docEl.scrollTop;
  const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
  const ratio = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;

  bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
}

/**
 * Initializes the floating navigation bar, mobile hamburger menu,
 * scroll-spy, scroll progress bar, and footer back-to-top button.
 */
export function initNav() {
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  /**
   * Opens or closes the mobile navigation drawer.
   * @param {boolean} [forceState]
   */
  function toggleNavMenu(forceState) {
    if (!navToggle || !navLinks) return;
    const shouldOpen =
      forceState !== undefined
        ? forceState
        : !navLinks.classList.contains("open");
    navToggle.classList.toggle("open", shouldOpen);
    navLinks.classList.toggle("open", shouldOpen);
    navToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  }

  if (navToggle) {
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNavMenu();
    });
  }

  if (navLinks) {
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggleNavMenu(false);
      });
    });
  }

  // Close mobile menu when clicking outside the navbar
  document.addEventListener("click", (e) => {
    if (navLinks && navLinks.classList.contains("open")) {
      const target = /** @type {Node | null} */ (e.target);
      if (navbar && target && !navbar.contains(target)) {
        toggleNavMenu(false);
      }
    }
  });

  // Close mobile menu on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks && navLinks.classList.contains("open")) {
      toggleNavMenu(false);
      if (navToggle) navToggle.focus();
    }
  });

  // Close mobile menu when resizing above mobile breakpoint
  window.addEventListener("resize", () => {
    if (
      window.innerWidth > 768 &&
      navLinks &&
      navLinks.classList.contains("open")
    ) {
      toggleNavMenu(false);
    }
    updateScrollProgress();
  });

  // Throttled scroll listener for progress bar and scroll-spy
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollProgress();
          updateScrollSpyFromScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  // Also use IntersectionObserver as an entry trigger for sections
  if ("IntersectionObserver" in window) {
    spyObserver = new IntersectionObserver(
      () => {
        updateScrollSpyFromScroll();
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0,
      },
    );

    ["about", "work", "contact"].forEach((id) => {
      const section = document.getElementById(id);
      if (section && spyObserver) {
        spyObserver.observe(section);
      }
    });
  }

  // Back to top button in footer
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const prefersReduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    });
  }

  // Initial calculation
  updateScrollProgress();
  updateScrollSpyFromScroll();
}
