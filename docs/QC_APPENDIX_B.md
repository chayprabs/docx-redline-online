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

## Remaining Section 23 Gaps

- Hosted deployment evidence is not collected yet.
- Lighthouse >= 95 is not collected yet.
- p95 compare <= 6s is not measured yet.
- Acceptance fixture A1 needs stronger structural-baseline evidence against Word output.
- Final README polish, screenshots, and public repo metadata still need qualification-grade review.
- Final PR and release qualification verdict are not ready yet.

## Next Evidence To Collect

1. Capture stable product screenshots for README and QC evidence.
2. Run Lighthouse against the local or preview deployment.
3. Measure compare latency on a 1 MB fixture and record p95.
4. Formalize acceptance-fixture evidence for A1/A2/A3.
5. Create the release PR once all Section 23 boxes are backed by evidence.
