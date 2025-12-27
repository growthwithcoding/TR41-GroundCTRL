#!/usr/bin/env python3
"""
CRLF to LF Line Ending Converter
Converts all files with CRLF line endings to LF line endings.
Run from backend root: python src/scripts/convert_crlf_to_lf.py
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

# File extensions to process (add more as needed)
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

def should_process_file(file_path):
    """
    Determine if a file should be processed for line ending conversion.
    
    Args:
        file_path (Path): Path to the file
        
    Returns:
        bool: True if file should be processed, False otherwise
    """
    # Check if it's a file
    if not file_path.is_file():
        return False
    
    # Check extension or specific filenames
    if file_path.suffix in PROCESSABLE_EXTENSIONS:
        return True
    
    # Check for extensionless config files
    if file_path.name in {'.gitignore', '.eslintrc', '.cursorrules'}:
        return True
    
    return False

def has_crlf(file_path):
    """
    Check if a file contains CRLF line endings.
    
    Args:
        file_path (Path): Path to the file
        
    Returns:
        bool: True if file contains CRLF, False otherwise
    """
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            return b'\r\n' in content
    except Exception as e:
        print(f"  ⚠️  Error reading {file_path}: {e}")
        return False

def convert_to_lf(file_path):
    """
    Convert a file's line endings from CRLF to LF.
    
    Args:
        file_path (Path): Path to the file
        
    Returns:
        bool: True if conversion was successful, False otherwise
    """
    try:
        # Read file in binary mode
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Convert CRLF to LF
        content = content.replace(b'\r\n', b'\n')
        
        # Write back to file
        with open(file_path, 'wb') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"  ❌ Error converting {file_path}: {e}")
        return False

def scan_and_convert(root_dir):
    """
    Scan directory tree and convert all files with CRLF to LF.
    
    Args:
        root_dir (Path): Root directory to start scanning from
    """
    converted_count = 0
    skipped_count = 0
    error_count = 0
    total_scanned = 0
    
    print(f"\n🔍 Scanning for CRLF line endings in: {root_dir}")
    print(f"📁 Skipping directories: {', '.join(SKIP_DIRS)}\n")
    
    for root, dirs, files in os.walk(root_dir):
        # Remove skip directories from the search
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for file_name in files:
            file_path = Path(root) / file_name
            
            # Check if we should process this file
            if not should_process_file(file_path):
                continue
            
            total_scanned += 1
            
            # Check if file has CRLF
            if has_crlf(file_path):
                relative_path = file_path.relative_to(root_dir)
                print(f"  🔄 Converting: {relative_path}")
                
                if convert_to_lf(file_path):
                    converted_count += 1
                else:
                    error_count += 1
            else:
                skipped_count += 1
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"📊 Conversion Summary:")
    print(f"{'='*60}")
    print(f"  ✅ Files converted:     {converted_count}")
    print(f"  ⏭️  Files already LF:    {skipped_count}")
    print(f"  ❌ Errors:              {error_count}")
    print(f"  📄 Total files scanned: {total_scanned}")
    print(f"{'='*60}\n")
    
    if converted_count > 0:
        print(f"✨ Successfully converted {converted_count} file(s) from CRLF to LF!")
    else:
        print("✨ No files needed conversion. All line endings are already LF!")

def main():
    """Main entry point for the script."""
    # Determine root directory (backend root)
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent.parent  # Go up two levels from src/scripts to backend root
    
    print("="*60)
    print("  CRLF to LF Line Ending Converter")
    print("  GroundCTRL Backend - Line Ending Normalization")
    print("="*60)
    
    if not root_dir.exists():
        print(f"❌ Error: Root directory not found: {root_dir}")
        sys.exit(1)
    
    # Run the conversion
    scan_and_convert(root_dir)
    
    print("🎯 Line ending conversion complete!")

if __name__ == "__main__":
    main()
