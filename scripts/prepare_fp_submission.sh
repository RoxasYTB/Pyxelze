#!/usr/bin/env bash
set -euo pipefail

# Usage: prepare_fp_submission.sh OUT_DIR FILE1 [FILE2 ...]
if [ $# -lt 2 ]; then
  echo "Usage: $0 OUT_DIR FILE [FILE ...]"; exit 1
fi
OUT_DIR="$1"; shift
mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/report.txt"
> "$REPORT"

echo "Preparing false-positive submission package in: $OUT_DIR"
echo "Files included:" >> "$REPORT"
for f in "$@"; do
  if [ -f "$f" ]; then
    sha=$(sha256sum "$f" | awk '{print $1}')
    echo "$f -> $sha" >> "$REPORT"
    echo "- $f" >> "$OUT_DIR/files.txt"
    cp "$f" "$OUT_DIR/" || true
  else
    echo "Warning: file not found: $f" >> "$REPORT"
  fi
done

cat > "$OUT_DIR/submission_template.txt" <<'TEMPLATE'
Please use the following template when submitting a false-positive report to VirusTotal / Microsoft / vendor:

Product: Pyxelze
Sample filename(s):
{LIST_FILES}
SHA256:
{SHA_LIST}

Description:
This sample is a legitimate build of the Pyxelze application. It was flagged as malicious by some antivirus vendors (false positive). The project is open-source and contains no malicious behavior. Please re-evaluate and mark as safe.

Notes:
- Build method: .NET 7 on Windows, installer built with Inno Setup
- Repro instructions: https://github.com/pyxelze/pyxelze (include link to exact commit or release tag)
- Contact: maintainer@pyxelze.example

Attachments included: installer and/or executable

TEMPLATE

# Fill placeholders in a safe way (avoid sed substitution issues with newlines/special chars)
filled="$OUT_DIR/submission_filled.txt"
> "$filled"

echo "Product: Pyxelze" >> "$filled"
echo "Sample filename(s):" >> "$filled"
for f in "$OUT_DIR"/*; do
  [ -f "$f" ] || continue
  echo "- $(basename "$f")" >> "$filled"
done

echo "" >> "$filled"
echo "SHA256:" >> "$filled"
for f in "$OUT_DIR"/*; do
  [ -f "$f" ] || continue
  sha256sum "$f" | awk '{print "- " $1 "  " $2}' >> "$filled"
done

echo "" >> "$filled"
cat >> "$filled" <<'TEMPLATE_END'

Description:
This sample is a legitimate build of the Pyxelze application. It was flagged as malicious by some antivirus vendors (false positive). The project is open-source and contains no malicious behavior. Please re-evaluate and mark as safe.

Notes:
- Build method: .NET 7 on Windows, installer built with Inno Setup
- Repro instructions: https://github.com/pyxelze/pyxelze (include link to exact commit or release tag)
- Contact: maintainer@pyxelze.example

Attachments included: installer and/or executable

TEMPLATE_END

# Create archive (build to a temp file outside the directory to avoid including the archive while it is being created)
TMP_TAR=$(mktemp -u "/tmp/fp_submission.XXXXXX.tar.gz")
if tar -czf "$TMP_TAR" -C "$OUT_DIR" .; then
  mv -f "$TMP_TAR" "$OUT_DIR/fp_submission.tar.gz"
  echo "Prepared submission at: $OUT_DIR/fp_submission.tar.gz"
  echo "Report and filled template at: $OUT_DIR/submission_filled.txt and $REPORT"
else
  echo "ERROR: failed to create tarball"; exit 1
fi
