#!/usr/bin/env python3
"""Download a CLI asset from the Roxify version pinned by this checkout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def release_for_version(version):
    for tag in (f"v{version}", version):
        request = Request(
            f"https://api.github.com/repos/RoxasYTB/roxify/releases/tags/{tag}",
            headers={"User-Agent": "Pyxelze", "Accept": "application/vnd.github+json"},
        )
        try:
            with urlopen(request, timeout=60) as response:
                return json.load(response)
        except HTTPError as error:
            if error.code != 404:
                raise
    raise RuntimeError(f"Roxify {version} has no published GitHub release")


def download(asset_name, destination):
    version = (Path(__file__).resolve().parents[1] / "roxify-version.txt").read_text().strip()
    release = release_for_version(version)
    asset = next((item for item in release["assets"] if item["name"] == asset_name), None)
    if asset is None:
        raise RuntimeError(f"{asset_name} is missing from Roxify {release['tag_name']}")
    destination = Path(destination).resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        request = Request(asset["browser_download_url"], headers={"User-Agent": "Pyxelze"})
        checksum = hashlib.sha256()
        with urlopen(request, timeout=120) as response, tempfile.NamedTemporaryFile(
            dir=destination.parent, delete=False
        ) as output:
            temporary = Path(output.name)
            while chunk := response.read(1024 * 1024):
                checksum.update(chunk)
                output.write(chunk)
        if temporary.stat().st_size != asset["size"]:
            raise RuntimeError(f"Incomplete download of {asset_name}")
        expected_digest = asset.get("digest")
        if expected_digest and expected_digest != f"sha256:{checksum.hexdigest()}":
            raise RuntimeError(f"Checksum mismatch for {asset_name}")
        temporary.chmod(0o755)
        os.replace(temporary, destination)
        print(f"Roxify {release['tag_name']}: {destination} (sha256:{checksum.hexdigest()})")
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    download(args.asset, args.output)
