# Heron API - phishing inference service

FastAPI service that turns an email (`.html` / `.eml` / pasted text) into
`{verdict, confidence, signals, meta}` using the existing dual-tower fusion model.

## Run locally

```bash
cd backend
pip install -r requirements.txt
```

Stage the weights into `backend/weights/` (the same folder the deploy bakes in),
then point the app at it:

```bash
# from the repo root - `git lfs pull` once to fetch the real .pth (not the LFS stubs)
mkdir -p backend/weights
cp models/best_fusion_model.pth data/vocab_text_1.json backend/weights/
```

```bash
cd backend
export HERON_WEIGHTS_DIR=weights
uvicorn app.main:app --reload
```

Without `HERON_WEIGHTS_DIR`, weights fall back to the HF model repo
`vishalpatil-18/heron-phishing` (downloaded + cached by `huggingface_hub`).

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

## Optional: publish weights to the HF model repo

The deployed backend uses weights **baked into the image** (see Deploy below), so
this is optional - it only keeps `vishalpatil-18/heron-phishing` as a published
artifact and the fallback used when `HERON_WEIGHTS_DIR` is unset. Requires `git-lfs`
and the `hf` CLI (`brew install git-lfs`; `curl -LsSf https://hf.co/cli/install.sh | bash -s`):

```bash
git lfs install && git lfs pull                # download the real .pth locally (not the pointer stubs)
hf auth login                                  # authenticate the CLI
hf repos create vishalpatil-18/heron-phishing --type model --exist-ok
hf upload vishalpatil-18/heron-phishing models/best_fusion_model.pth --type model
hf upload vishalpatil-18/heron-phishing data/vocab_text_1.json      --type model
```

## Optional: verify the Docker image locally

Not required for deploy (Cloud Run builds from source), but catches build issues
early. Stage the weights first (they're baked into the image):

```bash
# from the repo root
mkdir -p backend/weights && cp models/best_fusion_model.pth data/vocab_text_1.json backend/weights/
cd backend
docker build -t heron-api .
docker run --rm -p 8080:8080 heron-api
```

```bash
curl localhost:8080/health
curl -F file=@samples/phishing_example.html localhost:8080/predict
```

## Deploy to Google Cloud Run

Free tier, scales to zero. HF Docker Spaces now require a paid PRO plan, so the
backend runs on Cloud Run instead. The weights are **baked into the image** from
`backend/weights/` - no Hugging Face pull at build or runtime.

> **Live:** https://heron-api-787333291568.us-central1.run.app - `GET /health`, `POST /predict`.

**Prerequisites (one-time):** install the `gcloud` CLI, then a GCP project with
billing enabled and the required APIs on:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

**Stage the weights (required before every deploy)** - they get baked into the image:

```bash
# from the repo root
git lfs pull                                   # once, to fetch the real .pth
mkdir -p backend/weights
cp models/best_fusion_model.pth data/vocab_text_1.json backend/weights/
```

**Deploy from source** - Cloud Build builds the `Dockerfile` in the cloud, so no
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

- `--memory 2Gi` - torch + the model exceed the 512Mi default; the download cache
  lives in Cloud Run's in-memory filesystem, so size for it.
- `--max-instances 1` - bounds cost; with scale-to-zero (the default min of 0),
  idle cost is **$0**.
- `--allow-unauthenticated` - public demo endpoint. CORS is already `*`.

**Capture the URL** (it contains a random hash, e.g. `https://heron-api-abc123-uc.a.run.app`)
and use it as `NEXT_PUBLIC_API_URL` for the frontend:

```bash
gcloud run services describe heron-api --region us-central1 --format 'value(status.url)'
curl "$(gcloud run services describe heron-api --region us-central1 --format 'value(status.url)')/health"
```

> Cold starts no longer download weights (they're baked into the image); the first
> request after idle still pays image-pull + torch import + loading the model off
> disk (~5–10 s). Eliminating cold starts entirely needs paid `min-instances=1`.
