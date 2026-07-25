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
- Containerized: `backend/Dockerfile` + `.dockerignore` (honors `$PORT`, default 8080); CPU torch, weights pulled at startup from the free HF model repo (not baked in). Deploys to **Google Cloud Run** via `gcloud run deploy --source` (Cloud Build — no local Docker needed).

**Frontend:** scaffolded in `frontend/` — Next.js 16.2 (App Router, Turbopack) + React 19 + TypeScript + **Tailwind v4** (CSS-first `@theme`, no `tailwind.config`). DESIGN.md tokens live in `frontend/app/globals.css @theme`; DM Sans via `next/font`; light-mode only. Primitives in `frontend/components/ui/` (`Button`, `Card`, `Badge`); typed API client in `frontend/lib/api.ts`. `create-next-app` also dropped `frontend/CLAUDE.md`+`AGENTS.md` (Next-16 "read node_modules/next/dist/docs before coding" guidance — kept). **App shell:** `HeronLogo`/`Nav`/`Footer` in `frontend/components/`, wired via `frontend/app/(marketing)/layout.tsx` (sticky nav → hamburger < `lg`, black footer). Marketing routes `/`, `/benchmarks`, `/architecture`, `/research`, `/team` + `/dashboard` are placeholder stubs (Tasks 6–11 fill them); the design-system demo moved to `/styleguide`. Deploy target: Vercel (Task 12).

**Existing ML code (do not modify):** `src/`, `inference/`, `notebooks/`, `models/`, `data/`.

**Build / run / test (backend):**

```bash
cd backend
pip install -r requirements.txt
export HERON_WEIGHTS_DIR=.weights            # dir with best_fusion_model.pth + vocab_text_1.json (git lfs pull first)
uvicorn app.main:app --reload                # http://localhost:8000
pytest                                        # 8 tests, stubbed model - no real weights needed
```

**Deploy targets (free tier only):** backend → **Google Cloud Run** (Docker, scale-to-zero, `--max-instances 1`); frontend → Vercel. Weights pulled from the free HF model repo at startup. `NEXT_PUBLIC_API_URL` = `https://heron-api-787333291568.us-central1.run.app` (the **live** Cloud Run service — verified serving correct verdicts).

---

## Key Decisions

- **Monorepo `backend/` + `frontend/`; existing ML code untouched.** Backend is a self-contained deployable.
- **Backend copies the model (not imports it) from `inference/`.** Docker copies only `app/`; importing a sibling dir would break the image. Copy is hand-synced - if the trained architecture changes, update both (ceiling noted in `model.py`).
- **Dropped remote `http` image fetch** from the original `parse_html_email`. Fetching arbitrary URLs from user uploads on a public endpoint is an SSRF risk; only inline `data:image` is decoded. Zero images → zeros tensor (model already handles it).
- **`torch.load(..., weights_only=True)`.** Checkpoint is a plain state_dict; blocks arbitrary-code execution when unpickling HF-pulled weights.
- **Tests stub the model.** Real weights are Git LFS objects; a fixed-logits stub validates the parse→preprocess→signal→response wiring in any environment. Real-verdict checks are the manual curl step in `backend/README.md`.
- **Signals reuse the script's `predict_phishing` thresholds**, converted from printed "Detected Issues" into a structured `signals[]` array.
- **CORS `*`** - public demo API; lock to the Vercel domain if it ever serves more than the open scanner.
- **Backend host: Google Cloud Run, not HF Spaces.** HF now requires a paid **PRO** plan to host Docker/Gradio Spaces even on `cpu-basic` (only static Spaces are free) — hit as a `402 Payment Required` at deploy. Cloud Run keeps the FastAPI + Docker backend, scales to zero, and stays $0 under the free tier (`--max-instances 1` bounds cost). The weights **model repo** stays on HF (model storage is free; only Space compute costs).
- **Zero-cost (per CLAUDE.md §6):** Cloud Run free tier + Vercel free tier + free HF model-repo storage.

---

## Session History

### Logo redesign — heron in flight

**What was done:** Replaced the weak checkmark logo with a heron-in-flight mark — arched wings, head between them, legs trailing (concept "F1 / Arched", chosen from rendered concept sets). Added a theme-adaptive SVG favicon.
**Files touched:**
- `frontend/components/HeronLogo.tsx` (update) — F1 arched-wings mark (viewBox 48, `currentColor` so it's ink on nav / white on footer).
- `frontend/app/icon.svg` (create) — favicon, `prefers-color-scheme`-adaptive (black on light tabs, white on dark). Removed the default `app/favicon.ico`.
**Decisions:** User picked from a 6-concept exploration → then 5 flight variations → "F1 Arched". Build clean, verified in the nav.
**Open questions / follow-ups:** none.

### Task 5 — Frontend app shell (logo, nav, footer)

**What was done:** Built the shared chrome — Heron logo (SVG mark = checkmark/heron head + wordmark), sticky white nav (desktop links + black-pill CTA, hamburger drawer < `lg`), and dense black footer (columns + tagline + GitHub) — wrapped around marketing pages via an `app/(marketing)/layout.tsx` route group. `npm run build` passes (8 routes); verified desktop nav + footer and the mobile hamburger→drawer in the browser.
**Files touched:**
- `frontend/components/HeronLogo.tsx` (create) — inline SVG, `currentColor` so parent sets color (ink on nav, white on footer); `size`/`showWordmark` props.
- `frontend/components/Nav.tsx` (create) — `'use client'`; sticky `hairline-soft` bar, links, hamburger `useState`; CTA is a `<Link>` styled as the primary pill (a `<button>` inside `<a>` is invalid HTML — minor class duplication of `button-primary`, noted).
- `frontend/components/Footer.tsx` (create) — `footer-region`, columns Product/Research/Team (incl. Team/hire-us R7), GitHub link.
- `frontend/app/(marketing)/layout.tsx` (create) — `min-h-screen` flex wrapper: `<Nav/>` + `<main>` + `<Footer/>`.
- `frontend/app/(marketing)/{page,benchmarks,architecture,research,team}/…page.tsx` (create) — landing + 4 stub pages so nav links resolve.
- `frontend/app/dashboard/page.tsx` (create) — CTA-target stub (kept out of `(marketing)`; gets its own chrome in Task 8).
- `frontend/app/styleguide/page.tsx` (create) + removed `frontend/app/page.tsx` — moved the Task 4 design demo out of `/` so the `(marketing)` group owns it.
- `context.md` (update) — Current State + this entry.
**Decisions:** Route group `(marketing)` owns `/` → the Task-4 scratch page had to move (to `/styleguide`, kept as a dev reference). Stub pages created for every nav destination so the shell is navigable now (Tasks 6/9/10/11 replace). CTA rendered as a styled `<Link>`, not `<Button>`, for valid/accessible nav markup.
**Open questions / follow-ups:** Hero placeholder shows 80px unscaled on mobile — responsive hero scaling is Task 6's job. `/dashboard` + the 4 marketing stubs are placeholders.

### Task 4 — Frontend scaffold + DESIGN.md design system

**What was done:** Scaffolded the Next.js frontend (`create-next-app`: Next 16.2, React 19, TS, Tailwind v4, App Router) and wired the DESIGN.md token system. `npm run build` passes; dev-server screenshot + DOM confirm the primitives render (DM Sans, 80px hero, coral pill badge, black pill buttons, 16px/32px cards). Backend also re-verified live + HF-free (`hf_hub_download` log lines: 0).
**Files touched:**
- `frontend/` (create) — `create-next-app` scaffold (Next 16.2 / React 19 / Tailwind v4 CSS-first).
- `frontend/app/globals.css` (update) — `@theme` with DESIGN.md colors, radius (`xl`16/`hero`32/…), and DM Sans type scale (`text-hero-display`, `text-display-lg`, … as Tailwind v4 `--text-*` utilities); light-only; body = canvas/ink.
- `frontend/app/layout.tsx` (update) — DM Sans via `next/font/google`, Heron `<title>`/OG metadata.
- `frontend/lib/api.ts` (create) — typed `predict()` + `PredictResponse`/`Signal`/`Verdict`; `NEXT_PUBLIC_API_URL` (dev `http://localhost:8000`, prod the Cloud Run URL).
- `frontend/components/ui/{Button,Card,Badge}.tsx` (create) — primitives per DESIGN.md (pill buttons w/ `:active` pressed, no-hover policy; card-base vs coral hero; success/new/beta badges).
- `frontend/app/page.tsx` (update) — scratch page exercising all primitives + the type scale.
- `.claude/launch.json` (create) — `heron-frontend` dev-server config (port 3000).
- `context.md` (update) — Current State + this entry.
**Decisions:** Tailwind **v4** (create-next-app default) → tokens in `globals.css @theme`, not the plan's `tailwind.config.ts`. Spacing uses Tailwind's numeric scale (already equals DESIGN.md px: p-6=24, p-8=32). `NEXT_PUBLIC_API_URL` prod = the live Cloud Run URL (plan's HF Space is dead). Heeded `frontend/AGENTS.md` (Next 16 breaking changes) — read `node_modules/next/dist/docs` for `next/font` + CSS conventions before coding.
**Open questions / follow-ups:** Real pages (nav/footer/landing/dashboard) are Tasks 5–11; `predict()` is defined but not yet called (Task 8). `frontend/node_modules` is npm-ignored via the scaffold's own `.gitignore`.

**What was done:** Removed the runtime Hugging Face dependency and the ~136 MB cold-start download by baking the weights into the Cloud Run image. Weights are staged into a gitignored `backend/weights/` folder and `COPY`ed in; `HERON_WEIGHTS_DIR=/app/weights` makes `weights.py` load them off local disk. Spec: `docs/superpowers/specs/2026-07-24-bake-model-weights-into-image-design.md`; plan: `docs/superpowers/plans/2026-07-24-bake-model-weights-into-image.md`. 10 pytest green (incl. a real-staged-weights integration test that loads the 136 MB model and predicts `phishing`).
**Files touched:**
- `backend/Dockerfile` (update) — `COPY weights ./weights` + `ENV HERON_WEIGHTS_DIR=/app/weights`; dropped the stale "weights not baked" comment.
- `backend/.gcloudignore` (create) — keeps `weights/` in the Cloud Build upload; its presence stops the `.gitignore` fallback from stripping it.
- `.gitignore` (update) — ignore `backend/weights/`.
- `backend/.dockerignore` (update) — drop the stale `.weights/` line.
- `backend/tests/test_predict.py` (update) — `resolve_weights` contract test + real-staged-weights integration test (skips if unstaged).
- `backend/README.md` (update) — staged `weights/` prep step, HF-free deploy flow; the HF upload section is now "optional/published-artifact + fallback".
- `context.md` (update) — this entry.
**Decisions:** Bake from local files (fully HF-free) over build-time `hf download` (keeps a build-time HF dep + touches the ClamAV-flagged vocab) and over a GCS bucket (weights are stable → no need to decouple). `weights.py` unchanged — the existing `HERON_WEIGHTS_DIR` path is the loader; HF stays as a fallback + published artifact. Key gotcha handled: `gcloud run deploy --source` falls back to `.gitignore` (which ignores `weights/`) unless a `.gcloudignore` exists.
**Open questions / follow-ups:** Prep step is manual before each deploy (documented in `backend/README.md`). Deploy + live "no `hf_hub_download`" verification is Task 4 of the plan (user-run). Cold start still pays image-pull + torch import + disk load (~5–10 s).

### Task 3 — Backend LIVE on Google Cloud Run

**What was done:** Deployed the FastAPI backend to Cloud Run and verified it end-to-end. Live at `https://heron-api-787333291568.us-central1.run.app`. `/predict` returns correct real verdicts — phishing sample → `phishing` (1.0) with 5 signals; legit sample → `legitimate` (0.9916); pasted urgent+bit.ly text → `phishing` (0.9999). Fixed a namespace bug + several deploy blockers along the way.
**Files touched:**
- `backend/app/weights.py` (update) — `HF_REPO_ID` corrected to `vishalpatil-18/heron-phishing` (the real HF namespace has a hyphen; the old `vishalpatil18` 404'd → `/predict` 500) and made overridable via `HERON_HF_REPO` env.
- `backend/README.md`, `README.md`, `context.md` (update) — namespace `vishalpatil18` → `vishalpatil-18`; recorded the live URL.
**Decisions / gotchas (for future deploys):**
- HF namespace is **`vishalpatil-18`** (hyphen), not `vishalpatil18`.
- Cloud Run "deploy from source" needs the Compute Engine default SA (`<projectnum>-compute@developer.gserviceaccount.com`) granted `roles/cloudbuild.builds.builder`; new projects don't, giving a `403 storage.objects.get` on the source bucket.
- HF weights upload needs a **Write**-scoped token (`hf auth login`) under the correct namespace.
- Cloud Run now issues **project-number URLs** (`heron-api-<projectnum>.<region>.run.app`), not the old random-hash form — the URL changed between the first and second deploy.
- Cold start re-downloads the 136 MB weights (scale-to-zero), so the first `/predict` after idle can time out; the warm instance serves normally.
**Open questions / follow-ups:** none for the backend. Frontend (Task 4+) consumes `NEXT_PUBLIC_API_URL`.

### Retarget backend deploy: HF Spaces → Google Cloud Run

**What was done:** HF Docker Spaces turned out to require a paid PRO plan (`402` at `hf repos create … --sdk docker`), breaking the zero-cost plan. Repointed the backend deploy to **Google Cloud Run** (free tier, scale-to-zero). No app-code changes — only the container port and the deploy docs. Weights still pulled from the free HF model repo. User runs the deploy (installs + accounts on their machine).
**Files touched:**
- `backend/Dockerfile` (update) — CMD now honors Cloud Run's `$PORT` (`sh -c "exec uvicorn … --port ${PORT:-8080}"`); `EXPOSE 8080`; dropped hardcoded HF `7860`.
- `backend/README.md` (update) — removed HF Space YAML header + HF deploy section; added a **Google Cloud Run** runbook (`gcloud run deploy --source`, `--memory 2Gi`, `--max-instances 1`, capture URL); fixed the weights-upload to new `hf` CLI flags (`--type model` + `hf repos create`); local docker port 7860→8080.
- `context.md` (update) — Key Decisions (host pivot + why), Current State deploy target, this entry, TODOs.
**Decisions:** Cloud Run over HF PRO (zero-cost), over Render/Fly (torch RAM > their 256–512 MB free), over browser-inference (keeps FastAPI/R2). Deploy from source via Cloud Build → no local Docker. `--max-instances 1` + scale-to-zero bounds cost to $0 idle. Weights runtime-pulled (not baked) — cold starts re-download ~137 MB into tmpfs; `--memory 2Gi` covers it.
**Open questions / follow-ups:** Cloud Run URL has a random hash → `NEXT_PUBLIC_API_URL` filled after deploy. Prereqs still pending on the user's machine: `git-lfs`, `hf` CLI, `gcloud` CLI (+ GCP project with billing). Docker still not installed locally, but Cloud Build removes that need.

### Backend containerized for Hugging Face Spaces (Docker)

**What was done:** Added the Docker image for the FastAPI backend targeting HF Spaces (Docker SDK, port 7860) — CPU-only torch, weights pulled at startup (not baked in). Verified the served app still imports (8 pytest green) and `COPY` paths exist; local `docker build`/`run` **not** executed (no Docker daemon in this dev environment).
**Files touched:**
- `backend/Dockerfile` (create) — `python:3.11-slim`; installs `torch torchvision` from the PyTorch **cpu** index *before* `-r requirements.txt` so the unpinned torch never resolves to the ~2 GB CUDA wheel; `COPY app` + `COPY samples`; `EXPOSE 7860`; `CMD uvicorn app.main:app --host 0.0.0.0 --port 7860`.
- `backend/.dockerignore` (create) — excludes `__pycache__/`, `.pytest_cache/`, venvs, `.weights/`, `tests/`, `*.md`.
- `backend/README.md` (update) — HF Space YAML header (`sdk: docker`, `app_port: 7860`) + "Deploy (Docker / HF Spaces)" section with local build/run verify commands.
**Decisions:** CPU torch installed via `--index-url https://download.pytorch.org/whl/cpu` first → keeps the image lean and off CUDA. Runs as **root** (HF Docker Spaces permit it); add a non-root `USER` only if HF flags permissions at deploy. Weights **not** baked in — pulled from `vishalpatil18/heron-phishing` at startup and cached.
**Open questions / follow-ups:** Local `docker build`/`run` unverified in this env — run the commands in `backend/README.md` before Task 3. Free-tier HF cache is ephemeral → cold start re-downloads weights.

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
- [x] One-time weights upload to the **free** HF model repo `vishalpatil-18/heron-phishing` (`git lfs pull` → `hf repos create --type model` → `hf upload … --type model`) — blocks the deployed backend serving.
- [x] Deploy backend to Cloud Run — **live** at `https://heron-api-787333291568.us-central1.run.app`; `/health` + `/predict` verified.
- [ ] Wire `NEXT_PUBLIC_API_URL` = `https://heron-api-787333291568.us-central1.run.app` into the frontend (Task 4/12); update root `README.md` live URL (Task 12).
- [ ] (Optional) verify the image locally with Docker before deploy — not required (Cloud Build builds from source).
