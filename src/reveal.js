// @ts-check

/**
 * Initializes scroll-triggered reveal animations (`.reveal` -> `.is-revealed`)
 * using `IntersectionObserver` with staggered children.
 * Respects `prefers-reduced-motion: reduce` by immediately revealing all elements.
 */
export function initReveal() {
  const groups = document.querySelectorAll("[data-reveal-group]");
  groups.forEach((group) => {
    const children = group.querySelectorAll(":scope > [data-reveal]");
    children.forEach((child, idx) => {
      const el = /** @type {HTMLElement} */ (child);
      el.style.setProperty("--reveal-index", String(idx));
    });
  });

  const targets = /** @type {NodeListOf<HTMLElement>} */ (
    document.querySelectorAll("[data-reveal]")
  );
  if (targets.length === 0) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => {
      el.classList.add("is-revealed");
    });
    return;
  }

  // Mark document as reveal-ready so CSS only hides unrevealed items when JS is active
  document.documentElement.classList.add("js-reveal");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    },
  );

  targets.forEach((el) => {
    observer.observe(el);
  });
}
