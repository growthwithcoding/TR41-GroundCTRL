#!/usr/bin/env python3
"""
GroundCTRL File Structure Mapper
Maps out the project directory structure and creates a text document.
Run from project root: python helper_scripts/map_file_structure.py
"""

import os
from pathlib import Path
from datetime import datetime


def should_ignore(path_name):
    """Determine if a path should be ignored based on common patterns."""
    ignore_patterns = {
        'node_modules',
        '.git',
        '__pycache__',
        '.pytest_cache',
        'venv',
        'env',
        '.env',
        'dist',
        'build',
        '.vscode',
        '.idea',
        '*.pyc',
        '.DS_Store'
    }
    
    return any(pattern in path_name for pattern in ignore_patterns)


def map_directory_structure(root_path, prefix="", is_last=True):
    """
    Recursively map directory structure with tree-like formatting.
    
    Args:
        root_path: Path object of the directory to map
        prefix: String prefix for tree formatting
        is_last: Boolean indicating if this is the last item in current level
    
    Returns:
        List of formatted strings representing the directory structure
    """
    lines = []
    
    # Get the directory/file name
    if prefix == "":
        # Root directory
        lines.append(f"{root_path.name}/")
        prefix = ""
    
    try:
        # Get all items in the directory, sorted (directories first, then files)
        items = sorted(root_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
        
        # Filter out ignored items
        items = [item for item in items if not should_ignore(item.name)]
        
        for index, item in enumerate(items):
            is_last_item = (index == len(items) - 1)
            
            # Create the tree branch characters
            if is_last_item:
                current_prefix = prefix + "└── "
                next_prefix = prefix + "    "
            else:
                current_prefix = prefix + "├── "
                next_prefix = prefix + "│   "
            
            if item.is_dir():
                # Directory
                lines.append(f"{current_prefix}{item.name}/")
                # Recursively process subdirectory
                lines.extend(map_directory_structure(item, next_prefix, is_last_item))
            else:
                # File
                lines.append(f"{current_prefix}{item.name}")
                
    except PermissionError:
        lines.append(f"{prefix}[Permission Denied]")
    
    return lines


def create_file_structure_doc(output_file="file_structure.txt"):
    """
    Create a text document mapping the project file structure from root.
    
    Args:
        output_file: Name of the output file
    """
    # Get the project root directory (one level up from helper_scripts)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print(f"Mapping file structure from: {project_root}")
    
    # Generate the structure
    structure_lines = map_directory_structure(project_root)
    
    # Create header for the document
    header = [
        "=" * 80,
        "GroundCTRL - PROJECT FILE STRUCTURE",
        "=" * 80,
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Root Directory: {project_root}",
        "=" * 80,
        "",
    ]
    
    # Combine header and structure
    full_content = "\n".join(header + structure_lines)
    
    # Write to file in the project root
    output_path = project_root / output_file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_content)
    
    print(f"✓ File structure mapped successfully!")
    print(f"✓ Output saved to: {output_path}")
    print(f"✓ Total lines: {len(structure_lines)}")


if __name__ == "__main__":
    create_file_structure_doc()
