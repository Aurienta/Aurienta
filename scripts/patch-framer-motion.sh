#!/usr/bin/env bash
# AURIENTA — Patch framer-motion to fix React 19.3 "useInsertionEffect must not
# schedule updates" warning.
#
# Root cause: framer-motion@12.43.0 calls visualElement.update() inside
# useInsertionEffect (use-visual-element.mjs:67). React 19.3 added stricter
# checks that useInsertionEffect callbacks must not schedule state updates.
# visualElement.update() internally triggers a re-render, violating this rule.
#
# Fix: replace useInsertionEffect with useLayoutEffect ONLY in the specific
# call site that calls visualElement.update(). All other useInsertionEffect
# calls in framer-motion are valid (ref mutations, subscriptions, DOM style
# insertion) and must NOT be changed.
#
# This patch is idempotent — safe to run multiple times.
# Applied as a postinstall hook so it survives npm/bun install.
set -e
FM_DIR="node_modules/framer-motion/dist"

if [ ! -d "$FM_DIR" ]; then
  echo "[patch-framer-motion] framer-motion not installed — skipping"
  exit 0
fi

echo "[patch-framer-motion] Applying React 19.3 compatibility patch..."

# Use Python for precise multi-line replacement
python3 << 'PATCH_EOF'
import re, os

FM_DIR = "node_modules/framer-motion/dist"
patched_count = 0
skipped_count = 0

def patch_file(filepath, pattern, replacement, label):
    """Patch a single file if it matches the pattern."""
    global patched_count, skipped_count
    if not os.path.exists(filepath):
        return
    with open(filepath) as f:
        content = f.read()
    if replacement.split('(')[0] in content and 'PATCHED' not in content.split(replacement.split('(')[0])[1][:200] if replacement.split('(')[0] in content else False:
        # Already patched (useLayoutEffect present near the update site)
        pass
    if pattern in content:
        content = content.replace(pattern, replacement, 1)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ {label}: patched")
        patched_count += 1
    else:
        # Check if already patched
        if 'useLayoutEffect' in content and 'visualElement.update' in content:
            print(f"  ⏭️  {label}: already patched")
            skipped_count += 1
        else:
            print(f"  ⚠️  {label}: pattern not found")

# ── 1. ESM build (used by webpack — the primary fix target) ──
# The exact block to replace:
old_esm = """    useInsertionEffect(() => {
        /**
         * Check the component has already mounted before calling
         * `update` unnecessarily. This ensures we skip the initial update.
         */
        if (visualElement && isMounted.current) {
            visualElement.update(props, presenceContext);
        }
    });"""

new_esm = """    useLayoutEffect(() => {
        /**
         * Check the component has already mounted before calling
         * `update` unnecessarily. This ensures we skip the initial update.
         *
         * PATCHED: was useInsertionEffect — React 19.3 forbids scheduling
         * updates inside useInsertionEffect. useLayoutEffect is the correct
         * hook for triggering visual element updates before paint.
         */
        if (visualElement && isMounted.current) {
            visualElement.update(props, presenceContext);
        }
    });"""

patch_file(f"{FM_DIR}/es/motion/utils/use-visual-element.mjs", old_esm, new_esm, "ESM use-visual-element.mjs")

# Also fix the import line to include useLayoutEffect
imp_file = f"{FM_DIR}/es/motion/utils/use-visual-element.mjs"
if os.path.exists(imp_file):
    with open(imp_file) as f:
        content = f.read()
    old_imp = "import { useContext, useRef, useInsertionEffect, useEffect } from 'react';"
    new_imp = "import { useContext, useRef, useInsertionEffect as _useInsertionEffect, useLayoutEffect, useEffect } from 'react';"
    if old_imp in content:
        content = content.replace(old_imp, new_imp)
        with open(imp_file, 'w') as f:
            f.write(content)

# ── 2. CJS build ──
cjs_file = f"{FM_DIR}/cjs/index-6W16WHlG.js"
if os.path.exists(cjs_file):
    with open(cjs_file) as f:
        content = f.read()
    matches = list(re.finditer(r'React\.useInsertionEffect\(\(\) => \{', content))
    for m in matches:
        snippet = content[m.start():m.start()+500]
        if '.update(props' in snippet or 'visualElement.update' in snippet:
            content = content[:m.start()] + 'React.useLayoutEffect(() => {' + content[m.end():]
            with open(cjs_file, 'w') as f:
                f.write(content)
            print(f"  ✅ CJS index-6W16WHlG.js: patched")
            patched_count += 1
            break
    else:
        if 'React.useLayoutEffect' in content and 'visualElement.update' in content:
            print(f"  ⏭️  CJS index-6W16WHlG.js: already patched")
            skipped_count += 1

# ── 3. Bundled dev build ──
for bfile in ["framer-motion.dev.js", "framer-motion.js"]:
    fpath = f"{FM_DIR}/{bfile}"
    if not os.path.exists(fpath):
        continue
    with open(fpath) as f:
        content = f.read()
    matches = list(re.finditer(r'useInsertionEffect\(\(\) => \{', content))
    for m in matches:
        snippet = content[m.start():m.start()+500]
        if '.update(props' in snippet or 'visualElement.update' in snippet:
            content = content[:m.start()] + 'useLayoutEffect(() => {' + content[m.end():]
            with open(fpath, 'w') as f:
                f.write(content)
            print(f"  ✅ {bfile}: patched")
            patched_count += 1
            break
    else:
        if 'useLayoutEffect' in content and 'visualElement.update' in content:
            print(f"  ⏭️  {bfile}: already patched")
            skipped_count += 1

print(f"\n[patch-framer-motion] Done: {patched_count} patched, {skipped_count} already patched")
PATCH_EOF