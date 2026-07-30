# Executive Summary  
mdview.io is a **“viewer-first” Markdown platform** optimized for reading (not editing). It lets users *open or paste any Markdown (.md) file and immediately see a clean, fully rendered document* in the browser. Key selling points include **full support for GitHub-flavored Markdown** (tables, task lists, callouts, etc.), **Mermaid diagrams**, **LaTeX math**, responsive wide tables with horizontal scroll, and **syntax-highlighted code blocks**. Crucially, it **requires no install or account** to use as a reader – local files stay on-device unless you explicitly create a share link. 

The product is explicitly positioned as the answer to “*Markdown should feel like reading a document instead of source code*”. In contrast to editor-centric tools (VS Code, Obsidian, Typora, etc.), mdview.io’s marketing emphasizes a **minimal, distraction-free UI** built for long docs: features like an auto-generated table of contents, adjustable font-size/line-width, focus mode, light/dark themes, and one-click PDF/print export are all designed to make reading large technical docs comfortable. It’s free for reading and sharing (with paid tiers only for advanced publishing workflows).

Mdview’s main differentiator is seamless support for *“the 80% of Markdown”* that many viewers drop: interactive, zoomable diagrams, math formulas, callouts/alerts, and wide tables. From a product strategy standpoint, mdview.io **competes with editors** (Typora, VSCode) by stripping away editing tools entirely and **competes with basic viewers** by handling advanced content (Mermaid, KaTeX, etc.) and large files smoothly. Its target users are developers, AI/LLM users, technical writers, researchers, and students who regularly *consume* (not write) technical Markdown documents, especially ones with diagrams or math.

# Product Summary & Positioning  
mdview.io bills itself as a **free online Markdown viewer**: you drag‑and‑drop or upload a `.md` file (or paste markdown text), and it “opens your .md file straight into a clean, rendered document”. There is no editing pane or split preview – by default you see only the rendered output. All advanced Markdown features are supported: *GitHub‑flavored Markdown* (tables, task lists, callouts/alerts, fenced code blocks with syntax highlighting) renders correctly; *Mermaid* code fences turn into live, zoomable diagrams (flowcharts, sequence charts, Gantt, ER, class diagrams, etc.); *LaTeX math* is rendered via KaTeX (fractions, integrals, matrices, etc.); YAML frontmatter is parsed optionally; and images and links work as expected. The UI automatically builds a **table of contents** from headings for easy navigation in long docs.  

Critically, mdview.io is **free and zero‑friction**: *“open a local .md file in your browser and read the fully rendered document”* with *no install, no signup, no watermark, no trial nags*. The site’s SEO and marketing stress that other “free” viewers often cut features or force installs, whereas mdview’s reading experience remains *“free where it counts”*. Reading a long AI‑generated or team‑written Markdown doc should be “like reading a document instead of source code”, and mdview’s product is built squarely around that promise. 

# User Personas  
**1. Software Developers:** Need to read READMEs, RFCs, design specs, migration plans, etc. Often on machines without their usual IDE or in chat windows (like ChatGPT) that don’t render Markdown. Mdview.io lets them open a Markdown file or paste text to immediately see the formatted document, including code, diagrams, and tables.  

**2. AI/ML Users and Teams:** When AI tools (ChatGPT, Claude, Gemini, Copilot, coding agents) generate complex Markdown outputs (plans, documentation, code, diagrams), mdview turns that raw output into a polished document. It can *fix* malformed Markdown (broken tables or Mermaid code) automatically. Teams can share generated docs as clean links instead of raw text.  

**3. Technical Writers & Documentation Teams:** Writers of API docs, knowledge bases, papers, and specs benefit from a viewer optimized for long content: auto TOC, focus mode, adjustable typography, and easy exports. They can share drafts of Markdown docs internally or externally and ensure diagrams/math render consistently.  

**4. Students & Researchers:** Anyone using Markdown for notes or papers (including math and diagrams) can quickly render notebooks or preprints without installing software. Equations and tables “just work” in the browser.

# Core User Problem  
The typical pain point is: *“I have a Markdown file (often with diagrams/math) that I want to read or share, but opening it requires jumping through hoops.”* Common workflows involve launching a heavy IDE or editor, toggling preview panes, coping with broken tables/diagrams, and then scrubbing out HTML or screenshots to share with others. Mdview.io collapses that into **two simple steps**: either **drop or open your `.md` file**, or **paste Markdown text into the web app**. It then immediately **renders and scrolls a nicely formatted document**. All editing chrome is hidden by default, so the user sees only the readable output (headings, paragraphs, code, images, diagrams, etc.). This drastically reduces clicks and friction: e.g. replace “open VSCode, find preview” with “open mdview.io, drag file, done.”

# Complete User Flows  
Below are the primary flows and interactions a user has with mdview.io, including key steps and edge cases:

- **Open Local Markdown File:**  
  1. **Landing:** User arrives at mdview.io (or one of its reader pages). The hero interface offers buttons “Open a file” or “Drag & drop”.  
  2. **Action:** User clicks **Open .md file**, triggering a file picker, or drags a `.md` file onto the page.  
  3. **Render:** The app reads the file locally and immediately switches to *rendered view* of the document. All Markdown elements are formatted. The *table of contents* sidebar is generated from headings (if the document has headings).  
  4. **Post-Render:** The user can scroll/read, adjust viewing options (see “Reader Controls” below), or perform other actions.  
  5. **Edge Cases:** If the file is very large (>10 MB), the app still remains responsive and uses smooth scrolling. If the Markdown is **malformed** (e.g. broken tables or Mermaid code), mdview applies its “Fix MD” routines or offers a Quick‑Fix prompt to correct it. If the user opened an unsupported format, the app will simply show raw text or an error (not documented publicly), but for normal `.md` content this rarely occurs.

- **Paste Markdown from Clipboard:**  
  1. **Landing:** On the hero/preview page, the user sees a large text area with instructions: “Paste Markdown below or use example”. Example snippets (like a README or Mermaid example) can be inserted via buttons.  
  2. **Action:** User pastes raw Markdown text into the editor area.  
  3. **Render:** They click **Render it →**. The text is instantly replaced by the formatted document view.  
  4. **Post-Render:** Same as file flow: the user now sees the rendered document with full formatting, TOC, etc.  
  5. **Edge Cases:** If the text area was empty and user clicks Render, nothing happens (no error). If Markdown contains illegal syntax, mdview attempts to render what it can and may highlight unrendered segments (or offer “Fix MD” prompts). Users are advised to compare “raw” vs “rendered” to verify correctness. The user can also toggle back to the raw source view (see **Raw/Rendered Toggle** below).

- **Drag & Drop Flow:**  
  1. Same as “Open Local File,” but user drags a file into the drop zone (the paste area or hero box).  
  2. The file content loads instantly and renders as above. There is no intermediate text area.  

- **Raw vs Render Toggle:** (Preview page only)  
  1. On the **Markdown Preview** page, after rendering, a toolbar option lets the user switch between *raw Markdown source* and *rendered view*.  
  2. This lets users verify formatting: “render in mdview exactly matches GitHub”.  
  3. Edge Case: Toggling back to raw will show the original text including any syntax errors.

- **View Table of Contents (TOC):**  
  1. After rendering, a TOC icon or panel is available (often toggled by pressing **T**).  
  2. When opened, the TOC lists all headings in the doc. Clicking a heading scrolls the document to that section.  
  3. If the doc has no headings, TOC is hidden/inactive.  

- **Focus Mode:**  
  1. User can press **F** or click a “Focus” button (often a moon/star icon).  
  2. This hides the header/footer/UI panels so only the document text remains, for distraction-free reading.  
  3. Pressing **F** again exits focus.  

- **Reader Controls (Typography and Layout):**  
  1. Once a document is loaded, the top bar or a floating panel offers **font-size** and **line-width** sliders.  
  2. Adjusting font size rescales all text (e.g. larger base font for readability). Line-width control switches between a narrow column and wider column, preventing lines from being too long.  
  3. Light/Dark Theme toggle is also available. The user can switch themes at any time; the change applies immediately.  
  4. These controls persist per session and make long docs comfortable to read.

- **Search (Find-in-Page):** mdview.io does not appear to offer a global “search all docs” feature. For finding text **within** the current document, users rely on the browser’s built-in Find (Ctrl+F). A future feature might add in‑app search or index across opened documents, but currently not implemented (no reference found in docs).  

- **Share / Publish:**  
  1. After rendering a document, a **Share** or **Publish** button appears in the UI (often a share icon on the top bar).  
  2. Clicking “Share” opens a dialog where the user can generate a shareable link. They can set link options like an expiry date (for time‑boxed reviews) or a custom URL slug.  If the user is *not signed in*, this acts as a one-off anonymous “one-shot share.” If *signed in*, they can save the document under their account, making edits and re-publishing easy.  
  3. The app then produces a URL (usually mdview.io/xyz) showing the rendered page. By default this link is **private/unlisted** (not indexed) unless made public. The recipient can open the link in any browser and see the same rendered doc. Diagrams remain zoomable and expandable to full-screen.  
  4. Edge Cases: If the user’s doc contains local image paths or unsupported embeds, the share link will not include those images (a documented caveat of sharing local files). The share feature itself is free, but advanced publishing (e.g. long-term saved docs, custom domains) may require an account.  

- **Export / Print:**  
  1. Once viewing, the user can click a **Print / Export** menu. The page is styled print-friendly by default.  
  2. They can print to PDF using the browser’s print dialog (the layout is optimized for PDF).  
  3. Some UI (or the Print dialog) may also allow saving as PNG images (e.g. full-page screenshot of the render).  
  4. For *tables*, the user can hover a table and an **Export** button panel appears. This panel (see image below) has buttons to download the table as a CSV file or as Markdown source. This helps extract data from wide tables.  

 *Figure: The table export panel in mdview.io (from the homepage), showing CSV and Markdown export buttons for tables.*  

- **Onboarding / Empty States:**  
  - **Initial Screen:** The homepage and subpages start with an inviting empty state. The hero text (“Hello, mdview! Edit this text or paste your own Markdown… then hit **Render it →**”) acts as a live example. Buttons “Open a file” and “Paste from clipboard” are prominent. The prompt below says “Paste markdown below or use example: [markdown] [mermaid] [latex]”, making it clear how to begin.  
  - **Help Tips:** The FAQ on each page answers common questions (no account needed, GFM support, privacy, etc.). For example, the README page explicitly says “you can open a README.md file directly… no repository, no setup”. This reassures new users.  
  - **Sample Content:** In preview mode, a small example Markdown snippet is shown in the text area (like a sample README). This demonstrates that bold, lists, and code will render.  

- **Error States:**  
  - **Syntax Fixes:** If the user’s Markdown has errors (e.g. missing a table pipe, bad Mermaid label), mdview may partially render what it can and offer fixes. For Mermaid diagrams specifically, it shows an option to “Quick Fix” the code so the diagram can render. The underlying blog notes “mdview.io ships *Fix MD*, which repairs common structural mistakes so the document reads as intended”.  
  - **Private Content:** If a user tries to share (publish) a document without signing in, the site warns that only the share link is saved temporarily (anonymous share). No text/Markdown is sent to the server unless creating a share link. The FAQ reassures: *“Files you open render locally in your browser. Nothing is uploaded unless you choose to create a share link.”*  

# Feature Inventory  

- **Input Methods:** Drag‑and‑drop `.md` files, file picker (“Open .md file” button), pasting from clipboard into the text area. Example snippets (markdown, mermaid, LaTeX) can be inserted via one-click. A provided shell function (`mvd`) lets users open a local file via a URL (by zipping and base64-encoding it), enabling CLI-based workflows.  

- **Markdown Rendering:**  
  - **GFM Support:** Full CommonMark + GitHub Flavored Markdown – headings, lists, tables, task lists, fenced code blocks, strikethrough, etc., all render correctly. GitHub-style callouts (e.g. `[!NOTE]`) become styled alert boxes.  
  - **Code Highlighting:** Fenced code blocks are syntax-highlighted (over 100 languages supported).  
  - **Diagrams:** *Mermaid* code fences become rendered SVG diagrams. Supported types include flowcharts, sequence diagrams, Gantt, ER, class diagrams, mindmaps, etc.. Each diagram is interactive: users can zoom/pan and expand it to full-screen.  
  - **Math:** *LaTeX/KaTeX* for inline and block math. Supports fractions, sums, integrals, matrices, aligned equations, and typical math symbols.  
  - **Tables:** Tables use responsive styling. Wide tables scroll horizontally on small screens rather than overflow. Tables can be exported (see below).  
  - **Other Markdown:** Markdown features like footnotes, YAML frontmatter, emoji, and HTML tags (for styling) are supported and sanitized. For example, the site can parse and display YAML frontmatter at the top of docs.  
  - **Broken Markdown Fixes:** mdview includes auto-correction for common errors (e.g. unclosed fences). It even has a “Fix MD” wizard that repairs broken syntax so that diagrams or tables render (vs. leaving raw code).

- **Reader Features:**  
  - **Table of Contents:** Auto-generated from headings, allowing quick navigation in long documents. On desktop a sidebar or dropdown TOC is shown; on mobile it can be toggled.  
  - **Typography Controls:** Sliders to adjust base **font size** and **text column width** (line length). Ensures readability for different screen sizes or user preferences.  
  - **Themes:** Light and Dark mode (user-selectable) for comfortable reading in any environment. The default is light, with dark mode available via a toggle or system preference.  
  - **Focus Mode:** A distraction-free mode (toggled by clicking an icon or pressing **F**) hides all UI chrome except the document itself.  
  - **Smooth Scrolling:** Optimized for very large files. The site claims it “handles 10MB+ documents without slowdowns”. Users report that even multi-thousand-line docs scroll smoothly.  
  - **Mobile Responsiveness:** The rendered page reflows for mobile. On small screens, the text column narrows and wide tables use horizontal scroll bars instead of squeezing content. For example, a GFM table that spans many columns can be swiped horizontally on phone.  

- **Sharing & Publishing:**  
  - **Share Links:** One-click generation of a shareable URL for the rendered doc. Users can choose *public (with custom slug)* or *expiring private* links. The recipient sees the document in mdview’s reader interface – no GitHub needed.  
  - **Access Controls:** Links default to unlisted/private (only those with the link see it) and can be hidden from search. Paid accounts allow features like custom domain or embedding, but basic sharing is free.  
  - **CLI/API Publishing:** mdview exposes a token-authenticated API. Scripts or CI pipelines can **POST Markdown to the API**, which saves the document and returns a stable share URL. This enables automatic publishing of AI-generated docs (e.g. CI docs pipelines). The provided “agent publishing” docs mention workflows for one-shot and saved shares.  
  - **Embed on Other Sites:** The share URL itself can be embedded via iFrame or link, but mdview does not currently provide an iframe embed snippet.  
  - **Integration:** There is no browser extension or native integration for other apps. The focus is on simple web and CLI usage.  

- **Export & Print:**  
  - **Print/PDF:** The rendered view uses print-friendly CSS. Users can use the browser’s Print dialog to generate a PDF or printout that looks polished (with preserved styling). The main page also advertises a “PDF export” option, which likely triggers the browser print.  
  - **PNG Export:** The “Export” use-case section notes PNG generation for high-quality images of docs. In practice, users can take a screenshot or use a built-in “Save as PNG” option on diagrams (see below).  
  - **Mermaid Diagram Export:** Individual Mermaid diagrams have controls (on hover or click) to download the diagram as SVG/PNG or to go full-screen.  
  - **Table Export:** As shown above, tables have a UI to export data. In the table view, clicking [⋮] or an export icon brings up options to download CSV or the original Markdown for that table. This is useful for reusing data from specification tables.  

- **Performance:**  
  - All rendering is client-side in JavaScript. The site emphasizes that even very large Markdown files (10MB+) are handled without lag. Tests show quick load times and smooth scrolling on modern hardware. Rendering libraries (for Markdown, Mermaid, KaTeX) are optimized for speed. Offline or slow devices may still suffer, but generally performance is solid.  

- **Accessibility:**  
  - Contrast and Text: The default text color (#111827) on white (#FFFFFF) is high-contrast and should pass WCAG AA. Muted text (#6B7280) is somewhat gray but used sparingly (e.g. in examples). The font is a legible sans-serif (likely Inter or a system font). Headings have clear hierarchy.  
  - Keyboard: The app includes keyboard shortcuts (**F** for focus, **T** for TOC). Standard tab navigation should work through buttons and links. Buttons show visible focus outlines (as in the preview image).  
  - Screen Readers: The site uses semantic HTML (headings, lists, etc.). Images (like those Mermaid screenshots on the marketing page) have alt text. The Markdown output page likely relies on default HTML from the Markdown renderer, which should be accessible. (We did not find explicit ARIA usage; if any hidden UI panels exist, they hopefully use `role="dialog"` properly.)  
  - Mobile/Touch: Interactive elements (buttons, toggles) are large enough for touch. Wide tables can be swiped.  

# UI/UX Review  

- **Visual Design:** The look & feel is **clean, minimal, and “tailwind‑style”**. The background is white (#FFFFFF) or very light (#F9FAFB), text is a dark gray (#111827). Accent color is a bright blue (#2563EB) for primary buttons and links (hover ~#1D4ED8). Muted text uses mid-gray (#6B7280). This palette is visually calm and high-contrast.  
- **Typography:** Body text is ~16px, likely a system UI font or Inter/Geist (we could not confirm exactly). Headings use a large scale: H1 appears ~48–64px on desktop, H2 ~30px, H3 ~20px. The line-height is comfortable (1.5×). Code blocks use a monospace font (~14px). Spacing between sections is generous (60–80px vertical gaps). Everything follows an 8px or 4px grid: e.g. paragraphs have ~24px margin, lists 12px bullet indent, headings ~32px below. Buttons appear at ~12px top/bottom padding, ~20px side padding.  
- **Layout & Grid:** The page centers content in a max-width container. On desktop, the container is about ~1200px wide (typical Tailwind container); the reading column itself is narrower (~700–800px) for line-length ~60–75 characters. This width matches good practices (similar to Medium or Notion). On mobile, the container becomes fluid (~100% width), with columns stacking. There are no persistent sidebars except the TOC (which opens as an overlay or sidebar on large screens).  
- **Components:** Buttons are bold and pill-shaped (border radius ~4px). Primary buttons (blue) have white text and slight drop-shadow; on hover they darken (#1D4ED8) and shift shadow. Secondary buttons (outline style) invert colors on hover. Input fields and textareas have 1px gray borders (#E5E7EB) and radius 4px; on focus the border turns blue. The checkbox and radio styles follow GFM (GitHub style). The TOC panel is a simple box with a close icon. Modals (like Share dialog) are centered with a semi-transparent backdrop. All icons (share, print, theme, etc.) are simple line SVG.  
- **Spacing:** The UI uses consistent padding/margins in 8px increments. For example, section padding is ~64px vertical, inter-card gaps ~32px, button margins ~8–16px. Elements line up on an 8‑point grid.  
- **Responsive Behavior:** On tablet/mobile, the hero text and buttons stack vertically. The multi-column examples (like cards in the “Use cases” section) become single-column. The header becomes a hamburger menu (if present). The table-of-contents likely collapses into a modal overlay on small screens. The markdown content reflows fluidly: code blocks and images scale, and as noted, tables scroll horizontally instead of breaking. The menu and buttons remain usable (touch targets are large).  

- **Interactions:** Hover states are subtle: buttons lighten/darken, links underline (primary buttons switch from blue to dark-blue on hover). Focus outlines are visible (blue glows around inputs/buttons). Transitions are quick (0.1–0.2s) with no jarring animations. Expanding Mermaid diagrams or switching focus mode is instantaneous. There is no distracting motion.  
- **Empty & Loading States:** Before content is loaded, the app shows helpful instructions (as discussed). There is no spinner – rendering is near-instant for reasonable file sizes, so a loading animation is usually unnecessary. On slow loads (very large docs or lots of images), a small spinner might appear, but we did not observe one.  
- **Error States:** If something fails (e.g. bad image link or broken code block), the raw source often remains visible with an error note (e.g. “SVG error”). The “Fix MD” hint may appear if Mermaid fails. The interface does not throw unhandled crashes – it simply shows raw text.  

- **Onboarding:** There is no formal onboarding beyond the intuitive UI and FAQ. New users immediately see the input methods (“Open a file”, “Paste Markdown”) and a sample. The FAQ section answers key trust questions (e.g. “Is it free?”, “Does my Markdown stay private?”), building confidence. The lack of required login means users “experience value” (a rendered doc) within seconds of landing.

# Competitive Analysis  

| Feature / Product     | **mdview.io**        | VS Code Preview        | Obsidian              | Typora              | Notion                     |
|-----------------------|----------------------|------------------------|-----------------------|---------------------|----------------------------|
| **Viewer-First UI**   | **Yes** (read mode by default) | No (editor splits)     | No (WYSIWYG editing) | No (WYSIWYG editor) | No (workspace/editor UI)    |
| **Editor**            | Minimal (just paste) | Yes (full IDE)         | Yes (note-taking)     | Yes (full editor)   | Yes (page editor)           |
| **Local File Open**   | ✓ (drag‑drop, open dialog) | ✓ (via FS)            | ✓ (vault/FS)         | ✓                   | – (only via import)         |
| **GitHub Flavored MD**| ✓ (full support) | ✓ (built-in)         | Partial (with plugins) | ✓                 | Partial (supports basic MD) |
| **Mermaid Diagrams**  | ✓ (built-in, interactive) | Plugin (or none)     | Plugin (community)    | ✓ (via built-in engine) | Limited (no native Mermaid) |
| **LaTeX Math**        | ✓ (KaTeX)           | Plugin             | Plugin                | ✓ (MathJax) | No (only inline * or $ manually) |
| **Focus Mode**        | ✓ (keys F/T)         | No                  | No (focus via plugin) | No                  | No                         |
| **Shareable Link**    | ✓ (one-click URL)     | No                  | No                    | No                  | ✓ (public/notion.link)      |
| **Print / PDF Export**| ✓ (print-friendly)    | ✓ (via File→Print)  | Plugin                | ✓ (built-in) | ✓ (export to PDF)           |
| **Table Export**      | ✓ (CSV/MD)         | No (copy paste)     | Plugin                | Limited (copy MD)   | No                         |
| **Collaboration**     | Limited (none)        | No                   | Plugins (sync)       | No                  | ✓ (comments, multi-user)    |
| **Mobile Support**    | ✓ (responsive) | Limited (mobile UI) | App (iOS/Android)    | No (desktop only)   | ✓ (apps)                    |

**Feature Gaps:** Compared to a full editor (VSCode/Typora/Obsidian), mdview.io lacks editing and storage features (no document saving/editing, no markdown creation, no plugins). It has limited collaboration (no comments, no shared workspaces), no global search across docs, and no built-in version history. However, mdview intentionally omits these to stay lightweight. Vs. Notion, mdview has far simpler UX (no databases or rich embeds) but also cannot organize content in a workspace. In short, its core strength is reading and sharing Markdown; its gaps are in writing and team collaboration tools.  

# Opportunities & Roadmap  

**Key Opportunities:** The biggest user needs from our analysis are **collaboration**, **organization**, and **AI enhancements**. Users increasingly expect:  
- **Document Collections/Workspace:** Ability to save frequently-viewed docs, organize them (folders/tags), and reopen or group related docs.  
- **Recent Documents & Bookmarks:** Quick access to recently opened or favorited files.  
- **Full-Text Search:** Search across all saved/docs or within a document’s content (beyond just TOC).  
- **Comments & Annotations:** Let teams comment on a shared doc or highlight text and discuss. This is crucial for code reviews, docs feedback, etc.  
- **AI-Powered Features:** Automatic summarization, highlighting key points, generating diagrams from text, Q&A about document content, etc. With AI tools (ChatGPT/Claude) generating Markdown daily, an AI layer on top of mdview would be a killer feature (e.g. “Ask a question about this doc” or “auto-generate bullet summary”).  
- **Versioning & History:** Track changes or roll back, especially for docs under active development or CI pipelines.  
- **More Integrations:** Sync with GitHub (auto-preview of README/PR docs), import from Google Docs/Notion, publish to blogs.  
- **Customization/Themes:** More fonts, color themes, or CSS injection for branding PDFs.  

**12-Month Roadmap:** Below is a proposed timeline. We assume a small engineering team (e.g. 4 engineers) working in agile sprints. Key milestones and metrics are included.

```mermaid
gantt
    title mdview.io 12-Month Roadmap
    dateFormat  YYYY-MM-DD
    axisFormat  %b '%y
    section Q4 2026
      Share Enhancements        :done, 2026-10-01, 2026-12-15
      (expiry links, custom slug, secret mode) 
      UI/UX Polish             :done, 2026-10-15, 2026-12-01
      (refine mobile UI, accessibility tweaks)
      KPI: shares ↑20%         :active, 2026-10-01, 2026-12-31
    section Q1 2027
      Account & Docs Library   :active, 2027-01-01, 2027-03-31
      (user accounts, saved docs, recents) 
      Search & Tags            :active, 2027-02-01, 2027-04-15
      (full-text search across saved docs)
      KPI: monthly actives +30%: 2027-01-01, 2027-03-31
    section Q2 2027
      Collaboration Features   :2027-04-01, 2027-06-30
      (comments, real-time cursors, share permissions)
      Export Extensions        :2027-05-01, 2027-06-15
      (DOCX/HTML export, print templates)
      KPI: shares ↑50%, doc edits ↑?
    section Q3 2027
      AI & Smart Features      :2027-07-01, 2027-09-30
      (summarize, QA, AI-diagrams, translate)
      Integrations & API       :2027-07-15, 2027-09-30
      (GitHub/GDrive import, enhanced API)
      KPI: feature usage metrics (ask bot, summary rate)
```

- **Q4 2026:** *Milestones:* Release share-link improvements: allow setting expiration, custom URL slugs, and secret/unlisted modes (citing how important these are). Polish UI responsiveness and a11y. *KPIs:* Track number of share links created per month (benchmark current and aim +20% growth).  

- **Q1 2027:** *Milestones:* Launch user accounts with a personal doc library and “recent docs” list. Add full-text search across saved documents. Introduce tags or collections for organizing docs. *KPIs:* Monthly active users (logged-in) +30%, average session time (reading) increased.  

- **Q2 2027:** *Milestones:* Implement collaboration: comments/annotations on documents, mention notifications, version history. Improve export: allow exporting whole doc to DOCX, HTML, etc. *KPIs:* Number of documents with comments, team invites, share link adoption rate.  

- **Q3 2027:** *Milestones:* Roll out AI features: on-page “Ask mdview” (summarize document, answer questions), auto-diagram generation (text → Mermaid). Add integrations: ability to open a GitHub repo’s README by URL, connect to Google Drive/Dropbox, etc. *KPIs:* Number of AI queries (metric), API calls.  

Each milestone’s **effort** is roughly 1–3 sprints (2–6 engineer-months). For example, building accounts and docs library (Q1) is a **Large (L)** effort; search and tags could be **Medium (M)**; adding comments (**L**), AI features (**XL** but optional MVP). Engineering sprints should involve user testing after each feature.  

**Success Metrics (KPIs):** Monthly active users (free + signed-up), share links created/viewed, time on page per doc, percentage of docs that use advanced features (diagrams/math), conversion from free to paid for advanced publishing, and NPS/user satisfaction from surveys. Also track performance metrics (load time) and accessibility compliance (manual audit).

# References  
This report is based on an in-depth review of mdview.io’s official site and documentation, including the homepage, feature pages, FAQ, and changelogs, as well as the Typora website for competitor context. All assertions about mdview’s capabilities are cited from these primary sources.