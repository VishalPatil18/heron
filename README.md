# Heron

> **"Nothing swims past."**

Heron is a multimodal phishing detector with a product face: a **FastAPI inference
service** and a **web app** wrapped around a dual-tower fusion model that jointly
analyzes **email text**, **embedded brand logos**, and **engineered metadata** -
achieving **99.45% accuracy** and **AUC 0.999** on a balanced dataset of 76,346 emails.

AI has made phishing cheaper, faster, and more convincing. Heron is the watcher on
the water that catches the phish before you click.

[![Live Demo](https://img.shields.io/badge/🤗%20Research%20Demo-Hugging%20Face%20Spaces-blue)](https://huggingface.co/spaces/anilawork/phish-detection-ui-final)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-ee4c2c)](https://pytorch.org/)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Dataset](#dataset)
- [Results](#results)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Clone the repo](#clone-the-repo)
  - [Track A - Run the Heron API (backend)](#track-a--run-the-heron-api-backend)
  - [Track B - Reproduce the ML pipeline](#track-b--reproduce-the-ml-pipeline)
- [Running Inference (CLI)](#running-inference-cli)
- [Live Demo](#live-demo)
- [Team](#team)

---

## Overview

Phishing attacks remain one of the most prevalent cyber threats. Traditional text-only filters fail when attackers mimic legitimate brand emails visually. Heron addresses that gap with a **multimodal approach** that fuses three complementary signal types:

| Modality       | What it captures                                 | Output dim               |
| -------------- | ------------------------------------------------ | ------------------------ |
| **Email Text** | Linguistic patterns, urgency, vocabulary         | 256-d                    |
| **Brand Logo** | Visual brand impersonation via embedded images   | 512-d                    |
| **Metadata**   | URL count, capitalization ratio, keyword signals | 64-d (projected from 20) |

The three towers are pre-trained independently as specialists, then fused in a joint classifier that achieves near-perfect detection.

---

## Architecture

```
                    ┌─────────────────────────────────────────────────────┐
                    │                  EMAIL INPUT                        │
                    └──────────┬────────────────┬──────────────┬──────────┘
                               │                │              │
                    ┌──────────▼──────┐  ┌──────▼──────┐  ┌───▼────────────┐
                    │   TEXT TOWER    │  │ IMAGE TOWER │  │ METADATA MLP   │
                    │  (Custom CNN)   │  │ (Custom CNN)│  │  (20-dim feat) │
                    │                 │  │             │  │                │
                    │  Embed(128)     │  │ Conv 3→64   │  │  Linear(20,64) │
                    │  Conv1D ×4      │  │ Conv 64→128 │  │  ReLU          │
                    │  GlobalAvgPool  │  │ Conv128→256 │  │                │
                    │  Linear→256     │  │ Conv256→512 │  └───────┬────────┘
                    └──────────┬──────┘  │ AvgPool→512 │          │
                               │         └──────┬──────┘          │
                               │  256-d         │  512-d          │  64-d
                               └────────────────┴──────────────────┘
                                                │
                                         Concat (832-d)
                                                │
                                    ┌───────────▼───────────┐
                                    │    FUSION CLASSIFIER   │
                                    │  Linear(832→512) + BN  │
                                    │  Linear(512→256) + BN  │
                                    │  Linear(256→128) + BN  │
                                    │  Linear(128→2)         │
                                    └───────────┬────────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │  Phishing / Legitimate  │
                                    └────────────────────────┘
```

**Training strategy:**

1. **Phase 1** - Text and image towers are trained independently as specialist classifiers.
2. **Phase 2** - Email and logo datasets are aligned into a unified multimodal dataset.
3. **Phase 3** - Towers are loaded with frozen weights; the fusion classifier is trained. Then the full network is fine-tuned end-to-end.

---

## Dataset

### Emails

| Source               | Type                          | Approx. Count |
| -------------------- | ----------------------------- | ------------- |
| CEAS_08              | Spam / Phishing               | ~17,000       |
| Enron                | Legitimate                    | ~18,000       |
| Nazario              | Phishing                      | ~2,000        |
| Nigerian Prince      | Phishing                      | ~4,000        |
| **Total (balanced)** | 50% phishing / 50% legitimate | **76,346**    |

### Brand Logos (Image Tower)

- **Source:** OpenLogo dataset
- **72,652 brand logo images** across **352 brand classes**
- Resized to 224×224 and normalized with ImageNet statistics (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

### Metadata Features (20-dim vector)

Text length, subject length, body length, URL count, shortened-URL flag, suspicious domain keywords, urgency-word count, action-phrase count, financial-keyword count, capitalization ratio, exclamation-mark count, dollar-sign count, word count, and 7 additional engineered binary/continuous signals.

---

## Results

### Model Performance Comparison

| Model                        | Accuracy   | Notes                    |
| ---------------------------- | ---------- | ------------------------ |
| KNN (text features)          | 81.71%     | Baseline                 |
| Logistic Regression          | 80.00%     | Baseline                 |
| Custom Text CNN              | 98.96%     | Phase 1 text specialist  |
| Custom Image CNN             | 76.30%     | Phase 1 image specialist |
| ResNet18 (transfer learning) | 97.43%     | Comparison baseline      |
| **Dual-Tower Fusion**        | **99.45%** | **Final model**          |

### Fusion Model Detailed Metrics

| Metric                     | Score  |
| -------------------------- | ------ |
| Accuracy                   | 99.45% |
| AUC-ROC                    | 0.999  |
| Precision (phishing class) | 99.5%  |
| Recall (phishing class)    | 99.4%  |
| F1-Score                   | 99.4%  |

---

## Repository Structure

```
heron/
│
├── backend/                              # Heron API - FastAPI inference service
│   ├── app/
│   │   ├── main.py                       # GET /health, POST /predict
│   │   ├── model.py                      # Fusion model + preprocessing + run_prediction
│   │   ├── emails.py                     # Parse .html / .eml / pasted text → common shape
│   │   └── weights.py                    # Resolve weights (local dir or HF Hub) + singleton
│   ├── samples/                          # phishing_example.html, legit_example.html
│   ├── tests/test_predict.py             # pytest (stubbed model - no real weights needed)
│   ├── requirements.txt
│   └── README.md                         # Backend run/test + weights-upload guide
│
├── notebooks/                            # Training notebooks - run in order
│   ├── Final_CNN_Text_1.ipynb                    # Phase 1A: Train text CNN specialist
│   ├── Final_CNN_Images_Custom.ipynb             # Phase 1B: Train image CNN (custom)
│   ├── Final_CNN_Images_Resnet18.ipynb           # Phase 1B alt: ResNet18 comparison
│   ├── dual_tower_text_features.ipynb            # Phase 2: Build unified multimodal dataset
│   ├── train_fusion3.ipynb                       # Phase 3: Train dual-tower fusion model
│   └── baselines/
│       ├── Final_KNN_Text.ipynb                  # KNN baseline
│       └── text_tower_knn.ipynb                  # KNN text tower variant
│
├── src/                                  # Reusable Python modules
│   ├── fusion_models.py          # DualTowerFusionModel, TextFeatureExtractor, ImageFeatureExtractor
│   ├── fusion_dataset_v2.py      # PyTorch Dataset for multimodal training
│   ├── brand_extractor.py        # Extract brand names from email text
│   ├── brand_logo_mapper.py      # Map brand names to logo file paths
│   ├── build_brand_index.py      # Build brand→images JSON index
│   ├── email_ratio.py            # Email dataset balance utilities
│   └── __init__.py
│
├── inference/
│   └── preprocess_html_and_predict.py  # End-to-end CLI inference on raw .html email files
│
├── data/
│   ├── vocab_text_1.json               # Text CNN vocabulary (word→index)
│   ├── class_to_idx_image_custom.json  # Image CNN label map (custom CNN)
│   ├── class_to_idx_image_resnet18.json# Image CNN label map (ResNet18)
│   ├── brand_to_images.json            # Brand→logo file paths index
│   ├── cleaned_combined_emails.csv     # Preprocessed email dataset           [git-lfs]
│   └── unified_multimodal_text.csv     # Unified multimodal training dataset  [git-lfs]
│
├── models/
│   ├── best_custom_cnn_text_1.pth      # Text specialist weights  (~104 MB)   [git-lfs]
│   ├── best_custom_cnn_image_custom.pth# Image specialist weights (~31 MB)    [git-lfs]
│   └── best_fusion_model.pth           # Final fusion model weights (~137 MB) [git-lfs]
│
├── docs/                               # Project report, architecture report, slides, recordings
│
├── plan.md                             # Heron product build plan (task-by-task)
├── DESIGN.md                           # Heron design system (tokens, components)
├── context.md                          # Project knowledge base (state + decisions + history)
├── CLAUDE.md                           # Working guidelines for AI-assisted changes
├── requirements.txt                    # ML pipeline dependencies (notebooks / training)
├── .gitattributes                      # git-lfs tracking rules
├── .gitignore
└── README.md
```

> **Files marked `[git-lfs]`** are tracked with Git Large File Storage. Run `git lfs pull` after cloning to download them.

---

## Quick Start

Two independent tracks: run the **API** (Track A) to serve verdicts, or reproduce
the **ML pipeline** (Track B) to retrain the model from the notebooks.

### Prerequisites

- Python 3.10+ (the backend container targets 3.11)
- [Git LFS](https://git-lfs.com/) - required for the model weights
- A CUDA-capable GPU is recommended for **training**; CPU is fine for **inference / the API**

### Clone the repo

```bash
git lfs install
git clone https://github.com/VishalPatil18/heron.git
cd heron
git lfs pull        # downloads the real .pth weights + LFS datasets
```

> Without `git lfs pull` the `.pth` files are small pointer stubs and the model
> will not load locally.

### Track A - Run the Heron API (backend)

The API turns an email (`.html` / `.eml` upload or pasted text) into
`{verdict, confidence, signals, meta}` using the fusion model, loaded in-process.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Point the API at the local weights so it skips the Hugging Face download.
# HERON_WEIGHTS_DIR must contain BOTH best_fusion_model.pth and vocab_text_1.json:
mkdir -p .weights
cp ../models/best_fusion_model.pth ../data/vocab_text_1.json .weights
export HERON_WEIGHTS_DIR=.weights

uvicorn app.main:app --reload                           # http://localhost:8000
```

Try it:

```bash
curl -F file=@samples/phishing_example.html localhost:8000/predict
curl -F file=@samples/legit_example.html    localhost:8000/predict
curl -H "Content-Type: application/json" -d '{"text":"verify your account now"}' localhost:8000/predict
```

Run the tests (stubbed model - no weights required):

```bash
pytest
```

**Endpoints:** `GET /health` → `{"status":"ok"}`; `POST /predict` accepts either
`multipart/form-data` (field `file`, a `.html` / `.eml` / `.txt` upload) or JSON
`{ "text": "...", "subject": "..." }`. The model loads lazily on the first
`/predict`. If `HERON_WEIGHTS_DIR` is unset, weights are pulled from the Hugging
Face model repo `vishalpatil-18/heron-phishing` and cached. See
[`backend/README.md`](./backend/README.md) for the deploy + weights-upload guide.

### Track B - Reproduce the ML pipeline

```bash
# from the repo root
python -m venv venv && source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Then run the notebooks in order - each phase produces artifacts consumed by the next:

1. **Phase 1A - Text specialist:** `notebooks/Final_CNN_Text_1.ipynb`
   → `models/best_custom_cnn_text_1.pth`, `data/vocab_text_1.json` (98.96%).
2. **Phase 1B - Image specialist:** `notebooks/Final_CNN_Images_Custom.ipynb`
   → `models/best_custom_cnn_image_custom.pth`, `data/class_to_idx_image_custom.json` (76.30%).
   Comparison baseline: `notebooks/Final_CNN_Images_Resnet18.ipynb` (97.43%).
3. **Phase 2 - Multimodal integration:** `notebooks/dual_tower_text_features.ipynb`
   → `data/unified_multimodal_text.csv`.
4. **Phase 3 - Fusion training:** `notebooks/train_fusion3.ipynb`
   → `models/best_fusion_model.pth` (99.45%, AUC 0.999).

> **OpenLogo dataset** (image tower training) is not included due to size (~2 GB).
> Download from [qmul-openlogo.github.io](https://qmul-openlogo.github.io/) and set
> the path in the Phase 1B notebook.

---

## Running Inference (CLI)

Classify a raw `.html` email file directly with the trained fusion model (the script
the API is built on):

```bash
python inference/preprocess_html_and_predict.py path/to/email.html
```

**Pipeline (fully automatic):**

1. Parse HTML → extract subject, body text, and embedded/linked images
2. Tokenize text using `data/vocab_text_1.json`
3. Decode and resize the first image to 224×224
4. Extract 20 metadata features (URL patterns, keyword signals, character statistics)
5. Run all three tensors through the fusion model
6. Print verdict + confidence + detected suspicious signals
7. Save a `.txt` report alongside the input file

**Example output:**

```
=================================
Analyzing: suspicious_email.html
=================================

Prediction: PHISHING
Confidence: 98.73%

Detected Issues:
  Contains shortened URLs (bit.ly, tinyurl)
  High urgency language (5 urgent keywords)
  Multiple call-to-action phrases
  Excessive capitalization (34.2%)
==================================
```

---

## Live Demo

A Streamlit research demo is deployed on Hugging Face Spaces - no installation required:

**[https://huggingface.co/spaces/anilawork/phish-detection-ui-final](https://huggingface.co/spaces/anilawork/phish-detection-ui-final)**

Upload any `.html` email file to receive an instant phishing verdict with confidence
score and suspicious signal breakdown.

---

## Team

- [Vishal Patil](https://github.com/VishalPatil18)
- [Akash S Vora](https://github.com/akashsv01)
- [Srihari Narayan](https://github.com/Srihari-Narayan)
- [Sai Anila Namburi](https://github.com/madhu-anila)

---

## References

- OpenLogo Dataset - Queen Mary University of London  
  https://qmul-openlogo.github.io/
- CEAS 2008 Spam Filtering Challenge
- Phishing Email Dataset - Naser Abdullah Alam  
  https://www.kaggle.com/datasets/naserabdullahalam/phishing-email-dataset
- PyTorch - https://pytorch.org
