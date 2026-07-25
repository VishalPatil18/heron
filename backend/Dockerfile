# Heron API — FastAPI phishing inference, for Google Cloud Run (honors $PORT).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# CPU-only torch FIRST from PyTorch's CPU index, so the later `-r requirements.txt`
# finds torch/torchvision already satisfied and never pulls the ~2 GB CUDA wheel.
COPY requirements.txt .
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu \
 && pip install -r requirements.txt

COPY app ./app
COPY samples ./samples

# Bake the model weights into the image (staged in backend/weights/ before deploy).
# HERON_WEIGHTS_DIR makes weights.py load them off local disk — no HF pull at runtime.
COPY weights ./weights
ENV HERON_WEIGHTS_DIR=/app/weights

# Cloud Run injects $PORT (defaults to 8080); fall back to 8080 for local runs.
# `exec` gives uvicorn PID 1 so it receives Cloud Run's SIGTERM on shutdown.
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
