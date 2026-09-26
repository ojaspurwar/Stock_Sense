import sys
from pathlib import Path

# Ensure the Backend root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from main import app

# Vercel serverless function entrypoint
__all__ = ["app"]
