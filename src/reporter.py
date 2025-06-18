"""
Reporting utilities for Directory Analyzer.

Handles formatting and writing scan results to file in various formats with
professional-grade analytics including percentage analysis and content classification.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import TYPE_CHECKING

from .constants import BYTES_PER_KB, MINIMUM_PERCENTAGE_DISPLAY

if TYPE_CHECKING:

    from .models import ScanResult, ScanStatistics


def format_terminal_output(scan_result: ScanResult) -> None:
    """Display professional-grade terminal output with summary statistics.

    Args:
        scan_result: Complete scan results with statistics
    """
    options = scan_result.scan_options
    stats = scan_result.statistics

    # Display header with tool information
    print("\n" + "="*80)
    print("Directory Analyzer - Personal Storage Analytics Tool")
    print("="*80)

    # Summary statistics
    if stats:
        print("\nScan Summary:")
        print(f"  Target Path:        {options.target_path}")
        print(f"  Total Directories:  {stats.total_directories:,}")
        print(f"  Total Files:        {stats.total_files:,}")
        print(f"  Total Size:         {stats.total_size_human_readable}")
        print(f"  Scan Duration:      {stats.scan_duration:.2f}s")

        if scan_result.error_count > 0:
            print(f"  Access Errors:      {scan_result.error_count} directories "
                  f"(permission denied)")
            print(f"  Success Rate:       {scan_result.success_rate:.1%}")
            if not options.verbose:
                print("  Note:               Use --verbose to see individual "
                      "access errors")

    # Top directories with percentages
    print(f"\nTop {options.top_count} Largest Directories (by direct file size):")
    print("-" * 80)

    total_size = (
        stats.total_size_bytes
        if stats
        else sum(d.size_bytes for d in scan_result.directories)
    )

    for idx, directory in enumerate(scan_result.top_directories, 1):
        if total_size > 0:
            percentage = (directory.size_bytes / total_size) * 100
            percentage_str = (
                f"{percentage:5.2f}%"
                if percentage >= MINIMUM_PERCENTAGE_DISPLAY
                else f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%"
            )
        else:
            percentage_str = " 0.00%"

        print(f"{idx:3d}. {directory.size_human_readable:>8} "
              f"({percentage_str}) - {directory.path}")
        if directory.file_count > 0:
            print(f"     {directory.file_count:,} files")

    # Content type breakdown
    if stats and stats.category_breakdown:
        print("\nContent Type Breakdown:")
        print("-" * 50)

        # Sort categories by size (largest first)
        sorted_categories = sorted(
            stats.category_breakdown.items(),
            key=lambda x: x[1],
            reverse=True
        )

        for category, size_bytes in sorted_categories:
            if size_bytes > 0:
                percentage = (size_bytes / total_size) * 100 if total_size > 0 else 0
                percentage_str = (
                    f"{percentage:5.2f}%"
                    if percentage >= MINIMUM_PERCENTAGE_DISPLAY
                    else f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%"
                )                # Format size
                size = float(size_bytes)
                size_str = ""
                for unit in ["B", "KB", "MB", "GB", "TB"]:
                    if size < BYTES_PER_KB:
                        size_str = (f"{size:.1f} {unit}" if unit != "B"
                                   else f"{int(size)} {unit}")
                        break
                    size = size / BYTES_PER_KB
                else:
                    size_str = f"{size:.1f} PB"

                # Get file count for category
                file_count = stats.file_count_by_category.get(category, 0)

                print(f"  {_get_category_display_name(category):<20} "
                      f"{size_str:>10} ({percentage_str}) - {file_count:,} files")


def write_results(scan_result: ScanResult):
    """Write comprehensive scan results to file with enhanced analytics.

    Args:
        scan_result: Complete scan results including statistics
    """
    options = scan_result.scan_options
    output_path = options.output_file
    fmt = options.output_format
    directories = scan_result.largest_directories
    stats = scan_result.statistics

    if fmt == "text":
        _write_text_results(output_path, scan_result)
    elif fmt == "csv":
        _write_csv_results(output_path, directories, stats)
    elif fmt == "json":
        _write_json_results(output_path, scan_result)
    else:
        msg = f"Unknown output format: {fmt}"
        raise ValueError(msg)


def _write_text_results(output_path, scan_result: ScanResult):
    """Write comprehensive text format results."""
    with Path(output_path).open("w", encoding="utf-8") as f:
        stats = scan_result.statistics
        options = scan_result.scan_options

        # Header
        f.write("Directory Analyzer - Personal Storage Analytics Report\n")
        f.write("=" * 60 + "\n\n")

        # Summary statistics
        if stats:
            f.write("Scan Summary:\n")
            f.write(f"  Target Path:        {options.target_path}\n")
            f.write(f"  Total Directories:  {stats.total_directories:,}\n")
            f.write(f"  Total Files:        {stats.total_files:,}\n")
            f.write(f"  Total Size:         {stats.total_size_human_readable}\n")
            f.write(f"  Scan Duration:      {stats.scan_duration:.2f}s\n")

            if scan_result.error_count > 0:
                f.write(f"  Access Errors:      {scan_result.error_count}\n")
                f.write(f"  Success Rate:       {scan_result.success_rate:.1%}\n")
            f.write("\n")

        # Directory listings with percentages
        f.write("Directory Listing (sorted by size):\n")
        f.write("-" * 60 + "\n")

        total_size = stats.total_size_bytes if stats else sum(d.size_bytes for d in scan_result.directories)

        for idx, d in enumerate(scan_result.directories, 1):
            percentage = (d.size_bytes / total_size) * 100 if total_size > 0 else 0
            percentage_str = (f"{percentage:.2f}%" if percentage >= MINIMUM_PERCENTAGE_DISPLAY
                             else f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%")

            f.write(f"{idx:4d}. {d.size_human_readable:>8} ({percentage_str:>6}) - {d.path} ({d.file_count:,} files)\n")

        # Content type breakdown
        if stats and stats.category_breakdown:
            f.write("\nContent Type Analysis:\n")
            f.write("-" * 60 + "\n")

            sorted_categories = sorted(
                stats.category_breakdown.items(),
                key=lambda x: x[1],
                reverse=True
            )

            for category, size_bytes in sorted_categories:
                if size_bytes > 0:
                    percentage = (size_bytes / total_size) * 100 if total_size > 0 else 0
                    percentage_str = (
                        f"{percentage:.2f}%"
                        if percentage >= MINIMUM_PERCENTAGE_DISPLAY
                        else f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%"
                    )
                      # Format size
                    size = float(size_bytes)
                    size_str = ""
                    for unit in ["B", "KB", "MB", "GB", "TB"]:
                        if size < BYTES_PER_KB:
                            size_str = f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} {unit}"
                            break
                        size = size / BYTES_PER_KB
                    else:
                        size_str = f"{size:.1f} PB"

                    file_count = stats.file_count_by_category.get(category, 0)
                    f.write(f"  {_get_category_display_name(category):<20} {size_str:>10} ({percentage_str:>6}) - {file_count:,} files\n")


def _write_csv_results(
    output_path, directories: list, stats: ScanStatistics | None
):
    """Write CSV format results with enhanced data."""
    with Path(output_path).open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # Write summary header
        if stats:
            writer.writerow(["# Directory Analyzer Results"])
            writer.writerow(["# Total Directories", stats.total_directories])
            writer.writerow(["# Total Files", stats.total_files])
            writer.writerow(["# Total Size (bytes)", stats.total_size_bytes])
            writer.writerow(["# Scan Duration (seconds)", f"{stats.scan_duration:.2f}"])
            writer.writerow([])  # Empty row

        # Directory data
        writer.writerow(["Rank", "Path", "Size (bytes)", "Size (HR)", "Percentage", "File Count"])

        total_size = stats.total_size_bytes if stats else sum(d.size_bytes for d in directories)

        for idx, d in enumerate(directories, 1):
            percentage = (d.size_bytes / total_size) * 100 if total_size > 0 else 0
            percentage_str = (f"{percentage:.2f}%" if percentage >= MINIMUM_PERCENTAGE_DISPLAY
                             else f"<{MINIMUM_PERCENTAGE_DISPLAY:.2f}%")

            writer.writerow([
                idx,
                str(d.path),
                d.size_bytes,
                d.size_human_readable,
                percentage_str,
                d.file_count
            ])


def _write_json_results(output_path, scan_result: ScanResult):
    """Write comprehensive JSON format results."""
    stats = scan_result.statistics
    total_size = stats.total_size_bytes if stats else sum(d.size_bytes for d in scan_result.directories)

    result_data = {
        "summary": {
            "target_path": str(scan_result.scan_options.target_path),
            "total_directories": stats.total_directories if stats else len(scan_result.directories),
            "total_files": stats.total_files if stats else 0,
            "total_size_bytes": total_size,
            "total_size_human": stats.total_size_human_readable if stats else "Unknown",
            "scan_duration": stats.scan_duration if stats else 0,
            "error_count": scan_result.error_count,
            "success_rate": scan_result.success_rate
        },
        "directories": [],
        "content_analysis": {}
    }

    # Directory data with percentages
    for idx, d in enumerate(scan_result.directories, 1):
        percentage = (d.size_bytes / total_size) * 100 if total_size > 0 else 0

        result_data["directories"].append({
            "rank": idx,
            "path": str(d.path),
            "size_bytes": d.size_bytes,
            "size_human": d.size_human_readable,
            "percentage": round(percentage, 2),
            "file_count": d.file_count,
            "has_error": d.has_error,
            "error_message": d.error_message
        })

    # Content type analysis
    if stats and stats.category_breakdown:
        for category, size_bytes in stats.category_breakdown.items():
            if size_bytes > 0:
                percentage = (size_bytes / total_size) * 100 if total_size > 0 else 0
                file_count = stats.file_count_by_category.get(category, 0)

                result_data["content_analysis"][category] = {
                    "size_bytes": size_bytes,
                    "percentage": round(percentage, 2),
                    "file_count": file_count,
                    "display_name": _get_category_display_name(category)
                }

    with Path(output_path).open("w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2, ensure_ascii=False)


def _get_category_display_name(category: str) -> str:
    """Get human-readable display name for content category."""
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
