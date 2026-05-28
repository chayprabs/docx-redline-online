from __future__ import annotations

import argparse
import io
import json
import statistics
import sys
import time
import zipfile
from pathlib import Path

import httpx
from lxml import etree

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NSMAP = {"w": W_NS}


def _load_sample_builder():
    worker_src = Path(__file__).resolve().parent.parent / "apps" / "worker" / "src"
    if str(worker_src) not in sys.path:
        sys.path.insert(0, str(worker_src))

    from docx_redline_worker.services.sample_documents import (  # pylint: disable=import-outside-toplevel
        build_contract_redline_sample,
    )

    return build_contract_redline_sample


def _base_docx_bytes(variant: str) -> bytes:
    builder = _load_sample_builder()
    return builder("original" if variant == "original" else "revised")


def _make_paragraph(text: str) -> etree._Element:
    paragraph = etree.Element(f"{{{W_NS}}}p", nsmap=NSMAP)
    run = etree.SubElement(paragraph, f"{{{W_NS}}}r")
    node = etree.SubElement(run, f"{{{W_NS}}}t")
    node.text = text
    return paragraph


def _clause_text(index: int, variant: str) -> str:
    marker = f"{index:06d}-{(index * 7919) % 999983:06d}-{(index * index) % 104729:05d}"
    if variant == "original":
        return (
            f"Clause {index + 1} [{marker}] The supplier delivers milestone set {index % 17} "
            f"within {15 + (index % 4) * 5} calendar days after written approval and weekly status reporting."
        )
    return (
        f"Clause {index + 1} [{marker}] The supplier delivers milestone set {index % 17} "
        f"within {10 + (index % 4) * 5} business days after written approval with audit support, "
        f"weekly status reporting, and surviving confidentiality obligations."
    )


def build_synthetic_docx(target_size_bytes: int, *, variant: str) -> bytes:
    with zipfile.ZipFile(io.BytesIO(_base_docx_bytes(variant)), "r") as archive:
        files = {name: archive.read(name) for name in archive.namelist()}

    document_root = etree.fromstring(files["word/document.xml"])
    body = document_root.find(".//w:body", namespaces=NSMAP)
    if body is None:
        raise RuntimeError("Benchmark fixture is missing word/document.xml body.")

    section_properties = body.find("./w:sectPr", namespaces=NSMAP)
    for child in list(body):
        body.remove(child)

    body.append(
        _make_paragraph(
            "Master Services Agreement - synthetic benchmark fixture for DocxRedline compare qualification."
        )
    )

    index = 0
    while True:
        for _ in range(120):
            body.append(_make_paragraph(_clause_text(index, variant)))
            index += 1

        if section_properties is not None:
            body.append(section_properties)

        files["word/document.xml"] = etree.tostring(
            document_root,
            xml_declaration=True,
            encoding="UTF-8",
            standalone="yes",
        )

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, data in files.items():
                archive.writestr(name, data)
        payload = buffer.getvalue()
        if len(payload) >= target_size_bytes:
            return payload

        if section_properties is not None:
            body.remove(section_properties)


def percentile(values: list[float], pct: float) -> float:
    if not values:
        raise ValueError("Cannot compute a percentile for an empty sample.")

    ordered = sorted(values)
    rank = (len(ordered) - 1) * pct
    lower = int(rank)
    upper = min(lower + 1, len(ordered) - 1)
    weight = rank - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def benchmark_compare(
    *,
    base_url: str,
    iterations: int,
    target_size_bytes: int,
    timeout_seconds: float,
) -> dict[str, object]:
    fixture_started = time.perf_counter()
    original = build_synthetic_docx(target_size_bytes, variant="original")
    revised = build_synthetic_docx(target_size_bytes, variant="revised")
    fixture_generation_ms = (time.perf_counter() - fixture_started) * 1000

    durations_ms: list[float] = []
    last_summary: dict[str, object] | None = None

    with httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout_seconds) as client:
        for attempt in range(iterations):
            started = time.perf_counter()
            response = client.post(
                "/v1/compare",
                files={
                    "original": ("benchmark-original.docx", original, DOCX_MIME),
                    "revised": ("benchmark-revised.docx", revised, DOCX_MIME),
                },
            )
            elapsed_ms = (time.perf_counter() - started) * 1000
            response.raise_for_status()
            payload = response.json()
            durations_ms.append(elapsed_ms)
            last_summary = {
                "changes": len(payload.get("changes", [])),
                "panes": len(payload.get("panes", [])),
                "html_diff_bytes": len(payload.get("html_diff", "")),
                "redline_docx_base64_bytes": len(payload.get("redline_docx_base64", "")),
                "attempt": attempt + 1,
            }

    return {
        "base_url": base_url,
        "iterations": iterations,
        "target_size_bytes": target_size_bytes,
        "fixture_generation_ms": round(fixture_generation_ms, 2),
        "original_size_bytes": len(original),
        "revised_size_bytes": len(revised),
        "summary": last_summary or {},
        "durations_ms": [round(value, 2) for value in durations_ms],
        "min_ms": round(min(durations_ms), 2),
        "max_ms": round(max(durations_ms), 2),
        "mean_ms": round(statistics.fmean(durations_ms), 2),
        "median_ms": round(statistics.median(durations_ms), 2),
        "p95_ms": round(percentile(durations_ms, 0.95), 2),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark the /v1/compare endpoint with synthetic ~1 MB DOCX files."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Worker base URL. Defaults to http://127.0.0.1:8000.",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=7,
        help="Number of compare requests to execute. Defaults to 7.",
    )
    parser.add_argument(
        "--target-size-bytes",
        type=int,
        default=1024 * 1024,
        help="Approximate DOCX size to generate for each file. Defaults to 1048576.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=120.0,
        help="Request timeout in seconds. Defaults to 120.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write the benchmark JSON report.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = benchmark_compare(
        base_url=args.base_url,
        iterations=args.iterations,
        target_size_bytes=args.target_size_bytes,
        timeout_seconds=args.timeout_seconds,
    )

    rendered = json.dumps(report, indent=2)
    print(rendered)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
