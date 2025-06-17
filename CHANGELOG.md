# Changelog

All notable changes to Directory Analyzer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-17

### Added
- Initial release of Directory Analyzer
- Command-line utility for finding largest directories by direct file size
- Support for parallel and sequential directory scanning
- Multiple output formats: text, CSV, and JSON
- Comprehensive error handling with user-friendly messages
- Verbose logging output (basic scan status and error reporting)
- Configurable options: min size threshold, hidden directories, output file
- Tested on Windows (other platforms not yet tested)
- MIT License
- Comprehensive documentation and architecture guides

### Features
- **Smart Scanning**: Analyzes only direct files in each directory (not subdirectories)
- **Performance**: Optional multi-threaded scanning for improved speed
- **Flexibility**: Customizable output formats and filtering options
- **Reliability**: Robust error handling for permissions and file system issues
- **User Experience**: Clean CLI interface with verbose logging

### Technical Details
- Written in Python 3.13 (only tested version)
- Uses only standard library (no external dependencies)
- Modular architecture with clear separation of concerns
- Full type hints and comprehensive documentation
- Tested on Windows platform

---

*The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).*

## [1.0.0] - 2025-06-17

### Added
- Initial release of Directory Analyzer
- Command-line utility for finding largest directories by direct file size
- Support for parallel and sequential directory scanning
- Multiple output formats: text, CSV, and JSON
- Comprehensive error handling with user-friendly messages
- Verbose logging output (basic scan status and error reporting)
- Configurable options: min size threshold, hidden directories, output file
- Tested on Windows (other platforms not yet tested)
- MIT License
- Comprehensive documentation and architecture guides

### Features
- **Smart Directory Scanning**: Analyzes only direct files in each directory (not subdirectories)
- **Performance Options**: Optional multi-threaded scanning for improved speed
- **Flexible Output**: Terminal display (top N results) + full file output
- **Robust Error Handling**: Graceful handling of permission errors and invalid inputs
- **Multiple Formats**: Text, CSV, and JSON output formats
- **Progress Tracking**: Optional verbose mode with real-time progress updates
- **Filtering Options**: Minimum size thresholds and hidden directory inclusion
- **Tested Platform**: Currently tested on Windows (should work on macOS and Linux)

### Technical Details
- Python 3.13 (only tested version)
- Zero external dependencies (uses only Python standard library)
- Modular architecture with clear separation of concerns
- Comprehensive type hints and documentation
- Tested on Windows platform

### Documentation
- Complete README with usage examples
- Architecture documentation
- Contributing guidelines
- MIT License
- Comprehensive inline code documentation
