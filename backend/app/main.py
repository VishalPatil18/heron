"""Heron phishing-detection API: GET /health, POST /predict."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import UploadFile

from app.emails import parse_text, parse_upload
from app.model import run_prediction
from app.weights import get_model

app = FastAPI(title="Heron API", description="Multimodal phishing detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness check; the model itself loads lazily on the first /predict."""
    return {"status": "ok"}


async def _parse_request(request: Request):
    """Turn a multipart file upload or JSON body into a parsed email dict."""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")
        if not isinstance(upload, UploadFile):
            raise HTTPException(status_code=400, detail="Missing form field 'file'")
        return parse_upload(upload.filename, await upload.read())

    if "application/json" in content_type:
        data = await request.json()
        return parse_text(data.get("subject", ""), data.get("text", ""))

    raise HTTPException(
        status_code=400,
        detail="Send multipart/form-data with a 'file' field, or JSON {text, subject}",
    )


@app.post("/predict")
async def predict(request: Request):
    """Classify an email (html/eml upload or pasted text) as phishing or legitimate."""
    try:
        parsed = await _parse_request(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    model, stoi = get_model()
    return run_prediction(model, stoi, parsed)
