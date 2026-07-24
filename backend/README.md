# Heron API - phishing inference service

FastAPI service that turns an email (`.html` / `.eml` / pasted text) into
`{verdict, confidence, signals, meta}` using the existing dual-tower fusion model.

## Run locally

```bash
cd backend
pip install -r requirements.txt
```

Point the app at local weights (avoids the HF download during dev):

```bash
export HERON_WEIGHTS_DIR=../models          # must hold best_fusion_model.pth
# vocab_text_1.json lives in ../data - copy or symlink both into one dir, e.g.:
#   mkdir -p .weights && cp ../models/best_fusion_model.pth ../data/vocab_text_1.json .weights
# then: export HERON_WEIGHTS_DIR=.weights
uvicorn app.main:app --reload
```

> The `.pth` / vocab files are Git LFS objects. Run `git lfs pull` in the repo
> root first, or the loader gets a pointer stub instead of real weights.

Without `HERON_WEIGHTS_DIR`, weights are pulled from the HF model repo
`vishalpatil18/heron-phishing` and cached by `huggingface_hub`.

## Try it

```bash
curl -F file=@samples/phishing_example.html localhost:8000/predict
curl -F file=@samples/legit_example.html    localhost:8000/predict
curl -H "Content-Type: application/json" -d '{"text":"verify your account now"}' localhost:8000/predict
```

`POST /predict` accepts either `multipart/form-data` (field `file`, a `.html` /
`.eml` / `.txt` upload) or JSON `{ "text": "...", "subject": "..." }`. `GET /health`
returns `{"status":"ok"}`; the model loads lazily on the first `/predict`.

Response:

```json
{
  "verdict": "phishing",
  "confidence": 0.9873,
  "signals": [
    {
      "code": "shortened_url",
      "label": "Contains shortened URLs (bit.ly, tinyurl)",
      "severity": "high"
    }
  ],
  "meta": { "images_found": 0, "body_chars": 2847 }
}
```

## Tests

```bash
cd backend
pytest
```

Tests use a stubbed model, so they pass without real weights.

## One-time weights bootstrap (before the deployed backend can serve)

The backend pulls its weights at startup from the **free** HF model repo
`vishalpatil18/heron-phishing` (model storage is free — only Space *compute* costs
money). Publish the real LFS weights there once. Requires `git-lfs` and the `hf`
CLI installed (`brew install git-lfs`; `curl -LsSf https://hf.co/cli/install.sh | bash -s`):

```bash
git lfs install && git lfs pull                # download the real .pth locally (not the pointer stubs)
hf auth login                                  # authenticate the CLI
hf repos create vishalpatil18/heron-phishing --type model --exist-ok
hf upload vishalpatil18/heron-phishing models/best_fusion_model.pth --type model
hf upload vishalpatil18/heron-phishing data/vocab_text_1.json      --type model
```

## Optional: verify the Docker image locally

Not required for deploy (Cloud Run builds from source), but catches build/runtime
issues early. Weights are pulled from the HF model repo on first boot:

```bash
cd backend
docker build -t heron-api .
docker run --rm -p 8080:8080 heron-api        # watch logs for the HF weight download on first boot
```

```bash
curl localhost:8080/health
curl -F file=@samples/phishing_example.html localhost:8080/predict
```

## Deploy to Google Cloud Run

Free tier, scales to zero. HF Docker Spaces now require a paid PRO plan, so the
backend runs on Cloud Run instead; the weights still come from the free HF model
repo (bootstrap above).

**Prerequisites (one-time):** install the `gcloud` CLI, then a GCP project with
billing enabled and the required APIs on:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

**Deploy from source** — Cloud Build builds the `Dockerfile` in the cloud, so no
local Docker is needed:

```bash
cd backend
gcloud run deploy heron-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --max-instances 1 \
  --timeout 300
```

- `--memory 2Gi` — torch + the model exceed the 512Mi default; the download cache
  lives in Cloud Run's in-memory filesystem, so size for it.
- `--max-instances 1` — bounds cost; with scale-to-zero (the default min of 0),
  idle cost is **$0**.
- `--allow-unauthenticated` — public demo endpoint. CORS is already `*`.

**Capture the URL** (it contains a random hash, e.g. `https://heron-api-abc123-uc.a.run.app`)
and use it as `NEXT_PUBLIC_API_URL` for the frontend:

```bash
gcloud run services describe heron-api --region us-central1 --format 'value(status.url)'
curl "$(gcloud run services describe heron-api --region us-central1 --format 'value(status.url)')/health"
```

> Cold starts re-download the ~137 MB weights (scale-to-zero has no persistent
> cache) — a known trade-off of the free setup; `--timeout 300` gives the first
> request room. To trade cost for speed later, bake the weights into the image.

