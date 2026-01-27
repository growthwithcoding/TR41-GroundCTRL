#!/usr/bin/env python3
import json
import re
from pathlib import Path

def parse_fixes(problems_json_path):
    """Parse problems.json, return list of (file_path, line, col_start, col_end, old_class, new_class)"""
    fixes = []
    with open(problems_json_path, 'r', encoding='utf-8') as f:
        problems = json.load(f)
    
    for problem in problems:
        if (problem.get('owner') == 'tailwindcss-intellisense' and 
            problem.get('code') == 'suggestCanonicalClasses'):
            raw_resource = problem['resource']

            # VS Code uses /k:/ style paths on Windows — normalize them
            if re.match(r'^/[a-zA-Z]:/', raw_resource):
                raw_resource = raw_resource.lstrip('/')

            resource = Path(raw_resource)
            message = problem['message']
            
            # Robust regex: matches "The class `old` can be written as `new`" or variants
            match = re.search(r'`([^`]+)`\s+(?:can be written as|→)\s+`([^`]+)`', message)
            if match:
                old_class, new_class = match.groups()
                line = problem['startLineNumber'] - 1  # 1-based to 0-based
                col_start = problem['startColumn'] - 1
                col_end = problem['endColumn'] - 1
                
                fixes.append((resource, line, col_start, col_end, old_class, new_class))
    
    return fixes

def apply_fix(file_path, line, col_start, col_end, old_class, new_class):
    """Replace exact span in file with new class"""
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return
    
    lines = file_path.read_text(encoding='utf-8').splitlines()
    if 0 <= line < len(lines):
        line_content = lines[line]
        if col_start < len(line_content) and col_end <= len(line_content):
            # Verify the span contains the old class
            span = line_content[col_start:col_end]
            if old_class in span:
                new_line = (line_content[:col_start] + new_class + 
                           line_content[col_end:])
                lines[line] = new_line
                file_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
                print(f"✅ Fixed {file_path.name}:{line+1}:{col_start+1}: '{old_class}' → '{new_class}'")
            else:
                print(f"⚠️  Expected '{old_class}' not in span '{span}' at {file_path}:{line+1}")
        else:
            print(f"⚠️  Range out of bounds in {file_path}:{line+1}")
    else:
        print(f"⚠️  Line {line+1} out of bounds in {file_path}")

if __name__ == '__main__':
    SCRIPT_DIR = Path(__file__).resolve().parent
    problems_file = SCRIPT_DIR / 'problems.json'
    if not problems_file.exists():
        print("❌ No 'problems.json' found in current directory!")
        print("1. Copy Problems tab JSON (Ctrl+A → Copy)")
        print("2. Paste into 'problems.json' here")
        print("3. Run: python fix_problems.py")
        exit(1)
    
    fixes = parse_fixes(problems_file)
    if not fixes:
        print("ℹ️  No Tailwind canonical class fixes found in problems.json.")
        exit(0)
    
    print(f"🔍 Found {len(fixes)} Tailwind fixes to apply...")
    for fix in fixes:
        apply_fix(*fix)
    
    print("\n🎉 Done! Check files, then: npm run dev")
