from __future__ import annotations

import argparse
import subprocess
import sys
from urllib.parse import quote


def normalize_remote(remote_url: str) -> str:
    remote_url = remote_url.strip()
    if remote_url.startswith("git@"):
        host_and_path = remote_url.removeprefix("git@")
        host, path = host_and_path.split(":", 1)
        normalized = f"https://{host}/{path}"
    else:
        normalized = remote_url

    if normalized.endswith(".git"):
        normalized = normalized[:-4]

    return normalized


def get_origin_url() -> str:
    completed = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "Unable to read git remote origin URL.")
    return normalize_remote(completed.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Print the Render Blueprint dashboard URL for the current repository."
    )
    parser.add_argument(
        "--repo-url",
        help="Optional repository URL override. Defaults to git remote origin.",
    )
    args = parser.parse_args()

    try:
        repo_url = normalize_remote(args.repo_url) if args.repo_url else get_origin_url()
    except Exception as error:  # pragma: no cover - simple CLI failure path
        print(str(error), file=sys.stderr)
        return 1

    deeplink = f"https://dashboard.render.com/blueprint/new?repo={quote(repo_url, safe=':/')}"
    print(deeplink)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
