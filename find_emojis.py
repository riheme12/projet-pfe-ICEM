import os
import sys

EXCLUDE_DIRS = {
    'node_modules', '.git', '.dart_tool', '.idea', 'build', '.vscode', '.cursor',
    'ios', 'android', 'windows', 'macos', 'linux', 'pubspec.lock', 'package-lock.json',
    '.github', '.flutter-plugins-dependencies'
}

EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.dart', '.html', '.css', '.json', '.md', '.yaml', '.yml', '.py'}

def is_emoji(ch):
    cp = ord(ch)
    # Emoticons
    if 0x1F600 <= cp <= 0x1F64F: return True
    # Misc Symbols and Pictographs
    if 0x1F300 <= cp <= 0x1F5FF: return True
    # Transport and Map Symbols
    if 0x1F680 <= cp <= 0x1F6FF: return True
    # Supplemental Symbols and Pictographs
    if 0x1F900 <= cp <= 0x1F9FF: return True
    # Symbols and Pictographs Extended-A
    if 0x1FA70 <= cp <= 0x1FAFF: return True
    # Dingbats
    if 0x2702 <= cp <= 0x27B0: return True
    # Misc symbols
    if 0x2600 <= cp <= 0x26FF: return True
    # Variation selectors (often paired with emoji)
    if cp == 0xFE0F: return True
    # Enclosed alphanumeric supplement
    if 0x1F100 <= cp <= 0x1F1FF: return True
    # Check mark, cross mark etc
    if cp in (0x2705, 0x2714, 0x2716, 0x274C, 0x274E, 0x2728, 0x2B50, 0x2B55, 0x3030, 0x303D, 0x23F0, 0x23F3, 0x231A, 0x231B):
        return True
    return False

results = []
root_dir = os.path.dirname(os.path.abspath(__file__))

for dirpath, dirnames, filenames in os.walk(root_dir):
    dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
    for fname in filenames:
        _, ext = os.path.splitext(fname)
        if ext not in EXTENSIONS:
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
                for lineno, line in enumerate(f, 1):
                    for ch in line:
                        if is_emoji(ch):
                            rel = os.path.relpath(fpath, root_dir)
                            results.append(f"{rel}:{lineno}: {line.rstrip()}")
                            break
        except Exception:
            pass

out_path = os.path.join(root_dir, 'emoji_report.txt')
with open(out_path, 'w', encoding='utf-8') as out:
    out.write(f"Total matches: {len(results)}\n\n")
    for r in results:
        out.write(r + '\n')

print(f"Done. {len(results)} matches written to emoji_report.txt")
