import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

function parseArgs(argv) {
  const options = {
    url: "http://127.0.0.1:3000",
    output: "docs/qc-artifacts/lighthouse/latest.report.json",
    minScore: 0.95,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--url" && next) {
      options.url = next;
      index += 1;
      continue;
    }

    if (token === "--output" && next) {
      options.output = next;
      index += 1;
      continue;
    }

    if (token === "--min-score" && next) {
      options.minScore = Number(next);
      index += 1;
    }
  }

  return options;
}

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      resolvePromise(code ?? -1);
    });
    child.on("error", rejectPromise);
  });
}

function formatScore(score) {
  return Math.round(score * 100);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outputPath = resolve(options.output);
  await mkdir(dirname(outputPath), { recursive: true });

  const exitCode = await run("npx", [
    "--yes",
    "lighthouse",
    options.url,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox",
    "--only-categories=performance,accessibility,best-practices,seo",
    "--output=json",
    `--output-path=${outputPath}`,
  ]);

  if (exitCode !== 0) {
    console.warn(`lighthouse exited with code ${exitCode}; continuing because a report may still have been written.`);
  }

  const report = JSON.parse(await readFile(outputPath, "utf-8"));
  const categories = {
    performance: report.categories.performance.score,
    accessibility: report.categories.accessibility.score,
    "best-practices": report.categories["best-practices"].score,
    seo: report.categories.seo.score,
  };

  console.log(
    JSON.stringify(
      {
        url: options.url,
        output: outputPath,
        scores: Object.fromEntries(
          Object.entries(categories).map(([key, value]) => [key, formatScore(value)]),
        ),
      },
      null,
      2,
    ),
  );

  const failing = Object.entries(categories).filter(([, score]) => score < options.minScore);
  if (failing.length) {
    const summary = failing
      .map(([category, score]) => `${category}=${formatScore(score)}`)
      .join(", ");
    throw new Error(`Lighthouse scores below threshold ${formatScore(options.minScore)}: ${summary}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
