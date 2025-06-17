"""
Data models for the Directory Analyzer.

This module defines the core data structures used throughout the application.
"""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional


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
    error_message: Optional[str] = None
    
    @property
    def size_human_readable(self) -> str:
        """Return human-readable size string."""
        size = float(self.size_bytes)
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                if unit == 'B':
                    return f"{int(size)} {unit}"
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"
    
    @property
    def has_error(self) -> bool:
        """Check if this directory had scanning errors."""
        return self.error_message is not None
    
    def __str__(self) -> str:
        """String representation for display."""
        error_suffix = f" (ERROR: {self.error_message})" if self.has_error else ""
        return f"{self.path}: {self.size_human_readable} ({self.file_count} files){error_suffix}"


@dataclass
class ScanOptions:
    """Configuration options for directory scanning.
    
    Attributes:
        target_path: Root directory to scan
        include_hidden: Whether to include hidden directories
        min_size_bytes: Minimum size threshold for inclusion
        output_file: Path for complete results output
        top_count: Number of top results to show in terminal
        output_format: Format for file output ('text', 'csv', 'json')
        verbose: Enable verbose progress output
    """
    target_path: Path
    include_hidden: bool = False
    min_size_bytes: int = 0
    output_file: Path = Path("largest_directories.txt")
    top_count: int = 50
    output_format: str = "text"
    verbose: bool = False
    
    def __post_init__(self):
        """Validate options after initialization."""
        if not self.target_path.exists():
            raise ValueError(f"Target path does not exist: {self.target_path}")
        
        if not self.target_path.is_dir():
            raise ValueError(f"Target path is not a directory: {self.target_path}")
        
        if self.top_count <= 0:
            raise ValueError("Top count must be positive")
        
        if self.output_format not in ('text', 'csv', 'json'):
            raise ValueError(f"Invalid output format: {self.output_format}")


@dataclass
class ScanResult:
    """Results of a directory scan operation.
    
    Attributes:
        directories: List of scanned directory information
        total_scanned: Total number of directories processed
        error_count: Number of directories that failed to scan
        scan_duration: Time taken for the scan in seconds
        scan_options: Options used for the scan
    """
    directories: list[DirectoryInfo]
    total_scanned: int
    error_count: int
    scan_duration: float
    scan_options: ScanOptions
    
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
