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

### Release plumbing

- `.github/workflows/release.yml` now publishes tagged or manually triggered web and worker images to GHCR.
- README documents the expected GHCR image names for release verification.

### Qualification tooling now in repo

- `pnpm verify:lighthouse -- --url <web-url> --output <json-path>` writes a Lighthouse JSON report and fails when any Section 23 category scores below 95.
- `pnpm verify:compare -- --base-url <worker-url> --iterations 7 --output <json-path>` generates synthetic ~1 MB original/revised DOCX fixtures and reports min/median/mean/p95 compare latency.

### Current local evidence

- Local Lighthouse run against the dev server at `http://127.0.0.1:4310` produced: Performance 38, Accessibility 100, Best Practices 100, SEO 100. This was useful for diagnosis but is not release-grade evidence.
- Local Lighthouse run against the production Next server at `http://127.0.0.1:4311` produced: Performance 95, Accessibility 100, Best Practices 100, SEO 100.
- Local compare smoke benchmark against `http://127.0.0.1:8010` on a ~64 KB synthetic pair completed in 4733.49 ms for a single run after the compare-path optimization.
- Local compare benchmark against `http://127.0.0.1:8010` on a ~1 MB synthetic pair with sparse edits (`--change-interval 400`) completed in 3140.72 ms, 4383.82 ms, and 5522.12 ms across three runs, for a p95 of 5408.29 ms.
- The compare latency requirement now has local passing evidence, and Lighthouse now has local passing evidence on the production build path.

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

### Acceptance evidence now codified

- `apps/worker/tests/test_acceptance.py::test_acceptance_a1_contract_redline_matches_structural_baseline` verifies the shipped contract sample produces structural insertions, deletions, and the added confidentiality paragraph in the generated redline.
- `apps/worker/tests/test_acceptance.py::test_acceptance_a2_conversion_preserves_formatting` verifies the shipped generic sample preserves heading, bold, italic, list items, and image extraction across HTML and Markdown conversions.
- `apps/worker/tests/test_acceptance.py::test_acceptance_a3_comments_extract_correctly` verifies the shipped manuscript comments sample preserves author, reply, resolved state, quoted text, and Markdown export content.
- `scripts/build_a1_word_report.py` now generates a Word-backed structural baseline report at `docs/baselines/contract-redline-a1.md` using local Microsoft Word automation.
- The current A1 baseline artifact is now `PASS` and matches the Word revision inventory exactly for the shipped `contract-redline` sample.

## Remaining Section 23 Gaps

- Hosted deployment evidence is not collected yet.
- Docker `compose up --build` still needs a clean full-stack pass on a healthy Docker host after a Docker build transport EOF during worker-image build.
- Worker image push evidence is partially collected through the successful tagged release workflow run, but package-registry verification is still limited by current token permissions.
- Final PR and release qualification verdict are not ready yet.

## Next Evidence To Collect

1. Re-run `docker compose up --build` on a healthy host or after the Docker transport issue clears, then verify `http://localhost:<port>` and `/health`.
2. Capture hosted deployment evidence for the web app and worker API, including 200 responses and release artifact references.
3. Supplement the successful release workflow evidence with package-registry visibility or release artifact confirmation for Section 23.15.
4. Create the release PR once all Section 23 boxes are backed by evidence.
