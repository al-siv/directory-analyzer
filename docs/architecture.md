# Directory Analyzer - Technical Architecture

## Overview
A command-line utility for analyzing directory sizes on a filesystem, focusing on direct file content rather than recursive subdirectory sizes. Built with Python 3.13 and tested on Windows platform.

## Core Requirements
- Calculate directory sizes based only on direct files (not subdirectories)
- Output complete results to file and top N to terminal
- Handle large filesystem scans efficiently
- Provide robust error handling for permission issues

## Technology Stack

### Tested Environment
- **Python 3.13**: Developed and tested version
- **Windows Platform**: Primary testing environment
- **Standard Library Only**: No external dependencies for maximum compatibility

### Core Technologies
- **pathlib**: Modern path handling and filesystem operations
- **argparse**: Command-line interface and argument parsing
- **os**: Low-level filesystem operations and Windows-specific features
- **concurrent.futures**: Optional parallel processing with ThreadPoolExecutor
- **dataclasses**: Clean data structures for type safety
- **logging**: Basic scan status and error reporting
- **json/csv**: Built-in output format support

### Future Dependencies (Planned)
- `rich`: Enhanced terminal output with colors and formatting
- `tqdm`: Progress bars for long operations
- `click`: Advanced CLI features (alternative to argparse)

## Architecture Patterns

### Modular Design
```
├── CLI Layer (main.py)           # User interface and argument parsing
├── Business Logic Layer
│   ├── scanner.py               # Directory traversal and parallel processing
│   ├── models.py                # Data structures and business entities
│   └── reporter.py              # Output formatting and file I/O
└── Utility Layer (utils.py)     # Common helpers and error handling
```

### Design Patterns Applied
1. **Dataclass Pattern**: Type-safe data structures (DirectoryInfo, ScanOptions, ScanResult)
2. **Strategy Pattern**: Multiple output formats (text, CSV, JSON) via reporter
3. **Template Method Pattern**: Sequential vs parallel scanning implementations
4. **Builder Pattern**: ScanResult construction with computed properties
5. **Iterator Pattern**: Lazy evaluation for directory traversal

### Core Modules and Dependencies

#### Module Structure
- **src/__init__.py**: Package initialization with version and author info
- **src/main.py**: CLI entry point and workflow orchestration
- **src/models.py**: Business data models with type safety
- **src/scanner.py**: Core scanning logic (sequential and parallel)
- **src/reporter.py**: Output formatting and file writing
- **src/utils.py**: Shared utilities and error handling

#### Actual Dependencies (Standard Library Only)
- **pathlib**: Modern filesystem path operations and cross-platform compatibility
- **argparse**: Command-line interface with type validation
- **concurrent.futures**: ThreadPoolExecutor for parallel directory processing
- **dataclasses**: Type-safe data structures with automatic methods
- **logging**: Structured logging for debugging and verbose output
- **datetime**: Timestamp tracking for scan operations
- **json**: JSON output format support
- **csv**: CSV output format support
- **os**: Low-level filesystem operations (Windows-specific features)
- **typing**: Type hints for better code clarity and IDE support

#### Testing Status
- **Current**: No automated tests implemented
- **Planned**: Unit tests for core functionality, integration tests for CLI
- **Manual Testing**: Extensive manual testing on Windows platform

## Data Structures

### Core Data Model
```python
@dataclass
class DirectoryInfo:
    path: Path
    size_bytes: int
    file_count: int
    last_scanned: datetime
    error_message: Optional[str] = None
```

### Collections
- `List[DirectoryInfo]`: Primary storage for scan results
- `Dict[str, int]`: Size cache for performance optimization
- `Set[str]`: Excluded directories tracking

## Core Algorithms

### Directory Size Calculation
1. **Single-Level Scanning**: Use `os.listdir()` or `pathlib.iterdir()`
2. **File Size Summation**: Sum only direct files, ignore subdirectories
3. **Error Handling**: Skip inaccessible directories, log errors
4. **Caching**: Store calculated sizes to avoid recalculation

### Performance Optimizations
1. **Parallel Processing**: Use `ThreadPoolExecutor` for I/O-bound operations
2. **Memory Efficiency**: Generator expressions for large datasets
3. **Early Termination**: Support graceful interruption (Ctrl+C)
4. **Progress Reporting**: Real-time feedback for long operations

## File System Considerations

### Windows-Specific Handling
- Long path support (>260 characters)
- Junction points and symbolic links
- Hidden and system directories
- NTFS permissions and security

### Cross-Platform Compatibility
- Path separator handling
- Permission models
- File system case sensitivity
- Unicode filename support

## Output Formats

### Terminal Output
- Top N results (default: 50)
- Human-readable sizes (KB, MB, GB, TB)
- Colored output (optional)
- Progress indicators

### File Output
- Complete results list
- Multiple formats: text, CSV, JSON
- Sortable and filterable data
- Timestamp and metadata

## Error Handling Strategy

### Exception Categories
1. **Permission Errors**: Skip and log, continue processing
2. **Path Errors**: Invalid paths, report and continue
3. **I/O Errors**: Disk full, file locked, retry logic
4. **System Errors**: Out of memory, system limits

### Recovery Mechanisms
- Graceful degradation for inaccessible directories
- Partial results output on interruption
- Detailed error logging for troubleshooting
- User-friendly error messages

## Security Considerations

### Safe Directory Traversal
- Prevent directory traversal attacks
- Validate input paths
- Respect filesystem boundaries
- Handle symbolic link loops

### Performance Limits
- Maximum directory depth limits
- Memory usage monitoring
- CPU usage throttling
- Timeout mechanisms

## Testing Strategy

### Unit Tests
- Directory size calculation accuracy
- Error handling scenarios
- Output format validation
- Performance benchmarks

### Integration Tests
- Full filesystem scans
- Cross-platform compatibility
- Large dataset handling
- Error recovery testing

## Scalability Considerations

### Performance Targets
- Handle millions of directories
- Process TB-scale filesystems
- Memory usage under 1GB
- Responsive user interface

### Optimization Opportunities
- Disk I/O minimization
- Cache effectiveness
- Parallel processing scaling
- Memory-mapped files for large datasets

## Future Enhancements

### Phase 1 (Current)
- Basic functionality implementation
- Core algorithm optimization
- Essential error handling

### Phase 2 (Planned)
- GUI interface option
- Network drive support
- Database backend for results
- Advanced filtering options

### Phase 3 (Future)
- Real-time monitoring
- Integration with system tools
- Cloud storage analysis
- Machine learning for usage patterns

# Directory Analyzer - Architecture

## Overview
This project is a command-line utility written in Python 3.13 for analyzing disk usage and identifying the largest directories on a filesystem. It outputs a sorted list of directories by size, considering only files directly within each directory (not recursively including subdirectories). The top 50 results are shown in the terminal, and the full list is saved to a file.

## Technology Stack
- **Language:** Python 3.13
- **Standard Libraries:** os, pathlib, argparse, dataclasses, typing, logging, concurrent.futures
- **Optional Libraries:** tqdm (for progress bar), rich/colorama (for colored output)
- **Testing:** unittest or pytest

## Project Structure
```
directory_analyzer/
├── src/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # CLI entry point and argument parsing
│   ├── models.py            # Data structures (DirectoryInfo, ScanOptions, ScanResult)
│   ├── scanner.py           # Directory scanning and size calculation logic
│   ├── utils.py             # Utility functions and progress reporting
│   └── reporter.py          # Output formatting and file writing
├── tests/
│   └── __init__.py          # Test package initialization
├── directory_analyzer.py   # Main entry point script
├── requirements.txt         # Dependencies (optional)
├── architecture.md          # This file
└── improvement.md           # Progress tracking
```

## Architecture & Modules
- **src/main.py**: Entry point, CLI argument parsing, and main workflow orchestration.
- **src/models.py**: Data models (DirectoryInfo, ScanOptions, ScanResult dataclasses).
- **src/scanner.py**: Filesystem traversal and directory size calculation logic.
- **src/utils.py**: Utility functions (size formatting, error handling, progress reporting).
- **src/reporter.py**: Output formatting and writing results to file/terminal.
- **tests/**: Unit and integration tests for all modules.

## Core Algorithm
1. **Directory Traversal**: Uses `os.walk()` or `pathlib` to recursively find all directories
2. **Size Calculation**: For each directory, calculates size by summing only direct files (not subdirectories)
3. **Parallel Processing**: Optional multi-threaded scanning for improved performance
4. **Sorting & Filtering**: Results sorted by size (largest first) with optional size thresholds
5. **Output**: Top N results to terminal, full list to file in various formats (text, CSV, JSON)

## Design Patterns
- **Strategy Pattern**: For output formatting (text, CSV, JSON).
- **Repository Pattern**: For data access and storage.
- **Observer Pattern**: For progress reporting (optional).
- **Factory Pattern**: For scanner instantiation (if platform-specific logic needed).

## Key Features
- Efficient, non-recursive directory size calculation (only direct files).
- Handles permission errors and symlinks gracefully.
- CLI with options for output file, top N results, format, and verbosity.
- Both sequential and parallel scanning modes.
- Progress reporting for long-running operations.
- Modular, extensible, and testable codebase.

## Error Handling
- **Permission Errors**: Gracefully handles inaccessible directories
- **File System Errors**: Robust error handling for file access issues
- **Interruption**: Proper handling of user interruption (Ctrl+C)
- **Invalid Paths**: Validation of input and output paths

## Performance Considerations
- **Memory Efficiency**: Uses generators and iterators where possible
- **Parallel Processing**: Optional multi-threading for I/O-bound operations
- **Progress Reporting**: Minimal overhead progress tracking
- **Large Filesystems**: Designed to handle very large directory structures

## Extensibility
- Easy to add new output formats or scanning strategies.
- Can be extended to support recursive size calculation or filtering by file type/date.
- Modular design allows for easy testing and modification.

## Dependencies
- **Core**: No external dependencies required for basic functionality.
- **Optional**: tqdm (progress bars), rich (colored output), colorama (Windows color support).

## Quality Assurance
- **Linter Compliance**: All code passes Python linting checks
- **Type Hints**: Full type annotation for better code quality
- **Error Handling**: Comprehensive error handling throughout
- **Documentation**: Detailed docstrings and comments

## Distribution & Packaging
- **GitHub Repository**: Open source project with MIT License
- **Python Package**: Installable via pip with proper setup.py
- **CI/CD Ready**: Structured for automated testing and deployment
- **Semantic Versioning**: Follows semver for version management
- **Changelog**: Detailed changelog for tracking changes and releases

## MCP Integration
- Sequential thinking, memory, and Context7 are used for planning, architecture, and progress tracking.

---
_Last updated: 2025-06-17_
