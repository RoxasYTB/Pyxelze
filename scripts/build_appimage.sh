#!/bin/bash
set -e
cd "$(dirname "$0")/.."

VERSION=$(grep 'project(Pyxelze VERSION' CMakeLists.txt | grep -oP '\d+\.\d+\.\d+')
BUILD_DIR="build"
APPDIR="${BUILD_DIR}/Pyxelze.AppDir"

echo "Building Pyxelze v${VERSION} AppImage..."

ROXIFY_OPT=""
if [ -n "${ROXIFY_NATIVE:-}" ]; then
    ROXIFY_OPT="-DROXIFY_NATIVE=${ROXIFY_NATIVE}"
fi

mkdir -p "${BUILD_DIR}"
cd "${BUILD_DIR}"
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr ${ROXIFY_OPT}
make -j"$(nproc)"
cd ..

rm -rf "${APPDIR}"
mkdir -p "${APPDIR}/usr/bin"
mkdir -p "${APPDIR}/usr/lib/pyxelze"
mkdir -p "${APPDIR}/usr/share/applications"
mkdir -p "${APPDIR}/usr/share/icons/hicolor/256x256/apps"

cp "${BUILD_DIR}/pyxelze" "${APPDIR}/usr/bin/pyxelze"
strip "${APPDIR}/usr/bin/pyxelze"

if [ -f "${BUILD_DIR}/roxify/roxify_native" ]; then
    cp "${BUILD_DIR}/roxify/roxify_native" "${APPDIR}/usr/lib/pyxelze/roxify_native"
    chmod 755 "${APPDIR}/usr/lib/pyxelze/roxify_native"
fi

cp packaging/debian/pyxelze.desktop "${APPDIR}/usr/share/applications/pyxelze.desktop"
cp packaging/debian/pyxelze.desktop "${APPDIR}/pyxelze.desktop"

if [ -f resources/icons/app.png ]; then
    cp resources/icons/app.png "${APPDIR}/usr/share/icons/hicolor/256x256/apps/pyxelze.png"
    cp resources/icons/app.png "${APPDIR}/pyxelze.png"
fi

cat > "${APPDIR}/AppRun" << 'APPRUN'
#!/bin/bash
HERE="$(dirname "$(readlink -f "$0")")"
export LD_LIBRARY_PATH="${HERE}/usr/lib:${HERE}/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH}"
export PATH="${HERE}/usr/lib/pyxelze:${PATH}"
exec "${HERE}/usr/bin/pyxelze" "$@"
APPRUN
chmod 755 "${APPDIR}/AppRun"

LINUXDEPLOY="${BUILD_DIR}/linuxdeploy-x86_64.AppImage"
if [ ! -f "${LINUXDEPLOY}" ]; then
    echo "Downloading linuxdeploy..."
    curl -fsSL -o "${LINUXDEPLOY}" \
        "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage"
    chmod +x "${LINUXDEPLOY}"
fi

PLUGIN="${BUILD_DIR}/linuxdeploy-plugin-qt-x86_64.AppImage"
if [ ! -f "${PLUGIN}" ]; then
    echo "Downloading Qt plugin..."
    curl -fsSL -o "${PLUGIN}" \
        "https://github.com/linuxdeploy/linuxdeploy-plugin-qt/releases/download/continuous/linuxdeploy-plugin-qt-x86_64.AppImage"
    chmod +x "${PLUGIN}"
fi

export APPIMAGE_EXTRACT_AND_RUN=1

export OUTPUT="${BUILD_DIR}/Pyxelze-${VERSION}-x86_64.AppImage"

QMAKE_PATH=$(which qmake6 2>/dev/null || which qmake 2>/dev/null || true)
if [ -n "${QMAKE_PATH}" ]; then
    export QMAKE="${QMAKE_PATH}"
fi

"${LINUXDEPLOY}" --appdir "${APPDIR}" \
    --desktop-file "${APPDIR}/pyxelze.desktop" \
    --icon-file "${APPDIR}/pyxelze.png" \
    --plugin qt \
    --output appimage

echo ""
echo "AppImage built: ${OUTPUT}"
echo "Size: $(du -h "${OUTPUT}" | cut -f1)"
