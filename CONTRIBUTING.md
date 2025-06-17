# Contributing to Directory Analyzer

Thank you for your interest in contributing to Directory Analyzer! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/directory-analyzer.git
   cd directory-analyzer
   ```
3. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites
- Python 3.11 or higher
- Git

### Installation
```bash
# Install in development mode
pip install -e .

# Install with development dependencies
pip install -e .[dev]
```

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html
```

### Code Quality
```bash
# Format code
black src/ tests/

# Check linting
flake8 src/ tests/

# Type checking
mypy src/
```

## Making Changes

### Code Style
- Follow PEP 8 style guidelines
- Use type hints for all functions and methods
- Write descriptive docstrings
- Keep functions focused and small

### Commit Messages
- Use clear and descriptive commit messages
- Start with a verb (Add, Fix, Update, etc.)
- Keep the first line under 50 characters
- Add detailed description if needed

Example:
```
Add support for custom output formats

- Implement XML output format
- Add validation for custom format options
- Update documentation with examples
```

### Testing
- Write tests for new functionality
- Ensure all existing tests pass
- Aim for high test coverage
- Test edge cases and error conditions

## Submitting Changes

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots if applicable

3. Respond to code review feedback promptly

## Bug Reports

When reporting bugs, please include:
- Python version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Feature Requests

For new features:
- Describe the use case
- Explain why it would be valuable
- Consider if it fits the project's scope
- Be open to discussion about implementation

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn and contribute
- Maintain a positive environment

## Questions?

Feel free to open an issue for questions or start a discussion in the GitHub Discussions section.

Thank you for contributing!
