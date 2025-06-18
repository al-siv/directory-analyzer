"""
Data models for the Directory Analyzer.

This module defines the core data structures used throughout the application.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

from .constants import BYTES_PER_KB, MINIMUM_PERCENTAGE_DISPLAY

if TYPE_CHECKING:
    from datetime import datetime


@dataclass
class DirectoryInfo:
    """Information about a directory and its direct file content.

    Attributes:
        path: Absolute path to the directory
        size_bytes: Total size of direct files in bytes (not including subdirectories)
        file_count: Number of direct files in the directory
        last_scanned: Timestamp when the directory was last analyzed
        error_message: Optional error message if scanning failed
    """
    path: Path
    size_bytes: int
    file_count: int
    last_scanned: datetime
    error_message: str | None = None

    @property
    def size_human_readable(self) -> str:
        """Return human-readable size string."""
        size = float(self.size_bytes)
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < BYTES_PER_KB:
                if unit == "B":
                    return f"{int(size)} {unit}"
                return f"{size:.1f} {unit}"
            size /= BYTES_PER_KB
        return f"{size:.1f} PB"

    @property
    def has_error(self) -> bool:
        """Check if this directory had scanning errors."""
        return self.error_message is not None

    def __str__(self) -> str:
        """String representation for display."""
        error_suffix = f" (ERROR: {self.error_message})" if self.has_error else ""
        return (
            f"{self.path}: {self.size_human_readable} "
            f"({self.file_count} files){error_suffix}"
        )


@dataclass
class ScanOptions:
    """Configuration options for directory scanning.

    Attributes:
        target_path: Root directory to scan
        include_hidden: Whether to include hidden directories (default: True)
        min_size_bytes: Minimum size threshold for inclusion
        output_file: Path for complete results output
        top_count: Number of top results to show in terminal
        output_format: Format for file output ('text', 'csv', 'json')
        verbose: Enable verbose progress output
        error_log_file: Path to log inaccessible directories
        extension_filter: Optional set of extensions to filter by
                         (e.g., {'.txt', '.pdf'})
    """
    target_path: Path
    include_hidden: bool = True  # Changed default to True
    min_size_bytes: int = 0
    output_file: Path = Path("largest_directories.txt")
    top_count: int = 50
    output_format: str = "text"
    verbose: bool = False
    error_log_file: Path = Path("no-access.txt")
    extension_filter: set | None = None

    def __post_init__(self):
        """Validate options after initialization."""
        if not self.target_path.exists():
            msg = f"Target path does not exist: {self.target_path}"
            raise ValueError(msg)

        if not self.target_path.is_dir():
            msg = f"Target path is not a directory: {self.target_path}"
            raise ValueError(msg)

        if self.top_count <= 0:
            msg = "Top count must be positive"
            raise ValueError(msg)

        if self.output_format not in ("text", "csv", "json"):
            msg = f"Invalid output format: {self.output_format}"
            raise ValueError(msg)        # Normalize extension filter to lowercase with dots
        if self.extension_filter:
            normalized_extensions = set()
            for ext in self.extension_filter:
                normalized_ext = ext.lower()
                if not normalized_ext.startswith("."):
                    normalized_ext = f".{normalized_ext}"
                normalized_extensions.add(normalized_ext)
            self.extension_filter = normalized_extensions


@dataclass
class ScanResult:
    """Results of a directory scan operation.

    Attributes:
        directories: List of scanned directory information
        total_scanned: Total number of directories processed
        error_count: Number of directories that failed to scan
        scan_duration: Time taken for the scan in seconds
        scan_options: Options used for the scan
        statistics: Comprehensive scan statistics
    """
    directories: list[DirectoryInfo]
    total_scanned: int
    error_count: int
    scan_duration: float
    scan_options: ScanOptions
    statistics: ScanStatistics | None = None

    @property
    def success_rate(self) -> float:
        """Calculate the success rate of the scan."""
        if self.total_scanned == 0:
            return 0.0
        return (self.total_scanned - self.error_count) / self.total_scanned

    @property
    def largest_directories(self) -> list[DirectoryInfo]:
        """Get directories sorted by size (largest first)."""
        return sorted(
            [d for d in self.directories if not d.has_error],
            key=lambda x: x.size_bytes,
            reverse=True
        )

    @property
    def top_directories(self) -> list[DirectoryInfo]:
        """Get top N directories based on scan options."""
        return self.largest_directories[:self.scan_options.top_count]

    def get_directories_above_threshold(self, min_size: int) -> list[DirectoryInfo]:
        """Get directories above a certain size threshold."""
        return [d for d in self.largest_directories if d.size_bytes >= min_size]

    def get_directories_with_percentages(self) -> list[dict[str, Any]]:
        """Get directories with size percentages of total.

        Returns:
            List of dictionaries with directory info and percentages
        """
        if not self.statistics or self.statistics.total_size_bytes == 0:
            return []

        total_size = self.statistics.total_size_bytes
        results = []

        for directory in self.largest_directories:
            percentage = (directory.size_bytes / total_size) * 100

            results.append({
                "directory": directory,
                "percentage": percentage,
                "percentage_formatted": self._format_percentage(percentage)
            })

        return results

    def _format_percentage(self, percentage: float) -> str:
        """Format percentage with proper precision."""
        if percentage < MINIMUM_PERCENTAGE_DISPLAY:
            return f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%"
        return f"{percentage:.2f}%"


@dataclass
class FileInfo:
    """Individual file information for classification and analysis.

    Attributes:
        path: Absolute path to the file
        size_bytes: File size in bytes
        extension: File extension (lowercase, with dot)
        category: Content classification category
        mime_type: MIME type if available
    """
    path: Path
    size_bytes: int
    extension: str
    category: str
    mime_type: str | None = None


@dataclass
class ContentCategory:
    """File content classification information.

    Attributes:
        primary: Primary category (images, videos, audio, etc.)
        secondary: Optional subcategory for detailed classification
        display_name: Human-readable category name
    """
    primary: str
    secondary: str | None = None
    display_name: str = ""


@dataclass
class ScanStatistics:
    """Comprehensive statistics for entire scan operation.

    Attributes:
        total_directories: Total number of directories scanned
        total_files: Total number of files found
        total_size_bytes: Total size of all files in bytes
        scan_duration: Time taken for scan in seconds
        category_breakdown: Size breakdown by content category
        file_count_by_category: File count breakdown by category
    """
    total_directories: int
    total_files: int
    total_size_bytes: int
    scan_duration: float
    category_breakdown: dict[str, int]
    file_count_by_category: dict[str, int]

    @property
    def total_size_human_readable(self) -> str:
        """Return human-readable total size string."""
        size = float(self.total_size_bytes)
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < BYTES_PER_KB:
                if unit == "B":
                    return f"{int(size)} {unit}"
                return f"{size:.1f} {unit}"
            size /= BYTES_PER_KB
        return f"{size:.1f} PB"


@dataclass
class EnhancedDirectoryInfo:
    """Extended directory information with file classification and percentage analysis.

    Attributes:
        base_info: Original DirectoryInfo data
        files: List of individual files in directory
        category_breakdown: Size breakdown by content category
        dominant_category: Most common content type in directory
        percentage_of_total: Percentage of total scan size    """
    base_info: DirectoryInfo
    files: list[FileInfo]
    category_breakdown: dict[str, int]
    dominant_category: str
    percentage_of_total: float

    @property
    def path(self) -> Path:
        """Directory path."""
        return self.base_info.path

    @property
    def size_bytes(self) -> int:
        """Directory size in bytes."""
        return self.base_info.size_bytes

    @property
    def size_human_readable(self) -> str:
        """Human-readable size."""
        return self.base_info.size_human_readable

    @property
    def file_count(self) -> int:
        """Number of files in directory."""
        return self.base_info.file_count

    @property
    def has_error(self) -> bool:
        """Check if directory had scanning errors."""
        return self.base_info.has_error

    def format_percentage(self) -> str:
        """Format percentage with proper precision."""
        if self.percentage_of_total < MINIMUM_PERCENTAGE_DISPLAY:
            return f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%"
        return f"{self.percentage_of_total:.2f}%"
