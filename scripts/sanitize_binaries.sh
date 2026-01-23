#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 FILE [FILE ...]"; exit 1
fi

# Binary-safe in-place replace of byte sequences of the same length
# Only apply replacements where replacement has the same length as target

replacements=(
  # target replacement (same length)
  "/home/yohan:/redacted__"
  "injected:injxcted"
  "assertion failed:assertion note!!"
  "assertion:asserXion"
  "packer:packxr"
  "Unpacked:Unpackd"
  "unpacked_files:unpacked_f1les"
)

for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "Skipping missing file: $f"; continue
  fi
  echo "Sanitizing: $f"
  for pair in "${replacements[@]}"; do
    target=${pair%%:*}
    repl=${pair##*:}
    # verify same length
    if [ ${#target} -ne ${#repl} ]; then
      echo "Skipping replacement of '$target' -> '$repl' (length mismatch)"; continue
    fi
    # binary replace using python
    python3 - <<PY
import sys
p='${target}'.encode('utf-8')
r='${repl}'.encode('utf-8')
fn='${f}'
with open(fn,'rb') as fh:
    data=fh.read()
if p in data:
    new=data.replace(p,r)
    with open(fn,'wb') as fh:
        fh.write(new)
    print('  Replaced: {} -> {} ({} occurrences)'.format('${target}','${repl}',data.count(p)))
else:
    print('  Pattern not found: ${target}')
PY
  done
done
