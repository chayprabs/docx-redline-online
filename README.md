# DocxRedline

DocxRedline is an open-source server-side tool to compare DOCX versions online, accept or reject tracked changes, extract comments, and convert Word documents to clean HTML or Markdown.

## Status

This repository is under active build-out toward the v1 qualification gate in `RELEASE_QUALIFICATION_CHECKLIST.md` Section 23.

## Workspace

```text
apps/web      Next.js 15 playground
apps/worker   FastAPI worker
packages/*    shared types, UI, and worker helpers
```

## Local Development

```bash
pnpm install
pnpm dev:web
```

Worker setup will be documented as the Python service stabilizes.
