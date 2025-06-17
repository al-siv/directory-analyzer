"""
Reporting utilities for Directory Analyzer.

Handles formatting and writing scan results to file in various formats.
"""
import json
import csv
from .models import ScanResult

def write_results(scan_result: ScanResult):
    options = scan_result.scan_options
    output_path = options.output_file
    fmt = options.output_format
    directories = scan_result.largest_directories

    if fmt == "text":
        with open(output_path, "w", encoding="utf-8") as f:
            for idx, d in enumerate(directories, 1):
                f.write(f"{idx:4d}. {d.path} - {d.size_human_readable} ({d.file_count} files)\n")
    elif fmt == "csv":
        with open(output_path, "w", newline='', encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Rank", "Path", "Size (bytes)", "Size (HR)", "File Count"])
            for idx, d in enumerate(directories, 1):
                writer.writerow([idx, d.path, d.size_bytes, d.size_human_readable, d.file_count])
    elif fmt == "json":
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump([
                {
                    "rank": idx,
                    "path": str(d.path),
                    "size_bytes": d.size_bytes,
                    "size_human": d.size_human_readable,
                    "file_count": d.file_count
                }
                for idx, d in enumerate(directories, 1)
            ], f, indent=2, ensure_ascii=False)
    else:
        raise ValueError(f"Unknown output format: {fmt}")
