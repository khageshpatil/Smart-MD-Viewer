# T08 — Full SEO Metadata + OG Image

**Priority:** P0  
**Estimated time:** 2 hours  
**Depends on:** Nothing  
**Modifies:** `index.html` only + new file at `public/og.png`

---

## Problem Being Solved

SmartMD is nearly invisible to search engines and looks bad when shared on social media.

Current index.html has:
- No canonical URL
- No robots meta tag
- No OG image
- No JSON-LD structured data
- Generic OG title/description

mdview.io has all of these, a 1408x768 OG image, Google verification, and JSON-LD WebSite schema.

---

## Step 1 — Create the OG Image

You need to create a file at `public/og.png`.

The OG image should be 1200 x 630 pixels. It represents SmartMD on social media sharing.

Design brief for the OG image:
- Dark background (matching SmartMD's dark theme: approximately #1a2234)
- Left side: SmartMD logo/name in large white bold text
- Subtitle: "The private, local-first Markdown viewer"
- Right side: A mock screenshot of Markdown being rendered (code on left, preview on right)
- Small text at bottom: "smartmd.app" (or whatever the domain will be)
- Color accent: Blue (#3b82f6) for highlights

If you cannot generate an image programmatically, create a placeholder:
Place any 1200x630 PNG at `public/og.png` with some content.

The og:image meta tag in index.html will reference this file.

---

## Step 2 — Replace the entire index.html content

Replace the full content of `index.html` with the following:

IMPORTANT: Replace `YOUR_DOMAIN_HERE` with the actual deployment URL.
For GitHub Pages: `https://[username].github.io/Smart-MD-Viewer`
If unknown, use: `https://smartmd.app` as a placeholder.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary meta -->
    <title>Smart MD Viewer — Private Local-First Markdown Viewer</title>
    <meta
      name="description"
      content="Open, render, and share Markdown files privately. Mermaid diagrams, syntax highlighting, encrypted sharing — your files never leave your browser."
    />
    <link rel="canonical" href="YOUR_DOMAIN_HERE/" />
    <meta name="robots" content="index, follow" />
    <meta name="theme-color" content="#3b82f6" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="YOUR_DOMAIN_HERE/" />
    <meta property="og:title" content="Smart MD Viewer — Private Markdown Viewer" />
    <meta
      property="og:description"
      content="Open, render, and share Markdown privately. Mermaid diagrams, LaTeX math, encrypted sharing. Your files never leave your browser."
    />
    <meta property="og:image" content="YOUR_DOMAIN_HERE/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="SmartMD Viewer — Private local-first Markdown viewer" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Smart MD Viewer — Private Markdown Viewer" />
    <meta
      name="twitter:description"
      content="Open, render, and share Markdown privately. Your files never leave your browser."
    />
    <meta name="twitter:image" content="YOUR_DOMAIN_HERE/og.png" />

    <!-- Structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Smart MD Viewer",
      "url": "YOUR_DOMAIN_HERE/",
      "description": "A private, local-first Markdown viewer with encrypted sharing. Open and render .md files without uploading to any server.",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    </script>

    <!-- Favicon (use a simple SVG if no custom icon exists) -->
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Step 3 — Create a simple favicon if one doesn't exist

Check if `public/favicon.svg` or `public/favicon.ico` exists.

If no favicon exists, create `public/favicon.svg` with this content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#3b82f6"/>
  <text x="6" y="23" font-family="monospace" font-size="18" font-weight="bold" fill="white">M</text>
</svg>
```

This gives SmartMD a distinctive blue "M" favicon instead of the browser default.

---

## Step 4 — Run Build

```
npm run build
```

The build should succeed. The OG image will be in `dist/og.png` and referenced correctly.

---

## Step 5 — Verify OG tags

After deploying, use https://opengraph.xyz or paste the URL into Slack/Discord to verify
that the preview card shows the correct image, title, and description.

---

## Update MASTER.md

1. Change T08 status from [ ] to [x]
2. Update "Last completed task" to "T08"
3. Note: "SEO meta complete. OG image placeholder at public/og.png."

---

## Acceptance Criteria

- [ ] `index.html` has canonical URL
- [ ] `index.html` has robots meta with "index, follow"
- [ ] `index.html` has og:image pointing to /og.png
- [ ] `index.html` has og:image width and height (1200 x 630)
- [ ] `index.html` has Twitter card meta tags
- [ ] `index.html` has JSON-LD WebApplication schema
- [ ] `public/og.png` exists (any 1200x630 image)
- [ ] `public/favicon.svg` exists
- [ ] npm run build passes

---

## DO NOT TOUCH

- `src/` directory (no source files change for SEO — only index.html)
- `vite.config.ts`
- `tailwind.config.ts`
- `tasks/` files
