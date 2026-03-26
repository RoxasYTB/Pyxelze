#!/bin/bash
set -e
cd "$(dirname "$0")/.."

VERSION=$(grep 'project(Pyxelze VERSION' CMakeLists.txt | grep -oP '\d+\.\d+\.\d+')
BUILD_DIR="build"

echo "Building Pyxelze v${VERSION} Windows installer..."
echo "Prerequisites: cross-compile with MXE or build on Windows with Qt6 + CMake"
echo ""

if [ -f "${BUILD_DIR}/pyxelze.exe" ]; then
    echo "Found pyxelze.exe"
else
    echo "ERROR: ${BUILD_DIR}/pyxelze.exe not found"
    echo "Build on Windows first: cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --config Release"
    exit 1
fi

ROXIFY_WIN=""
NPM_ROOT=$(npm root -g 2>/dev/null || true)
if [ -n "${NPM_ROOT}" ] && [ -f "${NPM_ROOT}/roxify/dist/roxify_native.exe" ]; then
    ROXIFY_WIN="${NPM_ROOT}/roxify/dist/roxify_native.exe"
fi

if [ -n "${ROXIFY_WIN}" ]; then
    mkdir -p "${BUILD_DIR}/roxify"
    cp "${ROXIFY_WIN}" "${BUILD_DIR}/roxify/roxify_native.exe"
    echo "Copied roxify_native.exe"
fi

if command -v windeployqt6 &>/dev/null; then
    mkdir -p "${BUILD_DIR}/deploy"
    windeployqt6 --dir "${BUILD_DIR}/deploy" "${BUILD_DIR}/pyxelze.exe"
    echo "Qt dependencies deployed"
elif command -v windeployqt &>/dev/null; then
    mkdir -p "${BUILD_DIR}/deploy"
    windeployqt --dir "${BUILD_DIR}/deploy" "${BUILD_DIR}/pyxelze.exe"
    echo "Qt dependencies deployed"
else
    echo "WARNING: windeployqt not found — Qt DLLs must be deployed manually"
fi

if command -v iscc &>/dev/null; then
    iscc packaging/windows/installer.iss
    echo ""
    echo "Installer built: ${BUILD_DIR}/Pyxelze-${VERSION}-Setup.exe"
elif command -v wine &>/dev/null && [ -f "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    wine "$HOME/.wine/drive_c/Program Files (x86)/Inno Setup 6/ISCC.exe" packaging/windows/installer.iss
    echo ""
    echo "Installer built: ${BUILD_DIR}/Pyxelze-${VERSION}-Setup.exe"
else
    echo ""
    echo "InnoSetup not found. To build the installer:"
    echo "  1. Install InnoSetup 6 on Windows"
    echo "  2. Open packaging/windows/installer.iss"
    echo "  3. Compile"
fi
