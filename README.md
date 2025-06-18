# Directory Analyzer

**Author:** Alexander Sivolobov  
**Version:** 1.2.1  
**License:** MIT

A professional-grade personal storage analytics tool for power users to identify and manage forgotten content that consumes significant disk space.

## Overview

Directory Analyzer helps power users tackle unexpected storage issues by intelligently analyzing and classifying large content that has accumulated over time. The tool focuses on identifying forgotten galleries, videos, archives, and document collections, providing actionable insights for cleanup, archival, or cloud migration decisions.

## Key Features

### 🚀 Professional-Grade Analytics Engine
- **Summary Statistics Dashboard**: Displays comprehensive scan overview with total directories, files, and sizes
- **Percentage Analysis**: Every directory shows precise percentage of total storage (2-decimal precision)
- **Content Classification**: Intelligent categorization into 8 consumer-focused categories:
  - 📸 **Images**: JPG, PNG, RAW, HEIC, SVG, and 20+ image formats
  - 🎬 **Videos**: MP4, AVI, MKV, MOV, and 15+ video formats  
  - 🎵 **Audio**: MP3, FLAC, WAV, AAC, and 15+ audio formats
  - 📚 **Documents/Books**: PDF, EPUB, MOBI, CHM, and eBook formats
  - 📄 **Office Documents**: DOCX, XLSX, PPTX, TXT, MD, and office formats
  - 📦 **Archives**: ZIP, RAR, 7Z, TAR, and 15+ archive formats
  - 💻 **Code/Development**: PY, JS, HTML, CSS, and 25+ programming languages
  - ⚙️ **System/Applications**: EXE, DLL, and system files

### 🎯 Advanced Filtering & Analysis
- **Extension Filtering**: Focus analysis on specific file types (`--extensions .pdf .txt .doc`)
- **Size Filtering**: Set minimum directory size thresholds in megabytes
- **Hidden Directory Control**: Include/exclude hidden folders (default: include all)
- **Smart Scanning**: Analyzes only direct files in each directory, not subdirectories

### 📊 Professional Output Formats
- **Terminal Dashboard**: Professional summary with statistics and content breakdowns
- **Text Reports**: Comprehensive reports with percentage analysis and content categorization
- **CSV Export**: Structured data export with percentage and category information
- **JSON Output**: Complete data export for integration with other tools

### ⚡ High-Performance Architecture
- **Parallel Processing**: Multi-threaded directory scanning (always enabled for optimal performance)
- **Memory Efficient**: Stream-based processing for large directory structures
- **Progress Reporting**: Real-time scan progress with verbose mode
- **Error Recovery**: Graceful handling of permission denied and inaccessible directories

## Installation

### Prerequisites
- Python 3.13+ (tested and validated)
- Windows, macOS, or Linux (cross-platform)
- No external dependencies required

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/directory-analyzer.git
cd directory-analyzer

# Run on your home directory (Windows)
python -m src.main C:\Users\%USERNAME% --top-count 20 --verbose

# Run on your home directory (macOS/Linux)  
python -m src.main ~/ --top-count 20 --verbose

# Focus on specific content types
python -m src.main C:\Users\%USERNAME% --extensions .jpg .png .mp4 .avi
```

## Usage Examples

### Basic Analysis
```bash
# Analyze current directory with professional output
python -m src.main . --verbose

# Analyze specific directory, show top 30 results
python -m src.main /path/to/analyze --top-count 30
```

### Advanced Filtering
```bash
# Focus on media files only
python -m src.main /Users/photos --extensions .jpg .png .mp4 .mov

# Find large archives and documents
python -m src.main /Downloads --extensions .zip .rar .pdf .docx --min-size 50

# Exclude hidden directories
python -m src.main /home/user --no-hidden
```

### Professional Reporting
```bash
# Generate comprehensive CSV report
python -m src.main /data --format csv --output-file storage_analysis.csv

# Create JSON export for further processing
python -m src.main /media --format json --output-file media_analysis.json

# Detailed text report with content analysis
python -m src.main /projects --format text --output-file project_breakdown.txt
```

### Performance Options
```bash
# Verbose progress reporting
python -m src.main /large-directory --verbose

# Focus on significant directories only (100MB+)
python -m src.main /storage --min-size 100 --verbose
```

## Output Format

### Terminal Output
```
================================================================================
Directory Analyzer - Personal Storage Analytics Tool
================================================================================

Scan Summary:
  Target Path:        /Users/username/Documents
  Total Directories:  1,234
  Total Files:        15,678
  Total Size:         45.2 GB
  Scan Duration:      2.34s

Top 20 Largest Directories (by direct file size):
--------------------------------------------------------------------------------
  1.   8.2 GB (18.14%) - /Users/username/Documents/Photos
     1,234 files
  2.   4.8 GB (10.62%) - /Users/username/Documents/Videos
     234 files
  3.   2.1 GB ( 4.64%) - /Users/username/Documents/Archives
     45 files

Content Type Breakdown:
--------------------------------------------------
  Images                 12.4 GB (27.43%) - 3,456 files
  Videos                  8.9 GB (19.69%) - 234 files
  Documents/Books         6.2 GB (13.72%) - 1,234 files
  Archives                4.8 GB (10.62%) - 123 files
  Office Documents        3.1 GB ( 6.86%) - 2,345 files
```

### File Output Formats

**Text Format**: Professional report with summary statistics, directory listings with percentages, and content type analysis.

**CSV Format**: Structured data with columns for rank, path, size (bytes), size (human-readable), percentage, and file count.

**JSON Format**: Complete structured data including summary statistics, directory details, and content category breakdowns.

## Command Line Options

```
usage: main.py [-h] [--version] [--output-file OUTPUT_FILE] [--top-count TOP_COUNT] 
               [--no-hidden] [--min-size MIN_SIZE] [--format {text,csv,json}] 
               [--verbose] [--no-access-log NO_ACCESS_LOG] 
               [--extensions EXTENSIONS [EXTENSIONS ...]] target

Professional-grade personal storage analytics tool for power users.

positional arguments:
  target                Target directory to scan

options:
  -h, --help            show this help message and exit
  --version             show program's version number and exit
  --output-file, -o OUTPUT_FILE
                        Output file for full results (default: largest_directories.txt)
  --top-count, -t TOP_COUNT
                        Number of top results to show in terminal (default: 50)
  --no-hidden           Exclude hidden directories (default: include hidden)
  --min-size MIN_SIZE   Minimum size in megabytes (MB) to include (default: 0)
  --format {text,csv,json}
                        Output file format (default: text)
  --verbose, -v         Enable verbose output with progress reporting
  --no-access-log NO_ACCESS_LOG
                        File to log inaccessible directories (default: no-access.txt)
  --extensions EXTENSIONS [EXTENSIONS ...]
                        Filter by file extensions (e.g., --extensions .pdf .txt .doc)
```

## Use Cases

### Personal Storage Cleanup
- **Identify Forgotten Content**: Find large photo galleries, video collections, and archives you forgot about
- **Cloud Migration Planning**: See what content is worth moving to cloud storage vs. local archives
- **Disk Space Recovery**: Quickly locate the biggest space consumers for cleanup decisions

### Content Organization
- **Media Library Analysis**: Understand the breakdown of your photos, videos, and audio files
- **Document Management**: Find large document collections that could be archived or organized
- **Development Cleanup**: Identify old project folders and development artifacts consuming space

### System Maintenance
- **Storage Monitoring**: Regular analysis to prevent unexpected disk space issues
- **Archive Planning**: Identify content suitable for long-term archival to external storage
- **Backup Optimization**: Focus backup strategies on the most important content categories

## Performance

Tested performance metrics on modern hardware:
- **Scan Rate**: 5,000+ directories per second
- **File Analysis**: 25,000+ files per second  
- **Memory Usage**: <100MB for 100,000+ files
- **Large Dataset**: 18.5GB (594 files, 98 directories) analyzed in 0.09 seconds

## Testing

Comprehensive test suite included:

```bash
# Run complete test suite
python -m tests.test_suite

# Tests include:
# - Unit tests for all core functionality
# - Integration tests with real directory structures
# - Performance benchmarking
# - Cross-platform compatibility validation
```

## Documentation

- **[Product Requirements](docs/PRD.md)**: Complete product vision and feature specifications
- **[Architecture Guide](docs/architecture.md)**: Technical implementation details and design patterns
- **[Development Guide](docs/DEVELOPMENT.md)**: Development process, testing approach, and version history

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run the test suite (`python -m tests.test_suite`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Alexander Sivolobov**
- Specializing in storage analytics and personal productivity tools
- Focus on power user solutions for modern storage management challenges

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and feature development.
