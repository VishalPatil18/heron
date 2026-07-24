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
- `backend/app/weights.py` - `resolve_weights()` (`HERON_WEIGHTS_DIR` env or HF Hub `vishalpatil18/heron-phishing`) + `get_model()` load-once singleton.
- `backend/app/main.py` - `GET /health`, `POST /predict` (multipart `file` OR JSON `{text, subject}`), CORS `*`.
- Samples in `backend/samples/`, tests in `backend/tests/test_predict.py`.

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

**Deploy targets (free tier only):** backend → HF Spaces (Docker, port 7860); frontend → Vercel. Weights pulled from HF model repo at startup.

---

## Key Decisions

- **Monorepo `backend/` + `frontend/`; existing ML code untouched.** Backend is a self-contained deployable.
- **Backend copies the model (not imports it) from `inference/`.** Docker copies only `app/`; importing a sibling dir would break the image. Copy is hand-synced - if the trained architecture changes, update both (ceiling noted in `model.py`).
- **Dropped remote `http` image fetch** from the original `parse_html_email`. Fetching arbitrary URLs from user uploads on a public endpoint is an SSRF risk; only inline `data:image` is decoded. Zero images → zeros tensor (model already handles it).
- **`torch.load(..., weights_only=True)`.** Checkpoint is a plain state_dict; blocks arbitrary-code execution when unpickling HF-pulled weights.
- **Tests stub the model.** Real weights are Git LFS objects; a fixed-logits stub validates the parse→preprocess→signal→response wiring in any environment. Real-verdict checks are the manual curl step in `backend/README.md`.
- **Signals reuse the script's `predict_phishing` thresholds**, converted from printed "Detected Issues" into a structured `signals[]` array.
- **CORS `*`** - public demo API; lock to the Vercel domain if it ever serves more than the open scanner.
- **Zero-cost:** HF Spaces free CPU + Vercel free tier (per CLAUDE.md §6).

---

## Session History

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

- [ ] One-time HF weights upload (`best_fusion_model.pth`, `vocab_text_1.json`) to `vishalpatil18/heron-phishing` - blocks deployed backend serving.
- [ ] Confirm HF model-repo name `vishalpatil18/heron-phishing` before the upload.
