"""Put the backend root on sys.path so tests can `import app.*` and run `pytest` from backend/."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
