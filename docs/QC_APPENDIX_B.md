# QC Appendix B - DocxRedline

Tool: DocxRedline  
Repo: [chayprabs/docx-redline-online](https://github.com/chayprabs/docx-redline-online)  
Branch: `cursor/docx-redline-build`

## Current Evidence Snapshot

### Build and test

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
- `apps/worker`: `PYTHONPATH=src pytest` passes.
- `docker compose config` passes for both compose files after adding overridable host ports and worker health checks.
- CI now builds the web image, worker image, and validates `docker compose config` on GitHub Actions.
- CI run `26604279491` now goes further and successfully boots `docker compose up -d --build`, waits for worker health, waits for the web root, probes `GET /`, `GET /docx-compare`, `GET /v1/meta`, and `GET /v1/samples`, and tears the stack down cleanly.

### Release plumbing

- `.github/workflows/release.yml` now publishes tagged or manually triggered web and worker images to GHCR.
- README documents the expected GHCR image names for release verification.
- A root `render.yaml` Blueprint now defines a two-service Render deployment path for the Next.js web app plus FastAPI worker.
- The Render Blueprint now targets the repository default branch `main`, so it matches the intended release path rather than the temporary feature branch.
- Release workflow run `26603158009` completed successfully for tag `v0.0.0-qc1`, and its logs show pushed manifests for:
  - `ghcr.io/chayprabs/docx-redline-online-worker:v0.0.0-qc1@sha256:306ac06c931c17084c41ec99fd7a2cae2b0ac61349d63bf46c6802afb06d12d8`
  - `ghcr.io/chayprabs/docx-redline-online-web:v0.0.0-qc1@sha256:094021fabc66fd50f3a17b56c488f6b5da64d6521f38d93ccc86ac34f78496d7`

### Qualification tooling now in repo

- `pnpm verify:lighthouse -- --url <web-url> --output <json-path>` writes a Lighthouse JSON report and fails when any Section 23 category scores below 95.
- `pnpm verify:compare -- --base-url <worker-url> --iterations 7 --output <json-path>` generates synthetic ~1 MB original/revised DOCX fixtures and reports min/median/mean/p95 compare latency.
- `pnpm verify:hosted -- --web-url <web-url> --api-url <api-url> --output <json-path>` checks the public web routes plus worker `/health`, `/v1/meta`, and `/v1/samples` endpoints for Section 23.15 and 23.17.

### Current local evidence

- Local Lighthouse run against the dev server at `http://127.0.0.1:4310` produced: Performance 38, Accessibility 100, Best Practices 100, SEO 100. This was useful for diagnosis but is not release-grade evidence.
- Local Lighthouse run against the production Next server at `http://127.0.0.1:4311` produced: Performance 95, Accessibility 100, Best Practices 100, SEO 100.
- Local compare smoke benchmark against `http://127.0.0.1:8010` on a ~64 KB synthetic pair completed in 4733.49 ms for a single run after the compare-path optimization.
- Local compare benchmark against `http://127.0.0.1:8010` on a ~1 MB synthetic pair with sparse edits (`--change-interval 400`) completed in 3140.72 ms, 4383.82 ms, and 5522.12 ms across three runs, for a p95 of 5408.29 ms.
- The compare latency requirement now has local passing evidence, and Lighthouse now has local passing evidence on the production build path.
- A fresh local `docker compose up --build -d` attempt on May 29, 2026 failed before app startup because the Docker Desktop Linux engine returned host-level `500 Internal Server Error` responses on `/version`, `/info`, and image inspection routes. That is current `VERIFY-DEFERRED` evidence, not an app-stack failure.
- A fresh anonymous GHCR registry probe on May 29, 2026 returned `DENIED`, so package-public-read evidence is still unavailable from this machine without additional registry permissions.
- `pnpm verify:hosted -- --web-url http://127.0.0.1:4330 --api-url http://127.0.0.1:8030 --output docs/qc-artifacts/hosted/local.json` now passes against a local production-style stack, proving the hosted verification helper and route inventory are working before a public deploy is applied.
- `pnpm verify:hosted -- --web-url https://docx-redline.onrender.com --api-url https://docx-redline-api.onrender.com --output docs/qc-artifacts/hosted/render.json` currently fails with `404 Not Found` for every checked public web and API route, so the candidate public Render deployment has not been applied successfully yet.

### Functional slices implemented

- F1/F2: DOCX upload plumbing plus HTML, Markdown, image extraction, and list normalization.
- F3: Comments extraction with replies, timestamps, resolved state, and Markdown export.
- F4: Tracked-change inspection plus per-change and bulk accept/reject.
- F5: Content-control listing and safe text replacement.
- F6: DOCX compare with redline DOCX generation and side-by-side HTML diff.
- F7: Header/footer/footnote/endnote viewers and embedded-object extraction.

### Browser verification completed

- Sample picker successfully loads extract fixtures from the worker.
- Extract workflow runs end to end and renders result panes in the browser.
- Compare workflow runs end to end and renders redline output in the browser.
- Release screenshots captured at `docs/screenshots/home.png` and `docs/screenshots/compare.png`.
- The web app now supports same-origin worker proxying through `/api/worker`, which reduces hosted deployment friction by avoiding browser-to-worker cross-origin requirements.

### Acceptance evidence now codified

- `apps/worker/tests/test_acceptance.py::test_acceptance_a1_contract_redline_matches_structural_baseline` verifies the shipped contract sample produces structural insertions, deletions, and the added confidentiality paragraph in the generated redline.
- `apps/worker/tests/test_acceptance.py::test_acceptance_a2_conversion_preserves_formatting` verifies the shipped generic sample preserves heading, bold, italic, list items, and image extraction across HTML and Markdown conversions.
- `apps/worker/tests/test_acceptance.py::test_acceptance_a3_comments_extract_correctly` verifies the shipped manuscript comments sample preserves author, reply, resolved state, quoted text, and Markdown export content.
- `apps/worker/tests/test_conversion_goldens.py` now freezes committed HTML and Markdown golden outputs for the shipped `contract-redline`, `manuscript-comments`, and `generic-images` samples.
- `scripts/build_a1_word_report.py` now generates a Word-backed structural baseline report at `docs/baselines/contract-redline-a1.md` using local Microsoft Word automation.
- The current A1 baseline artifact is now `PASS` and matches the Word revision inventory exactly for the shipped `contract-redline` sample.

## Remaining Section 23 Gaps

- Hosted deployment evidence is not collected yet.
- Worker image push evidence is strong from the successful tagged release workflow run, but direct registry-read verification is still limited by current package visibility or token permissions.
- Final PR and release qualification verdict are not ready yet.

## Next Evidence To Collect

1. Apply the committed Render Blueprint and capture hosted deployment evidence for `https://docx-redline.onrender.com` and `https://docx-redline-api.onrender.com`, including 200 responses.
2. Supplement the successful release workflow evidence with direct package-registry visibility, or retain the workflow-log digest evidence as the final Section 23.15 proof if registry visibility remains private-by-design.
3. Create the release PR once all Section 23 boxes are backed by evidence.
