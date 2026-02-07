#!/usr/bin/env python3
"""
ESLint Indentation Fixer
Reads problems.json from VS Code and fixes indentation errors automatically.

Usage:
    python fix_indentation.py [path/to/problems.json]

Default: Reads problems.json from current directory
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional

def parse_indentation_message(message: str) -> Tuple[Optional[int], Optional[int]]:
    """
    Parse ESLint indentation message.
    
    Args:
        message: Message like "Expected indentation of 4 spaces but found 6."
    
    Returns:
        Tuple of (expected_spaces, found_spaces) or (None, None) if parse fails
    """
    match = re.match(r'Expected indentation of (\d+) spaces but found (\d+)\.', message)
    if match:
        return int(match.group(1)), int(match.group(2))
    return None, None

def load_problems(problems_file: Path) -> List[Dict]:
    """Load problems from JSON file."""
    try:
        with open(problems_file, 'r', encoding='utf-8') as f:
            problems = json.load(f)
        return problems
    except FileNotFoundError:
        print(f"[ERROR] {problems_file} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON in {problems_file}: {e}")
        sys.exit(1)

def group_indentation_problems(problems: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Group indentation problems by file.
    
    Returns:
        Dict mapping file paths to list of indentation problems
    """
    grouped = {}
    
    for problem in problems:
        # Only process indent errors
        if problem.get('code', {}).get('value') != 'indent':
            continue
        
        # Get file path (remove /K: prefix if present)
        resource = problem.get('resource', '')
        if resource.startswith('/K:'):
            resource = 'K:' + resource[3:]
        
        file_path = resource.replace('/', os.sep)
        
        # Parse indentation info
        message = problem.get('message', '')
        expected, found = parse_indentation_message(message)
        
        if expected is None:
            continue
        
        # Add to grouped dict
        if file_path not in grouped:
            grouped[file_path] = []
        
        grouped[file_path].append({
            'line': problem.get('startLineNumber'),
            'expected': expected,
            'found': found,
            'message': message
        })
    
    return grouped

def fix_line_indentation(line: str, expected: int, found: int) -> str:
    """
    Fix indentation on a single line.
    
    Args:
        line: The line to fix
        expected: Expected number of spaces
        found: Actual number of spaces found
    
    Returns:
        Fixed line
    """
    # Count leading spaces
    leading_spaces = len(line) - len(line.lstrip(' '))
    
    # Only fix if it matches the 'found' count
    if leading_spaces == found:
        # Replace with expected spaces
        fixed_line = ' ' * expected + line.lstrip(' ')
        return fixed_line
    
    return line

def fix_file_indentation(file_path: str, problems: List[Dict]) -> bool:
    """
    Fix indentation in a single file.
    
    Args:
        file_path: Path to file
        problems: List of indentation problems for this file
    
    Returns:
        True if file was modified, False otherwise
    """
    if not os.path.exists(file_path):
        print(f"  [WARNING] File not found: {file_path}")
        return False
    
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8', newline='') as f:
            lines = f.readlines()
        
        original_content = ''.join(lines)
        modified = False
        
        # Sort problems by line number (descending) to avoid line number shifts
        sorted_problems = sorted(problems, key=lambda p: p['line'], reverse=True)
        
        # Fix each line
        for problem in sorted_problems:
            line_num = problem['line']
            expected = problem['expected']
            found = problem['found']
            
            if 1 <= line_num <= len(lines):
                original_line = lines[line_num - 1]
                fixed_line = fix_line_indentation(original_line, expected, found)
                
                if fixed_line != original_line:
                    lines[line_num - 1] = fixed_line
                    modified = True
        
        # Write back if modified
        if modified:
            new_content = ''.join(lines)
            
            # Preserve line endings
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(new_content)
            
            return True
        
        return False
    
    except Exception as e:
        print(f"  [ERROR] Error processing file: {e}")
        return False

def main():
    """Main execution function."""
    # Enable UTF-8 output on Windows
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
    
    print("=" * 60)
    print("ESLint Indentation Fixer")
    print("GroundCTRL - Automatic Indentation Correction")
    print("=" * 60)
    print()
    
    # Determine problems.json path
    if len(sys.argv) > 1:
        problems_file = Path(sys.argv[1])
    else:
        # Default to current directory
        problems_file = Path(__file__).parent / 'problems.json'
    
    print(f"Reading problems from: {problems_file}")
    print()
    
    # Load problems
    problems = load_problems(problems_file)
    
    # Group by file
    grouped_problems = group_indentation_problems(problems)
    
    if not grouped_problems:
        print("[SUCCESS] No indentation problems found!")
        return 0
    
    print(f"Found indentation issues in {len(grouped_problems)} file(s)")
    print()
    
    # Fix each file
    files_fixed = 0
    total_fixes = 0
    
    for file_path, file_problems in grouped_problems.items():
        print(f"File: {file_path}")
        print(f"   {len(file_problems)} indentation issue(s) to fix")
        
        if fix_file_indentation(file_path, file_problems):
            files_fixed += 1
            total_fixes += len(file_problems)
            print(f"   [OK] Fixed {len(file_problems)} line(s)")
        else:
            print(f"   [INFO] No changes needed")
        
        print()
    
    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Files processed:     {len(grouped_problems)}")
    print(f"  Files fixed:         {files_fixed}")
    print(f"  Total lines fixed:   {total_fixes}")
    print("=" * 60)
    print()
    
    if files_fixed > 0:
        print("[SUCCESS] Indentation fixed successfully!")
        print("Tip: Run ESLint again to verify fixes")
    else:
        print("[INFO] No fixes applied")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
