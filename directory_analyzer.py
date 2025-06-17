#!/usr/bin/env python3
"""
Entry point for Directory Analyzer when run as a module.
"""

import sys
from pathlib import Path

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.main import main

if __name__ == "__main__":
    sys.exit(main())
