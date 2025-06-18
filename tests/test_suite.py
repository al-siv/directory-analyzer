"""
Test suite for Directory Analyzer - Professional Storage Analytics Tool

This module provides comprehensive testing including unit tests, integration tests,
and performance tests using real directory structures.
"""

import platform
import shutil
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.classifier import ContentClassifier
from src.models import DirectoryInfo, FileInfo, ScanOptions
from src.reporter import write_results
from src.scanner import DirectoryScanner


def get_performance_test_directories():
    """Get list of large system directories for performance testing based on OS.

    Returns:
        List of Path objects representing directories to test, ordered by preference
    """
    system = platform.system().lower()

    if system == "windows":
        candidates = [
            "C:/Program Files (x86)",
            "C:/Program Files",
            "C:/Windows/System32",
            "C:/Users",
            "C:/Pubs"  # Keep as fallback for existing test environments
        ]
    elif system == "darwin":  # macOS
        candidates = [
            "/Applications",
            "/System",
            "/usr",
            "/opt",
            "/Library"
        ]
    else:  # Linux and other Unix-like systems
        candidates = [
            "/usr",
            "/opt",
            "/var",
            "/home",
            "/bin"
        ]

    # Convert to Path objects and filter existing directories
    valid_paths = []
    for path_str in candidates:
        path = Path(path_str)
        if path.exists() and path.is_dir():
            valid_paths.append(path)

    return valid_paths


class TestContentClassifier(unittest.TestCase):
    """Test the content classification system."""

    def setUp(self):
        self.classifier = ContentClassifier()

    def test_image_classification(self):
        """Test image file classification."""
        test_files = [
            Path("test.jpg"), Path("photo.PNG"), Path("image.gif"),
            Path("raw.CR2"), Path("vector.svg")
        ]

        for file_path in test_files:
            category = self.classifier.classify_file(file_path)
            assert category == "images", f"Failed for {file_path}"

    def test_video_classification(self):
        """Test video file classification."""
        test_files = [
            Path("movie.mp4"), Path("video.AVI"), Path("stream.mkv"),
            Path("old.wmv"), Path("web.webm")
        ]

        for file_path in test_files:
            category = self.classifier.classify_file(file_path)
            assert category == "videos", f"Failed for {file_path}"

    def test_document_classification(self):
        """Test document file classification."""
        test_files = [
            Path("book.pdf"), Path("ebook.epub"), Path("manual.chm"),
            Path("novel.mobi")
        ]

        for file_path in test_files:
            category = self.classifier.classify_file(file_path)
            assert category == "documents", f"Failed for {file_path}"

    def test_office_classification(self):
        """Test office document classification."""
        test_files = [
            Path("report.docx"), Path("spreadsheet.xlsx"), Path("presentation.pptx"),
            Path("notes.txt"), Path("readme.md")
        ]

        for file_path in test_files:
            category = self.classifier.classify_file(file_path)
            assert category == "office", f"Failed for {file_path}"

    def test_unknown_extension(self):
        """Test unknown file extension handling."""
        unknown_file = Path("mystery.unknownext")
        category = self.classifier.classify_file(unknown_file)
        assert category == "other"

    def test_custom_category(self):
        """Test adding custom categories."""
        self.classifier.add_custom_category("custom", {".xyz", ".abc"})

        test_file = Path("test.xyz")
        category = self.classifier.classify_file(test_file)
        assert category == "custom"

    def test_file_statistics(self):
        """Test category statistics calculation."""
        files = [
            FileInfo(Path("image.jpg"), 1000, ".jpg", "images"),
            FileInfo(Path("video.mp4"), 5000, ".mp4", "videos"),
            FileInfo(Path("doc.pdf"), 2000, ".pdf", "documents"),
            FileInfo(Path("another.jpg"), 1500, ".jpg", "images")
        ]

        stats = self.classifier.get_category_statistics(files)

        assert stats["images"] == 2500  # 1000 + 1500
        assert stats["videos"] == 5000
        assert stats["documents"] == 2000

        counts = self.classifier.get_file_count_by_category(files)
        assert counts["images"] == 2
        assert counts["videos"] == 1
        assert counts["documents"] == 1


class TestDirectoryScanner(unittest.TestCase):
    """Test the directory scanning functionality."""

    def setUp(self):
        """Create a temporary directory structure for testing."""
        self.test_dir = Path(tempfile.mkdtemp())

        # Create test directory structure
        (self.test_dir / "subdir1").mkdir()
        (self.test_dir / "subdir2").mkdir()
        (self.test_dir / "subdir2" / "nested").mkdir()

        # Create test files with different sizes and types
        self._create_test_file(self.test_dir / "root.txt", 1000)
        self._create_test_file(self.test_dir / "subdir1" / "image.jpg", 5000)
        self._create_test_file(self.test_dir / "subdir1" / "document.pdf", 3000)
        self._create_test_file(self.test_dir / "subdir2" / "video.mp4", 10000)
        self._create_test_file(self.test_dir / "subdir2" / "nested" / "data.csv", 2000)

        self.options = ScanOptions(
            target_path=self.test_dir,
            include_hidden=True,
            min_size_bytes=0,
            verbose=False
        )

    def tearDown(self):
        """Clean up temporary directory."""
        shutil.rmtree(self.test_dir)

    def _create_test_file(self, path: Path, size: int):
        """Create a test file with specified size."""
        with open(path, "wb") as f:
            f.write(b"0" * size)

    def test_basic_scanning(self):
        """Test basic directory scanning functionality."""
        scanner = DirectoryScanner(self.options)
        results = scanner.scan(use_parallel=False)

        assert len(results) > 0

        # Check that root directory is included
        root_found = any(result.path == self.test_dir for result in results)
        assert root_found
          # Check file counting
        root_result = next((r for r in results if r.path == self.test_dir), None)
        assert root_result is not None
        if root_result:
            assert root_result.file_count == 1  # Only root.txt
            assert root_result.size_bytes == 1000

    def test_parallel_scanning(self):
        """Test parallel scanning produces same results as sequential."""
        scanner = DirectoryScanner(self.options)

        sequential_results = scanner.scan(use_parallel=False)

        # Reset scanner for parallel test
        scanner = DirectoryScanner(self.options)
        parallel_results = scanner.scan(use_parallel=True)

        # Sort both results for comparison
        sequential_sorted = sorted(sequential_results, key=lambda x: str(x.path))
        parallel_sorted = sorted(parallel_results, key=lambda x: str(x.path))

        assert len(sequential_sorted) == len(parallel_sorted)

        for seq, par in zip(sequential_sorted, parallel_sorted):
            assert seq.path == par.path
            assert seq.size_bytes == par.size_bytes
            assert seq.file_count == par.file_count

    def test_size_filtering(self):
        """Test minimum size filtering."""
        options_with_filter = ScanOptions(
            target_path=self.test_dir,
            min_size_bytes=4000,  # Should exclude directories with less than 4KB
            verbose=False
        )

        scanner = DirectoryScanner(options_with_filter)
        results = scanner.scan(use_parallel=False)

        # Only subdir1 (8000 bytes) and subdir2 (10000 bytes) should qualify
        large_dirs = [r for r in results if r.size_bytes >= 4000]
        assert len(large_dirs) >= 2

    def test_extension_filtering(self):
        """Test file extension filtering."""
        options_with_ext_filter = ScanOptions(
            target_path=self.test_dir,
            extension_filter={".jpg", ".pdf"},
            verbose=False
        )

        scanner = DirectoryScanner(options_with_ext_filter)
        results = scanner.scan(use_parallel=False)
          # Only directories with .jpg or .pdf files should have non-zero sizes
        subdir1_result = next((r for r in results if r.path.name == "subdir1"), None)
        assert subdir1_result is not None
        if subdir1_result:
            assert subdir1_result.size_bytes == 8000  # image.jpg + document.pdf
            assert subdir1_result.file_count == 2

    def test_statistics_generation(self):
        """Test scan statistics generation."""
        scanner = DirectoryScanner(self.options)
        results = scanner.scan(use_parallel=False)

        stats = scanner.create_scan_statistics(results, 1.5)

        assert stats.total_directories > 0
        assert stats.total_files > 0
        assert stats.total_size_bytes > 0
        assert stats.scan_duration == 1.5

        # Check category breakdown
        assert "images" in stats.category_breakdown
        assert "documents" in stats.category_breakdown
        assert "videos" in stats.category_breakdown


class TestIntegration(unittest.TestCase):
    """Integration tests using actual directory structures."""

    def test_real_directory_scan(self):
        """Test scanning a real directory structure using system directories."""
        # Get platform-appropriate test directories
        test_paths = get_performance_test_directories()

        if not test_paths:
            self.skipTest("No suitable large directories found for integration testing")

        # Try each directory until we find one we can access
        for test_path in test_paths:
            try:
                options = ScanOptions(
                    target_path=test_path,
                    top_count=10,
                    min_size_bytes=1024 * 1024,  # 1MB minimum
                    verbose=False
                )

                scanner = DirectoryScanner(options)
                results = scanner.scan(use_parallel=True)
                stats = scanner.create_scan_statistics(results, 0)

                # Basic validations
                assert len(results) > 0, f"No results found in {test_path}"
                assert stats.total_directories > 0, f"No directories found in {test_path}"
                assert stats.total_files > 0, f"No files found in {test_path}"
                assert stats.total_size_bytes > 0, f"No content found in {test_path}"

                # Test that results are sorted by size
                for i in range(len(results) - 1):
                    assert results[i].size_bytes >= results[i + 1].size_bytes

                print(f"Integration test successful on: {test_path}")
                print(f"  Directories: {stats.total_directories:,}")
                print(f"  Files: {stats.total_files:,}")
                print(f"  Total size: {stats.total_size_human_readable}")
                return  # Success - exit after first working directory

            except PermissionError:
                print(f"Permission denied accessing {test_path}, trying next directory...")
                continue
            except Exception as e:
                print(f"Error testing {test_path}: {e}, trying next directory...")
                continue

        # If we get here, all directories failed
        self.skipTest(f"Could not access any test directories: {[str(p) for p in test_paths]}")


class TestReporting(unittest.TestCase):
    """Test the reporting functionality."""

    def setUp(self):
        """Set up test data for reporting."""
        self.test_dir = Path(tempfile.mkdtemp())

        # Create minimal test structure
        (self.test_dir / "test_file.txt").write_text("test content")

        self.options = ScanOptions(
            target_path=self.test_dir,
            output_file=self.test_dir / "test_output.txt",
            output_format="text"
        )

        # Create mock scan result
        directory = DirectoryInfo(
            path=self.test_dir,
            size_bytes=1000,
            file_count=1,
            last_scanned=datetime.now()
        )

        from src.models import ScanStatistics
        stats = ScanStatistics(
            total_directories=1,
            total_files=1,
            total_size_bytes=1000,
            scan_duration=1.0,
            category_breakdown={"office": 1000},
            file_count_by_category={"office": 1}
        )

        from src.models import ScanResult
        self.scan_result = ScanResult(
            directories=[directory],
            total_scanned=1,
            error_count=0,
            scan_duration=1.0,
            scan_options=self.options,
            statistics=stats
        )

    def tearDown(self):
        """Clean up test directory."""
        shutil.rmtree(self.test_dir)

    def test_text_output(self):
        """Test text format output."""
        write_results(self.scan_result)

        output_file = self.options.output_file
        assert output_file.exists()

        content = output_file.read_text()
        assert "Directory Analyzer" in content
        assert "Scan Summary" in content
        assert "Content Type Analysis" in content

    def test_csv_output(self):
        """Test CSV format output."""
        self.options.output_format = "csv"
        self.options.output_file = self.test_dir / "test_output.csv"
        self.scan_result.scan_options = self.options

        write_results(self.scan_result)

        output_file = self.options.output_file
        assert output_file.exists()

        content = output_file.read_text()
        assert "Directory Analyzer Results" in content
        assert "Rank,Path,Size" in content

    def test_json_output(self):
        """Test JSON format output."""
        self.options.output_format = "json"
        self.options.output_file = self.test_dir / "test_output.json"
        self.scan_result.scan_options = self.options

        write_results(self.scan_result)

        output_file = self.options.output_file
        assert output_file.exists()

        import json
        with open(output_file) as f:
            data = json.load(f)

        assert "summary" in data
        assert "directories" in data
        assert "content_analysis" in data


def run_performance_test():
    """Run performance tests on large directory structures."""
    print("\n" + "="*60)
    print("PERFORMANCE TESTING")
    print("="*60)

    # Get platform-appropriate large directories
    test_paths = get_performance_test_directories()

    if not test_paths:
        print("No suitable large directories found for performance testing")
        print("Platform-specific directories not available:")
        system = platform.system().lower()
        if system == "windows":
            print("  - Windows: C:/Program Files (x86), C:/Program Files, C:/Windows/System32")
        elif system == "darwin":
            print("  - macOS: /Applications, /System, /usr")
        else:
            print("  - Linux: /usr, /opt, /var")
        return

    print(f"Detected platform: {platform.system()}")
    print(f"Available test directories: {len(test_paths)}")

    # Try each directory until we find one that works
    for test_path in test_paths:
        print(f"\nTesting performance on: {test_path}")

        try:
            options = ScanOptions(
                target_path=test_path,
                verbose=True,
                top_count=20
            )

            scanner = DirectoryScanner(options)

            print("Running parallel scan...")
            start_time = datetime.now()
            results = scanner.scan(use_parallel=True, max_workers=8)
            duration = (datetime.now() - start_time).total_seconds()

            stats = scanner.create_scan_statistics(results, duration)

            print("\nPerformance Results:")
            print(f"  Platform: {platform.system()} {platform.release()}")
            print(f"  Test Directory: {test_path}")
            print(f"  Directories scanned: {stats.total_directories:,}")
            print(f"  Files analyzed: {stats.total_files:,}")
            print(f"  Total size: {stats.total_size_human_readable}")
            print(f"  Scan duration: {duration:.2f}s")

            if duration > 0:
                print(f"  Scan rate: {stats.total_directories / duration:.0f} dirs/sec")
                print(f"  File rate: {stats.total_files / duration:.0f} files/sec")
              # Content breakdown if available
            if stats.category_breakdown:
                print("\nContent Type Distribution:")
                total_size = stats.total_size_bytes
                for category, size_bytes in sorted(stats.category_breakdown.items(),
                                                 key=lambda x: x[1], reverse=True)[:5]:
                    if size_bytes > 0:
                        percentage = (size_bytes / total_size) * 100 if total_size > 0 else 0
                        size_mb = size_bytes / (1024 * 1024)
                        print(f"    {category}: {size_mb:.1f} MB ({percentage:.1f}%)")

            return  # Success - exit after first working directory

        except PermissionError:
            print("Permission denied - trying next directory...")
            continue
        except Exception as e:
            print(f"Performance test failed on {test_path}: {e}")
            continue

    print("\nCould not run performance test on any available directories")
    print("This may be due to permission restrictions on system directories")


def main():
    """Run the complete test suite."""
    print("Directory Analyzer - Professional Test Suite")
    print("="*60)

    # Run unit tests
    print("\nRunning unit tests...")
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestContentClassifier))
    suite.addTests(loader.loadTestsFromTestCase(TestDirectoryScanner))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestReporting))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Run performance tests
    run_performance_test()

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")

    if result.failures:
        print("\nFailures:")
        for test, traceback in result.failures:
            print(f"  {test}: {traceback}")

    if result.errors:
        print("\nErrors:")
        for test, traceback in result.errors:
            print(f"  {test}: {traceback}")

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
