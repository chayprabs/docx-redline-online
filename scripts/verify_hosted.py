from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


WEB_PATHS = [
    "/",
    "/docx-compare",
    "/docx-redline",
    "/docx-to-markdown",
    "/docx-to-html",
    "/docx-comments-extract",
]

API_PATHS = [
    "/health",
    "/v1/meta",
    "/v1/samples",
]


@dataclass
class CheckResult:
    name: str
    url: str
    status: int | None
    ok: bool
    detail: str


def fetch(url: str) -> tuple[int | None, str]:
    request = Request(
        url,
        headers={
            "user-agent": "DocxRedlineHostedVerifier/1.0",
            "accept": "application/json,text/html,*/*",
        },
    )
    try:
        with urlopen(request, timeout=20) as response:
            return response.status, response.read(512).decode("utf-8", errors="replace")
    except HTTPError as error:
        return error.code, error.read(512).decode("utf-8", errors="replace")
    except URLError as error:
        return None, str(error.reason)


def normalize_base(url: str) -> str:
    return url.rstrip("/")


def run_checks(web_base: str, api_base: str) -> list[CheckResult]:
    results: list[CheckResult] = []

    for path in WEB_PATHS:
        status, detail = fetch(f"{normalize_base(web_base)}{path}")
        results.append(
            CheckResult(
                name=f"web:{path}",
                url=f"{normalize_base(web_base)}{path}",
                status=status,
                ok=status == 200,
                detail=detail.strip(),
            )
        )

    for path in API_PATHS:
        status, detail = fetch(f"{normalize_base(api_base)}{path}")
        results.append(
            CheckResult(
                name=f"api:{path}",
                url=f"{normalize_base(api_base)}{path}",
                status=status,
                ok=status == 200,
                detail=detail.strip(),
            )
        )

    return results


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify hosted DocxRedline web routes and worker endpoints."
    )
    parser.add_argument("--web-url", required=True, help="Public web base URL")
    parser.add_argument("--api-url", required=True, help="Public worker API base URL")
    parser.add_argument(
        "--output",
        help="Optional JSON output path",
    )
    args = parser.parse_args()

    results = run_checks(args.web_url, args.api_url)
    payload = {
        "web_url": normalize_base(args.web_url),
        "api_url": normalize_base(args.api_url),
        "all_passed": all(result.ok for result in results),
        "checks": [asdict(result) for result in results],
    }
    rendered = json.dumps(payload, indent=2)
    print(rendered)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as handle:
            handle.write(rendered + "\n")

    return 0 if payload["all_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
