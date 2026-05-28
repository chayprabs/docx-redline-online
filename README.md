# DocxRedline

DocxRedline is an open-source server-side tool to compare DOCX versions online, accept or reject tracked changes, extract comments, and convert Word documents to clean HTML or Markdown.

## What It Does

- Compare two DOCX files and generate a Word-style redline DOCX.
- Accept or reject tracked changes, either one by one or in bulk.
- Extract comments, replies, timestamps, and resolved state.
- Convert DOCX to clean HTML or Markdown with style-map and list-normalization options.
- Inspect and safely replace structured document tag content controls.
- View headers, footers, footnotes, endnotes, and embedded objects.

## Workspace

```text
apps/web      Next.js 15 playground
apps/worker   FastAPI worker
packages/*    shared types, UI, and worker helpers
```

## Local Development

### Prerequisites

- Node 22+
- pnpm 10+
- Python 3.12 for the target worker runtime

### Install

```bash
pnpm install
```

### Run The Web App

```bash
pnpm dev:web
```

### Run The Worker

```bash
cd apps/worker
python -m uvicorn --app-dir src docx_redline_worker.main:app --host 127.0.0.1 --port 8000
```

Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` when running the web app locally on a different port.

## Self-Host With Docker

```bash
docker compose up --build
```

That brings up:

- Web on `http://localhost:3000`
- Worker on `http://localhost:8000`

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm build
cd apps/worker && python -m pytest
```

## Qualification Tracking

- Release gate: `RELEASE_QUALIFICATION_CHECKLIST.md` Section 23
- Working QC appendix: `docs/QC_APPENDIX_B.md`
- Product requirements: `PRODUCT_REQUIREMENTS.md`
