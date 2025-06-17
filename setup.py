#!/usr/bin/env python3
"""
Setup script for Directory Analyzer.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding='utf-8')

setup(
    name="directory-analyzer",
    version="1.0.0",
    author="Your Name",  # Replace with your name
    author_email="your.email@example.com",  # Replace with your email
    description="A command-line utility to find the largest directories by direct file size",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/directory-analyzer",  # Replace with your GitHub URL
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: System Administrators",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
        "Topic :: System :: Filesystems",
        "Topic :: System :: Systems Administration",
        "Topic :: Utilities",
    ],
    python_requires=">=3.11",
    entry_points={
        "console_scripts": [
            "directory-analyzer=src.main:main",
        ],
    },
    install_requires=[
        # No external dependencies - uses only Python standard library
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "pytest-cov",
            "black",
            "flake8",
            "mypy",
        ],
        "enhanced": [
            "tqdm>=4.0",  # For progress bars
            "rich>=10.0",  # For colored output
        ],
    },
    keywords="directory analyzer disk usage filesystem cli utility",
    project_urls={
        "Bug Reports": "https://github.com/yourusername/directory-analyzer/issues",
        "Source": "https://github.com/yourusername/directory-analyzer",
        "Documentation": "https://github.com/yourusername/directory-analyzer#readme",
    },
)
