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

**Frontend:** not started. Planned: Next.js App Router + TS + Tailwind → Vercel.

**Existing ML code (do not modify):** `src/`, `inference/`, `notebooks/`, `models/`, `data/`.

**Build / run / test (backend):**

```bash
cd backend
pip install -r requirements.txt
export HERON_WEIGHTS_DIR=.weights            # dir with best_fusion_model.pth + vocab_text_1.json (git lfs pull first)
uvicorn app.main:app --reload                # http://localhost:8000
pytest                                        # 8 tests, stubbed model - no real weights needed
```

**Deploy targets (free tier only):** backend → **Google Cloud Run** (Docker, scale-to-zero, `--max-instances 1`); frontend → Vercel. Weights pulled from the free HF model repo at startup. `NEXT_PUBLIC_API_URL` = `https://heron-api-5b5e3oikja-uc.a.run.app` (the live Cloud Run service).

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

- [ ] Install prereqs on the dev machine: `git-lfs`, `hf` CLI, `gcloud` CLI (+ a GCP project with billing enabled).
- [x] One-time weights upload to the **free** HF model repo `vishalpatil-18/heron-phishing` (`git lfs pull` → `hf repos create --type model` → `hf upload … --type model`) — blocks the deployed backend serving.
- [ ] Deploy backend to Cloud Run: `gcloud run deploy heron-api --source . --region us-central1 --allow-unauthenticated --memory 2Gi --max-instances 1 --timeout 300`; confirm `/health` + `/predict`.
- [ ] Capture the Cloud Run URL → set as `NEXT_PUBLIC_API_URL` (Task 4/12); update root `README.md` live URL (Task 12).
- [ ] (Optional) verify the image locally with Docker before deploy — not required (Cloud Build builds from source).
