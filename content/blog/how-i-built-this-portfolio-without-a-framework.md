## 1. Why No Framework or Build Step

- Plain HTML, CSS3 custom properties, and ES modules (`<script type="module">`)
- Zero bundler overhead: edit in VSCode, push to GitHub, deploy directly on Netlify
- Keeping the home page JavaScript tiny while still supporting SPA navigation

## 2. Design Tokens and Theme Architecture

- Dark-first design system with CSS custom properties (`tokens.css`)
- Pre-paint inline script in `<head>` to avoid theme flash
- Track-based accent color switching (`--track-accent`) between Data and Software

## 3. A 40-Line History API Router

- Intercepting internal link clicks and handling `popstate`
- Smooth anchor scrolling across views and restoring scroll position on back/forward
- Netlify `/* -> /index.html` 200 rewrite rule

## 4. Lazy-Loaded Markdown Blog

- Storing posts as `.md` files with a `posts.json` manifest
- Dynamic `import()` of `marked` and `highlight.js` only when a `/blog` route opens
- Generating heading anchors and syntax-highlighted code blocks on the fly

```javascript
// Example: lazy-loading the Markdown parser only on blog routes
const { marked } = await import("/vendor/marked.esm.js");
```

## 5. Motion, Accessibility, and Performance Takeaways

- Hero node-network `<canvas>` paused off-screen via `IntersectionObserver`
- Native `<dialog>` for case study details
- Respecting `prefers-reduced-motion` across every animation
