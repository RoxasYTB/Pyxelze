#!/bin/bash
set -e
cd "$(dirname "$0")/.."

VERSION=$(grep 'project(Pyxelze VERSION' CMakeLists.txt | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
BUILD_DIR="build-macos"
APP_NAME="Pyxelze.app"

echo "Building Pyxelze v${VERSION} for macOS..."

# Generate .icns from appIcon.ico if not already present or outdated
ICNS_PATH="resources/icons/pyxelze.icns"
ICO_PATH="appIcon.ico"
if [ -f "${ICO_PATH}" ] && [ ! -f "${ICNS_PATH}" -o "${ICO_PATH}" -nt "${ICNS_PATH}" ]; then
    echo "Generating .icns from ${ICO_PATH}..."
    ICONSET_DIR=$(mktemp -d)/pyxelze.iconset
    mkdir -p "${ICONSET_DIR}"
    sips -s format png "${ICO_PATH}" --out "${ICONSET_DIR}/base.png" >/dev/null
    for sz in 16 32 64 128 256 512 1024; do
        sips -z $sz $sz "${ICONSET_DIR}/base.png" --out "${ICONSET_DIR}/tmp_${sz}.png" >/dev/null
    done
    cp "${ICONSET_DIR}/tmp_16.png"   "${ICONSET_DIR}/icon_16x16.png"
    cp "${ICONSET_DIR}/tmp_32.png"   "${ICONSET_DIR}/icon_16x16@2x.png"
    cp "${ICONSET_DIR}/tmp_32.png"   "${ICONSET_DIR}/icon_32x32.png"
    cp "${ICONSET_DIR}/tmp_64.png"   "${ICONSET_DIR}/icon_32x32@2x.png"
    cp "${ICONSET_DIR}/tmp_128.png"  "${ICONSET_DIR}/icon_128x128.png"
    cp "${ICONSET_DIR}/tmp_256.png"  "${ICONSET_DIR}/icon_128x128@2x.png"
    cp "${ICONSET_DIR}/tmp_256.png"  "${ICONSET_DIR}/icon_256x256.png"
    cp "${ICONSET_DIR}/tmp_512.png"  "${ICONSET_DIR}/icon_256x256@2x.png"
    cp "${ICONSET_DIR}/tmp_512.png"  "${ICONSET_DIR}/icon_512x512.png"
    cp "${ICONSET_DIR}/tmp_1024.png" "${ICONSET_DIR}/icon_512x512@2x.png"
    iconutil -c icns "${ICONSET_DIR}" -o "${ICNS_PATH}"
    echo "Generated ${ICNS_PATH}"
fi

ROXIFY_OPT=""
if [ -n "${ROXIFY_NATIVE:-}" ]; then
    ROXIFY_OPT="-DROXIFY_NATIVE=${ROXIFY_NATIVE}"
fi

cmake -S . -B "${BUILD_DIR}" -DCMAKE_BUILD_TYPE=Release ${ROXIFY_OPT}
cmake --build "${BUILD_DIR}" --config Release --parallel

APP_PATH="${BUILD_DIR}/${APP_NAME}"
if [ ! -d "${APP_PATH}" ]; then
    APP_PATH="${BUILD_DIR}/pyxelze.app"
fi

if [ ! -d "${APP_PATH}" ]; then
    echo "ERROR: app bundle was not generated"
    exit 1
fi

# Ensure roxify_native is bundled where RoxRunner searches first.
# CMake's post-build step copies into the app bundle directly when MACOSX_BUNDLE
# is enabled.  If it ended up outside the bundle (non-bundle build) copy it in.
ROX_IN_BUNDLE="${APP_PATH}/Contents/MacOS/roxify/roxify_native"
if [ ! -f "${ROX_IN_BUNDLE}" ]; then
    # Check common locations where the binary may exist
    for ROX_SRC in \
        "${BUILD_DIR}/roxify/roxify_native" \
        "${BUILD_DIR}/../build-debug/roxify/roxify_native" \
        "${BUILD_DIR}/../build-*/roxify/roxify_native"; do
        # expand glob
        for f in $ROX_SRC; do
            if [ -f "$f" ]; then
                mkdir -p "${APP_PATH}/Contents/MacOS/roxify"
                cp "$f" "${ROX_IN_BUNDLE}"
                chmod 755 "${ROX_IN_BUNDLE}"
                echo "Bundled roxify_native from $f"
                break 2
            fi
        done
    done
fi

if [ ! -f "${ROX_IN_BUNDLE}" ]; then
    echo "WARNING: roxify_native not found — archive operations will not work"
    echo "         Set ROXIFY_NATIVE=/path/to/roxify_native and rebuild, or place the binary in build-debug/roxify/"
fi

if command -v macdeployqt >/dev/null 2>&1; then
    macdeployqt "${APP_PATH}"
    echo "Qt frameworks deployed with macdeployqt"
else
    echo "WARNING: macdeployqt not found — run it manually before distributing"
fi

# Generate DMG background if needed
BG_IMG="resources/dmg_background.png"
if [ -f "scripts/create_dmg_background.py" ] && command -v python3 >/dev/null 2>&1; then
    python3 scripts/create_dmg_background.py 2>/dev/null || true
fi

# Create DMG installer with Applications symlink
DMG_PATH="${BUILD_DIR}/Pyxelze-${VERSION}-macOS.dmg"
if command -v hdiutil >/dev/null 2>&1; then
    DMG_STAGING="${BUILD_DIR}/dmg_staging"
    rm -rf "${DMG_STAGING}"
    mkdir -p "${DMG_STAGING}"

    cp -R "${APP_PATH}" "${DMG_STAGING}/"
    ln -s /Applications "${DMG_STAGING}/Applications"

    # Copy background into hidden folder in staging
    if [ -f "${BG_IMG}" ]; then
        mkdir -p "${DMG_STAGING}/.background"
        cp "${BG_IMG}" "${DMG_STAGING}/.background/background.png"
    fi

    # Create a temporary read-write DMG
    DMG_TMP="${BUILD_DIR}/Pyxelze-tmp.dmg"
    hdiutil create -volname "Pyxelze" -srcfolder "${DMG_STAGING}" \
        -ov -format UDRW -size 200m "${DMG_TMP}"

    # Try to apply Finder styling (best-effort, may fail on headless CI)
    MOUNT_DIR=$(hdiutil attach -readwrite -noverify "${DMG_TMP}" | \
        grep '/Volumes/Pyxelze' | awk '{print $NF}') || true

    if [ -n "${MOUNT_DIR}" ]; then
        osascript <<'APPLESCRIPT_END' 2>/dev/null || echo "Note: AppleScript styling skipped (headless environment)"
tell application "Finder"
    tell disk "Pyxelze"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set bounds of container window to {100, 100, 760, 500}
        set theViewOptions to the icon view options of container window
        set arrangement of theViewOptions to not arranged
        set icon size of theViewOptions to 80
        if exists file ".background:background.png" then
            set background picture of theViewOptions to file ".background:background.png"
        end if
        set position of item "pyxelze.app" of container window to {180, 200}
        set position of item "Applications" of container window to {480, 200}
        close
        open
        update without registering applications
        delay 2
        close
    end tell
end tell
APPLESCRIPT_END
        sync
        hdiutil detach "${MOUNT_DIR}" || hdiutil detach "${MOUNT_DIR}" -force
    fi

    # Convert to final compressed DMG
    hdiutil convert "${DMG_TMP}" -format UDZO -o "${DMG_PATH}" -ov
    rm -f "${DMG_TMP}"
    rm -rf "${DMG_STAGING}"
    echo "DMG created: ${DMG_PATH}"
fi

echo ""
echo "macOS app ready: ${APP_PATH}"
