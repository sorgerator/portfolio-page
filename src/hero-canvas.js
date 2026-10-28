// @ts-check

/**
 * @typedef {Object} NetworkNode
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} radius
 * @property {boolean} isAccent
 */

/**
 * Converts a hex color string (`#RRGGBB`) to RGB components.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
function hexToRgb(hex) {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) {
    return { r: 243, g: 244, b: 246 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Initializes the rotating role phrase beneath the Hero H1.
 * Respects `prefers-reduced-motion: reduce` by keeping the first phrase static.
 */
function initRoleRotator() {
  const rotatorEl = document.getElementById("heroRoleText");
  if (!rotatorEl) return;

  const phrases = [
    "builds data pipelines",
    "ships web apps",
    "automates workflows",
  ];

  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  if (reducedMotionQuery && reducedMotionQuery.matches) {
    rotatorEl.textContent = phrases[0];
    return;
  }

  let index = 0;
  /** @type {number | null} */
  let intervalId = null;

  const startRotation = () => {
    if (intervalId !== null) return;
    intervalId = window.setInterval(() => {
      if (document.hidden) return;
      rotatorEl.classList.add("is-switching");
      window.setTimeout(() => {
        index = (index + 1) % phrases.length;
        rotatorEl.textContent = phrases[index];
        rotatorEl.classList.remove("is-switching");
      }, 220);
    }, 3000);
  };

  const stopRotation = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  startRotation();

  if (reducedMotionQuery) {
    reducedMotionQuery.addEventListener("change", (e) => {
      if (e.matches) {
        stopRotation();
        rotatorEl.classList.remove("is-switching");
        rotatorEl.textContent = phrases[0];
      } else {
        startRotation();
      }
    });
  }
}

/**
 * Initializes the Hero node-network canvas that echoes the TS logo.
 */
export function initHeroCanvas() {
  initRoleRotator();

  const canvas = /** @type {HTMLCanvasElement | null} */ (
    document.getElementById("heroCanvas")
  );
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const heroSection = document.getElementById("hero");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let canvasLeft = 0;
  let canvasTop = 0;
  /** @type {NetworkNode[]} */
  let nodes = [];
  /** @type {number | null} */
  let rafId = null;
  let isVisible = true;
  let driftReady = false;

  const pointer = {
    x: -9999,
    y: -9999,
    active: false,
  };

  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  let palette = {
    nodeRgb: { r: 243, g: 244, b: 246 },
    mutedRgb: { r: 156, g: 163, b: 175 },
    redRgb: { r: 239, g: 68, b: 68 },
  };

  /**
   * Refreshes RGB colors from CSS custom properties on `:root`.
   */
  function syncPalette() {
    const style = getComputedStyle(document.documentElement);
    const fg = style.getPropertyValue("--fg") || "#F3F4F6";
    const muted = style.getPropertyValue("--fg-muted") || "#9CA3AF";
    const red = style.getPropertyValue("--red") || "#EF4444";
    palette = {
      nodeRgb: hexToRgb(fg),
      mutedRgb: hexToRgb(muted),
      redRgb: hexToRgb(red),
    };
  }

  /**
   * Populates the node array based on current viewport width.
   */
  function createNodes() {
    const isMobile = width < 768;
    const count = isMobile ? 34 : 68;
    nodes = [];

    for (let i = 0; i < count; i++) {
      const isAccent = i % 8 === 0;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.26;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: isAccent ? 2.5 + Math.random() * 1.0 : 1.5 + Math.random() * 1.0,
        isAccent,
      });
    }
  }

  /**
   * Resizes the canvas using layout dimensions without forcing synchronous reflow.
   */
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const container = heroSection || canvas.parentElement || document.documentElement;
    width = Math.max(1, container.clientWidth || window.innerWidth);
    height = Math.max(1, container.clientHeight || window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createNodes();
    drawFrame(false);
  }

  /**
   * Draws a single frame of the node network and optionally advances node positions.
   * @param {boolean} stepPhysics
   */
  function drawFrame(stepPhysics) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const maxDist = width < 768 ? 115 : 145;
    const maxDistSq = maxDist * maxDist;
    const pointerRadius = 160;
    const pointerRadiusSq = pointerRadius * pointerRadius;

    if (stepPhysics) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) {
          n.x = 0;
          n.vx *= -1;
        } else if (n.x > width) {
          n.x = width;
          n.vx *= -1;
        }

        if (n.y < 0) {
          n.y = 0;
          n.vy *= -1;
        } else if (n.y > height) {
          n.y = height;
          n.vy *= -1;
        }

        if (pointer.active) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const dSq = dx * dx + dy * dy;
          if (dSq > 1 && dSq < pointerRadiusSq) {
            const dist = Math.sqrt(dSq);
            const force = (1 - dist / pointerRadius) * 0.45;
            n.x += (dx / dist) * force;
            n.y += (dy / dist) * force;
          }
        }
      }
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.22;
          const hasAccent = a.isAccent || b.isAccent;
          const c = hasAccent ? palette.redRgb : palette.mutedRgb;
          ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (pointer.active) {
        const pdx = a.x - pointer.x;
        const pdy = a.y - pointer.y;
        const pDistSq = pdx * pdx + pdy * pdy;
        if (pDistSq < pointerRadiusSq) {
          const pAlpha = (1 - Math.sqrt(pDistSq) / pointerRadius) * 0.32;
          const c = palette.redRgb;
          ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${pAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.isAccent) {
        const c = palette.redRgb;
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.22)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.92)`;
      } else {
        const c = palette.nodeRgb;
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.55)`;
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Animation loop.
   */
  function tick() {
    if (!shouldAnimate()) {
      rafId = null;
      return;
    }
    drawFrame(true);
    rafId = window.requestAnimationFrame(tick);
  }

  /**
   * Determines whether the animation loop should currently run.
   * @returns {boolean}
   */
  function shouldAnimate() {
    const prefersReduced =
      reducedMotionQuery !== null && reducedMotionQuery.matches;
    return driftReady && !prefersReduced && isVisible && !document.hidden;
  }

  /**
   * Starts or stops the animation loop based on visibility and motion settings.
   */
  function updateRunState() {
    if (shouldAnimate()) {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    } else {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      drawFrame(false);
    }
  }

  if (heroSection) {
    heroSection.addEventListener(
      "pointermove",
      (e) => {
        pointer.x = e.clientX - canvasLeft;
        pointer.y = e.clientY + window.scrollY - canvasTop;
        pointer.active = true;
        if (!driftReady) {
          driftReady = true;
          updateRunState();
        }
      },
      { passive: true },
    );

    heroSection.addEventListener("pointerleave", () => {
      pointer.active = false;
    });
  }

  if ("IntersectionObserver" in window && heroSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          updateRunState();
        });
      },
      { threshold: 0.05 },
    );
    observer.observe(heroSection);
  }

  document.addEventListener("visibilitychange", updateRunState);

  document.documentElement.addEventListener("themechange", () => {
    syncPalette();
    drawFrame(false);
  });

  if (reducedMotionQuery) {
    reducedMotionQuery.addEventListener("change", updateRunState);
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeCanvas, 120);
  });

  syncPalette();
  resizeCanvas();

  // Start gentle drift after initial paint settles
  window.setTimeout(() => {
    driftReady = true;
    updateRunState();
  }, 4500);
}
