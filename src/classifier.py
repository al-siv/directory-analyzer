"""
File content classification system for Directory Analyzer.

This module provides intelligent file categorization based on extensions,
MIME types, and user-defined custom categories.
"""

from __future__ import annotations

import contextlib
import mimetypes
from typing import TYPE_CHECKING, ClassVar

if TYPE_CHECKING:
    from pathlib import Path

from .models import FileInfo


class ContentClassifier:
    """Handles file content classification and categorization."""
    # Comprehensive category mappings
    CATEGORY_MAPPINGS: ClassVar[dict[str, set[str]]] = {
        "images": {
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".svg",
            ".raw", ".cr2", ".nef", ".arw", ".dng", ".raf", ".orf", ".rw2",
            ".pef", ".srw", ".x3f", ".ico", ".heic", ".heif", ".avif"
        },
        "videos": {
            ".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".m4v",
            ".3gp", ".mpg", ".mpeg", ".m2v", ".mts", ".ts", ".vob", ".rm",
            ".rmvb", ".asf", ".ogv", ".dv", ".f4v", ".m4p", ".divx"
        },
        "audio": {
            ".mp3", ".flac", ".wav", ".aac", ".ogg", ".m4a", ".wma", ".opus",
            ".mp2", ".aiff", ".au", ".ra", ".ac3", ".dts", ".ape", ".tak",
            ".tta", ".wv", ".mka", ".caf", ".amr", ".3ga"
        },
        "documents": {
            ".pdf", ".epub", ".mobi", ".chm", ".djvu", ".fb2", ".azw", ".azw3",
            ".azw4", ".lit", ".pdb", ".tcr", ".lrf", ".rb", ".pml", ".tr2", ".tr3"
        },
        "office": {
            ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".md", ".txt",
            ".rtf", ".odt", ".ods", ".odp", ".odg", ".odf", ".sxw", ".sxc",
            ".sxi", ".wpd", ".wps", ".pages", ".numbers", ".key", ".tex"
        },
        "archives": {
            ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".lzma",
            ".cab", ".iso", ".dmg", ".pkg", ".deb", ".rpm", ".msi", ".exe",
            ".z", ".lz", ".lzo", ".rz", ".sz", ".dz", ".tbz2", ".tgz", ".txz"
        },
        "code": {
            ".py", ".js", ".html", ".css", ".java", ".cpp", ".c", ".rs", ".go",            ".json", ".xml", ".yaml", ".yml", ".ini", ".cfg", ".conf", ".php",
            ".rb", ".pl", ".sh", ".bat", ".ps1", ".vbs", ".lua", ".r", ".m",
            ".swift", ".kt", ".scala", ".hs", ".clj", ".fs", ".ml", ".pas"
        },
        "system": {
            ".exe", ".dll", ".sys", ".drv", ".ocx", ".cpl", ".scr", ".com",
            ".app", ".dmg", ".pkg", ".deb", ".rpm", ".so", ".dylib", ".ko",
            ".bin", ".run", ".bundle", ".framework", ".kext", ".prefpane"
        }
    }

    def __init__(self, custom_categories: dict[str, set[str]] | None = None):
        """Initialize classifier with optional custom categories.

        Args:
            custom_categories: Dictionary mapping category names to extension sets
        """
        self.categories = self.CATEGORY_MAPPINGS.copy()

        if custom_categories:
            self.categories.update(custom_categories)

    def classify_file(self, file_path: Path) -> str:
        """Classify a file based on its extension.

        Args:
            file_path: Path to the file to classify

        Returns:
            Category name (string)
        """
        extension = file_path.suffix.lower()

        # Check each category for the extension
        for category, extensions in self.categories.items():
            if extension in extensions:
                return category

        # Default to 'other' if no match found
        return "other"

    def classify_file_with_info(self, file_path: Path, file_size: int) -> FileInfo:
        """Create FileInfo object with classification.

        Args:
            file_path: Path to the file
            file_size: Size of the file in bytes

        Returns:
            FileInfo object with classification
        """
        extension = file_path.suffix.lower()
        category = self.classify_file(file_path)        # Try to get MIME type
        mime_type = None
        with contextlib.suppress(Exception):
            mime_type, _ = mimetypes.guess_type(str(file_path))

        return FileInfo(
            path=file_path,
            size_bytes=file_size,
            extension=extension,
            category=category,
            mime_type=mime_type
        )

    def get_category_statistics(self, files: list[FileInfo]) -> dict[str, int]:
        """Calculate size statistics by category.

        Args:
            files: List of FileInfo objects

        Returns:
            Dictionary mapping category names to total sizes
        """
        stats = {}

        for file_info in files:
            category = file_info.category
            if category not in stats:
                stats[category] = 0
            stats[category] += file_info.size_bytes

        return stats

    def get_file_count_by_category(self, files: list[FileInfo]) -> dict[str, int]:
        """Calculate file count statistics by category.

        Args:
            files: List of FileInfo objects

        Returns:
            Dictionary mapping category names to file counts
        """
        counts = {}

        for file_info in files:
            category = file_info.category
            if category not in counts:
                counts[category] = 0
            counts[category] += 1

        return counts

    def get_dominant_category(self, files: list[FileInfo]) -> str:
        """Determine the dominant content category by size.

        Args:
            files: List of FileInfo objects

        Returns:
            Category name with largest total size
        """
        if not files:
            return "other"

        category_sizes = self.get_category_statistics(files)
        return max(category_sizes.items(), key=lambda x: x[1])[0]

    def add_custom_category(self, category_name: str, extensions: set[str]) -> None:
        """Add a custom category with specified extensions.

        Args:
            category_name: Name of the custom category
            extensions: Set of file extensions (with dots, lowercase)
        """
        # Ensure extensions are lowercase and have dots
        normalized_extensions = {
            ext.lower() if ext.startswith(".") else f".{ext.lower()}"
            for ext in extensions
        }

        self.categories[category_name] = normalized_extensions

    def get_all_categories(self) -> list[str]:
        """Get list of all available categories.

        Returns:
            Sorted list of category names
        """
        return sorted(self.categories.keys())

    def get_category_display_name(self, category: str) -> str:
        """Get human-readable display name for category.

        Args:
            category: Category name

        Returns:
            Formatted display name
        """
        display_names = {
            "images": "Images",
            "videos": "Videos",
            "audio": "Audio",
            "documents": "Documents/Books",
            "office": "Office Documents",
            "archives": "Archives",
            "code": "Code/Development",
            "system": "System/Applications",
            "other": "Other"
        }

        return display_names.get(category, category.title())
