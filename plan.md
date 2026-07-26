# Heron - Product Build Plan

> **Heron** · _"Nothing swims past."_
> A product face for the multimodal phishing-detection model in this repo: a landing page that tells the "AI supercharged phishing" story, and a dashboard where anyone can scan an email and get a verdict.

**How to use this file:** Each task below is a self-contained unit of work for Claude Code. Do them **in order**. Every task ends with a green build, a working result, and a commit - so you can stop after any task and the repo is in a shippable state. Deployment happens at **Task 3** (backend live) and **Task 12** (frontend live); everything after Task 3 targets the live backend.

---

## Brand & product decisions (locked)

| Thing         | Decision                                                                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name          | **Heron**                                                                                                                                                                                                                                 |
| Tagline       | **"Nothing swims past."**                                                                                                                                                                                                                 |
| Story         | AI has made phishing cheaper, faster, and more convincing. Heron is the watcher on the water that catches the phish before you click.                                                                                                     |
| Logo          | Minimal heron silhouette; beak doubles as a checkmark/hook. SVG, mono (near-black `#0a0a0a` on white).                                                                                                                                    |
| Design system | `DESIGN.md` in this repo (the "MiniMax" token set) - used as **Heron's** system. DM Sans, near-black CTAs on white canvas, pill buttons, 32px gradient cards vs 16px white cards. **Light mode only** (design system has no dark tokens). |
| Frontend      | Next.js (App Router) + TypeScript + Tailwind, deployed to **Vercel** free tier.                                                                                                                                                           |
| Backend       | **FastAPI**, model loaded **in-process** (no separate serving tier), deployed to **Hugging Face Spaces** (Docker SDK, free CPU, 16 GB RAM).                                                                                               |
| Model weights | Pushed to a HF model repo `vishalpatil18/heron-phishing`; backend pulls them at startup via `huggingface_hub`. Local dev can override with a folder.                                                                                      |
| Repo shape    | Monorepo: `backend/`, `frontend/`. Existing ML code (`src/`, `inference/`, `notebooks/`, `models/`, `data/`) stays untouched.                                                                                                             |

---

## Architecture (target)

```
Browser ──HTTPS──> Vercel (Next.js: landing, dashboard, benchmarks, architecture, research, hire-us)
                         │  fetch(NEXT_PUBLIC_API_URL)
                         ▼
                   HF Spaces (FastAPI + Docker)
                         │  loads once at startup
                         ▼
                   DualTowerFusionModel  ◄── weights pulled from HF model repo (vishalpatil18/heron-phishing)
                   text CNN (256) + image CNN (512) + metadata MLP (20→64) → fusion → {phishing|legit}
```

**Input handling (critical):** the model was built around `.html` email files. To make the demo usable, the backend accepts **`.html` upload, `.eml` upload, and raw pasted text** - all three converge on the existing three-tensor pipeline. Ship sample emails so the dashboard works with zero user input.

---

## Requirements → task map

| ID  | Requirement (from request)                                                                     | Task(s) |
| --- | ---------------------------------------------------------------------------------------------- | ------- |
| R1  | Landing + dashboard, no login, scan by uploading email, loaders/advanced UI                    | 4, 6, 8 |
| R2  | FastAPI backend + Next.js frontend                                                             | 1, 2, 5 |
| R3  | Deploy backend, frontend, and model on free tier                                               | 3, 12   |
| R4  | Hero animation: mac mail window → open mail → click spam link → machine hacked → hacker laughs | 7       |
| R5  | Story: AI increased phishing, we solve it                                                      | 4, 6    |
| R6  | Logo + creative name + tagline (Heron / "Nothing swims past.")                                 | 2, 5    |
| R7  | Hire-the-developer page (focus Vishal, mention team) + dashboard footer link                   | 11      |
| R8  | Architecture diagram refactor                                                                  | 9       |
| R9  | Benchmarks page                                                                                | 10      |
| R10 | Research page with the paper we wrote                                                          | 11      |

---

## Task 1 - Backend: FastAPI inference service (local)

**Goal:** A FastAPI app that turns an email (html / eml / pasted text) into `{verdict, confidence, signals[]}` using the existing fusion model, running locally.

**Requirements trace:** R2. **Depends on:** none.

**Files:**

- `backend/app/main.py` - FastAPI app: `GET /health`, `POST /predict`.
- `backend/app/model.py` - model load + the three-tensor forward pass (reuse architecture + preprocessing from `inference/preprocess_html_and_predict.py` - **do not rewrite the model**, import/copy the existing `TextFeatureExtractor`/`ImageFeatureExtractor`/`DualTowerFusionModel` and the `preprocess_text` / `preprocess_image` / `extract_metadata` functions).
- `backend/app/emails.py` - parse `.html` (reuse `parse_html_email`), `.eml` (stdlib `email` module → html/text part), and raw text (subject+body) into the common `{subject, body, images}` shape.
- `backend/app/weights.py` - resolve weights: if `HERON_WEIGHTS_DIR` set, load from there; else `huggingface_hub.hf_hub_download` from `vishalpatil18/heron-phishing` (files: `best_fusion_model.pth`, `vocab_text_1.json`). Cache the loaded model as a module singleton (load once).
- `backend/samples/phishing_example.html`, `backend/samples/legit_example.html` - 2 sample emails.
- `backend/requirements.txt` - `fastapi`, `uvicorn[standard]`, `torch` (CPU), `torchvision`, `pillow`, `beautifulsoup4`, `huggingface_hub`, `python-multipart`.
- `backend/tests/test_predict.py` - pytest.

**Approach:**

- `POST /predict` accepts either `multipart/form-data` (file field `file`) or JSON `{ "text": "...", "subject": "..." }`. Detect by content type / field presence.
- Route the parsed email through the existing pipeline; return JSON:
  ```json
  { "verdict": "phishing|legitimate", "confidence": 0.9873,
    "signals": [{"code":"shortened_url","label":"Contains shortened URLs","severity":"high"}, ...],
    "meta": {"images_found": 2, "body_chars": 2847} }
  ```
- Convert the script's printed "Detected Issues" into the structured `signals` array (reuse the same thresholds already in `predict_phishing`).
- CORS: allow `*` (public demo API) - note the ceiling in a comment.
- **Weights bootstrap step (run once, manually, before the backend can serve):** publish the real LFS weights to the HF model repo. Document the exact commands in `backend/README.md`:
  ```bash
  git lfs pull                                   # download the real .pth locally
  hf upload vishalpatil18/heron-phishing models/best_fusion_model.pth --repo-type=model
  hf upload vishalpatil18/heron-phishing data/vocab_text_1.json --repo-type=model
  ```
  (You're already authenticated to HF as `vishalpatil18`.)

**Test scenarios:**

- [ ] Happy path: POST the phishing sample → `verdict: phishing`, confidence > 0.5, non-empty signals.
- [ ] Legit sample → `verdict: legitimate`.
- [ ] Empty/paste text → 200 with a verdict (image tensor = zeros path), no crash.
- [ ] Bad upload (non-email binary) → 400 with a clear message, not a 500.

**Verification:** `uvicorn app.main:app --reload` from `backend/`, then `curl -F file=@samples/phishing_example.html localhost:8000/predict` returns phishing JSON. `pytest` green.

**Commit:** `feat(backend): FastAPI phishing inference service with html/eml/text input`

**Planning-time notes:** _(Deferred to implementation)_ exact model size may push cold RAM - fine on HF's 16 GB. Torch CPU wheel is large; pin CPU-only index in the Dockerfile (Task 3).

---

## Task 2 - Backend: containerize for HF Spaces

**Goal:** A Docker image that runs the FastAPI service and is ready to deploy, verified locally.

**Requirements trace:** R2, R3. **Depends on:** Task 1.

**Files:**

- `backend/Dockerfile` - python:3.11-slim, install CPU torch (`--index-url https://download.pytorch.org/whl/cpu`), copy app, expose `7860` (HF Spaces default port), `CMD uvicorn app.main:app --host 0.0.0.0 --port 7860`.
- `backend/.dockerignore`.
- `backend/README.md` - HF Space metadata header (`sdk: docker`, `app_port: 7860`) + the weights-upload commands from Task 1.

**Approach:** Model weights are **not** baked into the image (they're pulled from HF Hub at startup and cached). Keep the image lean.

**Test scenarios:**

- [ ] `docker build` succeeds.
- [ ] `docker run -p 7860:7860` → `/health` returns 200 and the model loads (watch logs for the HF download on first boot).
- [ ] `/predict` works against the container.

**Verification:** container serves a correct verdict on the phishing sample.

**Commit:** `feat(backend): Dockerfile for Hugging Face Spaces deploy`

---

## Task 3 - Deploy backend + model to HF Spaces 🚀 (deploy milestone)

**Goal:** Backend is live at a public HTTPS URL, model loading from the HF model repo.

**Requirements trace:** R3. **Depends on:** Task 2 + the one-time weights upload from Task 1.

**Approach:**

- Create Space `vishalpatil18/heron-api` (Docker SDK).
- Push `backend/` to the Space (git remote or `hf` CLI upload).
- Confirm the Space builds, the model downloads on first boot, and `/predict` returns correct verdicts.
- Record the live URL in `backend/README.md` and as `NEXT_PUBLIC_API_URL` for the frontend.

**Test scenarios:**

- [ ] Public `/health` → 200.
- [ ] Public `/predict` on both samples → correct verdicts.
- [ ] Cold start (after idle) recovers and serves.

**Verification:** `curl https://vishalpatil18-heron-api.hf.space/predict -F file=@backend/samples/phishing_example.html` → phishing JSON.

**Commit:** `chore(backend): deploy heron-api to Hugging Face Spaces` (config/URL notes only)

---

## Task 4 - Frontend: scaffold + design system

**Goal:** A Next.js app that boots, with the `DESIGN.md` tokens wired into Tailwind and DM Sans loaded - a styled empty shell.

**Requirements trace:** R1, R2. **Depends on:** none (can run in parallel with Task 1–3).

**Files:**

- `frontend/` - `create-next-app` (App Router, TS, Tailwind).
- `frontend/tailwind.config.ts` - colors/spacing/radius/typography from `DESIGN.md` as tokens (`ink`, `canvas`, `surface`, `hairline`, `brand-coral`, `brand-blue`, etc.; radius `full`/`hero`(32px)/`xl`(16px); the DM Sans type scale).
- `frontend/app/layout.tsx` - DM Sans via `next/font`, base canvas background, `<title>`/OG defaults for Heron.
- `frontend/app/globals.css` - CSS var bridge for the tokens.
- `frontend/lib/api.ts` - `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`, prod = the HF Space URL), typed `predict()` client.
- `frontend/components/ui/` - `Button` (primary black pill / secondary outline / tertiary), `Card`, `Badge` (success/new/beta), matching `DESIGN.md` component specs.

**Test scenarios:**

- [ ] `npm run build` passes.
- [ ] `npm run dev` renders a page using the `Button`/`Card`/`Badge` primitives with correct tokens.
- [ ] Type scale + colors visually match `DESIGN.md` on a scratch page.

**Verification:** dev server shows the styled primitives; build is clean.

**Commit:** `feat(frontend): Next.js scaffold with DESIGN.md design system`

**Planning-time notes:** design system is light-only by design; don't invent dark tokens (YAGNI).

---

## Task 5 - Frontend: app shell (nav, footer, logo)

**Goal:** Shared chrome across all pages - sticky top nav, dense black footer, Heron logo + wordmark + tagline.

**Requirements trace:** R2, R6. **Depends on:** Task 4.

**Files:**

- `frontend/components/HeronLogo.tsx` - inline SVG heron/checkmark mark + "Heron" wordmark (DM Sans 600).
- `frontend/components/Nav.tsx` - sticky white bar: logo left; links (Product, Benchmarks, Architecture, Research, Team); black-pill "Scan an email" CTA → `/dashboard`. Hamburger < 1024px.
- `frontend/components/Footer.tsx` - `footer-region` spec (black canvas), columns (Product / Research / Team), Heron wordmark + "Nothing swims past.", GitHub link. Includes the **Team / Hire-us** link (R7).
- `frontend/app/(marketing)/layout.tsx` - wraps marketing pages with Nav+Footer.

**Test scenarios:**

- [ ] Nav sticky, collapses to hamburger on mobile.
- [ ] Footer renders all columns; Team link present.
- [ ] Logo crisp at all sizes.

**Verification:** navigate between two placeholder pages; chrome persists and is responsive.

**Commit:** `feat(frontend): app shell with Heron logo, nav, and footer`

---

## Task 6 - Landing page (content + story)

**Goal:** The marketing page: hero (name + tagline + story), how-it-works, trust/stats, CTA - **static content, animation slot left empty for Task 7.**

**Requirements trace:** R1, R5, R6. **Depends on:** Task 5.

**Files:**

- `frontend/app/(marketing)/page.tsx` - hero band (`hero-display` 80px "Nothing swims past.", subtitle telling the AI-phishing story, dual CTA: "Scan an email" + "See the benchmarks"), a placeholder `<HeroScene/>` region beside the hero text, sections: **The problem** (AI made phishing cheaper/faster/convincing), **How Heron sees** (text + logo + metadata → fusion, 3 cards), **Stats strip** (99.45% accuracy, AUC 0.999, 76,346 emails, 352 brands), final CTA card (coral `promo-cta-card`).
- `frontend/app/(marketing)/sections/*.tsx` - one component per section.

**Test scenarios:**

- [ ] Hero typography matches `DESIGN.md` (80px → 56 → 40 → 32 across breakpoints).
- [ ] Stats strip reflows 4 → 2×2 → 1 column.
- [ ] All CTAs route correctly.

**Verification:** landing page reads top-to-bottom as a coherent story; responsive.

**Commit:** `feat(frontend): landing page with AI-phishing story and stats`

---

## Task 7 - Hero animation (mac mail → hack → hacker laughs)

**Goal:** The signature animated scene beside the hero text: a macOS Mail window where a mail opens, a spam link is clicked, the machine "gets hacked," and a hacker laughs - looping, self-contained.

**Requirements trace:** R4. **Depends on:** Task 6.

**Files:**

- `frontend/components/HeroScene.tsx` - Framer Motion timeline.
- `frontend/components/hero/*` - sub-scenes: `MacMailWindow`, `HackGlitch`, `HackerLaughing` (inline SVG art; no external Lottie/video).
- `package.json` - add `framer-motion`.

**Approach:** One fixed timeline, 4 beats, autoplay + loop:

1. **Beat 1 (0–2s):** mac window with traffic-light dots + a mail list; an unread "⚠ Your account is suspended" mail sits at top.
2. **Beat 2 (2–4s):** cursor moves, the mail opens, a red "Verify now" link highlights, cursor clicks it.
3. **Beat 3 (4–6s):** screen glitch/scanline + green terminal text overlay ("ACCESS GRANTED / downloading…"), a padlock breaks.
4. **Beat 4 (6–8s):** cut to a hooded hacker silhouette at dual laptops, "ha ha ha" text/laugh shake; then a Heron overlay wipes in - "Heron would've caught this." → loop.

- Respect `prefers-reduced-motion`: render the final framed still instead of animating.

**Test scenarios:**

- [ ] Loops smoothly, no layout shift (reserve the box).
- [ ] `prefers-reduced-motion` → static frame.
- [ ] 60fps-ish on a mid laptop; no jank on mobile (scale down / simplify).

**Verification:** the scene plays the 4 beats and loops; reduced-motion honored.

**Commit:** `feat(frontend): animated hero scene - phishing hack story`

**Planning-time notes:** _(Deferred)_ if hand-built SVG art gets heavy, a single optimized Lottie JSON is an acceptable fallback - decide at build time.

---

## Task 8 - Dashboard (scan an email) ⭐ core feature

**Goal:** The working product: user provides an email (drag-drop `.html`/`.eml`, paste text, or one-click sample) → loader states → results (verdict, confidence gauge, detected signals). Calls the **live backend**.

**Requirements trace:** R1. **Depends on:** Task 3 (live backend) + Task 5.

**Files:**

- `frontend/app/dashboard/page.tsx` - the scan UI.
- `frontend/components/dashboard/UploadZone.tsx` - drag-drop + file picker (`.html`, `.eml`) + "paste text" tab + "Try a sample" (phishing / legit) buttons.
- `frontend/components/dashboard/ScanProgress.tsx` - staged loader ("Parsing email → Reading text → Inspecting logos → Fusing signals") with a skeleton, driven while the request is in flight.
- `frontend/components/dashboard/ResultCard.tsx` - verdict badge (phishing = coral, legit = green), animated confidence gauge/ring, `signals[]` list with severity chips, `meta` line.
- `frontend/components/dashboard/EmptyState.tsx` + error state.
- extends `frontend/lib/api.ts` `predict()`.

**Approach:** loader stages are cosmetic/timed (the backend call is a single request); reveal the result when the promise resolves. Handle: in-flight (disable inputs), error (backend down / 400 → friendly message + retry), empty (initial). Dashboard has its **own minimal footer** with the **Team / Hire-us** link (R7).

**Test scenarios:**

- [ ] Sample phishing → phishing verdict + signals render.
- [ ] Paste legit text → legitimate verdict.
- [ ] Backend down → error state with retry, no white screen.
- [ ] Double-submit / navigate-away mid-request → no stuck spinner (abort/guard).
- [ ] Mobile: upload zone + result usable at 375px.

**Verification:** end-to-end against the deployed HF backend, all three input modes work.

**Commit:** `feat(frontend): dashboard email scanner with live inference`

---

## Task 9 - Architecture page (diagram refactor)

**Goal:** Replace the ASCII architecture diagram with a clean, responsive visual, on its own page.

**Requirements trace:** R8. **Depends on:** Task 5.

**Files:**

- `frontend/app/(marketing)/architecture/page.tsx`.
- `frontend/components/ArchitectureDiagram.tsx` - SVG (or Mermaid rendered to inline SVG) of: Email input → 3 towers (Text CNN 256-d / Image CNN 512-d / Metadata MLP 20→64) → Concat 832-d → Fusion classifier (512→256→128→2) → verdict. Include the training-strategy note (specialists → freeze+fuse → fine-tune).

**Approach:** style the diagram in the design system (hairline borders, `card-base`, coral/blue accents per tower). Must scroll horizontally inside its own container on small screens, not break the page.

**Test scenarios:**

- [ ] Diagram legible desktop → mobile (horizontal scroll container).
- [ ] Numbers match `src/fusion_models.py` (256/512/64/832/2).

**Verification:** page renders the refactored diagram accurately.

**Commit:** `feat(frontend): architecture page with refactored diagram`

---

## Task 10 - Benchmarks page

**Goal:** Present the model's results credibly: model-comparison table + fusion metrics, with simple charts.

**Requirements trace:** R9. **Depends on:** Task 5.

**Files:**

- `frontend/app/(marketing)/benchmarks/page.tsx`.
- `frontend/components/benchmarks/ModelTable.tsx` - the comparison table (KNN 81.71%, LogReg 80.00%, Text CNN 98.96%, Image CNN 76.30%, ResNet18 97.43%, **Fusion 99.45%** highlighted) using `data-table` spec.
- `frontend/components/benchmarks/MetricBars.tsx` - bars for Accuracy / AUC 0.999 / Precision 99.5% / Recall 99.4% / F1 99.4% (pure CSS/SVG bars - no chart lib unless one's already added).
- `frontend/lib/benchmarks.ts` - the numbers as typed data (single source, from README/`Project_Report.pdf`).

**Test scenarios:**

- [ ] Table matches README exactly; Fusion row emphasized.
- [ ] Bars render and are labeled/accessible.
- [ ] Table scrolls horizontally on mobile.

**Verification:** benchmarks page matches the documented results.

**Commit:** `feat(frontend): benchmarks page with model comparison and metrics`

---

## Task 11 - Research page + Hire-the-developer (Team) page

**Goal:** (a) A research page presenting the paper we wrote; (b) a Team/"hire us" page focused on Vishal, mentioning the others; both linked from footer(s).

**Requirements trace:** R10, R7. **Depends on:** Task 5.

**Files:**

- `frontend/app/(marketing)/research/page.tsx` - formatted research page: title, abstract, key contributions, method summary, results, references - content transcribed from `docs/Project_Report.pdf`. Include a **"Download the paper (PDF)"** button; copy `docs/Project_Report.pdf` → `frontend/public/heron-research.pdf`.
- `frontend/app/(marketing)/team/page.tsx` - hero focused on **Vishal Patil** (bio, role, GitHub `github.com/VishalPatil18`, "hire me" CTA - leave a `mailto:`/link slot for Vishal to fill), then a team grid mentioning **Akash Vora**, **Srihari Narayan**, **Anila Sai Namburi** with their GitHub links (from README).
- ensure Footer (Task 5) + dashboard footer (Task 8) both link `/team`.

**Approach:** research page is static, typeset in `docs-prose-block` style (≤720px prose column). Team page uses `ai-product-tile`/avatar-circle patterns. **Content placeholders:** Vishal's bio/photo/contact and teammate roles are yours to supply - mark them with `{/* TODO: Vishal bio */}` so the page ships now and fills in later.

**Test scenarios:**

- [ ] Research page abstract/contributions/results match the PDF; PDF downloads.
- [ ] Team page leads with Vishal, lists all four with working GitHub links.
- [ ] Both footers link to `/team`.

**Verification:** research + team pages render; PDF served from `/heron-research.pdf`.

**Commit:** `feat(frontend): research paper page and team/hire-us page`

---

## Task 12 - Deploy frontend to Vercel + wire to backend 🚀 (deploy milestone)

**Goal:** The whole product is live: Vercel frontend talking to the HF backend, end-to-end.

**Requirements trace:** R3. **Depends on:** all frontend tasks + Task 3.

**Approach:**

- Set `NEXT_PUBLIC_API_URL` = the HF Space URL in Vercel project env.
- Confirm backend CORS allows the Vercel domain (already `*` from Task 1 - verify).
- Deploy; smoke-test every page + a live scan from the production frontend.
- Add production OG/meta + favicon (Heron mark) if not already; update root `README.md` with the two live URLs.

**Test scenarios:**

- [ ] All routes 200 in production (`/`, `/dashboard`, `/benchmarks`, `/architecture`, `/research`, `/team`).
- [ ] Live scan from the deployed frontend returns a verdict.
- [ ] Lighthouse: no console errors, reasonable mobile score.

**Verification:** public Vercel URL runs a full scan against the public HF backend.

**Commit:** `chore(frontend): deploy Heron to Vercel and wire to live backend`

---

## Optional Task 13 - Polish pass

**Goal:** Tighten before showing it off. Only if time allows.

**Depends on:** Task 12.

- Loading skeletons everywhere data appears; consistent empty/error states.
- Full responsive audit (375 / 768 / 1280).
- SEO/OG per page, sitemap, favicon set, 404 page in the design system.
- `prefers-reduced-motion` audit across all animations.
- Accessibility: focus states, alt text, keyboard nav on upload zone, color-contrast check on coral/green badges.

**Commit:** `polish: responsive, a11y, loading states, and SEO`

---

## Sequencing summary (DAG)

```
Task 1 (backend) ─► Task 2 (docker) ─► Task 3 (deploy backend 🚀)
                                              │
Task 4 (scaffold) ─► Task 5 (shell) ─┬─► Task 6 ─► Task 7 (hero anim)
                                     ├─► Task 8 (dashboard ⭐, needs Task 3)
                                     ├─► Task 9 (architecture)
                                     ├─► Task 10 (benchmarks)
                                     └─► Task 11 (research + team)
                                              │
                                     Task 12 (deploy frontend 🚀) ─► Task 13 (polish)
```

Tasks 1–3 (backend) and Task 4–5 (frontend base) are independent - start whichever you like first. Task 8 is the only frontend task that hard-requires the live backend (Task 3).

## Outstanding content you supply (non-blocking - pages ship with placeholders)

- Vishal's bio, photo, and contact/"hire me" link for `/team`.
- Optional short roles/blurbs for Akash, Srihari, Anila.
- Confirm the HF model-repo name (`vishalpatil18/heron-phishing`) before Task 1's weights upload.
