---
title: Heron API
emoji: 🐦
colorFrom: gray
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

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

Publish the real LFS weights to the HF model repo (you're already authenticated
to HF as `vishalpatil18`):

```bash
git lfs pull                                   # download the real .pth locally
hf upload vishalpatil18/heron-phishing models/best_fusion_model.pth --repo-type=model
hf upload vishalpatil18/heron-phishing data/vocab_text_1.json --repo-type=model
```

## Deploy (Docker / Hugging Face Spaces)

The service ships as a Docker image (HF Spaces Docker SDK). Weights are **not**
baked into the image — they're pulled from `vishalpatil18/heron-phishing` on first
boot and cached, so run the one-time weights bootstrap above before deploying.

Verify the image locally:

```bash
cd backend
docker build -t heron-api .
docker run --rm -p 7860:7860 heron-api        # watch logs for the HF weight download on first boot
```

```bash
curl localhost:7860/health
curl -F file=@samples/phishing_example.html localhost:7860/predict
```

The Space metadata (`sdk: docker`, `app_port: 7860`) is declared in the YAML header
at the top of this file — HF reads it when `backend/` is pushed as the Space repo.
Deploying to the live Space is Task 3.

