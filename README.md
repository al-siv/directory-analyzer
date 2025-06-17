# Directory Analyzer

**Author:** Alexander Sivolobov  
**Version:** 1.0.0  
**License:** MIT

A command-line utility to find the largest directories on your disk by analyzing direct file sizes (not including subdirectories).

## Features

- **Smart Scanning**: Analyzes only direct files in each directory, not subdirectories
- **Parallel Processing**: Optional multi-threaded scanning for improved performance  
- **Multiple Output Formats**: Text, CSV, and JSON output support
- **Flexible Results**: Top N (default 50, configurable) in terminal, full list saved to file
- **Robust Error Handling**: Gracefully handles permission errors and inaccessible directories
- **Verbose Logging**: Optional verbose mode with scan status logging

## Installation

### From GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/directory-analyzer.git
cd directory-analyzer

# Run directly
python directory_analyzer.py /path/to/scan
```

### As a Python Package

```bash
# Install from source
pip install .

# Or install with enhanced features
pip install .[enhanced]

# Then run using the installed command
directory-analyzer /path/to/scan
```

### Requirements

- Python 3.13 (only tested version, may work on 3.11+ but not verified)
- No external dependencies (uses only Python standard library)

## Usage

### Basic Usage
```bash
# Check version
python directory_analyzer.py --version

# Scan directory
python directory_analyzer.py C:\
```

### Advanced Options
```bash
python directory_analyzer.py C:\ --output-file results.csv --format csv --top-count 100 --verbose
```

### Command Line Options

- `target`: Target directory to scan (required)
- `--output-file, -o`: Output file for full results (default: largest_directories.txt)
- `--top-count, -t`: Number of top results to show in terminal (default: 50)
- `--include-hidden`: Include hidden directories in scan
- `--min-size`: Minimum size in bytes to include in results
- `--format`: Output format - text, csv, or json (default: text)
- `--verbose, -v`: Enable verbose output with scan status logging
- `--no-parallel`: Disable parallel scanning (use sequential mode)

### Examples

**Scan entire C: drive with verbose output:**
```bash
python directory_analyzer.py C:\ --verbose
```

**Scan Documents folder, save as JSON, show top 20:**
```bash
python directory_analyzer.py "C:\Users\Username\Documents" --format json --top-count 20 --output-file docs_analysis.json
```

**Scan with minimum size filter (1MB+):**
```bash
python directory_analyzer.py C:\ --min-size 1048576 --verbose
```

## How It Works

Unlike traditional disk usage tools that calculate recursive directory sizes, this utility calculates the size of each directory based only on the files directly contained within it. This provides a different perspective on disk usage:

- **Traditional tools**: Directory size = files + all subdirectory files  
- **This tool**: Directory size = direct files only

This approach helps identify directories with many large files directly in them, rather than directories that are large due to deep subdirectory structures.

## Output Format

### Terminal Output
```
Top 50 largest directories (by direct file size):
  1. C:\Users\Username\Downloads - 2.1 GB (1,247 files)
  2. C:\Windows\System32 - 1.8 GB (3,421 files)
  3. C:\Program Files\Software - 856.3 MB (234 files)
  ...
```

### File Output Formats

**Text Format:**
```
   1. C:\Users\Username\Downloads - 2.1 GB (1,247 files)
   2. C:\Windows\System32 - 1.8 GB (3,421 files)
```

**CSV Format:**
```csv
Rank,Path,Size (bytes),Size (HR),File Count
1,C:\Users\Username\Downloads,2147483648,2.1 GB,1247
2,C:\Windows\System32,1887436800,1.8 GB,3421
```

**JSON Format:**
```json
[
  {
    "rank": 1,
    "path": "C:\\Users\\Username\\Downloads",
    "size_bytes": 2147483648,
    "size_human": "2.1 GB",
    "file_count": 1247
  }
]
```

## Performance

- **Sequential Mode**: Processes directories one by one (safer for network drives)
- **Parallel Mode**: Uses multiple threads for faster scanning (default)
- **Memory Efficient**: Uses generators and iterators to minimize memory usage
- **Verbose Logging**: Shows scan status and error information

## Architecture

The project follows a modular design with clear separation of concerns:

- **`src/main.py`**: CLI interface and workflow orchestration
- **`src/scanner.py`**: Core directory scanning logic
- **`src/models.py`**: Data structures and models
- **`src/reporter.py`**: Output formatting and file writing
- **`src/utils.py`**: Utility functions and error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Documentation

- [Architecture Overview](docs/architecture.md) - Technical architecture and design decisions
- [Development Guide](docs/DEVELOPMENT.md) - Development history and progress tracking
- [Changelog](CHANGELOG.md) - Version history and release notes

## License

[MIT License](LICENSE) - see the LICENSE file for details.

## Author

**Alexander Sivolobov** - *Initial work and ongoing development*

## Changelog

### Version 1.0.0 (2025-06-17)
- Initial release
- Core scanning functionality
- Multiple output formats
- Parallel processing support
- Comprehensive error handling
