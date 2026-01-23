#!/usr/bin/env bash
set -euo pipefail

# Usage: create_self_signed_pfx.sh [OUT_PFX] [PFX_PASS]
OUT_PFX="${1:-$(cd "$(dirname "$0")" && pwd)/signing_cert.pfx}"
PFX_PASS="${2:-changeit}"
SUBJ="/C=FR/ST=Unknown/L=Unknown/O=Pyxelze/CN=Pyxelze"

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: openssl not found; please install openssl to generate a self-signed PFX." >&2
  exit 1
fi

echo "Generating self-signed certificate (valid 10 years) at: $OUT_PFX" >&2
TMPDIR=$(mktemp -d)
KEY="$TMPDIR/key.pem"
CERT="$TMPDIR/cert.pem"

if ! openssl req -newkey rsa:2048 -nodes -keyout "$KEY" -x509 -days 3650 -out "$CERT" -subj "$SUBJ" >/dev/null 2>&1; then
  echo "ERROR: openssl req failed" >&2
  rm -rf "$TMPDIR"
  exit 1
fi

if ! openssl pkcs12 -export -out "$OUT_PFX" -inkey "$KEY" -in "$CERT" -passout pass:"$PFX_PASS" -name "Pyxelze Code Signing" >/dev/null 2>&1; then
  echo "ERROR: openssl pkcs12 export failed" >&2
  rm -rf "$TMPDIR"; exit 1
fi

chmod 600 "$OUT_PFX" 2>/dev/null || true
rm -rf "$TMPDIR"

# Only output the path on stdout
printf "%s" "$OUT_PFX"
