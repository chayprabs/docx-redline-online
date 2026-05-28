from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"
if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

from docx_redline_worker.services.compare import compare_docx  # noqa: E402
from docx_redline_worker.services.sample_documents import get_sample_bytes  # noqa: E402


REVISION_TYPE_MAP = {
    1: "ins",
    2: "del",
}


def normalize_text(value: str) -> str:
    return " ".join(value.replace("\r", " ").replace("\n", " ").split()).strip()


def build_report() -> tuple[dict[str, object], str]:
    original_bytes, original_name = get_sample_bytes("contract-redline", "original")
    revised_bytes, revised_name = get_sample_bytes("contract-redline", "revised")
    compare_result = compare_docx(original_bytes, revised_bytes)

    baselines_dir = REPO_ROOT / "docs" / "baselines"
    baselines_dir.mkdir(parents=True, exist_ok=True)
    word_json_path = baselines_dir / "contract-redline-word-baseline.json"
    markdown_path = baselines_dir / "contract-redline-a1.md"

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        original_path = temp_root / original_name
        revised_path = temp_root / revised_name
        original_path.write_bytes(original_bytes)
        revised_path.write_bytes(revised_bytes)

        script_path = REPO_ROOT / "scripts" / "export_word_compare_baseline.ps1"
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(script_path),
                "-OriginalPath",
                str(original_path),
                "-RevisedPath",
                str(revised_path),
                "-OutputJsonPath",
                str(word_json_path),
            ],
            check=True,
        )

    word_payload = json.loads(word_json_path.read_text(encoding="utf-8-sig"))

    word_revisions = [
        {
            "kind": REVISION_TYPE_MAP.get(entry["type"], f"type:{entry['type']}"),
            "text": normalize_text(entry["text"]),
        }
        for entry in word_payload["revisions"]
    ]
    docxredline_revisions = [
        {
            "kind": change.kind,
            "text": normalize_text(change.text),
        }
        for change in compare_result.changes
        if normalize_text(change.text)
    ]

    word_counter = Counter((entry["kind"], entry["text"]) for entry in word_revisions)
    docx_counter = Counter((entry["kind"], entry["text"]) for entry in docxredline_revisions)

    report = {
        "sample": "contract-redline",
        "word_revision_count": len(word_revisions),
        "docxredline_change_count": len(docxredline_revisions),
        "word_revisions": word_revisions,
        "docxredline_changes": docxredline_revisions,
        "word_counter": {f"{kind}:{text}": count for (kind, text), count in sorted(word_counter.items())},
        "docxredline_counter": {
            f"{kind}:{text}": count for (kind, text), count in sorted(docx_counter.items())
        },
        "missing_from_docxredline": [
            {"kind": kind, "text": text, "count": count - docx_counter[(kind, text)]}
            for (kind, text), count in sorted(word_counter.items())
            if docx_counter[(kind, text)] < count
        ],
        "additional_in_docxredline": [
            {"kind": kind, "text": text, "count": count - word_counter[(kind, text)]}
            for (kind, text), count in sorted(docx_counter.items())
            if word_counter[(kind, text)] < count
        ],
    }

    status = (
        "PASS"
        if not report["missing_from_docxredline"] and not report["additional_in_docxredline"]
        else "REVIEW"
    )

    markdown = "\n".join(
        [
            "# A1 Word Structural Baseline",
            "",
            "Sample: `contract-redline`",
            "",
            f"Status: **{status}**",
            "",
            "## Word revisions",
            "",
            *[f"- `{entry['kind']}` `{entry['text']}`" for entry in word_revisions],
            "",
            "## DocxRedline changes",
            "",
            *[f"- `{entry['kind']}` `{entry['text']}`" for entry in docxredline_revisions],
            "",
            "## Missing from DocxRedline",
            "",
            *(
                [f"- `{entry['kind']}` `{entry['text']}` x{entry['count']}" for entry in report["missing_from_docxredline"]]
                or ["- None"]
            ),
            "",
            "## Additional in DocxRedline",
            "",
            *(
                [f"- `{entry['kind']}` `{entry['text']}` x{entry['count']}" for entry in report["additional_in_docxredline"]]
                or ["- None"]
            ),
        ]
    )

    markdown_path.write_text(markdown + "\n", encoding="utf-8")
    return report, markdown


def main() -> int:
    report, _ = build_report()
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
