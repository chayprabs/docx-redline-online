# Hosted Deployment Runbook

This runbook covers the last external-state step needed to finish `RELEASE_QUALIFICATION_CHECKLIST.md` Section 23 for DocxRedline.

## Current status

- Repo-side implementation is in place.
- Local verification is in place.
- CI has already proven `docker compose up -d --build` on GitHub Actions.
- The remaining release blocker is a real public web URL and API URL returning `200`.

## What you need

- Access to a hosting provider account. The repo is prepared for Render today.
- A provider setup that can deploy the current qualification branch `cursor/docx-redline-build`.
- Permission to create or update public services.

## Render path

### 1. Open the Blueprint

From the repo root:

```bash
python scripts/render_blueprint_link.py
```

That prints the Render Blueprint URL for the current Git remote. For this repository it should resolve to:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/chayprabs/docx-redline-online
```

### 2. Apply the committed `render.yaml`

Keep the default service names from [render.yaml](../render.yaml):

- Web: `docx-redline`
- Worker API: `docx-redline-api`

The committed Blueprint currently pins both services to `cursor/docx-redline-build` so hosted Section 23 evidence can be collected before merge. After the PR is qualified and merged, retarget both services to `main` before deleting the feature branch.

That preserves the documented public endpoints:

- `https://docx-redline.onrender.com`
- `https://docx-redline-api.onrender.com`

### 3. Wait for both services to become live

The worker must answer:

- `GET /health`
- `GET /v1/meta`
- `GET /v1/samples`

The web app must answer:

- `GET /`
- `GET /docx-compare`
- `GET /docx-redline`
- `GET /docx-to-markdown`
- `GET /docx-to-html`
- `GET /docx-comments-extract`

### 4. Run hosted verification

From the repo root:

```bash
pnpm verify:hosted -- --web-url https://docx-redline.onrender.com --api-url https://docx-redline-api.onrender.com --output docs/qc-artifacts/hosted/render.json
```

Expected result:

- `all_passed: true`
- every web route returns `200`
- every worker route returns `200`

The repository also has `.github/workflows/verify-hosted.yml`, which will use these same default URLs automatically on pushes to `main` and on its nightly schedule. That gives you a second source of hosted evidence in GitHub Actions after the public deployment is live.

### 5. Refresh the Section 23 audit

Update:

- [docs/QC_APPENDIX_B.md](QC_APPENDIX_B.md)
- [docs/qc-artifacts/section23-status-2026-05-29.md](qc-artifacts/section23-status-2026-05-29.md)

Then the remaining Section 23 failures should collapse to zero if no new hosted regressions appear.

## If Render is not the final host

Section 23 only requires public hosted URLs that return `200`. Another provider is acceptable if it serves the same public web routes and worker endpoints and the hosted verification command passes against those URLs.

## Current blocker summary

The current workspace does not have provider credentials for Render or another deploy target. That is why public-hosting evidence is still missing even though repo-side release evidence is otherwise in place.
