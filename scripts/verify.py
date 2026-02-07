import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)

def ok(msg):
    print("OK:", msg)

required = ["index.html", "game.js", "AGENTS.md"]
for f in required:
    p = os.path.join(ROOT, f)
    if not os.path.exists(p):
        fail(f"missing {f}")
    ok(f"found {f}")

print("PASS")
