import os
import sys

IGNORE = {'.git', 'node_modules', '__pycache__', '.vite', 'dist', '.next'}
TEXT_EXT = {'.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.py', '.txt'}

def print_tree(root, prefix=''):
    entries = sorted(os.scandir(root), key=lambda e: (not e.is_dir(), e.name))
    entries = [e for e in entries if e.name not in IGNORE]
    for i, entry in enumerate(entries):
        connector = '└── ' if i == len(entries) - 1 else '├── '
        print(prefix + connector + entry.name)
        if entry.is_dir():
            extension = '    ' if i == len(entries) - 1 else '│   '
            print_tree(entry.path, prefix + extension)

def print_file(path):
    ext = os.path.splitext(path)[1]
    if ext not in TEXT_EXT:
        return
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f'\n{"="*10}')
        print(f'FILE: {path}')
        print(f'{"="*10}')
        print(content)
    except Exception as e:
        print(f'Chyba: {e}')

def read_targets(targets):
    for t in targets:
        t = t.strip()
        if os.path.isfile(t):
            print_file(t)
        elif os.path.isdir(t):
            for dirpath, dirnames, filenames in os.walk(t):
                dirnames[:] = [d for d in dirnames if d not in IGNORE]
                for fname in sorted(filenames):
                    if os.path.splitext(fname)[1] in TEXT_EXT:
                        print_file(os.path.join(dirpath, fname))
        else:
            print(f'[Nenalezeno: {t}]')

if len(sys.argv) < 2:
    print("Použití:")
    print("  python ctx.py tree [cesta]")
    print("  python ctx.py read cesta1 cesta2 ...")
    sys.exit()

cmd = sys.argv[1]

if cmd == 'tree':
    root = sys.argv[2] if len(sys.argv) > 2 else '.'
    print(root)
    print_tree(root)

elif cmd == 'read':
    read_targets(sys.argv[2:])

while True:
    line = input("ctx> ").strip()
    if not line:
        continue
    parts = line.split()
    cmd = parts[0]
    args = parts[1:]
    if cmd == 'tree':
        root = args[0] if args else '.'
        print(root)
        print_tree(root)
    elif cmd == 'read':
        read_targets(args)
    elif cmd in ('exit', 'quit'):
        break
    else:
        print(f'Neznámý příkaz: {cmd}')