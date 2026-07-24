"""Resolve model weights and hold the loaded model as a load-once singleton.

Local dev: set HERON_WEIGHTS_DIR to a folder holding best_fusion_model.pth and
vocab_text_1.json. Otherwise the files are pulled from the HF model repo and
cached by huggingface_hub.
"""

import os
from pathlib import Path

from app.model import build_model

HF_REPO_ID = "vishalpatil18/heron-phishing"
WEIGHTS_FILE = "best_fusion_model.pth"
VOCAB_FILE = "vocab_text_1.json"

_model = None
_stoi = None


def resolve_weights():
    """Return (weights_path, vocab_path) from HERON_WEIGHTS_DIR or the HF Hub."""
    local_dir = os.environ.get("HERON_WEIGHTS_DIR")
    if local_dir:
        base = Path(local_dir)
        return str(base / WEIGHTS_FILE), str(base / VOCAB_FILE)

    from huggingface_hub import hf_hub_download

    weights_path = hf_hub_download(HF_REPO_ID, WEIGHTS_FILE)
    vocab_path = hf_hub_download(HF_REPO_ID, VOCAB_FILE)
    return weights_path, vocab_path


def get_model():
    """Return the cached (model, stoi), building it on first call."""
    global _model, _stoi
    if _model is None:
        weights_path, vocab_path = resolve_weights()
        _model, _stoi = build_model(weights_path, vocab_path)
    return _model, _stoi
