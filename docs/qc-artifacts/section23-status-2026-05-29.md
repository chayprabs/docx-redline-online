# DocxRedline Section 23 Status

Tool: `DocxRedline`  
Section: `23.DocxRedline`  
Repo: `https://github.com/chayprabs/docx-redline-online@d41bb34177534cc14fa588d539c878474d7cbb62`  
Hosted: `https://docx-redline.onrender.com` and `https://docx-redline-api.onrender.com`  
Run at: `2026-05-29T03:20:00+05:30`  
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
- CI run `26604279491` passed the compose smoke path: `docker compose up -d --build`, worker health, web root readiness, `GET /`, `GET /docx-compare`, `GET /v1/meta`, and `GET /v1/samples`.
- Performance gates pass locally: Lighthouse `95/100/100/100` on the production build path and compare p95 `5408.29 ms` on a ~1 MB sparse-edit fixture.
- Acceptance A1, A2, and A3 are codified and passing; the Word baseline artifact at `docs/baselines/contract-redline-a1.md` is `PASS`.
- Per-sample HTML and Markdown goldens are now committed under `apps/worker/tests/golden/` and enforced by `apps/worker/tests/test_conversion_goldens.py`.
- Release workflow run `26603158009` published worker and web GHCR manifests for tag `v0.0.0-qc1`.
- Local production-style hosted verification now passes via `docs/qc-artifacts/hosted/local.json`, proving the hosted verifier and route inventory are correct before public deployment.

Verdict: `NOT QUALIFIED`

Action:
- Apply the committed Render Blueprint or another equivalent hosted deployment so the public web and API URLs return `200`.
- Re-run the hosted verification after deployment and then re-run the full Section 23 audit.
