"""
CLI entry point for Directory Analyzer.

Handles argument parsing and orchestrates the scanning and reporting workflow.
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime
from .models import ScanOptions, ScanResult
from .scanner import DirectoryScanner
from .utils import setup_logging
from . import __version__, __author__


def parse_args():
    parser = argparse.ArgumentParser(description="Find the largest directories (by direct file size) on your disk.")
    parser.add_argument("--version", action="version", version=f"Directory Analyzer {__version__} by {__author__}")
    parser.add_argument("target", type=str, help="Target directory to scan")
    parser.add_argument("--output-file", "-o", type=str, default="largest_directories.txt", help="Output file for full results")
    parser.add_argument("--top-count", "-t", type=int, default=50, help="Number of top results to show in terminal")
    parser.add_argument("--include-hidden", action="store_true", help="Include hidden directories")
    parser.add_argument("--min-size", type=int, default=0, help="Minimum size (bytes) to include")
    parser.add_argument("--format", choices=["text", "csv", "json"], default="text", help="Output file format")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    parser.add_argument("--no-parallel", action="store_true", help="Disable parallel scanning")
    return parser.parse_args()


def main():
    args = parse_args()
    setup_logging(args.verbose)

    try:
        options = ScanOptions(
            target_path=Path(args.target).resolve(),
            include_hidden=args.include_hidden,
            min_size_bytes=args.min_size,
            output_file=Path(args.output_file).resolve(),
            top_count=args.top_count,
            output_format=args.format,
            verbose=args.verbose
        )
    except ValueError as e:
        print(f"Error: {e}")
        return 1

    scanner = DirectoryScanner(options)
    
    try:
        start_time = datetime.now()
        results = scanner.scan(use_parallel=not args.no_parallel)
        duration = (datetime.now() - start_time).total_seconds()
    except KeyboardInterrupt:
        print("\nScan interrupted by user.")
        return 1
    except Exception as e:
        print(f"Error during scanning: {e}")
        return 1

    scan_result = ScanResult(
        directories=results,
        total_scanned=len(results),
        error_count=sum(1 for d in results if d.has_error),
        scan_duration=duration,
        scan_options=options
    )

    # Print top N to terminal
    print(f"\nTop {options.top_count} largest directories (by direct file size):")
    for idx, d in enumerate(scan_result.top_directories, 1):
        print(f"{idx:3d}. {d.path} - {d.size_human_readable} ({d.file_count} files)")

    # Write full results to file
    try:
        from .reporter import write_results
        write_results(scan_result)
        print(f"\nFull results written to: {options.output_file}")
    except Exception as e:
        print(f"Error writing results to file: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
