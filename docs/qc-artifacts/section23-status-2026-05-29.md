# DocxRedline Section 23 Status

Tool: `DocxRedline`  
Section: `23.DocxRedline`  
Repo: `https://github.com/chayprabs/docx-redline-online@02a4945da7944458db3d4955525a962e4abc27b4`  
Hosted: `https://docx-redline.onrender.com` and `https://docx-redline-api.onrender.com`  
Run at: `2026-05-29T03:13:44.7225289+05:30`  
Verifier: `Codex GPT-5`

Counts:
- Total checks: `45`
- Passed: `40`
- Failed: `4`
- Blocked: `0`
- Verify-deferred: `1`

Failures:
- `23.0 Hosted input`: the candidate public URLs currently return `404 Not Found`; see `docs/qc-artifacts/hosted/render.json`.
- `23.15 Hosted URLs 200`: `pnpm verify:hosted -- --web-url https://docx-redline.onrender.com --api-url https://docx-redline-api.onrender.com --output docs/qc-artifacts/hosted/render.json` failed with `404` for `/`, `/docx-compare`, `/docx-redline`, `/docx-to-markdown`, `/docx-to-html`, `/docx-comments-extract`, `/health`, `/v1/meta`, and `/v1/samples`.
- `23.17 SEO sub-routes 200`: the same hosted verification run recorded `404 Not Found` for all five required public sub-routes.
- `23.19 Final verdict`: not all Section 23 boxes are green yet.

Verify-deferred:
- `23.3 docker compose up healthy`: local Docker Desktop is returning host-level `500 Internal Server Error` responses on the Linux engine API before any DocxRedline container starts; rerun `docker compose up --build` on a healthy Docker host.

Strong pass evidence:
- Build checks pass: `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `apps/worker` `PYTHONPATH=src pytest`.
- Performance gates pass locally: Lighthouse `95/100/100/100` on the production build path and compare p95 `5408.29 ms` on a ~1 MB sparse-edit fixture.
- Acceptance A1, A2, and A3 are codified and passing; the Word baseline artifact at `docs/baselines/contract-redline-a1.md` is `PASS`.
- Per-sample HTML and Markdown goldens are now committed under `apps/worker/tests/golden/` and enforced by `apps/worker/tests/test_conversion_goldens.py`.
- Release workflow run `26603158009` published worker and web GHCR manifests for tag `v0.0.0-qc1`.
- Local production-style hosted verification now passes via `docs/qc-artifacts/hosted/local.json`, proving the hosted verifier and route inventory are correct before public deployment.

Verdict: `NOT QUALIFIED`

Action:
- Apply the committed Render Blueprint or another equivalent hosted deployment so the public web and API URLs return `200`.
- Re-run the deferred Docker check on a healthy host and then re-run the full Section 23 audit.
