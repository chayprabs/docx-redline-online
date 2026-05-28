# DocxRedline Section 23 Status

Tool: `DocxRedline`  
Section: `23.DocxRedline`  
Repo: `https://github.com/chayprabs/docx-redline-online@df665b8`  
Hosted: `https://docx-redline.onrender.com` and `https://docx-redline-api.onrender.com`  
Run at: `2026-05-29T04:35:00+05:30`  
Verifier: `Codex GPT-5`

Counts:
- Total checks: `45`
- Passed: `41`
- Failed: `4`
- Blocked: `0`
- Verify-deferred: `0`

Failures:
- `23.0 Hosted input`: the candidate public URLs currently return `404 Not Found`; see `docs/qc-artifacts/hosted/render.json`.
- `23.15 Hosted URLs 200`: `pnpm verify:hosted -- --web-url https://docx-redline.onrender.com --api-url https://docx-redline-api.onrender.com --output docs/qc-artifacts/hosted/render.json` failed with `404` for `/`, `/docx-compare`, `/docx-redline`, `/docx-to-markdown`, `/docx-to-html`, `/docx-comments-extract`, `/health`, `/v1/meta`, and `/v1/samples`.
- `23.17 SEO sub-routes 200`: the same hosted verification run recorded `404 Not Found` for all five required public sub-routes.
- `23.19 Final verdict`: not all Section 23 boxes are green yet.

Strong pass evidence:
- Build checks pass: `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `apps/worker` `PYTHONPATH=src pytest`.
- CI runs `26604279491` and `26604416188` passed the compose smoke path: `docker compose up -d --build`, worker health, web root readiness, `GET /`, `GET /docx-compare`, `GET /v1/meta`, and `GET /v1/samples`.
- Performance gates pass locally: Lighthouse `95/100/100/100` on the production build path and compare p95 `5408.29 ms` on a ~1 MB sparse-edit fixture.
- Acceptance A1, A2, and A3 are codified and passing; the Word baseline artifact at `docs/baselines/contract-redline-a1.md` is `PASS`.
- Per-sample HTML and Markdown goldens are now committed under `apps/worker/tests/golden/` and enforced by `apps/worker/tests/test_conversion_goldens.py`.
- Release workflow run `26604528664` published current-branch GHCR manifests:
  - `ghcr.io/chayprabs/docx-redline-online-worker:sha-ac50340@sha256:c3723d7d355e8eb1784033275d3a13179b48e6e1d4d8809ab312792af4c0d626`
  - `ghcr.io/chayprabs/docx-redline-online-web:sha-ac50340@sha256:f2ccb624f847d96772dd22052ebad0a646731ad6b72c0bdf38dd7e300f29c2e0`
- Local production-style hosted verification now passes via `docs/qc-artifacts/hosted/local.json`, proving the hosted verifier and route inventory are correct before public deployment.
- A dedicated `verify-hosted` GitHub Actions workflow now exists for future hosted checks, but it will only become dispatchable through GitHub once merged onto the default branch.
- `pnpm deploy:render:blueprint` and `docs/HOSTED_DEPLOYMENT_RUNBOOK.md` now reduce the remaining hosted step to a concrete provider-side apply plus a single hosted verification command.

Verdict: `NOT QUALIFIED`

Action:
- Apply the committed Render Blueprint or another equivalent hosted deployment so the public web and API URLs return `200`.
- Re-run the hosted verification after deployment and then re-run the full Section 23 audit.
