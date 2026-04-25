import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'archive' / 'python' / 'src'))

from scanner import DirectoryScanner
from models import ScanOptions

fixture = str(Path(__file__).parent / 'mixed-content')

opts = ScanOptions(
    target_path=fixture,
    include_hidden=True,
    min_size_bytes=0,
    output_file='out.txt',
    top_count=50,
    output_format='json',
    verbose=False,
    error_log_file='err.txt',
    extension_filter=None
)
scanner = DirectoryScanner(opts)
results = scanner.scan(use_parallel=False)
stats = scanner.create_scan_statistics(results, 0)
print(json.dumps({
    'dirs': [{'path': str(r.path), 'size': r.size_bytes, 'files': r.file_count} for r in results],
    'total_files': stats.total_files,
    'total_size': stats.total_size_bytes
}))
