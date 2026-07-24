"""Fusion model + preprocessing.

Model architecture and the preprocess_image / extract_metadata functions are
copied verbatim from inference/preprocess_html_and_predict.py - the source of
truth for training. ponytail: kept in sync by hand; if the trained architecture
changes, update both. run_prediction replaces the script's print-based report
with the structured {verdict, confidence, signals, meta} the API returns.
"""

import json
import re

import torch
import torch.nn as nn
import torchvision.transforms as T

MAX_TEXT_LEN = 512
METADATA_DIM = 20
NUM_CLASSES = 2
TEXT_EMBED_DIM = 128
DROPOUT = 0.5


# ===================
# Model architecture
# ===================

class TextFeatureExtractor(nn.Module):
    def __init__(self, vocab_size, embed_dim):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.conv1 = nn.Conv1d(embed_dim, 64, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm1d(64)
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool1d(2, 2)
        self.conv2 = nn.Conv1d(64, 128, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm1d(128)
        self.relu2 = nn.ReLU()
        self.pool2 = nn.MaxPool1d(2, 2)
        self.conv3 = nn.Conv1d(128, 256, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm1d(256)
        self.relu3 = nn.ReLU()
        self.pool3 = nn.MaxPool1d(2, 2)
        self.conv4 = nn.Conv1d(256, 512, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm1d(512)
        self.relu4 = nn.ReLU()
        self.pool4 = nn.MaxPool1d(2, 2)
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        self.fc1 = nn.Linear(512, 256)
        self.relu_fc1 = nn.ReLU()

    def forward(self, x):
        x = self.embedding(x)
        x = x.transpose(1, 2)
        x = self.pool1(self.relu1(self.bn1(self.conv1(x))))
        x = self.pool2(self.relu2(self.bn2(self.conv2(x))))
        x = self.pool3(self.relu3(self.bn3(self.conv3(x))))
        x = self.pool4(self.relu4(self.bn4(self.conv4(x))))
        x = self.global_pool(x).squeeze(-1)
        x = self.relu_fc1(self.fc1(x))
        return x


class ImageFeatureExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.conv3 = nn.Sequential(
            nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.Conv2d(256, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.Conv2d(256, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.conv4 = nn.Sequential(
            nn.Conv2d(256, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(),
            nn.Conv2d(512, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(),
            nn.Conv2d(512, 512, 3, padding=1), nn.BatchNorm2d(512), nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc_features = nn.Linear(512, 512)
        self.relu_fc = nn.ReLU()

    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = self.conv4(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.relu_fc(self.fc_features(x))
        return x


class DualTowerFusionModel(nn.Module):
    def __init__(self, text_extractor, image_extractor, metadata_dim, num_classes, dropout):
        super().__init__()
        self.text_tower = text_extractor
        self.image_tower = image_extractor
        self.metadata_proj = nn.Sequential(
            nn.Linear(metadata_dim, 64), nn.ReLU(), nn.Dropout(0.25)
        )
        self.fusion_classifier = nn.Sequential(
            nn.Linear(832, 512), nn.BatchNorm1d(512), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, 128), nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, num_classes)
        )

    def forward(self, images, texts, metadata):
        text_features = self.text_tower(texts)
        image_features = self.image_tower(images)
        metadata_features = self.metadata_proj(metadata)
        combined = torch.cat([text_features, image_features, metadata_features], dim=1)
        logits = self.fusion_classifier(combined)
        return logits


# ==============
# Preprocessing
# ==============

def build_stoi(vocab_path):
    """Load the vocab file and return its string-to-index map."""
    with open(vocab_path, "r") as f:
        vocab_data = json.load(f)
    return {w: i for i, w in enumerate(vocab_data["itos"])}


def preprocess_text(subject, body, stoi, max_len=MAX_TEXT_LEN):
    """Convert email subject+body to the model's token-id tensor."""
    full_text = f"{subject} {body}".lower()
    full_text = re.sub(r"[^a-z0-9\s]", " ", full_text)
    tokens = full_text.split()[:max_len]

    unk_idx = stoi.get("<unk>", 0)
    token_ids = [stoi.get(token, unk_idx) for token in tokens]
    token_ids += [0] * (max_len - len(token_ids))
    return torch.tensor(token_ids, dtype=torch.long)


def preprocess_image(pil_image):
    """Convert a PIL image to the model's normalized 3x224x224 tensor."""
    transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return transform(pil_image)


def extract_metadata(subject, body):
    """Extract the 20 hand-engineered metadata features as a tensor."""
    text = f"{subject} {body}".lower()

    urls = re.findall(r"http[s]?://\S+", text)
    num_urls = min(len(urls), 10)
    has_shortened = float(any(short in url.lower() for url in urls for short in ["bit.ly", "tinyurl", "goo.gl"]))
    has_suspicious_domain = float(any(susp in url.lower() for url in urls for susp in ["verify", "secure", "account", "login"]))

    urgency_words = ["urgent", "immediate", "act now", "expires", "suspended", "locked"]
    num_urgency = sum(text.count(w) for w in urgency_words)

    action_words = ["verify", "confirm", "update", "click here", "validate"]
    num_action = sum(text.count(w) for w in action_words)

    financial_words = ["account", "payment", "refund", "money", "prize"]
    num_financial = sum(text.count(w) for w in financial_words)

    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    num_exclaim = text.count("!")
    num_dollar = text.count("$")

    metadata = [
        len(text) / 1000.0,
        len(subject) / 100.0,
        len(body) / 1000.0,
        num_urls,
        has_shortened,
        has_suspicious_domain,
        min(num_urgency, 10),
        min(num_action, 10),
        min(num_financial, 10),
        caps_ratio,
        min(num_exclaim, 10),
        min(num_dollar, 10),
        0.0,
        len(text.split()) / 100.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
    ]
    return torch.tensor(metadata, dtype=torch.float)


# ============================================================
# Signals - structured form of the script's "Detected Issues"
# ============================================================

def build_signals(metadata_vals):
    """Turn the metadata vector into the structured signals list (script thresholds)."""
    signals = []
    if metadata_vals[4] > 0.5:
        signals.append({"code": "shortened_url", "label": "Contains shortened URLs (bit.ly, tinyurl)", "severity": "high"})
    if metadata_vals[5] > 0.5:
        signals.append({"code": "suspicious_domain", "label": "Suspicious domain keywords detected", "severity": "high"})
    if metadata_vals[6] > 3:
        signals.append({"code": "urgency_language", "label": f"High urgency language ({int(metadata_vals[6])} urgent keywords)", "severity": "medium"})
    if metadata_vals[7] > 2:
        signals.append({"code": "multiple_cta", "label": "Multiple call-to-action phrases", "severity": "medium"})
    if metadata_vals[9] > 0.3:
        signals.append({"code": "excessive_caps", "label": f"Excessive capitalization ({metadata_vals[9] * 100:.1f}%)", "severity": "low"})
    if metadata_vals[10] > 3:
        signals.append({"code": "exclamation_marks", "label": f"{int(metadata_vals[10])} exclamation marks", "severity": "low"})
    return signals


# =========================
# Model build + prediction
# =========================

def build_model(weights_path, vocab_path, device="cpu"):
    """Build the fusion model, load trained weights, and return (model, stoi)."""
    stoi = build_stoi(vocab_path)
    text_extractor = TextFeatureExtractor(len(stoi), TEXT_EMBED_DIM)
    image_extractor = ImageFeatureExtractor()
    model = DualTowerFusionModel(
        text_extractor, image_extractor, METADATA_DIM, NUM_CLASSES, DROPOUT
    ).to(device)
    # weights_only=True: the checkpoint is a plain state_dict pulled from HF Hub;
    # blocks arbitrary-code execution during unpickling.
    state = torch.load(weights_path, map_location=device, weights_only=True)
    model.load_state_dict(state)
    model.eval()
    return model, stoi


def run_prediction(model, stoi, parsed, device="cpu"):
    """Run the fusion model on a parsed email and return the API result dict."""
    subject, body, images = parsed["subject"], parsed["body"], parsed["images"]

    text_tensor = preprocess_text(subject, body, stoi)
    image_tensor = preprocess_image(images[0]) if images else torch.zeros(3, 224, 224)
    metadata_tensor = extract_metadata(subject, body)

    model.eval()
    with torch.no_grad():
        logits = model(
            image_tensor.unsqueeze(0).to(device),
            text_tensor.unsqueeze(0).to(device),
            metadata_tensor.unsqueeze(0).to(device),
        )
        probs = torch.softmax(logits, dim=1)
        pred = int(logits.argmax(dim=1).item())
        confidence = float(probs[0][pred].item())

    return {
        "verdict": "phishing" if pred == 1 else "legitimate",
        "confidence": round(confidence, 4),
        "signals": build_signals(metadata_tensor.tolist()),
        "meta": {"images_found": len(images), "body_chars": len(body)},
    }
