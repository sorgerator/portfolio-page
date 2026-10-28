# Tarik Sorguč — Personal Portfolio (`tariksorguc.me`)

Personal portfolio and technical blog of **Tarik Sorguč** (Data Science & AI Engineering student at International Burch University, Sarajevo).

Built by hand with **plain HTML5, CSS3 custom properties, and vanilla ES modules**—no framework, no bundler, and zero build step.

---

## 1. Project Structure

```text
/
├─ index.html                # App shell + static Home sections + hidden Blog & 404 mount points
├─ netlify.toml              # SPA rewrite rule (/* -> /index.html 200) + immutable asset caching
├─ robots.txt                # Search crawler configuration
├─ sitemap.xml               # Canonical URLs for search engines
├─ assets/
│  ├─ logo_ss.png            # Brand logo & favicon
│  ├─ Tarik_Sorguc_CV.pdf    # Downloadable CV
│  ├─ fonts/                 # Self-hosted Space Grotesk & Inter woff2 (latin + latin-ext for "č")
│  └─ img/
│     ├─ og-image.png        # 1200x630 Open Graph preview image
│     └─ me.webp             # Optional hero portrait (unhide `.hero-photo-slot` in index.html when added)
├─ content/
│  └─ blog/
│     ├─ posts.json          # Blog post manifest (slug, title, date, summary, tags, draft)
│     └─ <slug>.md           # Markdown source for each blog post
├─ vendor/                   # Lazy-loaded marked + highlight.js (loaded only on /blog/:slug routes)
└─ src/
   ├─ main.js                # Entry point: initializes theme, nav, case studies, contact, blog, router, reveal, hero canvas
   ├─ router.js              # History API SPA router (/, /blog, /blog/:slug, 404, anchor scrolling)
   ├─ theme.js               # Dark-first theme controller with localStorage persistence
   ├─ nav.js                 # Floating glass nav pill, scroll-spy, mobile drawer, 2px scroll progress bar
   ├─ hero-canvas.js         # Interactive node-network canvas & rotating role phrase
   ├─ case-studies.js        # Segmented track control, URL ?track= sync, pointer spotlight, native <dialog>
   ├─ contact.js             # Netlify Forms AJAX handler + lazy Google Calendar booking accordion
   ├─ blog.js                # Blog list, tag filtering, reading time, lazy Markdown + syntax highlighting
   ├─ reveal.js              # IntersectionObserver scroll reveal (400ms fade & rise)
   └─ styles/
      ├─ tokens.css          # Design tokens for dark & light themes + track accent variables
      ├─ base.css            # @font-face rules, reset, typography, focus styles, reduced-motion overrides
      ├─ components.css      # Buttons, pills, tags, social links, FlyRank badge, mobile nav drawer
      ├─ sections.css        # Hero, ticker, About, Case Studies, <dialog>, Contact, Footer
      └─ blog.css            # Lazy-loaded stylesheet for /blog and /blog/:slug
```

---

## 2. How to Run Locally

Because the site uses ES modules (`<script type="module">`) and root-relative asset paths (`/src/...`, `/assets/...`), open the project with any static HTTP server from the repository root:

- **VSCode Live Server (recommended):**
  Right-click `index.html` in VSCode and select **"Open with Live Server"**.
- **Python built-in HTTP server:**
  ```bash
  python -m http.server 5500
  ```
  Then open `http://localhost:5500` in your browser.
- **Netlify CLI (supports SPA rewrites on direct `/blog` refresh locally):**
  ```bash
  npx netlify-cli dev
  ```

---

## 3. How to Add a Project (Case Study)

All case study cards live directly in `index.html` inside `<div class="cases-grid" id="casesGrid">`.

1. Open `index.html` and locate `<section id="work" class="cases" data-track="data">`.
2. Copy an existing `<article class="card" data-track="data">` (for **Data and Automation**) or `<article class="card" data-track="software" hidden>` (for **Software**).
3. Update:
   - `data-track="data"` or `data-track="software"` (add `.featured` to `<article class="card featured ...">` if you want it to span 2 columns on desktop).
   - `.card-period`, `.card-title`, and `.card-summary`.
   - `.card-metrics` (up to 3 `<span class="metric-chip">...</span>` with real metrics; remove the `.card-metrics` block if there are no numerical metrics).
   - `.card-tags` (`<span class="tech-tag">...</span>`).
   - `.card-links` (`View Repository ->`, `View Paper ->`, `Live site ->`).
   - `.card-details` (hidden `<div>` with `Problem`, `What I Built`, and `Result` blocks displayed inside the native `<dialog>` when clicking **Details**).
4. The project counts on the `Software` and `Data and Automation` tab buttons update automatically on load.

---

## 4. How to Add a Blog Post

No CMS or build step is needed:

1. Create a new Markdown file in `content/blog/<your-slug>.md`:
   ```markdown
   ## Introduction

   Write standard GitHub-Flavored Markdown here. Code blocks in `python`, `sql`, `javascript`, `typescript`, and `bash` are syntax-highlighted automatically.
   ```
2. Add an entry to `content/blog/posts.json`:
   ```json
   {
     "slug": "your-slug",
     "title": "Your Post Title",
     "date": "2026-11-01",
     "summary": "A concise 1-2 sentence summary shown on the /blog card and in meta tags.",
     "tags": ["Python", "Data Engineering"],
     "draft": false
   }
   ```
   - Set `"draft": true` while writing—drafts are never listed on `/blog` or accessible at `/blog/:slug`.
   - Set `"draft": false` when ready to publish, and add `<url><loc>https://tariksorguc.me/blog/your-slug</loc>...</url>` to `sitemap.xml`.
