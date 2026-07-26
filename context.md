# context.md - Heron Project Knowledge Base

Persistent record of what's built, how it's implemented, and which decisions shaped it.
Read before coding (per [CLAUDE.md](./CLAUDE.md) §8). Append after changes - never edit past Session History entries.

---

## Session History entry template

Copy this block for each new session. **Newest entries go at the TOP of Session History** (directly below the `## Session History` heading).

```
### <feature title>
**What was done:** <one–three sentence summary>
**Files touched:**
- `path` (create|update|delete) - why
**Decisions:** <decision → rationale>
**Open questions / follow-ups:** <or "none">
```

---

## Current State

**Product:** Heron - a product face for the repo's multimodal phishing-detection model. Landing page (AI-phishing story) + dashboard where anyone scans an email and gets a verdict. Plan: [plan.md](./plan.md). Design tokens: [DESIGN.md](./DESIGN.md).

**Model (pre-existing, untouched):** `DualTowerFusionModel` - text CNN (256-d) + image CNN (512-d) + metadata MLP (20→64) → concat 832-d → fusion classifier (512→256→128→2) → {legitimate|phishing}. Trained weights + vocab live as Git LFS objects in `models/` and `data/`.

**Backend:** FastAPI service in `backend/`, model loaded **in-process** (no separate serving tier).

- `backend/app/model.py` - model classes + `preprocess_image`/`extract_metadata` copied verbatim from `inference/preprocess_html_and_predict.py`; `preprocess_text` uses a preloaded `stoi`; `build_model`, `build_signals`, `run_prediction`.
- `backend/app/emails.py` - `parse_html` / `parse_eml` / `parse_text` / `parse_upload` → common `{subject, body, images}`.
- `backend/app/weights.py` - `resolve_weights()` (`HERON_WEIGHTS_DIR` env or HF Hub `vishalpatil-18/heron-phishing`, repo id overridable via `HERON_HF_REPO`) + `get_model()` load-once singleton.
- `backend/app/main.py` - `GET /health`, `POST /predict` (multipart `file` OR JSON `{text, subject}`), CORS `*`.
- Samples in `backend/samples/`, tests in `backend/tests/test_predict.py`.
- Containerized: `backend/Dockerfile` + `.dockerignore` (honors `$PORT`, default 8080); CPU torch, weights pulled at startup from the free HF model repo (not baked in). Deploys to **Google Cloud Run** via `gcloud run deploy --source` (Cloud Build - no local Docker needed).

**Frontend:** scaffolded in `frontend/` - Next.js 16.2 (App Router, Turbopack) + React 19 + TypeScript + **Tailwind v4** (CSS-first `@theme`, no `tailwind.config`). DESIGN.md tokens live in `frontend/app/globals.css @theme`; DM Sans via `next/font`; light-mode only. Primitives in `frontend/components/ui/` (`Button`, `Card`, `Badge`); typed API client in `frontend/lib/api.ts`. `create-next-app` also dropped `frontend/CLAUDE.md`+`AGENTS.md` (Next-16 "read node_modules/next/dist/docs before coding" guidance - kept). **App shell:** `HeronLogo`/`Nav`/`Footer` in `frontend/components/`, wired via `frontend/app/(marketing)/layout.tsx` (sticky nav → hamburger < `lg`, black footer). Marketing routes `/`, `/benchmarks`, `/architecture`, `/research`, `/team` + `/dashboard` are placeholder stubs (Tasks 6–11 fill them); the design-system demo moved to `/styleguide`. Deploy target: Vercel (Task 12).

**Existing ML code (do not modify):** `src/`, `inference/`, `notebooks/`, `models/`, `data/`.

**Build / run / test (backend):**

```bash
cd backend
pip install -r requirements.txt
export HERON_WEIGHTS_DIR=.weights            # dir with best_fusion_model.pth + vocab_text_1.json (git lfs pull first)
uvicorn app.main:app --reload                # http://localhost:8000
pytest                                        # 8 tests, stubbed model - no real weights needed
```

**Deploy targets (free tier only):** backend → **Google Cloud Run** (Docker, scale-to-zero, `--max-instances 1`); frontend → Vercel. Weights pulled from the free HF model repo at startup. `NEXT_PUBLIC_API_URL` = `https://heron-api-787333291568.us-central1.run.app` (the **live** Cloud Run service - verified serving correct verdicts).

---

## Key Decisions

- **Monorepo `backend/` + `frontend/`; existing ML code untouched.** Backend is a self-contained deployable.
- **Backend copies the model (not imports it) from `inference/`.** Docker copies only `app/`; importing a sibling dir would break the image. Copy is hand-synced - if the trained architecture changes, update both (ceiling noted in `model.py`).
- **Dropped remote `http` image fetch** from the original `parse_html_email`. Fetching arbitrary URLs from user uploads on a public endpoint is an SSRF risk; only inline `data:image` is decoded. Zero images → zeros tensor (model already handles it).
- **`torch.load(..., weights_only=True)`.** Checkpoint is a plain state_dict; blocks arbitrary-code execution when unpickling HF-pulled weights.
- **Tests stub the model.** Real weights are Git LFS objects; a fixed-logits stub validates the parse→preprocess→signal→response wiring in any environment. Real-verdict checks are the manual curl step in `backend/README.md`.
- **Signals reuse the script's `predict_phishing` thresholds**, converted from printed "Detected Issues" into a structured `signals[]` array.
- **CORS `*`** - public demo API; lock to the Vercel domain if it ever serves more than the open scanner.
- **Backend host: Google Cloud Run, not HF Spaces.** HF now requires a paid **PRO** plan to host Docker/Gradio Spaces even on `cpu-basic` (only static Spaces are free) - hit as a `402 Payment Required` at deploy. Cloud Run keeps the FastAPI + Docker backend, scales to zero, and stays $0 under the free tier (`--max-instances 1` bounds cost). The weights **model repo** stays on HF (model storage is free; only Space compute costs).
- **Zero-cost (per CLAUDE.md §6):** Cloud Run free tier + Vercel free tier + free HF model-repo storage.

---

## Session History

### Task 11 follow-up - Vishal hero redesign + fix profile images

**What was done:** Rebuilt Vishal's card on `/team` as a personal hero: "Open to work · US & Europe" chip, "Hi, I'm Vishal Patil", "I build AI products people actually use.", a Heron-aligned bio (dropped ProBot per request) with links to v-ai.org/build + the CNBC article, a "What I bring to the table" skills card, and an amber "As featured by CNBC" callout. Fixed all profile image paths to root-relative (`/vishal.jpeg`, `/akash.jpeg`, `/sri.jpeg`, `/anila.png` in `public/`) and fixed the team-grid LinkedIn buttons (were pointing at `github` instead of `linkedin`). Verified all 4 images load and links resolve; tsc clean.
**Files touched:**
- `frontend/app/(marketing)/team/page.tsx` (update) - Vishal hero redesign; `skills` array; CNBC/VAI url consts; root-relative image src; LinkedIn href fix; removed unused `initials()` (avatars are photos now)
**Decisions:** CNBC callout uses amber Tailwind utilities (`bg-amber-50` etc.) - no warm token in the design system, but matches the requested look. Kept plain `<img>` (LCP lint warning accepted) to match existing code. `products` and `VAi` both link to https://v-ai.org/build per request.
**Open questions / follow-ups:** none.

### Task 11 - Research page + Team/hire page

**What was done:** Built `/research` (the paper, typeset in a ≤760px prose column with a Download-PDF button) and `/team` (hire page led by Vishal, grid of the other three with GitHub links). Copied `docs/Project_Report.pdf` → `frontend/public/heron-research.pdf` (serves 200 `application/pdf`). Fixed the footer's dead `/hire-me` link → `/team`. Verified: research sections + PDF download, team leads with Vishal + all 4 GitHub links, both footers link `/team`; tsc + eslint clean.
**Files touched:**
- `frontend/public/heron-research.pdf` (create) - copy of the paper, served for download
- `frontend/app/(marketing)/research/page.tsx` (replace stub, server) - eyebrow/title/authors + Download-PDF `<a download>`; Abstract, Key contributions (3), Method, Results (links to /benchmarks), Data, References [1]–[5], transcribed from the paper
- `frontend/app/(marketing)/team/page.tsx` (replace stub, server) - Vishal hero (initials avatar, role/bio TODO placeholders, mailto "Hire me" → vishalpatil.imp@gmail.com, GitHub) + 3-card grid (Akash `akashsv01`, Srihari `Srihari-Narayan`, Anila `madhu-anila`); `initials()` helper for avatars
- `frontend/components/Footer.tsx` (update) - "Hire Me" href `/hire-me` → `/team` (the team page is the hire page)
**Decisions:** Placeholders marked with `{/* TODO */}` (Vishal photo/bio/role, teammate roles) so the page ships now. Used Vishal's known email for the mailto as a sensible default (TODO to swap). PDF/mailto/GitHub use plain `<a>` (download/external semantics) rather than the Button component (which renders next/link). Team GitHub handles from README: VishalPatil18, akashsv01, Srihari-Narayan, madhu-anila.
**Open questions / follow-ups:** none. Remaining: Task 12 (Vercel deploy). Nav already links /research and /team.

### Task 10 - Benchmarks page (model table + metric bars)

**What was done:** Built `/benchmarks`: a model-comparison table (KNN 81.71, LogReg 80.00, Text CNN 98.96, Image CNN 76.30, ResNet18 97.43, Fusion 99.45 highlighted) and the fusion model's detailed metrics (Accuracy 99.45%, AUC-ROC 0.999, Precision 99.5%, Recall 99.4%, F1 99.4%) as animated bars. All numbers live in one typed source and match README exactly. Verified table values against README; tsc + eslint clean.
**Files touched:**
- `frontend/lib/benchmarks.ts` (create) - typed `models` + `fusionMetrics` single source (README/paper numbers)
- `frontend/components/benchmarks/ModelTable.tsx` (create, server) - data-table styled comparison table; Fusion row emphasized (bold + coral tint); slim static accuracy fill-bar per row (hidden < sm); outer `overflow-hidden rounded-md` clips corners, inner `overflow-x-auto` scrolls on mobile
- `frontend/components/benchmarks/MetricBars.tsx` (create, client) - 5 horizontal bars, each fill animates 0→value on `whileInView` (StatsStrip pattern), `useReducedMotion` snaps to value
- `frontend/app/(marketing)/benchmarks/page.tsx` (replace stub, server) - intro + "Model comparison" (ModelTable) + "Fusion model metrics" (MetricBars) sections
**Decisions:** Numbers use README's reported values (AUC 0.999, P 99.5 / R 99.4 / F1 99.4), not confusion-matrix-recomputed ones, since the test scenario is "table matches README exactly". Honest 0-100 bar scale (metrics all near 100% look similar by design; the value readouts carry precision). Table is a server component (static); only the animated bars are client.
**Open questions / follow-ups:** none. `whileInView` bar fill can't be visually verified in the headless 0×0 preview (IntersectionObserver never fires) - plays in a real browser; final values/structure verified via DOM.

### Task 9 follow-up - pin-on-click, clear button, no focus outline

**What was done:** Refined `ArchitectureDiagram` interaction: hover still previews a block, but a click now **pins** it (panel persists with no hover, until another block is picked). Added a red (coral) × clear button in the panel's top-right (20px insets, via `p-5` + `absolute top-5 right-5`) that resets to the placeholder. Removed the browser's blue focus outline on the SVG node groups. Verified: pin persists without hover, × clears to placeholder, `outlineStyle: none`; tsc + eslint clean.
**Files touched:**

- `frontend/components/ArchitectureDiagram.tsx` (update) - split `active` into `hovered`/`pinned` (`active = hovered ?? pinned`); click sets `pinned`, hover/focus set `hovered`; added the × button; `outline-none` + inline `outline:'none'` on node groups (focus is still indicated by the accent highlight via `onFocus`)
  **Decisions:** `hovered ?? pinned` keeps hover as a transient preview layered over a persistent pin - matches "persist until another block is hovered or clicked". Kept focus outline removed but retained onFocus highlight, so keyboard focus stays visible without the blue ring.
  **Open questions / follow-ups:** none

### Task 9 - Architecture page (interactive diagram + writeups)

**What was done:** Built `/architecture`: a framer-animated, interactive SVG diagram of the dual-tower fusion pipeline (Email → Text/Image/Metadata towers → Concat 832-d → Fusion 832→512→256→128→2 → Verdict), wrapped in writeups (the application, the model) above and the complete HTML-to-decision workflow + key design/model decisions below. Hovering/tapping a block highlights it (solid 3px), dashes its connected blocks, dims the rest, lights its connectors, and drives a description panel. Content transcribed from `docs/Project_Report.pdf`; exact layer dims from `src/fusion_models.py`. Verified: 7 nodes, correct highlight/dash/dim states + panel chips on interaction; tsc + eslint clean.
**Files touched:**

- `frontend/components/ArchitectureDiagram.tsx` (create, client) - node/edge graph as data; edge paths computed from block anchors; framer `whileInView` staggered entrance + connector `pathLength` draw-on + `whileHover` scale; `useState` active-node drives highlight (active/connected/dim) and the description panel. Responsive via fixed `viewBox` + `min-w-[900px]` inside `overflow-x-auto` (horizontal scroll on mobile)
- `frontend/app/(marketing)/architecture/page.tsx` (replace stub, server) - intro + "The application" / "The model" prose (with 99.45% / AUC 0.9998 / 23-32 FP-FN callout), the diagram, a 5-step workflow `<ol>`, and Key design decisions + Model decisions as 2-col card grids
  **Decisions:** Diagram as one responsive SVG with a fixed viewBox (not per-block measured connectors) - scales cleanly and the edge paths are computed from anchors. Entrance uses `whileInView` (matches StatsStrip's scroll-trigger pattern); hover highlight is state-driven with CSS transitions, not framer variants, so sibling nodes cross-animate simply. Prose lives in `page.tsx` (server); only the interactive diagram is a client component.
  **Open questions / follow-ups:** none. `whileInView` entrance can't be visually verified in the headless 0×0 preview (IntersectionObserver never fires) - plays in a real browser; interactivity verified via dispatched click (same `setActive` path as hover).

### Task 8 - Dashboard email scanner (live inference)

**What was done:** Built the core product: `/dashboard` scans an email (drag-drop `.html`/`.eml`, paste text, or one-click sample) against the **live Cloud Run backend** and shows a verdict, animated confidence ring, and detected signals. Status machine `idle → scanning → done/error` with an `AbortController` guarding double-submit and navigate-away. Verified end-to-end: phishing sample → Phishing 100% + 5 signals; legit sample → Legitimate 99% + no signals; simulated backend-down → error + Retry → recovery. `tsc` + eslint clean.
**Files touched:**

- `frontend/app/dashboard/page.tsx` (update) - replaced the stub with a client orchestrator: state machine, abort guard, `friendlyError()` mapping (network vs 400 vs generic), last-input Retry, minimal inline header (logo→home) + footer (Team link, R7)
- `frontend/components/dashboard/UploadZone.tsx` (create) - tabs (Upload file / Paste text), drag-drop + hidden file picker (`.html,.eml`, resets value so same file re-selects), subject+textarea, "Try a sample" buttons that fetch bundled samples → `File`
- `frontend/components/dashboard/ScanProgress.tsx` (create) - cosmetic timed stage loader (Parsing → Reading text → Inspecting logos → Fusing signals) + skeleton
- `frontend/components/dashboard/ResultCard.tsx` (create) - verdict pill (coral/green), framer-animated SVG confidence ring + count-up %, signals list with severity chips (high=coral / medium / low), meta line, "Scan another"
- `frontend/components/dashboard/EmptyState.tsx` (create) - idle placeholder
- `frontend/public/samples/{phishing,legit}_example.html` (create) - copies of `backend/samples/*` for same-origin sample fetch (no CORS)
- `frontend/.env.local` (create) - `NEXT_PUBLIC_API_URL` = live Cloud Run URL so dev/preview hit the real backend (gitignored)
  **Decisions:** `lib/api.ts` left unchanged - its `predict()` (abort support) and `PredictResponse` already match the backend contract exactly. Dashboard sits outside the `(marketing)` layout, so it carries its own minimal header/footer inline (no new files). Loader stages are cosmetic (backend is one request), revealed on resolve. Samples fetched as `File` (not inline text) to exercise the real `.html` upload path and produce rich signals. `confidence` is 0-1 → ×100 for display.
  **Open questions / follow-ups:** none. Backend cold start adds ~12s to the first scan (Cloud Run scale-to-zero); warm scans ~1.8s. Mobile (375px) relies on `lg:grid-cols-2` stacking - verified by construction, not visually (preview pane is headless 0×0).

### Animate hero chip dot + stats count-up

**What was done:** Made the coral status dot in the Hero "Phishing defense · live" chip pulse (CSS `animate-ping` ring behind a solid dot - no JS). Added a framer-driven count-up to StatsStrip: each stat animates from 0 to its value on scroll-into-view (easeOut, 1.6s), formatted with `toLocaleString` so it lands exactly on the originals (`99.45%`, `0.999`, `76,346`, `352`) and groups mid-animation. Installed `motion` (framer-motion, v12).
**Files touched:**

- `frontend/package.json` (update) - added `motion` dependency (explicitly requested; free/OSS, React 19 compatible)
- `frontend/app/(marketing)/sections/Hero.tsx` (update) - status dot now a relative span with an `animate-ping` coral ring
- `frontend/app/(marketing)/sections/StatsStrip.tsx` (update) - now a client component; stat data holds `{value:number, decimals, suffix}`; `Counter` uses `useMotionValue`/`animate`/`useTransform`/`useInView` (once), with `useReducedMotion` snapping straight to the value
  **Decisions:** Dot pulse in pure CSS (`animate-ping`), not framer → native platform covers it. Count-up via framer per explicit request. Numeric stat data + `toLocaleString` (not hardcoded strings) so the animated value formats identically to the target.
  **Open questions / follow-ups:** Count-up scroll trigger couldn't be visually verified in the preview pane (headless viewport is 0×0, so IntersectionObserver never fires); formatting verified via Node, pulse verified in DOM.

### Unify logo lockup (name + tagline) everywhere

**What was done:** Made the Footer and FinalCta render the same logo lockup as the Nav - mark on the left, "Heron" with the "Nothing swims past." tagline stacked below it on the right - by passing `<HeronLogo tagline />` and deleting their separate `<p>` taglines. Changed the tagline color in `HeronLogo` from hardcoded `text-steel` (#5f5f5f) to `text-current opacity-60` so it stays legible on both the light nav and the dark footer/CTA. Verified via computed styles: nav ink@60% on white, footer + CTA white@60% on dark.
**Files touched:**

- `frontend/components/HeronLogo.tsx` (update) - tagline uses `text-current opacity-60` instead of `text-steel`, so it adapts to its container's text color
- `frontend/components/Footer.tsx` (update) - `<HeronLogo tagline />`, removed standalone tagline `<p>`
- `frontend/app/(marketing)/sections/FinalCta.tsx` (update) - `<HeronLogo tagline />`, removed the wrapping `flex-col` + tagline `<p>`
  **Decisions:** currentColor + opacity over a per-site color prop → one component reads correctly on any background without adding props. Nav shifts from #5f5f5f to ink@60% (≈#666) - a negligible visual change that keeps the lockup uniform.
  **Open questions / follow-ups:** none

### Retime hero animation to 15s (inbox +1s, Heron +2s)

**What was done:** Stretched the hero animation from 11s to **15s** with per-beat control (not a uniform slow-down): inbox 0→3s (+1s), reader/click 3–7s, glitch/terminal 7–9s, hacker 9–10.6s, Heron finale 10.6–15s (+2s). Every keyframe % across all 14 beat animations was piecewise-remapped to the new timeline; the short independent loops (rgb/bars/caret) left as-is. Verified `animation-duration: 15s` and the click still lands (cursor tip (143,300) inside the button box).
**Files touched:**

- `frontend/app/(marketing)/sections/HeroScene.module.css` (update) - `11s`→`15s` durations; all keyframe percentages recomputed for the new beat boundaries.
  **Decisions:** Piecewise beat retiming over a uniform `11s→15s` stretch - keeps the action beats (click, glitch, hacker) snappy and only lengthens the inbox + Heron holds, matching the request. The extra second (15 − 11 − 1 − 2) went to the reader/click beat.
  **Open questions / follow-ups:** none.

### Fix hero animation - cursor click alignment + robust scaling

**What was done:** Fixed the cursor missing the "Log in to verify account" button and removed the "See the detection" pill. Root cause: the animation uses fixed 640px pixel keyframes, but the stage rendered at other widths (equal-column hero), so the cursor drifted off the button. Made the stage a fixed **640×520 coordinate space** that a `ResizeObserver` scales to fit its container (robust at any width), and retargeted the cursor's login-click keyframes to the button's measured center. Verified: at the click frame the cursor tip (143,299) sits inside the button box (x 31-252, y 276-320).
**Files touched:**

- `frontend/app/(marketing)/sections/HeroScene.tsx` (update) - now a client component; `.hsFrame` wrapper + `ResizeObserver` setting `--hs-scale`; removed the "See the detection" pill.
- `frontend/app/(marketing)/sections/HeroScene.module.css` (update) - `.hsStage` fixed 640×520 + `transform: scale(var(--hs-scale))`; new `.hsFrame` (responsive box holding border/radius/shadow); cursor login-click keyframes 137,401 → 140,296.
- `frontend/app/(marketing)/sections/Hero.tsx` (update) - grid back to `lg:grid-cols-2` (scaling handles width).
- `context.md` (update) - this entry.
  **Decisions:** Scale-to-fit (fixed 640×520 + ResizeObserver) over pinning a 640px column - robust at all widths and keeps cursor + button in one coordinate space. The runtime scale is the one dynamic value, set as a CSS variable via the observer; all static styling stays in classes.
  **Open questions / follow-ups:** none.

### Task 7 - Hero animation + nav tagline + design hero text

**What was done:** Ported the 11s hero animation from `heron-design/HeroScene.dc.html` (inbox → open the phishing mail → click its login → glitch → terminal "ACCESS GRANTED" → hacker → Heron wipe "would've caught this") as a scoped CSS module. Hero text now matches the design: coral eyebrow "Phishing defense · live demo" + "One click is all it takes. **Heron catches it before you do.**" (second sentence coral). Navbar logo shows "Nothing swims past." tagline under the wordmark. Build clean; animation verified cycling beats in the browser.
**Files touched:**

- `frontend/app/(marketing)/sections/HeroScene.tsx` (create) - stage markup (server component, pure CSS, `role="img"` + aria-label).
- `frontend/app/(marketing)/sections/HeroScene.module.css` (create) - animation CSS ported verbatim (keyframes + `prefers-reduced-motion` → final Heron still).
- `frontend/public/hero-hacker.jpg` (create) - hacker frame copied from `heron-design/uploads/18005.jpg` (5.6 MB).
- `frontend/app/(marketing)/sections/Hero.tsx` (update) - design eyebrow + headline; renders `<HeroScene/>`.
- `frontend/components/HeronLogo.tsx` (update) - optional `tagline` prop ("Nothing swims past." under the wordmark).
- `frontend/components/Nav.tsx` (update) - passes `tagline`.
- `frontend/app/layout.tsx` (update) - JetBrains Mono via `next/font` (`--font-mono` for the terminal/mono text).
- `context.md` (update) - this entry.
  **Decisions:** Ported the existing **pure-CSS** animation (no framer-motion) per the user's instruction - deviates from plan.md Task 7's framer-motion but matches the supplied design. Animation lives in a CSS module (modular, no inline CSS); the design's few inline styles → Tailwind utilities. Dropped the unused inline hacker SVG (was `display:none`; the `<img>` is the hacker in both motion + reduced-motion). "Nothing swims past." moved off the hero headline → now the navbar tagline + end card.
  **Open questions / follow-ups:** `hero-hacker.jpg` is 5.6 MB - compress/optimize in the Task 13 polish pass. Animation loops indefinitely by design.

### UI polish - Sentinel logo, hero remix, end card (from heron-design)

**What was done:** Adopted the `heron-design/` brand kit. Logo swapped to the **"Sentinel"** standing-heron mark (coral eye + coral waterline, faces right) as the horizontal lockup; new app-icon favicon; hero now leads with a small **black** kicker ("One click is all it takes. Heron catches it before you do.") over a **red** "Nothing swims past." headline; the final section became the black **HERO SCENE END CARD** (logo + tagline, then "Heron would've caught this." + CTA). Build clean; hero verified via screenshot, end card via DOM.
**Files touched:**

- `frontend/components/HeronLogo.tsx` (update) - Sentinel mark; bird `fill-current`/`stroke-current`, coral eye/waterline `fill-brand-coral`/`stroke-brand-coral` (no inline CSS). Nav + Footer inherit it automatically (currentColor = ink on nav, white on footer).
- `frontend/app/icon.svg` (update) - APP ICON (coral rounded square + white mark, no waterline).
- `frontend/app/(marketing)/sections/Hero.tsx` (update) - black kicker + red `text-brand-coral` headline; kept the two CTAs (Scan an email / See the benchmarks) + reserved scene box.
- `frontend/app/(marketing)/sections/FinalCta.tsx` (update) - black `bg-ink` end card, logo + tagline top, "Heron would've **caught** this." (caught in coral), white-pill CTA.
- `context.md` (update) - this entry.
  **Decisions:** Logo switched from the F1 flight mark to the Sentinel (design-folder choice supersedes the earlier F1). All colours via Tailwind `fill-`/`stroke-`/`text-` classes + tokens; coral = existing `brand-coral` (#ff5530). Design source: `heron-design/Heron Logo.dc.html` + `HeroScene.dc.html`.
  **Open questions / follow-ups:** The hero **animation** (mac-mail to click to hack to Heron wipe) stays **Task 7** - the full storyboard + CSS is in `heron-design/HeroScene.dc.html`, ready to port. Browser pane wouldn't screenshot scrolled sections (env); end card verified via DOM.

### Task 6 - Landing page (AI-phishing story + stats)

**What was done:** Built the marketing landing (`app/(marketing)/page.tsx`) from five section components - hero (tagline + story + dual CTA + reserved HeroScene box), "AI supercharged phishing", "how Heron sees" (3 modality cards), stats strip, coral final CTA. Made `Button` polymorphic to kill CTA class duplication. Build clean (9 routes); sections verified rendering top-to-bottom via DOM text + hero screenshot.
**Files touched:**

- `frontend/components/ui/Button.tsx` (update) - polymorphic: `href` → `next/link` `<Link>`, else `<button>`; same variant classes.
- `frontend/app/(marketing)/sections/{Hero,Problem,HowHeronSees,StatsStrip,FinalCta}.tsx` (create) - one component per section.
- `frontend/app/(marketing)/page.tsx` (update) - assembles the five sections (replaces the Task-5 placeholder).
- `context.md` (update) - this entry.
  **Decisions:** Responsive hero via stacked type tokens (`text-heading-md sm:text-heading-lg md:text-display-lg lg:text-hero-display` = 32→40→56→80). Stats on a hairline-framed white band (DESIGN `testimonial-stat-row`), reflow `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. HeroScene is an inline reserved box (`aspect-[4/3]`) - Task 7 swaps in the animation. Stat numbers sourced from README (99.45% / 0.999 / 76,346 / 352).
  **Open questions / follow-ups:** `Nav` still uses its own inline CTA pill (not refactored to the now-polymorphic `Button` - left as-is). Browser pane wouldn't reliably screenshot scrolled sections (env flakiness); verified via DOM + build. HeroScene animation = Task 7.

### Logo redesign - heron in flight

**What was done:** Replaced the weak checkmark logo with a heron-in-flight mark - arched wings, head between them, legs trailing (concept "F1 / Arched", chosen from rendered concept sets). Added a theme-adaptive SVG favicon.
**Files touched:**

- `frontend/components/HeronLogo.tsx` (update) - F1 arched-wings mark (viewBox 48, `currentColor` so it's ink on nav / white on footer).
- `frontend/app/icon.svg` (create) - favicon, `prefers-color-scheme`-adaptive (black on light tabs, white on dark). Removed the default `app/favicon.ico`.
  **Decisions:** User picked from a 6-concept exploration → then 5 flight variations → "F1 Arched". Build clean, verified in the nav.
  **Open questions / follow-ups:** none.

### Task 5 - Frontend app shell (logo, nav, footer)

**What was done:** Built the shared chrome - Heron logo (SVG mark = checkmark/heron head + wordmark), sticky white nav (desktop links + black-pill CTA, hamburger drawer < `lg`), and dense black footer (columns + tagline + GitHub) - wrapped around marketing pages via an `app/(marketing)/layout.tsx` route group. `npm run build` passes (8 routes); verified desktop nav + footer and the mobile hamburger→drawer in the browser.
**Files touched:**

- `frontend/components/HeronLogo.tsx` (create) - inline SVG, `currentColor` so parent sets color (ink on nav, white on footer); `size`/`showWordmark` props.
- `frontend/components/Nav.tsx` (create) - `'use client'`; sticky `hairline-soft` bar, links, hamburger `useState`; CTA is a `<Link>` styled as the primary pill (a `<button>` inside `<a>` is invalid HTML - minor class duplication of `button-primary`, noted).
- `frontend/components/Footer.tsx` (create) - `footer-region`, columns Product/Research/Team (incl. Team/hire-us R7), GitHub link.
- `frontend/app/(marketing)/layout.tsx` (create) - `min-h-screen` flex wrapper: `<Nav/>` + `<main>` + `<Footer/>`.
- `frontend/app/(marketing)/{page,benchmarks,architecture,research,team}/…page.tsx` (create) - landing + 4 stub pages so nav links resolve.
- `frontend/app/dashboard/page.tsx` (create) - CTA-target stub (kept out of `(marketing)`; gets its own chrome in Task 8).
- `frontend/app/styleguide/page.tsx` (create) + removed `frontend/app/page.tsx` - moved the Task 4 design demo out of `/` so the `(marketing)` group owns it.
- `context.md` (update) - Current State + this entry.
  **Decisions:** Route group `(marketing)` owns `/` → the Task-4 scratch page had to move (to `/styleguide`, kept as a dev reference). Stub pages created for every nav destination so the shell is navigable now (Tasks 6/9/10/11 replace). CTA rendered as a styled `<Link>`, not `<Button>`, for valid/accessible nav markup.
  **Open questions / follow-ups:** Hero placeholder shows 80px unscaled on mobile - responsive hero scaling is Task 6's job. `/dashboard` + the 4 marketing stubs are placeholders.

### Task 4 - Frontend scaffold + DESIGN.md design system

**What was done:** Scaffolded the Next.js frontend (`create-next-app`: Next 16.2, React 19, TS, Tailwind v4, App Router) and wired the DESIGN.md token system. `npm run build` passes; dev-server screenshot + DOM confirm the primitives render (DM Sans, 80px hero, coral pill badge, black pill buttons, 16px/32px cards). Backend also re-verified live + HF-free (`hf_hub_download` log lines: 0).
**Files touched:**

- `frontend/` (create) - `create-next-app` scaffold (Next 16.2 / React 19 / Tailwind v4 CSS-first).
- `frontend/app/globals.css` (update) - `@theme` with DESIGN.md colors, radius (`xl`16/`hero`32/…), and DM Sans type scale (`text-hero-display`, `text-display-lg`, … as Tailwind v4 `--text-*` utilities); light-only; body = canvas/ink.
- `frontend/app/layout.tsx` (update) - DM Sans via `next/font/google`, Heron `<title>`/OG metadata.
- `frontend/lib/api.ts` (create) - typed `predict()` + `PredictResponse`/`Signal`/`Verdict`; `NEXT_PUBLIC_API_URL` (dev `http://localhost:8000`, prod the Cloud Run URL).
- `frontend/components/ui/{Button,Card,Badge}.tsx` (create) - primitives per DESIGN.md (pill buttons w/ `:active` pressed, no-hover policy; card-base vs coral hero; success/new/beta badges).
- `frontend/app/page.tsx` (update) - scratch page exercising all primitives + the type scale.
- `.claude/launch.json` (create) - `heron-frontend` dev-server config (port 3000).
- `context.md` (update) - Current State + this entry.
  **Decisions:** Tailwind **v4** (create-next-app default) → tokens in `globals.css @theme`, not the plan's `tailwind.config.ts`. Spacing uses Tailwind's numeric scale (already equals DESIGN.md px: p-6=24, p-8=32). `NEXT_PUBLIC_API_URL` prod = the live Cloud Run URL (plan's HF Space is dead). Heeded `frontend/AGENTS.md` (Next 16 breaking changes) - read `node_modules/next/dist/docs` for `next/font` + CSS conventions before coding.
  **Open questions / follow-ups:** Real pages (nav/footer/landing/dashboard) are Tasks 5–11; `predict()` is defined but not yet called (Task 8). `frontend/node_modules` is npm-ignored via the scaffold's own `.gitignore`.

**What was done:** Removed the runtime Hugging Face dependency and the ~136 MB cold-start download by baking the weights into the Cloud Run image. Weights are staged into a gitignored `backend/weights/` folder and `COPY`ed in; `HERON_WEIGHTS_DIR=/app/weights` makes `weights.py` load them off local disk. Spec: `docs/superpowers/specs/2026-07-24-bake-model-weights-into-image-design.md`; plan: `docs/superpowers/plans/2026-07-24-bake-model-weights-into-image.md`. 10 pytest green (incl. a real-staged-weights integration test that loads the 136 MB model and predicts `phishing`).
**Files touched:**

- `backend/Dockerfile` (update) - `COPY weights ./weights` + `ENV HERON_WEIGHTS_DIR=/app/weights`; dropped the stale "weights not baked" comment.
- `backend/.gcloudignore` (create) - keeps `weights/` in the Cloud Build upload; its presence stops the `.gitignore` fallback from stripping it.
- `.gitignore` (update) - ignore `backend/weights/`.
- `backend/.dockerignore` (update) - drop the stale `.weights/` line.
- `backend/tests/test_predict.py` (update) - `resolve_weights` contract test + real-staged-weights integration test (skips if unstaged).
- `backend/README.md` (update) - staged `weights/` prep step, HF-free deploy flow; the HF upload section is now "optional/published-artifact + fallback".
- `context.md` (update) - this entry.
  **Decisions:** Bake from local files (fully HF-free) over build-time `hf download` (keeps a build-time HF dep + touches the ClamAV-flagged vocab) and over a GCS bucket (weights are stable → no need to decouple). `weights.py` unchanged - the existing `HERON_WEIGHTS_DIR` path is the loader; HF stays as a fallback + published artifact. Key gotcha handled: `gcloud run deploy --source` falls back to `.gitignore` (which ignores `weights/`) unless a `.gcloudignore` exists.
  **Open questions / follow-ups:** Prep step is manual before each deploy (documented in `backend/README.md`). Deploy + live "no `hf_hub_download`" verification is Task 4 of the plan (user-run). Cold start still pays image-pull + torch import + disk load (~5–10 s).

### Task 3 - Backend LIVE on Google Cloud Run

**What was done:** Deployed the FastAPI backend to Cloud Run and verified it end-to-end. Live at `https://heron-api-787333291568.us-central1.run.app`. `/predict` returns correct real verdicts - phishing sample → `phishing` (1.0) with 5 signals; legit sample → `legitimate` (0.9916); pasted urgent+bit.ly text → `phishing` (0.9999). Fixed a namespace bug + several deploy blockers along the way.
**Files touched:**

- `backend/app/weights.py` (update) - `HF_REPO_ID` corrected to `vishalpatil-18/heron-phishing` (the real HF namespace has a hyphen; the old `vishalpatil18` 404'd → `/predict` 500) and made overridable via `HERON_HF_REPO` env.
- `backend/README.md`, `README.md`, `context.md` (update) - namespace `vishalpatil18` → `vishalpatil-18`; recorded the live URL.
  **Decisions / gotchas (for future deploys):**
- HF namespace is **`vishalpatil-18`** (hyphen), not `vishalpatil18`.
- Cloud Run "deploy from source" needs the Compute Engine default SA (`<projectnum>-compute@developer.gserviceaccount.com`) granted `roles/cloudbuild.builds.builder`; new projects don't, giving a `403 storage.objects.get` on the source bucket.
- HF weights upload needs a **Write**-scoped token (`hf auth login`) under the correct namespace.
- Cloud Run now issues **project-number URLs** (`heron-api-<projectnum>.<region>.run.app`), not the old random-hash form - the URL changed between the first and second deploy.
- Cold start re-downloads the 136 MB weights (scale-to-zero), so the first `/predict` after idle can time out; the warm instance serves normally.
  **Open questions / follow-ups:** none for the backend. Frontend (Task 4+) consumes `NEXT_PUBLIC_API_URL`.

### Retarget backend deploy: HF Spaces → Google Cloud Run

**What was done:** HF Docker Spaces turned out to require a paid PRO plan (`402` at `hf repos create … --sdk docker`), breaking the zero-cost plan. Repointed the backend deploy to **Google Cloud Run** (free tier, scale-to-zero). No app-code changes - only the container port and the deploy docs. Weights still pulled from the free HF model repo. User runs the deploy (installs + accounts on their machine).
**Files touched:**

- `backend/Dockerfile` (update) - CMD now honors Cloud Run's `$PORT` (`sh -c "exec uvicorn … --port ${PORT:-8080}"`); `EXPOSE 8080`; dropped hardcoded HF `7860`.
- `backend/README.md` (update) - removed HF Space YAML header + HF deploy section; added a **Google Cloud Run** runbook (`gcloud run deploy --source`, `--memory 2Gi`, `--max-instances 1`, capture URL); fixed the weights-upload to new `hf` CLI flags (`--type model` + `hf repos create`); local docker port 7860→8080.
- `context.md` (update) - Key Decisions (host pivot + why), Current State deploy target, this entry, TODOs.
  **Decisions:** Cloud Run over HF PRO (zero-cost), over Render/Fly (torch RAM > their 256–512 MB free), over browser-inference (keeps FastAPI/R2). Deploy from source via Cloud Build → no local Docker. `--max-instances 1` + scale-to-zero bounds cost to $0 idle. Weights runtime-pulled (not baked) - cold starts re-download ~137 MB into tmpfs; `--memory 2Gi` covers it.
  **Open questions / follow-ups:** Cloud Run URL has a random hash → `NEXT_PUBLIC_API_URL` filled after deploy. Prereqs still pending on the user's machine: `git-lfs`, `hf` CLI, `gcloud` CLI (+ GCP project with billing). Docker still not installed locally, but Cloud Build removes that need.

### Backend containerized for Hugging Face Spaces (Docker)

**What was done:** Added the Docker image for the FastAPI backend targeting HF Spaces (Docker SDK, port 7860) - CPU-only torch, weights pulled at startup (not baked in). Verified the served app still imports (8 pytest green) and `COPY` paths exist; local `docker build`/`run` **not** executed (no Docker daemon in this dev environment).
**Files touched:**

- `backend/Dockerfile` (create) - `python:3.11-slim`; installs `torch torchvision` from the PyTorch **cpu** index _before_ `-r requirements.txt` so the unpinned torch never resolves to the ~2 GB CUDA wheel; `COPY app` + `COPY samples`; `EXPOSE 7860`; `CMD uvicorn app.main:app --host 0.0.0.0 --port 7860`.
- `backend/.dockerignore` (create) - excludes `__pycache__/`, `.pytest_cache/`, venvs, `.weights/`, `tests/`, `*.md`.
- `backend/README.md` (update) - HF Space YAML header (`sdk: docker`, `app_port: 7860`) + "Deploy (Docker / HF Spaces)" section with local build/run verify commands.
  **Decisions:** CPU torch installed via `--index-url https://download.pytorch.org/whl/cpu` first → keeps the image lean and off CUDA. Runs as **root** (HF Docker Spaces permit it); add a non-root `USER` only if HF flags permissions at deploy. Weights **not** baked in - pulled from `vishalpatil18/heron-phishing` at startup and cached.
  **Open questions / follow-ups:** Local `docker build`/`run` unverified in this env - run the commands in `backend/README.md` before Task 3. Free-tier HF cache is ephemeral → cold start re-downloads weights.

### README rebrand to Heron + setup/startup guide

**What was done:** Rebranded root `README.md` from the ML-research title to the Heron product (**"Nothing swims past."**), added product framing, added `backend/` to the repository structure, and reworked setup into two tracks - run the Heron API (backend) and reproduce the ML pipeline (notebooks).
**Files touched:**

- `README.md` (update) - Heron name + tagline + product intro; new "Quick Start" with Track A (backend: venv, `HERON_WEIGHTS_DIR`, `uvicorn`, `curl`, `pytest`) and Track B (notebooks phases); repo structure now lists `backend/`, `plan.md`, `DESIGN.md`, `context.md`, `CLAUDE.md`; clone URL updated to `github.com/VishalPatil18/heron`.
  **Decisions:** Kept the research substance (architecture, dataset, results, team, references) verbatim and kept the existing HF Streamlit demo link (real) rather than fabricating unbuilt product URLs → README reflects the rebrand while staying accurate.
  **Open questions / follow-ups:** none.

### Backend FastAPI inference service (local)

**What was done:** Built the local FastAPI phishing-inference service - accepts `.html`/`.eml` upload or pasted text, runs the existing dual-tower fusion model in-process, returns `{verdict, confidence, signals[], meta}`. 8 pytest tests green (stubbed model, no real weights required).
**Files touched:**

- `backend/app/__init__.py` (create) - package marker.
- `backend/app/model.py` (create) - model classes + preprocessing copied from `inference/`; `build_model`, `build_signals`, `run_prediction`; `torch.load(weights_only=True)`.
- `backend/app/emails.py` (create) - html/eml/text parsers → common shape; inline-image-only (SSRF-safe).
- `backend/app/weights.py` (create) - weight resolution + load-once model singleton.
- `backend/app/main.py` (create) - `GET /health`, `POST /predict`, CORS `*`.
- `backend/samples/phishing_example.html`, `backend/samples/legit_example.html` (create) - demo emails (URLs kept as **visible text** since `get_text` ignores `href`).
- `backend/requirements.txt` (create) - fastapi, uvicorn, torch, torchvision, pillow, beautifulsoup4, huggingface_hub, python-multipart, pytest, httpx.
- `backend/conftest.py` (create) - puts `backend/` on `sys.path` for pytest.
- `backend/tests/test_predict.py` (create) - 8 tests: health, phishing sample, legit text, empty text, bad binary → 400, unsupported ext → 400, missing field → 400, signal thresholds.
- `backend/README.md` (create) - run/test instructions + one-time HF weights-upload commands.
- `.gitignore` (update) - add `.pytest_cache/`.
- `CLAUDE.md` (update) - add §9: don't auto-commit, provide a commit message on task completion.
- `context.md` (create) - this knowledge base.
  **Decisions:** See Key Decisions (copy-not-import, SSRF fetch dropped, `weights_only=True`, stubbed tests, signal thresholds reused, CORS `*`).
  **Open questions / follow-ups:**
- **One-time weights bootstrap** (before deployed backend can serve): `git lfs pull`, then `hf upload vishalpatil18/heron-phishing models/best_fusion_model.pth` and `data/vocab_text_1.json` (`--repo-type=model`). Documented in `backend/README.md`.
- Real end-to-end verdict locally needs `git lfs pull` (weights are LFS pointer stubs otherwise).
- Next: Dockerfile for HF Spaces (CPU torch, port 7860); then deploy.

---

## Open Questions / TODOs

- [x] Install prereqs on the dev machine: `git-lfs`, `hf` CLI, `gcloud` CLI (+ a GCP project with billing enabled).
- [x] One-time weights upload to the **free** HF model repo `vishalpatil-18/heron-phishing` (`git lfs pull` → `hf repos create --type model` → `hf upload … --type model`) - blocks the deployed backend serving.
- [x] Deploy backend to Cloud Run - **live** at `https://heron-api-787333291568.us-central1.run.app`; `/health` + `/predict` verified.
- [ ] Wire `NEXT_PUBLIC_API_URL` = `https://heron-api-787333291568.us-central1.run.app` into the frontend (Task 4/12); update root `README.md` live URL (Task 12).
- [ ] (Optional) verify the image locally with Docker before deploy - not required (Cloud Build builds from source).
