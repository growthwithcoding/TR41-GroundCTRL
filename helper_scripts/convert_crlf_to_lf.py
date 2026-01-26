#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CRLF to LF Line Ending Converter
Converts all files with CRLF line endings to LF line endings.
Run from project root: python helper_scripts/convert_crlf_to_lf.py
"""

import os
import sys
from pathlib import Path

# Directories to skip during conversion
SKIP_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '__pycache__',
    '.vscode',
    '.idea',
}

# File extensions to process
PROCESSABLE_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx',
    '.json', '.md', '.txt',
    '.py', '.sh', '.bash',
    '.yml', '.yaml',
    '.css', '.scss', '.sass',
    '.html', '.xml',
    '.env', '.sample',
    '.gitignore', '.eslintrc',
}

def should_process_file(file_path: Path) -> bool:
    """Determine if a file should be processed."""
    if not file_path.is_file():
        return False

    if file_path.suffix in PROCESSABLE_EXTENSIONS:
        return True

    if file_path.name in {'.gitignore', '.eslintrc', '.cursorrules'}:
        return True

    return False

def has_crlf(file_path: Path) -> bool:
    """Check if a file contains CRLF line endings."""
    try:
        with open(file_path, 'rb') as f:
            return b'\r\n' in f.read()
    except Exception as e:
        print(f"  [WARN] Error reading {file_path}: {e}")
        return False

def convert_to_lf(file_path: Path) -> bool:
    """Convert CRLF line endings to LF."""
    try:
        with open(file_path, 'rb') as f:
            content = f.read()

        content = content.replace(b'\r\n', b'\n')

        with open(file_path, 'wb') as f:
            f.write(content)

        return True
    except Exception as e:
        print(f"  [ERROR] Failed converting {file_path}: {e}")
        return False

def scan_and_convert(root_dir: Path) -> None:
    """Scan directory tree and convert files."""
    converted_count = 0
    skipped_count = 0
    error_count = 0
    total_scanned = 0

    print(f"\nScanning for CRLF line endings in: {root_dir}")
    print(f"Skipping directories: {', '.join(sorted(SKIP_DIRS))}\n")

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file_name in files:
            file_path = Path(root) / file_name

            if not should_process_file(file_path):
                continue

            total_scanned += 1

            if has_crlf(file_path):
                relative_path = file_path.relative_to(root_dir)
                print(f"  Converting: {relative_path}")

                if convert_to_lf(file_path):
                    converted_count += 1
                else:
                    error_count += 1
            else:
                skipped_count += 1

    print("\n" + "=" * 60)
    print("Conversion Summary")
    print("=" * 60)
    print(f"  Files converted:     {converted_count}")
    print(f"  Files already LF:    {skipped_count}")
    print(f"  Errors:              {error_count}")
    print(f"  Total files scanned: {total_scanned}")
    print("=" * 60)

    if converted_count > 0:
        print(f"\nSuccess: Converted {converted_count} file(s) to LF.")
    else:
        print("\nNo conversion needed. All files already use LF.")

def main() -> None:
    """Main entry point."""
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent

    print("=" * 60)
    print("CRLF to LF Line Ending Converter")
    print("GroundCTRL - Line Ending Normalization")
    print("=" * 60)

    if not root_dir.exists():
        print(f"Error: Root directory not found: {root_dir}")
        sys.exit(1)

    scan_and_convert(root_dir)
    print("\nDone.")

if __name__ == "__main__":
    main()
