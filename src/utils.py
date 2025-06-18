"""
Utility functions for the Directory Analyzer.

This module provides common helper functions and error handling utilities.
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Iterator
    from pathlib import Path

from .constants import BYTES_PER_KB


def setup_logging(verbose: bool = False) -> logging.Logger:
    """Set up logging configuration.

    Args:
        verbose: Enable verbose logging output

    Returns:
        Configured logger instance
    """
    level = logging.DEBUG if verbose else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    return logging.getLogger("directory_analyzer")


def is_hidden_directory(path: Path) -> bool:
    """Check if a directory is hidden (Windows-specific).

    Args:
        path: Directory path to check

    Returns:
        True if the directory is hidden
    """
    if os.name == "nt":  # Windows
        try:
            attrs = os.stat(path).st_file_attributes
            return bool(attrs & 2)  # FILE_ATTRIBUTE_HIDDEN
        except (OSError, AttributeError):
            pass

    # Unix-like systems and fallback
    return path.name.startswith(".")


def is_hidden_directory_cross_platform(path: Path) -> bool:
    """Cross-platform detection of hidden directories.

    Args:
        path: Directory path to check

    Returns:
        True if the directory is considered hidden on the current platform
    """
    import platform

    # Windows-specific hidden detection
    if platform.system() == "Windows":
        try:
            attrs = path.stat().st_file_attributes
            # Check for hidden attribute (FILE_ATTRIBUTE_HIDDEN = 2)
            if attrs & 2:
                return True
        except (AttributeError, OSError):
            pass

    # Unix-like systems (Linux, macOS) and fallback
    return path.name.startswith(".")


def is_accessible_directory(path: Path) -> bool:
    """Check if a directory is accessible for reading.

    Args:
        path: Directory path to check

    Returns:
        True if the directory can be accessed
    """
    try:
        path.iterdir()
        return True
    except (PermissionError, OSError):
        return False


def safe_get_file_size(file_path: Path) -> int:
    """Safely get file size, handling errors.

    Args:
        file_path: Path to the file

    Returns:
        File size in bytes, or 0 if error occurs
    """
    try:
        return file_path.stat().st_size
    except (OSError, PermissionError):
        return 0


def get_direct_files(directory: Path, verbose: bool = False) -> Iterator[Path]:
    """Get direct files in a directory (not subdirectories).

    Args:
        directory: Directory path to scan
        verbose: Whether to show individual access warnings

    Yields:
        Path objects for files directly in the directory
    """
    try:
        for item in directory.iterdir():
            if item.is_file():
                yield item
    except (PermissionError, OSError) as e:
        logger = logging.getLogger("directory_analyzer")
        if verbose:
            logger.warning(f"Cannot access directory {directory}: {e}")
        else:
            logger.debug(f"Cannot access directory {directory}: {e}")


def get_subdirectories(directory: Path, include_hidden: bool = True, verbose: bool = False) -> Iterator[Path]:
    """Get subdirectories in a directory.

    Args:
        directory: Directory path to scan
        include_hidden: Whether to include hidden directories (default: True)
        verbose: Whether to show individual access warnings

    Yields:
        Path objects for subdirectories
    """
    try:
        for item in directory.iterdir():
            if item.is_dir():
                if include_hidden or not is_hidden_directory_cross_platform(item):
                    yield item
    except (PermissionError, OSError) as e:
        logger = logging.getLogger("directory_analyzer")
        if verbose:
            logger.warning(f"Cannot access directory {directory}: {e}")
        else:
            logger.debug(f"Cannot access directory {directory}: {e}")


def format_path_for_display(path: Path, max_length: int = 80) -> str:
    """Format a path for display, truncating if necessary.

    Args:
        path: Path to format
        max_length: Maximum length for display

    Returns:
        Formatted path string
    """
    path_str = str(path)
    if len(path_str) <= max_length:
        return path_str

    # Truncate from the middle
    start_len = max_length // 2 - 3
    end_len = max_length - start_len - 3
    return f"{path_str[:start_len]}...{path_str[-end_len:]}"


def validate_output_path(output_path: Path) -> str | None:
    """Validate that an output path is writable.

    Args:
        output_path: Path to validate

    Returns:
        Error message if invalid, None if valid
    """
    try:
        # Check if parent directory exists
        parent = output_path.parent
        if not parent.exists():
            return f"Parent directory does not exist: {parent}"

        if not parent.is_dir():
            return f"Parent path is not a directory: {parent}"

        # Check write permissions by creating a temporary file
        test_file = parent / f".test_write_{os.getpid()}"
        try:
            test_file.touch()
            test_file.unlink()
        except (PermissionError, OSError):
            return f"No write permission for directory: {parent}"

        return None

    except Exception as e:
        return f"Cannot validate output path: {e}"


def bytes_to_human_readable(size_bytes: int) -> str:
    """Convert bytes to human-readable format.

    Args:
        size_bytes: Size in bytes

    Returns:
        Human-readable size string
    """
    if size_bytes == 0:
        return "0 B"

    size = float(size_bytes)
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < BYTES_PER_KB:
            if unit == "B":
                return f"{int(size)} {unit}"
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


def pluralize(count: int, singular: str, plural: str | None = None) -> str:
    """Create pluralized string based on count.

    Args:
        count: Number to check
        singular: Singular form of the word
        plural: Plural form (default: singular + 's')

    Returns:
        Properly pluralized string
    """
    if plural is None:
        plural = singular + "s"

    word = singular if count == 1 else plural
    return f"{count} {word}"


def write_error_log(error_log_file: Path, error_directories: list[str]) -> None:
    """Write inaccessible directories to error log file.

    Args:
        error_log_file: Path to the error log file
        error_directories: List of directory paths that couldn't be accessed    """
    try:
        with open(error_log_file, "w", encoding="utf-8") as f:
            f.write("# Directory Analyzer - Inaccessible Directories\n")
            f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"# Total inaccessible directories: {len(error_directories)}\n\n")

            f.writelines(f"{directory}\n" for directory in error_directories)

    except Exception as e:
        logging.getLogger("directory_analyzer").exception(
            f"Failed to write error log to {error_log_file}: {e}"
        )


class ProgressReporter:
    """Simple progress reporter for long-running operations."""

    def __init__(self, total: int | None = None, prefix: str = "Progress"):
        self.total = total
        self.prefix = prefix
        self.current = 0
        self.last_reported = -1

    def update(self, count: int = 1):
        """Update progress counter.

        Args:
            count: Number to add to current progress
        """
        self.current += count

        # Report every 1000 items or at significant percentages
        if self.total:
            percent = int((self.current / self.total) * 100)
            if percent > self.last_reported and percent % 5 == 0:
                print(f"\r{self.prefix}: {percent}% ({self.current}/{self.total})", end="", flush=True)
                self.last_reported = percent
        elif self.current % 1000 == 0:
            print(f"\r{self.prefix}: {self.current} processed", end="", flush=True)

    def finish(self):
        """Complete the progress reporting."""
        if self.total:
            print(f"\r{self.prefix}: 100% ({self.current}/{self.total}) - Complete!")
        else:
            print(f"\r{self.prefix}: {self.current} processed - Complete!")
