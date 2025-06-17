"""
Directory scanning functionality for the Directory Analyzer.

This module handles the core logic for traversing directories and calculating sizes.
"""

__all__ = ['DirectoryScanner', 'estimate_directory_count']

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Iterator, List

from .models import DirectoryInfo, ScanOptions
from .utils import (
    get_direct_files,
    get_subdirectories,
    is_accessible_directory,
    safe_get_file_size,
    ProgressReporter
)


class DirectoryScanner:
    """Handles scanning directories and calculating sizes."""
    
    def __init__(self, options: ScanOptions):
        """Initialize the scanner with configuration options.
        
        Args:
            options: Scanning configuration options
        """
        self.options = options
        self.logger = logging.getLogger(__name__)
        
    def scan_single_directory(self, directory: Path) -> DirectoryInfo:
        """Scan a single directory and calculate its direct file size.
        
        Args:
            directory: Directory path to scan
            
        Returns:
            DirectoryInfo with calculated size and file count
        """
        scan_time = datetime.now()
        
        try:
            if not is_accessible_directory(directory):
                return DirectoryInfo(
                    path=directory,
                    size_bytes=0,
                    file_count=0,
                    last_scanned=scan_time,
                    error_message="Permission denied or directory inaccessible"
                )
            
            total_size = 0
            file_count = 0
            
            # Calculate size of direct files only
            for file_path in get_direct_files(directory):
                file_size = safe_get_file_size(file_path)
                total_size += file_size
                file_count += 1
            
            return DirectoryInfo(
                path=directory,
                size_bytes=total_size,
                file_count=file_count,
                last_scanned=scan_time
            )
            
        except Exception as e:
            self.logger.warning(f"Error scanning directory {directory}: {e}")
            return DirectoryInfo(
                path=directory,
                size_bytes=0,
                file_count=0,
                last_scanned=scan_time,
                error_message=str(e)
            )
    
    def get_all_directories(self, root_path: Path) -> Iterator[Path]:
        """Recursively get all directories under the root path.
        
        Args:
            root_path: Root directory to start scanning from
            
        Yields:
            Path objects for all directories found
        """
        # Include the root directory itself
        yield root_path
        
        # Recursively find all subdirectories
        try:
            for subdirectory in get_subdirectories(root_path, self.options.include_hidden):
                yield from self.get_all_directories(subdirectory)
        except Exception as e:
            self.logger.warning(f"Error traversing directory {root_path}: {e}")
    
    def scan_directories_sequential(self) -> List[DirectoryInfo]:
        """Scan all directories sequentially.
        
        Returns:
            List of DirectoryInfo objects
        """
        results = []
        
        if self.options.verbose:
            print(f"Starting sequential scan of {self.options.target_path}")
        
        # Get all directories first to show progress
        all_directories = list(self.get_all_directories(self.options.target_path))
        total_dirs = len(all_directories)
        
        progress = None
        if self.options.verbose:
            progress = ProgressReporter(total_dirs, "Scanning directories")
        
        for directory in all_directories:
            result = self.scan_single_directory(directory)
            
            # Apply size filter
            if result.size_bytes >= self.options.min_size_bytes:
                results.append(result)
            
            if progress:
                progress.update()
        
        if progress:
            progress.finish()
            print(f"Scanned {total_dirs} directories, {len(results)} meet size criteria")
        
        return results
    
    def scan_directories_parallel(self, max_workers: int = 4) -> List[DirectoryInfo]:
        """Scan directories in parallel using thread pool.
        
        Args:
            max_workers: Maximum number of worker threads
            
        Returns:
            List of DirectoryInfo objects
        """
        results = []
        
        if self.options.verbose:
            print(f"Starting parallel scan of {self.options.target_path} with {max_workers} workers")
        
        # Get all directories first
        all_directories = list(self.get_all_directories(self.options.target_path))
        total_dirs = len(all_directories)
        
        progress = None
        if self.options.verbose:
            progress = ProgressReporter(total_dirs, "Scanning directories")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all scanning tasks
            future_to_directory = {
                executor.submit(self.scan_single_directory, directory): directory
                for directory in all_directories
            }
            
            # Process results as they complete
            for future in as_completed(future_to_directory):
                try:
                    result = future.result()
                    
                    # Apply size filter
                    if result.size_bytes >= self.options.min_size_bytes:
                        results.append(result)
                    
                    if progress:
                        progress.update()
                        
                except Exception as e:
                    directory = future_to_directory[future]
                    self.logger.error(f"Error processing directory {directory}: {e}")
                    
                    if progress:
                        progress.update()
        
        if progress:
            progress.finish()
            print(f"Scanned {total_dirs} directories, {len(results)} meet size criteria")
        
        return results
    
    def scan(self, use_parallel: bool = True, max_workers: int = 4) -> List[DirectoryInfo]:
        """Scan directories and return results.
        
        Args:
            use_parallel: Whether to use parallel processing
            max_workers: Maximum number of worker threads for parallel processing
            
        Returns:
            List of DirectoryInfo objects sorted by size (largest first)
        """
        self.logger.info(f"Starting directory scan of {self.options.target_path}")
        
        try:
            if use_parallel and max_workers > 1:
                results = self.scan_directories_parallel(max_workers)
            else:
                results = self.scan_directories_sequential()
            
            # Sort by size (largest first)
            results.sort(key=lambda x: x.size_bytes, reverse=True)
            
            self.logger.info(f"Scan completed. Found {len(results)} directories.")
            return results
            
        except KeyboardInterrupt:
            self.logger.info("Scan interrupted by user")
            raise
        except Exception as e:
            self.logger.error(f"Scan failed: {e}")
            raise


def estimate_directory_count(path: Path, max_depth: int = 3) -> int:
    """Estimate the total number of directories under a path.
    
    This is used for progress reporting and resource planning.
    
    Args:
        path: Root path to estimate
        max_depth: Maximum depth to sample for estimation
        
    Returns:
        Estimated number of directories
    """
    try:
        def count_directories(current_path: Path, depth: int) -> int:
            if depth > max_depth:
                # Estimate based on current sample
                if depth == 1:
                    return 1
                # Use exponential estimation
                return int(1.5 ** (max_depth - depth + 1))
            
            count = 1  # Count current directory
            
            try:
                for item in current_path.iterdir():
                    if item.is_dir() and is_accessible_directory(item):
                        count += count_directories(item, depth + 1)
            except (PermissionError, OSError):
                # If we can't access, estimate based on typical directory structure
                return max(1, int(10 * (1.5 ** (max_depth - depth))))
            
            return count
        
        total = count_directories(path, 0)
        return max(total, 1)  # At least 1 directory
        
    except Exception:
        # Fallback estimation
        return 1000
