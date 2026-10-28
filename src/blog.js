// @ts-check
import { registerBlogRouteHandler, updateRouteMeta } from "./router.js";

/**
 * @typedef {Object} BlogPostMeta
 * @property {string} slug
 * @property {string} title
 * @property {string} date
 * @property {string} summary
 * @property {string[]} tags
 * @property {boolean} [draft]
 * @property {number} [readingMinutes]
 */

/** @type {BlogPostMeta[] | null} */
let cachedPublishedPosts = null;

/** @type {Map<string, string>} */
const markdownCache = new Map();

/** @type {boolean} */
let blogCssLoaded = false;

/** @type {{ marked: any, hljs: any } | null} */
let markdownEngine = null;

/**
 * Lazily injects `/src/styles/blog.css` on first visit to any blog route.
 * @returns {Promise<void>}
 */
function ensureBlogStyles() {
  if (blogCssLoaded || document.getElementById("blogStylesheet")) {
    blogCssLoaded = true;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = "blogStylesheet";
    link.rel = "stylesheet";
    link.href = "/src/styles/blog.css";
    link.onload = () => {
      blogCssLoaded = true;
      resolve();
    };
    link.onerror = () => {
      blogCssLoaded = true;
      resolve();
    };
    document.head.appendChild(link);
  });
}

/**
 * Lazily imports `marked` and `highlight.js` (core + python, sql, javascript, typescript, bash)
 * only when rendering a blog post.
 * @returns {Promise<{ marked: any, hljs: any }>}
 */
async function ensureMarkdownEngine() {
  if (markdownEngine) {
    return markdownEngine;
  }

  const [
    markedMod,
    hljsCoreMod,
    pyMod,
    sqlMod,
    jsMod,
    tsMod,
    bashMod,
  ] = await Promise.all([
    // @ts-ignore — vendored ESM bundle
    import("/vendor/marked.esm.js"),
    // @ts-ignore — vendored ESM bundle
    import("/vendor/hljs-core.esm.js"),
    // @ts-ignore — vendored ESM bundle
    import("/vendor/hljs-python.esm.js"),
    // @ts-ignore — vendored ESM bundle
    import("/vendor/hljs-sql.esm.js"),
    // @ts-ignore — vendored ESM bundle
    import("/vendor/hljs-javascript.esm.js"),
    // @ts-ignore — vendored ESM bundle
    import("/vendor/hljs-typescript.esm.js"),
    // @ts-ignore — vendored ESM bundle
    import("/vendor/hljs-bash.esm.js"),
  ]);

  const marked = markedMod.marked || markedMod.default;
  const hljs = hljsCoreMod.default || hljsCoreMod;

  hljs.registerLanguage("python", pyMod.default || pyMod);
  hljs.registerLanguage("py", pyMod.default || pyMod);
  hljs.registerLanguage("sql", sqlMod.default || sqlMod);
  hljs.registerLanguage("javascript", jsMod.default || jsMod);
  hljs.registerLanguage("js", jsMod.default || jsMod);
  hljs.registerLanguage("typescript", tsMod.default || tsMod);
  hljs.registerLanguage("ts", tsMod.default || tsMod);
  hljs.registerLanguage("bash", bashMod.default || bashMod);
  hljs.registerLanguage("sh", bashMod.default || bashMod);

  markdownEngine = { marked, hljs };
  return markdownEngine;
}

/**
 * Escapes HTML special characters for safe template interpolation.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formats an ISO date string (`YYYY-MM-DD`) into a readable date (`Oct 28, 2026`).
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Computes estimated reading time in minutes (words / 200, min 1).
 * @param {string} markdown
 * @returns {number}
 */
function calculateReadingMinutes(markdown) {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Fetches raw Markdown for a given post slug (with in-memory caching).
 * @param {string} slug
 * @returns {Promise<string>}
 */
async function fetchPostMarkdown(slug) {
  const cached = markdownCache.get(slug);
  if (cached !== undefined) {
    return cached;
  }

  const res = await fetch(`/content/blog/${encodeURIComponent(slug)}.md`);
  if (!res.ok) {
    throw new Error(`Failed to load markdown for ${slug}`);
  }
  const text = await res.text();
  markdownCache.set(slug, text);
  return text;
}

/**
 * Loads `/content/blog/posts.json`, filters out `draft: true` entries,
 * sorts newest-first, and computes reading time for published posts.
 * @returns {Promise<BlogPostMeta[]>}
 */
async function loadPublishedPosts() {
  if (cachedPublishedPosts) {
    return cachedPublishedPosts;
  }

  try {
    const res = await fetch("/content/blog/posts.json");
    if (!res.ok) {
      cachedPublishedPosts = [];
      return [];
    }
    const allPosts = /** @type {BlogPostMeta[]} */ (await res.json());
    const published = allPosts
      .filter((p) => p && !p.draft && p.slug && p.title)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    await Promise.all(
      published.map(async (post) => {
        try {
          const md = await fetchPostMarkdown(post.slug);
          post.readingMinutes = calculateReadingMinutes(md);
        } catch {
          post.readingMinutes = 1;
        }
      }),
    );

    cachedPublishedPosts = published;
    return published;
  } catch (err) {
    console.error("Failed to load blog manifest:", err);
    return [];
  }
}

/**
 * Renders the `/blog` list view with tag filter chips, reading time, and empty state.
 * @param {HTMLElement} container
 */
async function renderBlogList(container) {
  updateRouteMeta({
    title: "Blog | Tarik Sorguč — Data Science & Web Engineering",
    description:
      "Articles and technical notes by Tarik Sorguč on machine learning ranking models, automated data pipelines, and web engineering.",
    path: "/blog",
  });

  const posts = await loadPublishedPosts();

  if (posts.length === 0) {
    container.innerHTML = `
      <section class="blog-section container">
        <header class="blog-header">
          <p class="eyebrow mono">04 / Blog</p>
          <h1 class="blog-title" tabindex="-1">Technical Writing &amp; Notes</h1>
          <p class="blog-lead">
            Deep dives into machine learning ranking models, multimodal data pipelines, and building fast web applications without frameworks.
          </p>
        </header>

        <div class="blog-empty">
          <span class="blog-empty-badge">Publishing Soon</span>
          <h2 class="blog-empty-title">First posts coming soon</h2>
          <p class="blog-empty-text">
            New articles on content decay prediction, SQLite state-machine automation, and zero-framework web architecture are currently in progress.
          </p>
          <a href="/" class="btn-secondary">&larr; Back to Home</a>
        </div>
      </section>
    `;
    return;
  }

  // Collect unique tags across all published posts
  /** @type {string[]} */
  const allTags = [];
  posts.forEach((p) => {
    (p.tags || []).forEach((tag) => {
      if (!allTags.includes(tag)) {
        allTags.push(tag);
      }
    });
  });

  /**
   * Builds the HTML for cards matching the selected tag.
   * @param {string} activeTag
   * @returns {string}
   */
  function buildCardsHtml(activeTag) {
    const filtered =
      activeTag === "all"
        ? posts
        : posts.filter((p) => (p.tags || []).includes(activeTag));

    if (filtered.length === 0) {
      return `
        <div class="blog-empty">
          <h2 class="blog-empty-title">No posts with tag "${escapeHtml(activeTag)}"</h2>
        </div>
      `;
    }

    return filtered
      .map((post) => {
        const tagsHtml = (post.tags || [])
          .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
          .join("");
        const minutes = post.readingMinutes || 1;
        return `
          <article class="blog-card">
            <div>
              <div class="blog-card-meta">
                <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>
                <span class="blog-meta-sep" aria-hidden="true">&middot;</span>
                <span>${minutes} min read</span>
              </div>
              <h2 class="blog-card-title">
                <a href="/blog/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
              </h2>
              <p class="blog-card-summary">${escapeHtml(post.summary)}</p>
            </div>
            <div class="blog-card-footer">
              <div class="blog-card-tags">${tagsHtml}</div>
              <a href="/blog/${encodeURIComponent(post.slug)}" class="blog-read-link">
                Read article &rarr;
              </a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  const filterChipsHtml = [
    `<button type="button" class="blog-tag-chip is-active" data-tag="all" aria-pressed="true">All (${posts.length})</button>`,
    ...allTags.map(
      (tag) =>
        `<button type="button" class="blog-tag-chip" data-tag="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(tag)}</button>`,
    ),
  ].join("");

  container.innerHTML = `
    <section class="blog-section container">
      <header class="blog-header">
        <p class="eyebrow mono">04 / Blog</p>
        <h1 class="blog-title" tabindex="-1">Technical Writing &amp; Notes</h1>
        <p class="blog-lead">
          Deep dives into machine learning ranking models, multimodal data pipelines, and building fast web applications without frameworks.
        </p>
      </header>

      <div class="blog-filter-bar" role="toolbar" aria-label="Filter posts by tag">
        ${filterChipsHtml}
      </div>

      <div class="blog-list" id="blogCardsList">
        ${buildCardsHtml("all")}
      </div>
    </section>
  `;

  const listEl = document.getElementById("blogCardsList");
  const chips = container.querySelectorAll(".blog-tag-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selectedTag = chip.getAttribute("data-tag") || "all";
      chips.forEach((c) => {
        const isCurrent = c === chip;
        c.classList.toggle("is-active", isCurrent);
        c.setAttribute("aria-pressed", isCurrent ? "true" : "false");
      });
      if (listEl) {
        listEl.innerHTML = buildCardsHtml(selectedTag);
      }
    });
  });
}

/**
 * Converts heading text into a URL-safe anchor ID.
 * @param {string} text
 * @returns {string}
 */
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Post-processes rendered Markdown inside `proseEl`:
 * - Adds heading IDs and anchor links (`#`) to `h2`, `h3`, `h4`
 * - Highlights `<pre><code>` blocks with `highlight.js`
 * - Sets `loading="lazy"` and `decoding="async"` on images
 * @param {HTMLElement} proseEl
 * @param {any} hljs
 */
function enhanceRenderedPost(proseEl, hljs) {
  // 1. Heading anchors
  const headings = proseEl.querySelectorAll("h2, h3, h4");
  headings.forEach((heading) => {
    const text = (heading.textContent || "").trim();
    if (!text) return;
    const id = heading.id || slugifyHeading(text);
    heading.id = id;

    const anchor = document.createElement("a");
    anchor.href = `#${id}`;
    anchor.className = "heading-anchor";
    anchor.setAttribute("aria-label", `Link to section ${text}`);
    anchor.textContent = "#";
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(
        history.state,
        "",
        `${window.location.pathname}#${id}`,
      );
    });
    heading.appendChild(anchor);
  });

  // 2. Code syntax highlighting
  const codeBlocks = proseEl.querySelectorAll("pre code");
  codeBlocks.forEach((block) => {
    try {
      hljs.highlightElement(block);
    } catch {
      // Fallback to unhighlighted code if language is unregistered
    }
  });

  // 3. Responsive lazy images
  const images = proseEl.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });
}

/**
 * Renders an individual blog post (`/blog/:slug`) or a not-found state if missing/draft.
 * @param {HTMLElement} container
 * @param {string} slug
 */
async function renderBlogPost(container, slug) {
  const posts = await loadPublishedPosts();
  const postIndex = posts.findIndex((p) => p.slug === slug);

  if (postIndex === -1) {
    updateRouteMeta({
      title: "Post Not Found | Blog — Tarik Sorguč",
      description: "The requested blog post could not be found.",
      path: `/blog/${encodeURIComponent(slug)}`,
    });

    container.innerHTML = `
      <section class="blog-section container">
        <div class="blog-post-container">
          <a href="/blog" class="blog-back-link">&larr; Back to blog</a>
          <div class="blog-empty">
            <span class="blog-empty-badge">404 / Article</span>
            <h1 class="blog-empty-title" tabindex="-1">Post not found</h1>
            <p class="blog-empty-text">
              This article doesn't exist or is still a draft.
            </p>
            <a href="/blog" class="btn-secondary">&larr; View all posts</a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const post = posts[postIndex];
  const prevPost = postIndex < posts.length - 1 ? posts[postIndex + 1] : null;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : null;

  updateRouteMeta({
    title: `${post.title} | Tarik Sorguč`,
    description: post.summary,
    path: `/blog/${encodeURIComponent(post.slug)}`,
  });

  const [{ marked, hljs }, markdown] = await Promise.all([
    ensureMarkdownEngine(),
    fetchPostMarkdown(post.slug),
  ]);

  const readingMinutes = post.readingMinutes || calculateReadingMinutes(markdown);
  const renderedHtml = /** @type {string} */ (marked.parse(markdown));

  const tagsHtml = (post.tags || [])
    .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
    .join("");

  const prevHtml = prevPost
    ? `
      <a href="/blog/${encodeURIComponent(prevPost.slug)}" class="blog-nav-card is-prev">
        <span class="blog-nav-label">&larr; Previous Post</span>
        <span class="blog-nav-title">${escapeHtml(prevPost.title)}</span>
      </a>
    `
    : "";

  const nextHtml = nextPost
    ? `
      <a href="/blog/${encodeURIComponent(nextPost.slug)}" class="blog-nav-card is-next">
        <span class="blog-nav-label">Next Post &rarr;</span>
        <span class="blog-nav-title">${escapeHtml(nextPost.title)}</span>
      </a>
    `
    : "";

  container.innerHTML = `
    <article class="blog-section container">
      <div class="blog-post-container">
        <a href="/blog" class="blog-back-link">&larr; Back to blog</a>

        <header class="blog-post-header">
          <div class="blog-post-meta">
            <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>
            <span class="blog-meta-sep" aria-hidden="true">&middot;</span>
            <span>${readingMinutes} min read</span>
          </div>
          <h1 class="blog-post-title" tabindex="-1">${escapeHtml(post.title)}</h1>
          <div class="blog-post-tags">${tagsHtml}</div>
        </header>

        <div class="blog-prose" id="blogPostProse">
          ${renderedHtml}
        </div>

        ${
          prevHtml || nextHtml
            ? `<nav class="blog-post-nav" aria-label="Adjacent posts">${prevHtml}${nextHtml}</nav>`
            : ""
        }
      </div>
    </article>
  `;

  const proseEl = document.getElementById("blogPostProse");
  if (proseEl) {
    enhanceRenderedPost(proseEl, hljs);
  }
}

/**
 * Renders the blog view (`/blog` or `/blog/:slug`).
 * @param {string | null} slug
 */
export async function renderBlogRoute(slug) {
  const blogView = document.getElementById("blog-view");
  if (!blogView) return;

  await ensureBlogStyles();

  if (slug) {
    await renderBlogPost(blogView, slug);
  } else {
    await renderBlogList(blogView);
  }
}

/**
 * Registers the blog route handler with the SPA router.
 */
export function initBlog() {
  registerBlogRouteHandler(renderBlogRoute);
}
