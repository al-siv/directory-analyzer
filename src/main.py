"""
CLI entry point    parser = argparse.ArgumentParser(
        description=(
            "Professional-grade personal storage analytics tool for power users."
        )
    )r Directory Analyzer.

Handles argument parsing and orchestrates the scanning and reporting workflow.
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import __author__, __version__
from .models import ScanOptions, ScanResult
from .reporter import format_terminal_output, write_results
from .scanner import DirectoryScanner
from .utils import setup_logging


def parse_args():
    parser = argparse.ArgumentParser(
        description="Professional-grade personal storage analytics tool."
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"Directory Analyzer {__version__} by {__author__}",
    )
    parser.add_argument("target", type=str, help="Target directory to scan")
    parser.add_argument(
        "--output-file",
        "-o",
        type=str,
        default="largest_directories.txt",
        help="Output file for full results",
    )
    parser.add_argument(
        "--top-count",
        "-t",
        type=int,
        default=50,
        help="Number of top results to show in terminal",
    )
    parser.add_argument(
        "--no-hidden",
        action="store_true",
        help="Exclude hidden directories (default: include hidden)",
    )
    parser.add_argument(
        "--min-size",
        type=float,
        default=0,
        help="Minimum size in megabytes (MB) to include",
    )
    parser.add_argument(
        "--format",
        choices=["text", "csv", "json"],
        default="text",
        help="Output file format",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--no-access-log",
        type=str,
        default="no-access.txt",
        help="File to log inaccessible directories",
    )
    parser.add_argument(
        "--extensions",
        type=str,
        nargs="+",
        help="Filter by file extensions (e.g., --extensions .pdf .txt .doc)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    setup_logging(args.verbose)

    try:
        # Convert MB to bytes for internal use
        min_size_bytes = int(args.min_size * 1024 * 1024) if args.min_size > 0 else 0

        # Process extension filter
        extension_filter = None
        if args.extensions:
            extension_filter = set(args.extensions)

        options = ScanOptions(
            target_path=Path(args.target).resolve(),
            # Inverted logic: default is include hidden
            include_hidden=not args.no_hidden,
            min_size_bytes=min_size_bytes,
            output_file=Path(args.output_file).resolve(),
            top_count=args.top_count,
            output_format=args.format,
            verbose=args.verbose,
            error_log_file=Path(args.no_access_log).resolve(),
            extension_filter=extension_filter,
        )
    except ValueError as e:
        print(f"Error: {e}")
        return 1

    scanner = DirectoryScanner(options)

    try:
        start_time = datetime.now(timezone.utc)
        results = scanner.scan(use_parallel=True)  # Always use parallel processing
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Create comprehensive statistics
        statistics = scanner.create_scan_statistics(results, duration)

    except KeyboardInterrupt:
        print("\nScan interrupted by user.")
        return 1
    except (OSError, PermissionError, ValueError) as e:
        print(f"Error during scanning: {e}")
        return 1

    scan_result = ScanResult(
        directories=results,
        total_scanned=scanner.total_directories,
        error_count=len(scanner.error_directories),
        scan_duration=duration,
        scan_options=options,
        statistics=statistics
    )

    # Use professional terminal output formatting
    try:
        format_terminal_output(scan_result)
    except (OSError, ValueError) as e:
        print(f"Error formatting terminal output: {e}")
        # Fallback to simple output
        print(f"\nTop {options.top_count} largest directories (by direct file size):")
        for idx, d in enumerate(scan_result.top_directories, 1):
            size_info = f"{d.size_human_readable} ({d.file_count} files)"
            print(f"{idx:3d}. {d.path} - {size_info}")

    # Write full results to file
    try:
        write_results(scan_result)
        print(f"\nFull results written to: {options.output_file}")
    except (OSError, PermissionError, ValueError) as e:
        print(f"Error writing results to file: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
