# Pyxelze

Qt GUI frontend for [roxify](https://github.com/RoxasYTB/roxify).

Multi-format compression and extraction with AES-256-GCM encryption.

Pyxelze 1.4.8 bundles Roxify 1.16.18. The engine version is pinned in
`roxify-version.txt` for Linux, Windows and macOS releases. Existing archives
remain compatible. The macOS package requires macOS 15 or later, matching the
published Roxify binaries.

## Build

```bash
mkdir build && cd build
cmake ..
cmake --build .
```

To use the pinned engine, download the CLI asset for your platform and pass its
path to CMake. For example, on Linux x86_64:

```bash
python3 scripts/download_roxify.py \
  --asset roxify_native-x86_64-unknown-linux-gnu \
  --output build/roxify/roxify_native
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
  -DROXIFY_NATIVE="$PWD/build/roxify/roxify_native" -DPYXELZE_BUILD_TESTS=ON
cmake --build build --parallel
ctest --test-dir build --output-on-failure
```

The downloader accepts release tags with or without a `v` prefix and checks
the asset size and GitHub's SHA256 digest when available. It never substitutes
the latest engine for the pinned version. The integration test exercises
Pyxelze's process runner and archive parser against the bundled CLI, including
encrypted archives and selective extraction.
