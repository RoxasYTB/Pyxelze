#!/bin/bash
set -e
cd "$(dirname "$0")/.."

VERSION=$(grep 'project(Pyxelze VERSION' CMakeLists.txt | grep -oP '\d+\.\d+\.\d+')
DEB_NAME="pyxelze_${VERSION}_amd64"
BUILD_DIR="build"
PKG_DIR="${BUILD_DIR}/${DEB_NAME}"

echo "Building Pyxelze v${VERSION} .deb package..."

ROXIFY_OPT=""
if [ -n "${ROXIFY_NATIVE:-}" ]; then
    ROXIFY_OPT="-DROXIFY_NATIVE=${ROXIFY_NATIVE}"
fi

mkdir -p "${BUILD_DIR}"
cd "${BUILD_DIR}"
cmake .. -DCMAKE_BUILD_TYPE=Release ${ROXIFY_OPT}
make -j"$(nproc)"
cd ..

rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/bin"
mkdir -p "${PKG_DIR}/usr/lib/pyxelze"
mkdir -p "${PKG_DIR}/usr/share/applications"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/scalable/apps"

cp "${BUILD_DIR}/pyxelze" "${PKG_DIR}/usr/bin/pyxelze"
strip "${PKG_DIR}/usr/bin/pyxelze"

ROX_SRC=""
if [ -f "${BUILD_DIR}/roxify/roxify_native" ]; then
    ROX_SRC="${BUILD_DIR}/roxify/roxify_native"
elif [ -n "${ROXIFY_NATIVE:-}" ] && [ -f "${ROXIFY_NATIVE}" ]; then
    ROX_SRC="${ROXIFY_NATIVE}"
fi

if [ -n "$ROX_SRC" ]; then
    cp "$ROX_SRC" "${PKG_DIR}/usr/lib/pyxelze/roxify_native"
    chmod 755 "${PKG_DIR}/usr/lib/pyxelze/roxify_native"
    strip "${PKG_DIR}/usr/lib/pyxelze/roxify_native" 2>/dev/null || true
else
    echo "WARNING: roxify_native not found"
fi

cp packaging/debian/control "${PKG_DIR}/DEBIAN/control"
sed -i 's/\r$//' "${PKG_DIR}/DEBIAN/control"
cp packaging/debian/postinst "${PKG_DIR}/DEBIAN/postinst"
chmod 755 "${PKG_DIR}/DEBIAN/postinst"

cp packaging/debian/pyxelze.desktop "${PKG_DIR}/usr/share/applications/pyxelze.desktop"

if [ -f resources/icons/app.png ]; then
    cp resources/icons/app.png "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps/pyxelze.png"
fi
if [ -f resources/icons/app.svg ]; then
    cp resources/icons/app.svg "${PKG_DIR}/usr/share/icons/hicolor/scalable/apps/pyxelze.svg"
fi

INSTALLED_SIZE=$(du -sk "${PKG_DIR}/usr" | cut -f1)
sed -i "s/^Version:.*/Version: ${VERSION}/" "${PKG_DIR}/DEBIAN/control"
sed -i "/^Architecture:.*/a Installed-Size: ${INSTALLED_SIZE}" "${PKG_DIR}/DEBIAN/control"

dpkg-deb --root-owner-group --build "${PKG_DIR}" "${BUILD_DIR}/${DEB_NAME}.deb"

echo ""
echo "Package built: ${BUILD_DIR}/${DEB_NAME}.deb"
echo "Size: $(du -h "${BUILD_DIR}/${DEB_NAME}.deb" | cut -f1)"
echo "Install with: sudo dpkg -i ${BUILD_DIR}/${DEB_NAME}.deb"
