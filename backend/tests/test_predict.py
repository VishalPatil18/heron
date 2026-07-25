"""API + signal tests.

The trained weights are Git LFS objects and not needed here: a stub model with
fixed logits exercises the full parse → preprocess → response wiring, so pytest
stays green without `git lfs pull`. Real-verdict checks are the manual curl step
in backend/README.md.
"""

from pathlib import Path

import pytest
import torch
from fastapi.testclient import TestClient

import app.main as main
from app.model import build_signals, extract_metadata

SAMPLES = Path(__file__).parent.parent / "samples"
WEIGHTS_DIR = Path(__file__).parent.parent / "weights"
STOI = {"<unk>": 1, "account": 2, "verify": 3, "newsletter": 4}

client = TestClient(main.app)


class StubModel:
    """Fixed-logits stand-in for the fusion model; predicts a chosen class."""

    def __init__(self, pred_class):
        # Strong logit toward pred_class so softmax gives a confident probability.
        self._logits = torch.tensor([[2.0, -2.0]]) if pred_class == 0 else torch.tensor([[-2.0, 2.0]])

    def eval(self):
        return self

    def __call__(self, images, texts, metadata):
        return self._logits


def _use_stub(monkeypatch, pred_class):
    monkeypatch.setattr(main, "get_model", lambda: (StubModel(pred_class), STOI))


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_phishing_sample_returns_phishing_with_signals(monkeypatch):
    _use_stub(monkeypatch, pred_class=1)
    raw = (SAMPLES / "phishing_example.html").read_bytes()

    response = client.post("/predict", files={"file": ("phishing_example.html", raw, "text/html")})

    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "phishing"
    assert 0.5 < body["confidence"] <= 1.0
    codes = {s["code"] for s in body["signals"]}
    assert {"shortened_url", "suspicious_domain"} <= codes
    assert body["meta"]["body_chars"] > 0


def test_legit_text_json_returns_legitimate(monkeypatch):
    _use_stub(monkeypatch, pred_class=0)

    response = client.post("/predict", json={"text": "Thanks for subscribing to our monthly newsletter."})

    assert response.status_code == 200
    assert response.json()["verdict"] == "legitimate"


def test_empty_text_still_returns_verdict(monkeypatch):
    _use_stub(monkeypatch, pred_class=0)

    response = client.post("/predict", json={"text": ""})

    assert response.status_code == 200
    assert response.json()["verdict"] in {"phishing", "legitimate"}
    assert response.json()["meta"]["images_found"] == 0


def test_binary_upload_is_rejected_with_400(monkeypatch):
    _use_stub(monkeypatch, pred_class=1)
    binary = bytes([0xFF, 0xFE, 0x00, 0x01, 0x02, 0x03])

    response = client.post("/predict", files={"file": ("evil.html", binary, "application/octet-stream")})

    assert response.status_code == 400


def test_unsupported_extension_is_rejected_with_400(monkeypatch):
    _use_stub(monkeypatch, pred_class=1)

    response = client.post("/predict", files={"file": ("photo.png", b"\x89PNG\r\n", "image/png")})

    assert response.status_code == 400


def test_missing_file_field_is_rejected_with_400(monkeypatch):
    _use_stub(monkeypatch, pred_class=1)

    response = client.post("/predict", files={"notfile": ("x.html", b"<p>hi</p>", "text/html")})

    assert response.status_code == 400


def test_signals_match_script_thresholds():
    """Phishing sample text trips the URL/urgency signals; clean text trips none."""
    phishing_meta = extract_metadata("Account suspended", "urgent suspended locked expires http://bit.ly/x http://verify-account.com")
    phishing_codes = {s["code"] for s in build_signals(phishing_meta.tolist())}
    assert "shortened_url" in phishing_codes
    assert "suspicious_domain" in phishing_codes

    clean_meta = extract_metadata("Monthly newsletter", "Here are this month's reading recommendations.")
    assert build_signals(clean_meta.tolist()) == []


def test_resolve_weights_uses_local_dir(monkeypatch):
    """HERON_WEIGHTS_DIR drives weight resolution to local disk (the bake relies on this)."""
    monkeypatch.setenv("HERON_WEIGHTS_DIR", "/tmp/heron-weights")
    from app.weights import resolve_weights
    weights_path, vocab_path = resolve_weights()
    assert weights_path == "/tmp/heron-weights/best_fusion_model.pth"
    assert vocab_path == "/tmp/heron-weights/vocab_text_1.json"


@pytest.mark.skipif(
    not (WEIGHTS_DIR / "best_fusion_model.pth").exists(),
    reason="real weights not staged in backend/weights/ (run the prep step first)",
)
def test_real_staged_weights_load_and_predict():
    """The real staged weights load off local disk and predict — the crux of the bake."""
    from app.model import build_model, run_prediction
    from app.emails import parse_html

    model, stoi = build_model(
        str(WEIGHTS_DIR / "best_fusion_model.pth"),
        str(WEIGHTS_DIR / "vocab_text_1.json"),
    )
    parsed = parse_html((SAMPLES / "phishing_example.html").read_text())
    result = run_prediction(model, stoi, parsed)
    assert result["verdict"] == "phishing"
    assert result["confidence"] > 0.5
