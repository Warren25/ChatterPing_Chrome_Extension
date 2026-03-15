#!/usr/bin/env bash
# build-extension.sh
# Produces a clean, versioned zip of the extension/ folder for Chrome Web Store upload.
# Usage: bash scripts/build-extension.sh

set -e

EXTENSION_DIR="extension"
MANIFEST="$EXTENSION_DIR/manifest.json"
DIST_DIR="dist"

# Read version from manifest.json (no external dependencies required)
VERSION=$(grep '"version"' "$MANIFEST" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
OUTPUT="$DIST_DIR/chatterping-v${VERSION}.zip"

echo "Building ChatterPing v${VERSION}..."

# Ensure dist/ directory exists
mkdir -p "$DIST_DIR"

# Remove any previous build for this version
rm -f "$OUTPUT"

# Remove hidden OS files from the extension folder before zipping
find "$EXTENSION_DIR" -name ".DS_Store" -delete
find "$EXTENSION_DIR" -name "*.orig" -delete

# Create the zip, excluding OS metadata folders and hidden files
cd "$EXTENSION_DIR"
zip -r --quiet "../$OUTPUT" . \
  --exclude "*.DS_Store" \
  --exclude "__MACOSX/*" \
  --exclude "*/.git/*" \
  --exclude "*.orig"
cd ..

echo "✓ Created $OUTPUT"
echo ""
echo "Verify contents:"
unzip -l "$OUTPUT"
